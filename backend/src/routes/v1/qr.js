const express = require("express");
const router = express.Router();
const qrService = require("../services/qrService");

/**
 * @openapi
 * tags:
 *   name: QR
 *   description: QR code generation and validation
 */

/**
 * @openapi
 * /qr/generate:
 *   post:
 *     summary: Generate QR code payload
 *     tags: [QR]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payload:
 *                 type: object
 *                 description: Data to encode in QR code
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     deepLink:
 *                       type: string
 */
router.post("/generate", (req, res) => {
  try {
    const { token, deepLink } = qrService.generateToken(req.body);
    return res.status(200).json({ success: true, data: { token, deepLink } });
  } catch (err) {
    if (err.validationErrors) {
      return res
        .status(400)
        .json({ success: false, errors: err.validationErrors });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @openapi
 * /qr/validate:
 *   post:
 *     summary: Validate QR code token
 *     tags: [QR]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT token to validate
 *     responses:
 *       200:
 *         description: Token validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Invalid or expired token
 */
router.post("/validate", (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ success: false, error: "token is required" });
  }
  try {
    const payload = qrService.validateToken(token);
    return res.status(200).json({ success: true, data: payload });
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, error: "Token expired or tampered" });
  }
});

module.exports = router;
