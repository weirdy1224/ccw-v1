// utils/mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
  connectionTimeout: 30_000,
  socketTimeout: 30_000,
});

async function verifyTransport() {
  try {
    await transporter.verify();
    console.log('✅ Mailer is ready to send emails');
  } catch (error) {
    console.error('❌ Mailer failed verification:', error);
  }
}
verifyTransport();

function toPlainText(html = '') {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

async function sendMail(to, subject, html) {
  console.log(`📤 Sending email to: ${to}`);
  console.log(`📄 Subject: ${subject}`);
  try {
    const info = await transporter.sendMail({
      from: `"Unfreeze System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: toPlainText(html),
    });
    console.log(`✅ Email accepted: ${info.accepted?.join(', ') || '[]'} | messageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

module.exports = { sendMail };
