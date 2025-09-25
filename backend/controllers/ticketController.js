const db = require('../config/db');
const NodeClam = require('clamscan');
const path = require('path');
const fs = require('fs');
const { sendTicketReceivedEmail } = require('../mailer');

let clamscan; // global instance

// ------------------------------------
// Initialize ClamAV once on server start
// ------------------------------------
(async () => {
  try {
    clamscan = await new NodeClam().init({
      debugMode: true,
      preference: 'clamscan',      // Prefer using clamscan binary
      clamscan: {
        path: "C:\\Program Files\\ClamAV\\clamscan.exe", // Path to clamscan binary
        scanArchives: true,
        active: true
      },
      clamdscan: { active: false },
      removeInfected: false,       // Don't remove automatically
      quarantineInfected: false,   // Don't quarantine automatically
      scanLog: null,                // Optional: set path to scan log
      exec: {
        shell: true                 // Needed on Windows to fix spawn UNKNOWN
      }
    });

    console.log("✅ ClamAV initialized");
  } catch (err) {
    console.error("❌ Failed to initialize ClamAV:", err);
  }
})();


// ------------------------------------
// Create Ticket Controller
// ------------------------------------
exports.createTicket = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const filePath = req.file ? req.file.path : null;

    // 1. Scan uploaded file BEFORE saving to DB
    if (filePath && clamscan) {
      console.log(`🦠 Scanning uploaded file: ${filePath}`);
      const { isInfected, viruses } = await clamscan.scanFile(filePath);

      if (isInfected) {
        console.error("🚨 Malicious file blocked:", viruses);

        // Delete infected file from disk
        fs.unlinkSync(filePath);

        return res.status(400).json({
          error: "Malicious file detected. Upload blocked.",
          details: viruses
        });
      }
    }

    // 2. Insert request into database
    const [result] = await db.query(
      'INSERT INTO requests (name, email, subject, message, document) VALUES (?, ?, ?, ?, ?)',
      [name, email, subject, message, filePath]
    );

    // 3. Send confirmation email
    await sendTicketReceivedEmail(email, result.insertId);

    // 4. Respond to client
    res.status(201).json({
      message: "Ticket created successfully",
      ticketId: result.insertId
    });

  } catch (err) {
    console.error("❌ Error creating ticket:", err);
    res.status(500).json({ error: "Server error" });
  }
};
