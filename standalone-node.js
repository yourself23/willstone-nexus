const http = require('http');

let currentBlock = 421090;
const PORT = 8449;

// Lightweight mock JSON-RPC response routing layer
const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        try {
            const json = JSON.parse(body);
            let result = "0x0";
            
            if (json.method === 'eth_blockNumber') {
                currentBlock++;
                result = '0x' + currentBlock.toString(16);
            }
            
            res.end(JSON.stringify({
                jsonrpc: "2.0",
                id: json.id || 1,
                result: result
            }));
        } catch (e) {
            res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }));
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`📡 ARBITRUM ORBIT LIGHTWEIGHT L3 MOCK ENGINE ONLINE`);
    console.log(`🔗 RPC ENDPOINT: http://localhost:${PORT}`);
    console.log(`=================================================`);
});
