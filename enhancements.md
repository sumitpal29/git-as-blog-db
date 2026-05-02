# Enhancement List
- Allow user to any type of data apart from blog
1. Keep user new changes in local storage so that on reloading or clicking back user does not loose data, also we add a reset if user has made changes
2. Add a filter by search feature on the posts
3. Add Sort option

## Repos
git@github.com:sumitpal29/sumit-pal-portfolio-database.git
git@github.com:sumitpal29/git-as-blog-db.git


- build a developer guide book, that we can showcase in my portfolio website

## New Enhancements
- remove git sync option
- allow user to choose where to keep the project folder for a new project.
- also show posts folder
- add theme ooptions - light (current), dark, solarised
- when user is in setting page hide setting icon, generate json from header
- setting page - make content center
- option to delete a project folder with confirmation modal not aleart


The project is already shadcn-ready
Look at the CSS variable names in index.css:


--background, --foreground, --card, --primary, --muted, --destructive, --border, --ring...
Those are exactly shadcn/ui's variable names — identical spelling. Someone (or a scaffolding tool) already set this project up to match shadcn's design token system. The cn() utility and clsx + tailwind-merge are already installed too. The themes (light/dark/solarised) would work immediately with zero changes.

What adding shadcn actually gives you
Right now (hand-rolled)	With shadcn
window.confirm dialogs → replaced with custom modal, but no focus trap or keyboard escape	<Dialog> — focus trapped, Escape closes, ARIA correct
<select> — native OS styling	<Select> — custom styled, keyboard navigable
<button> — custom classes on every use	<Button variant="..." size="..."> — consistent
No tooltip support	<Tooltip> — Radix-powered, accessible
Inline dropdown for theme switcher	<DropdownMenu> — proper popover with keyboard nav
The gains are mainly accessibility and visual consistency, not a dramatic visual overhaul — since the design tokens are already the same.

The honest trade-off
For: Low friction migration (CSS vars match 1:1), better modal/dropdown accessibility, consistent component API going forward.

Against: Adds ~8 @radix-ui/* packages. Existing components need refactoring across ~8 files. shadcn copies component source into src/components/ui/ — you own and maintain that code.

The Tailwind v4 caveat: shadcn added Tailwind v4 support in its latest release. The init process is slightly different than v3 — it uses a components.json with "cssVariables": true and writes into the existing CSS. Since this project already has the right variable structure, the init should be non-destructive. Worth verifying before committing.

Recommended approach
Rather than a big-bang refactor, do it in two phases:

Phase 1 (low risk, ~1 hour): Run npx shadcn@latest init, add 6 core components (button, input, select, dialog, card, badge), and replace the highest-leverage spots — all modals/dialogs and form inputs. The rest of the UI continues to work unchanged.

Phase 2 (optional): Progressively replace the theme dropdown with <DropdownMenu>, tabs with <Tabs>, inline renames with <Popover>, etc.

Want me to run Phase 1 now? I'll init shadcn, install the components, and apply them to the existing dialogs and forms without touching anything else.