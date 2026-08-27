# DESIGN.md — Cognitive Convergence Detector

## Mission
Dark, data-dense financial risk monitoring dashboard for measuring institutional trading signal correlation and detecting convergence events.

## Brand
Product: Cognitive Convergence Detector
Audience: Asset managers, compliance officers, systematic traders
Surface: Web dashboard + REST API

## Style Foundations

### Visual Theme
- Dark-first UI with purple accent palette
- Data-dense layouts optimized for information-per-viewport
- Terminal-native aesthetic with clean hierarchy
- Zero-radius sharp edges, no decorative elements

### Color Palette
```css
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a2e;
  --bg-card: #16161f;
  --border: #2a2a3e;
  --border-hover: #3a3a5e;

  --text-primary: #e8e8f0;
  --text-secondary: #8888a0;
  --text-muted: #555570;

  --accent-purple: #7c3aed;
  --accent-purple-dim: #6d28d9;
  --accent-green: #10b981;
  --accent-red: #ef4444;
  --accent-yellow: #f59e0b;
  --accent-blue: #3b82f6;
  --accent-cyan: #06b6d4;
}
```

### Typography
- Primary: Inter (sans-serif, weights 400-700)
- Monospace: JetBrains Mono (for data values)
- Scale: 12px/14px/16px/20px/24px/32px

### Spacing
- 4px base unit: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

### Borders & Radius
- Cards: 8px radius
- Buttons: 6px radius
- Inputs: 6px radius

### Shadows
- Card: 0 2px 8px rgba(0,0,0,0.3)
- Dropdown: 0 4px 16px rgba(0,0,0,0.5)

## Rules: Do
- Use monospace font for all numerical data values
- Color-code: green=normal, yellow=warning, red=critical
- Keep heatmaps compact with clear legend
- Show confidence intervals on correlation estimates
- Responsive: collapse sidebar on mobile

## Rules: Don't
- No rounded-full on data elements
- No gradients on cards or backgrounds
- No emoji in UI
- No animations longer than 200ms
- No light mode (dark only)

## Accessibility
- WCAG 2.2 AA contrast ratios
- Focus-visible on all interactive elements
- aria-labels on icon buttons
- prefers-reduced-motion: disable all transitions
