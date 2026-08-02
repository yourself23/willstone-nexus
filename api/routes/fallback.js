const express = require('express');
const router = express.Router();

// Fallback logic to capture and gracefully report internal error states
router.use((err, req, res, next) => {
    console.error("• Captured Stream Error:", err.message);
    res.status(500).json({
        status: "ERROR",
        message: "Dynamic node streaming or routing configuration delayed.",
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
