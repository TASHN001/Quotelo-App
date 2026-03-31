export const designSystem = {
  // Material Surface Layers
  surfaces: {
    base: {
      light: 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50',
      dark: 'dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'
    },
    raised: {
      light: 'bg-gradient-to-b from-white to-gray-50',
      dark: 'dark:bg-gradient-to-b dark:from-gray-800 dark:to-gray-850',
      shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]',
      darkShadow: 'dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]'
    },
    inset: {
      light: 'bg-gradient-to-b from-gray-100 to-white',
      dark: 'dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800',
      shadow: 'shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)]',
      darkShadow: 'dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(0,0,0,0.3)]'
    },
    floating: {
      light: 'bg-white',
      dark: 'dark:bg-gray-800',
      shadow: 'shadow-[0_8px_24px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
      darkShadow: 'dark:shadow-[0_8px_24px_rgba(0,0,0,0.6),0_4px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]'
    }
  },

  // Elevation System (Soft Shadows)
  elevation: {
    0: '',
    1: 'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.3)]',
    2: 'shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.3)]',
    3: 'shadow-[0_4px_16px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.3)]',
    4: 'shadow-[0_8px_24px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.4)]'
  },

  // Button States (Tactile Convex)
  button: {
    primary: {
      base: 'bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600',
      hover: 'hover:from-orange-450 hover:via-orange-550 hover:to-orange-650',
      active: 'active:from-orange-600 active:via-orange-600 active:to-orange-500',
      shadow: 'shadow-[0_4px_12px_rgba(249,115,22,0.3),0_2px_4px_rgba(249,115,22,0.2),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.1)]',
      hoverShadow: 'hover:shadow-[0_6px_16px_rgba(249,115,22,0.35),0_3px_6px_rgba(249,115,22,0.25),inset_0_1px_0_rgba(255,255,255,0.3)]',
      activeShadow: 'active:shadow-[0_2px_6px_rgba(249,115,22,0.25),inset_0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(0,0,0,0.15)]'
    },
    secondary: {
      base: 'bg-gradient-to-b from-gray-50 via-white to-gray-100',
      dark: 'dark:bg-gradient-to-b dark:from-gray-700 dark:via-gray-750 dark:to-gray-800',
      hover: 'hover:from-gray-100 hover:via-gray-50 hover:to-gray-150',
      darkHover: 'dark:hover:from-gray-650 dark:hover:via-gray-700 dark:hover:to-gray-750',
      active: 'active:from-gray-150 active:via-gray-100 active:to-gray-100',
      darkActive: 'dark:active:from-gray-800 dark:active:via-gray-800 dark:active:to-gray-750',
      shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(0,0,0,0.05)]',
      darkShadow: 'dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]',
      hoverShadow: 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
      activeShadow: 'active:shadow-[0_1px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(0,0,0,0.06)]'
    }
  },

  // Input States (Inset Depth)
  input: {
    base: 'bg-gradient-to-b from-gray-100 via-white to-white',
    dark: 'dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-850 dark:to-gray-850',
    shadow: 'shadow-[inset_0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)]',
    darkShadow: 'dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(0,0,0,0.3)]',
    focus: 'focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.08),0_0_0_3px_rgba(249,115,22,0.15),0_1px_0_rgba(255,255,255,0.8)]',
    darkFocus: 'dark:focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_0_0_3px_rgba(249,115,22,0.25)]'
  },

  // Card Surfaces
  card: {
    base: 'bg-gradient-to-b from-white via-white to-gray-50',
    dark: 'dark:bg-gradient-to-b dark:from-gray-800 dark:via-gray-800 dark:to-gray-850',
    shadow: 'shadow-[0_2px_12px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]',
    darkShadow: 'dark:shadow-[0_2px_12px_rgba(0,0,0,0.5),0_1px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]',
    hover: 'hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]',
    darkHover: 'dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.6),0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]'
  },

  // Status Badges (Physical Depth)
  badge: {
    success: {
      bg: 'bg-gradient-to-b from-green-100 via-green-50 to-green-100',
      darkBg: 'dark:bg-gradient-to-b dark:from-green-900/40 dark:via-green-900/30 dark:to-green-900/40',
      text: 'text-green-700',
      darkText: 'dark:text-green-400',
      shadow: 'shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.05)]',
      darkShadow: 'dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]'
    },
    warning: {
      bg: 'bg-gradient-to-b from-yellow-100 via-yellow-50 to-yellow-100',
      darkBg: 'dark:bg-gradient-to-b dark:from-yellow-900/40 dark:via-yellow-900/30 dark:to-yellow-900/40',
      text: 'text-yellow-700',
      darkText: 'dark:text-yellow-400',
      shadow: 'shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.05)]',
      darkShadow: 'dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]'
    },
    error: {
      bg: 'bg-gradient-to-b from-red-100 via-red-50 to-red-100',
      darkBg: 'dark:bg-gradient-to-b dark:from-red-900/40 dark:via-red-900/30 dark:to-red-900/40',
      text: 'text-red-700',
      darkText: 'dark:text-red-400',
      shadow: 'shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.05)]',
      darkShadow: 'dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]'
    },
    info: {
      bg: 'bg-gradient-to-b from-blue-100 via-blue-50 to-blue-100',
      darkBg: 'dark:bg-gradient-to-b dark:from-blue-900/40 dark:via-blue-900/30 dark:to-blue-900/40',
      text: 'text-blue-700',
      darkText: 'dark:text-blue-400',
      shadow: 'shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.05)]',
      darkShadow: 'dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]'
    },
    neutral: {
      bg: 'bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100',
      darkBg: 'dark:bg-gradient-to-b dark:from-gray-700 dark:via-gray-750 dark:to-gray-700',
      text: 'text-gray-700',
      darkText: 'dark:text-gray-300',
      shadow: 'shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.05)]',
      darkShadow: 'dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]'
    }
  },

  // Border Radius System
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full'
  },

  // Animation Timing (Spring-based)
  transition: {
    fast: 'transition-all duration-150 ease-out',
    base: 'transition-all duration-200 ease-out',
    slow: 'transition-all duration-300 ease-out',
    spring: 'transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'transition-all duration-400 cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },

  // Frosted Glass Effect
  glass: {
    light: 'bg-white/80 backdrop-blur-xl',
    dark: 'dark:bg-gray-800/80 dark:backdrop-blur-xl',
    shadow: 'shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)]',
    darkShadow: 'dark:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]'
  },

  // Typography Scale
  typography: {
    h1: 'text-3xl sm:text-4xl font-bold tracking-tight',
    h2: 'text-2xl sm:text-3xl font-bold tracking-tight',
    h3: 'text-xl sm:text-2xl font-semibold tracking-tight',
    h4: 'text-lg sm:text-xl font-semibold',
    body: 'text-base leading-relaxed',
    bodyLarge: 'text-lg leading-relaxed',
    bodySmall: 'text-sm leading-relaxed',
    caption: 'text-xs font-medium tracking-wide',
    numeric: 'font-semibold tabular-nums tracking-tight'
  }
};

// Helper function to combine design system classes
export function ds(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
