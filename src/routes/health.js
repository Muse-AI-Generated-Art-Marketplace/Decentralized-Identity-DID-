// src/routes/health.js
const express = require("express");
const mongoose = require("mongoose");
const StellarSDK = require("stellar-sdk");

const router = express.Router();

router.get("/", async (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: process.uptime(),
    services: {},
  };

  // 🟢 MongoDB
  try {
    const dbState = mongoose.connection.readyState;
    health.services.database = dbState === 1 ? "connected" : "disconnected";
  } catch (err) {
    health.services.database = "error";
  }

  // 🟢 Redis
  try {
    const redis = req.app.get("redisClient");
    if (redis) {
      await redis.ping();
      health.services.redis = "connected";
    } else {
      health.services.redis = "not_configured";
    }
  } catch (err) {
    health.services.redis = "error";
  }

  // 🟢 Stellar (external)
  try {
    const server = new StellarSDK.Horizon.Server(
      process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org",
    );

    await server.ledgers().limit(1).call();
    health.services.stellar = "connected";
  } catch (err) {
    health.services.stellar = "error";
  }

  const values = Object.values(health.services);

  if (values.includes("error") || values.includes("disconnected")) {
    health.status = "unhealthy";
  }

  return res.status(health.status === "ok" ? 200 : 500).json(health);
});

module.exports = router;
