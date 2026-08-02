const nodemailer = require('nodemailer');
const fs = require('fs');

// Read production routing parameters
const config = JSON.parse(fs.readFileSync('./core/config/active_routing.json', 'utf8'));

// Standard configuration template. Replace with your actual verified email SMTP values
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net', 
  port: 587,
  auth: {
    user: 'apikey', 
    pass: 'YOUR_SENDGRID_OR_MAILGUN_API_KEY' 
  }
});

async function dispatchNotification(subject, body) {
  try {
    await transporter.sendMail({
      from: '"Willstone Nexus Shield" <alerts@willstonenexus.com>',
      to: 'timothyhuff25@gmail.com', // <-- Put your target recipient email here
      subject: `🚨 [NEXUS ALERTS]: ${subject}`,
      text: body
    });
    console.log("📨 Automated repair notification successfully dispatched via SMTP.");
  } catch (error) {
    console.error("❌ Email transmission failed:", error.message);
  }
}

const args = process.argv.slice(2);
if (args[0] && args[1]) {
  dispatchNotification(args[0], args[1]);
}
