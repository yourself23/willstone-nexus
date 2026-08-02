const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../../ecosystem-metrics.csv');

router.get('/live', (req, res) => {
    try {
        if (!fs.existsSync(csvPath)) {
            return res.status(404).json({ status: "MISSING", message: "Metrics data file not found." });
        }

        const rawContent = fs.readFileSync(csvPath, 'utf8').trim();
        const lines = rawContent.split('\n');
        
        if (lines.length < 2) {
            return res.json({ headers: [], metrics: [] });
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const dataRows = lines.slice(1).map(line => {
            const values = line.split(',');
            let rowObject = {};
            headers.forEach((header, index) => {
                rowObject[header] = values[index] ? values[index].trim() : '';
            });
            return rowObject;
        });

        res.json({
            status: "ONLINE",
            totalWeeksProcessed: dataRows.length,
            metrics: dataRows
        });
    } catch (err) {
        res.status(500).json({ status: "ERROR", message: err.message });
    }
});

module.exports = router;
