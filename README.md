# Yap 💬

A modern, mobile-first messenger app built with Next.js, Neon (Postgres), and Vercel.

---

## Current Scope (v0.1)

- Welcome / landing page
- User sign-up with email verification
- Sign-in with verified email

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Neon (serverless Postgres) |
| ORM | Prisma (`@prisma/adapter-neon`) |
| Auth | NextAuth.js v5 |
| Deployment | Vercel |

---

## Project Structure

```
yap/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Welcome / landing page  →  /
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx        # Sign-in page           →  /auth/signin
│   │   └── signup/
│   │       └── page.tsx        # Sign-up page           →  /auth/signup
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts    # NextAuth API handler
├── components/
│   └── auth/
│       ├── SignInForm.tsx
│       └── SignUpForm.tsx
├── lib/
│   ├── db.ts                   # Prisma + Neon client
│   └── auth.ts                 # NextAuth config
├── prisma/
│   └── schema.prisma
├── .env                        # Local env vars (never commit)
└── .env.example                # Env var template (safe to commit)
```

---

## Database Schema (v0.1)

```prisma
model User {
  id             String    @id @default(cuid())
  name           String
  email          String    @unique
  emailVerified  DateTime?
  image          String?
  createdAt      DateTime  @default(now())
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

---

## Auth Flow

```
Sign Up
  → User submits name, email, password
  → Account created with emailVerified: null
  → Verification email sent
  → User clicks link in email
  → emailVerified timestamp set
  → Redirected to /auth/signin

Sign In
  → User submits email + password
  → Checked against DB
  → Rejected if emailVerified is null
  → Session created on success
  → Redirected to /chats (future)
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. Add the same variables to your Vercel project under **Settings → Environment Variables**.

```bash
# .env.example

# Neon — use the pooled connection string from your Neon console
DATABASE_URL=""

# Neon — direct connection string (used only by prisma migrate)
DIRECT_URL=""

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET=""

# Your deployed URL (use http://localhost:3000 locally)
NEXTAUTH_URL=""

# Email provider for verification emails (e.g. Resend, SendGrid, Postmark)
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM=""
```

> **Neon note:** Use the **pooled** connection string for `DATABASE_URL` (runtime). Use the **direct** connection string for `DIRECT_URL` (migrations only). Set both in `prisma/schema.prisma`:
>
> ```prisma
> datasource db {
>   provider  = "postgresql"
>   url       = env("DATABASE_URL")
>   directUrl = env("DIRECT_URL")
> }
> ```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/yap.git
cd yap
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Fill in your Neon, NextAuth, and email credentials
```

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add all environment variables from `.env.example` to Vercel's dashboard.
4. Vercel runs `npm run build` automatically — make sure your `package.json` includes Prisma generation:

```json
"scripts": {
  "build": "prisma generate && next build",
  "postinstall": "prisma generate"
}
```

5. Deploy. Vercel handles the rest.

---

## Pages (v0.1)

| Route | Description |
|---|---|
| `/` | Welcome / landing page |
| `/auth/signup` | Create a new account |
| `/auth/signin` | Sign in to an existing account |

---

## Roadmap

- [ ] v0.1 — Welcome page, sign-up, sign-in, email verification
- [ ] v0.2 — Chat list (inbox)
- [ ] v0.3 — Chat room (send & receive messages)
- [ ] v0.4 — Realtime (WebSocket via Pusher)
- [ ] v0.5 — Media uploads, emoji reactions
- [ ] v0.6 — PWA, push notifications, polish

---

## License

MIT