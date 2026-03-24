import nodemailer from 'nodemailer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { consignor, items, commission, period, terms, additionalTerms } = req.body;

    // Validate required fields
    if (!consignor || !consignor.name || !consignor.email || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate reference number
    const refNumber = `HNL-${Date.now().toString().slice(-5).padStart(5, '0')}`;

    // Save customer to PowerAI CRM
    const crmData = await saveCustomerToCRM(consignor, refNumber, items);

    // Generate PDF
    const pdfBuffer = await generatePDF(consignor, items, commission, period, terms);

    // Send email
    await sendEmail(consignor, pdfBuffer, refNumber);

    return res.status(200).json({
      success: true,
      message: 'Form submitted successfully. PDF sent to ' + consignor.email,
      refNumber: refNumber,
      crmId: crmData.customerId
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function saveCustomerToCRM(consignor, refNumber, items) {
  try {
    // Prepare customer data for N8N Airtable workflow
    const customerData = {
      customer: {
        fullName: consignor.name,
        email: consignor.email,
        phone: consignor.phone,
        address: consignor.address,
        suburb: consignor.suburb,
        postcode: consignor.postcode,
        abn: consignor.abn || null,
        commission: consignor.commission || 0,
        period: consignor.period || 0,
        totalValue: items.reduce((sum, item) => sum + (parseFloat(item.value) * parseFloat(item.qty)), 0)
      },
      items: items.map(item => ({
        description: item.description,
        value: item.value,
        action: 'consignment',
        reference: refNumber
      })),
      action: 'consignment',
      reference: refNumber,
      webhookUrl: 'https://n8n.srv1422365.hstgr.cloud/webhook/hn-luxury-capture',
      executionMode: 'production'
    };

    // Send to N8N webhook for Airtable sync
    const response = await fetch('https://n8n.srv1422365.hstgr.cloud/webhook/hn-luxury-capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customerData)
    });

    if (!response.ok) {
      console.error('N8N webhook error:', response.status, await response.text());
      return { customerId: 'error', saved: false };
    }

    console.log('Customer data sent to N8N → Airtable');

    return {
      customerId: refNumber,
      saved: true
    };

  } catch (error) {
    console.error('Error sending to N8N:', error);
    // Don't throw - allow form submission even if N8N sync fails
    return { customerId: null, saved: false };
  }
}

async function generatePDF(consignor, items, commission, period, terms) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  let yPosition = height - 50;

  // Header
  page.drawText('HN LUXURY BRAND', {
    x: 50,
    y: yPosition,
    size: 20,
    font: timesBold,
    color: rgb(0, 0, 0)
  });

  yPosition -= 30;
  page.drawText('CONSIGNMENT AGREEMENT FORM', {
    x: 50,
    y: yPosition,
    size: 12,
    font: timesBold,
    color: rgb(0.2, 0.2, 0.2)
  });

  yPosition -= 30;
  page.drawText(`Ref: HNL-${Date.now().toString().slice(-5).padStart(5, '0')}`, {
    x: 50,
    y: yPosition,
    size: 10,
    font: timesRoman,
    color: rgb(0.5, 0.5, 0.5)
  });

  yPosition -= 40;

  // Consignor Section
  page.drawText('CONSIGNOR INFORMATION', {
    x: 50,
    y: yPosition,
    size: 11,
    font: timesBold,
    color: rgb(0, 0, 0)
  });

  yPosition -= 25;
  page.drawText(`Name: ${consignor.name}`, { x: 50, y: yPosition, size: 10, font: timesRoman });
  yPosition -= 15;
  page.drawText(`Email: ${consignor.email}`, { x: 50, y: yPosition, size: 10, font: timesRoman });
  yPosition -= 15;
  page.drawText(`Phone: ${consignor.phone}`, { x: 50, y: yPosition, size: 10, font: timesRoman });
  yPosition -= 15;
  page.drawText(`Address: ${consignor.address}, ${consignor.suburb} ${consignor.postcode}`, {
    x: 50,
    y: yPosition,
    size: 10,
    font: timesRoman
  });

  yPosition -= 30;

  // Items Section
  page.drawText('CONSIGNMENT ITEMS', {
    x: 50,
    y: yPosition,
    size: 11,
    font: timesBold,
    color: rgb(0, 0, 0)
  });

  yPosition -= 20;

  // Table header
  const colX = [50, 180, 260, 330, 420, 500];
  const headers = ['Description', 'Category', 'Qty', 'Value (AUD)', 'Condition', 'Total'];
  
  headers.forEach((header, idx) => {
    page.drawText(header, {
      x: colX[idx],
      y: yPosition,
      size: 9,
      font: timesBold,
      color: rgb(0.2, 0.2, 0.2)
    });
  });

  yPosition -= 15;

  // Items rows
  items.forEach(item => {
    const totalValue = (parseFloat(item.value) * parseFloat(item.qty)).toFixed(2);
    page.drawText(item.description, { x: colX[0], y: yPosition, size: 8, font: timesRoman });
    page.drawText(item.category, { x: colX[1], y: yPosition, size: 8, font: timesRoman });
    page.drawText(item.qty, { x: colX[2], y: yPosition, size: 8, font: timesRoman });
    page.drawText('$' + parseFloat(item.value).toFixed(2), { x: colX[3], y: yPosition, size: 8, font: timesRoman });
    page.drawText(item.condition, { x: colX[4], y: yPosition, size: 8, font: timesRoman });
    page.drawText('$' + totalValue, { x: colX[5], y: yPosition, size: 8, font: timesRoman });
    yPosition -= 12;
  });

  yPosition -= 15;

  // Terms
  page.drawText('TERMS & CONDITIONS', {
    x: 50,
    y: yPosition,
    size: 11,
    font: timesBold,
    color: rgb(0, 0, 0)
  });

  yPosition -= 20;
  page.drawText(`Commission Rate: ${commission}%`, { x: 50, y: yPosition, size: 9, font: timesRoman });
  yPosition -= 12;
  page.drawText(`Consignment Period: ${period} days`, { x: 50, y: yPosition, size: 9, font: timesRoman });

  yPosition -= 25;
  page.drawText('Signature: ___________________     Date: ___________________', {
    x: 50,
    y: yPosition,
    size: 9,
    font: timesRoman
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function sendEmail(consignor, pdfBuffer, refNumber) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: consignor.email,
    subject: `HN Luxury Brand - Consignment Agreement Received (Ref: ${refNumber})`,
    html: `
      <h2>Consignment Agreement Confirmation</h2>
      <p>Hi ${consignor.name},</p>
      <p>Thank you for submitting your consignment items to HN Luxury Brand. Your agreement form is attached below.</p>
      <p><strong>Reference Number:</strong> ${refNumber}</p>
      <p>We will review your items and contact you within 2 business days.</p>
      <p>Best regards,<br/>HN Luxury Brand</p>
    `,
    attachments: [
      {
        filename: `${refNumber}-Consignment-${consignor.name}-${new Date().toISOString().split('T')[0]}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  // Also send to HN Luxury Brand + PowerAI team
  await transporter.sendMail({
    ...mailOptions,
    to: process.env.HN_LUXURY_EMAIL,
    cc: process.env.POWERAI_EMAIL || '',
    subject: `New Consignment Submission - ${consignor.name} (${refNumber})`,
    html: `
      <h2>New Consignment Submission</h2>
      <p><strong>Reference Number:</strong> ${refNumber}</p>
      <p><strong>From:</strong> ${consignor.name}</p>
      <p><strong>Email:</strong> ${consignor.email}</p>
      <p><strong>Phone:</strong> ${consignor.phone}</p>
      <p><strong>Address:</strong> ${consignor.address}, ${consignor.suburb} ${consignor.postcode}</p>
      <p><strong>ABN:</strong> ${consignor.abn || 'N/A'}</p>
      <p><em>Note: Customer information has been saved to PowerAI CRM for tracking and follow-up.</em></p>
      <p>See attached PDF for full details.</p>
    `
  });

  // Send to consignor
  await transporter.sendMail(mailOptions);
}
