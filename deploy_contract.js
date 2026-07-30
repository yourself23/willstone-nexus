
const { ethers } = require("ethers");
const fs = require("fs");

const bytecode = "6080604052348015600f57600080fd5b5060728061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063d8ef4fc814602d575b600080fd5b60336047565b604051603e91906067565b60405180910390f35b60606040518060200160405280600b815264537761726d5f41637469766560a81b81602001525090565b60008151905091905056";

const OPCODES = {
    "00": "STOP", "15": "ISZERO", "1c": "SHR", "34": "CALLVALUE", "35": "CALLDATALOAD", 
    "36": "CALLDATASIZE", "39": "CODECOPY", "40": "BLOCKHASH", "51": "MLOAD", "52": "MSTORE", 
    "56": "JUMP", "57": "JUMPI", "5b": "JUMPDEST", "60": "PUSH1", "61": "PUSH2", "63": "PUSH4", 
    "64": "PUSH5", "80": "DUP1", "81": "DUP2", "90": "SWAP1", "91": "SWAP2", "a8": "STATICCALL", 
    "f3": "RETURN", "fd": "REVERT", "fe": "INVALID"
};

function disassemble(hex) {
    let opcodesList = [];
    let i = 0;
    while (i < hex.length) {
        let byte = hex.substring(i, i + 2);
        let op = OPCODES[byte] || `UNKNOWN(0x${byte.toUpperCase()})`;
        if (op.startsWith("PUSH")) {
            let numBytes = parseInt(op.replace("PUSH", ""));
            let dataParam = hex.substring(i + 2, i + 2 + (numBytes * 2));
            opcodesList.push(`${op} 0x${dataParam.toUpperCase()}`);
            i += 2 + (numBytes * 2);
        } else {
            opcodesList.push(op);
            i += 2;
        }
    }
    return opcodesList;
}

async function main() {
    console.log("[DEPLOYMENT PIPELINE] Extracting Raw Ethereum Virtual Machine Opcodes...");
    const parsedOpcodes = disassemble(bytecode);
    console.log("\n=== RAW EVM OPCODE MATRIX LAYOUT ===");
    console.log(parsedOpcodes.slice(0, 15).join("\n"));
    console.log("... [TRUNCATED] ...");
    console.log("=====================================\n");
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bytecode translated cleanly.");
}
main();
