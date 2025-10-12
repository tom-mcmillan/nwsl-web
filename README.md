## Getting Started

Install dependencies and generate the Prisma client:

```bash
npm install
DATABASE_URL="postgresql://placeholder" npx prisma generate
```

Run the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the dashboard.

### Required Environment Variables

Create an `.env.local` file and populate the following keys:

```
# Backend API
NWSL_API_BASE_URL=http://127.0.0.1:8080
NWSL_API_KEY=your-api-key
NWSL_PANEL_ADMIN_TOKEN=local-panel-admin-secret

# Database & NextAuth
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NEXTAUTH_SECRET=generate-a-long-random-string
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=google-oauth-client-id
GOOGLE_CLIENT_SECRET=google-oauth-client-secret

# Stripe Billing (optional)
# Temporarily not required while NWSL Pro access is complimentary.
```

The panel admin token must match the `PANEL_ADMIN_TOKEN` configured on the Flask API. Google OAuth is required for sign-in. Billing is paused—every authenticated user is treated as NWSL Pro during early access.

### Database Migrations

```
npx prisma migrate deploy
```

This project expects a Postgres database. Prisma manages the `users`, `accounts`, `sessions`, and `subscriptions` tables used by NextAuth (Stripe support can be re-enabled later).
