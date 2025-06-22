const express = require('express');
const multer = require('multer');
const path = require('path');

module.exports = (db) => {
  const router = express.Router();

  // Multer setup for file uploads
  const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
  });

  const upload = multer({ storage });

  // Function to generate a unique reference number
  const generateReferenceNumber = () =>
    'REF' + Math.random().toString(36).substr(2, 9).toUpperCase();

  // ✅ POST /api/requests/submit - Submit new request
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
      console.log(`✅ New request submitted. Ref#: ${reference_number}`);
      res.json({ reference_number, message: 'Request submitted successfully' });
    } catch (err) {
      console.error('❌ DB error:', err.message);
      res.status(500).json({ message: 'Error submitting request' });
    }
  });

  router.get('/track/:refId', async (req, res) => {
    const { refId } = req.params;

    try {
      const query = 'SELECT * FROM requests WHERE reference_number = ?';
      const [results] = await db.query(query, [refId]);

      if (!results || results.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }

      res.status(200).json(results[0]);
    } catch (err) {
      console.error('❌ Error tracking request:', err.message);
      res.status(500).json({ error: 'Error fetching request status' });
    }
  });

  return router;
};
