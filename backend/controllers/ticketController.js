const db = require('../config/db');
const NodeClam = require('clamscan');
const path = require('path');
const { sendTicketReceivedEmail } = require('../mailer');

let clamscan;

// Initialize ClamAV once (not on every request)
(async () => {
  try {
    clamscan = await new NodeClam().init({
      debugMode: true,
      preference: 'clamscan',
      clamscan: {
        path: "C:\\Program Files\\ClamAV\\clamscan.exe",
        scanArchives: true,
        active: true
      },
      clamdscan: { active: false },
      // 🔑 Important on Windows: let Node spawn via shell
      scanLog: null,
      removeInfected: false,
      quarantineInfected: false,
      exec: { 
        shell: true // <-- Fix spawn UNKNOWN on Windows
      }
    });

    console.log("✅ ClamAV initialized");
  } catch (err) {
    console.error("❌ Failed to initialize ClamAV:", err);
  }
})();


// -------------------
// Create Ticket
// -------------------
exports.createTicket = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const filePath = req.file ? req.file.path : null;

    // 1. Scan uploaded file BEFORE saving
    if (filePath && clamscan) {
      const { isInfected, viruses } = await clamscan.scanFile(filePath);

      if (isInfected) {
        console.error("🚨 Malicious file blocked:", viruses);

        // delete the file from disk
        const fs = require('fs');
        fs.unlinkSync(filePath);

        return res.status(400).json({
          error: "Malicious file detected. Upload blocked.",
          details: viruses
        });
      }
    }

    // 2. Save to DB only if clean
    const [result] = await db.query(
      'INSERT INTO requests (name, email, subject, message, document) VALUES (?, ?, ?, ?, ?)',
      [name, email, subject, message, filePath]
    );

    // 3. Send confirmation email
    await sendTicketReceivedEmail(email, result.insertId);

    res.status(201).json({
      message: "Ticket created successfully",
      ticketId: result.insertId
    });

  } catch (err) {
    console.error("❌ Error creating ticket:", err);
    res.status(500).json({ error: "Server error" });
  }
};