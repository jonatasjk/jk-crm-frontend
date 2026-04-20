# JK CRM Frontend

A modern CRM for managing **Investors** and **Partners**, featuring Kanban pipelines, email dispatch with attachments, email sequences, CSV import, materials management, and a daily send-count dashboard.

## Features

- **Investor & Partner pipelines** — drag-and-drop Kanban boards across 7 and 6 stages respectively
- **Email composition** — rich-text editor, HTML email, material attachments, `{{first_name}}` / `{{last_name}}` / `{{name}}` placeholders
- **Email sequences** — automated drip campaigns with per-step delays; enroll individuals or entire lists
- **Materials library** — upload pitch decks and documents (PDF, Excel, etc.) to S3; attach to any outbound email
- **CSV import** — client-side header mapping, field preview, bulk upsert with a per-row result report
- **Dashboard** — stat cards for total investors/partners, active counts, and **emails sent today** (live from server, no cap extrapolation)
- **Auth** — JWT-based login, forgot/reset password flow

## Tech Stack

| Concern | Choice |
|---|---|
| Build tool | Vite 8 |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| Server state | TanStack Query v5 |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |
| Drag & Drop | @dnd-kit |
| HTTP | Axios |
| Rich text | Tiptap |
| CSV parsing | PapaParse |
| Global state | Zustand |

## Getting Started

### Prerequisites

- Node.js 20 LTS
- The `crm-backend` API running (see `../crm-backend`)

### Install & run

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173` by default.

### Environment

Create a `.env` file at the project root:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### Build for production

```bash
npm run build
```

Output goes to `dist/`. The included `nginx.conf` and `Dockerfile` are ready for containerised deployment.

## Project Structure

```
src/
  api/          # Axios API clients (auth, investors, partners, email, sequences, materials)
  components/   # Feature components (email, investors, partners, materials, sequences, shared UI)
  pages/        # Route-level page components
  store/        # Zustand stores (auth)
  types/        # TypeScript models and enums
  utils/        # Shared helpers
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript type-checking without emitting files |

## License

MIT — see [LICENSE](LICENSE).