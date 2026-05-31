import { Resend } from 'resend';

export default async function handler(req, res) {
  // CORS headers on every response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    console.log('[contact] OPTIONS preflight');
    return res.status(200).end();
  }

  console.log('[contact] handler called, method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[contact] request body:', JSON.stringify(req.body));
  console.log('[contact] RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);

  const { name, email, company, message } = req.body || {};

  if (!name || !email || !company || !message) {
    console.log('[contact] validation failed — missing fields:', { name: !!name, email: !!email, company: !!company, message: !!message });
    return res.status(400).json({ error: 'All fields are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('[contact] validation failed — invalid email:', email);
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const payload = {
    from: 'BomFlux <support@bomflux.com>',
    to: 'support@bomflux.com',
    subject: `New enquiry from ${name} at ${company} — BomFlux Website`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;color:#1a1a1a">
        <h2 style="margin-bottom:24px">New website enquiry</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px 0;color:#666;width:100px">Name</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#666">Company</td><td style="padding:8px 0;font-weight:600">${company}</td></tr>
        </table>
        <div style="margin-top:24px;padding-top:24px;border-top:1px solid #eee">
          <p style="color:#666;margin-bottom:8px">Message</p>
          <p style="line-height:1.6;white-space:pre-wrap">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
      </div>
    `,
  };

  console.log('[contact] sending to Resend, from:', payload.from, 'to:', payload.to);

  try {
    const response = await resend.emails.send(payload);
    console.log('[contact] Resend response:', JSON.stringify(response));

    if (response.error) {
      console.error('[contact] Resend returned error:', JSON.stringify(response.error));
      return res.status(500).json({ error: response.error.message || 'Resend error' });
    }

    return res.status(200).json({ success: true, id: response.data?.id });
  } catch (err) {
    console.error('[contact] caught exception:', err?.message, err?.stack);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
