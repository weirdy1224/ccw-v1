// routes/requests.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const fssync = require('fs');
const NodeClam = require('clamscan');
const { sendMail } = require('../mailer');

console.log('Requests router loaded from', __filename);

// ----------------- Upload Folders -----------------
const tempDir = path.join(__dirname, '../temp_uploads');
const finalDir = path.join(__dirname, '../uploads');
if (!fssync.existsSync(tempDir)) fssync.mkdirSync(tempDir, { recursive: true });
if (!fssync.existsSync(finalDir)) fssync.mkdirSync(finalDir, { recursive: true });

// ----------------- Helpers -----------------
const isLikelyPdfByMagic = async (filePath) => {
  const fh = await fs.open(filePath, 'r');
  try {
    const { buffer } = await fh.read({ length: 5, position: 0 });
    return buffer.toString('utf8').startsWith('%PDF-');
  } finally {
    await fh.close();
  }
};

const isEncryptedPdf = async (filePath) => {
  const fh = await fs.open(filePath, 'r');
  try {
    const { buffer } = await fh.read({ length: 8192, position: 0 });
    return /\/Encrypt\b/.test(buffer.toString('utf8'));
  } finally {
    await fh.close();
  }
};

async function cleanupTemp(filesObj) {
  if (!filesObj) return;
  const files = Object.values(filesObj).flat();
  await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
}

// ----------------- Multer Setup (save to temp first) -----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const base = path.parse(file.originalname).name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${uniqueSuffix}-${base}.pdf`);
  }
});

const fileFilter = (req, file, cb) => {
  const mimetypeOk = file.mimetype === 'application/pdf';
  const extOk = /\.pdf$/i.test(file.originalname);
  if (mimetypeOk && extOk) return cb(null, true);
  return cb(new Error('Only PDF files are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 3
  }
}).fields([
  { name: 'id_proof', maxCount: 1 },
  { name: 'account_opening_form', maxCount: 1 },
  { name: 'business_proof', maxCount: 1 }
]);

// ----------------- ClamAV Init -----------------
let clamscanInstance;
(async () => {
  try {
    clamscanInstance = await new NodeClam().init({
      removeInfected: false,
      quarantineInfected: false,
      scanRecursively: false,
      debugMode: true,
      
      preference: 'clamscan', // simpler on macOS
      clamscan: {
        path: process.env.CLAMSCAN_PATH || "C:\\Program Files\\ClamAV\\clamscan.exe", // update for your platform
        scanArchives: true
      },
      clamdscan: {
        host: process.env.CLAMD_HOST || '127.0.0.1',
        port: Number(process.env.CLAMD_PORT || 3310),
        timeout: 60000,
        active: false
      }
    });
    const ver = await clamscanInstance.getVersion().catch(() => null);
    console.log('✅ ClamAV initialized', ver ? `(${ver})` : '');
    console.log('[ENV] CLAMSCAN_PATH', process.env.CLAMSCAN_PATH || '(default)');
  } catch (err) {
    console.error('❌ Failed to initialize ClamAV:', err);
  }
})();

function normalizeScanResult(result) {
  const infected = typeof result === 'boolean' ? result : !!result?.isInfected;
  const viruses = Array.isArray(result?.viruses) ? result.viruses : [];
  return { infected, viruses };
}

