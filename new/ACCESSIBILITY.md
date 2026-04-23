# ACCESSIBILITY.md

Accessibility standards and implementation contracts for this repository.

## Core Principle

Accessibility is required product behavior. Any new interactive feature must be keyboard operable, perceivable, and semantically correct.

## Required Patterns

### Semantic Interactivity

- Use semantic controls for all interactions:
  - Actions: `button`-equivalent controls (`Button`, `ActionIcon`, `UnstyledButton`)
  - Navigation: links (`Anchor`/`a`)
  - Form input: native form controls or accessible abstractions
- Do not use click-only `div`/`Box` for primary interactive behavior.

### Keyboard Operability

- Every interactive element must be reachable with Tab.
- Activatable controls must work with Enter/Space.
- Dismissible overlays and suggestion lists should support Escape.
- Do not create keyboard traps.

### Focus Visibility

- Preserve visible `:focus-visible` indication on all interactive controls.
- Do not remove focus outlines without replacing them with a strong alternative.

### Focus Management

- Sidebar panel open: focus panel primary control.
- Sidebar panel close: restore focus to opening sidebar tab.
- List → detail: focus Back button or detail heading.
- Detail → list: restore focus to previously selected list item.

### ARIA Usage

- Prefer native semantics before ARIA.
- Use ARIA patterns only when behavior matches:
  - Sidebar nav: `tablist` + `tab` + `tabpanel`
  - Autocomplete: `combobox` + `listbox` + `option` + `aria-activedescendant`
- Icon-only buttons require `aria-label`.
- Avoid decorative or misleading ARIA.

### Combobox Keyboard Contract

- Keep DOM focus on the combobox input while suggestions are open.
- Suggestion options should not be tab stops when using `aria-activedescendant` (`tabIndex={-1}` on options).
- Arrow keys move active suggestion; Enter commits active suggestion.
- Escape closes the suggestion list and clears active suggestion state.
- Tab and Shift+Tab move focus out of the field and must close the suggestion list.
- Input blur must close the suggestion list and clear active suggestion state.

## Existing Canonical Components

- `src/components/PanelList.tsx`:
  - Standard interactive list rows and focus restore hooks.
- `src/components/Sidebar.tsx`:
  - Sidebar tab semantics and panel focus transitions.
- `src/components/BackButton.tsx`:
  - Back/navigation return behavior.
- `src/components/panels/SearchPanel.tsx`
- `src/components/FloatingSearch.tsx`
- `src/components/inputs/FeatureAutocompleteInput.tsx`:
  - Standard combobox/listbox behavior.

## Accessibility Acceptance Checks (Manual)

1. Keyboard-only nav:
   - Tab through sidebar tabs, panel controls, lists, and map controls.
2. Focus visibility:
   - Every interactive target shows visible focus.
3. Focus restoration:
   - Panel close returns focus to opening tab.
   - Detail back returns focus to prior list row.
4. Autocomplete behavior:
   - Arrow keys move option
   - Enter selects
   - Escape closes list
   - Tab/Shift+Tab exits naturally and closes list
   - Blur closes list and clears active option
5. Map checks:
   - Map region has accessible name/description
   - Map controls are tabbable and operable.

## Scope Notes

- These standards are now enforced by automated gates:
  - ESLint with `jsx-a11y` rules (`npm run lint`)
  - Playwright accessibility suite (`npm run test:a11y`)
- Playwright coverage includes:
  - keyboard/focus smoke checks
  - URL/history/search accessibility-adjacent regressions
  - axe critical scans for active sidebar panels
- Remaining map-style/layer-specific assertions are tracked as explicit `test.fixme` cases in `e2e/regression/`.
