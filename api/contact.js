import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, message } = req.body || {};

  if (!name || !email || !company || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    await resend.emails.send({
      from: 'BomFlux Website <noreply@bomflux.com>',
      to: 'michaelghatas@bomflux.com',
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
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
