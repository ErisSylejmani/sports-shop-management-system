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

## F0 — Çfarë përfshin

- **Router:** `/login`, dashboard `/`, faqe placeholder për modulet
- **API client:** `src/api/client.ts` (JWT nga `localStorage`)
- **Tema sipas rolit:** Admin/Menaxher = **blu**, Staf (User) = **jeshil**
- **Preview roli:** dropdown në header (heqet kur vjen F1 me `/api/me`)

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
