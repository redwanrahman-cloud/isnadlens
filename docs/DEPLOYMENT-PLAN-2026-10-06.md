# IsnadLens deployment — 6 October 2026

## Current status

**6 October activation update:** the user subsequently approved enabling live services under the existing 60 SAR development cap. OpenAI and unpaid-project Google media are now enabled. The current live image is `isnadlens:20261006-content-review`; see [the final website review](FINAL-WEBSITE-REVIEW-2026-10-06.md) for the documentation update and qualification. Earlier interface and icon releases are recorded below. Four hosted verification smoke cases produced three supported answers and one safe abstention; the tawaf retrieval miss was repaired and its single targeted retest passed. Read-aloud/transcription passed with a synthetic fixture. Qibla UI was removed at the user's request. Current commitment: 56.7618646875 SAR; judging reserve untouched. Arabic and English are the webinar focus. See [the complete smoke/repair record](HOSTED-SMOKE-AND-TAWAF-REPAIR-2026-10-06.md).

## Favicon follow-up

Added an emerald, gold, and ivory small-size adaptation of the existing geometric BrandMark: scalable `src/app/icon.svg`, a 16/32/48-pixel `favicon.ico`, and a 180-pixel opaque Apple home-screen icon. `scripts/generate-app-icons.mjs` reproduces the raster assets from the SVG. Next's file-based metadata supplies the icon links on every page; no inference or verification behavior changed.

The Linux production build passed. All three public icon routes returned HTTP 200 with the expected image content types; the homepage declares SVG, ICO and Apple icon links. ICO entries were decoded and inspected at their actual sizes. Public readiness remained ready/admitted/enabled. No paid model tests were run.

Live image: `isnadlens:20261006-favicon`, image ID `sha256:272fc939344bddcaf4049407d7655fe69b949000042cd113b47cc446d789b566`. The previous language-grid release is retained for rollback.
## Language menu follow-up

The shared workspace header now uses a compact round badge and a two-letter language code. Its dropdown presents all nine languages in a three-by-three badge/code grid, with native names retained in accessible labels and tooltips. Arabic and English remain first. The menu supports arrow-key navigation, Home/End, Escape with focus restoration, and dismissal when focus or a pointer moves outside. Existing language persistence and verification behavior are unchanged.

Local checks covered Arabic/English, Bengali selection and persistence, French, keyboard selection, Escape, outside-click dismissal, and the shared verification/companion/tools headers. A 390-pixel browser viewport confirmed the Arabic popup stays inside the page without horizontal overflow; this is browser emulation, not a physical-phone test. TypeScript and the Linux production build passed. No new verification, speech, or image model tests were run for this interface change. The language-menu release image is `isnadlens:20261006-language-grid` (`sha256:fd818af4ddff350cecd2418d261cf058c0b202da69bbf5bb9efbd02a971f5130`). Origin and public HTTPS readiness returned ready/admitted/enabled after activation. The earlier native-select build was not activated; the prior tawaf-fix release is retained for rollback.

## Initial deployment status (before live activation)

The application is deployed at https://isnadlens.alfarrajpolyclinic.com on the approved AWS Lightsail Ubuntu 24.04 instance in Mumbai (4 GB RAM, 2 vCPU, 80 GB SSD, $24/month). Public HTTPS and offline hosted qualification passed. **OpenAI inference and Google media calls remain disabled.** This is a hosted preview, not a completed real-provider acceptance test.

The release starts from `d47cae34cc6d076862777d32db45e5e4129bee5a`, with the deployment files and accounting guards committed in this increment. No verification prompts, models, evidence rules or source pins changed. The existing round-7 result remains 29/30; no new live benchmark was run.

## Architecture and security

- Cloudflare proxied A record for only `isnadlens` points to AWS static IPv4 `15.252.141.120`. The clinic apex, `www` and `oauth` records remain unchanged.
- Enabled Cloudflare Page Rule `isnadlens.alfarrajpolyclinic.com/*` sets SSL to Strict. Zone-wide Full SSL remains unchanged. The user explicitly approved the subdomain, public HTTPS and this narrowly scoped rule.
- Nginx terminates HTTPS using a Let's Encrypt certificate expiring 4 January 2027. Certbot's renewal timer is active; its deploy hook validates and reloads Nginx.
- HTTP redirects to HTTPS, except the ACME challenge directory. The app origin accepts Cloudflare peers and localhost. Direct external origin requests returned 403, including requests spoofing `CF-Connecting-IP` and `X-Real-IP`.
- The container port is bound only to `127.0.0.1:3100`. Nginx overwrites forwarding headers after resolving the trusted Cloudflare client address. Request, connection, body-size and timeout controls are in `deploy/nginx.conf.template`.
- AWS firewall allows public HTTP/HTTPS. SSH is limited to the operator's current IPv4 and the AWS browser SSH service. Host identity is pinned for direct SSH.
- One container/one application process uses persistent `/srv/isnadlens/private` accounting. No autoscaling. Memory limit 2800 MB, CPU limit 1.75 cores, PID limit 256, rotating Docker logs. The host currently has no swap; the Docker swap allowance does not create swap space.
- Secrets are runtime-only in `/srv/isnadlens/runtime.env`, mode 600. The non-root container mounts private state at `/app-private`. No secrets or private ledgers are in the image or Git.

