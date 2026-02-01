# Vercel Deployment Guide

## Database Setup for Vercel

### Option 1: Vercel Postgres (Recommended)

1. **Create Vercel Postgres Database:**
   - Go to your Vercel project dashboard
   - Navigate to the "Storage" tab
   - Click "Create Database" → Select "Postgres"
   - Choose a name for your database (e.g., "tide-db")
   - Select a region close to your users
   - Click "Create"

2. **Get Connection String:**
   - After creation, go to the database settings
   - Copy the "Connection String" (it will look like: `postgres://default:password@host:5432/verceldb`)
   - This is your `DATABASE_URL`

3. **Set Environment Variables in Vercel:**
   - Go to your project → Settings → Environment Variables
   - Add the following:
     ```
     DATABASE_URL=postgres://default:password@host:5432/verceldb
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
     CLERK_SECRET_KEY=sk_test_...
     ```
   - Make sure to set these for **Production**, **Preview**, and **Development** environments

4. **Run Migrations:**
   - After deployment, you'll need to run Prisma migrations
   - You can do this via Vercel's CLI or add a build script:
   ```bash
   # In package.json, add to scripts:
   "postinstall": "prisma generate && prisma db push"
   ```
   - Or run manually after first deployment:
   ```bash
   npx vercel env pull .env.local
   npx prisma db push
   ```

### Option 2: External PostgreSQL (Supabase, Neon, etc.)

1. **Create Database:**
   - Sign up for Supabase (https://supabase.com) or Neon (https://neon.tech)
   - Create a new project/database
   - Get the connection string

2. **Set Environment Variables:**
   - Same as above, but use your external database connection string

3. **Run Migrations:**
   - Connect to your database and run:
   ```bash
   npx prisma db push
   ```

## Deployment Steps

1. **Push to GitHub** (already done)

2. **Connect to Vercel:**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository: `nnnoahhhill/everyday`
   - Vercel will auto-detect Next.js

3. **Configure Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Add Environment Variables:**
   - Add all required env vars (see above)
   - Make sure `DATABASE_URL` is set correctly

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

6. **Run Database Migrations:**
   - After first deployment, you need to run migrations
   - Option A: Add to package.json:
     ```json
     "scripts": {
       "postinstall": "prisma generate",
       "build": "prisma generate && next build"
     }
     ```
   - Option B: Use Vercel CLI:
     ```bash
     npx vercel env pull .env.local
     npx prisma db push
     ```

## Important Notes

- **Never commit `.env` files** - they're in `.gitignore`
- **Clerk Keys**: Make sure your Clerk keys are set in Vercel environment variables
- **Database Migrations**: Run `prisma db push` or create migrations after first deploy
- **Prisma Client**: Vercel will run `prisma generate` during build if you add it to `postinstall`

## Troubleshooting

- **Database connection errors**: Check that `DATABASE_URL` is set correctly in Vercel
- **Migration errors**: Run `prisma db push` manually after deployment
- **Build errors**: Check that all environment variables are set
