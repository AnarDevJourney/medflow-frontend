# MedFlow — Frontend

React client of [MedFlow](https://github.com/AnarDevJourney/medflow-backend), an internal hospital management system. The UI is role-shaped: after login the sidebar and the home page depend on the role (ADMIN, DOCTOR, NURSE, RECEPTIONIST, ACCOUNTANT).

## Stack

| Layer | Library |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| UI | Ant Design 6 (+ CSS Modules for page styles) |
| Server state | TanStack Query |
| UI state | Redux Toolkit (UI only — never server data) |
| Forms | React Hook Form |
| HTTP | Axios (cookies + silent refresh on 401) |
| Routing | React Router 7 |
| Real time | socket.io-client |
| i18n / dates | i18next (AZ / EN / RU) + dayjs (Asia/Baku) |
| Charts / DnD | Recharts, @dnd-kit |

## Getting started

Requirements: Node ≥ 22, the backend running (`./scripts/run-all.sh` in medflow-backend — gateway on `localhost:3000`, Mailpit on `localhost:8025`).

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

The Vite dev server proxies `/api` and `/socket.io` to the gateway (`VITE_GATEWAY_URL`), so the browser only talks to `localhost:5173`: the HttpOnly auth cookies are same-origin and no CORS setup is needed. Invite / reset links in the emails point to `localhost:5173`.

Scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `format`.

## Structure

```
src/
├── main.tsx / App.tsx      # providers: Redux → React Query → saved appearance → AntD (theme, locale, App) → router
├── types/                  # API envelope + shared enums — mirror the backend exactly
├── lib/
│   ├── api/client.ts       # Axios instance: unwraps { success, data }, 401 → one refresh → retry
│   ├── api/errors.ts       # ApiError (status, code, details, fieldErrors) for every failed request
│   ├── api/formErrors.ts   # server VALIDATION_ERROR → React Hook Form field errors
│   ├── queryClient.ts      # React Query defaults (no retry on 4xx); 503 → retry banner
│   ├── dayjs.ts            # UTC from the API → Asia/Baku in the UI
│   ├── i18n/               # i18next + locales/{az,en,ru}.json
│   └── theme/              # appearance → AntD theme + CSS variables (buildTheme), per user
├── store/                  # Redux: UI state only (503 banner, unread badge)
├── styles/                 # global.css: default CSS variables
├── router/                 # routes, PATHS, RequireAuth / RequireRole / PublicOnly guards
├── components/
│   ├── layout/             # AppLayout (sidebar, header, user menu, 503 banner), navigation (roles per entry)
│   ├── data-table/         # DataTable: reusable table with per-user settings
│   └── ui/                 # PageHeader, EmptyState, tags, avatar, form field, password rules, …
├── hooks/ · utils/         # cross-feature hooks and helpers
└── features/<module>/      # one folder per module: pages/ components/ hooks/ services/
```

Conventions: one `services/<x>Service.ts` per module talks to the API, `hooks/` wrap it in React Query; aliases `@components`, `@features`, `@lib`, `@models` (types), `@router`, `@store`, `@styles`, `@hooks`, `@utils`.

## Pages (F1)

| Route | Who | What |
|---|---|---|
| `/login`, `/forgot-password` | public | sign in, request a reset link |
| `/accept-invite?token=` | public | invitation preview → set password → signed in (links from the email) |
| `/reset-password?token=` | public | new password (link from the email) |
| `/` | all | greeting, quick access for the role, service health (ADMIN) |
| `/profile` | all | name, password change, language, appearance |
| `/notifications` | all | own notifications by day, mark read; live via Socket.io (bell + toasts) |
| `/staff` | ADMIN | users: search / filter, invite, edit name & role, resend, deactivate / reactivate |
| `/history` | ADMIN | action history + email log (`?tab=emails`) |

## Build progress

| Step | Status |
|---|---|
| F0 Skeleton: tooling, providers, API client, theme, i18n, layout, system status | ✅ |
| UI settings: sidebar, tables, appearance (configurations-service) | ✅ |
| F1 Auth pages, guards, users, notifications + Socket.io, history (backend phases 2–4) | ✅ |
| F2+ One step per backend module (staff, patients, appointments, visits, billing, files) | — |
