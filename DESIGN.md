# Design System — Chealf

## Product Context
- **What this is:** AI-powered meal planning web app — recipe creation with live AI preview, weekly planning, shopping lists
- **Who it's for:** Personal use (MVP), daily cooking/planning tool
- **Space/industry:** Food/cooking productivity, intersects recipe apps (Mela, Paprika) and meal planners (Eat This Much, Whisk)
- **Project type:** Web app with split-pane AI interaction, card grids, calendar, and checklist views

## Aesthetic Direction
- **Direction:** Organic/Refined — warm, confident, editorial. Lets food photography be the visual star.
- **Decoration level:** Intentional — warm off-white background, subtle tinted surfaces, no gratuitous texture
- **Mood:** Modern cooking tool that feels like it was designed by someone who actually cooks. Bold and confident through typography, warm and approachable through color. Not a "fun recipe app," not a cold SaaS tool.

## Typography
- **Display/Hero:** Cabinet Grotesk (self-hosted, Fontshare free commercial license)
  - Weights: 400, 500, 700, 800. Note: 600 maps to 700 (no 600 weight available)
  - Used for: recipe titles, section headings, page titles, calendar slot labels
  - Rationale: Bold geometric sans gives Chealf a confident, modern identity. Most meal planning apps are all-neutral-sans; Cabinet Grotesk makes headings pop with character.
- **Body:** Plus Jakarta Sans (Google Fonts)
  - Weights: 400, 500, 600, 700 (full variable range available)
  - Used for: ingredients, steps, UI labels, chat messages, metadata, badges, buttons
  - Rationale: Warm geometric sans with excellent readability. Slightly more rounded and friendly than DM Sans.
- **Data/Mono:** Geist Mono (already loaded via `next/font/google`)
  - Used for: quantities (150g, 2 c.a.s), nutritional values (~450 kcal), timers
- **Loading:** Cabinet Grotesk via `next/font/local` from `src/fonts/`; Plus Jakarta Sans via `next/font/google`
- **Scale:**
  - xs: 12px | sm: 14px | base: 16px | lg: 18px | xl: 20px | 2xl: 24px | 3xl: 30px | 4xl: 36px | 5xl: 48px
  - Display line-heights: 5xl(1.05) 4xl(1.1) 3xl(1.15) 2xl(1.2) xl(1.3)
  - Body line-heights: base(1.65) sm(1.5)
  - Display letter-spacing: 5xl(-0.03em) 4xl(-0.02em) 3xl(-0.02em) 2xl(-0.01em)

## Color

### Approach: Restrained
One primary + one accent + warm stone neutrals. Color is rare and meaningful. Food photos carry the visual richness.

### Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#4A5D4A` | Buttons, active states, links |
| `--primary-light` | `#5B7553` | Primary hover |
| `--primary-fg` | `#2D3A2D` | Text on primary-tinted surfaces |
| `--accent` | `#C08B5C` | Badges, highlights, season indicators, aisle headers |
| `--accent-light` | `#D4A574` | Accent hover |
| `--accent-fg` | `#7A5530` | Text on accent-tinted surfaces |
| `--background` | `#FAFAF7` | Page background (warm off-white) |
| `--card` | `#FFFFFF` | Card/panel surfaces |
| `--foreground` | `#2C2A26` | Primary text |
| `--muted-foreground` | `#78756F` | Secondary text, metadata |
| `--subtle-foreground` | `#A09D96` | Placeholder text, disabled states |
| `--border` | `#E8E6E1` | Default borders |
| `--border-strong` | `#D1CEC8` | Input borders, secondary button borders |
| `--destructive` | `#B54545` | Destructive actions |

### Semantic Color Triplets (bg / border / fg)

| State | Background | Border | Foreground |
|-------|-----------|--------|------------|
| Success | `#E8F0E8` | `#C2D4C2` | `#2D3A2D` |
| Warning | `#FDF3E0` | `#E8D5A8` | `#7A5A1A` |
| Error | `#FDE8E8` | `#E8B8B8` | `#8A2E2E` |
| Info | `#E4EEF6` | `#B8CDE0` | `#2E4458` |

### Dark Mode
Warm dark surfaces, reduced saturation. Primary/accent lightened for contrast.

| Token | Hex |
|-------|-----|
| `--background` | `#1A1917` |
| `--card` | `#242320` |
| `--foreground` | `#E8E6E1` |
| `--muted-foreground` | `#A09D96` |
| `--border` | `#3A3835` |
| `--border-strong` | `#4A4845` |
| `--primary` | `#7A9B78` |
| `--accent` | `#D4A574` |

Dark semantic backgrounds invert to dark-tinted surfaces (e.g., success bg: `#1E2A1E`).

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)

## Layout
- **Approach:** Grid-disciplined with editorial touches
- **Grid:** 12 columns; 1-col mobile, 2-col tablet, 3-col desktop for recipe grids
- **Max content width:** 1120px
- **Split pane:** 1fr + 360px for AI creation/planning views
- **Border radius:**
  - sm: 4px (badges, small elements)
  - md: 6px (buttons, inputs, chat bubbles)
  - lg: 10px (cards, panels, modals)
  - full: 9999px (pill tags only if needed)

## Motion
- **Approach:** Intentional — motion supports the streaming/progressive-fill UX. No decorative animation.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(75ms) short(150ms) medium(300ms) long(500ms)
- **Key motions:**
  - Recipe fields streaming in: fade + subtle translateY(4px→0), medium
  - Calendar slots filling: fade, short
  - Shopping list checkbox: scale + color, micro
  - Modal/sheet: translateY + fade, medium

## Component Patterns

### Buttons
- Radius: 6px (--radius-md)
- Font weight: 600 (Plus Jakarta Sans)
- Padding: 9px 18px
- Letter-spacing: -0.01em
- Primary: `--primary` bg, white text
- Secondary: `--card` bg, `--border-strong` border, `--foreground` text
- Accent: `--accent` bg, white text
- Ghost: transparent bg, `--muted-foreground` text, no border
- Destructive: `--destructive` bg, white text

### Badges
- Radius: 4px (--radius-sm)
- Font weight: 600
- Font size: 12px
- Uses semantic triplets: e.g., dietary tag → success bg/border/fg, season → warning bg/border/fg

### Alerts
- Left border: 3px solid semantic color
- Background: semantic bg (explicit, not tinted with opacity)
- All other borders: 1px solid semantic border color
- Radius: 6px
- Font weight: 500

### Inputs
- Radius: 6px
- Border: `--border-strong`
- Focus: border-color `--primary` + `box-shadow: 0 0 0 3px var(--success-bg)`

### Nutritional Badge
- Style: warning bg/border/fg triplet (caramel tones)
- Prefix `~` and suffix `estimation IA` in lighter italic to indicate AI estimate

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-23 | Initial design system created | /design-consultation based on Chealf product context |
| 2026-03-23 | Cabinet Grotesk for display | Bold geometric sans gives confident identity vs. generic all-neutral food app look |
| 2026-03-23 | Plus Jakarta Sans for body | Warm rounded geometric, better contrast from display font than same-family pairing |
| 2026-03-23 | Muted sage + caramel palette | Avoids bright food-app clichés, signals daily cooking tool, lets food photos carry color |
| 2026-03-23 | Warm off-white (#FAFAF7) background | Creates paper quality, warmer than pure white, reduces screen fatigue |
| 2026-03-23 | Explicit semantic color triplets | Avoids washed-out `opacity` tints, ensures readable contrast in alerts/badges |
| 2026-03-23 | Left-border accent on alerts | Adds structural weight without heavy all-border treatment |
