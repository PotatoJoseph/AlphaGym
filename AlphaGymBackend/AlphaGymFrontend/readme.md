# AlphaGym Frontend (Neon UI)

## Run
1. Delete old dependencies (recommended if this zip was moved between OS):
   - remove `node_modules` and `package-lock.json`
2. Install:
   - `npm install`
3. Start dev server:
   - `npm run dev`

## Configure API
Set the backend base URL in `.env`:
`VITE_API_BASE_URL="http://localhost:8000/api"`

## Routes
- `/login` (neon login)
- `/app/dashboard` (overview + door control)
- `/app/sales` (daily/weekly/monthly totals + drill-down)
- `/app/doors` (door panel)