export const API_BASE_URL = 'http://localhost:8000/api';

export const endpoints = {
    status: `${API_BASE_URL}/status`,
    walletBalance: `${API_BASE_URL}/wallet/balance`,
    webhookReceiver: `${API_BASE_URL}/hooks/receive`,
    metricsLive: `${API_BASE_URL}/metrics/live`
};
