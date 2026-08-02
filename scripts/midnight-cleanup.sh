#!/bin/bash
# --- WILLSTONE NEXUS MIDNIGHT OPTIMIZATION & HARDWARE VERIFICATION ---
PROJECT_DIR="$HOME/willstone-nexus"
LOG_FILE="$PROJECT_DIR/cleanup-audit.log"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] STARTING STORAGE OPTIMIZATION PROCESS..." >> "$LOG_FILE"

# 1. Clear out temporary compilation structures, test execution logs, and subfolder caches
rm -rf "$PROJECT_DIR/cache" "$PROJECT_DIR/artifacts/build-info" 2>/dev/null
rm -f "$PROJECT_DIR"/*.log 2>/dev/null

# 2. Sweep out global package caches to maximize available blocks under your 1.3G limit
rm -rf "$HOME/.npm/_cacache" "$HOME/.cache" 2>/dev/null

# 3. Scan the container USB bus specifically to verify the hardware link status
USB_CHECK=$(lsusb)
if echo "$USB_CHECK" | grep -iE "ledger|stmicroelectronics|hid" > /dev/null; then
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] HARDWARE_STATUS | 🟢 LINK ACTIVE: Device recognized on container bus." >> "$LOG_FILE"
else
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] HARDWARE_STATUS | ❌ DISCONNECTED: Check ChromeOS USB redirection." >> "$LOG_FILE"
fi

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] MIDNIGHT SYSTEM PURGE SUCCESSFULLY COMPLETED." >> "$LOG_FILE"

# 4. Pull live balance metrics immediately following the system purge phase
ALCHEMY_KEY_FALLBACK="alch_eqIGIh6LGoWKyVzSplSua"
TARGET_WALLET="0x36d86eA6f6420Edf9766271687704b13883f00f8"
RPC_ENDPOINT="https://alchemy.com"

BALANCE_RAW=$(curl -s -X POST -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$TARGET_WALLET\",\"latest\"],\"id\":23}" \
  "$RPC_ENDPOINT" | grep -oE '"result":"[^"]+"' | cut -d'"' -f4)

if [ ! -z "$BALANCE_RAW" ] && [ "$BALANCE_RAW" != "null" ]; then
    # Convert hexadecimal balance metrics from Wei to human-readable ETH units
    BALANCE_DEC=$(printf "%d" "$BALANCE_RAW" 2>/dev/null)
    if [ ! -z "$BALANCE_DEC" ]; then
        BALANCE_ETH=$(awk "BEGIN {print $BALANCE_DEC / 1000000000000000000}")
        echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] METRICS_AUDIT    | Live Wallet Balance: $BALANCE_ETH ETH" >> "$LOG_FILE"
    fi
else
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] METRICS_WARNING  | RPC node busy or unreachable. Balance check skipped." >> "$LOG_FILE"
fi
