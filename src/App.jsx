import React, { useContext } from 'react';
import { WalletContext, WalletProvider } from './context/WalletContext';

function DashboardConsole() {
    const { balanceState, liveMetrics, serverOnline } = useContext(WalletContext);
    const latestWeek = liveMetrics.metrics && liveMetrics.metrics.length > 0 
        ? liveMetrics.metrics[liveMetrics.metrics.length - 1] 
        : null;

    return (
        <div style={{ backgroundColor: '#111', color: '#fff', padding: '20px', fontFamily: 'monospace', minHeight: '100vh' }}>
            <header style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2>🛸 WILLSTONE NEXUS MANAGEMENT CONSOLE v2.2</h2>
                <p>System Connection: {serverOnline ? <span style={{ color: '#00ff00' }}>ONLINE</span> : <span style={{ color: '#ff0000' }}>DELAYED</span>}</p>
            </header>

            <main>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                    <div>
                        <section style={{ background: '#222', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                            <h3>🔒 SECURE TARGET SIGNER</h3>
                            <p><strong>ADDRESS:</strong> {balanceState.wallet || "Awaiting dynamic context..."}</p>
                        </section>

                        <section style={{ background: '#222', padding: '15px', borderRadius: '5px' }}>
                            <h3>📊 TARGET OVERVIEW PARAMETERS</h3>
                            <p>• Initial Sandbox: 45,000 ETH</p>
                            {latestWeek && (
                                <>
                                    <p>• Live Compounded Pool: {parseFloat(latestWeek.Treasury_Pool_ETH).toFixed(2)} ETH</p>
                                    <p>• Solar Nodes Array: {latestWeek.Solar_Nodes}</p>
                                    <p>• Current Population: {latestWeek.Population}</p>
                                </>
                            )}
                        </section>
                    </div>

                    <div style={{ background: '#222', padding: '15px', borderRadius: '5px', overflowX: 'auto' }}>
                        <h3>📋 RE-INDEXED TELEMETRY STREAM MATRIX</h3>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #444' }}>
                                    <th style={{ padding: '8px' }}>WK</th>
                                    <th>TREASURY POOL</th>
                                    <th>SOLAR</th>
                                    <th>POPULATION</th>
                                    <th>PAYOUT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {liveMetrics.metrics && liveMetrics.metrics.map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #333', color: idx === liveMetrics.metrics.length - 1 ? '#00ff00' : '#fff' }}>
                                        <td style={{ padding: '8px' }}>{row.Week}</td>
                                        <td>{parseFloat(row.Treasury_Pool_ETH).toFixed(2)} ETH</td>
                                        <td>{row.Solar_Nodes}</td>
                                        <td>{row.Population}</td>
                                        <td>{parseFloat(row.Immediate_Payout_ETH).toFixed(2)} ETH</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <WalletProvider>
            <DashboardConsole />
        </WalletProvider>
    );
}
