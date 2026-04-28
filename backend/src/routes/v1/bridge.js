const express = require('express');
const router = express.Router();
const CrossChainService = require('../../services/crossChainService');
const { authMiddleware } = require('../../middleware');
const logger = require('../../utils/logger');

const crossChainService = new CrossChainService();

/**
 * @openapi
 * tags:
 *   name: Bridge
 *   description: Cross-chain bridge operations between Stellar and Ethereum
 */

/**
 * @openapi
 * /bridge/did:
 *   post:
 *     summary: Bridge a Stellar DID to Ethereum
 *     tags: [Bridge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [did, ownerAddress]
 *             properties:
 *               did:
 *                 type: string
 *                 description: DID to bridge
 *               ownerAddress:
 *                 type: string
 *                 description: Ethereum address of the owner
 *     responses:
 *       200:
 *         description: DID bridged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 transactionHash:
 *                   type: string
 */
router.post('/did', authMiddleware, async (req, res) => {
  try {
    const { did, ownerAddress } = req.body;

    if (!did || !ownerAddress) {
      return res.status(400).json({ error: 'Please provide did and ownerAddress' });
    }

    const receipt = await crossChainService.bridgeDIDToEthereum(did, ownerAddress);

    res.json({
      success: true,
      message: 'DID bridged successfully',
      transactionHash: receipt.hash
    });
  } catch (error) {
    logger.error('Bridge DID Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /bridge/credential:
 *   post:
 *     summary: Bridge a Verifiable Credential to Ethereum
 *     tags: [Bridge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [credentialId, dataHash]
 *             properties:
 *               credentialId:
 *                 type: string
 *               dataHash:
 *                 type: string
 *                 description: Hash of the credential data
 *     responses:
 *       200:
 *         description: Credential bridged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 transactionHash:
 *                   type: string
 */
router.post('/credential', authMiddleware, async (req, res) => {
  try {
    const { credentialId, dataHash } = req.body;

    if (!credentialId || !dataHash) {
      return res.status(400).json({ error: 'Please provide credentialId and dataHash' });
    }

    const receipt = await crossChainService.bridgeCredentialToEthereum(credentialId, dataHash);

    res.json({
      success: true,
      message: 'Credential bridged successfully',
      transactionHash: receipt.hash
    });
  } catch (error) {
    logger.error('Bridge Credential Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /bridge/status/{did}:
 *   get:
 *     summary: Check cross-chain status of a DID
 *     tags: [Bridge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cross-chain status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: object
 */
router.get('/status/:did', authMiddleware, async (req, res) => {
  try {
    const { did } = req.params;

    const status = await crossChainService.verifyCrossChainState(did);

    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error('Bridge Status Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
