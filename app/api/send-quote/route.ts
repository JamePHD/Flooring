import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

interface QuoteRequestBody {
  customerName: string;
  customerEmail: string;
  customerNotes: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  finalTotal: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: QuoteRequestBody = await request.json();

    // Validate required fields
    if (!body.customerName || !body.customerEmail || !body.items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format the quote details for the email
    const itemsList = body.items
      .map(
        (item) =>
          `${item.name}: ${item.quantity}m² @ $${item.price.toFixed(2)}/m² = $${(item.quantity * item.price).toFixed(2)}`
      )
      .join('\n');

    const emailHtml = `
      <h2>New Quote Request</h2>
      <p><strong>Customer Name:</strong> ${body.customerName}</p>
      <p><strong>Customer Email:</strong> ${body.customerEmail}</p>
      
      <h3>Items Requested:</h3>
      <pre>${itemsList}</pre>
      
      <h3>Quote Summary:</h3>
      <p><strong>Subtotal:</strong> $${body.subtotal.toFixed(2)}</p>
      <p><strong>Tax:</strong> $${body.tax.toFixed(2)}</p>
      <p><strong>Estimated Total:</strong> $${body.finalTotal.toFixed(2)}</p>
      
      ${body.customerNotes ? `<h3>Additional Notes:</h3><p>${body.customerNotes}</p>` : ''}
    `;

    // Send email to sales rep
    const salesEmail = process.env.SALES_REP_EMAIL || 'sales@salesdomain.com';
    const fromEmail = process.env.FROM_EMAIL || 'noreply@example.com';
    
    await resend.emails.send({
      from: fromEmail,
      to: salesEmail,
      subject: `New Quote Request from ${body.customerName}`,
      html: emailHtml,
      replyTo: body.customerEmail,
    });

    return NextResponse.json(
      { success: true, message: 'Quote request sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending quote email:', error);
    return NextResponse.json(
      { error: 'Failed to send quote request' },
      { status: 500 }
    );
  }
}
