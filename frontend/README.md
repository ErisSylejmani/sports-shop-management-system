# Frontend — Sportix (React)

Faqja e dyqanit tonë sportiv: dashboard, katalog, shitje, kthime, furnitorë, etj. E kemi ndërtuar me ReactJS dhe Tailwind CSS

Backend-i duhet të jetë aktiv — pa API, login dhe të dhënat nuk vijnë.

## Nisja (hapat që bëjmë ne)


cd frontend
cp .env.example .env
npm install
npm run dev


Hapni **https://localhost:5173** (Vite përdor HTTPS në dev — shihni URL-n që printon terminali).

> **Gabim “unsupported protocol” në browser?**  
> - Mos hapni `https://localhost:5079` (aty është vetëm HTTP). API HTTPS = **7051**.  
> - Mos hapni `http://localhost:5173` kur Vite është HTTPS.  
> - Rinisni `npm run dev` pas ndryshimeve në `vite.config.ts`.

Në `.env`:

```env
VITE_API_URL=http://localhost:5079
```

Nëse API-ja është në port tjetër, ndryshoni vetëm këtë rresht.

## Si duket aplikacioni

### Tema sipas rolit

- **Admin / Manager** — kalter
- **Staf (User)** — gjelbert




### Auth

- Login → `POST /api/auth/login` → token në `localStorage`
- `GET /api/me` → emër, rolet, `punetorId`, `isStaff`
- Pa token → ridrejtim në `/login`
- Logout → pastron token-in

Kodi: `src/api/client.ts`, `src/components/auth/`, `src/auth/`.

## Struktura e kodit

```
src/
  api/           # thirrjet HTTP drejt backend-it
  auth/          # token, role, lejet
  components/    # UI, layout (AppLayout, sidebar…)
  config/        # navigimi në sidebar
  context/       # RoleThemeProvider
  pages/         # një faqe për modul
  theme/         # ngjyrat sipas rolit
```

Komponentët e përbashkët (butona, tabela, alerte) janë në `components/ui/` — i njëjti stil në të gjitha faqet.

Stafi: shumica e faqeve janë **vetëm lexim** për katalog; shkrimi kryesor është te shitjet dhe kthimet.

## Build për production

```bash
npm run build
```

