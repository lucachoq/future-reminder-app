# LaterDate - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Option 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/laterdate.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Next.js project

3. **Configure Environment Variables:**
   - In your Vercel project dashboard
   - Go to Settings → Environment Variables
   - Add all variables from `env.example`

### Option 2: Deploy with Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

## 🔧 Environment Variables Setup

Copy all variables from `env.example` to your Vercel project:

### Required Variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### Optional Variables:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

## ⚠️ Important Notes

### Backend Scripts Won't Run on Vercel
Your reminder scripts (`sendDueReminders.ts`, `sendDueCalls.ts`) **won't work on Vercel** because:
- Vercel is serverless (no persistent processes)
- Your scripts need to run continuously every 10 seconds

### Solutions for Backend Scripts:

**Option A: Keep Local Development**
- Use Vercel for frontend only
- Run reminder scripts locally for testing
- Perfect for development and testing

**Option B: Deploy Backend Separately**
- Deploy scripts to [Railway](https://railway.app) or [Render](https://render.com)
- These support long-running processes
- Keep frontend on Vercel

**Option C: Use Vercel Cron Jobs**
- Create API routes that run on a schedule
- More complex but possible

## 🎯 Recommended Setup

1. **Deploy frontend to Vercel** (for the web app)
2. **Deploy backend scripts to Railway** (for reminder processing)
3. **Keep developing in Cursor** (best of both worlds)

## 🔍 Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Check that `package.json` has correct dependencies
- Verify TypeScript compilation

### Runtime Errors
- Check Vercel function logs
- Verify API routes are working
- Test environment variables

### Database Issues
- Ensure Supabase is properly configured
- Check RLS policies
- Verify connection strings

## 📱 Testing Your Deployment

1. **Test Authentication:**
   - Sign up/sign in should work
   - Clerk should redirect properly

2. **Test Reminder Creation:**
   - Create a reminder
   - Verify it saves to Supabase

3. **Test API Routes:**
   - Test SMS sending
   - Test email sending
   - Test call functionality

## 🚀 Next Steps

1. **Set up custom domain** (optional)
2. **Configure analytics** (PostHog)
3. **Set up monitoring** (Vercel Analytics)
4. **Deploy backend scripts** to Railway/Render

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally first
4. Check Supabase logs

---

**Happy Deploying! 🎉** 