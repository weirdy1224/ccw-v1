const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1️⃣ Request Received Email
const sendTicketReceivedEmail = async (toEmail, ticketId) => {
  const mailOptions = {
    from: `"Unfree Portal Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '📨 Your request has been received',
    html: `
      <h3>Hello,</h3>
      <p>We’ve received your support request. Your ticket <strong>#${ticketId}</strong> is now being processed by our team.</p>
      <p>You’ll get another email when it’s completed.</p>
      <br/>
      <p>Thank you,<br/>Unfree Portal Support Team</p>
      <hr/>
      <small>This is an automated email. Please do not reply.</small>
    `
  };

  await transporter.sendMail(mailOptions);
};

// 2️⃣ Completion Email
const sendTicketCompletedEmail = async (toEmail, ticketId) => {
  const mailOptions = {
    from: `"Unfree Portal Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '✅ Your ticket has been completed',
    html: `
      <h3>Hello,</h3>
      <p>Your ticket <strong>#${ticketId}</strong> has been successfully completed.</p>
      <p>If you have any further issues, feel free to raise another request.</p>
      <br/>
      <p>Best regards,<br/>Unfree Portal Support Team</p>
      <hr/>
      <small>This is an automated email. Please do not reply.</small>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendTicketReceivedEmail,
  sendTicketCompletedEmail
};
