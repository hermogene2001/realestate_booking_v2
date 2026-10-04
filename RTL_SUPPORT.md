# RTL (Right-to-Left) Support Implementation

## Overview
Complete RTL support for Arabic, Hebrew, and other RTL languages.

## Implementation

### 1. Update `frontend/next.config.js`

```javascript
module.exports = {
  i18n: {
    locales: ['en', 'fr', 'rw', 'sw', 'ar', 'he'],
    defaultLocale: 'en',
    localeDetection: true,
  },
  // Add RTL support
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};
```

### 2. Create RTL Detection Hook

Create `frontend/src/hooks/useRTL.ts`:

```typescript
import { useLanguage } from '../context/LanguageContext';

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export function useRTL() {
  const { language } = useLanguage();
  const isRTL = RTL_LANGUAGES.includes(language);

  return {
    isRTL,
    direction: isRTL ? 'rtl' : 'ltr',
  };
}
```

### 3. Update Layout Component

Update `frontend/src/app/layout.tsx`:

```typescript
import { useRTL } from '../hooks/useRTL';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { direction } = useRTL();

  return (
    <html lang={language} dir={direction}>
      <body className={direction === 'rtl' ? 'rtl' : 'ltr'}>
        {children}
      </body>
    </html>
  );
}
```

### 4. Add RTL CSS

Add to `frontend/src/app/globals.css`:

```css
/* RTL Support */
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .flex-row {
  flex-direction: row-reverse;
}

[dir="rtl"] .ml-auto {
  margin-left: 0;
  margin-right: auto;
}

[dir="rtl"] .mr-auto {
  margin-right: 0;
  margin-left: auto;
}

[dir="rtl"] .space-x-4 > * + * {
  --tw-space-x-reverse: 1;
}

/* Mirror margins and padding for RTL */
[dir="rtl"] .ml-2 { margin-left: 0; margin-right: 0.5rem; }
[dir="rtl"] .ml-4 { margin-left: 0; margin-right: 1rem; }
[dir="rtl"] .mr-2 { margin-right: 0; margin-left: 0.5rem; }
[dir="rtl"] .mr-4 { margin-right: 0; margin-left: 1rem; }
[dir="rtl"] .pl-4 { padding-left: 0; padding-right: 1rem; }
[dir="rtl"] .pr-4 { padding-right: 0; padding-left: 1rem; }

/* Keep some elements LTR even in RTL mode */
[dir="rtl"] .keep-ltr {
  direction: ltr;
  text-align: left;
}
```

### 5. Create RTL-Aware Components

Example: RTL Navigation

```typescript
import { useRTL } from '../hooks/useRTL';

export function Navbar() {
  const { isRTL } = useRTL();

  return (
    <nav className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
      <Logo />
      <NavLinks />
      <UserMenu />
    </nav>
  );
}
```

### 6. Add Arabic Translations

Create `frontend/src/locales/ar.json`:

```json
{
  "common": {
    "home": "الرئيسية",
    "properties": "العقارات",
    "bookings": "الحجوزات",
    "login": "تسجيل الدخول",
    "register": "التسجيل"
  },
  "property": {
    "title": "العنوان",
    "price": "السعر",
    "location": "الموقع",
    "book_now": "احجز الآن"
  }
}
```

### 7. Language Switcher Update

Update language context to include RTL languages:

```typescript
const LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'rw', name: 'Kinyarwanda', dir: 'ltr' },
  { code: 'sw', name: 'Swahili', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'he', name: 'עברית', dir: 'rtl' },
];
```

## Testing RTL

1. Switch to Arabic or Hebrew
2. Verify text alignment
3. Check navigation direction
4. Test forms and inputs
5. Verify icons and arrows are mirrored

## CSS Utilities for RTL

```css
/* Logical properties (modern approach) */
.margin-inline-start { margin-inline-start: 1rem; }
.margin-inline-end { margin-inline-end: 1rem; }
.padding-inline-start { padding-inline-start: 1rem; }
.padding-inline-end { padding-inline-end: 1rem; }

/* Works automatically for both LTR and RTL */
```

## Benefits

✅ **Accessibility** - Supports RTL language users  
✅ **Market Expansion** - Middle East markets  
✅ **Professional** - Complete internationalization  
✅ **User Experience** - Native reading direction  

---

**Status:** Complete Implementation Guide  
**Estimated Time:** 3-4 hours  
**Priority:** Medium - Based on market needs
