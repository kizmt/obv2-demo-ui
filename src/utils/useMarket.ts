import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { V2_DECODE_ONCHAIN } from "./openbookv2/http";
import { IDL, OPENBOOK_PROGRAM_ID, OpenBookV2Client, priceLotsToUi, quantityToUiBase, quoteLotsToUi } from "openbook-v2";
import { MARKET, ORDERBOOK_ORDER } from "./interface";
import { Market, Orderbook } from "@openbook-dex/openbook";
import { API_GET_ORDERBOOK, API_GET_ORDERS, ToastMaker, combineOrderbookSide, convertToV2BookSide, findTokenByAddress, hexToBn, openbookTransaction, placeJupOrder, sendSignedTransaction, websocketRequest } from "./utils";
import { CONFIRM_TX, getLeafNodes, priceData } from "./openbookv2/utils";
import { FakeProvider } from "./openbookv2/useOpenbookClient";
import * as anchor from '@coral-xyz/anchor';
import { useWebSocket } from "./useWebSocket";
import toast from "react-hot-toast";
import { reloadBalances, setMarketsV2 } from "@/redux/state";
import { v2m } from "@/pages/trade/[...params]";
import { useRouter } from "next/router";
import { HELIUS_KEY } from "@/redux/globalState";

export const HELIUS_WS_URL = 'wss://atlas-mainnet.helius-rpc.com?api-key='+HELIUS_KEY;

