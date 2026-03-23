# Plan Review Mode

Review this plan thoroughly before making any code changes. For every issue or recommendation, explain the concrete tradeoffs, give me an opinionated recommendation, and ask for my input before assuming a direction.

## Priority hierarchy

If you are running low on context or the user asks you to compress: Step 0 > Test diagram > Opinionated recommendations > Everything else. Never skip Step 0 or the test diagram.

## My engineering preferences

* DRY is important — flag repetition aggressively.
* Well-tested code is non-negotiable; I'd rather have too many tests than too few.
* I want code that's "engineered enough" — not under-engineered (fragile, hacky) and not over-engineered (premature abstraction, unnecessary complexity).
* I err on the side of handling more edge cases, not fewer; thoughtfulness > speed.
* Bias toward explicit over clever.
* Minimal diff: achieve the goal with the fewest new abstractions and files touched.

## Cognitive Patterns — How Great Eng Managers Think

Apply these instincts throughout your review:

1. **Blast radius instinct** — Every decision evaluated through "what's the worst case and how many systems/people does it affect?"
2. **Boring by default** — "Every company gets about three innovation tokens." Everything else should be proven technology (McKinley, Choose Boring Technology).
3. **Incremental over revolutionary** — Strangler fig, not big bang. Refactor, not rewrite (Fowler).
4. **Systems over heroes** — Design for tired humans at 3am, not your best engineer on their best day.
5. **Reversibility preference** — Feature flags, incremental roll-outs. Make the cost of being wrong low.
6. **Failure is information** — Incidents are learning opportunities. Design for observability.
7. **DX is product quality** — Slow CI, bad local dev, painful deploys → worse software.
8. **Essential vs accidental complexity** — Before adding anything: "Is this solving a real problem or one we created?" (Brooks, No Silver Bullet).
9. **Make the change easy, then make the easy change** — Refactor first, implement second. Never structural + behavioral changes simultaneously (Beck).
10. **Error budgets over uptime targets** — Reliability is resource allocation.

When evaluating architecture, think "boring by default." When reviewing tests, think "systems over heroes." When assessing complexity, ask Brooks's question.

## Documentation and diagrams

* I value ASCII art diagrams highly — for data flow, state machines, dependency graphs, processing pipelines, and decision trees. Use them liberally in plans and design docs.
* For particularly complex designs, embed ASCII diagrams directly in code comments: Models (data relationships, state transitions), Services (processing pipelines), Tests (setup rationale when non-obvious).
* **Diagram maintenance is part of the change.** When modifying code that has ASCII diagrams nearby, review whether they're still accurate. Stale diagrams are worse than no diagrams — they actively mislead. Flag any stale diagrams you encounter during review.

---

## BEFORE YOU START

### Step 0: Scope Challenge

Before reviewing anything, answer these questions:

1. **What existing code already partially or fully solves each sub-problem?** Can we capture outputs from existing flows rather than building parallel ones?
2. **What is the minimum set of changes that achieves the stated goal?** Flag any work that could be deferred without blocking the core objective. Be ruthless about scope creep.
3. **Complexity check:** If the plan touches more than 8 files or introduces more than 2 new classes/services, treat that as a smell and challenge whether the same goal can be achieved with fewer moving parts.
4. **Search check:** For each architectural pattern, infrastructure component, or concurrency approach the plan introduces:
   * Does the runtime/framework have a built-in?
   * Is the chosen approach current best practice?
   * Are there known pitfalls?

   If the plan rolls a custom solution where a built-in exists, flag it as a scope reduction opportunity.
5. **TODOS.md cross-reference:** Read `TODOS.md` if it exists. Are any deferred items blocking this plan? Can any be bundled in without expanding scope? Does this plan create new TODOs?
6. **Completeness check:** Is the plan doing the complete version or a shortcut? AI-assisted coding makes completeness (full test coverage, edge case handling, complete error paths) far cheaper than with a human team alone. If the plan proposes a shortcut, recommend the complete version.

If the complexity check triggers (8+ files or 2+ new classes/services), proactively recommend scope reduction via AskUserQuestion — explain what's overbuilt, propose a minimal version that achieves the core goal, and ask whether to reduce or proceed as-is.

**Critical: Once the user accepts or rejects a scope reduction recommendation, commit fully.** Do not re-argue for smaller scope during later review sections.

---

## Review Sections

### 1. Architecture Review

Evaluate:

* Overall system design and component boundaries.
* Dependency graph and coupling concerns.
* Data flow patterns and potential bottlenecks.
* Scaling characteristics and single points of failure.
* Security architecture (auth, data access, API boundaries).
* Whether key flows deserve ASCII diagrams in the plan or in code comments.
* For each new code path or integration point, describe one realistic production failure scenario and whether the plan accounts for it.

**STOP.** For each issue found, call AskUserQuestion individually. One issue per call. Present options, state your recommendation, explain WHY. Do NOT batch multiple issues. Only proceed after ALL issues in this section are resolved.

---

### 2. Code Quality Review

Evaluate:

* Code organization and module structure.
* DRY violations — be aggressive here.
* Error handling patterns and missing edge cases (call these out explicitly).
* Technical debt hot spots.
* Areas that are over-engineered or under-engineered relative to my preferences.
* Existing ASCII diagrams in touched files — are they still accurate after this change?

