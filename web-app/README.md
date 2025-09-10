## Frequency Chat – Web App (React + TypeScript + Vite)

Production‑ready frontend for the Frequency Chat application.

### Tech stack

- **React 19** + **TypeScript** with **Vite 7**
- **Tailwind CSS v4** + shadcn/ui components (Radix UI)
- **React Router 7**
- **Clerk** for auth and theming
- **Socket.IO Client** for realtime messaging
- **Zustand** for local state

### Prerequisites

- Node.js 18+ (recommended)
- A running backend API (defaults to `http://localhost:3000`)
- Clerk publishable key

### Environment variables

Create a `.env.local` in this `web-app` folder:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
# Base URL for both API proxy and Socket.IO client
VITE_API_URL=http://localhost:3000
```

Required by:

- `src/main.tsx` – `VITE_CLERK_PUBLISHABLE_KEY`
- `src/contexts/SocketProvider.tsx` – `VITE_API_URL` (Socket.IO)
- `vite.config.ts` – dev server proxy for `/api` → `VITE_API_URL`

### Install & run

```bash
pnpm i   # or npm i / yarn
pnpm dev # or npm run dev / yarn dev
```

Build & preview:

```bash
pnpm build   # type-check + vite build → dist/
pnpm preview # serve the production build locally
```

Lint:

```bash
pnpm lint
```

### Dev server proxy

All frontend API calls use relative paths like `/api/...` (see `src/lib/api.ts`).
`vite.config.ts` proxies `/api` to `VITE_API_URL` in development. Ensure your backend is running and CORS is configured for production deployments.

### Realtime sockets

`SocketProvider` connects to `VITE_API_URL` via Socket.IO and emits/listens for:

- `event:message`, `message`
- `create:group`, `delete:conversation`
- `typing:start`, `typing:stop`

### Scripts

Defined in `package.json`:

- `dev` – start Vite dev server
- `build` – TypeScript build + Vite production build
- `preview` – preview built app
- `lint` – run ESLint

### Project structure (high level)

- `src/components/ui/*` – shadcn/ui primitives
- `src/components/chat/*` – chat UI (messages, input, typing, etc.)
- `src/contexts/*` – theme, sockets, chat store
- `src/lib/*` – API helpers, utils
- `src/pages/ChatPage.tsx` – main chat page

### Bundle analysis (optional)

`rollup-plugin-visualizer` is enabled; after a build, open the generated report (e.g. `stats.html`) to inspect bundle composition.

### Notes

- Update favicon/logos in `public/` as needed.
- The production build outputs to `dist/` (also used by the root server if you serve static files).
- Keep `.env.local` out of version control.
