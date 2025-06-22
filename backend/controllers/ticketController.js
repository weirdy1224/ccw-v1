const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // TLS port
  secure: false, // use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendTicketReceivedEmail = async (toEmail, ticketId) => {
  const mailOptions = {
    from: `"Unfree Portal" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '📨 Your request has been received',
    html: `
      <h3>Hello,</h3>
      <p>Your request (Ticket ID: <strong>#${ticketId}</strong>) has been received and is being processed.</p>
      <p>We'll notify you once it's completed.</p>
      <br/>
      <small>This is an automated email from Unfree Portal.</small>
    `
  };
  await transporter.sendMail(mailOptions);
};

const sendTicketCompletedEmail = async (toEmail, ticketId) => {
  const mailOptions = {
    from: `"Unfree Portal" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '✅ Your ticket is completed',
    html: `
      <h3>Hello,</h3>
      <p>Your ticket <strong>#${ticketId}</strong> has been completed.</p>
      <p>If you have more issues, feel free to raise another request.</p>
      <br/>
      <small>This is an automated email from Unfree Portal.</small>
    `
  };
  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendTicketReceivedEmail,
  sendTicketCompletedEmail
};
