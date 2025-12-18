# Copilot / AI agent instructions — VenueOS

Short, actionable guidance to get productive in this repository.

1) Quick architecture
- App: `src/app/` uses Next.js App Router. UI pages and API routes live under this folder.
- Admin UI: `src/app/admin/` contains admin pages and client/server components.
- Components: `src/components/` reusable UI + editor pieces (e.g., `PlayerEngine.tsx`).
- Server helpers: `src/lib/` holds shared logic:
  - `db.ts` — single `prisma` export for DB access.
  - `broadcaster.ts` — in-memory EventEmitter pub/sub (dev only).
  - `matrix.ts` — crop/matrix math used by multi-screen compositions.
- API: routes under `src/app/api/*` (e.g., `upload-url`, `upload-chunk`, `complete-upload`, `timecode`).

2) Data layer
- Prisma is used; schema at `prisma/schema.prisma` (SQLite by default via `DATABASE_URL`).
- Migrations live in `prisma/migrations/` and a seed script exists at `prisma/seed.js`.
- Use the repo's `prisma` client from `src/lib/db.ts` (do not create ad-hoc new PrismaClients in long-lived server code).

3) Developer workflows & commands
- Start dev server: `npm run dev` (uses `next dev`).
- Build: `npm run build` then `npm run start` for production.
- Prisma migrations: run `npx prisma migrate dev --name <desc>` and to seed run `node prisma/seed.js` (seed is a plain Node script in `prisma/seed.js`).
- DB config: ensure `DATABASE_URL` in `.env` (e.g. `file:./dev.db` for local SQLite).

4) Important conventions & patterns
- Server actions + API: application logic lives in `src/app/actions/*` and API routes — prefer calling `prisma` from `src/lib/db.ts`.
- Real-time: `src/lib/broadcaster.ts` is an in-memory EventEmitter — this is intentional for single-process/dev. For multi-process or production, replace with Redis/pubsub.
- File uploads: uploaded files are stored under `public/uploads/` and served at `/uploads/*`. `next.config.ts` sets cache headers for that path.
- Canvas/native deps: `next.config.ts` includes `serverExternalPackages: ["canvas"]` — expect native build steps when installing on CI or deployment images.

5) Integration points & cross-component flows
- Upload flow: client requests `api/upload-url` → uploads chunks to the server endpoints (`upload-chunk`, `complete-upload`) → server moves file to `public/uploads/` and updates `Content` records in Prisma.
- Playback: `PlayerEngine.tsx` + `Player` components read `Playlist`/`Content` data (Prisma models: `Playlist`, `Content`, `PlaylistEntry`) and use `Timecode` for synchronized playback.
- Matrix displays: screens use `matrixRow`/`matrixCol` fields (see `prisma/schema.prisma`) and `src/lib/matrix.ts` provides crop logic.

6) What to watch for when changing code
- Avoid changing in-memory broadcaster to a global stateful store without considering multi-process concerns (use feature flags or clear comments).
- When adding new native deps (e.g., `canvas`), update CI and deployment images to install system packages.
- Keep Prisma client usage centralized in `src/lib/db.ts` to avoid connection explosion in dev servers.

7) Example snippets
- Import prisma in server code:

```ts
import { prisma } from '../../lib/db';
// or from project-root-aware path: src/lib/db
```

- Call broadcaster:

```ts
import broadcaster from '../../lib/broadcaster';
broadcaster.notify('screens:update', { screenId, status });
```

8) Files to inspect for deeper context
- `README.md`, `package.json`, `next.config.ts`
- `prisma/schema.prisma`, `prisma/seed.js`, `prisma/migrations/`
- `src/app/actions/`, `src/app/api/`, `src/components/`, `src/lib/`

If any part of the runtime environment (Docker/CI variables, secrets, deployment details) is missing from this file, tell me what to add and I will iterate. Ready to adjust wording or add examples you want surfaced first.
