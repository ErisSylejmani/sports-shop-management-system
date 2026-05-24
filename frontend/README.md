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

## F1 — Auth (e përfunduar)

| Kërkesa | Status |
|---------|--------|
| Login → `POST /api/auth/login`, token në localStorage | ✅ |
| `GET /api/me` → roles, punetorId, isStaff | ✅ |
| `ProtectedRoute` → `/login` pa token | ✅ |
| `RoleBasedHome` → dashboard për të gjithë rolet | ✅ |
| Logout → hiq token, `/login` | ✅ |
| AppLayout → emri nga `/api/me`, butoni Dil | ✅ |
| `api/client.ts` → `Authorization: Bearer` | ✅ |

Commit: `feat(frontend): F1 login dhe rrugë të mbrojtura`

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
