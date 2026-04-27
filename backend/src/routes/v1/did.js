const express = require('express');
const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: DID
 *   description: Decentralized Identifier operations (placeholder endpoints)
 */

/**
 * @openapi
 * /did:
 *   get:
 *     summary: Test DID route
 *     tags: [DID]
 *     responses:
 *       200:
 *         description: Simple response indicating DID route works
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

module.exports = router;
