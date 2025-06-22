const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mailer failed verification:", error);
  } else {
    console.log("✅ Mailer is ready to send emails");
  }
});

async function sendMail(to, subject, html) {
  try {
    console.log(`📤 Sending email to: ${to}`);
    console.log(`📄 Subject: ${subject}`);
    await transporter.sendMail({
      from: `"Unfreeze System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent successfully to: ${to}`);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}

module.exports = sendMail;
