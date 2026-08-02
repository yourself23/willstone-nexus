const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Standard Middlewares
app.use(express.json());
app.use(cors());

// Task Integration: Linking Route Controllers
const walletRoutes = require('./routes/wallet');

const hookRoutes = require('./routes/hooks');
const metricsRoutes = require('./routes/metrics');
const fallbackRoutes = require('./routes/fallback');


app.use('/api/wallet', walletRoutes);
app.use('/api/hooks', hookRoutes);
app.use('/api/metrics', metricsRoutes);

// Base Status Endpoint
app.get('/api/status', (req, res) => {
    res.json({
        status: "ONLINE",
        network: "Arbitrum One",
        timestamp: new Date().toISOString()
    });
});


// Global Error Fallback Interceptor
app.use(fallbackRoutes);

app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 WILLSTONE BACKEND SERVER ACTIVATED`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`=================================================`);
});
