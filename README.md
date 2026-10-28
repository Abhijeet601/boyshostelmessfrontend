# boyshostelmessfrontend

SmartMess frontend for hostel mess attendance: student registration and approval, role-based dashboards, live QR passes, authorized scanning, attendance reports, meal menus, and administration.

Built with React 19, Vite, Tailwind CSS, Framer Motion, Recharts, and html5-qrcode. Requires Node.js 22 and the matching SmartMess FastAPI backend.

## Local development

```sh
npm ci
npm run dev
```

Copy `.env.example` to a local `.env` file. The frontend calls `/api`; Vite forwards these requests to `VITE_PROXY_TARGET`. The supplied configuration targets `https://boyshostelmessbackend-production.up.railway.app`. To use a locally running backend, set `VITE_PROXY_TARGET=http://127.0.0.1:8000`. If no proxy target is configured, localhost is the development default.

## Checks and production build

```sh
npm run lint
npm run build
npm run preview
```

The build output is `dist/`. On Vercel, `vercel.json` forwards `/api/*` to the Railway backend before applying the React page fallback. API responses disable caching. Keep `VITE_API_BASE_URL=/api` for this configuration; the browser uses the frontend's own origin. The remaining paths serve the React application.

On another frontend host, configure the same reverse proxy or set `VITE_API_BASE_URL=https://boyshostelmessbackend-production.up.railway.app/api` before building and allow your frontend origin in the backend's `FRONTEND_ORIGINS`. Local `.env` files are Git-ignored and do not automatically set hosting-platform variables. Camera scanning requires HTTPS or localhost.

Students register from `/register` and track their applications at `/registration/status`. Administrators review applications under Registration Requests. Existing approved users sign in at `/login`. Authentication and permissions are enforced by the backend.

Do not commit local environment files, credentials, `node_modules/`, or `dist/`. Only public configuration belongs in `VITE_` variables because it is included in the browser bundle.
