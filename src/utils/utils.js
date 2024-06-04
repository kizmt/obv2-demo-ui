import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { RPC_ENDPOINT, TOKEN_PROGRAM_ID } from "@/redux/globalState";
import {BN} from "@coral-xyz/anchor";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setAccounts } from "@/redux/state";
import Link from "next/link";

export const UNKNOWN_IMAGE_URL = "https://i.imgur.com/57E7Mna.png";

export const log = (msg1,msg2="",msg3="",msg4="",msg5="") => {
  console.log(msg1, msg2, msg3, msg4, msg5);
}

export const combineOrderbookSide = (orders, side=0) => {
  const _cSide = orders.reduce((acc, {price, size, clientOrderId, owner, userInOrder}) => {
    if (acc[price]) {
      acc[price].size += size; // Add to existing size
      if(userInOrder) {
        acc[price].userInOrder = true;
      }
    } else {
      acc[price] = {price, size, clientOrderId, owner, userInOrder}; // First encounter of this price
    }
    return acc;
  }, {});
  let combinedSide = Object.values(_cSide);
  if(side === 0) combinedSide.sort((a,b) => a.price < b.price ? 1 : -1);
  else combinedSide.sort((a,b) => a.price > b.price ? 1 : -1);
  
  return combinedSide;
}

export const API_GET_ORDERBOOK = async(address, clob) => {
  let request = await fetch("https://v4.prism.ag/orderbook?market="+address+"&clob="+clob);
  let response = await request.json();
  return response;
}

export const API_GET_ORDERS = async(address, clob) => {
  let request = await fetch("https://v4.prism.ag/orders?pubkey="+address+"&clob="+clob);
  let response = await request.json();
  return response;
}

export const convertToV2BookSide = (orders) => {
  let newOrders = orders.map(order => {
    return {
      price: hexToBn(order.price),
      size: hexToBn(order.quantity),
      owner: order.owner,
      clientOrderId: hexToBn(order.clientOrderId)
    }
  })
  return newOrders;
}
export const hexToBn = (hex) => {
  const bn = new BN(hex,16);
  return bn;
}

export const GET_TOKEN_INFO = async (address) => {
 let response = await fetch("https://public-api.birdeye.so/defi/token_overview?address="+address,
 {
  headers: {
    'X-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2Njk2MzMyOTd9.9CpIsSqaS7HkdWw3lDL9q3ouLYBXDss-5obA5juggno'
  }
 }).then(res => res.json());
 if(response.data?.address) {
    return response;
 }
 return {
  success: false,
 }
}
export const findTokenByAddress = (address, decimals, tokenList) => {
  for(let i = 0; i < tokenList.length; i++) {
    if(tokenList[i].address === address) return tokenList[i];
  }
  return {
    address: address,
    decimals: decimals,
    symbol: address.slice(0,3)+"..."+address.slice(-1),
    name: "Unknown Token",
    logoURI: UNKNOWN_IMAGE_URL
  }
}

export const websocketRequest = (type="subscribe",address) => {
  return {
    "jsonrpc": "2.0",
    "id": 420,
    "method": type === "subscribe" ? "accountSubscribe" : "accountUnsubscribe",
     "params": [
      address.toBase58(),
      {
        "encoding": "jsonParsed",
        "commitment": "confirmed"
      }
    ]
  }
}

