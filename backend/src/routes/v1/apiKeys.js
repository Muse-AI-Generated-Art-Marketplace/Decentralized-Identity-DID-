const express = require('express');
const router = express.Router();
const apiKeyService = require('../services/apiKeyService');

/**
 * @openapi
 * tags:
 *   name: API Keys
 *   description: API key management for authentication and access control
 */

/**
 * @openapi
 * /api-keys:
 *   post:
 *     summary: Generate a new API Key
 *     tags: [API Keys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, owner]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name/description of the API key
 *               owner:
 *                 type: string
 *                 description: Owner identifier (e.g., user ID or address)
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of permissions granted
 *                 default: ['read']
 *               expiresInDays:
 *                 type: integer
 *                 description: Number of days until expiration
 *                 default: 30
 *     responses:
 *       201:
 *         description: API key created successfully
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
 *                     key:
 *                       type: string
 *                     name:
 *                       type: string
 *                     owner:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, owner, permissions, expiresInDays } = req.body;
    const apiKey = await apiKeyService.generateApiKey(name, owner, permissions, expiresInDays);
    res.status(201).json({
      success: true,
      data: apiKey
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api-keys/{owner}:
 *   get:
 *     summary: List API Keys for an owner
 *     tags: [API Keys]
 *     parameters:
 *       - in: path
 *         name: owner
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of API keys for the owner
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                       name:
 *                         type: string
 *                       owner:
 *                         type: string
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 */
router.get('/:owner', async (req, res, next) => {
  try {
    const { owner } = req.params;
    const apiKeys = await apiKeyService.listApiKeys(owner);
    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api-keys/{id}/rotate:
 *   put:
 *     summary: Rotate an API Key
 *     tags: [API Keys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key rotated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
router.put('/:id/rotate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const apiKey = await apiKeyService.rotateApiKey(id);
    res.json({
      success: true,
      message: 'API Key rotated successfully',
      data: apiKey
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api-keys/{id}:
 *   delete:
 *     summary: Revoke an API Key
 *     tags: [API Keys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await apiKeyService.revokeApiKey(id);
    res.json({
      success: true,
      message: 'API Key revoked successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
