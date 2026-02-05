# Setup Guide for ceuHUB

This guide will help you get the project running locally.

## Prerequisites

- **Node.js 18+** (check with `node --version`)
- **PostgreSQL Database** (Supabase or Neon recommended for easy setup)
- **npm** or **yarn** package manager

## Step 1: Install Dependencies

```bash
npm install
```

**Note:** The `canvas` package requires native dependencies. On macOS, you may need:
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

On Linux (Ubuntu/Debian):
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

On Windows, you may need Visual Studio Build Tools.

## Step 2: Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and fill in the following **required** variables:

### Database (Required)
```env
DATABASE_URL=postgresql://user:password@host:5432/ceuHub
```

### NextAuth (Required)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-here
```
Generate a secret with: `openssl rand -base64 32`

### Email - Resend (Required for magic links)
```env
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Vercel Blob Storage (Required for file uploads)
```env
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

### OAuth Providers (Optional - only add if you want OAuth)
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
APPLE_ID=your-apple-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key
```

## Step 3: Set Up Database

1. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

2. **Push Schema to Database:**
   ```bash
   npm run db:push
   ```

   This will create all tables in your PostgreSQL database.

3. **(Optional) Open Prisma Studio to view your database:**
   ```bash
   npm run db:studio
   ```

## Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Common Issues & Solutions

### Issue: Canvas installation fails
**Solution:** Install native dependencies (see Step 1). If you're deploying to Vercel, `canvas` won't work in serverless functions. Consider using an alternative PDF processing approach or move PDF parsing to a separate API route.

### Issue: Database connection error
**Solution:** 
- Verify your `DATABASE_URL` is correct
- Ensure your database is accessible from your network
- For Supabase: Check that your IP is allowed in the database settings

### Issue: NextAuth secret error
**Solution:** Make sure `NEXTAUTH_SECRET` is set in `.env.local` and is a random string (use `openssl rand -base64 32`)

### Issue: Email sending fails
**Solution:**
- Verify your Resend API key is correct
- Ensure `RESEND_FROM_EMAIL` is a verified domain in Resend
- Check Resend dashboard for email logs

### Issue: Vercel Blob errors
**Solution:**
- Verify your `BLOB_READ_WRITE_TOKEN` is correct
- Check token permissions in Vercel dashboard

## What Works Without Setup

The following features will **NOT** work until you provide the required services:

- ❌ Authentication (needs NextAuth config + database)
- ❌ Course enrollment (needs database)
- ❌ Quiz submission (needs database)
- ❌ Certificate generation (needs database + Vercel Blob)
- ❌ Email sending (needs Resend API key)

## Testing the Setup

1. **Check Database Connection:**
   ```bash
   npm run db:studio
   ```
   If Prisma Studio opens, your database is connected correctly.

2. **Test NextAuth:**
   - Try signing in at `/auth/signin`
   - Check browser console for errors
   - Check server logs for database connection issues

3. **Test API Routes:**
   - Try accessing `/api/courses` (should return empty array if no courses)
   - Try accessing `/api/users/me` (should return 401 if not authenticated)

## Next Steps

Once basic setup is working:

1. **Seed Database:** Create a test course manually via Prisma Studio or create a seed script
2. **Test Authentication:** Sign up a test user
3. **Test Course Flow:** Create a course, enroll, view slides, take quiz
4. **Test Certificate Generation:** Complete a quiz with 80%+ score

## Production Deployment

For Vercel deployment:

1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables in Vercel dashboard
4. Set up database (Supabase/Neon works well)
5. Deploy!

**Note:** `canvas` and `puppeteer` may not work in Vercel serverless functions. Consider:
- Using Vercel Edge Functions for PDF processing
- Using a separate service for PDF/certificate generation
- Using @vercel/blob's built-in capabilities where possible


