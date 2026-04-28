const express = require('express');
const router = express.Router();
const CrossChainService = require('../services/crossChainService');
const { authMiddleware } = require('../middleware');
const { validateEndpoint, validateInput, sanitizeParams, sanitizeQuery } = require('../middleware/inputValidation');
const logger = require('../utils/logger');

const crossChainService = new CrossChainService();

// Apply sanitization middleware globally
router.use(sanitizeQuery);
router.use(sanitizeParams);

/**
 * @route   GET /api/bridge
 * @desc    Get bridge routes info
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({ 
    message: 'Bridge routes works',
    endpoints: [
      'POST /did - Bridge Stellar DID to Ethereum',
      'POST /credential - Bridge credential to Ethereum',
      'GET /status/:did - Check cross-chain status'
    ]
  });
});

/**
 * @route   POST /api/bridge/did
 * @desc    Bridge a Stellar DID to Ethereum
 * @access  Private
 */
router.post('/did', authMiddleware, validateEndpoint('bridgeDID'), async (req, res) => {
  const { did, ownerAddress } = req.body;

  try {
    const receipt = await crossChainService.bridgeDIDToEthereum(did, ownerAddress);
    
    res.json({
      success: true,
      message: 'DID bridged successfully',
      transactionHash: receipt.hash
    });
  } catch (error) {
    logger.error('Bridge DID Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/bridge/credential
 * @desc    Bridge a Verifiable Credential to Ethereum
 * @access  Private
 */
router.post('/credential', authMiddleware, validateEndpoint('bridgeCredential'), async (req, res) => {
  const { credentialId, dataHash } = req.body;

  try {
    const receipt = await crossChainService.bridgeCredentialToEthereum(credentialId, dataHash);
    
    res.json({
      success: true,
      message: 'Credential bridged successfully',
      transactionHash: receipt.hash
    });
  } catch (error) {
    logger.error('Bridge Credential Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/bridge/status/:did
 * @desc    Check cross-chain status of a DID
 * @access  Private
 */
router.get('/status/:did', authMiddleware, validateInput('did', 'params'), async (req, res) => {
  const { did } = req.params;
  
  try {
    const status = await crossChainService.verifyCrossChainState(did);
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error('Bridge Status Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