// ----------------- Routes -----------------
module.exports = (db) => {
  router.post('/submit', (req, res) => {
    console.log('[ROUTE] /api/requests/submit hit', new Date().toISOString());

    upload(req, res, async (uploadErr) => {
      if (uploadErr) {
        const message = uploadErr.message || 'Upload error';
        console.error('[UPLOAD] Error:', message);
        return res.status(400).json({ message });
      }

      const {
        name, mobile, email, address,
        account_type, account_number,
        ncrp_ack_number,
        business_description, transaction_reason, id_proof_type
      } = req.body || {};

      if (!name || !mobile || !email || !account_type || !account_number || !id_proof_type) {
        await cleanupTemp(req.files);
        return res.status(400).json({ message: 'Missing required fields' });
      }

      if (!clamscanInstance) {
        console.error('[SCAN] clamscanInstance missing');
        await cleanupTemp(req.files);
        try {
          await sendMail(
            email,
            'Upload deferred: virus scanner temporarily unavailable',
            `<p>Dear ${name},</p>
             <p>Your upload could not be processed because our virus scanner is temporarily unavailable.</p>
             <p>Please try again later.</p>`
          );
        } catch (_) {}
        return res.status(503).json({ message: 'Virus scanner not available. Please try later.' });
      }

      try {
       const tempFiles = [];
if (req.files?.['id_proof']?.[0]) tempFiles.push(req.files['id_proof'][0]);
if (req.files?.['account_opening_form']?.[0]) tempFiles.push(req.files['account_opening_form'][0]);
if (req.files?.['business_proof']?.[0]) tempFiles.push(req.files['business_proof'][0]);

        console.log('[FILES] Received:', tempFiles.map(f => `${f.fieldname}:${f.originalname}`).join(', ') || 'none');

        const cleanFiles = {};

        for (const file of tempFiles) {
          console.log('[SCAN] Start for', file.originalname, 'at', file.path);

          const isPdf = await isLikelyPdfByMagic(file.path);
          console.log('[SCAN] Magic header =>', isPdf);
          if (!isPdf) {
            await fs.unlink(file.path).catch(() => {});
            try {
              await sendMail(
                email,
                'Upload blocked: invalid PDF',
                `<p>Dear ${name},</p>
                 <p>Your file <strong>${file.originalname}</strong> is not a valid PDF and was rejected.</p>
                 <p>Please upload a genuine PDF file.</p>`
              );
            } catch (_) {}
            return res.status(400).json({
              message: `File "${file.originalname}" is not a valid PDF (magic header missing).`
            });
          }

          if (process.env.BLOCK_ENCRYPTED_PDF === 'true') {
            const encrypted = await isEncryptedPdf(file.path);
            console.log('[SCAN] Encrypted =>', encrypted);
            if (encrypted) {
              await fs.unlink(file.path).catch(() => {});
              try {
                await sendMail(
                  email,
                  'Upload blocked: encrypted PDF not allowed',
                  `<p>Dear ${name},</p>
                   <p>Your file <strong>${file.originalname}</strong> is password-protected or encrypted and cannot be accepted.</p>
                   <p>Please provide an unencrypted PDF.</p>`
                );
              } catch (_) {}
              return res.status(400).json({
                message: `File "${file.originalname}" appears to be password-protected or encrypted, which is not allowed.`
              });
            }
          }

          console.log('[SCAN] Invoking ClamAV');
          let scanResult;
          try {
            scanResult = await clamscanInstance.isInfected(file.path);
          } catch (scanErr) {
            await fs.unlink(file.path).catch(() => {});
            console.error('🔍 Scan error:', scanErr);
            try {
              await sendMail(
                email,
                'Upload failed: scanning error',
                `<p>Dear ${name},</p>
                 <p>Your file <strong>${file.originalname}</strong> could not be scanned due to an internal error and was not accepted.</p>
                 <p>Please try again later.</p>`
              );
            } catch (_) {}
            return res.status(502).json({ message: 'Scanning error. Please try again.' });
          }

          const { infected, viruses } = normalizeScanResult(scanResult);
          console.log('[SCAN] Result => infected:', infected, 'viruses:', viruses);
          if (infected) {
            await fs.unlink(file.path).catch(() => {});
            try {
              await sendMail(
                email,
                'Upload blocked: malicious file detected',
                `<p>Dear ${name},</p>
                 <p>Your upload was blocked because the file <strong>${file.originalname}</strong> was detected as <strong>malicious</strong>.</p>
                 <p>Detected threat(s): <code>${viruses.join(', ') || 'Unknown malware'}</code></p>
                 <p>Please upload a clean PDF.</p>`
              );
            } catch (mailErr) {
              console.error('📧 Malware email failed:', mailErr);
            }
            return res.status(400).json({
              message: `File "${file.originalname}" is malicious and has been blocked.`,
              infectedFiles: viruses
            });
          }

          const finalPath = path.join(finalDir, path.basename(file.path));
          console.log('[MOVE] Moving clean file to', finalPath);
          await fs.rename(file.path, finalPath);
          cleanFiles[file.fieldname] = finalPath;
        }

        const reference_number = 'REF' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const documentPaths = JSON.stringify({
          id_proof: cleanFiles['id_proof'] || '',
          account_opening_form: cleanFiles['account_opening_form'] || '',
          business_proof: cleanFiles['business_proof'] || ''
        });

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

        await db.query(query, values);
        console.log(`✅ Clean request submitted: ${reference_number}`);

        try {
          await sendMail(
            email,
            'Request Submitted Successfully',
            `<p>Dear ${name},</p>
             <p>Your unfreeze request (Ref: <strong>${reference_number}</strong>) has been successfully submitted.</p>
             <p>We will notify you once it is completed.</p>`
          );
        } catch (mailErr) {
          console.error('📧 Success email failed:', mailErr);
        }

        res.status(200).json({ reference_number, message: 'Request submitted successfully' });
      } catch (err) {
        console.error('❌ Submission error:', err);
        await cleanupTemp(req.files);
        res.status(500).json({ message: 'Error submitting request' });
      }
    });
  });

  router.get('/status/:reference', async (req, res) => {
    try {
      const reference_number = req.params.reference;
      const [rows] = await db.query('SELECT status FROM requests WHERE reference_number = ?', [reference_number]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: 'Request not found' });
      }
      res.json({ reference_number, status: rows[0].status });
    } catch (err) {
      console.error('❌ Status check error:', err);
      res.status(500).json({ message: 'Error fetching request status' });
    }
  });

  return router;
};
