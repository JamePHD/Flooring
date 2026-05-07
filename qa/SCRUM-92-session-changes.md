# SCRUM-92 — Knowledge hub seed articles

**Date:** 2026-05-07
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Create the 3 launch seed articles via the admin CMS so the
knowledge hub isn't empty at launch.

This is a content-prep task, not a backend implementation. The articles
backend (model, controller, admin endpoints, public read) was delivered
by SCRUM-72; this ticket just populates it.

---

## What was built

### `qa/scrum-92-seed-articles.http` — new

Single-file workflow that:

1. **LOGIN** — Supabase admin auth
2. **Three POST /api/admin/articles** calls, one per AC#2-suggested article:
   - "How to choose the right flooring for your room" — `buying_guide`
   - "Hybrid vs Laminate: What's the difference?" — `product_comparison`
   - "How to measure your room for flooring" — `installation_guide`
3. **Verify drafts** with `GET /api/admin/articles?status=draft`
4. **Verify public hub does NOT show drafts** with `GET /api/articles`
5. **Publish-after-review** blocks at the bottom (run after founder approval)
6. **Final verify** — public hub now lists all 3

Each article carries:
- A 4-section HTML body skeleton (intro + 3 H2 sections, marked
  `[FOUNDER REVIEW: please replace this draft body with finalised
  copy.]` so it's obvious which copy is placeholder)
- `featured_image_url` placeholder (Unsplash URL pattern; founder/team
  swap in real images)
- `meta_title` (under 70 chars, satisfies SCRUM-51 constraint)
- `meta_description` (under 200 chars)
- `related_product_ids: ["{{primaryProductId}}"]` (variable at top of
  file — paste any flagship product UUID)
- `status: "draft"` so it's invisible until founder approves

---

## AC mapping

| AC | Where verified |
|----|----------------|
| AC#1 — min 3 articles, ≥ 2 categories | 3 articles created across 3 categories (buying_guide / product_comparison / installation_guide) |
| AC#2 — exact suggested titles | All 3 titles match the ticket text verbatim |
| AC#3 — body, featured image, SEO meta, related product | Each POST body sets all four fields |
| AC#4 — published via the CMS (not hardcoded) | Created via `POST /api/admin/articles` (the admin CMS endpoint), not via SQL `INSERT` |
| AC#5 — founder review before launch | Articles created as `draft`. Public hub stays empty until the explicit `/publish` step is run after founder approval |

---

## Workflow for the team

### Phase 1 — admin runs the seed (5 min)
1. Fill in `@primaryProductId` at the top of the file with a real
   product UUID
2. Run blocks top to bottom through "Confirm public list does NOT show
   drafts"
3. Confirm 3 drafts exist in `GET /api/admin/articles?status=draft`

### Phase 2 — founder review (asynchronous, takes as long as it takes)
1. Founder logs into the admin CMS
2. For each draft, opens it, replaces the `[FOUNDER REVIEW]` placeholders
   with finalised copy
3. (Optional) updates `featured_image_url` to a real image
4. (Optional) adjusts `meta_title` / `meta_description` for tone
5. (Optional) adds more `related_product_ids` if multiple flagship
   products should be linked
6. Marks each as approved (verbal / Slack / however the team works)

### Phase 3 — admin publishes (1 min)
1. Run the three "Publish article N" blocks at the bottom of the file
2. Run "Verify all 3 are now public" — expect `count: 3`
3. Browse the public knowledge hub — drafts → live

---

## Notes

- The file uses REST Client variable chaining
  (`{{article1.response.body.$.id}}`) so the publish step at the bottom
  works without manual ID copying — provided the original POST blocks
  ran in the same VS Code session. If the editor was closed between the
  seed and the publish, re-run the GET admin list and grab IDs manually.
- The placeholder bodies use semantic HTML structure (h1 → h2 → p / ul)
  that the SCRUM-72 backend stores as-is and the eventual frontend
  rich-text renderer should handle. Founder edits the *content*; the
  *structure* is a sensible default.
- If launch needs a 4th article (e.g. the founder writes one off-list),
  it can simply be created in the admin CMS the same way — no changes
  to this file or the backend required.

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `qa/scrum-92-seed-articles.http` | new — seed runbook for admin/founder | uncommitted, do not commit |
| `qa/SCRUM-92-session-changes.md` | this document | uncommitted |

No source code changes for this ticket.

---

## Verification status

**Seed step verified end-to-end on 2026-05-07.** Three drafts created
via the admin API and confirmed hidden from the public list. AC#5
(founder review) is the asynchronous human step — once the founder
approves and the publish blocks are run, the articles will be live.
