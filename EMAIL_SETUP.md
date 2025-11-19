# Email Service Setup Guide

The email service uses **Resend** to send AI-generated portraits to students. Here's how to set it up:

## Step 1: Get a Resend API Key

1. **Sign up for Resend** (free tier available):
   - Go to https://resend.com
   - Click "Sign Up" and create an account
   - Free tier includes: 3,000 emails/month, 100 emails/day

2. **Verify your domain** (optional but recommended):
   - Go to "Domains" in Resend dashboard
   - Add your domain (e.g., `school.ai`)
   - Follow DNS verification steps
   - This allows you to send from `open-house@yourdomain.com`

3. **Get your API Key**:
   - Go to "API Keys" in Resend dashboard
   - Click "Create API Key"
   - Give it a name (e.g., "Open House Email Service")
   - Copy the API key (starts with `re_...`)
   - ⚠️ **Important**: Copy it immediately - you won't be able to see it again!

## Step 2: Configure in Netlify

### Option A: Via Netlify Dashboard (Recommended)

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Add these variables:

   ```
   RESEND_API_KEY = re_your_api_key_here
   RESEND_FROM = open-house@yourdomain.com
   ```

   **Note**: 
   - If you haven't verified a domain, use Resend's test domain: `onboarding@resend.dev`
   - Replace `yourdomain.com` with your verified domain once set up

5. Click **Save**
6. **Redeploy** your site for changes to take effect

### Option B: Via netlify.toml (For local development)

Add to your `netlify.toml`:

```toml
[build.environment]
  RESEND_API_KEY = "re_your_api_key_here"
  RESEND_FROM = "open-house@yourdomain.com"
```

⚠️ **Security Warning**: Never commit API keys to git! Use environment variables in Netlify dashboard instead.

## Step 3: Test the Email Service

1. Go to the "Future Profession" activity
2. Generate a portrait
3. Enter an email address
4. Click "Send to email"
5. Check the email inbox (and spam folder)

## Troubleshooting

### Error: "RESEND_API_KEY is not configured"
- Make sure you added the environment variable in Netlify
- Redeploy your site after adding the variable
- Check that the variable name is exactly `RESEND_API_KEY` (case-sensitive)

### Error: "Email provider error"
- Check your API key is correct
- Verify your domain is set up correctly in Resend
- Check Resend dashboard for error logs
- Make sure `RESEND_FROM` email matches your verified domain

### Emails going to spam
- Verify your domain in Resend
- Set up SPF/DKIM records (Resend provides instructions)
- Use a verified sender email address

## Resend Free Tier Limits

- **3,000 emails/month**
- **100 emails/day**
- Perfect for testing and small events

## Alternative Email Providers

If you prefer a different provider, you can modify `functions/send-photo-email.js` to use:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (very cheap, requires AWS account)

The current implementation uses Resend's simple API, which is easy to set up and has a generous free tier.