## Release and restore

Built on Linux using the Node 24 image pinned in `Dockerfile`, `npm ci`, Linux Sharp, Chromium and Noto fonts. The initial build exposed nine missing public evaluation JSON imports; these were added before the successful build. Source admission/checksum validation passed for all 27 runtime files (163,542,719 bytes).

Qualified image: `isnadlens:20261006-deploy`

Image ID: `sha256:41beb648175bde692d55d0f27a559b95148820ed6421d1311146f7f71486cb1b`

Server release directory: `/srv/isnadlens/releases/20261006`.

The initial archive SHA-256 was `08a019da70096af7190af65aa512079871d5b88d4cd3ad1fd82333007ba3a9f4`. Pinned Docker/Nginx overrides and a public-evaluation dependency delta were applied afterward. That initial archive alone does **not** reproduce the final image. Use the committed final deployment files and checksummed source bundle.

To prepare a release from a clean checkout:

1. Restore the 27 exact runtime source files from the retained operator bundle into their paths listed in `artifacts/deployment-audit-2026-10-06.json`. These files are Git-ignored; a GitHub ZIP alone is incomplete. An authorized reviewer bundle delivery is still required before claiming clean-checkout reproducibility. Do not refresh publisher data or regenerate pins silently.
2. Run `node deploy/check-source-bundle.mjs`. Package with `python deploy/package-release.py /outside/repository/release.tar.gz`; this includes the nine imported public evaluation reports and excludes secrets, private state and build output.
3. Extract into a fresh server release directory and run `docker build -t isnadlens:RELEASE .`. Keep the image ID for that qualified release; Debian system-package resolution may change on a later rebuild even though Node is pinned.
4. Provision protected runtime variables and **existing** accounting before startup. Never initialize a fresh hosted allowance from the same development allocation.
5. Run `bash deploy/run-container.sh isnadlens:RELEASE`. It retains the previous container under a timestamped name. Install the Nginx template with the approved hostname and Cloudflare peer list, validate configuration, then reload. For rollback, stop/rename the failed new container and start the retained previous one; preserve the mounted accounting files.

There is no older hosted application release before this first deployment. Retain the current image before future changes. The transferred corpus archive is a recovery source, not a managed off-server backup.

## Qualification evidence

- Full offline suite: **537 tests passed in 50 files**; TypeScript passed before deployment. Added missing-ledger/quota fail-closed regression coverage.
- Linux production build passed, followed by a healthy container and readiness response: admitted sources, inference disabled.
- Public HTTPS returned 200 for home, pilgrimage, tools, sources, method, evaluation and latest evaluation pages. HTTP returned 301 to HTTPS.
- Coverage and all three media availability routes returned expected responses. Media availability was false as configured. Invalid image format and invalid receipt returned 400.
- Public multilingual PDF generation passed in 2.62 seconds (56,526 bytes, one A4 page). Visual inspection confirmed Arabic joining and Bengali, Hindi, Urdu, French and German rendering without missing glyphs or clipping. This was an explicitly labelled test fixture, not a religious assessment.
- Hosted browser checks passed for Arabic, English and Bengali interface switching, matching claim-input language, attachment menu (choose image/take photo), and collapsible navigation. This does not establish all-nine-language linguistic quality or physical phone behavior.
- Restart restored a healthy app. SHA-256 comparisons showed both the spend ledger and Google quota file unchanged. Container startup refuses missing expected accounting instead of creating new allowance.
- Observed memory: about 547 MiB after initial readiness; about 275 MiB in a later idle sample. These are samples, not a concurrent inference/PDF load benchmark. About 69 GB host disk space remained after build.
- No paid model calls, new Google media calls, new evaluation scores or API spend were introduced by this deployment.

Machine-readable HTTP results are in `artifacts/hosted-qualification-2026-10-06.json`. Browser/PDF proof is retained in the operator workspace outputs.

## Remaining gates before judging (updated after activation)

1. Hosted live-test activation is complete against the preserved ledger. Keep local paid tests disabled; local and hosted processes do not share accounting. The separately reserved judging allowance has not been activated.
2. Qualify real verification/translation latency through Cloudflare, including a long request; Nginx's 240-second read timeout does not override Cloudflare's separate proxy limits. The previous 63.7-second case is useful historical evidence, not hosted acceptance.
3. Test actual human microphone/camera/phone playback and unpaid Google-project availability. Image/transcription/uncached speech share the app's two-per-minute and sixty-per-day quota.
4. Add/qualify a bounded retention policy for generated WAV cache before extended public traffic; current cache has no eviction. The hosted media switch is now enabled; retention still needs to be bounded before extended public traffic.
5. Prayer provider lookup and countdown passed. Physical-device location remains untested. Qibla has been removed from the released tools UI.
6. Complete reviewer corpus delivery, public-repository decision, presentation/video, and official submission receipt. Deployment does not itself satisfy these competition deliverables.

The earlier hosting comparison and 4 October estimates are historical. This approved Lightsail deployment supersedes recommendations for Railway, Render, Workers-only hosting and the temporary sslip.io hostname.
