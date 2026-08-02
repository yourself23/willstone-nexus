import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const csvPath = path.join(process.env.HOME, 'willstone-nexus/metrics-summary.csv');
const CRITICAL_GAS_THRESHOLD = parseFloat(process.env.CUSTOM_CREDIT_THRESHOLD || "30.0");

// Secure backend transporter configuration utilizing your private email preference
const transporter = nodemailer.createTransport({
  host: process.env.ALERT_SMTP_HOST || "://gmail.com",
  port: parseInt(process.env.ALERT_SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.ALERT_EMAIL_USER || "timothyhuff25@gmail.com",
    pass: process.env.ALERT_EMAIL_PASS || ""
  }
});

let lastNotifiedBreachCount = 0;

async function verifyGasThresholds() {
  if (!fs.existsSync(csvPath)) return;
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(Boolean).slice(1);

  let highGasBreaches = 0;
  lines.forEach(line => {
    const fields = line.split(',');
    if (fields.length >= 6) {
      const gasGwei = parseFloat(fields[5]);
      if (!isNaN(gasGwei) && gasGwei > CRITICAL_GAS_THRESHOLD) {
        highGasBreaches++;
      }
    }
  });

  if (highGasBreaches > lastNotifiedBreachCount && process.env.ALERT_EMAIL_PASS) {
    lastNotifiedBreachCount = highGasBreaches;
    try {
      await transporter.sendMail({
        from: `"Nexus Sentinel" <${process.env.ALERT_EMAIL_USER || "timothyhuff25@gmail.com"}>`,
        to: "timothyhuff25@gmail.com",
        subject: "⚠️ WILLSTONE NEXUS — GAS THRESHOLD ANOMALY DETECTED",
        text: `Alert: Network base fee breaches custom credit limit.\n\n• Threshold Limit: ${CRITICAL_GAS_THRESHOLD} Gwei\n• Total Recorded Anomalies: ${highGasBreaches}\n• Timestamp: ${new Date().toISOString()}\n\nAction Required: Verify DUNA Engine execution parameters.`
      });
    } catch (e) {}
  }

  if (highGasBreaches > 0) {
    console.log(`\x1b[33m  • Threshold Sentinel   : ⚠️  ${highGasBreaches} High-Gas Bloat Anomalies Tracked (>${CRITICAL_GAS_THRESHOLD} Gwei Limit)\x1b[0m`);
  } else {
    console.log(`  • Threshold Sentinel   : 🟢 Gas bounds clear (<${CRITICAL_GAS_THRESHOLD} Gwei credit ceiling)`);
  }
}

if (process.argv.includes("--run")) {
  verifyGasThresholds().catch(() => {});
}
