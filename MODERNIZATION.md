# shop — Commerce Modernization Roadmap

The repository contains a Next.js/TypeScript storefront with Sanity-related configuration, studio/content tooling, components, data and CI configuration. Treat it as a commerce/CMS implementation only to the extent verified by the code.

## 10 tasks

1. Trace product, category, cart and checkout-related flows and document exactly which commerce capabilities are implemented.
2. Identify starter/template provenance from the Sanity template files and separate upstream functionality from original modifications.
3. Audit content/product schemas and ensure required fields, slugs, pricing and inventory-like values are validated at boundaries.
4. Review environment/configuration and third-party integrations for secret exposure, stale services and unnecessary client-side credentials.
5. Add explicit loading, empty, unavailable-product, CMS failure and transaction/provider failure states where relevant.
6. Add tests for product mapping, price formatting, cart state and any verified purchase/checkout integration.
7. Review existing GitHub configuration and establish CI for lint, type-check, tests and production build.
8. Audit storefront accessibility, responsive behavior, image delivery and Core Web Vitals on catalog/product surfaces.
9. Upgrade the historical Next.js/Sanity stack incrementally after recording a reproducible baseline build.
10. Rewrite portfolio documentation around verified commerce architecture and original design/engineering decisions, avoiding claims inherited from the starter/template.

## Portfolio value

Potentially useful as a commerce + headless CMS engineering artifact if the original delta from the Sanity starter is substantial and clearly documented.