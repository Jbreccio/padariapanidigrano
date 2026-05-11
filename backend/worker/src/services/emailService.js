// backend/worker/src/services/emailService.js

export async function sendEmail(env, { to, subject, html }) {
  if (!env.RESEND_API_KEY) {
    throw new Error('Email service not configured');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Santuario <noreply@santuariodefatima.com.br>',
      to: [to],
      subject,
      html
    })
  });

  return await res.json();
}