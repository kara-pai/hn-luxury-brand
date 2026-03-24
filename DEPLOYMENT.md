# HN Luxury Brand - Deployment Guide

## Local Testing

```bash
cd projects/hn-luxury-brand
npm install
npm start
```

Open: `http://localhost:3000`

---

## Vercel Deployment

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repo with this project
- SendGrid or Gmail API key
- Environment variables configured

### Step 1: Setup Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add:

```
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
HN_LUXURY_EMAIL=hn-luxury@example.com
POWERAI_EMAIL=powerai@example.com
POWERAI_CRM_API_URL=https://api.powerai.com/crm
POWERAI_CRM_API_KEY=your-crm-api-key
```

**For Gmail:**
- Enable 2FA on Gmail account
- Generate App Password: https://myaccount.google.com/apppasswords
- Use the 16-character password (without spaces)

**For PowerAI CRM:**
- Get API URL from PowerAI backend
- Generate API key in PowerAI admin panel
- Test connection before deployment

### Step 2: Deploy

**Option A: GitHub Integration**
1. Push this repo to GitHub
2. Connect repo in Vercel
3. Select "HN Luxury Brand" folder as root
4. Deploy

**Option B: Vercel CLI**
```bash
npm install -g vercel
cd projects/hn-luxury-brand
vercel --prod
```

### Step 3: Configure Domain

In Vercel Settings > Domains:
- Add custom domain (e.g., `consignment.hn-luxury.com`)
- Update DNS records with CNAME

---

## Form Features

### Mobile-Friendly
- ✅ Responsive layout (mobile, tablet, desktop)
- ✅ Touch-friendly buttons
- ✅ 16px font size on inputs (prevents iOS zoom)
- ✅ Optimized for landscape/portrait

### Submission Flow
1. User fills form
2. Clicks "Submit & Email"
3. Backend generates PDF
4. Email sent to consignor + HN Luxury
5. PDF automatically downloaded
6. Form reset

### Files Included
- `index.html` - Main form (responsive, production-ready)
- `api/submit-consignment.js` - Backend API
- `package.json` - Dependencies
- `vercel.json` - Vercel config
- `.gitignore` - Git rules

---

## Testing

### Test Form Submission
1. Visit deployed URL
2. Fill form on mobile device
3. Click "Submit & Email"
4. Check email inbox for PDF + confirmation
5. Verify PDF downloaded

### Test Email
- Consignor should receive: Confirmation + PDF attachment
- Admin should receive: New submission alert + PDF

---

## Troubleshooting

**Email not sending:**
- Check GMAIL_USER + GMAIL_PASS in Vercel env vars
- Verify Gmail app password (not regular password)
- Check spam folder

**PDF not downloading:**
- Test in Chrome DevTools (check console errors)
- Verify html2pdf.js CDN is accessible
- Check browser download settings

**Form not responsive:**
- Test on actual mobile device (not just DevTools)
- Check viewport meta tag in HTML
- Clear browser cache

---

## Next Steps

1. ✅ Deploy form to Vercel
2. ⏳ Share URL with HN Luxury Brand for testing
3. ⏳ Collect feedback + revisions
4. ⏳ Build inventory dashboard (Phase 2)
5. ⏳ Add commission management (Phase 3)

---

**Last Updated:** 2026-03-21 23:47 UTC
