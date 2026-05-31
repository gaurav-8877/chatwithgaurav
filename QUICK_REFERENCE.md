# ⚡ Design System Quick Reference

## Colors - Copy & Paste Ready

```jsx
// Text Colors
text-primary        // #F8FAFC (main text)
text-secondary      // #94A3B8 (muted)
text-tertiary       // #64748B (very muted)

// Backgrounds
bg-surface-primary        // #0B1120 (darkest)
bg-surface-secondary      // #111827 (sidebar)
bg-surface-tertiary       // #1E293B (elevated)
bg-surface-glass          // 17, 24, 39 at 60% opacity
bg-surface-glass-light    // 30, 41, 59 at 40% opacity

// Borders
border-divider      // rgba(241, 245, 249, 0.08)
border-brand-500    // #3B82F6
border-brand-600    // #0891B2

// Status Colors
bg-green-500        // #22C55E (online)
bg-yellow-500       // #F59E0B (away)
bg-slate-500        // Gray (offline)
bg-red-500          // #EF4444 (error)
```

## Buttons - One-Liners

```jsx
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-ghost">Ghost</button>
<button className="btn-icon"><Icon /></button>
<button className="btn-icon-sm"><Icon /></button>
```

## Inputs - Ready to Use

```jsx
<input className="input-field" placeholder="..." />
<input className="input-field-glass" placeholder="..." />
<textarea className="input-field resize-none" />
```

## Containers

```jsx
<div className="glass-container">           {/* Hover effect */}
<div className="glass-card">                {/* Card variant */}
<div className="bg-surface-tertiary">       {/* Solid */}
```

## Spacing Grid (8px base)

```
p-1   = 4px     p-2   = 8px     p-3   = 12px    p-4   = 16px
p-5   = 20px    p-6   = 24px    p-8   = 32px    p-10  = 40px
p-12  = 48px    p-16  = 64px    p-20  = 80px    p-24  = 96px

gap-1 = 4px     gap-2 = 8px     gap-3 = 12px    gap-4 = 16px
gap-6 = 24px    gap-8 = 32px    gap-12 = 48px

m-2   = 8px     m-4   = 16px    m-6   = 24px    m-8   = 32px
```

## Typography

```jsx
// Headings
<h1 className="text-header">        // 30px bold
<h2 className="text-title">         // 24px semibold
<h3 className="text-lg font-semibold"> // 20px

// Body
<p className="text-body">           // 16px normal
<p className="text-label">          // 14px medium
<p className="text-sm text-tertiary"> // 12px muted
<p className="text-xs text-tertiary"> // 12px uppercase
```

## Common Patterns

### Chat Card
```jsx
<div className="p-3 rounded-lg bg-surface-tertiary/50 border border-divider hover:bg-surface-tertiary transition-colors">
  <div className="flex items-center gap-3">
    <img className="w-12 h-12 rounded-full" src="..." />
    <div className="flex-1">
      <p className="font-semibold text-primary">John Doe</p>
      <p className="text-sm text-secondary">Last message...</p>
    </div>
  </div>
</div>
```

### Message Bubble - Sent
```jsx
<div className="px-4 py-3 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-br-sm shadow-lg shadow-brand-500/20">
  <p className="text-base">Your message here</p>
  <p className="text-xs mt-1 opacity-70">2:30 PM ✓✓</p>
</div>
```

### Message Bubble - Received
```jsx
<div className="px-4 py-3 rounded-xl bg-surface-tertiary text-primary rounded-bl-sm border border-divider/50">
  <p className="text-base">Their message here</p>
  <p className="text-xs mt-1 text-tertiary">2:31 PM</p>
</div>
```

### Badge
```jsx
<span className="badge-primary">Primary</span>
<span className="badge-success">✓ Success</span>
<span className="badge-warning">! Warning</span>
<span className="badge-error">✕ Error</span>
```

### Status Indicator
```jsx
<div className="online-indicator" />     {/* Green pulse */}
<div className="away-indicator" />       {/* Yellow */}
<div className="offline-indicator" />    {/* Gray */}
```

### Hover Effects
```jsx
className="hover:bg-surface-tertiary hover:border-brand-500 hover:shadow-glow transition-all"
className="group-hover:opacity-100 opacity-0 transition-opacity"
```

### Focus States
```jsx
className="focus:outline-none focus:ring-2 focus:ring-brand-500/40"
className="focus-ring"  {/* Shorthand */}
```

## Animations

