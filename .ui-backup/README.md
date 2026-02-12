# UI Backup — Pre-shadcn Migration

Respaldo creado el 2026-02-09 antes de migrar componentes custom a shadcn/ui.

## Archivos respaldados

```
.ui-backup/
├── components/
│   ├── layout/
│   │   ├── app-sidebar.tsx        ← sidebar custom con nav groups
│   │   ├── breadcrumbs.tsx        ← breadcrumbs custom con ChevronRight
│   │   ├── header.tsx             ← header con MobileSidebar integrado
│   │   ├── mobile-sidebar.tsx     ← overlay slide-in manual
│   │   └── user-nav.tsx           ← avatar initials + logout directo
│   └── shared/
│       └── confirm-dialog.tsx     ← modal custom con focus trap manual
├── app-auth-layout/
│   └── layout.tsx                 ← auth layout con canvas animado
├── app-auth-login/
│   └── page.tsx                   ← login con glassmorphism y orbes JS
└── layout.tsx                     ← dashboard layout
```

## Para restaurar

Copiar cada archivo de vuelta a su ubicación original:

```bash
cp .ui-backup/components/shared/confirm-dialog.tsx src/components/shared/
cp .ui-backup/components/layout/*.tsx src/components/layout/
cp .ui-backup/app-auth-login/page.tsx 'src/app/(auth)/login/'
cp .ui-backup/app-auth-layout/layout.tsx 'src/app/(auth)/'
cp .ui-backup/layout.tsx src/app/dashboard/
```
