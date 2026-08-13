/**
 * gk-steps.js — the step thread's state machine, shared by all three chat UIs.
 *
 * The backend streams `step` / `step_done` events, one per tool call, so a long
 * turn reads as a growing list of plain-English lines instead of a silent wait.
 * This module owns the parts that must behave identically everywhere: when a
 * thread becomes visible, when it folds, and what the summary line says.
 * Rendering stays with each surface, because a React tree, an HTML string and
 * a shadow-root string are genuinely different jobs.
 *
 * CANONICAL COPY. Mirrored byte-for-byte to gking-avatar-v3/public/gk-steps.js,
 * the same way gk-track.js is. `node scripts/check_shared_parity.mjs` in that
 * repo fails the build if the two drift.
 *
 * ES5 only — the widget ships this to third-party pages with no build step.
 */
(function (root) {
  "use strict";

  // How long a lone step must stay open before it is worth painting. Below
  // this a fast tool call would flash a line and immediately fold it, which
  // reads as a glitch rather than as information. A second step arriving is
  // independent proof the turn is slow, so it opens the thread immediately.
  var REVEAL_DELAY_MS = 400;

  function createThread(options) {
    var opts = options || {};
    // Called when the reveal timer fires, for surfaces that repaint on change
    // rather than continuously. The widget repaints every frame anyway and can
    // pass nothing.
    var onReveal = typeof opts.onReveal === "function" ? opts.onReveal : null;

    var steps = [];
    var byId = {};
    var startedAt = 0;
    var revealed = false;
    var revealTimer = null;
    var finished = false;
    var workedMs = null;

    function clearTimer() {
      if (revealTimer) {
        clearTimeout(revealTimer);
        revealTimer = null;
      }
    }

    function reveal() {
      if (revealed) return;
      revealed = true;
      clearTimer();
      if (onReveal) onReveal();
    }

    return {
      /** New turn. Drops everything, including any pending reveal. */
      reset: function () {
        clearTimer();
        steps = [];
        byId = {};
        startedAt = 0;
        revealed = false;
        finished = false;
        workedMs = null;
      },

      addStep: function (id, label) {
        if (!id || byId[id]) return;
        if (!startedAt) startedAt = new Date().getTime();
        var step = { id: id, label: String(label || ""), done: false };
        byId[id] = step;
        steps.push(step);
        // Two steps means the turn is demonstrably slow — no need to wait out
        // the timer.
        if (steps.length > 1) reveal();
        else if (!revealTimer) revealTimer = setTimeout(reveal, REVEAL_DELAY_MS);
      },

      completeStep: function (id) {
        var step = byId[id];
        if (step) step.done = true;
      },

      /**
       * Turn finished cleanly. `ms` and `count` come from the server's `done`
       * event so the summary reports what the server actually spent; both are
       * absent on an older backend, hence the client-measured fallback.
       */
      finish: function (ms, count) {
        clearTimer();
        finished = true;
        workedMs = typeof ms === "number" && ms >= 0
          ? ms
          : (startedAt ? new Date().getTime() - startedAt : 0);
        if (typeof count === "number" && count > steps.length) {
          // The server counted steps this client never saw — a mid-turn
          // reconnect, or events dropped before the reader attached. Trust the
          // server's count for the summary rather than under-reporting.
          this.serverStepCount = count;
        }
        for (var i = 0; i < steps.length; i++) steps[i].done = true;
      },

      /**
       * Abort, network error, or a stream that ended without `done`. Without
       * this a step stays open and its dot breathes forever — the one failure
       * of this feature a user can actually see.
       */
      seal: function () {
        clearTimer();
        finished = true;
        if (workedMs === null) workedMs = startedAt ? new Date().getTime() - startedAt : 0;
        for (var i = 0; i < steps.length; i++) steps[i].done = true;
      },

      serverStepCount: 0,
      steps: function () { return steps; },
      count: function () { return Math.max(steps.length, this.serverStepCount || 0); },
      isEmpty: function () { return steps.length === 0; },
      isFinished: function () { return finished; },

      /** Whether the thread has earned its place on screen yet. */
      isVisible: function () {
        if (steps.length === 0) return false;
        if (revealed) return true;
        // Surfaces that repaint continuously never wait for the timer callback,
        // so evaluate the gate here too.
        if (steps.length > 1) return true;
        return startedAt > 0 && new Date().getTime() - startedAt >= REVEAL_DELAY_MS;
      },

      /** The live step is the first one still running — that's the line whose
       *  dot breathes. Null once everything has retired. */
      liveStep: function () {
        for (var i = 0; i < steps.length; i++) if (!steps[i].done) return steps[i];
        return null;
      },

      /** "Worked for 6 seconds · 3 steps", or null while the turn is live. */
      summary: function () {
        if (!finished || steps.length === 0) return null;
        var seconds = Math.round((workedMs || 0) / 1000);
        var n = this.count();
        var time = seconds < 1
          ? "Worked for under a second"
          : "Worked for " + seconds + " second" + (seconds === 1 ? "" : "s");
        return time + " · " + n + " step" + (n === 1 ? "" : "s");
      }
    };
  }

  root.GKSteps = { create: createThread, REVEAL_DELAY_MS: REVEAL_DELAY_MS };

  // Lets Node import this for tests without a browser.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.GKSteps;
  }
})(typeof window !== "undefined" ? window : globalThis);
