
export const CONFIRM_TX = async (connection, txid) => {
  const latestBlockHash = await connection.getLatestBlockhash();
  try {
    let status = await connection.confirmTransaction({
      signature: txid,
    }, "confirmed");
    console.log("[tx status]", status);
    return status;
  } catch (e) {
    console.log('[tx] Error', e)
    return {
      value: {
        err: "Transaction Expired"
      }
    }
  }
}


export const getLeafNodes = (program, bookside) => {
  const leafNodesData = bookside.nodes.nodes.filter((x) => x.tag === 2);
  const leafNodes = [];
  for (const x of leafNodesData) {
      const leafNode = program.coder.types.decode('LeafNode', Buffer.from([0, ...x.data]));
      leafNodes.push(leafNode);
  }
  return leafNodes;
}

export const priceData = (key) => {
  const shiftedValue = key.shrn(64); // Shift right by 64 bits
  return shiftedValue.toNumber(); // Convert BN to a regular number
}


export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

export const SOL_TOKEN = {
  "address": "So11111111111111111111111111111111111111112",
  "chainId": 101,
  "decimals": 9,
  "name": "Wrapped SOL",
  "symbol": "SOL",
  "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  "tags": [
      "old-registry"
  ],
  "extensions": {
      "coingeckoId": "wrapped-solana"
  }
};

export const USDC_TOKEN = {
  "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "chainId": 101,
  "decimals": 6,
  "name": "USD Coin",
  "symbol": "USDC",
  "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  "tags": [
      "old-registry"
  ],
  "extensions": {
      "coingeckoId": "usd-coin"
  }
};
