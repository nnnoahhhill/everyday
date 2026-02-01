# 🔥 COMPLETE CLERK SETUP CHECKLIST - weeeee.fun Domain

## ✅ STEP 1: Clerk Dashboard Configuration

### 1.1 Domain Setup
- [ ] Go to Clerk Dashboard → **Domains**
- [ ] Add your domain: `weeeee.fun` (NOT `hehe.weeeee.fun`)
- [ ] Clerk will give you DNS records to add:
  - Type: `CNAME`
  - Name: `clerk` (or whatever Clerk tells you)
  - Value: `[clerk-provided-value]`
- [ ] Wait for DNS propagation (can take up to 24 hours, usually 5-10 min)

### 1.2 Get Your Keys
- [ ] Go to Clerk Dashboard → **API Keys**
- [ ] Copy your **Publishable Key**: `pk_live_...` or `pk_test_...`
- [ ] Copy your **Secret Key**: `sk_live_...` or `sk_test_...`

### 1.3 Configure Redirect URLs
- [ ] Go to Clerk Dashboard → **Paths**
- [ ] Set **After Sign-In URL**: `https://weeeee.fun` (or `https://hehe.weeeee.fun` if that's your app domain)
- [ ] Set **After Sign-Up URL**: `https://weeeee.fun` (or `https://hehe.weeeee.fun`)

---

## ✅ STEP 2: Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these **3 variables** for **Production** environment:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_live_YOUR_KEY_HERE
DATABASE_URL=postgres://3bfb8cab95a747fd494b05fd67738f0a30257287f8d58d4e83396cf038efe2ce:sk_DWgDQJoI4bstolhrW0mQ0@db.prisma.io:5432/postgres?sslmode=require
```

**IMPORTANT:**
- Replace `YOUR_KEY_HERE` with your actual keys from Clerk Dashboard
- Set environment to **"Production"** (not Preview or Development)
- Click **Save** after adding each variable

---

## ✅ STEP 3: Code Configuration (Already Fixed)

✅ **middleware.ts** - Created at root (required by Clerk)
✅ **next.config.ts** - Removed proxy rewrites (not needed for custom domain)
✅ **vercel.json** - Removed proxy rewrites
✅ **layout.tsx** - ClerkProvider configured

---

## ✅ STEP 4: Local Development (.env.local)

Create/update `.env.local` in your project root:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
CLERK_SECRET_KEY=sk_test_YOUR_TEST_KEY
DATABASE_URL=postgres://3bfb8cab95a747fd494b05fd67738f0a30257287f8d58d4e83396cf038efe2ce:sk_DWgDQJoI4bstolhrW0mQ0@db.prisma.io:5432/postgres?sslmode=require
```

**Note:** For local dev, you can use test keys. For production (Vercel), use live keys.

---

## ✅ STEP 5: Deploy to Vercel

1. [ ] Commit and push changes:
   ```bash
   git add -A
   git commit -m "Fix Clerk custom domain configuration"
   git push
   ```

2. [ ] Vercel will auto-deploy
3. [ ] Wait for deployment to complete
4. [ ] Check Vercel logs if there are errors

---

## ✅ STEP 6: Verify It Works

1. [ ] Visit your production URL: `https://hehe.weeeee.fun` (or whatever your Vercel domain is)
2. [ ] Click "Sign In" - should redirect to Clerk
3. [ ] Sign in should work without SSL errors
4. [ ] After sign-in, should redirect back to your app
5. [ ] API routes should return 200 (not 500)

---

## 🚨 TROUBLESHOOTING

### SSL Error (ERR_SSL_VERSION_OR_CIPHER_MISMATCH)
- **Cause:** DNS not configured or wrong domain in Clerk
- **Fix:** 
  1. Check Clerk Dashboard → Domains shows `weeeee.fun` (not `hehe.weeeee.fun`)
  2. Verify DNS records are correct
  3. Wait for DNS propagation (use `dig clerk.weeeee.fun` to check)

### 500 Errors on API Routes
- **Cause:** Missing or wrong Clerk keys in Vercel
- **Fix:** 
  1. Check Vercel environment variables are set
  2. Verify keys match your Clerk instance
  3. Redeploy after adding variables

### "Unauthorized" Errors
- **Cause:** Middleware not running or wrong keys
- **Fix:**
  1. Verify `middleware.ts` exists at project root
  2. Check Clerk keys are correct
  3. Clear browser cache and cookies

---

## 📋 QUICK REFERENCE

**Your Domain:** `weeeee.fun` (configured in Clerk)
**Your App:** `hehe.weeeee.fun` (Vercel deployment)
**Clerk Domain:** `clerk.weeeee.fun` (managed by Clerk, auto-configured)

**Required Files:**
- ✅ `middleware.ts` (at root)
- ✅ `src/app/layout.tsx` (with ClerkProvider)
- ✅ `.env.local` (for local dev)
- ✅ Vercel env vars (for production)

**NOT Needed:**
- ❌ Proxy rewrites in `next.config.ts`
- ❌ Proxy rewrites in `vercel.json`
- ❌ `src/proxy.ts` (old file, can delete)

---

## 🎯 CURRENT STATUS

After completing this checklist:
- ✅ Clerk auth will work on production
- ✅ API routes will return 200 (not 500)
- ✅ Users can sign in/sign up
- ✅ No SSL errors
