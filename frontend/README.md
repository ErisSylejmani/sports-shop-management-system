# Sports Shop — Frontend

React + Vite + TypeScript + Tailwind CSS v4.

## Nisja

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Hapni http://localhost:5173 (ose portin që tregon Vite). Sigurohuni që backend-i është aktiv dhe CORS lejon origjinën e frontend-it.

## F0 — Scaffold

- **Router:** `/login`, dashboard `/`, faqe placeholder për modulet
- **API client:** `src/api/client.ts` (JWT nga `localStorage`)
- **Tema sipas rolit:** Admin/Menaxher = **blu**, Staf (User) = **jeshil**

## F1 — Auth

- **Login:** `POST /api/auth/login` → token në `localStorage`
- **Profili:** `GET /api/me` → `roles`, `punetorId`, `isStaff`, `punetorEmri`
- **Rrugë të mbrojtura:** pa token → `/login`; i loguar në `/login` → `/`
- **Logout:** butoni «Dil» + `POST /api/auth/logout`

## Struktura

```
src/
  api/           # client HTTP
  auth/          # token, role
  components/    # UI + layout
  config/        # navigim sidebar
  context/       # RoleThemeProvider
  pages/         # faqet
  theme/         # ngjyrat për rol
```

## Commit

`feat(frontend): F0 scaffold UI, router dhe API client`
