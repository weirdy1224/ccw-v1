const express = require("express");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const { getConnection } = require("../config/db");

module.exports = (db) => {
  const router = express.Router();

  // Middleware: only admins allowed in this router
  router.use(auth, (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }
    next();
  });

  // GET all requests + assigned usernames
  router.get("/requests", async (req, res) => {
    try {
      const [results] = await db.query(
        `
      SELECT r.*, u.username AS assigned_username
      FROM requests r
      LEFT JOIN users u ON r.assigned_to = u.id
      ORDER BY r.created_at DESC
      `
      );
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  // GET all stations (users with role 'police')
  router.get("/stations", async (req, res) => {
    try {
      const [results] = await db.query(
        'SELECT id, username FROM users WHERE role = "CCPS"'
      );
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch stations" });
    }
  });

  // GET CCPS assignments
  router.get("/CCPS-assignments", async (req, res) => {
    try {
      const [results] = await db.query(
        `
      SELECT u.username AS CCPS_username, r.reference_number, r.status
      FROM users u
      LEFT JOIN requests r ON u.id = r.assigned_to
      WHERE u.role = 'CCPS'
      ORDER BY u.username
    `
      );
      res.json(results);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Failed to fetch CCPS assignments", error: err.message });
    }
  });

  // POST assign a request to a user (stationId can be null to unassign)
  router.post("/assign", async (req, res) => {
    const { requestId, stationId } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: "Request ID is required" });
    }

    const finalStationId = stationId || null;

    try {
      await db.query("UPDATE requests SET assigned_to = ? WHERE id = ?", [
        finalStationId,
        requestId,
      ]);
      res.json({ message: "Assignment successful" });
    } catch (err) {
      res.status(500).json({ message: "Assignment failed" });
    }
  });

  // POST Create controller user
  router.post("/create-controller", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, "controller")',
        [username, hashedPassword]
      );
      res.json({ message: "Controller account created successfully" });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Username already exists" });
      }
      res.status(500).json({ message: "Failed to create controller", error: err.message });
    }
  });

  // GET documents paths for a request by request ID
  router.get("/documents/:requestId", async (req, res) => {
    const { requestId } = req.params;

    try {
      const [results] = await db.query(
        "SELECT document_paths FROM requests WHERE id = ?",
        [requestId]
      );

      if (!results.length) return res.status(404).json({ message: "Request not found" });

      // document_paths stored as JSON string in your backend?
      // Adjust if comma-separated string
      let pathsObj;
      try {
        pathsObj = JSON.parse(results[0].document_paths);
      } catch {
        // fallback parse
        pathsObj = { all: results[0].document_paths?.split(",") || [] };
      }

      const urls = Object.entries(pathsObj).map(([key, path]) => ({
        type: key,
        url: `${req.protocol}://${req.get("host")}/${path}`,
      }));

      res.json({ urls });
    } catch (err) {
      res.status(500).json({ message: "Failed to retrieve documents", error: err.message });
    }
  });
  router.get('/controllers', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT id, username FROM users WHERE role = "controller"'
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch controllers' });
  }
});
  // POST unassign all "Pending" & assigned requests
  router.post("/requests/unassign-pending", async (req, res) => {
    try {
      const [result] = await db.query(
        "UPDATE requests SET assigned_to = NULL WHERE status = 'Pending' AND assigned_to IS NOT NULL"
      );
      res.json({ modified: result.affectedRows });
    } catch (err) {
      console.error("Unassign pending error:", err);
      res.status(500).json({ error: "Failed to unassign pending requests" });
    }
  });

  return router;
};
