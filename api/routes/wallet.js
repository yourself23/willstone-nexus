const express = require('express');
const router = express.Router();

// GET: Fetch operational treasury balance from development wallet
router.get('/balance', async (req, res) => {
    res.json({ status: "ACTIVE", wallet: process.env.DEV_WALLET_ADDRESS || "0x39c8f221541f44762d6e4f9cf8e678be2fff02b9" });
});

module.exports = router;
