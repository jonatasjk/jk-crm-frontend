# CRM Architecture Decision Record

## Overview

A CRM for managing relationships with **Investors** and **Partners**, featuring
distinct pipelines, material management, email dispatch via Resend, and CSV
import capabilities.

---

## Tech Stack Decisions

### Backend — `../crm-backend`

| Concern | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 20 LTS | LTS stability, native ESM, strong ecosystem |
| Language | TypeScript 5.x | Type-safety across the stack |
| Framework | **Fastify 4** | Fastest Node.js HTTP framework, built-in schema validation, good plugin ecosystem |
| ORM | **Prisma 5** | Excellent TypeScript integration, migrations, generated client |
| Database | PostgreSQL 16 | JSONB support, robust relational model, works well with Prisma |
| File Storage | **Local directory** | Durable object storage for PDFs, Excel, and other materials |
| Email | **Resend** | Cost-effective transactional email, supports raw MIME (attachments) |
| Auth | **JWT** via `@fastify/jwt` | Stateless, easy to integrate, sufficient for internal CRM |
| CSV Parsing | **csv-parse** | Streaming CSV parser, handles large files, good TS types |
| Validation | **Zod** | Schema-first, composable, reusable on frontend too |
| File Upload | **@fastify/multipart** | Fastify native plugin for multipart forms |

### Frontend — `./` (crm-frontend)

| Concern | Choice | Rationale |
|---|---|---|
| Build tool | **Vite 5** | Fast HMR, native ESM, first-class TS/React support |
| UI Library | **React 18** | Mature ecosystem, concurrent features |
| Styling | **Tailwind CSS 3** + **shadcn/ui** | Utility-first, no runtime overhead; shadcn gives accessible, unstyled components |
| State / Data | **TanStack Query v5** | Server-state management, caching, background refetch |
| Routing | **React Router v6** | Industry standard, nested routes |
| Forms | **React Hook Form + Zod** | Performant forms with schema validation |
| Drag & Drop | **@dnd-kit** | Accessible, flexible; powers the Kanban pipeline |
| HTTP Client | **Axios** | Interceptors, easy auth header injection |
| Table | **TanStack Table v8** | Headless, powerful, pairs with shadcn |
| CSV Upload UI | **papaparse** | Client-side CSV preview before import |

---

## Data Model Summary

### Investor
- Core fields: name, email, phone, company, website, linkedinUrl
- Pipeline stage: `PROSPECT → CONTACTED → MEETING → DUE_DILIGENCE → TERM_SHEET → CLOSED_WON → CLOSED_LOST`
- Linked: notes, email logs, materials (pitch decks), tags, activities

### Partner
- Core fields: name, email, phone, company, website, linkedinUrl
- Pipeline stage: `LEAD → QUALIFIED → PROPOSAL → NEGOTIATION → ACTIVE → INACTIVE`
- Linked: notes, email logs, materials, tags, activities

### Material
- name, description, mimeType, size
- Tagged as `INVESTOR` or `PARTNER` type — can be selected when composing emails

### EmailLog
- Recipient entity, subject, body (HTML), attachments (material IDs), SES messageId, status

---

## Pipeline Design

### Investor Pipeline (7 stages)
```
Prospect → Contacted → Meeting Scheduled → Due Diligence → Term Sheet → Closed Won → Closed Lost
```

### Partner Pipeline (6 stages)
```
Lead → Qualified → Proposal Sent → Negotiation → Active → Inactive
```

Both are rendered as **Kanban boards** with drag-and-drop to move cards between stages.

---

## Email Flow

1. User selects a contact (investor/partner) and clicks **Send Email**
2. Compose form lets user pick email template or write custom subject/body (HTML)
3. User attaches materials from the materials library (already uploaded to local directory)
4. Backend:
   a. Fetches material files from local directory
   b. Builds a MIME multipart message
   c. Sends via `SES.sendRawEmail`
   d. Records an `EmailLog` entry with status

---

## CSV Import Flow

1. User downloads an example template CSV
2. User uploads a CSV file
3. Frontend parses headers client-side, shows a field-mapping UI
4. On confirm, sends parsed rows to `POST /investors/import` or `POST /partners/import`
5. Backend validates each row (Zod), upserts on email, returns a summary report

---

## Security Notes

- All file uploads are scanned for MIME type before storage
- Resend.com sending identity must be verified; FROM address is configured via env var
- JWT tokens expire in 8 hours; refresh tokens stored in HTTP-only cookies
- All DB queries go through Prisma (parameterised) — no raw SQL injection risk
- User passwords hashed with **bcrypt** (cost factor 12)

---

## Environment Variables

See `.env.example` in `crm-backend` for all required variables.
