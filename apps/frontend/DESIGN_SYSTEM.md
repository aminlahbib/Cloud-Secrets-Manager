# High-End Dark Mode Design System

## Overview

This design system provides a premium, eye-friendly dark mode experience optimized for long usage sessions. The system uses a layered dark palette with clear elevation levels, semantic color tokens, and smooth micro-interactions.

## Color System

### Elevation Layers (Background Hierarchy)

| Level | Hex | Usage | Contrast Ratio |
|-------|-----|-------|----------------|
| Elevation 0 | `#050608` | Page background | Base layer |
| Elevation 1 | `#0A0D10` | Sidebar, main containers | +5% lighter |
| Elevation 2 | `#0F1316` | Cards, elevated surfaces | +10% lighter |
| Elevation 3 | `#14181C` | Hover states, active cards | +15% lighter |
| Elevation 4 | `#1A1F24` | Pressed states, modals | +20% lighter |

### Semantic Colors

#### Primary Accent (Warm Orange/Amber)
- **Primary**: `#FF8C42` - Primary CTAs, active states, key highlights
- **Hover**: `#FF9D5C` - Hover state
- **Active**: `#E67A35` - Pressed state
- **Glow**: `rgba(255, 140, 66, 0.15)` - Soft glow effects

#### Secondary Accent (Cool Slate)
- **Secondary**: `#6B7F9F` - Secondary actions, icons
- **Hover**: `#7A8FAF` - Hover state
- **Muted**: `#4A5568` - Disabled/secondary elements

#### Status Colors
- **Success**: `#4ADE80` (text) / `rgba(74, 222, 128, 0.12)` (background)
- **Warning**: `#FBBF24` (text) / `rgba(251, 191, 36, 0.12)` (background)
- **Danger**: `#F87171` (text) / `rgba(248, 113, 113, 0.12)` (background)
- **Info**: `#60A5FA` (text) / `rgba(96, 165, 250, 0.12)` (background)

### Text Colors (WCAG AA Compliant)

| Role | Hex | Contrast Ratio | Usage |
|------|-----|----------------|-------|
| Primary | `#E8EAED` | 15.2:1 | Main text, headings |
| Secondary | `#B4B9C0` | 9.8:1 | Secondary text, descriptions |
| Tertiary | `#7C8288` | 6.2:1 | Metadata, captions |
| Disabled | `#4A4F55` | 3.8:1 | Disabled elements |
| Inverse | `#0A0D10` | - | Text on light backgrounds |

### Borders & Dividers

- **Subtle**: `rgba(255, 255, 255, 0.06)` - Default borders
- **Default**: `rgba(255, 255, 255, 0.10)` - Hover borders
- **Strong**: `rgba(255, 255, 255, 0.15)` - Active borders
- **Accent**: `rgba(255, 140, 66, 0.30)` - Accent borders

### Shadows & Glows

- **Small**: `0 1px 2px 0 rgba(0, 0, 0, 0.4)`
- **Medium**: `0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)`
- **Large**: `0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.4)`
- **XL**: `0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 10px 10px -5px rgba(0, 0, 0, 0.3)`
- **Accent Glow**: `0 0 20px rgba(255, 140, 66, 0.15)`

## Typography Scale

| Style | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| Hero | 2.5rem (40px) | 700 | 1.2 | -0.02em | Welcome section title |
| H1 | 2rem (32px) | 700 | 1.25 | -0.01em | Page titles |
| H2 | 1.5rem (24px) | 600 | 1.3 | -0.01em | Section titles |
| H3 | 1.25rem (20px) | 600 | 1.4 | 0 | Subsection titles |
| Body | 1rem (16px) | 400 | 1.5 | 0 | Body text |
| Body Small | 0.875rem (14px) | 400 | 1.5 | 0.01em | Secondary text |
| Caption | 0.75rem (12px) | 400 | 1.5 | 0.02em | Metadata, timestamps |
| Label | 0.875rem (14px) | 500 | 1.4 | 0.01em | Uppercase labels |

## Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Section | 32px (space-y-8) | Between major sections |
| Card | 24px (space-y-6) | Within cards |
| List | 16px (space-y-4) | Between list items |
| Tight | 8px (space-y-2) | Tight spacing |
| Card Padding | 24px (p-6) | Card internal padding |
| Section Padding | 32px (p-8) | Section internal padding |
| Sidebar Padding | 24px 32px (px-6 py-8) | Sidebar padding |

## Component Specifications

### Sidebar Navigation

**Active State:**
- Background: `rgba(255, 140, 66, 0.12)` (accent glow)
- Left border: 3px solid `#FF8C42` (accent primary)
- Text: Primary text color
- Transition: 150ms cubic-bezier

