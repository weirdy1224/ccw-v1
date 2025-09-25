// routes/controller.js
const express = require("express");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/auth");

module.exports = (db) => {
  const router = express.Router();

  /**
   * CREATE CCPS (only controller/admin can create)
   */
  router.post(
    "/create-CCPS",
    authMiddleware(["controller", "admin"]),
    async (req, res) => {
      const { username, password, zone } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
          `INSERT INTO ccps (name, password, role, zone) VALUES (?, ?, 'CCPS', ?)`,
          [username, hashedPassword, zone || "SP 1"]
        );

        res.json({ message: "CCPS user created successfully" });
      } catch (err) {
        console.error("❌ Create CCPS error:", err);
        res.status(400).json({ message: "Error creating CCPS user", error: err.message });
      }
    }
  );

  /**
   * LIST CONTROLLERS
   */
  router.get(
    "/controllers",
    authMiddleware(["admin", "controller"]),
    async (req, res) => {
      try {
        const [results] = await db.query(
          "SELECT id, username FROM users WHERE role = 'controller'"
        );
        res.json(results);
      } catch (err) {
        console.error("❌ Fetch controllers error:", err);
        res.status(500).json({ message: "Failed to fetch controllers" });
      }
    }
  );

  /**
   * GET CCPS ASSIGNMENTS (which CCPS has which requests)
   */
  router.get(
    "/CCPS-assignments",
    authMiddleware(["controller", "admin"]),
    async (req, res) => {
      try {
        const [results] = await db.query(`
          SELECT c.name AS CCPS_username, r.reference_number, r.status
          FROM ccps c
          LEFT JOIN requests r ON c.ccps_id = r.assigned_to
          ORDER BY c.name
        `);
        res.json(results);
      } catch (err) {
        console.error("❌ Fetch CCPS assignments error:", err);
        res.status(500).json({ message: "Failed to fetch CCPS assignments" });
      }
    }
  );

  /**
   * GET DOCUMENTS FOR A REQUEST
   */
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
   * LIST CCPS STATIONS
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
   * GET ALL REQUESTS (with assigned CCPS names)
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
   * ASSIGN REQUEST TO A CCPS
   */
  router.post(
    "/assign",
    authMiddleware(["controller", "admin"]),
    async (req, res) => {
      const { requestId, stationId } = req.body;

      if (!requestId || !stationId) {
        return res
          .status(400)
          .json({ message: "Missing or invalid requestId/stationId" });
      }

      try {
        await db.query("UPDATE requests SET assigned_to = ? WHERE id = ?", [
          stationId,
          requestId,
        ]);
        res.json({ message: "Assigned successfully" });
      } catch (err) {
        console.error("❌ Assign request error:", err);
        res
          .status(500)
          .json({ message: "Assignment failed", error: err.message });
      }
    }
  );

  return router;
};
