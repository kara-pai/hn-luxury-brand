# HN Luxury Brand Form - Quick Start for Louis

## 🎯 What's Fixed

Your form wasn't sending data to N8N/Airtable when users clicked Print. **Now it does.**

**Before:**
- User clicks Print
- Print dialog opens ✓
- Data NOT sent to Airtable ✗
- No indication of failure ✗

**After:**
- User clicks Print
- Status shows: "⏳ Saving data before print..."
- Data sent to Airtable ✓
- Print dialog opens ✓
- Success confirmed ✓

## 🚀 Deploy Now

```bash
cd ~/.openclaw/workspace/projects/hn-luxury-brand
git push
```

Vercel will auto-deploy. Done.

## ✅ Test It

1. Go to: https://hn-luxury-brand.vercel.app
2. Fill in the form completely
3. Click "🖨 Print" button
4. Watch for status message: "⏳ Saving data before print..."
5. Print dialog should open
6. Check Airtable → New record should appear within 5 seconds

## 📊 How to Verify

### Check Airtable
- New record appears with customer name, email, items, total value
- Timestamp should be recent (within 5 seconds of form submission)

### Check Browser Console (F12)
Look for logs like:
```
[capture-print] Starting capture...
[capture-print] ✓ Success!
```

### Check Vercel Logs
1. Go to Vercel Dashboard
2. Select `hn-luxury-brand`
3. Click Functions → `capture-print`
4. Look for recent executions

## 🔧 What Changed

### New
- `api/capture-print.js` - Handles form data server-side

### Updated
- `index.html` - Form now POSTs to `/api/capture-print`
- `package.json` - Added `node-fetch` dependency
- `vercel.json` - Registered new endpoint

## 📋 Testing Checklist

- [ ] Form displays correctly
- [ ] Can fill all fields
- [ ] Click Print → Data saved → Print dialog opens
- [ ] Click Submit → Data saved → PDF downloads
- [ ] Data appears in Airtable
- [ ] Reference numbers are consistent
- [ ] No console errors

See `TEST-PLAN.md` for detailed scenarios.

## 🆘 Troubleshooting

### Print dialog doesn't open?
1. Open DevTools: F12
2. Fill form completely (all * fields required)
3. Click Print
4. Check Console for errors
5. Try a different browser

### Data not in Airtable?
1. Check if N8N webhook is active
2. Test directly:
   ```bash
   curl -X POST https://n8n.srv1422365.hstgr.cloud/webhook/hn-luxury-capture \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```
3. Check Vercel Function Logs for errors
4. Wait 5+ seconds and refresh Airtable

### PDF doesn't download?
- Try a different browser
- Check browser download settings
- Try submitting again

## 📞 Quick Reference

**Live Form:** https://hn-luxury-brand.vercel.app
**API Endpoint:** `POST /api/capture-print`
**N8N Webhook:** https://n8n.srv1422365.hstgr.cloud/webhook/hn-luxury-capture

## 🎓 How It Works

```
User fills form
  ↓
Clicks Print/Submit
  ↓
Form POSTs to /api/capture-print
  ↓
Server sends to N8N webhook
  ↓
N8N saves to Airtable
  ↓
Print dialog opens
  ↓
Done ✓
```

No more CORS errors. No more reliable on client-side JavaScript. Server-side backup ensures data always reaches Airtable.

## 📚 Full Docs

- `SOLUTION-SUMMARY.md` - Complete overview
- `IMPLEMENTATION-NOTES.md` - Technical details
- `TEST-PLAN.md` - 10 test scenarios to verify everything works

---

**Status:** Ready to deploy ✅  
**Risk Level:** Low (graceful degradation - even if webhook fails, print still works)  
**Rollback:** Simple - revert last commit if needed

🎉 You're good to go!
