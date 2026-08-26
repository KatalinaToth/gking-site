# GaryAI external endpoints

Verified live on 2026-08-26 (browser DevTools network capture on
gking.harvard.edu plus `curl` probes). This closes the cursor-history
uncertainty about which hosts the chat, feedback, and pixel traffic use:
**they are three different AWS front doors**, all owned by the GaryAI
backend deployment.

| Endpoint | Purpose | Host type | Where in code | Live? |
|---|---|---|---|---|
| `https://d325iygsd5krw9.cloudfront.net/api/chat` | Chat completions (POST; streaming answer with citations) | CloudFront → EC2 | `layouts/baseof.html` `data-api-url`; `layouts/chatbot/single.html` `API_URL` | ✅ 200 on POST (answer rendered); HEAD returns 405 as expected |
| `https://4jk1rwjz4a.execute-api.us-east-2.amazonaws.com/feedback` | Thumbs up/down, comments, session ratings (POST) | API Gateway (Lambda) | `layouts/baseof.html` `data-feedback-url`; `layouts/chatbot/single.html` `FEEDBACK_URL` | ✅ 200 on POST (thumbs-up test); OPTIONS preflight 204 |
| `https://ueczzuogsj2hnfdr7gwfwuh5sa0oozkm.lambda-url.us-east-2.on.aws/` | Page-view pixel + `gk-track.js` analytics beacons | Lambda function URL | Hardcoded `PIXEL_URL` in `_site/static/js/gking-chat-widget.js` and `layouts/chatbot/single.html`; passed to `GKTrack.init` | ✅ 200 `image/gif` |

Notes:

- The widget (`gking-chat-widget.js`) reads the chat and feedback URLs
  from `data-*` attributes on its `<script>` tag in `baseof.html`, but
  the **pixel URL is hardcoded in the widget itself** — retargeting the
  pixel means editing the JS, not the script tag.
- `gk-track.js` has no endpoint of its own; the widget initializes it
  with `PIXEL_URL`. If `gk-track.js` is blocked, a raw `<img>` beacon to
  the same pixel URL is the fallback (`?t=widget&u=…`).
- The `https://your-api.example.com/chat` / `https://your-host/…` strings
  in the widget header are documentation placeholders, not live hosts.
- Google Analytics (`G-NDZT9P326S`, via
  `layouts/_partials/hooks/head-start/google-analytics.html`) and
  `https://www.google.com/s2/favicons` (citation favicons in the widget)
  are the only other external calls; both fired normally.
- Don't retarget any of these three hosts without a matching AWS change
  (see CLAUDE.md "Don't casually touch").
