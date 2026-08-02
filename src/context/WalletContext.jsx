import React, { createContext, useState, useEffect } from 'react';
import { endpoints } from '../utils/api-config';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
    const [balanceState, setBalanceState] = useState({ status: 'LOADING', wallet: '' });
    const [liveMetrics, setLiveMetrics] = useState({ metrics: [] });
    const [serverOnline, setServerOnline] = useState(false);

    useEffect(() => {
        const fetchSystemState = async () => {
            try {
                const statusRes = await fetch(endpoints.status);
                if (statusRes.ok) {
                    setServerOnline(true);
                    
                    const walletRes = await fetch(endpoints.walletBalance);
                    const walletData = await walletRes.json();
                    setBalanceState(walletData);

                    const metricsRes = await fetch(endpoints.metricsLive);
                    const metricsData = await metricsRes.json();
                    setLiveMetrics(metricsData);
                }
            } catch (err) {
                console.error("System connection delayed:", err.message);
                setServerOnline(false);
            }
        };

        fetchSystemState();
        const interval = setInterval(fetchSystemState, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <WalletContext.Provider value={{ balanceState, liveMetrics, serverOnline }}>
            {children}
        </WalletContext.Provider>
    );
};