export const getJupQuote = async (mints, side, size) => {
  // Swapping SOL to USDC with input 0.1 SOL and 0.5% slippage
  let base = side === 0 ? mints.base : mints.quote;
  let quote = side === 0 ? mints.quote : mints.base;
  let inputDecimals = base.decimals;
  let outputDecimals = quote.decimals;
  let baseMint = base.address;
  let quoteMint = quote.address;

  console.log("[jup] quoting",size, size * 10**inputDecimals)
  const quoteResponse = await (
    await fetch('https://quote-api.jup.ag/v6/quote?inputMint='+baseMint+
    '&outputMint='+quoteMint+
    '&amount='+(size * 10**inputDecimals).toFixed(0)+
    '&slippageBps=50')
  ).json();
  console.log("[jup]",{ quoteResponse });
  let quoteUI = quoteResponse.outAmount / 10**outputDecimals;
  return {quoteResponse: quoteResponse, quoteUI: quoteUI};
}
export const placeJupOrder = async (mints, side, size, tokenList, wallet, connection) => {
  
  let {quoteResponse, quoteUI} = await getJupQuote(mints, side, size);

  let transaction = await jupTransaction(quoteResponse, wallet.publicKey);

  console.log(transaction, wallet);
  // sign the transaction
  // transaction.sign([wallet.publicKey]);
  return transaction; // sign & send in useMarket.ts

  let signedTx = await wallet.signTransaction(transaction);
  // wallet.signAllTransactions([transaction])
  // Execute the transaction
  const rawTransaction = signedTx.serialize()
  const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
    // maxRetries: 2
  });
  console.log('[jup]',`https://solscan.io/tx/${txid}`);
  await connection.confirmTransaction(txid);
  console.log('[jup]',`https://solscan.io/tx/${txid}`);
}

export const openbookTransaction = async (side, price, amount, market, pubkey, clob="v2", priorityFee=0.005) => {
  // let t = "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAML/uSY2XU/pg1PQ2a+u/oTUoS7ZyYkmHjcrqgwomcBGwky2gEhwWz5jsrCQ1432Ga9DGqIVNd020O511dcuS7eNTwt5a2kY9+e2SqsuZNb8xAtVb03DUbAzy5zFVgqzEVKjveagppmyVh9NXIGTw0Bu7mAX2BvMYmYkrlA15HQ9PSnI1yNu/8vXkUqgSU3o20mSjzZtx/d7eCUeQzZACE/qsN44NJKp5DT4zYVtnF/U7DYQYi+9DGpbGAx7M127QPA0cW+/W6f996XjfdF7yVVLbzchNGEvYAi672SxlGDIfX3i6+6zlGI031zJtSyq6PknK4fU81lICpyf2oMvgj/awAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC/6/vfur+tC0ZXG/lYweuCR4e7CZS7GEayl4Bx4Xmb4G3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqXu088eitMj0hKNgeUqI4Ypqgo/i94G40D07Y4ZNJ4R2DAkMAAcJAQQDAgYFCAgKNDPCm69tgmBqACBIAQAAAAAAAMqaOwAAAADg2ooAAAAAAEIhAAAAAAAAAAAAAAAAAAAAAP8JDAAHCQEEAwIGBQgICjQzwpuvbYJgagAITAEAAAAAAADKmjsAAAAA4NqKAAAAAADWDQAAAAAAAAAAAAAAAAAAAAD/CQwABwkBBAMCBgUICAo0M8Kbr22CYGoA8E8BAAAAAAAAypo7AAAAAODaigAAAAAArxQAAAAAAAAAAAAAAAAAAAAA/wkMAAcJAQQDAgYFCAgKNDPCm69tgmBqANhTAQAAAAAAAMqaOwAAAADg2ooAAAAAAAEHAAAAAAAAAAAAAAAAAAAAAP8JDAAHCQEEAwIGBQgICjQzwpuvbYJgagDAVwEAAAAAAADKmjsAAAAA4NqKAAAAAADnEAAAAAAAAAAAAAAAAAAAAAD/CQwABwkBBAMCBgUICAo0M8Kbr22CYGoAqFsBAAAAAAAAypo7AAAAAODaigAAAAAAHR4AAAAAAAAAAAAAAAAAAAAA/wkMAAcJAQQDAgYFCAgKNDPCm69tgmBqAJBfAQAAAAAAAMqaOwAAAADg2ooAAAAAAAIHAAAAAAAAAAAAAAAAAAAAAP8JDAAHCQEEAwIGBQgICjQzwpuvbYJgagB4YwEAAAAAAADKmjsAAAAA4NqKAAAAAACFIwAAAAAAAAAAAAAAAAAAAAD/CQwABwkBBAMCBgUICAo0M8Kbr22CYGoAYGcBAAAAAAAAypo7AAAAAODaigAAAAAAkBYAAAAAAAAAAAAAAAAAAAAA/wkMAAcJAQQDAgYFCAgKNDPCm69tgmBqAEhrAQAAAAAAAMqaOwAAAADg2ooAAAAAAHkZAAAAAAAAAAAAAAAAAAAAAP8JDAAHCQEEAwIGBQgICjQzwpuvbYJgagAwbwEAAAAAAADKmjsAAAAA4NqKAAAAAABKGwAAAAAAAAAAAAAAAAAAAAD/CQMJBAYQ3ZGxNB8vP8kPAAAAAAAAAA=="
  // const swapTransactionBuf = Buffer.from(t, 'base64');
  //   let tx = Transaction.from(swapTransactionBuf);

  //   console.log('tx', tx, tx.instructions);
  //   return {
  //     success: true,
  //     transaction: tx
  //   }
  
  let request = await fetch("https://v4.prism.ag/limit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(
      {
      price: price,
      side: side,
      amount: amount,
      market: market,
      pubkey: pubkey,
      clob: clob,
      priorityFee: priorityFee
      }
    )
  }).then(res => res.json());
  console.log("[openbook]", request);
  if(request.success) {
    const swapTransactionBuf = Buffer.from(request.transaction, 'base64');
    let tx = Transaction.from(swapTransactionBuf);
    return {
      success: true,
      transaction: tx,
      openOrdersAddress: request.openOrdersAddress
    }
  } 
  return {
    success: false,
    message: "Placing limit order failed!"
  }
}

