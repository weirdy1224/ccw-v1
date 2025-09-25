const express = require('express');
const ccpsAuth = require('../middleware/ccpsauth.js'); // JWT middleware
const {
  sendDefreezeApprovedEmail,
  sendDefreezeRejectedEmail
} = require('../services/emailService.js');

module.exports = (db) => {
  const router = express.Router();

  // ✅ Apply auth middleware to all routes
  router.use(ccpsAuth);

  // ✅ Only CCPS role allowed
  router.use((req, res, next) => {
    if (req.user.role !== 'CCPS') {
      return res.status(403).json({ message: 'CCPS only' });
    }
    next();
  });

  // ✅ Fetch all requests assigned to this CCPS
  router.get('/requests', async (req, res) => {
    try {
      const ccpsId = req.user.ccps_id;

      const [results] = await db.query(
        'SELECT * FROM requests WHERE assigned_to = ? ORDER BY created_at DESC',
        [ccpsId]
      );
      res.json(results);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      res.status(500).json({ message: 'Failed to fetch requests', error: err.message });
    }
  });

  // ✅ Fetch CCPS stations
  router.get('/stations', async (req, res) => {
    try {
      const [results] = await db.query(
        'SELECT ccps_id, name, zone FROM ccps ORDER BY name ASC'
      );
      res.json(results);
    } catch (err) {
      console.error('Failed to fetch CCPS stations:', err);
      res.status(500).json({ message: 'Failed to fetch stations', error: err.message });
    }
  });

  // ✅ Update request status (Completed / Rejected)
  router.post('/status', async (req, res) => {
    const { requestId, status, status_reason, detailed_report } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({ message: 'Missing status info' });
    }

    try {
      const ccpsId = req.user.ccps_id;

      // Make sure request belongs to this CCPS
      const [rows] = await db.query(
        'SELECT * FROM requests WHERE id = ? AND assigned_to = ?',
        [requestId, ccpsId]
      );

      if (!rows.length) {
        return res.status(403).json({ message: 'Unauthorized or invalid request' });
      }

      const request = rows[0];
      const now = new Date();

      // Update query
      let updateQuery = 'UPDATE requests SET status = ?, status_reason = ?, detailed_report = ?';
      const updateParams = [status, status_reason || null, detailed_report || null];

      if (status === 'Completed') {
        updateQuery += ', completed_at = ?';
        updateParams.push(now);
      } else if (status === 'Rejected') {
        updateQuery += ', rejected_at = ?';
        updateParams.push(now);
      }

      updateQuery += ' WHERE id = ?';
      updateParams.push(requestId);

      await db.query(updateQuery, updateParams);
      console.log(`🔁 Updated request ${request.reference_number} → ${status}`);

      // ✅ Send emails
      if (status === 'Completed') {
        await sendDefreezeApprovedEmail({
          toEmail: request.email,
          userName: request.name,
          requestId: request.reference_number,
          accountLast4: request.account_number?.slice(-4) || 'XXXX',
          date: new Date().toLocaleDateString('en-IN')
        });
      } else if (status === 'Rejected') {
        await sendDefreezeRejectedEmail({
          toEmail: request.email,
          userName: request.name,
          requestId: request.reference_number,
          accountLast4: request.account_number?.slice(-4) || 'XXXX',
          reason: status_reason || 'Not specified',
          portalLink: 'https://unfree.portal.com',
          ioContact: 'cybercell@example.com / +91-9999999999',
          authorityName: 'SP Cyber Cell'
        });
      }

      res.json({ message: `Status updated to '${status}'` });
    } catch (err) {
      console.error('❌ Status update failed:', err.message);
      res.status(500).json({ message: 'Status update failed', error: err.message });
    }
  });

  // ✅ Decision endpoint (Accept / Decline)
  router.post('/decision', async (req, res) => {
    try {
      const { requestId, status } = req.body;

      if (!requestId || !['Accepted', 'Declined'].includes(status)) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      // Update DB
      await db.query('UPDATE requests SET status = ? WHERE id = ?', [status, requestId]);
      res.json({ success: true, message: `Request ${status}` });
    } catch (err) {
      console.error('Error in /decision:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ✅ Fetch uploaded documents
  router.get('/documents/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
      const [results] = await db.query(
        'SELECT document_paths FROM requests WHERE id = ?',
        [requestId]
      );

      if (!results.length) return res.status(404).json({ message: 'Request not found' });

      const pathsObj = JSON.parse(results[0].document_paths || '{}');
      const urls = Object.values(pathsObj).map(path => `${req.protocol}://${req.get('host')}/${path}`);
      res.json({ urls });
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      res.status(500).json({ message: 'Failed to retrieve documents', error: err.message });
    }
  });

  return router;
};