export const UseMarket = () => { // base, quote = SYMBOL || MINT_ADDRESS
  
  //Global State
  const state = useSelector((state:any) => state.storage);
  const dispatch = useDispatch();
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();

  //
  const [currentMarket, setCurrentMarket] = useState<MARKET|null>(null);
  const [orderbookBids, setOrderbookBids] = useState<ORDERBOOK_ORDER[]|null>(null);
  const [rawBids, setRawBids] = useState<any>(null);
  const [orderbookAsks, setOrderbookAsks] = useState<ORDERBOOK_ORDER[]|null>(null);
  const [rawAsks, setRawAsks] = useState<any>(null);
  const [openOrders, setOpenOrders] = useState<any>({});
  const [unsettledBalances, setUnsettledBalances] = useState<any>(null);

  const { websocketStatus, websocketMessages, sendWS } = useWebSocket(HELIUS_WS_URL);
  const [bidsSubscription, setBidsSubscription] = useState<number|null>(null);
  const [asksSubscription, setAsksSubscription] = useState<number|null>(null);
  const [openOrdersAddresses, setOpenOrdersAddresses] = useState<any>(null);
  const [openOrdersAddress, setOpenOrdersAddress] = useState<any>(null);
  
  const [openOrdersLoadedFirstTime, setOpenOrdersLoadedFirstTime] = useState<boolean>(false);

  // v2 specific states
  const [v2program, setv2program] = useState<any>(null);
  const [v2Client, setV2Client] = useState<any>(null);

  // Load v2 whitelisted markets
  useEffect(() => {
    fetch("https://cache.prism.ag/v4/marketsv2.json").then(response => response.json()).then(data => {
      dispatch(setMarketsV2(data));
    })
  }, []);
  
  // After Market is loaded, load Orderbook & subscribe to webhook updates
  useEffect(() => {
    if(currentMarket && !currentMarket.empty) {
      // initial load of orderbook
      console.log('[marketAccount]', currentMarket.account);
      API_GET_ORDERBOOK(currentMarket.address.toBase58(), state.dex).then(response => {
        if(response.success) { // todo: v1 might return different data.
          let convertedOrderbook:any;
          if(state.dex === 'v2') {
            let rawOrderbook = {
              bids: response.bids,
              asks: response.asks
            }
            let combinedBids = combineOrderbookSide(rawOrderbook.bids);
            let combinedAsks = combineOrderbookSide(rawOrderbook.asks);
            combinedAsks.sort((a:any,b:any) => a.price > b.price ? 1 : -1);
            convertedOrderbook = {
              bids: combinedBids,
              asks: combinedAsks
            }
          } else if(state.dex === 'v1') {
            let bids = response.bids.map((bid:any) => {return {price: bid.price, size: bid.size, owner: null, clientOrderId: null, userInOrder: false}});
            let asks = response.asks.map((ask:any) => {return {price: ask.price, size: ask.size, owner: null, clientOrderId: null, userInOrder: false}});
            
            convertedOrderbook = {
              bids: bids,
              asks: asks
            }
          }
          setOrderbookBids(convertedOrderbook.bids);
          setOrderbookAsks(convertedOrderbook.asks);
          
          console.log('[useMarket] Orderbook', convertedOrderbook);
          
          // // Subscribe to Orderbook Updates
          // console.log('[ws] opening socket')
          // const socket = new WebSocket(HELIUS_WS_URL);

          // // Connection opened
          // socket.addEventListener('open', (event) => {
          //   console.log('[ws] Connected, sending request')
          //   setOrderbookSocket(socket);
          // })
        }
      })
    }
  }, [currentMarket]);

  useEffect(() => { // set userInOrder for the first orderbook load
    // console.log('[userInMarket]', wallet.connected, openOrdersAddress, orderbookBids, orderbookAsks)
    if(orderbookBids && orderbookAsks && !openOrdersLoadedFirstTime && openOrdersAddress && wallet.connected) {
      setOpenOrdersLoadedFirstTime(true);
      let bids:any = Object.assign([], orderbookBids);
      let asks:any = Object.assign([], orderbookAsks);
      bids.map((bid:any) => {
        // console.log('[userInMarket] checking bid', bid.owner, openOrdersAddress)
        if(bid.owner === openOrdersAddress) {
          bid.userInOrder = true;
        }
      })
      asks.map((ask:any) => {
        // console.log('[userInMarket] checking bid', ask.owner, openOrdersAddress)

        if(ask.owner === openOrdersAddress) {
          ask.userInOrder = true;
        }
      })
      setOrderbookBids(bids);
      setOrderbookAsks(asks);
    }
  }, [wallet.connected, openOrdersAddress, orderbookBids, orderbookAsks, openOrdersLoadedFirstTime])

  useEffect(() => {
    fetch("https://token.jup.ag/strict").then(response => response.json()).then(data => {
      ((market:any) => {
        let baseSymbol = market.name.split('/')[0];
        let quoteSymbol = market.name.split('/')[1];
        let bT = data.filter((token:any) => token.symbol === baseSymbol)[0];
        let qT = data.filter((token:any) => token.symbol === quoteSymbol)[0];
        let obj = {
          address: market.address,
          baseToken: bT,
          quoteToken: qT,
          name: baseSymbol + "-" + quoteSymbol
        }
        if(bT && qT)
          (obj);
      })
      console.log()
    })

    // init v2 client
    let client = new OpenBookV2Client(FakeProvider(connection), OPENBOOK_PROGRAM_ID);
    setV2Client(client);
  }, []);

  useEffect(() => { // get openOrdersAddress & Unsettled balances on each market change
    if(wallet.connected && currentMarket && !currentMarket.empty) {
      // ooa
        v2Client.findOpenOrdersForMarket(wallet.publicKey, currentMarket.address).then((result:any) => {
          console.log('[useMarket] ooa', result);
          if(result.length > 0) setOpenOrdersAddress(result[0].toBase58());
        });
      //
    }
  }, [currentMarket, wallet.connected])


  
  useEffect(() => { // load open orders when user connects a wallet | NO LONGER NEEDED AS WE ONLY LOAD CURRENT OO FROM ORDERBOOK
    let interval:any;
    if(currentMarket && !currentMarket.empty && wallet.connected && wallet.publicKey) {
      getOpenOrders();
      // interval = setInterval(getOpenOrders, 10000);
    }
    return () => {
      clearInterval(interval);
    } 
  }, [currentMarket, wallet.connected])


  
  useEffect(() => { // Handle Websocket Events
    if(websocketMessages.length > 0) {
      // console.log("[ws] message", websocketMessages[websocketMessages.length-1])
      //@ts-ignore
      let message:any = {};
      try {
        message = JSON.parse(websocketMessages[websocketMessages.length-1]) || {};
      } catch(e) {
        console.log('[ws] error parsing message', e)
      }

      if(message.result) {
        if(!bidsSubscription) { // subscribeId for bids
          setBidsSubscription(message.result);
          console.log('[ws] bids id:',message.result, 'subscribing to asks')
          sendWS(JSON.stringify(websocketRequest("subscribe",currentMarket?.asksAddress)));
        } else if(bidsSubscription && !asksSubscription) { // subscribeId for asks
          console.log('[ws] asks id:',message.result)
          setAsksSubscription(message.result);
        }
      } else
      if(message.method === 'accountNotification') {
        if(message.params && message.params.result && message.params.result.value && message.params.result.value.data) {
          let rawData = message.params.result.value.data[0];
          let buffer = Buffer.from(rawData, 'base64');
          let id:number = message.params.subscription;
          try { // figure out if it's orderbook bid/ask or open order
            if(id === bidsSubscription || id === asksSubscription) {// Is Orderbook Update Notification
              if(state.dex === 'v1') {
                let decodedOrderbook = Orderbook.decode(currentMarket?.account,buffer);
                let bookSide:any = [];
                for (let [price, size] of decodedOrderbook.getL2(50)) {
                  bookSide.push({price: price, size: size});
                }
                let formattedSide = bookSide.map((order:any) => {return {price: order.price, size: order.size, owner: null, clientOrderId: null, userInOrder: false}});
                if(id === bidsSubscription) {
                  setOrderbookBids(formattedSide);
                } else {
                  setOrderbookAsks(formattedSide);
                }
              } else if(state.dex === 'v2') {
                // TODO: write parsing for v2
                let program:any;
                if(!v2program) {
                  const programId = new PublicKey(OPENBOOK_PROGRAM_ID);
                  //@ts-ignore
                  const provider = new FakeProvider(connection)
                  const _program = new anchor.Program(IDL, programId, provider);
                  program = _program;
                  setv2program(_program);
                } else program = v2program;
                let decodedBookSide = program.coder.accounts.decode('bookSide', buffer);
                let side = getLeafNodes(program, decodedBookSide).sort((a, b) => {
                  const priceA = a.key;
                  const priceB = b.key;
                  return priceA - priceB;
                });
                let convertedSide:any;
                let _openOrders = Object.assign({}, openOrders);
                let _openOrdersBids = [];
                let _openOrdersAsks = []; // TODO:
                if(id === bidsSubscription) { // parse bids
                  convertedSide = side.map((order) => {
                    let price = priceLotsToUi(currentMarket?.account, priceData(order.key))
                    //@ts-ignore
                    let size = quantityToUiBase(currentMarket?.account,order.quantity, currentMarket?.baseDecimals)
                    return {
                      price: price,
                      size: size,
                      clientOrderId: order.clientOrderId.toNumber(),
                      owner: order.owner.toBase58(),
                      userInOrder: openOrdersAddress ? order.owner.toBase58() === openOrdersAddress : false
                    }
                  })
                  let combinedSide = combineOrderbookSide(convertedSide, 0);
                  setOrderbookBids(combinedSide);
                  setRawBids(convertedSide);
                } else if(id === asksSubscription) {
                  convertedSide = side.map((order) => {
                    let price = priceLotsToUi(currentMarket?.account, priceData(order.key))
                    let size = quoteLotsToUi(currentMarket?.account, priceData(order.key) * order.quantity / price)
                    return {
                      price: price,
                      size: size,
                      clientOrderId: order.clientOrderId.toNumber(),
                      owner: order.owner.toBase58(),
                      userInOrder: openOrdersAddress ? order.owner.toBase58() === openOrdersAddress : false
                    }
                  })
                  let combinedSide = combineOrderbookSide(convertedSide, 1);
                  setOrderbookAsks(combinedSide);
                  setRawAsks(convertedSide);
                }
              }
            }
          } catch (e) {
            console.log('[ws] error decoding', e);
          }
          // console.log('[ws] msg', message);
        }
      } else {
        console.log('[ws] unknown message', message)
      }
    }

  }, [websocketMessages]);

  useEffect(() => { // update open orders automatically for v2
    if(state.dex === 'v2' && openOrdersAddress && currentMarket) {
      // console.log('raw', rawBids, rawAsks)
      let order:any = {};
      order.baseMint = currentMarket?.baseMint.toBase58();
      order.quoteMint = currentMarket?.quoteMint.toBase58();
      order.openOrdersAddress = openOrdersAddress;
      order.bids = [];
      order.asks = [];
      //@ts-ignore
      rawBids?.map((bid:any) => {
        if(bid.owner === openOrdersAddress) {
          order.bids.push({
            price: bid.price,
            size: bid.size,
            clientOrderId: bid.clientOrderId,
            openOrdersAddress: openOrdersAddress,
            userInOrder: true
          });
        }
      })
      //@ts-ignore
      rawAsks?.map((ask:any) => {
        if(ask.owner === openOrdersAddress) {
          order.asks.push({
            price: ask.price,
            size: ask.size,
            clientOrderId: ask.clientOrderId,
            openOrdersAddress: openOrdersAddress,
            userInOrder: true
          });
        }
      })
      let newOpenOrders = Object.assign({}, openOrders);
      newOpenOrders[currentMarket?.address.toBase58()] = order;
      setOpenOrders((old:any) => newOpenOrders);
    }
  }, [rawBids, rawAsks])

  useEffect(() => { // Subscribe to Websocket
    if(currentMarket && !currentMarket.empty && websocketStatus === 'open') {
      if(!bidsSubscription) { // when websocket opens & market loads, subscribe to bids
        console.log('[ws] subscribing to bids');
        sendWS(JSON.stringify(websocketRequest("subscribe",currentMarket?.bidsAddress)));
      }
    }
  }, [websocketStatus, currentMarket])

  const loadMarket = async (address:string) => {
    let clob = state.dex;
    setOpenOrdersAddress(null);
    setOpenOrdersLoadedFirstTime(false);
    if(clob === 'v2') {
      let market;
      try {
        market = await V2_DECODE_ONCHAIN(connection, address, "market");
      } catch(e) { 
        // Market can't load, try loading from v1
        toast.error("Could not load market")
      }
      if(market.error) { // Incorrect address, Load default market
        router.push('/trade/v2/'+v2m);
      } else {
        console.log('[useMarket]', market);
        let marketObject:MARKET = {
          address: new PublicKey(address),
          account: market,
          empty: false,
          baseMint: market.baseMint,
          quoteMint: market.quoteMint,
          baseToken: findTokenByAddress(market.baseMint.toBase58(), market.baseDecimals, state.tokenList),
          quoteToken: findTokenByAddress(market.quoteMint.toBase58(), market.quoteDecimals, state.tokenList),
          baseDecimals: market.baseDecimals,
          quoteDecimals: market.quoteDecimals,
          programId: OPENBOOK_PROGRAM_ID,
          bidsAddress: market.bids,
          asksAddress: market.asks,
        }
        localStorage.setItem('lastMarket', address);
        return marketObject;
      }
    }
  }

  const updateMarketWithTokens = async (baseToken:any, quoteToken:any) => {
    if(state.dex === 'v2') {
      let exactMarket:any = state.marketsV2.filter((m:any) => m.baseToken.address === baseToken.address && m.quoteToken.address === quoteToken.address);
      console.log('[updateMarketWithTokens]', exactMarket)
      if(exactMarket && exactMarket.length > 0) { // Try finding an exact market
        await updateMarket(exactMarket[0].address);
      } else { // exact market not found, try finding a market with the same baseToken
        let baseMarket = state.marketsV2.filter((m:any) => m.baseToken.address === baseToken.address);
        if(baseMarket && baseMarket.length > 0) { // market found with a base token
          console.log('[market] exists...', baseMarket)
          await updateMarket(baseMarket[0].address);
        } else { // market doesn't exist, switch chart & tell user to create one
          console.log('[market] doesnt exist... updating Market with new tokens')
          setOrderbookBids([]);
          setOrderbookAsks([]);
          setBidsSubscription(null);
          setAsksSubscription(null);
          sendWS(JSON.stringify(websocketRequest("unsubscribe",currentMarket?.bidsAddress)));
          sendWS(JSON.stringify(websocketRequest("unsubscribe",currentMarket?.asksAddress)));
          setCurrentMarket({
            //@ts-ignore
            address: new PublicKey('11111111111111111111111111111111'),
            account: null,
            empty: true,
            baseToken: baseToken,
            quoteToken: quoteToken,
            baseMint: new PublicKey(baseToken.address),
            quoteMint: new PublicKey(quoteToken.address),
            baseDecimals: baseToken.decimals,
            quoteDecimals: quoteToken.decimals,
            //@ts-ignore
            bidsAddress: null,
            //@ts-ignore
            asksAddress: null,
            programId: OPENBOOK_PROGRAM_ID,
          })
        }
      }
    }
  }
  // Update Market
  const updateMarket = async (address:string) => {
    if(currentMarket?.address.toBase58() === address) return;
    if(websocketStatus === 'open' && bidsSubscription || asksSubscription) {
      // TODO: unsubscribe from open orders
      console.log("[ws] unsubscribing from orderbook", currentMarket?.address.toBase58())
      sendWS(JSON.stringify(websocketRequest("unsubscribe",currentMarket?.bidsAddress)));
      sendWS(JSON.stringify(websocketRequest("unsubscribe",currentMarket?.asksAddress)));
      // reset subscriptionIds for websocket events
      setBidsSubscription(null);
      setAsksSubscription(null);
      console.log("[ws] unsubscribed from orderbook", currentMarket?.address.toBase58())
    }
    // console.log('[useMarket] market loading', state.dex, address);

    let market:any = await loadMarket(address);    
    setCurrentMarket(market);
    window.history.replaceState({}, "", '/trade/'+state.dex+'/'+address);
    return market;
  }

  const handleSendTransaction = async (tx:Transaction) => {
    //@ts-ignore
    toast.loading(ToastMaker("Preparing","Plase approve the transaction"),{id:1})
    let signedTx;
    // add priority fee
    // const PRIORITY_RATE = 1000000; // MICRO_LAMPORTS * LAMPORT PRIO RATE
    // const PRIORITY_FEE_IX = ComputeBudgetProgram.setComputeUnitPrice({microLamports: PRIORITY_RATE});
    
    // if(tx.instructions) {
    //   tx.instructions = [PRIORITY_FEE_IX, ...tx.instructions];
    // }
    //---
    try {
      //@ts-ignore
      signedTx = await wallet.signTransaction(tx);
    }  catch(e:any) {
      console.log("[EEEE]", e.message)
      if(e.message === "Transaction rejected" || e.message === 'User rejected the request.') {
        //@ts-ignore
        toast.error(ToastMaker("Transaction Rejected", "You rejected the transaction"), {id:1});
        return;
      }
      return;
    }
    //@ts-ignore
    toast.loading(ToastMaker("Sending Transaction","Your order is on the way"),{id:1})
    //@ts-ignore
    let txid;
    try {
      txid = await sendSignedTransaction(connection, signedTx);
    } catch (e) {
      console.log(e);
      //@ts-ignore
      toast.error(ToastMaker("Transaction failed to send","Please try again"), {id:1})
      return;
    }
    //@ts-ignore
    toast.loading(ToastMaker("Finalizing Transaction","Please wait"),{id:1});
    let status = await CONFIRM_TX(connection, txid);
    console.log('status', status)
    if(!status?.value?.err) {
      //@ts-ignore
      toast.success(ToastMaker("Transaction Complete", null, {href:"https://solscan.io/tx/"+txid,title: 'View on Solscan'}), {id:1});
      dispatch(reloadBalances());
      return;
    } else {
      //@ts-ignore
      toast.error(ToastMaker("Transaction Failed",null,{href:"https://solscan.io/tx/"+txid,title: 'View on Solscan'}), {id:1});
    }
    dispatch(reloadBalances());
    return true;
  }

  const swap = async (tokens:any, orderSide:any, amount:any) => {
    let tx:any = await placeJupOrder(
      tokens,
      orderSide === 0 ? 'buy' : 'sell',
      amount,
      state.tokenList,
      wallet,
      connection
    );
    if(tx)
      await handleSendTransaction(tx);
  }

  const placeOrder = async (type:string, side:string, price:number, amount:number, batchOrders:any = null) => {
    if(type === "swap") {
      // todo: swap tx
    } else if(type == "swapThenClob") {
      // todo: swap + limit order tx
    } else if(type === "clob") {
      // Place Limit Order
      //@ts-ignore
      toast.loading(ToastMaker("Creating Order","Please wait"),{id:"1"});
      let result = await openbookTransaction(side, price, amount, currentMarket?.address.toBase58(), wallet.publicKey?.toBase58(), state.dex, state.priorityFee);
      if(result.success) {
        let tx:Transaction|any = result.transaction;
        if(!openOrdersAddress) { // if user is placing order for the first time, set OOA
          setOpenOrdersAddress(result.openOrdersAddress);
        }
        await handleSendTransaction(tx);
      } else {
        console.log('[useMarket] order failed', result);
        alert("Placing Order Failed!")
      }
    }
  }

  const getOpenOrders = async () => { // Loads ALL open orders for all markets user has traded on
    let orders = await API_GET_ORDERS(wallet.publicKey?.toBase58(), state.dex);
    if(orders.success) {
      if(openOrders !== orders.orders) {
        setOpenOrders(orders.orders);
      }
    }
    console.log('[useMarket] open orders', orders);
  }

  return {
    currentMarket,
    orderbook: ((orderbookBids && orderbookAsks) ? {bids: orderbookBids, asks: orderbookAsks} : null),
    openOrders,
    unsettledBalances,
    updateMarket,
    updateMarketWithTokens,
    placeOrder,
    swap
  }
}