export const jupTransaction = async (quoteResponse, pubkey) => {
  const { swapTransaction } = await (
    await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: pubkey.toString(),
        // auto wrap and unwrap SOL. default is true
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true, // allow dynamic compute limit instead of max 1,400,000
        // custom priority fee
        prioritizationFeeLamports: 'auto' // or custom lamports: 1000
        // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
        // feeAccount: "4Vry5hGDmbwGwhjgegHmoitjMHniSotpjBFkRuDYHcDG"
      })
    })
  ).json();
  console.log("[jup]",{ swapTransaction });

  // deserialize the transaction
  if(swapTransaction) {
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  
    return transaction;
  }
  return undefined;
}
export const formatNumber = (amount, toFixed=6) => {
  let formatter = new Intl.NumberFormat("en-US", {  maximumFractionDigits: toFixed==="auto" ? (amount > 1000000 ? 0 : amount > 100000 ? 2 : amount < 0.0001 ? 8 : 6) : toFixed });
  if(toFixed === "auto" && amount < 0.0001 && amount > 0) {
    return ConvertToSubscript(amount);
  } else if(toFixed === "auto" && amount > 1000000 && amount < 1000000000) {
    return parseFloat(amount / 10**6).toFixed(2) + "M"
  } else if(toFixed === "auto" && amount > 1000000000) {
    return parseFloat(amount / 10**9).toFixed(2) + "B"
  }
  return formatter.format(amount);
}

const ConvertToSubscript = (num) => {
  let numStr = num.toString();

  // Find the first non-zero digit after the decimal
  let decimalIndex = numStr.indexOf('.');
  let firstNonZeroIndex = numStr.length;
  for (let i = decimalIndex + 1; i < numStr.length; i++) {
      if (numStr[i] !== '0') {
          firstNonZeroIndex = i;
          break;
      }
  }

  // Calculate the number of zeros after the decimal and before the first non-zero digit
  let zeroCount = firstNonZeroIndex - decimalIndex - 1;

  // Check if any zeros are present
  if (zeroCount <= 0) {
      // Return the original number as string if no zeros are found after the decimal
      return numStr;
  }

  // Insert the subscript for zero count
  let subscript = String.fromCharCode(8320 + zeroCount); // Convert to subscript unicode
  return numStr.substring(0, decimalIndex + 1) + "0" + subscript + numStr.substring(firstNonZeroIndex);
}



export const GetTokenBalance = (address, accounts) => {
  for(let i = 0; i < accounts.length; i++) {
    if(accounts[i].mint === address) return {
      balance: accounts[i].balance,
      address: accounts[i].address
    };
  }
  return {
    balance: 0,
    address: address
  }
}

