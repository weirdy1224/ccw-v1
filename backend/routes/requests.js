const express = require('express');
const multer = require('multer');
const path = require('path');
const sendMail = require('../mailer'); // Email module
const { getConnection } = require('../config/db');
module.exports = (db) => {
  const router = express.Router();

  // Multer setup for file uploads
  const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });

  // Generate a unique reference number
  const generateReferenceNumber = () =>
    'REF' + Math.random().toString(36).substr(2, 9).toUpperCase();

  // ✅ Submit new request
  router.post('/submit', upload.array('documents', 5), async (req, res) => {
    try {
      const {
        name, mobile, email, address,
        account_type, account_ownership, account_number,
        ncrp_ack_number, account_opening_year,
        business_description, transaction_reason, id_proof_type
      } = req.body;

      const reference_number = generateReferenceNumber();
      const document_paths = req.files ? req.files.map(file => file.path).join(',') : '';

      const query = `
        INSERT INTO requests (
          reference_number, name, mobile, email, address,
          account_type, account_ownership, account_number, ncrp_ack_number,
          account_opening_year, business_description, transaction_reason,
          id_proof_type, document_paths
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        reference_number, name, mobile, email, address,
        account_type, account_ownership, account_number, ncrp_ack_number,
        account_opening_year, business_description, transaction_reason,
        id_proof_type, document_paths
      ];

      await db.query(query, values);
      console.log(`✅ New request submitted: ${reference_number}`);

      // ✉️ Send email to user on submission
      await sendMail(
        email,
        'Request Submitted Successfully',
        `<p>Dear ${name},</p>
         <p>Your unfreeze request (Ref: <strong>${reference_number}</strong>) has been successfully submitted.</p>
         <p>We will notify you once it is completed.</p>`
      );

      res.status(200).json({ reference_number, message: 'Request submitted successfully' });
    } catch (err) {
      console.error('❌ Submission error:', err.message);
      res.status(500).json({ message: 'Error submitting request' });
    }
  });

  // ✅ Track status by reference number
  router.get('/track/:refId', async (req, res) => {
    const { refId } = req.params;

    try {
      const [results] = await db.query('SELECT * FROM requests WHERE reference_number = ?', [refId]);

      if (!results.length) {
        return res.status(404).json({ error: 'Request not found' });
      }

      res.status(200).json(results[0]);
    } catch (err) {
      console.error('❌ Tracking error:', err.message);
      res.status(500).json({ error: 'Failed to fetch request status' });
    }
  });

  // ✅ Mark request as completed and send email
  router.put('/complete/:refId', async (req, res) => {
    const { refId } = req.params;
    const { status_reason } = req.body;

    try {
      const [rows] = await db.query('SELECT * FROM requests WHERE reference_number = ?', [refId]);

      if (!rows.length) {
        return res.status(404).json({ error: 'Request not found' });
      }

      const request = rows[0];

      await db.query(
        'UPDATE requests SET status = ?, status_reason = ? WHERE reference_number = ?',
        ['Completed', status_reason || 'Completed by police station', refId]
      );

      console.log(`✅ Request ${refId} marked as completed.`);

      // ✉️ Send completion email to user
      await sendMail(
        request.email,
        'Request Completed',
        `<p>Dear ${request.name},</p>
         <p>Your unfreeze request (Ref: <strong>${refId}</strong>) has been marked as <strong>Completed</strong>.</p>
         <p><strong>Remarks:</strong> ${status_reason || 'N/A'}</p>`
      );

      res.status(200).json({ message: 'Request marked as completed and user notified.' });
    } catch (err) {
      console.error('❌ Completion error:', err.message);
      res.status(500).json({ error: 'Failed to complete request' });
    }
  });
router.get('/pending-assigned-count', async (req, res) => {
  try {
    const db = getConnection();
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM requests WHERE status = 'Pending' AND assigned_to IS NOT NULL"
    );
    res.json({ pendingAssigned: rows[0].count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database query failed' });
  }
});
  return router;
};
