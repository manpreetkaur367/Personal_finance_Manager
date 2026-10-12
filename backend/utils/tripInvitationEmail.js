const nodemailer = require('nodemailer');

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const createTransport = () => {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
  if (!user || !pass) {
    throw new Error('Gmail invitation email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in backend .env.');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

const sendTripInvitation = async ({ to, tripName, inviterName, token }) => {
  const frontendUrl = process.env.FRONTEND_URL?.trim();
  if (!frontendUrl) throw new Error('FRONTEND_URL must be configured before sending trip invitations.');

  const acceptUrl = new URL('/invite/accept', frontendUrl);
  acceptUrl.searchParams.set('token', token);
  const safeTrip = escapeHtml(tripName);
  const safeInviter = escapeHtml(inviterName);
  const safeUrl = escapeHtml(acceptUrl.toString());
  const fromName = process.env.MAIL_FROM_NAME?.trim() || 'SpendWise';

  const result = await createTransport().sendMail({
    from: { name: fromName, address: process.env.GMAIL_USER.trim() },
    to,
    subject: `${tripName} — invitation to join on SpendWise`,
    text: `${inviterName} invited you to join the trip "${tripName}" on SpendWise. Accept your invitation: ${acceptUrl.toString()}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><h2>You're invited to ${safeTrip}</h2><p><strong>${safeInviter}</strong> invited you to join this trip on SpendWise.</p><p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#00d99a;color:#071b15;text-decoration:none;border-radius:8px;font-weight:bold">Accept Invitation</a></p><p style="color:#64748b;font-size:13px">This invitation expires in 7 days. If the button does not work, open this link:<br>${safeUrl}</p></div>`,
  });

  if (!result.accepted?.includes(to)) {
    throw new Error('Gmail did not accept the invitation email recipient.');
  }
};

module.exports = { sendTripInvitation };
