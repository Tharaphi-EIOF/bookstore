# Frontend Structure

This frontend follows a feature-first structure.

## Rules

1. Put app startup and route composition in `src/app`.
2. Put product/domain code in `src/features/<feature>`.
3. Keep `src/components` for only truly shared cross-feature UI.
4. Keep `src/lib` for app-wide utilities, not feature-specific helpers.
5. Keep `src/hooks` for app-wide reusable hooks.
6. Keep `src/store` for global client state only.

## Current Shape

```txt
src/
  app/              # bootstrap, providers, routing
  components/       # shared-only UI: layout, ui, guards, admin-shared
  features/
    admin/
    auth/
    blog/
    book-reader/
    books/
    commerce/
    cs/
    home/
    library/
    notifications/
    profile/
    site/
    support/
  hooks/            # global reusable hooks
  lib/              # global helpers and infrastructure
  store/            # Zustand stores and global state
```

## Placement Guide

Use these rules when adding files:

- If only one feature uses it, keep it inside that feature.
- If multiple unrelated features use it, move it to shared `components`, `hooks`, or `lib`.
- Pages belong under `features/<feature>/pages`.
- Feature-only components belong under `features/<feature>/components`.
- Feature-specific types/constants stay inside the feature.

## Shared Folders

These are intended to stay shared:

- `src/components/ui`
- `src/components/layout`
- `src/components/guards`
- `src/components/admin` for admin-wide reusable building blocks

## Examples

- Book list page:
  `src/features/books/pages/BooksPage.tsx`
- Blog write experience:
  `src/features/blog/write/BlogWritePage.tsx`
- Profile settings page:
  `src/features/profile/settings/pages/ProfileSettingsPage.tsx`
- Shared navbar:
  `src/components/layout/Navbar.tsx`

## Avoid

- Putting new feature pages in a generic top-level `pages/` folder
- Keeping feature-only components in top-level `components/`
- Moving everything to shared too early

Prefer local ownership first, shared extraction second.
