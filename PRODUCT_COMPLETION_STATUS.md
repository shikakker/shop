# Product Completion Status — shop

Canonical branch: `portfolio-improvements-2026-08`

Product boundary: historical Sanity + Shopify storefront derivative. The branch is a hardening/recovery candidate, not an automatically promoted production store.

## Core tasks

| ID | Status | Task |
| --- | --- | --- |
| T01 | DONE | Preserve upstream/starter provenance and accurate commerce scope |
| T02 | DONE | Upgrade storefront runtime to patched Next.js 15.5.24 / Node 22 boundary |
| T03 | DONE | Synchronize the dependency/security boundary and PostCSS override |
| T04 | DONE | Add regression contracts for Shopify webhook/admin/inventory security |
| T05 | DONE | Verify webhook HMAC against raw request bytes before JSON parsing |
| T06 | DONE | Reject non-POST webhook deliveries with 405 |
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
| I09 | DONE | Await Shopify metafield writes instead of fire-and-forget mutation calls |
| I10 | PARTIAL | Legacy Shopify REST API versions still require a separately verified Admin API modernization |

## Product features

| ID | Status | Feature |
| --- | --- | --- |
| F01 | DONE | Storefront build/runtime baseline retained |
| F02 | DONE | Sanity product synchronization retained behind authenticated Shopify webhooks |
| F03 | DONE | Shopify deletion synchronization retained behind HMAC verification |
| F04 | DONE | Shopify image synchronization retained behind explicit admin secret |
| F05 | DONE | Inventory proxy returns bounded stock state with controlled failures |
| F06 | PARTIAL | Checkout/payment behavior requires provider-backed hosted E2E before release claims |
| F07 | PARTIAL | Sanity Studio/editor workflow requires intended production dataset/token validation |
| F08 | PARTIAL | Shopify Admin API contract/version requires real-store smoke after modernization |
| F09 | DEFERRED WITH REASON | New commerce features are out of scope until security/release correctness is verified |
| F10 | BLOCKED | Production promotion requires explicit approval after exact-head preview and storefront smoke |

## Verification evidence

The saved state entered this project at a RED test commit (`0305c509...`) defining security contracts for Shopify webhook/admin/inventory routes. The inherited routes parsed webhook JSON before trustworthy raw-body verification, returned HTTP 200 for method/auth failures, exposed the privileged image route with wildcard CORS, and used 401 for configuration/input/not-found inventory states.

Current branch implementation adds a shared verifier, raw-body HMAC verification, constant-time secret comparison, protected image sync, validated inventory proxy behavior, and a permanent Quality workflow. Exact-head hosted PASS is not claimed until the workflow executes and Vercel produces an exact-head deployment.

No merge, production promotion, Shopify/Sanity credential mutation, product mutation against a live store, billing action or destructive data migration has been performed.
