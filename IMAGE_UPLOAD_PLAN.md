# Image Upload Plan - Fix Gmail Clipping Issue

## Current Problem

**Issue**: Gmail clips emails when HTML code exceeds 102KB. Currently, we embed a 2-3MB base64 image directly in the HTML email, causing clipping.

**Current Flow**:
1. `photo-booth.js` generates image → returns base64 data URL (`data:image/png;base64,...`)
2. Base64 string (~2-3MB) embedded in HTML email
3. Email HTML > 102KB → Gmail clips message

## Solution: Upload Image & Use Public URL

Instead of embedding base64, we need to:
1. Upload the image to cloud storage
2. Get a public HTTP URL
3. Use that URL in the email HTML (keeps HTML < 102KB)

## Implementation Options

### Option 1: Resend Attachments (Simplest)
**Pros**: No additional service needed, Resend handles it
**Cons**: Image appears as attachment, not inline (may not be ideal)

```javascript
// In send-photo-email.js
const imageBuffer = Buffer.from(styledImageUrl.split(',')[1], 'base64')
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: RESEND_FROM,
    to: email,
    subject: `🎨 Your Future Career Portrait: ${safeProfession}`,
    html: htmlWithoutImage, // HTML with placeholder or link
    attachments: [{
      filename: 'future-portrait.png',
      content: imageBuffer.toString('base64'),
    }]
  }),
})
```

### Option 2: Cloudinary (Recommended)
**Pros**: Free tier, CDN, automatic optimization, public URLs
**Cons**: Requires Cloudinary account setup

**Steps**:
1. Sign up for Cloudinary (free tier: 25GB storage, 25GB bandwidth/month)
2. Get API credentials
3. Upload base64 image to Cloudinary
4. Get public URL
5. Use URL in email HTML

**Implementation**:
```javascript
// New function: upload-image-to-cloudinary.js
const cloudinary = require('cloudinary').v2
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// In photo-booth.js, after getting styledImageUrl:
if (styledImageUrl.startsWith('data:image')) {
  // Upload to Cloudinary
  const base64Data = styledImageUrl.split(',')[1]
  const uploadResult = await cloudinary.uploader.upload(
    `data:image/png;base64,${base64Data}`,
    {
      folder: 'future-portraits',
      public_id: `portrait-${Date.now()}`,
      resource_type: 'image',
    }
  )
  styledImageUrl = uploadResult.secure_url // Now it's an HTTP URL
}
```

### Option 3: Netlify Blob Storage (Netlify Native)
**Pros**: Integrated with Netlify, no extra service
**Cons**: Requires Netlify Blob addon (may have costs)

**Implementation**:
```javascript
// Using @netlify/blobs
const { getStore } = require('@netlify/blobs')

// In photo-booth.js:
const store = getStore({ name: 'portraits' })
const imageBuffer = Buffer.from(styledImageUrl.split(',')[1], 'base64')
const blobId = `portrait-${Date.now()}-${Math.random().toString(36).substring(7)}`
await store.set(blobId, imageBuffer, {
  metadata: { profession, style },
})
const publicUrl = `https://${process.env.NETLIFY_SITE_URL}/.netlify/blobs/${blobId}`
styledImageUrl = publicUrl
```

### Option 4: AWS S3 (Most Scalable)
**Pros**: Highly scalable, reliable
**Cons**: More complex setup, AWS account needed

## Recommended Approach: Cloudinary

**Why Cloudinary?**
- Free tier is generous (25GB storage, 25GB bandwidth/month)
- Easy to set up
- Automatic image optimization
- CDN for fast delivery
- Simple API

## Implementation Steps

### Step 1: Set up Cloudinary
1. Sign up at https://cloudinary.com (free tier)
2. Get credentials from dashboard:
   - Cloud name
   - API Key
   - API Secret

### Step 2: Add Environment Variables
Add to Netlify environment variables:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 3: Install Cloudinary SDK
```bash
npm install cloudinary
```

### Step 4: Modify photo-booth.js
After getting the base64 image, upload it to Cloudinary before returning:

```javascript
// After line 353 (after styledImageUrl is extracted)
if (styledImageUrl && styledImageUrl.startsWith('data:image')) {
  try {
    const cloudinary = require('cloudinary').v2
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
    
    const uploadResult = await cloudinary.uploader.upload(styledImageUrl, {
      folder: 'future-portraits',
      public_id: `portrait-${Date.now()}-${sessionId || 'guest'}`,
      resource_type: 'image',
      format: 'png',
    })
    
    styledImageUrl = uploadResult.secure_url
    console.log('[photo-booth] Image uploaded to Cloudinary:', styledImageUrl)
  } catch (uploadError) {
    console.error('[photo-booth] Cloudinary upload failed, using base64:', uploadError)
    // Fallback: keep base64 if upload fails
  }
}
```

### Step 5: Update send-photo-email.js
No changes needed! It will automatically use the HTTP URL instead of base64.

## Alternative: Quick Fix with Resend Attachments

If you want a quick fix without setting up Cloudinary:

```javascript
// In send-photo-email.js
const imageBuffer = Buffer.from(styledImageUrl.split(',')[1], 'base64')

const response = await fetch('https://api.resend.com/emails', {
  // ... existing code ...
  body: JSON.stringify({
    from: RESEND_FROM,
    to: email,
    subject: `🎨 Your Future Career Portrait: ${safeProfession}`,
    html: html.replace(`<img src="${styledImageUrl}"`, `<img src="cid:portrait"`), // Use CID reference
    attachments: [{
      filename: 'future-portrait.png',
      content: imageBuffer.toString('base64'),
      cid: 'portrait', // Content ID for inline image
    }]
  }),
})
```

## Testing

After implementation:
1. Generate a portrait
2. Send email
3. Check email in Gmail
4. Verify:
   - Email is not clipped
   - Image displays inline
   - HTML size < 102KB

