# HN Luxury Consignment — Airtable Integration

**Status:** Ready to deploy | **Updated:** 2026-03-24 02:30 UTC

---

## What's Happening

The consignment form now captures customer data **on both Submit AND Print button clicks** and sends it to Airtable via n8n webhook.

**Two capture points:**
1. ✅ **Submit Button** — When user clicks "Submit & Email"
2. ✅ **Print Button** — When user clicks "Print" (before print dialog opens)

---

## Setup Steps (5 min)

### Step 1: Create Airtable Base
1. Go to **airtable.com** (sign up if needed)
2. Create a new base named `HN Luxury Consignments`
3. Rename default table to `Customers`
4. Add these columns:
   - **Name** (text) — fullName
   - **Email** (email) — email
   - **Phone** (phone) — phone
   - **Address** (text) — address
   - **Suburb** (text) — suburb
   - **Postcode** (text) — postcode
   - **ABN** (text) — abn
   - **Commission %** (number) — commission
   - **Period (Days)** (number) — period
   - **Total Value** (currency) — totalValue
   - **Items** (long text) — items (JSON array)
   - **Action** (single select: Submit, Print) — action
   - **Timestamp** (created time) — timestamp
   - **Reference** (text) — reference

5. Get your **API Token** (airtable.com/account/tokens)
6. Get your **Base ID** (look in URL: airtable.com/app/**recXXXX**/...)

---

### Step 2: Create n8n Webhook
1. Log in to **n8n** (:5678)
2. Create new workflow: `HN Luxury Consignment Capture`
3. Add **Webhook** trigger node:
   - **Method:** POST
   - **Path:** `/webhook/hn-luxury-capture`
   - **Authentication:** None (internal only)
4. Add **Airtable** node:
   - **Operation:** Create Record
   - **Base ID:** (paste from Step 1)
   - **Table:** `Customers`
   - **Fields:**
     - Name → `{{ $json.customer.fullName }}`
     - Email → `{{ $json.customer.email }}`
     - Phone → `{{ $json.customer.phone }}`
     - Address → `{{ $json.customer.address }}`
     - Suburb → `{{ $json.customer.suburb }}`
     - Postcode → `{{ $json.customer.postcode }}`
     - ABN → `{{ $json.customer.abn }}`
     - Commission % → `{{ $json.commission }}`
     - Period (Days) → `{{ $json.period }}`
     - Total Value → `{{ $json.totalValue }}`
     - Items → `{{ JSON.stringify($json.items) }}`
     - Action → `{{ $json.action }}`
     - Reference → `{{ $json.reference }}`
5. **Activate** workflow

---

### Step 3: Deploy Form to Vercel
```bash
cd /home/karaai/.openclaw/workspace/projects/hn-luxury-brand
git add index.html
git commit -m "Add Airtable capture on submit + print"
git push
```

Vercel will auto-deploy within 30 seconds.

---

## Testing

1. Open **https://hn-luxury-brand.vercel.app**
2. Fill in a test form with:
   - Name: "Test Customer"
   - Email: "test@example.com"
   - Phone: "0412345678"
   - Address: "123 Test St"
   - Suburb: "Melbourne"
   - Postcode: "3000"
   - 1 item: "Test Handbag" | Handbag | Qty 1 | Value $500 | Mint
3. Click **Print** button (or Submit)
4. Check Airtable — new row should appear in `Customers` table within 2 seconds

---

## How It Works

```
Form User clicks Submit/Print
    ↓
JavaScript captures: name, email, phone, address, items, total value
    ↓
POST to n8n webhook (async, non-blocking)
    ↓
n8n processes and creates Airtable record
    ↓
Airtable now has customer details + items list
```

**User experience:** Instant (capture runs in background, form submission not delayed)

---

## Files Modified

- `index.html` — Added dual capture points + Airtable webhook
- `AIRTABLE-SETUP.md` — This file

---

## Next Steps

1. Create Airtable base + get credentials
2. Create n8n webhook flow + activate
3. Deploy form to Vercel
4. Test with form submission
5. Monitor Airtable for incoming records

**Support:** Check n8n logs if webhook doesn't fire (typically auth or path mismatch)
