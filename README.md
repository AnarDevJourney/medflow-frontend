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
├── main.tsx / App.tsx      # providers: Theme → Redux → React Query → AntD (theme, locale, App) → router
├── types/                  # API envelope + shared enums — mirror the backend exactly
├── lib/
│   ├── api/client.ts       # Axios instance: unwraps { success, data }, 401 → one refresh → retry
│   ├── api/errors.ts       # ApiError (status, code, details, fieldErrors) for every failed request
│   ├── queryClient.ts      # React Query defaults (no retry on 4xx)
│   ├── dayjs.ts            # UTC from the API → Asia/Baku in the UI
│   ├── i18n/               # i18next + locales/{az,en,ru}.json
│   └── theme/              # system / light / dark, persisted per browser
├── store/                  # Redux: UI state only (sidebar, …)
├── styles/                 # AntD theme tokens (teal accent) + global.css variables
├── router/                 # routes + PATHS constants
├── components/
│   ├── layout/             # AppLayout (sidebar + header), navigation config (roles per entry)
│   └── ui/                 # shared small components (language / theme switchers, …)
├── hooks/ · utils/         # cross-feature hooks and helpers
└── features/<module>/      # one folder per module: pages/ components/ hooks/ services/
```

Conventions: one `services/<x>Service.ts` per module talks to the API, `hooks/` wrap it in React Query; aliases `@components`, `@features`, `@lib`, `@models` (types), `@router`, `@store`, `@styles`, `@hooks`, `@utils`.

## Build progress

| Step | Status |
|---|---|
| F0 Skeleton: tooling, providers, API client, theme, i18n, layout, system status | ✅ |
| F1 Auth pages, guards, users, notifications + Socket.io, history (backend phases 2–4) | next |
| F2+ One step per backend module (staff, patients, appointments, visits, billing, files) | — |
