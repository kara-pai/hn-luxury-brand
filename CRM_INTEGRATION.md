# PowerAI CRM Integration - HN Luxury Brand

## Overview

When a customer submits the consignment form, their information is automatically saved to PowerAI CRM with:
- Contact details (name, email, phone, address)
- Consignment items & values
- Reference number for tracking
- Tagging for HN Luxury Brand clients

---

## Data Flow

```
Consignment Form
    ↓
Submit Button Clicked
    ↓
Backend API (submit-consignment.js)
    ├── Save to PowerAI CRM ← (1) Customer info + items
    ├── Generate PDF
    ├── Send emails (consignor + admin + PowerAI team)
    └── Return success + reference number
    ↓
Customer receives confirmation email + PDF
    ↓
PowerAI team tracks customer in CRM
```

---

## Customer Data Structure

### Saved to CRM:

```json
{
  "source": "HN_LUXURY_BRAND",
  "referenceNumber": "HNL-12345",
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "phone": "+61412345678",
  "address": "123 Main St",
  "suburb": "Sydney",
  "postcode": "2000",
  "abn": "12345678901",
  "businessType": "luxury_consignor",
  "status": "active",
  "tags": ["hn-luxury", "consignment", "consignor"],
  "customFields": {
    "totalItemsConsigned": 3,
    "totalValue": 45000,
    "items": [
      {
        "description": "Hermès Birkin Bag",
        "category": "Handbag",
        "quantity": 1,
        "estimatedValue": "25000",
        "condition": "Mint"
      },
      {
        "description": "Rolex Submariner",
        "category": "Watch",
        "quantity": 1,
        "estimatedValue": "15000",
        "condition": "Excellent"
      },
      {
        "description": "Diamond Necklace",
        "category": "Jewellery",
        "quantity": 1,
        "estimatedValue": "5000",
        "condition": "Good"
      }
    ]
  },
  "createdAt": "2026-03-21T23:47:00Z",
  "source_details": {
    "form": "consignment_agreement",
    "client": "hn_luxury_brand"
  }
}
```

---

## Two-Way Integration

### 1️⃣ Forward: Form → CRM
- Customer submits form
- Data saved to PowerAI CRM automatically
- Tags: `hn-luxury`, `consignment`, `consignor`
- Status: `active`

### 2️⃣ Reverse: CRM → Follow-up (Future)
- PowerAI team can:
  - Track customer in CRM
  - Schedule follow-ups
  - Monitor sales (when items sell)
  - Calculate commissions
  - Generate reports

---

## API Integration

### PowerAI CRM API Endpoint

**POST** `/customers` (Create/Update customer)

**Headers:**
```
Authorization: Bearer {POWERAI_CRM_API_KEY}
Content-Type: application/json
```

**Request Body:** (Customer data structure above)

**Response:**
```json
{
  "success": true,
  "customerId": "cust_123456789",
  "referenceNumber": "HNL-12345"
}
```

---

## Environment Variables Required

```env
POWERAI_CRM_API_URL=https://api.powerai.com/crm
POWERAI_CRM_API_KEY=your-api-key-here
POWERAI_EMAIL=team@powerai.com
```

---

## Testing CRM Integration

### Local Test

1. Set env vars in `.env.local`:
```env
POWERAI_CRM_API_URL=http://localhost:3001/crm
POWERAI_CRM_API_KEY=test-key
```

2. Test submission:
```bash
curl -X POST http://localhost:3000/api/submit-consignment \
  -H "Content-Type: application/json" \
  -d '{
    "consignor": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+61412345678",
      "address": "123 Test St",
      "suburb": "Sydney",
      "postcode": "2000",
      "abn": "12345678901"
    },
    "items": [{
      "description": "Test Item",
      "category": "Handbag",
      "qty": 1,
      "value": 5000,
      "condition": "Good"
    }],
    "commission": 30,
    "period": 90
  }'
```

3. Check PowerAI CRM for new customer record

---

## Error Handling

If CRM save fails:
- ✅ Form submission still succeeds (graceful degradation)
- ⚠️ Error logged in Vercel dashboard
- 📧 Admin notified via email
- 🔄 Manual CRM entry can be added later

---

## Future Enhancements

1. **Bulk Import:** Upload existing HN Luxury customers to CRM
2. **Sales Tracking:** Auto-update CRM when items sell
3. **Commission Calc:** Auto-calculate from CRM data
4. **Reporting:** Dashboard showing HN Luxury pipeline
5. **Email Campaigns:** Automated follow-ups via PowerAI
6. **Payment Tracking:** Monitor commission payouts

---

## Questions?

Contact PowerAI team for:
- CRM API credentials
- Testing environment setup
- Production deployment checklist

---

**Last Updated:** 2026-03-21 23:48 UTC
