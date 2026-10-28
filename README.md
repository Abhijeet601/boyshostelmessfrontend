# boyshostelmessfrontend

SmartMess frontend for hostel mess attendance: student registration and approval, role-based dashboards, live QR passes, authorized scanning, attendance reports, meal menus, and administration.

Built with React 19, Vite, Tailwind CSS, Framer Motion, Recharts, and html5-qrcode. Requires Node.js 22 and the matching SmartMess FastAPI backend.

## Local development

```sh
npm ci
npm run dev
```

Vite proxies `/api` to `http://127.0.0.1:8000` by default. Start the backend separately. To use another local backend, set `VITE_PROXY_TARGET` in a local `.env` file. See `.env.example`.

## Checks and production build

```sh
npm run lint
npm run build
npm run preview
```

The build output is `dist/`. For a separately hosted backend, set `VITE_API_BASE_URL=https://your-backend.example/api` before building. Otherwise the production host must proxy `/api` to the backend. Configure the backend to allow your frontend origin. Camera scanning requires HTTPS or localhost.

Students register from `/register` and track their applications at `/registration/status`. Administrators review applications under Registration Requests. Existing approved users sign in at `/login`. Authentication and permissions are enforced by the backend.

Do not commit local environment files, credentials, `node_modules/`, or `dist/`. Only public configuration belongs in `VITE_` variables because it is included in the browser bundle.
