# Chealf - Implementation Roadmap

## Current State

| Layer | Status |
|-------|--------|
| Next.js 16 + React 19 + TS | Done |
| Design system (CSS + fonts) | Done |
| Supabase client/server helpers | Done |
| Auth middleware (session refresh) | Done |
| shadcn base-nova config | Done (1 component: Button) |
| Database schema (Drizzle) | Done (tooling + `users` table) |
| Auth UI | Done (login/signup + DAL + proxy) |
| AI integration (Vercel AI SDK) | Done (providers + prompt builder + /api/chat) |
| Application features | Not started |

---

## Key Principle: Iterative Schema

The database schema is **not** designed upfront. Each milestone creates only the tables it needs:

| Milestone | Tables created |
|-----------|---------------|
| M0 | `users` only (Drizzle tooling + auth) |
| M1 | `recipes`, `ingredients`, `aisles`, `recipe_ingredients`, `recipe_steps`, `dietary_tags`, `recipe_dietary_tags`, `ai_memory_facts`, `user_guidelines` |
| M3 | `weekly_plans`, `plan_slots` |

---

## Build Order

```
M0: Foundation (Drizzle tooling + Auth + AI SDK + Shared UI)
 |
M1: Recipe Creation (schema + CRUD + AI assistant + images + smart features)
 |
M2: Recipe Library + Search (browse + filter + reverse search)
 |
M3: Weekly Planning (schema + calendar + AI planner)
 |
M4: Shopping List (aggregation + interactive checklist)
 |
M5: Home Page (adaptive landing)
```

---

## Milestones

### Milestone 0: Foundation

**0.1 - Drizzle ORM setup (tooling only, no tables yet)**
- Install `drizzle-orm`, `drizzle-kit`, `postgres` driver
- Create `drizzle.config.ts` + DB connection utility (`src/db/index.ts`)
- Create `src/db/schema/` directory structure
- Verify migration workflow works (generate + push)

**0.2 - Auth UI + protected routes**
- Login/signup pages with Supabase Auth (email + password)
- Fix deprecated `middleware.ts` -> `proxy` convention (Next.js 16)
- Redirect unauthenticated users
- Auth context/hooks for client components
- `users` table (synced with Supabase Auth) — first migration

**0.3 - AI SDK setup**
- Install `ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`
- Create base AI utility (`src/lib/ai/`) with provider config
- Create reusable streaming API route pattern
- Set up system prompt structure (base prompt + user guidelines + AI memory)

**0.4 - Shared UI components**
- Install additional shadcn components needed across features (input, card, badge, alert, dialog, sheet, checkbox, etc.)
- Create layout shell (sidebar/nav, main content area)
- Create split-pane layout component (chat + preview) per DESIGN.md spec

---

### Milestone 1: Recipe Creation

**1.0 - Database tables for recipes**
- Schema: `recipes`, `ingredients`, `aisles`, `recipe_ingredients`, `recipe_steps`, `dietary_tags`, `recipe_dietary_tags`
- Seed aisles + dietary tags
- Migration

**1.1 - Recipe CRUD (no AI yet)**
- API routes / Server Actions for recipe CRUD
- Recipe form (manual creation/editing of all fields)
- Recipe card component + recipe detail page
- Ingredient management (search existing, create new with aisle assignment)

**1.2 - AI recipe assistant**
- API route for recipe chat (streaming + tool calling)
- LLM tools: `fillRecipeTitle`, `addIngredient`, `removeIngredient`, `setSteps`, `setServings`, `setPrepTime`, `setNutrition`
- Split-pane UI: chat input bottom + live recipe preview top
- Streaming field updates (fields fill in real-time as tools are called)
- Re-engage AI on existing recipes ("make this lighter", "replace cream with coconut milk")

**1.3 - Image generation**
- DALL-E 3 integration for recipe photos
- `generateImage` LLM tool
- Configurable image style guidelines (prompt templates)

**1.4 - Smart features**
- Auto-detect dietary tags from ingredients
- Seasonality calculation from ingredients
- Nutritional score estimation (LLM-based)
- AI memory: extract and store user preference facts (`ai_memory_facts` table)
- User guidelines: base profile + contextual guidelines (`user_guidelines` table)

---

### Milestone 2: Recipe Library + Search

**2.1 - Recipe library page**
- Grid view of all user recipes (recipe cards with photo, title, prep time, tags)
- Pagination or infinite scroll

**2.2 - Filtering + search**
- Filter by season (current month), prep time, dietary tags
- Text search on title/ingredients

**2.3 - Reverse ingredient search**
- "I have X, Y, Z" input
- Match against recipe ingredients, rank by coverage

---

### Milestone 3: Weekly Planning

**3.0 - Database tables for planning**
- Schema: `weekly_plans`, `plan_slots`
- Migration

**3.1 - Planning UI**
- Calendar/grid view (7 days x configurable slots)
- Slot templates (presets for common patterns)
- Add/remove slots per day (one click)

**3.2 - AI planning assistant**
- API route for planning chat (streaming + tool calling)
- LLM tools: `setSlot`, `removeSlot`, `swapSlots`, `clearDay`
- LLM picks from existing recipes only
- Planning presets ("balanced", "high protein", "light weekdays")
- Real-time calendar updates as tools are called

**3.3 - Plan persistence**
- Save/load weekly plans
- Recipe popularity tracking (frequency in plans)
- Quick link to create new recipe if no match for a slot

---

### Milestone 4: Shopping List

**4.1 - List generation**
- Aggregate ingredients from all plan slots
- Apply quantity scaling (per-person * servings, respecting scaling_type)
- Sum duplicate ingredients, group by aisle

**4.2 - Interactive list**
- Checkbox per ingredient (persisted state)
- Mobile-friendly layout (in-store usage)
- Tooltip showing which recipe(s) need each ingredient

---

### Milestone 5: Home Page

**5.1 - Conditional display**
- If active weekly plan exists: show current plan summary
- If no plan: show seasonal recipe suggestions

**5.2 - Filters + discovery**
- Season filter, prep time filter, dietary tag filter
- Quick actions: "Create a recipe", "Plan my week"

---

## Progress Tracker

- [x] **Milestone 0: Foundation**
  - [x] 0.1 Drizzle ORM setup (tooling only)
  - [x] 0.2 Auth UI + protected routes + `users` table
  - [x] 0.3 AI SDK setup
  - [x] 0.4 Shared UI components
- [ ] **Milestone 1: Recipe Creation**
  - [ ] 1.0 Database tables for recipes
  - [ ] 1.1 Recipe CRUD
  - [ ] 1.2 AI recipe assistant
  - [ ] 1.3 Image generation
  - [ ] 1.4 Smart features
- [ ] **Milestone 2: Recipe Library + Search**
  - [ ] 2.1 Recipe library page
  - [ ] 2.2 Filtering + search
  - [ ] 2.3 Reverse ingredient search
- [ ] **Milestone 3: Weekly Planning**
  - [ ] 3.0 Database tables for planning
  - [ ] 3.1 Planning UI
  - [ ] 3.2 AI planning assistant
  - [ ] 3.3 Plan persistence
- [ ] **Milestone 4: Shopping List**
  - [ ] 4.1 List generation
  - [ ] 4.2 Interactive list
- [ ] **Milestone 5: Home Page**
  - [ ] 5.1 Conditional display
  - [ ] 5.2 Filters + discovery
