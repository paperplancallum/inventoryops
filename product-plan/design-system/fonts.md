# Typography Configuration

## Google Fonts Import

Add to your HTML `<head>` or CSS:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Or via CSS import:

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
```

## Font Usage

- **Headings:** Inter (weights: 600, 700)
- **Body text:** Inter (weights: 400, 500)
- **Code/technical:** IBM Plex Mono (weights: 400, 500)

## CSS Configuration

```css
:root {
  --font-heading: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
}

body {
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

code, pre, kbd {
  font-family: var(--font-mono);
}
```

## Tailwind Configuration

If using Tailwind CSS v4, extend fonts in your CSS:

```css
@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
}
```

## Typography Scale

Use Tailwind's built-in text utilities:

```
Page title:     text-2xl font-semibold (24px)
Section header: text-xl font-semibold (20px)
Card title:     text-lg font-medium (18px)
Body large:     text-base (16px)
Body:           text-sm (14px)
Small/caption:  text-xs (12px)
```
