# HN Luxury Brand Form Integration - Test Plan

## Pre-Test Setup

1. **N8N Webhook Verification**
   - URL: `https://n8n.srv1422365.hstgr.cloud/webhook/hn-luxury-capture`
   - Status: MUST BE ACTIVE (production mode)
   - To verify:
     ```bash
     curl -X POST https://n8n.srv1422365.hstgr.cloud/webhook/hn-luxury-capture \
       -H "Content-Type: application/json" \
       -d '{"test": true}'
     ```

2. **Airtable Access**
   - Base must be accessible
   - Table: Should receive records with customer data
   - Verify columns exist for: name, email, phone, items, total value, etc.

3. **Environment**
   - Browser: Chrome/Firefox/Safari (modern, ES2020+)
   - DevTools: Available (F12)
   - Network: Can reach Vercel and N8N

## Test Scenarios

### Test 1: Print Button - Basic Flow
**Objective:** Verify form data is captured to Airtable when user clicks Print

**Steps:**
1. Open https://hn-luxury-brand.vercel.app
2. Fill in ALL required fields:
   - Agreement Date: Today
   - HN Rep: "John Smith"
   - Consignor Name: "Test User"
   - Email: "test@example.com"
   - Phone: "0412345678"
   - Address: "123 Main St"
   - Suburb: "Melbourne"
   - Postcode: "3000"
   - Add Item:
     - Description: "Luxury Handbag"
     - Category: "Handbag"
     - Qty: 1
     - Value: 2500
     - Condition: "Excellent"
   - Commission Rate: 30
   - Consignment Period: 90
   - ✅ Accept Terms checkbox
   - ✅ Accept ACL checkbox

3. Open DevTools (F12) and go to Console tab
4. Click "🖨 Print" button
5. **Expected:**
   - Status message appears: "⏳ Saving data before print..."
   - Console logs show: `[capture-print] Starting capture...`
   - Network tab shows POST to `/api/capture-print` with 200 status
   - Console shows: `[capture-print] ✓ Success!`
   - Status message clears
   - Browser print dialog opens
6. Close print dialog (Esc or Cancel)
7. **Verification:**
   - Check Airtable → New record should exist with customer data
   - Record should show: Test User, test@example.com, 1 item, $2500 total

### Test 2: Submit Button - PDF Generation
**Objective:** Verify form data is captured AND PDF is generated when user clicks Submit

**Steps:**
1. Refresh the form page
2. Fill in same data as Test 1
3. Open DevTools Console
4. Click "✓ Submit & Email" button
5. **Expected:**
   - Status: "⏳ Saving your data..."
   - Console: `[submitForm] Starting submission...`
   - Network shows POST to `/api/capture-print`
   - PDF download begins automatically
   - Success message appears: "✓ Success! Form submitted, PDF generated..."
   - Ref number should be shown

6. **Verification:**
   - Check Downloads folder → PDF file exists
   - PDF filename should be: `HNL-Consignment-Test_User-2026-03-24.pdf`
   - Open PDF → Should display form with all entered data
   - Check Airtable → Another new record should exist (2 records total now)

### Test 3: Multiple Items
**Objective:** Verify form handles multiple items correctly

**Steps:**
1. Fill form as before
2. Click "+ Add Another Item" button
3. Fill in second item:
   - Description: "Designer Watch"
   - Category: "Watch"
   - Qty: 2
   - Value: 1500
   - Condition: "Mint"
4. Click Print
5. **Expected:**
   - Network payload should show 2 items
   - Total value should calculate: (2500 × 1) + (1500 × 2) = $5500
   - Console should log: "itemCount: 2"
   - Airtable record should show 2 line items
   - PDF should show both items

### Test 4: Form Validation
**Objective:** Verify required field validation works

**Steps:**
1. Fill in only Name and Email fields
2. Leave other required fields empty
3. Click Print
4. **Expected:**
   - Alert box: "Please fill in all required fields before printing."
   - No API call should be made
   - Console should not show `[capture-print]` logs
5. Do the same with Submit button
6. **Expected:**
   - Alert box: "Please fill in all required fields marked with *"
   - No API call should be made

### Test 5: Network Failure Simulation
**Objective:** Verify graceful degradation if N8N webhook is down

**Steps:**
1. Use Browser DevTools Network tab
2. Set throttling to "Offline" before clicking Print
3. Click Print button
4. **Expected:**
   - Status message appears briefly
   - Error is logged: `[capture-print] Error:` or `[capture-print] Fatal error:`
   - BUT: Print dialog still opens (graceful degradation)
   - User can still print the form

### Test 6: Ref Number Consistency
**Objective:** Verify reference number is generated and consistent

