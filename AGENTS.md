# Parallel development of the room planner

This checkout is the independent V2 development workspace.

- Branch: `development-v2`.
- Stable production checkout: `../wohnungsplaner`, branch `main`.
- Stable baseline: tag `stable-v1-2026-09-16` (commit `7e1554f`).
- The user explicitly wants the current public website retained while V2 is developed separately.
- Make new planner changes here. Do not merge into main or replace the production deployment without the user's request to switch versions.
- Preserve the existing inventory UI, fields, photos, optional dimensions, flags, room assignments, backup/import format and PDF export in `app/InventoryPanel.tsx`.
- V2 focuses on floor-plan geometry, 2D/3D consistency and furniture placement. Do not silently treat inferred dimensions as verified measurements.
- Use `npm run dev:github -- --host 127.0.0.1 --port 4174` for the independent local preview; production development used port 4173.
- Keep experimental room-plan placements isolated from production. The owner explicitly approved a shared Firebase inventory, photos and move details for both versions on 2026-09-17; see CLOUD.md. Keep that shared schema compatible across versions.
- V2 preview hosting uses a separate repository: `mueardez/wohnungsplaner-hombrechtikon-v2`, remote `preview`, branch `main`. Publish V2 with `git push preview development-v2:main` only after checks pass.
- The original repository keeps V2 source on `development-v2`. Never push this source to the original repository's `main`.
- The deployment workflow checks both the exact V2 repository and main branch. It cannot deploy in the original repository.
- V2 legacy inventory is in IndexedDB `wohnungsplaner-inventar-v2`; it is read only for explicit migration and never cleared automatically. Local room-plan placements use `hombrechtikon-v2-plan`. Preserve these names to protect existing data.
- User expanded Keller on 2026-09-20 to a detached 3 × 3 m furnishable room. Keep it separate from apartment geometry; height 2.39 m is assumed and door position unknown. Terrasse remains inventory-only. Preserve explicit includeInPlan=false on older Keller inventory; users may enable placement through the existing checkbox.
- Never commit user inventory backups or photos.