```jsx
// Entrance animations (300ms)
animate-fade-in           // Opacity 0→1
animate-slide-in-up       // Y: 12px→0
animate-slide-in-down     // Y: -12px→0
animate-slide-in-left     // X: -12px→0
animate-slide-in-right    // X: 12px→0

// Special animations
animate-message-enter     // 400ms pop effect
animate-pulse-glow        // 2s loop (online indicator)
animate-bounce-subtle     // 2s subtle bounce
animate-typing-pulse      // Typing indicator

// Apply to groups
className="animate-fade-in"
```

## Responsive Design

```jsx
// Mobile-first approach
className="text-sm md:text-base lg:text-lg"

// Hide/Show
className="hidden md:block"     // Show on desktop
className="md:hidden"           // Hide on desktop
className="block md:flex"       // Layout change

// Grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Sidebar collapse pattern
className={`
  fixed md:static
  ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
  transition-transform duration-300
`}
```

## 🎯 Most Used Combos

```jsx
// Premium card
<div className="glass-container p-4 space-y-3">

// Button with icon
<button className="btn-icon hover:text-primary">
  <Icon className="w-5 h-5" />
</button>

// List item with hover action
<div className="group p-3 bg-surface-tertiary/50 hover:bg-surface-tertiary">
  <div className="flex items-center justify-between">
    <span className="text-primary">Label</span>
    <button className="btn-icon-sm opacity-0 group-hover:opacity-100">✕</button>
  </div>
</div>

// Centered modal
<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
  <div className="glass-container max-w-md p-6 animate-slide-in-up">
    {/* Content */}
  </div>
</div>

// Form group
<div className="space-y-2">
  <label className="text-label">Label</label>
  <input className="input-field" />
  <p className="text-xs text-tertiary">Help text</p>
</div>
```

## Size Guide

```jsx
// Avatars
w-8 h-8 rounded-full      // Small
w-10 h-10 rounded-full    // Medium
w-12 h-12 rounded-full    // Large (avatar-base)
w-16 h-16 rounded-full    // Extra Large (avatar-lg)
w-24 h-24 rounded-full    // Profile (avatar-xl)

// Icons
w-4 h-4   // Very small
w-5 h-5   // Standard
w-6 h-6   // Large
w-8 h-8   // Extra large

// Buttons
h-10 w-10       // Icon button (32px)
px-4 py-2       // Text button
px-3 py-1.5     // Small button
```

## Shadows

```jsx
shadow-xs   // Minimal
shadow-sm   // Small
shadow-md   // Medium
shadow-lg   // Large
shadow-xl   // Extra large
shadow-2xl  // Huge

// Special
shadow-glass       // For glass containers
shadow-glass-hover // On hover
shadow-glow        // Brand color glow
shadow-glow-blue   // Blue glow
```

## Border Radius

```jsx
rounded-none    // 0px
rounded-sm      // 8px
rounded-md      // 12px (standard)
rounded-lg      // 16px
rounded-xl      // 20px
rounded-2xl     // 24px
rounded-full    // 9999px (perfect circle)
```

## Duration & Timing

```jsx
duration-150    // Fast (150ms)
duration-200    // Normal (200ms)
duration-300    // Medium (300ms) - default
duration-500    // Slow (500ms)

// Timing functions
ease-out        // Fast start, slow end
ease-in         // Slow start, fast end
ease-in-out     // Smooth both ends
```

## Common Fixes

### Text Too Dark?
```jsx
// ❌ Wrong
className="text-slate-600"

// ✓ Right
className="text-primary"  // Always use tokens
```

### Not Enough Spacing?
```jsx
// ❌ Wrong
<div className="p-1">    // Too tight

// ✓ Right
<div className="p-4">    // 16px standard
```

### Animation Janky?
```jsx
// ❌ Wrong
className="transition-all duration-1000 animate-bounce transform"

// ✓ Right
className="animate-pulse-glow"  // Single smooth animation
```

### Button Not Responsive?
```jsx
// ❌ Wrong
className="btn-primary w-20"   // Fixed width

// ✓ Right
className="btn-primary"        // Adapts to content
```

## Quick Debug

```jsx
// Show element boundaries
className="border border-red-500"

// Show spacing
className="bg-blue-500/20"

// Show padding
className="border border-green-500 p-4"

// Test colors
className="bg-surface-primary"
```

---

**Bookmark this for rapid development!** ⚡

Last Updated: May 31, 2026

