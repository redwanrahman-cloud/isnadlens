# Hosting readiness review — 4 October 2026

No deployment or hosting purchase has occurred.

The current HadeethEnc JSON is 77,908,605 bytes; raw source workbooks total 18,465,389 bytes. A local Node microbenchmark measured about 265 MiB RSS after parsing and 354 MiB during serialization/hash. These are partial local measurements, not hosted benchmarks. Current loaders repeatedly validate full files; even homepage coverage loads the Hadith source.

Cloudflare Workers presently documents 128 MB memory, 10 ms Free CPU, 64 MiB uncompressed Worker bundles and 25 MiB per asset. The current loader exceeds the memory/file limits and cannot be directly deployed there. Vinext remains beta. See [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [Next.js compatibility](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/).

Vercel Node is a technically more plausible fallback, subject to account quotas and confirmation of [Hobby personal/non-commercial eligibility](https://vercel.com/docs/plans/hobby). Its documented memory/bundle limits are more compatible with this corpus; see [Function limitations](https://vercel.com/docs/functions/limitations). Runtime source data totals 101,546,245 bytes before application files. Actual final packaged size still needs measurement and explicit runtime file tracing; Git-ignored source data must be reproduced or privately supplied during build.

The local filesystem API-spend ledger cannot be used as a shared serverless spending control. Vercel persistent filesystem writes are unavailable; temporary scratch storage is not durable. See [Runtimes](https://vercel.com/docs/functions/runtimes). Instance-local request windows likewise do not constrain replicas or establish trusted client-IP identity.

Recommended preparation:

1. Validate and retain immutable corpora once per process; serve compact pinned coverage metadata without reparsing the entire Hadith corpus.
2. Remove repeated full-corpus hashing per retrieved Quran item while preserving authenticated initialization and exact per-quotation checks.
3. Measure cold/warm runtime, complete function bundle and memory on the chosen host.
4. Use a shared atomic reservation/rate-limit service. One authenticated SQLite Durable Object is a candidate; it can reserve conservative costs transactionally and retain uncertain usage. [Availability](https://developers.cloudflare.com/durable-objects/platform/pricing/), [transactions](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/).
5. Keep hosted provider calls disabled until concurrent-instance budget tests, restart persistence, spoofed-header checks and fail-closed behavior pass.

No free-plan eligibility, account access or deployed performance is claimed by this review.

Local preparation update: Hadith loader now retains a recursively frozen corpus after the initial complete cryptographic/source validation. Warm loads compare size, nanosecond modification/change times, inode and device for all eight source paths. Missing or changed files clear the cache and require full validation again; pre/post metadata detects changes during initialization. This assumes a trusted local filesystem or immutable deployment image. Metadata comparison is an invalidation signal, not a new cryptographic proof against an attacker controlling files and metadata. Local measurement: approximately 875 ms cold and 0.34 ms warm; cloud performance remains unmeasured.

Production tracing verified 4 October: private artifacts and environment files excluded across server traces; required corpus files remain included. This packaging check does not replace shared hosted spending controls.

Nine-language expansion: joined Hadith JSON is 100,266,945 bytes. Seven QuranEnc display editions add about 17.4 MB of JSON and their pinned SQLite originals. Final passage route trace is about 166 MB; private records, secrets and unadmitted research downloads are excluded. Measure actual deployment bundle/runtime memory before activation; the earlier six-language memory figures are historical.
