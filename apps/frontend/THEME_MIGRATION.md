# Theme Management Migration Guide

## Overview

The application has been migrated from class-based dark mode (`dark:` prefixes) to a modern CSS Variables + React Context approach using `data-theme` attribute.

## Benefits

✅ **Single source of truth** - All theme values defined in CSS variables  
✅ **No class duplication** - No need for `dark:` prefixes everywhere  
✅ **Runtime theme switching** - Instant theme changes without page reload  
✅ **Easy to add more themes** - Just add new `[data-theme="theme-name"]` selector  
✅ **Better performance** - Browser-native CSS variable updates  
✅ **Works with any CSS framework** - Pure CSS solution  

## Implementation

### CSS Structure

All theme variables are defined in `index.css`:

```css
/* Light Theme (Default) */
:root {
  --elevation-0: #f9fafb;
  --text-primary: #111827;
  /* ... all other variables */
}

/* Dark Theme */
[data-theme="dark"] {
  --elevation-0: #050608;
  --text-primary: #E8EAED;
  /* ... all other variables */
}
```

### ThemeContext

The `ThemeContext` now sets the `data-theme` attribute on the root element:

```tsx
root.setAttribute('data-theme', theme);
```

### Usage in Components

**Before (class-based):**
```tsx
<div className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white">
  Content
</div>
```

**After (CSS variables):**
```tsx
<div 
  className="card"
  style={{ 
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-primary)' 
  }}
>
  Content
</div>
```

Or use utility classes:
```tsx
<div className="card text-primary">
  Content
</div>
```

## Migration Checklist

### Completed ✅
- [x] CSS variables defined for both themes
- [x] ThemeContext updated to use `data-theme` attribute
- [x] Base components updated (Card, Modal, Input, Button, Badge)
- [x] Layout component updated
- [x] Home page updated
- [x] Projects page updated
- [x] Login page updated

### Remaining (Optional)
- [ ] Update remaining pages (Settings, SecretForm, SecretDetail, etc.)
- [ ] Remove all `dark:` prefixes from components
- [ ] Update any inline styles to use CSS variables

## Adding New Themes

To add a new theme (e.g., "blue"):

1. Add CSS variables in `index.css`:
```css
[data-theme="blue"] {
  --elevation-0: #0a1628;
  --text-primary: #e0e7ff;
  /* ... define all variables */
}
```

2. Update ThemeContext type:
```tsx
type Theme = 'light' | 'dark' | 'blue';
```

3. Add theme selector in Settings page (optional)

## Performance Notes

- CSS variables are updated instantly by the browser
- No re-renders needed for theme changes
- Theme preference is persisted in localStorage
- System preference is detected on first load

## Browser Support

- All modern browsers support CSS custom properties
- Graceful degradation: light theme is default if CSS variables aren't supported

