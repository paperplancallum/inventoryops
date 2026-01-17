# Tailwind Color Configuration

## Color Choices

- **Primary:** `indigo` — Used for buttons, links, key accents
- **Secondary:** `amber` — Used for tags, highlights, secondary elements
- **Neutral:** `slate` — Used for backgrounds, text, borders

## Usage Examples

### Primary (Indigo)
```
Primary button: bg-indigo-600 hover:bg-indigo-700 text-white
Primary link: text-indigo-600 hover:text-indigo-700 dark:text-indigo-400
Primary badge: bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200
Primary ring: ring-indigo-500 focus:ring-indigo-500
```

### Secondary (Amber)
```
Secondary badge: bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200
Warning state: text-amber-600 dark:text-amber-400
Highlight: bg-amber-50 dark:bg-amber-900/20
```

### Neutral (Slate)
```
Body text: text-slate-900 dark:text-slate-100
Secondary text: text-slate-600 dark:text-slate-400
Muted text: text-slate-500 dark:text-slate-500
Borders: border-slate-200 dark:border-slate-700
Card background: bg-white dark:bg-slate-800
Page background: bg-slate-50 dark:bg-slate-900
```

## Dark Mode

All colors support dark mode via the `dark:` prefix. Ensure proper contrast in both modes:

```
// Light mode: darker shades for text on light backgrounds
// Dark mode: lighter shades for text on dark backgrounds

text-slate-900 dark:text-slate-100  // Primary text
text-slate-600 dark:text-slate-300  // Secondary text
bg-white dark:bg-slate-800          // Card surfaces
bg-slate-50 dark:bg-slate-900       // Page backgrounds
```
