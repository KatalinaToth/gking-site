/*!
 * gk-track.js — client event tracker for the Gary King AI avatar.
 *
 * CANONICAL SOURCE: gking-avatar-v3/public/gk-track.js
 * Mirrors (keep in sync via scripts/sync_tracker.sh):
 *   - gking-site/_site/static/js/gk-track.js   (served at /js/gk-track.js)
 *   - inlined into gking-chat-widget.js        (widget must be self-contained)
 *
 * ── Privacy posture: "Track A" ────────────────────────────────────────────
 * This file writes NOTHING to cookies, localStorage or sessionStorage, and
 * reads nothing from them. There is no client-side visitor or session ID.
 * Identity is derived server-side from a rotating salt (see lambda-pixel), and
 * sessions are reconstructed downstream from a 30-minute inactivity gap.
 *
 * That is deliberate: with no device storage there is no ePrivacy Art. 5(3)
 * consent gate, so this can ship without a banner. If you ever add a durable
 * ID here, it needs consent first.
 *
 * UTM parameters are held in a module-local variable for the life of the page
 * — in memory, not in storage — for the same reason.
 *
 * Everything is wrapped so a tracker failure can never break the chat UI.
 */
(function (global) {
  "use strict";

  var SCHEMA_SURFACES = { fullpage: 1, embed: 1, widget: 1, gary: 1, chat: 1 };

  var cfg = {
    endpoint: "",
    surface: "fullpage",
    enabled: false,
    batchSize: 8,
    flushMs: 3000,
  };

  var queue = [];
  var flushTimer = null;
  var utm = {};
  var pageRef = "";
  var conversationId = null;
  var startedAt = Date.now();
  var counts = { sent: 0, answers: 0 };
  var firedOnce = {};

  function safe(fn) {
    return function () {
      try { return fn.apply(null, arguments); } catch (e) { /* never break the host page */ }
    };
  }

  function captureUtm() {
    var out = {};
    try {
      var p = new URLSearchParams(global.location.search);
      var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
      for (var i = 0; i < keys.length; i++) {
        var v = p.get(keys[i]);
        if (v) out[keys[i]] = String(v).slice(0, 200);
      }
      // The site has long used a bare ?uid= tag on shared links; treat it as a
      // campaign name so those links stop being invisible.
      var uid = p.get("uid");
      if (uid && !out.utm_campaign) {
        out.utm_campaign = String(uid).slice(0, 200);
        if (!out.utm_source) out.utm_source = "uid-link";
      }
    } catch (e) {}
    return out;
  }

  function pageId() {
    try { return global.location.host + global.location.pathname; } catch (e) { return ""; }
  }

  function viewport() {
    try {
      return {
        vw: global.innerWidth || (document.documentElement || {}).clientWidth || null,
        vh: global.innerHeight || (document.documentElement || {}).clientHeight || null,
      };
    } catch (e) { return { vw: null, vh: null }; }
  }

  function envelope(name, props) {
    var vp = viewport();
    return {
      event: name,
      surface: cfg.surface,
      conversation_id: conversationId || null,
      page: pageId(),
      referrer: pageRef,
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      utm_content: utm.utm_content || null,
      utm_term: utm.utm_term || null,
      viewport_w: vp.vw,
      viewport_h: vp.vh,
      props: props || {},
    };
  }

  /** POST via sendBeacon when we can (survives page unload); otherwise fall
   *  back to a GET image beacon, one per event. */
  function send(batch, useBeacon) {
    if (!cfg.enabled || !batch.length) return;
    var payload = JSON.stringify({ surface: cfg.surface, events: batch });

    if (useBeacon && global.navigator && global.navigator.sendBeacon) {
      try {
        // text/plain keeps it a CORS "simple request" — no preflight, which
        // matters because a preflight never completes during unload.
        var blob = new Blob([payload], { type: "text/plain;charset=UTF-8" });
        if (global.navigator.sendBeacon(cfg.endpoint, blob)) return;
      } catch (e) {}
    }

    if (global.fetch) {
      try {
        global.fetch(cfg.endpoint, {
          method: "POST",
          body: payload,
          keepalive: true,
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
        });
        return;
      } catch (e) {}
    }

    for (var i = 0; i < batch.length; i++) imageBeacon(batch[i]);
  }

  /** Last-resort transport: querystring GET. Kept lossy-but-alive for very old
   *  browsers and for hosts where POST is blocked. */
  function imageBeacon(ev) {
    try {
      var q = "?e=" + encodeURIComponent(ev.event) +
        "&t=" + encodeURIComponent(cfg.surface) +
        "&u=" + encodeURIComponent(ev.page || "") +
        "&r=" + encodeURIComponent(ev.referrer || "") +
        "&c=" + encodeURIComponent(ev.conversation_id || "") +
        "&vw=" + encodeURIComponent(ev.viewport_w || "") +
        "&vh=" + encodeURIComponent(ev.viewport_h || "");
      var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
      for (var i = 0; i < keys.length; i++) {
        if (ev[keys[i]]) q += "&" + keys[i] + "=" + encodeURIComponent(ev[keys[i]]);
      }
      var props = ev.props || {};
      for (var k in props) {
        if (Object.prototype.hasOwnProperty.call(props, k) && props[k] != null) {
          q += "&p_" + encodeURIComponent(k) + "=" + encodeURIComponent(String(props[k]).slice(0, 300));
        }
      }
      new Image().src = cfg.endpoint + q + "&_=" + Date.now();
    } catch (e) {}
  }

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = global.setTimeout(function () {
      flushTimer = null;
      flush(false);
    }, cfg.flushMs);
  }

  function flush(useBeacon) {
    if (flushTimer) { global.clearTimeout(flushTimer); flushTimer = null; }
    if (!queue.length) return;
    var batch = queue;
    queue = [];
    send(batch, useBeacon !== false);
  }

  function track(name, props, opts) {
    if (!cfg.enabled) return;
    queue.push(envelope(name, props));
    if ((opts && opts.immediate) || queue.length >= cfg.batchSize) flush(false);
    else scheduleFlush();
  }

  /** For events that must fire at most once per page or per conversation. */
  function trackOnce(key, name, props) {
    if (firedOnce[key]) return;
    firedOnce[key] = true;
    track(name, props);
  }

  function init(options) {
    options = options || {};
    if (!options.endpoint) return api;
    cfg.endpoint = options.endpoint;
    cfg.surface = SCHEMA_SURFACES[options.surface] ? options.surface : "fullpage";
    if (options.batchSize) cfg.batchSize = options.batchSize;
    if (options.flushMs) cfg.flushMs = options.flushMs;
    cfg.enabled = true;

    utm = captureUtm();
    try { pageRef = (document.referrer || "").slice(0, 500); } catch (e) { pageRef = ""; }
    startedAt = Date.now();

    // Flush on the way out. pagehide is the reliable one on iOS Safari, where
    // unload/beforeunload frequently never fire.
    var leaving = function () {
      if (counts.sent > 0 || counts.answers > 0) {
        queue.push(envelope("session_end", {
          messages_sent: counts.sent,
          answers_received: counts.answers,
          duration_ms: Date.now() - startedAt,
        }));
      }
      flush(true);
    };
    try {
      global.addEventListener("pagehide", leaving);
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") flush(true);
      });
    } catch (e) {}

    return api;
  }

  var api = {
    init: safe(init),
    track: safe(track),
    trackOnce: safe(trackOnce),
    flush: safe(function () { flush(true); }),

    setConversationId: safe(function (id) {
      if (id && id !== conversationId) {
        conversationId = id;
        // "first keystroke" and friends are per-conversation, not per-page.
        firedOnce = {};
      }
    }),

    /**
     * Attribution + device fields to send alongside a chat turn, so the
     * server-side turn log carries the same campaign and viewport data as the
     * beacon events and the two can be analysed together.
     */
    clientContext: function () {
      try {
        var vp = viewport();
        return {
          page: pageId(),
          referrer: pageRef,
          utm_source: utm.utm_source || null,
          utm_medium: utm.utm_medium || null,
          utm_campaign: utm.utm_campaign || null,
          utm_content: utm.utm_content || null,
          utm_term: utm.utm_term || null,
          viewport_w: vp.vw,
          viewport_h: vp.vh
        };
      } catch (e) { return {}; }
    },

    /** Bookkeeping the session_end summary needs. */
    noteMessageSent: safe(function () { counts.sent++; }),
    noteAnswerReceived: safe(function () { counts.answers++; }),

    /**
     * Attach the standard input-funnel listeners to a chat composer.
     * Emits chat_focus, first_keystroke and message_abandoned — the three
     * events that separate "never considered it" from "tried and gave up".
     */
    bindComposer: safe(function (el) {
      if (!el) return;
      el.addEventListener("focus", function () {
        api.trackOnce("focus", "chat_focus", {});
      });
      el.addEventListener("input", function () {
        if (el.value && el.value.length) api.trackOnce("keystroke", "first_keystroke", {});
      });
      // Typed but never sent: report on the way out, with length only — never
      // the text itself, which would be an unreviewed PII channel.
      //
      // Both paths go through trackOnce on the same key so a user who walks
      // away and then closes the tab is counted once, not twice. The pagehide
      // path flushes itself: init's own pagehide listener was registered
      // first, so its flush has already run by the time this fires, and an
      // event merely queued here would never be sent.
      var reportAbandon = function (chars, andFlush) {
        if (chars <= 0) return;
        api.trackOnce("abandon", "message_abandoned", { chars: chars });
        if (andFlush) flush(true);
      };
      try {
        global.addEventListener("pagehide", function () {
          reportAbandon((el.value || "").trim().length, true);
        });
      } catch (e) {}
      el.addEventListener("blur", function () {
        // Blur fires constantly; only report a genuine walk-away, i.e. text
        // still sitting there 30s later.
        var snapshot = (el.value || "").trim();
        if (!snapshot) return;
        global.setTimeout(function () {
          if ((el.value || "").trim() === snapshot && document.activeElement !== el) {
            reportAbandon(snapshot.length, false);
          }
        }, 30000);
      });
    }),

    /**
     * Measure how long an answer was actually on screen and how far through it
     * the reader got — the missing denominator for the citation click rate.
     */
    trackAnswerDwell: safe(function (el, meta) {
      if (!el || !global.IntersectionObserver) return;
      var shownAt = null;
      var total = 0;
      var maxScroll = 0;
      var measure = function () {
        try {
          var r = el.getBoundingClientRect();
          var vh = global.innerHeight || 0;
          var visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
          var pct = r.height > 0 ? Math.max(0, Math.min(1, visible / r.height)) : 0;
          if (pct > maxScroll) maxScroll = pct;
        } catch (e) {}
      };
      var io = new global.IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            if (shownAt == null) shownAt = Date.now();
          } else if (shownAt != null) {
            total += Date.now() - shownAt;
            shownAt = null;
          }
        }
        measure();
      }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
      io.observe(el);
      global.addEventListener("scroll", measure, { passive: true });

      // Same ordering caveat as message_abandoned: init's pagehide flush has
      // already run by the time this fires, so it must flush itself.
      var report = function (andFlush) {
        if (shownAt != null) { total += Date.now() - shownAt; shownAt = null; }
        if (total < 500) return; // ignore flickers
        api.track("answer_dwell", {
          dwell_ms: total,
          scroll_depth: Math.round(maxScroll * 100),
          message_id: (meta && meta.messageId) || null,
        });
        total = 0;
        if (andFlush) flush(true);
      };
      try {
        global.addEventListener("pagehide", function () { report(true); });
      } catch (e) {}
      return report;
    }),

    /**
     * One delegated handler for every link inside an answer. Records the
     * link's rank within its message so click-through can be modelled by
     * position, not just counted.
     */
    bindAnswerLinks: safe(function (container) {
      if (!container) return;
      var handler = function (ev) {
        if (ev.type === "auxclick" && ev.button !== 1) return;
        var a = ev.target && ev.target.closest ? ev.target.closest("a") : null;
        if (!a) return;
        var href = a.href || "";
        if (!/^https?:/i.test(href)) return;
        var kind = a.getAttribute("data-ct") || "inline";
        if (a.classList) {
          if (a.classList.contains("gk-preview-card") || a.classList.contains("preview-card")) kind = "preview";
          else if (a.closest && (a.closest(".gk-figure") || a.closest(".figure"))) kind = "figure";
        }
        var rank = null;
        try {
          var msg = a.closest("[data-gk-message]") || a.closest(".gk-msg") || container;
          var links = msg.querySelectorAll("a[href^='http']");
          for (var i = 0; i < links.length; i++) { if (links[i] === a) { rank = i + 1; break; } }
        } catch (e) {}
        api.track("citation_click", { url: href.slice(0, 1000), kind: kind, rank: rank }, { immediate: true });
      };
      container.addEventListener("click", handler);
      container.addEventListener("auxclick", handler);
    }),
  };

  global.GKTrack = api;
})(typeof window !== "undefined" ? window : this);
