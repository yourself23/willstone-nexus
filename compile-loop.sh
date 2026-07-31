#!/usr/bin/env bash
mkdir -p build
while true; do
    echo "🔨 Compiling WillstoneUtilityToken.sol..."
    solc --bin --abi --optimize -o build/ WillstoneUtilityToken.sol --overwrite
    echo "⏳ Sleeping 10 seconds..."
    sleep 10
done
