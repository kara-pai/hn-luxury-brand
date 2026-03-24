/**
 * /api/capture-print.js
 * 
 * Server-side endpoint to capture form data and send to N8N webhook.
 * This removes CORS issues by doing the webhook call server-to-server.
 * 
 * Flow:
 * 1. Client POSTs form data to /api/capture-print
 * 2. This handler receives the data
 * 3. Sends to N8N webhook (server-side, no CORS)
 * 4. Returns success/failure to client
 * 5. Client then proceeds with print dialog
 */

import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { data, items, action, reference } = req.body;

    // Validate required fields
    if (!data || !items || !action) {
      return res.status(400).json({ 
        error: 'Missing required fields: data, items, action',
        received: { hasData: !!data, hasItems: !!items, hasAction: !!action }
      });
    }

    console.log(`[capture-print] Action: ${action}, Reference: ${reference}`);
    console.log(`[capture-print] Customer: ${data.consignorName}, Items: ${items.length}`);

    // Calculate total value
    const totalValue = items.reduce((sum, item) => {
      return sum + (parseFloat(item.value || 0) * parseInt(item.qty || 1));
    }, 0);

    // Prepare payload for N8N webhook
    const webhookPayload = {
      action: action, // 'submit' or 'print'
      timestamp: new Date().toISOString(),
      reference: reference || `HNL-${Date.now().toString().slice(-5)}`,
      source: 'vercel-api',
      sourceIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      
      // Customer data
      customer: {
        fullName: data.consignorName || '',
        email: data.consignorEmail || '',
        phone: data.consignorPhone || '',
        address: data.consignorAddress || '',
        suburb: data.consignorSuburb || '',
        postcode: data.consignorPostcode || '',
        abn: data.consignorABN || null
      },
      
      // Items array
      items: items.map(item => ({
        description: item.description || '',
        category: item.category || '',
        quantity: parseInt(item.qty || 1),
        estimatedValue: parseFloat(item.value || 0),
        condition: item.condition || '',
        lineTotal: parseFloat(item.value || 0) * parseInt(item.qty || 1)
      })),
      
      // Consignment terms
      commission: parseFloat(data.commissionRate || 0),
      consignmentPeriod: parseInt(data.consignmentPeriod || 90),
      additionalTerms: data.additionalTerms || '',
      
      // Summary
      totalValue: totalValue,
      itemCount: items.length,
      haveAcceptedTerms: data.acceptTerms === 'on' || data.acceptTerms === true,
      haveAcceptedACL: data.acceptACL === 'on' || data.acceptACL === true
    };

    console.log(`[capture-print] Webhook payload prepared. Total value: $${totalValue.toFixed(2)}`);

    // Send to N8N webhook (server-to-server)
    const webhookUrl = 'https://n8n.srv1422365.hstgr.cloud/webhook/hn-luxury-capture';
    console.log(`[capture-print] Sending to N8N webhook: ${webhookUrl}`);

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'hn-luxury-brand-api/1.0',
        'X-Source': 'vercel-api',
        'X-Action': action
      },
      body: JSON.stringify(webhookPayload),
      timeout: 10000 // 10 second timeout
    });

    // Check webhook response
    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(`[capture-print] Webhook error: ${webhookResponse.status} - ${errorText}`);
      
      // Still return success to client - we don't want to block the print
      // The webhook failure is logged and can be monitored
      return res.status(200).json({
        success: false,
        message: 'Form data captured but N8N sync failed. Proceeding with print anyway.',
        action: action,
        reference: reference || `HNL-${Date.now().toString().slice(-5)}`,
        webhookStatus: webhookResponse.status,
        warning: 'Data may not have been saved to Airtable. Please retry submission.'
      });
    }

    // Success!
    const webhookData = await webhookResponse.json();
    console.log(`[capture-print] ✓ Webhook successful. Response: ${JSON.stringify(webhookData).slice(0, 200)}`);

    return res.status(200).json({
      success: true,
      message: `Form data captured successfully (${action} mode)`,
      action: action,
      reference: reference || `HNL-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      totalValue: totalValue,
      itemCount: items.length,
      customerEmail: data.consignorEmail
    });

  } catch (error) {
    console.error(`[capture-print] Fatal error: ${error.message}`);
    console.error(error.stack);

    // Return error but still allow client to proceed
    return res.status(500).json({
      success: false,
      message: 'Server error during capture. Proceeding with print anyway.',
      error: error.message,
      action: 'capture-failed'
    });
  }
}
