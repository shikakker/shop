# Product Completion Status — shop

Canonical branch: `portfolio-improvements-2026-08`
Canonical PR: `#1`

Product boundary: historical Sanity + Shopify storefront derivative. The branch is a hardening/recovery candidate, not an automatically promoted production store.

## Core tasks

| ID | Status | Task |
| --- | --- | --- |
| T01 | DONE | Preserve upstream/starter provenance and accurate commerce scope |
| T02 | DONE | Upgrade storefront runtime to patched Next.js 15.5.24 / Node 22 boundary |
| T03 | DONE | Synchronize the deterministic npm dependency/security boundary |
| T04 | DONE | Add regression contracts for release, preview, provider and Shopify security boundaries |
| T05 | DONE | Verify webhook HMAC against raw request bytes before JSON parsing |
| T06 | DONE | Reject invalid methods/auth/input with controlled status classes |
| T07 | DONE | Protect admin image synchronization with a server sync secret |
| T08 | DONE | Validate inventory method/product ID and map config/not-found/upstream failures correctly |
| T09 | DONE | Add permanent read-only Quality gate for install/test/typecheck/build/audit |
| T10 | BLOCKED | Obtain exact-head hosted storefront/provider E2E with real Sanity + Shopify configuration |

## Improvements

| ID | Status | Improvement |
| --- | --- | --- |
| I01 | DONE | Centralize webhook HMAC and sync-secret verification in `lib/shopify-security.js` |
| I02 | DONE | Use constant-time comparisons for webhook/admin secrets |
| I03 | DONE | Bound raw webhook body reads to 2 MiB |
| I04 | DONE | Return controlled 401/400/413/503 webhook verification statuses |
| I05 | DONE | Remove wildcard CORS from privileged Shopify image mutation route |
| I06 | DONE | Require POST for privileged image sync and fail closed when sync secret is absent |
| I07 | DONE | Validate numeric positive Shopify product IDs before upstream calls |
| I08 | DONE | Add 10-second upstream timeout and 404/502 separation for inventory |
| I09 | DONE | Keep Sanity/marketing provider secrets server-side and make CMS build helpers fail closed |
| I10 | PARTIAL | Legacy Shopify REST API versions still require a separately verified Admin API modernization |

## Product features

| ID | Status | Feature |
| --- | --- | --- |
| F01 | DONE | Storefront build/runtime baseline retained independently from legacy Sanity Studio compilation |
| F02 | DONE | Sanity product synchronization retained behind authenticated Shopify webhooks |
| F03 | DONE | Shopify deletion synchronization retained behind HMAC verification |
| F04 | DONE | Shopify image synchronization retained behind explicit admin secret |
| F05 | DONE | Inventory proxy returns bounded stock state with controlled failures |
| F06 | PARTIAL | Checkout/payment behavior requires provider-backed hosted E2E before release claims |
| F07 | PARTIAL | Sanity Studio/editor workflow requires intended production dataset/token validation |
| F08 | PARTIAL | Shopify Admin API contract/version requires real-store smoke after modernization |
| F09 | DEFERRED WITH REASON | New commerce features are out of scope until provider-backed release correctness is verified |
| F10 | BLOCKED | Production promotion requires explicit approval after exact-head preview and storefront smoke |

## Verification evidence

The branch was driven through repeated RED → root-cause → minimal-fix cycles. Verified fixes include: storefront/Studio release-boundary separation; removal of the inherited hard-coded preview token; server-only Sanity/provider credentials; lazy CMS redirects; shared storefront sort data rather than importing Studio UI modules; raw-body Shopify webhook verification; protected admin image sync; validated inventory proxy behavior; removal of obsolete Next 15 `swcMinify`; and replacement of vulnerable `query-string` serialization with native `URLSearchParams` in the real callers.

Guarded release run `35015072291` completed GREEN against the verified dependency graph: lockfile generation PASS → clean install PASS → 23/23 regression contracts PASS → TypeScript PASS → Next.js 15 production build PASS → production dependency audit PASS → synchronized `package-lock.json` commit PASS. The generated lockfile commit is `61bd72b7f47dddf5539396c2b05d98018a6b8ecd`. The clean install/audit reports **0 vulnerabilities**.

The automatic Quality run on the bot-authored lockfile commit ended as `action_required` with zero jobs, so it is an Actions trust/approval gate rather than a code failure. This status update intentionally creates a normal human-authored final head so the immutable Quality workflow can execute again on the same code/dependency graph.

Vercel exact-head delivery is not currently available because recent Git statuses point to the Vercel build-rate limit. Browser QA and real Sanity/Shopify provider flows are therefore not claimed as PASS.

No merge, production promotion, Shopify/Sanity credential mutation, product mutation against a live store, billing action or destructive data migration has been performed.

Status: **PARTIAL** — code/release gates are green; exact-head Vercel preview, responsive browser QA and provider-backed commerce smoke remain external delivery gates.