export const SOL_TOKEN = {
  "address": "So11111111111111111111111111111111111111112",
  "strict": true,
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
  "strict": true,
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

export const GET_USER_TOKENS = async (pubkey, connection, dispatch) => {
  let userTokens = [];

  try {
    const parsedTokens = await connection.getParsedProgramAccounts(
      new PublicKey(TOKEN_PROGRAM_ID), 
      { filters: [{ dataSize: 165 }, { memcmp: { offset: 32, bytes: pubkey } }] }
    );

    let tokenPricesToFetch = parsedTokens
      .filter(token => token.account.data.parsed.info.tokenAmount.uiAmount > 0)
      .map(token => token.account.data.parsed.info.mint);

    // Splitting tokens into batches of 100
    const batches = [];
    while (tokenPricesToFetch.length) {
      const batch = tokenPricesToFetch.splice(0, 100);
      batches.push(batch);
    }

    // Fetch prices for each batch and accumulate the results
    const pricesPromises = batches.map(async batch => {
      const response = await fetch(`https://public-api.birdeye.so/defi/multi_price?list_address=${batch.join(",")}`, {
        method: "GET",
        headers: { "X-API-KEY": process.env.NEXT_PUBLIC_CANDLESTICK_API_KEY }
      });
      return response.json();
    });

    const pricesResults = await Promise.all(pricesPromises);
    const birdeyePrices = pricesResults.reduce((acc, result) => ({ ...acc, ...result.data }), {});

    parsedTokens.forEach(token => {
      const priceInfo = birdeyePrices[token.account.data.parsed.info.mint];
      if (priceInfo) {
        userTokens.push({
          address: token.account.data.parsed.info.mint,
          balance: token.account.data.parsed.info.tokenAmount.uiAmount,
          decimals: token.account.data.parsed.info.tokenAmount.decimals,
          associated_token_address: token.pubkey.toBase58(),
          price_info: {
            price_per_token: priceInfo.value,
            currency: "USDC",
            total_price: priceInfo.value * token.account.data.parsed.info.tokenAmount.uiAmount,
          },
        });
      }
    });

    // Handle native SOL balance (assuming SOL_TOKEN and other constants are correctly set)
    let nativeSolBalance = await connection.getBalance(new PublicKey(pubkey), "processed").catch(() => 0);
    const hasWsolAccount = userTokens.findIndex(token => token.address === SOL_TOKEN.address);

    if (hasWsolAccount === -1) {
      userTokens.push({
        address: SOL_TOKEN.address,
        ...SOL_TOKEN,
        balance: nativeSolBalance / 10**9,
      });
    } else {
      userTokens[hasWsolAccount].balance += nativeSolBalance / 10**9;
    }

    dispatch(setAccounts(userTokens)); // Ensure your dispatch method is properly defined
  } catch (error) {
    console.error("[error fetching user tokens]", error);
  }

  return userTokens;
};

export const ToastMaker = (title, description=null, link=null) => {
  return <div className="flex flex-col">
    <div className="text-md font-bold">{title}</div>
    {
      description &&
      <div className="text-sm text-muted-foreground">{description}</div>
    }
    {
      link &&
      <Link href={link.href} target="_blank" className="text-blue-500">{link.title}</Link>
    }
  </div>
}


function getWindowDimensions() {
  if (typeof window !== "undefined") {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height
    };
  }
  return null;
}
export default function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(null);

  useEffect(() => {
    // Set dimensions only after component mounts
    setWindowDimensions(getWindowDimensions());

    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

export async function sendSignedTransaction(
  connection,
  transaction,
  retries = 5,
  delayMs = 400,
) {
  let serialized = transaction.serialize();
  let txId = null;
  txId = await connection.sendRawTransaction(
      serialized,{skipPreflight:true, preflightCommitment: "confirmed"},
  ).catch((e) => { throw new Error("Couldn't send transaction: "  + e.message) });
  for (let numDelay = 0; numDelay < retries; numDelay++)
      delay(delayMs * numDelay).then(() => {
          connection.
          sendRawTransaction(serialized, {skipPreflight: true, preflightCommitment: "confirmed"}).catch(() => {});
      })
  return txId;
}

export function delay(ms) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}
