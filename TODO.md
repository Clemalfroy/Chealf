# Chealf - Parallel Work Backlog

Items deferred from milestone implementations, grouped by the milestone where they belong.
Use this to identify work that can be picked up in parallel with the main milestone track.

---

## M1 — Recipe Creation

### M1.2 (AI recipe assistant) — deferred items
- [ ] **Cascading recomputations after ingredient changes**
  Auto-recompute dietary tags, seasonality, and nutrition when ingredients change.
  Deferred from M1.2 → belongs in M1.4.

### M1.3 — Image generation
- [ ] DALL-E 3 `generateImage` tool
- [ ] Configurable image style guidelines (prompt templates in a config file)
- [ ] `image_url` storage in Supabase Storage

### M1.4 — Smart features
- [ ] Auto-detect dietary tags from ingredients
- [ ] Seasonality calculation from ingredients (month range)
- [ ] Nutritional score estimation — `setNutrition` LLM tool (`nutrition_score` + `nutrition_data`)
- [ ] Chat history persistence — `recipe_chat_messages` table (store + reload per recipe)
- [ ] AI memory — extract and store user preference facts (`ai_memory_facts` table)
- [ ] User guidelines — base profile + contextual toggles (`user_guidelines` table)

---

## M2 — Recipe Library + Search

- [ ] **2.1** Grid view of all recipes (cards: photo, title, prep time, tags) + pagination/infinite scroll
- [ ] **2.2** Filters: season (current month), prep time, dietary tags + text search (title/ingredients)
- [ ] **2.3** Reverse ingredient search — "I have X, Y, Z" → ranked recipe matches

---

## M3 — Weekly Planning

- [ ] **Generic `ChatPanel` extraction** from `RecipeChatPanel`
  `RecipeChatPanel` is currently recipe-specific. Extract a shared `ChatPanel` base before building planning/shopping chat.
  Ref: `src/components/recipes/recipe-chat-panel.tsx`

- [ ] **3.0** Schema: `weekly_plans`, `plan_slots` tables + migration
- [ ] **3.1** Calendar/grid UI (7 days × configurable slots) + slot templates + add/remove UX
- [ ] **3.2** AI planning assistant — `/api/chat/plan` route + tools: `setSlot`, `removeSlot`, `swapSlots`, `clearDay`
- [ ] **3.3** Save/load plans + recipe popularity tracking + quick "create recipe" link from empty slot

---

## M4 — Shopping List

- [ ] **4.1** Ingredient aggregation from plan slots — apply `scaling_factor`, sum duplicates, group by aisle
- [ ] **4.2** Interactive checklist (mobile-friendly, persisted state, per-ingredient recipe tooltip)

---

## M5 — Home Page

- [ ] **5.1** Conditional display: active plan summary vs. seasonal recipe suggestions
- [ ] **5.2** Filters (season, prep time, dietary tags) + quick actions ("Create a recipe", "Plan my week")

---

## Cross-cutting / No assigned milestone

### UX — Empty states & onboarding
- [ ] **Empty state on resource creation pages**
  When no recipes exist yet, the `/recipes` page and the recipe creation flow don't make it obvious that the AI chat is the entry point. Add a prominent empty state (illustration + headline + CTA) that directs the user to open the chat and describe a recipe. Apply the same pattern to planning and shopping list pages when their prerequisites are missing.

- [ ] **Prompt suggestion chips in the chat input**
  Surface clickable suggestion tags below (or inside) the chat input to help users quickly compose their intent. Chips append to the current input text rather than replacing it.
  Examples for recipe context: `de saison`, `rapide`, `sain`, `gourmand`, `riche en fer`, `riche en protéines`, `sans gluten`, `végétarien`, `batch cooking`.
  Chips should be context-aware (different sets for recipe creation vs. planning) and dismissible once the user has typed something.

- [ ] `aisle` validation flow — when LLM proposes a new aisle not in the ontology, surface user confirmation before inserting
- [ ] `dietary_tag` validation flow — same pattern as aisles
- [ ] `ingredient` validation flow — when LLM creates a new ingredient, confirm before persisting
- [ ] Mobile layout: floating chat input polish (recipe editor split-pane on small screens)
