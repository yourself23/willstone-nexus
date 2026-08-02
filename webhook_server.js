const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// CRITICAL: Stripe requires the raw body buffer to securely verify webhook signatures
app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
    let event = request.body;

    // Direct extraction parsing for validation
    try {
        if (typeof event === 'string' || Buffer.isBuffer(event)) {
            event = JSON.parse(event.toString());
        }
    } catch (err) {
        console.error("❌ [WEBHOOK ERROR] Failed parsing payload body:", err.message);
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`\n🔔 [STRIPE EVENT] Intercepted incoming network event: ${event.type}`);

    // Route lifecycle subscription actions
    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
            const subscription = event.data.object;
            const metadata = subscription.metadata || {};
            
            console.log("====================================================================");
            console.log("🔄 [SUBSCRIPTION UPDATE] Processing Client Tier Modification...");
            console.log(` ├─ SKU Mapped      : ${metadata.internal_sku || 'N/A'}`);
            console.log(` ├─ Target Network  : ${metadata.target_network || 'N/A'}`);
            console.log(` ├─ Corp Tax ID     : ${metadata.tax_id_ein || 'N/A'}`);
            console.log(` └─ App Data Gateway: ${metadata.app_data_key || 'N/A'}`);
            console.log("====================================================================");
            break;
        }
        case 'customer.subscription.deleted':
            console.log("⚠️ [ALERT] Subscription cancelled or expired. Revoking active proxy access.");
            break;
        default:
            console.log(`▶️ Ignoring unhandled event mapping: ${event.type}`);
    }

    // Always respond with a 200 OK immediately to acknowledge receipt to Stripe
    response.json({ received: true });
});

const PORT = 4242;
app.listen(PORT, () => console.log(`🚀 [WEBHOOK SERVER] Live pipeline listening on port ${PORT}`));
