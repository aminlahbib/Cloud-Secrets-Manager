/** @type {import('tailwindcss').Config} */
export default {
  // Use selector-based dark mode to work with data-theme attribute
  darkMode: ['selector', '[data-theme*="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Map CSS variables to Tailwind colors for theme-aware utilities
      colors: {
        // Text colors
        'theme-primary': 'var(--text-primary)',
        'theme-secondary': 'var(--text-secondary)',
        'theme-tertiary': 'var(--text-tertiary)',
        'theme-disabled': 'var(--text-disabled)',
        'theme-inverse': 'var(--text-inverse)',
        
        // Elevation backgrounds
        'elevation-0': 'var(--elevation-0)',
        'elevation-1': 'var(--elevation-1)',
        'elevation-2': 'var(--elevation-2)',
        'elevation-3': 'var(--elevation-3)',
        'elevation-4': 'var(--elevation-4)',
        
        // Accent colors
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        
        // Status colors
        'status-success': 'var(--status-success)',
        'status-warning': 'var(--status-warning)',
        'status-danger': 'var(--status-danger)',
        'status-info': 'var(--status-info)',
        
        // Border colors
        'border-subtle': 'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'border-strong': 'var(--border-strong)',
        'border-accent': 'var(--border-accent)',
      },
      backgroundColor: {
        'page': 'var(--page-bg)',
        'card': 'var(--card-bg)',
        'sidebar': 'var(--sidebar-bg)',
        'overlay': 'var(--overlay-bg)',
        'overlay-light': 'var(--overlay-bg-light)',
        'table-header': 'var(--table-header-bg)',
        'table-body': 'var(--table-body-bg)',
      },
      textColor: {
        'theme-primary': 'var(--text-primary)',
        'theme-secondary': 'var(--text-secondary)',
        'theme-tertiary': 'var(--text-tertiary)',
        'theme-disabled': 'var(--text-disabled)',
        'theme-inverse': 'var(--text-inverse)',
      },
      borderColor: {
        'theme-subtle': 'var(--border-subtle)',
        'theme-default': 'var(--border-default)',
        'theme-strong': 'var(--border-strong)',
        'theme-accent': 'var(--border-accent)',
      },
      boxShadow: {
        'theme-sm': 'var(--shadow-sm)',
        'theme-md': 'var(--shadow-md)',
        'theme-lg': 'var(--shadow-lg)',
        'theme-xl': 'var(--shadow-xl)',
      },
    },
  },
  plugins: [
    // Custom plugin for additional theme utilities
    function({ addUtilities }) {
      addUtilities({
        // Text color utilities
        '.text-theme-primary': { color: 'var(--text-primary)' },
        '.text-theme-secondary': { color: 'var(--text-secondary)' },
        '.text-theme-tertiary': { color: 'var(--text-tertiary)' },
        '.text-theme-disabled': { color: 'var(--text-disabled)' },
        '.text-theme-inverse': { color: 'var(--text-inverse)' },
        
        // Background utilities
        '.bg-elevation-0': { backgroundColor: 'var(--elevation-0)' },
        '.bg-elevation-1': { backgroundColor: 'var(--elevation-1)' },
        '.bg-elevation-2': { backgroundColor: 'var(--elevation-2)' },
        '.bg-elevation-3': { backgroundColor: 'var(--elevation-3)' },
        '.bg-elevation-4': { backgroundColor: 'var(--elevation-4)' },
        '.bg-card': { backgroundColor: 'var(--card-bg)' },
        '.bg-sidebar': { backgroundColor: 'var(--sidebar-bg)' },
        '.bg-page': { backgroundColor: 'var(--page-bg)' },
        '.bg-overlay': { backgroundColor: 'var(--overlay-bg)' },
        '.bg-overlay-light': { backgroundColor: 'var(--overlay-bg-light)' },
        
        // Border utilities
        '.border-theme-subtle': { borderColor: 'var(--border-subtle)' },
        '.border-theme-default': { borderColor: 'var(--border-default)' },
        '.border-theme-strong': { borderColor: 'var(--border-strong)' },
        '.border-theme-accent': { borderColor: 'var(--border-accent)' },
        
        // Shadow utilities
        '.shadow-theme-sm': { boxShadow: 'var(--shadow-sm)' },
        '.shadow-theme-md': { boxShadow: 'var(--shadow-md)' },
        '.shadow-theme-lg': { boxShadow: 'var(--shadow-lg)' },
        '.shadow-theme-xl': { boxShadow: 'var(--shadow-xl)' },
      });
    },
  ],
}

