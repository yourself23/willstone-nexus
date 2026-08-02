const express = require('express');
const router = express.Router();

// POST: Direct automated webhook receiver for pipeline events
router.post('/receive', (req, res) => {
    res.json({ processed: true, timestamp: Date.now() });
});

module.exports = router;
