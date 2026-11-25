# Third-party notices

Boolstack is MIT licensed (see `LICENSE`). It includes or depends on the following third-party work.
Runtime npm dependencies carry their own licenses; see `pnpm-lock.yaml` and each package.

| Component | Where | License |
| --- | --- | --- |
| [shadcn/ui](https://ui.shadcn.com) | `components/ui/*`, `components.json` | MIT |
| [ReUI](https://reui.io) | `components/reui/stepper.tsx`, `components/examples/c-stepper-14.tsx` | MIT |
| [Tabler Icons](https://tabler.io/icons) (`@tabler/icons-react`) | npm dependency | MIT |
| [Lucide](https://lucide.dev) (`lucide-react`) | npm dependency | ISC |
| [DM Sans](https://fonts.google.com/specimen/DM+Sans) | loaded via `next/font/google` | SIL Open Font License 1.1 |

## Notes

- ReUI components are distributed through the shadcn registry (`@reui` in `components.json`). The free ReUI components, including the Stepper used here, are MIT licensed per the [ReUI license](https://reui.io/legal/license); attribution is optional, and the MIT notice is retained by this file. ReUI Pro/Ultimate content is proprietary and is not used in this repository. See https://reui.io.
- DM Sans is fetched and self-hosted by Next.js at build time; it is licensed under the SIL OFL 1.1 (https://openfontlicense.org).
