const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// TYPE 2 - Acknowledgment of Defreeze Request
const sendDefreezeAcknowledgment = async ({ toEmail, userName, requestId, accountLast4, ncrpRef, submittedBy, date, authorityName }) => {
  const mailOptions = {
    from: `"Cyber Crime Helpdesk" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'CONFIRMATION : Your Account Defreeze Request Has Been Received.',
    html: `
      <p>Dear ${userName},</p>
      <p>Thank you for reaching out to us. We acknowledge the receipt of your defreeze request submitted on <strong>${date}</strong> through our official online portal.</p>
      <h4>Request Details:</h4>
      <p>Request ID: <strong>${requestId}</strong><br/>
      Account Number: <strong>XXXX${accountLast4}</strong><br/>
      NCRP Reference: <strong>${ncrpRef}</strong><br/>
      Submitted By: <strong>${submittedBy}</strong></p>
      <p>Your request has been received and is currently under review by the Cyber Crime Department. The control team is in communication with the concerned CCPS station for necessary actions. You will receive a final notification once the process is completed.</p>
      <p><strong>Expected Processing Time:</strong> 3–7 working days</p>
      <p>Kindly note that the verification process may involve the Investigating Officer reviewing the details of the case. We request your full cooperation during this process. If any additional information is required, we will reach out via email or phone.</p>
      <p>Thank you for your cooperation.</p>
      <p>With Regards,<br/>
      Cyber Crime Helpdesk<br/>
      ${authorityName}<br/>
      Cyber Crime Division</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

// TYPE 3 - Request Approved (Account Unfrozen)
const sendDefreezeApprovedEmail = async ({ toEmail, userName, requestId, accountLast4, date }) => {
  const mailOptions = {
    from: `"Cyber Crime Helpdesk" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'UPDATE - Success. Your Bank Account Has Been Unfrozen',
    html: `
      <p>Dear ${userName},</p>
      <p>We are pleased to inform you that your defreeze request (ID: <strong>${requestId}</strong>), received through the official portal, has been approved, and your bank account (XXXX${accountLast4}) has been successfully unfrozen as of <strong>${date}</strong>.</p>
      <p>You may now resume regular transactions and access your banking services without restrictions.</p>
      <h4>Please Note:</h4>
      <ul>
        <li>If you were a victim of cybercrime, it is recommended to change your login credentials immediately.</li>
        <li>Monitor your account activity regularly and report any suspicious transactions promptly.</li>
      </ul>
      <p>Thank you for your cooperation.</p>
      <p>Sincerely,<br/>
      Cyber Crime Cell<br/>
      Cyber Crime Helpdesk</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

// TYPE 4 - Request Rejected
const sendDefreezeRejectedEmail = async ({ toEmail, userName, requestId, accountLast4, reason, portalLink, ioContact, authorityName }) => {
  const mailOptions = {
    from: `"Cyber Crime Helpdesk" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'UPDATE - Your Defreeze Request Has Been Rejected',
    html: `
      <p>Dear ${userName},</p>
      <p>We regret to inform you that your defreeze request (ID: <strong>${requestId}</strong>) has been rejected due to the following reason:</p>
      <p><em>${reason}</em></p>
      <p>Consequently, your bank account (XXXX${accountLast4}) will remain frozen until the identified issue is resolved or a new request is submitted with the necessary corrections.</p>
      <p>If you wish to reapply, please do so through the portal and ensure that you upload all required supporting documents.</p>
      <h4>For further assistance:</h4>
      <p>Portal: <a href="${portalLink}">${portalLink}</a><br/>
      IO details: ${ioContact}</p>
      <p>Thank you for your understanding and cooperation.</p>
      <p>Sincerely,<br/>
      Cyber Crime Helpdesk<br/>
      ${authorityName}<br/>
      Cyber Crime Division</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendDefreezeAcknowledgment,
  sendDefreezeApprovedEmail,
  sendDefreezeRejectedEmail
};
