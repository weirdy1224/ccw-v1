// routes/requests.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const sendMail = require('../mailer'); // Make sure this exports a mail sending function
const { getConnection } = require('../config/db');

module.exports = (db) => {
  const router = express.Router();

  // Multer setup for file uploads
  const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
      // To avoid collisions, prefix with timestamp + original extension
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });

  // Accept separate named file fields, max 1 file each
  const upload = multer({ storage }).fields([
    { name: 'id_proof', maxCount: 1 },
    { name: 'account_opening_form', maxCount: 1 },
    { name: 'business_proof', maxCount: 1 },
  ]);

  // Generate a unique reference number for each request
  const generateReferenceNumber = () =>
    'REF' + Math.random().toString(36).substr(2, 9).toUpperCase();

  // ✅ Submit new request (expects multipart/form-data with fields + files)
  router.post('/submit', upload, async (req, res) => {
    try {
      const {
        name, mobile, email, address,
        account_type, account_number,
        ncrp_ack_number,
        business_description, transaction_reason, id_proof_type
      } = req.body;

      // Validate required fields server-side (basic)
      if (!name || !mobile || !email || !account_type || !account_number || !id_proof_type) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Generate unique reference number (you might want a better approach in prod)
      const reference_number = generateReferenceNumber();

      // Extract file paths safely
      const idProofPath = req.files['id_proof'] ? req.files['id_proof'][0].path : '';
      const accountOpeningFormPath = req.files['account_opening_form'] ? req.files['account_opening_form'][0].path : '';
      const businessProofPath = req.files['business_proof'] ? req.files['business_proof'][0].path : '';

      // Store document paths as JSON string
      const documentPaths = JSON.stringify({
        id_proof: idProofPath,
        account_opening_form: accountOpeningFormPath,
        business_proof: businessProofPath
      });

      // Prepare SQL Insert statement
      const query = `
        INSERT INTO requests (
          reference_number, name, mobile, email, address,
          account_type, account_number, ncrp_ack_number,
          business_description, transaction_reason,
          id_proof_type, document_paths
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        reference_number, name, mobile, email, address || null,
        account_type, account_number, ncrp_ack_number || null,
        business_description || null, transaction_reason || null,
        id_proof_type, documentPaths
      ];

      // Execute the insert query
      await db.query(query, values);

      console.log(`✅ New request submitted: ${reference_number}`);

      // Send confirmation email to user
      await sendMail(
        email,
        'Request Submitted Successfully',
        `<p>Dear ${name},</p>
         <p>Your unfreeze request (Ref: <strong>${reference_number}</strong>) has been successfully submitted.</p>
         <p>We will notify you once it is completed.</p>`
      );

      res.status(200).json({ reference_number, message: 'Request submitted successfully' });
    } catch (err) {
      console.error('❌ Submission error:', err);
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
      console.error('❌ Tracking error:', err);
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
        ['Completed', status_reason || 'Completed by CCPS station', refId]
      );

      console.log(`✅ Request ${refId} marked as completed.`);

      // Send completion email
      await sendMail(
        request.email,
        'Request Completed',
        `<p>Dear ${request.name},</p>
         <p>Your unfreeze request (Ref: <strong>${refId}</strong>) has been marked as <strong>Completed</strong>.</p>
         <p><strong>Remarks:</strong> ${status_reason || 'N/A'}</p>`
      );

      res.status(200).json({ message: 'Request marked as completed and user notified.' });
    } catch (err) {
      console.error('❌ Completion error:', err);
      res.status(500).json({ error: 'Failed to complete request' });
    }
  });

  // ✅ Get count of pending assigned requests
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
