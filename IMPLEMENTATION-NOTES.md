# HN Luxury Brand Form Integration - Implementation Notes

## Problem Fixed
- **Issue:** Form data was NOT being sent to N8N webhook when user clicked "Print" button
- **Root Cause:** Client-side `onclick` handler wasn't firing; JavaScript functions were not executing
- **Additional Issue:** Direct client-to-server N8N calls triggered CORS errors

## Solution Implemented
Implemented **Option 1: Server-Side API Endpoint** approach

### Architecture
```
User fills form → Clicks Print/Submit
    ↓
Client collects form data
    ↓
POST to /api/capture-print (our new endpoint)
    ↓
Server receives data
    ↓
Server POSTs to N8N webhook (server-to-server, no CORS)
    ↓
N8N forwards to Airtable
    ↓
API returns success/failure to client
    ↓
Client opens print dialog
```

### Files Created/Modified

#### New Files
1. **`api/capture-print.js`** - NEW SERVER-SIDE ENDPOINT
   - Receives form data via POST
   - Validates required fields
   - Sends to N8N webhook (server-to-server)
   - Returns JSON response to client
   - Includes detailed logging for debugging
   - Gracefully handles webhook failures

#### Modified Files
1. **`index.html`** - Updated JavaScript
   - **`captureToAirtable()`** - Now POSTs to `/api/capture-print` instead of direct webhook
   - **`submitForm()`** - Now awaits capture completion before generating PDF
   - **`handlePrint()`** - Now awaits capture completion before opening print dialog
   - Added detailed console logging throughout

2. **`package.json`**
   - Added `node-fetch` dependency (required for server-side fetch calls)

3. **`vercel.json`**
   - Registered `api/capture-print.js` as a Vercel serverless function
   - Set memory limit to 512MB and timeout to 30 seconds

## How It Works Now

### Print Button Flow
1. User fills form and clicks "Print"
2. Form validation runs (client-side)
3. Form data is collected
4. Status message shows: "⏳ Saving data before print..."
5. Data POSTs to `/api/capture-print`
6. Server calls N8N webhook with data
7. N8N processes and saves to Airtable
8. API returns success response
9. Print dialog opens
10. Status message clears

### Submit Button Flow
1. User fills form and clicks "Submit & Email"
2. Form validation runs
3. Form data is collected
4. Status message shows: "⏳ Saving your data..."
5. Data POSTs to `/api/capture-print`
6. Server calls N8N webhook
7. PDF generated client-side
8. Success message shows with confirmation
9. Optional: Could be extended to send via email

## Debugging

### Console Logs
The implementation includes comprehensive logging:
```javascript
[capture-print] Starting capture...
[capture-print] Sending to API: /api/capture-print
[capture-print] ✓ Success!
[submitForm] Starting submission...
[submitForm] Calling captureToAirtable...
[submitForm] ✓ Complete!
[handlePrint] Starting print capture...
[handlePrint] Opening print dialog...
```

### Server-Side Logs (Vercel)
```
[capture-print] Action: print, Reference: HNL-12345
[capture-print] Customer: John Doe, Items: 2
[capture-print] Webhook payload prepared. Total value: $5,000.00
[capture-print] Sending to N8N webhook: https://n8n.srv1422365.hstgr.cloud/webhook/hn-luxury-capture
[capture-print] ✓ Webhook successful.
```

### To Debug Issues
1. Open browser DevTools (F12)
2. Go to Console tab
3. Fill form and click Print/Submit
4. Watch console logs for flow
5. Check Network tab to see:
   - POST to `/api/capture-print`
   - Request/response bodies
   - Status codes (should be 200)

## API Endpoint Specification

### Endpoint: `POST /api/capture-print`

**Request Payload**
```json
{
  "action": "print|submit",
  "reference": "HNL-12345",
  "data": {
    "consignorName": "John Doe",
    "consignorEmail": "john@example.com",
    "consignorPhone": "0412345678",
    "consignorAddress": "123 Main St",
    "consignorSuburb": "Melbourne",
    "consignorPostcode": "3000",
    "consignorABN": "12345678901",
    "commissionRate": "30",
    "consignmentPeriod": "90",
    "additionalTerms": "...",
    "acceptTerms": true,
    "acceptACL": true
  },
  "items": [
    {
      "description": "Luxury Handbag",
      "category": "Handbag",
      "qty": "1",
      "value": "2500",
      "condition": "Excellent"
    }
  ]
}
```

**Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Form data captured successfully (print mode)",
  "action": "print",
  "reference": "HNL-12345",
  "timestamp": "2026-03-24T06:15:00.000Z",
  "totalValue": 2500,
  "itemCount": 1,
  "customerEmail": "john@example.com"
}
```

**Error Response (still 200, graceful degradation)**
```json
{
  "success": false,
  "message": "Form data captured but N8N sync failed. Proceeding with print anyway.",
  "action": "print",
  "reference": "HNL-12345",
  "webhookStatus": 500,
  "warning": "Data may not have been saved to Airtable. Please retry submission."
}
```

## Key Improvements

### 1. **No More CORS Issues**
   - Before: Client calling N8N webhook directly → CORS errors
   - After: Server calling N8N webhook → No CORS

### 2. **Reliable Event Handling**
   - Before: onclick handler unreliable, JavaScript sometimes didn't execute
   - After: Using proper async/await flow with clear error handling

### 3. **Better UX**
   - User sees status message while data is being saved
   - Print dialog opens AFTER data is confirmed captured
   - Graceful degradation: print still works even if capture fails

### 4. **Better Monitoring**
   - Detailed server-side logging
   - Console logs help with debugging
   - Can monitor webhook failures in Vercel logs

### 5. **Validation at Two Levels**
   - Client-side: Form validation before submission
   - Server-side: Payload validation before N8N call

## Deployment Steps

1. **Local Testing** (if needed)
   ```bash
   cd projects/hn-luxury-brand
   npm install  # This installs node-fetch
   vercel dev   # Test locally
   ```

2. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "Fix: Implement server-side API for form capture - resolves N8N webhook CORS issue"
   git push
   # Vercel auto-deploys on push
   ```

3. **Verify**
   - Open https://hn-luxury-brand.vercel.app
   - Fill form and click Print
   - Watch DevTools console - should see `[capture-print]` logs
   - Check Vercel Function Logs for server-side logs
   - Print dialog should open after data capture completes
   - Check Airtable to confirm data arrived

## What Happens If N8N Webhook Fails?

The implementation includes **graceful degradation**:
- If N8N webhook returns error (500, timeout, etc.), the API still returns success to client
- User can still print the form
- A warning message appears: "Data may not have been saved to Airtable. Please retry submission."
- The failure is logged server-side for monitoring
- This prevents the form from getting "stuck" if N8N has issues

This is intentional - we prioritize user experience over strict error handling. The form can be resubmitted if needed.

## Next Steps / Future Enhancements

1. **Email Integration**
   - Extend `/api/submit-consignment.js` to send PDF via email
   - Add confirmation emails to customer

2. **Retry Logic**
   - Add automatic retry if N8N webhook fails
   - Exponential backoff for reliability

3. **Webhook Signature Verification**
   - Add HMAC verification to ensure data authenticity

4. **Rate Limiting**
   - Prevent abuse (same customer submitting 100 times)
   - IP-based rate limiting

5. **Analytics**
   - Track submissions per day/week/month
   - Monitor capture success rates
   - Alert if N8N webhook is down

## Testing Checklist

- [ ] Form displays correctly at https://hn-luxury-brand.vercel.app
- [ ] All form fields are functional (input, select, textarea)
- [ ] Add Item button works
- [ ] Remove Item button works
- [ ] Form validation works (required fields)
- [ ] Click Print button → Status message appears → API is called → Print dialog opens
- [ ] Check browser DevTools Console → See `[capture-print]` logs
- [ ] Check Airtable → New record appears with form data
- [ ] Click Submit button → Status message appears → PDF generates → Success message shows
- [ ] Test with empty items → Should show validation error
- [ ] Test with missing required fields → Should show validation error
- [ ] Test N8N webhook URL is correct and active

---

**Status:** ✅ IMPLEMENTED & READY FOR TESTING
**Date:** 2026-03-24
**Solution:** Server-side API endpoint removes CORS issues and ensures reliable webhook delivery