**Steps:**
1. Note the Ref Number displayed below the title (e.g., HNL-00001)
2. Fill form and click Print
3. Check browser Network tab → Look at POST payload
4. Find `"reference": "HNL-XXXXX"`
5. Check PDF → Should have same ref number
6. Check Airtable → Record should have same ref number
7. **Expected:**
   - All three places (form display, API payload, Airtable) show SAME ref number

### Test 7: Console Logging
**Objective:** Verify all logging is working for debugging

**Steps:**
1. Open DevTools Console
2. Fill form and click Print
3. **Expected Console Output:**
   ```
   [capture-print] Starting capture... {action: 'print', reference: 'HNL-12345', itemCount: 1}
   [capture-print] Sending to API: /api/capture-print
   [capture-print] ✓ Success! {success: true, message: '...', reference: 'HNL-12345', ...}
   ```

4. Fill form and click Submit
5. **Expected Console Output:**
   ```
   [submitForm] Starting submission...
   [submitForm] Calling captureToAirtable...
   [submitForm] Generating PDF...
   [submitForm] ✓ Complete! {success: true, message: '...'}
   ```

### Test 8: Large Payload
**Objective:** Verify system handles maximum realistic data

**Steps:**
1. Fill form with:
   - Very long address (500 chars)
   - 10 items
   - Long additional terms (1000 chars)
2. Click Print
3. **Expected:**
   - No timeout or error
   - API payload size should be reasonable (< 100KB)
   - All data captured in Airtable

### Test 9: Special Characters
**Objective:** Verify special characters don't break JSON

**Steps:**
1. Fill form with:
   - Name: "José María O'Brien"
   - Address: "123 O'Connell St, Level 5 (Suite)"
   - Item description: "Bag - "Milano" Collection (2024)"
2. Click Print
3. **Expected:**
   - No JSON parsing errors
   - All special characters preserved in Airtable
   - PDF displays correctly

### Test 10: Checkbox State Verification
**Objective:** Verify terms acceptance is recorded

**Steps:**
1. Fill form WITHOUT checking the two checkboxes
2. Click Submit
3. **Expected:**
   - Alert: "Please fill in all required fields"
   - Cannot proceed
4. Check both checkboxes
5. Click Submit
6. **Expected:**
   - Form proceeds
   - Airtable record shows: `acceptTerms: true`, `acceptACL: true`

## Success Criteria

✅ **All tests pass** if:
- [ ] Print button opens print dialog after data capture
- [ ] Submit button generates PDF after data capture
- [ ] Form data appears in Airtable within 5 seconds
- [ ] Reference numbers are consistent across form/API/Airtable
- [ ] Console logs show clear flow `[capture-print]` and `[submitForm]` logs
- [ ] Form validation prevents incomplete submissions
- [ ] Print still works even if N8N webhook fails (graceful degradation)
- [ ] Special characters are handled correctly
- [ ] Multiple items are supported
- [ ] No JavaScript errors in console

## Troubleshooting

### If Print Dialog Doesn't Open
1. Check console for errors
2. Verify form is valid (all required fields filled)
3. Check Network tab → Does POST to `/api/capture-print` succeed?
4. If API returns error, check Vercel Function Logs

### If Data Doesn't Appear in Airtable
1. Verify N8N webhook URL is correct
2. Test webhook directly:
   ```bash
   curl -X POST https://n8n.srv1422365.hstgr.cloud/webhook/hn-luxury-capture \
     -H "Content-Type: application/json" \
     -d '{"test": true, "action": "test"}'
   ```
3. Check N8N workflow is active (production mode)
4. Check Airtable base/table configuration
5. Look at Vercel Function Logs for capture-print errors

### If PDF Doesn't Generate
1. Check browser console for PDF generation errors
2. Verify html2pdf library loaded: Open DevTools → check Network tab for `html2pdf.bundle.min.js`
3. Try different browser (Safari, Chrome, Firefox)

### If API Returns Error 400/500
1. Check console logs for validation errors
2. Ensure all required fields in payload are present
3. Check JSON is valid (no quote/escape issues)
4. Look at Vercel Function Logs

## Post-Test Actions

1. **Document Results**
   - Record which tests passed/failed
   - Screenshot any errors
   - Note any timing issues

2. **Verify Airtable Data**
   - Count total records created during testing
   - Spot-check data accuracy
   - Verify timestamps are recent

3. **Check N8N Workflow**
   - View N8N execution logs
   - Verify workflow ran successfully
   - Check data transformation is correct

4. **Collect Vercel Logs**
   - Go to Vercel Dashboard → hn-luxury-brand → Functions
   - Check `capture-print` function logs
   - Look for any errors or warnings

---

**Test Date:** _____________
**Tester:** _____________
**Result:** ✅ PASS / ❌ FAIL
**Notes:** _____________________________________________
