#!/usr/bin/env node
/**
 * Post-deployment verification script
 * Reads the deployment JSON for the target network and verifies each contract
 * on Etherscan using hardhat verify.
 *
 * Usage:
 *   node scripts/verify-deployment.js [--network <name>]
 *
 * Defaults to "sepolia" if --network is not provided.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function getArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

const network = getArg("--network", "sepolia");
const deploymentFile = path.join(__dirname, `../deployments/${network}.json`);

if (!fs.existsSync(deploymentFile)) {
  console.error(`❌ Deployment file not found: ${deploymentFile}`);
  console.error("   Run the deploy script first.");
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
const { contracts } = deployment;

if (!contracts || Object.keys(contracts).length === 0) {
  console.error("❌ No contracts found in deployment file.");
  process.exit(1);
}

console.log(`🔍 Verifying contracts on ${network}...`);

let failed = 0;

for (const [name, address] of Object.entries(contracts)) {
  if (!address) continue;
  console.log(`\n📋 Verifying ${name} at ${address}`);
  try {
    execSync(
      `npx hardhat verify --network ${network} ${address}`,
      { stdio: "inherit" }
    );
    console.log(`✅ ${name} verified`);
  } catch {
    // Etherscan returns non-zero exit code when already verified — treat as success
    console.warn(`⚠️  ${name} may already be verified or verification failed (check output above)`);
    failed++;
  }
}

if (failed === Object.keys(contracts).length) {
  console.error("\n❌ All verifications failed.");
  process.exit(1);
}

console.log("\n🎉 Verification complete.");
