# POS System

A modern, fast, and secure Point of Sale (POS) system built with Next.js, Tailwind CSS, Prisma, and PostgreSQL. Designed for retail and small businesses to manage inventory, process sales, and track expenses effortlessly.

## Features

- **Dashboard:** Real-time overview of sales, expenses, and net profit.
- **Multi-User Auth:** Secure authentication powered by Better Auth, with Admin and Standard User roles.
- **Point of Sale (POS):** Fast checkout interface with product search and category filtering.
- **Inventory Management:** Full CRUD operations for products, including low-stock indicators and CSV importing.
- **Sales History:** Detailed logs of all transactions with receipt printing and CSV export.
- **Expense Tracking:** Log and categorize daily operational expenses.
- **Reporting:** Visual charts and metrics for revenue, top products, and cashier performance.
- **Dark/Light Mode:** Full theming support via `next-themes`.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (via Neon/Supabase)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [Better Auth](https://better-auth.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)

## Getting Started

### Prerequisites
- Node.js 18+ or Bun (Recommended)
- PostgreSQL Database (Local or Cloud)

### 1. Clone the repository
```bash
git clone https://github.com/sirrryasir/pos.git
cd pos
```

### 2. Install dependencies
```bash
bun install
```

### 3. Environment Variables
Copy the template and fill it in. `env.example` documents every variable the
app reads, required and optional:
```bash
cp env.example .env
openssl rand -base64 32   # paste into BETTER_AUTH_SECRET
```

### 4. Database Setup & Seeding
Apply the migrations and seed initial data (including the default Admin account):
```bash
bun run db:migrate
bun run db:seed
```

*Default Admin Account:*
- **Email:** admin@pos.com
- **Password:** password123

### 5. Start the Development Server
```bash
bun dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to access the system.

## Deployment

The app is deployed on **Vercel**, with Postgres hosted separately on Railway.

### Environment variables
Set these in *Vercel → Project → Settings → Environment Variables*, for the
Production environment (and Preview, if you use preview deployments):

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Railway's **public** url (`DATABASE_PUBLIC_URL` in the Railway Variables tab) — Vercel connects from outside Railway's private network |
| `BETTER_AUTH_SECRET` | 32+ random bytes: `openssl rand -base64 32`. Better Auth refuses to start without it |
| `BETTER_AUTH_URL` | The deployed origin, no trailing slash, e.g. `https://your-domain.com` |

Everything else in `env.example` is optional. Notably, no origin allowlist
needs maintaining: Vercel serves the app from its own origin, which both Next
and Better Auth trust automatically.

### Migrations
`bun run build` runs `prisma migrate deploy` before `next build`, so every
deploy applies pending migrations before the code that depends on them goes
live. To add one:

```bash
# edit prisma/schema.prisma, then:
npx prisma migrate dev --name describe_the_change
```

Commit the generated folder under `prisma/migrations`. Never run
`prisma db push` against production — it changes the schema without recording
a migration, and the next deploy will not know what happened.

### Seeding
Seeding is deliberately **not** part of the build. The seed creates
`admin@pos.com` / `password123`, which is fine for a local database and an open
door on a public one. After the first deploy, sign in with it once and
immediately change the password — or create your own owner account and delete
the seeded one.

## Usage Guide
- **Login:** Use the default admin account to log in.
- **Manage Users:** Navigate to `Management > Users` to elevate new accounts to `admin` status.
- **Import Inventory:** Go to Inventory, click "Import CSV", and upload a list of products.
- **Checkout:** Use the POS page to process sales quickly.

## License
This project is proprietary and confidential.
