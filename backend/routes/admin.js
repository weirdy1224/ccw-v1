// routes/admin.js
const express = require("express");
const bcrypt = require("bcryptjs");
const { getConnection } = require("../config/db");
const authMiddleware = require("../middleware/auth");

module.exports = () => {
  const router = express.Router();
  const db = getConnection();

  // ✅ Only admin can use these routes
  router.use(authMiddleware(["admin"]));

  /**
   * CREATE CONTROLLER
   */
  router.post("/create-controller", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        "INSERT INTO users (username, password, role) VALUES (?, ?, 'controller')",
        [username, hashedPassword]
      );

      res.json({ message: "✅ Controller account created successfully" });
    } catch (err) {
      console.error("❌ Create controller failed:", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Username already exists" });
      }
      res.status(500).json({ message: "Failed to create controller" });
    }
  });

  /**
   * CREATE CCPS
   */
  router.post("/create-ccps", async (req, res) => {
    const { username, password, zone } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        "INSERT INTO ccps (name, password, role, zone) VALUES (?, ?, 'CCPS', ?)",
        [username, hashedPassword, zone || "SP 1"]
      );
      res.json({ message: "✅ CCPS user created successfully" });
    } catch (err) {
      console.error("❌ Create CCPS failed:", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "CCPS username already exists" });
      }
      res.status(500).json({ message: "Failed to create CCPS user" });
    }
  });
router.get("/documents/:requestId", authMiddleware(["controller", "admin"]), async (req, res) => {
  const { requestId } = req.params;

  try {
    const [results] = await db.query(
      "SELECT document_paths FROM requests WHERE id = ?",
      [requestId]
    );

    if (!results.length) return res.status(404).json({ message: "Request not found" });

    let pathsObj;
    try {
      pathsObj = JSON.parse(results[0].document_paths);
    } catch {
      pathsObj = { all: results[0].document_paths?.split(",") || [] };
    }

    const urls = Object.entries(pathsObj).map(([key, filePath]) => {
      // Make relative path for URL
      const relativePath = filePath.replace(/^.*uploads[\\/]/, "uploads/");
      return {
        type: key,
        url: `${req.protocol}://${req.get("host")}/${relativePath.replace(/\\/g, "/")}`,
      };
    });

    res.json({ urls });
  } catch (err) {
    console.error("❌ Fetch documents error:", err);
    res.status(500).json({ message: "Failed to retrieve documents", error: err.message });
  }
});

  /**
   * LIST CONTROLLERS
   */
  router.get("/controllers", async (req, res) => {
    try {
      const [results] = await db.query(
        "SELECT id, username FROM users WHERE role = 'controller'"
      );
      res.json(results);
    } catch (err) {
      console.error("❌ Fetch controllers error:", err);
      res.status(500).json({ message: "Failed to fetch controllers" });
    }
  });

  /**
   * LIST CCPS USERS
   */
  router.get("/ccps", async (req, res) => {
    try {
      const [results] = await db.query(
        "SELECT ccps_id, name, zone FROM ccps ORDER BY name"
      );
      res.json(results);
    } catch (err) {
      console.error("❌ Fetch CCPS error:", err);
      res.status(500).json({ message: "Failed to fetch CCPS users" });
    }
  });

  /**
   * STATIONS (legacy alias for CCPS list)
   */
  router.get("/stations", async (req, res) => {
    try {
      const [results] = await db.query(
        "SELECT ccps_id AS id, name AS username, zone FROM ccps ORDER BY name"
      );
      res.json(results);
    } catch (err) {
      console.error("❌ Fetch stations error:", err);
      res.status(500).json({ message: "Failed to fetch stations" });
    }
  });

  /**
   * GET ALL REQUESTS (with assigned CCPS usernames)
   */
  router.get("/requests", async (req, res) => {
    try {
      const [results] = await db.query(
        `
        SELECT r.*, c.name AS assigned_ccps
        FROM requests r
        LEFT JOIN ccps c ON r.assigned_to = c.ccps_id
        ORDER BY r.created_at DESC
        `
      );
      res.json(results);
    } catch (err) {
      console.error("❌ Fetch requests error:", err);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  /**
   * GET CCPS ASSIGNMENTS
   */
  router.get("/ccps-assignments", async (req, res) => {
    try {
      const [results] = await db.query(
        `
        SELECT c.name AS ccps_name, r.reference_number, r.status
        FROM ccps c
        LEFT JOIN requests r ON c.ccps_id = r.assigned_to
        ORDER BY c.name
        `
      );
      res.json(results);
    } catch (err) {
      console.error("❌ Fetch CCPS assignments error:", err);
      res.status(500).json({ message: "Failed to fetch CCPS assignments" });
    }
  });

  /**
   * UNASSIGN ALL PENDING REQUESTS
   */
  router.post("/requests/unassign-pending", async (req, res) => {
    try {
      const [result] = await db.query(
        "UPDATE requests SET assigned_to = NULL WHERE status = 'Pending' AND assigned_to IS NOT NULL"
      );
      res.json({ modified: result.affectedRows });
    } catch (err) {
      console.error("❌ Unassign pending error:", err);
      res.status(500).json({ message: "Failed to unassign pending requests" });
    }
  });

  return router;
};