**Hover State:**
- Background: Elevation 2
- Text: Primary text color
- Smooth transition

**Inactive State:**
- Background: Transparent
- Text: Secondary text color
- No border

### Cards

**Default State:**
- Background: Elevation 2
- Border: Subtle border (0.06 opacity)
- Shadow: Medium shadow
- Border radius: 16px (1rem)
- Padding: 24px

**Hover State:**
- Background: Elevation 3
- Border: Default border (0.10 opacity)
- Shadow: Large shadow
- Transform: translateY(-2px)
- Transition: 150ms cubic-bezier

**Pressed State:**
- Background: Elevation 2
- Transform: translateY(0)
- Shadow: Medium shadow

### Buttons

**Primary Button:**
- Background: `#FF8C42`
- Text: Inverse (dark) for contrast
- Shadow: Small shadow
- Hover: Lighter orange + glow + translateY(-1px)
- Active: Darker orange + no transform
- Focus: 2px outline in accent color

**Secondary Button:**
- Background: Elevation 2
- Border: Default border
- Text: Primary text color
- Hover: Elevation 3 + translateY(-1px)
- Active: Elevation 2 + no transform

**Ghost Button:**
- Background: Transparent
- Text: Secondary text color
- Hover: Elevation 2 background + primary text

### Badges/Chips

**Default:**
- Background: Elevation 2
- Border: Subtle border
- Text: Secondary text color

**Primary:**
- Background: Accent glow
- Border: Accent border
- Text: Accent primary color

**Status Badges:**
- Success: Green with soft background
- Warning: Amber with soft background
- Danger: Red with soft background
- All use 12% opacity backgrounds for readability

### Input Fields

**Default:**
- Background: Elevation 1
- Border: Subtle border
- Text: Primary text color
- Placeholder: Tertiary text color

**Focus:**
- Border: Accent primary
- Glow: 3px accent glow ring
- Transition: 150ms

**Hover:**
- Border: Default border

## Micro-Interactions

### Transitions
- **Duration**: 150-200ms for all interactions
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (standard ease)
- **Properties**: All color, transform, and shadow changes

### Hover Effects
- **Cards**: Elevate 2px, increase shadow, lighten background
- **Buttons**: Translate -1px, add glow, lighten color
- **Icons**: Scale 1.05-1.1, change to accent color
- **Links**: Change to accent color, subtle underline

### Focus States
- **Outline**: 2px solid accent color
- **Offset**: 2px from element
- **Glow**: Soft accent glow for inputs
- **Accessibility**: Always visible for keyboard navigation

## Design Principles

### 1. Layered Depth
- Use elevation levels to create clear visual hierarchy
- Each level is 5% lighter than the previous
- Shadows reinforce elevation perception

### 2. Soft Contrast
- Avoid pure black (#000000) and pure white (#FFFFFF)
- Use warm, slightly desaturated colors
- Maintain WCAG AA compliance (4.5:1 minimum)

### 3. Accent Strategy
- Use warm orange/amber sparingly for key actions
- Cool slate for secondary elements
- Status colors are muted but clear

### 4. Calm & Focused
- No overly saturated colors
- Subtle gradients and glows
- Restrained animations

### 5. Professional Tone
- Serious dev/infra tool aesthetic
- Trustworthy and reliable
- Slightly cinematic with ambient effects

## Improvements Over Previous Design

### Readability
- **Before**: 9.8:1 contrast on some text
- **After**: 15.2:1 contrast on primary text (WCAG AAA)
- Improved text hierarchy with clear size/weight distinctions

### Comfort
- **Before**: Harsh black (#0a0a0a) background
- **After**: Softer almost-black (#050608) with warm undertones
- Reduced eye strain with layered elevation system

### Visual Appeal
- **Before**: Flat, single-level dark gray
- **After**: Multi-level elevation with depth and shadows
- Premium feel with subtle glows and ambient effects

### Consistency
- **Before**: Mixed color values across components
- **After**: Centralized CSS custom properties
- Single source of truth for all colors

### Interaction Quality
- **Before**: Basic hover states
- **After**: Smooth micro-interactions with elevation changes
- Clear feedback for all interactive elements

## Usage Examples

### Applying Colors
```tsx
// Use CSS variables
<div style={{ color: 'var(--text-primary)' }}>
  Primary text
</div>

// Or utility classes
<div className="text-primary">
  Primary text
</div>
```

### Creating Cards
```tsx
<div className="card">
  Card content
</div>
```

### Navigation Items
```tsx
<Link className="nav-item nav-item-active">
  Active Item
</Link>
```

### Buttons
```tsx
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Ghost Action</Button>
```

## Browser Support

- Modern browsers with CSS custom properties support
- Graceful degradation for older browsers (light mode fallback)
- All transitions use hardware acceleration where available