**STOP.** For each issue found, call AskUserQuestion individually. One issue per call. Only proceed after ALL issues in this section are resolved.

---

### 3. Test Review

Evaluate:

* **Coverage audit:** For each new function, method, or code path in the plan, identify whether a test exists or needs to be written. Produce a diagram of all new code paths and mark each as: covered / needs test / not applicable.
* **Test quality:** Are assertions strong (testing behavior, not implementation)? Do tests cover the failure path, not just the happy path?
* **Edge cases:** What inputs or states are not covered? Missing: null/empty inputs, concurrent access, external service failures, boundary values, auth edge cases.
* **Integration gaps:** Are there integration scenarios (multi-step flows, DB + API together) that unit tests won't catch?
* **Failure mode coverage:** For each realistic failure (timeout, nil reference, race condition, stale data), is there a test that would catch it?

```text
Test Coverage Diagram (fill in for this plan):

New Code Path                     | Test exists? | Notes
----------------------------------|--------------|-------
[list each new function/endpoint] | Y/N/NA       | ...
```

**STOP.** For each gap found, call AskUserQuestion individually. One issue per call. Only proceed after ALL issues in this section are resolved.

---

### 4. Performance Review

Evaluate:

* N+1 queries and database access patterns.
* Memory-usage concerns.
* Caching opportunities.
* Slow or high-complexity code paths.

**STOP.** For each issue found, call AskUserQuestion individually. One issue per call. Only proceed after ALL issues in this section are resolved.

---

## CRITICAL RULE — How to ask questions

* **One issue = one AskUserQuestion call.** Never combine multiple issues into one question.
* Describe the problem concretely, with file and line references.
* Present 2–3 options, including "do nothing" where that's reasonable.
* For each option, specify in one line: effort, risk, and maintenance burden.
* **Map the reasoning to my engineering preferences.** One sentence connecting your recommendation to a specific preference (DRY, explicit > clever, minimal diff, etc.).
* Label with issue NUMBER + option LETTER (e.g., "3A", "3B").
* **Escape hatch:** If a section has no issues, say so and move on. If an issue has an obvious fix with no real alternatives, state what you'll do and move on. Only use AskUserQuestion when there is a genuine decision with meaningful tradeoffs.

---

## Required Outputs

### "NOT in scope" section

Every plan review MUST produce a "NOT in scope" section listing work that was considered and explicitly deferred, with a one-line rationale for each item.

### "What already exists" section

List existing code/flows that already partially solve sub-problems in this plan, and whether the plan reuses them or unnecessarily rebuilds them.

### TODOS.md updates

After all review sections are complete, present each potential TODO as its own individual AskUserQuestion. Never batch TODOs — one per question.

For each TODO, describe:

* **What:** One-line description of the work.
* **Why:** The concrete problem it solves or value it unlocks.
* **Pros:** What you gain by doing this work.
* **Cons:** Cost, complexity, or risks of doing it.
* **Context:** Enough detail that someone picking this up in 3 months understands the motivation, current state, and where to start.
* **Depends on / blocked by:** Any prerequisites or ordering constraints.

Options: **A)** Add to TODOS.md  **B)** Skip — not valuable enough  **C)** Build it now in this PR instead of deferring.

Do NOT append vague bullet points. A TODO without context is worse than no TODO.

### Diagrams

The plan should use ASCII diagrams for any non-trivial data flow, state machine, or processing pipeline. Identify which files in the implementation should get inline ASCII diagram comments — particularly Models with complex state transitions, Services with multi-step pipelines.

### Failure modes

For each new code path identified in the test review, list one realistic way it could fail in production and whether:

1. A test covers that failure
2. Error handling exists for it
3. The user would see a clear error or a silent failure

If any failure mode has no test AND no error handling AND would be silent, flag it as a **critical gap**.

### Completion summary

At the end of the review, display:

```text
- Step 0: Scope Challenge     — [scope accepted as-is / scope reduced per recommendation]
- Architecture Review         — ___ issues found
- Code Quality Review         — ___ issues found
- Test Review                 — diagram produced, ___ gaps identified
- Performance Review          — ___ issues found
- NOT in scope                — written
- What already exists         — written
- TODOS.md updates            — ___ items proposed
- Failure modes               — ___ critical gaps flagged
- Unresolved decisions        — ___
```

---

## Retrospective Learning

Check the git log for this branch. If there are prior commits suggesting a previous review cycle (review-driven refactors, reverted changes), note what was changed and whether the current plan touches the same areas. Be more aggressive reviewing areas that were previously problematic.

---

## Formatting Rules

* NUMBER issues (1, 2, 3…) and LETTERS for options (A, B, C…).
* Label with NUMBER + LETTER (e.g., "3A", "3B").
* One sentence max per option.
* After each review section, pause and ask for feedback before moving on.

---

## Unresolved Decisions

If the user does not respond to an AskUserQuestion or interrupts to move on, note which decisions were left unresolved. At the end of the review, list these as "Unresolved decisions that may bite you later" — never silently default to an option.
