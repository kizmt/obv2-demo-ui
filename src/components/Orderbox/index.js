import { Selector } from "@/components/Selector";
import styles from "./Orderbox.module.scss"
import { useEffect, useState } from "react";
import { Orderbook } from "@/components/Orderbook";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDownIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { OrderBoxSwap } from "@/components/OrderboxSwap";
import SwapIcon from "/public/assets/icons/swap.svg";
import LinearIcon from "/public/assets/icons/linear.svg";
import EqualIcon from "/public/assets/icons/equal.svg";
import { TokenSearchPopup } from "@/components/TokenSearchPopup";
import Image from "next/image";
import { ToastMaker, formatNumber } from "@/utils/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BarchartVisualiser } from "../BarchartVisualiser";
import toast, { LoaderIcon } from "react-hot-toast";

export const Orderbox = ({market, 
  orderbook, 
  placeOrder, 
  updateMarket, 
  updateMarketWithTokens,
  hasOrdersInOrderbook, 
  isDesktop=false, 
  swap,
  overridePrice=null,
  overrideSize=null,
  setStrategyPreview=null,
  strategy=0
}) => {
  const state = useSelector((state) => state.storage);
  const dispatch = useDispatch();

  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [base, setBase] = useState(null);
  const [quote, setQuote] = useState(null);
  const [defaultBase, setDefaultBase] = useState(null);
  const [defaultQuote, setDefaultQuote] = useState(null);

  const [orderSide, setOrderSide] = useState(0); // 0 -> buy, 1 -> sell
  const [orderType, setOrderType] = useState(0); // 0 -> limit, 1 -> swap
  // const [strategy, setStrategy] = useState(0); // 0 -> limit, 1 -> spread, 2 -> volatility
  //inputs
  const [limitPrice, setLimitPrice] = useState(""); // limit price
  const [size, setSize] = useState(""); // you receive
  const [amount, setAmount] = useState(""); // you pay

  // strategy inputs [spread]
  const [priceTick, setPriceTick] = useState("");
  const [orderCount, setOrderCount] = useState(7);
  const [placementStrat, setPlacementStrat] = useState(0); // 0 -> equal, 1 -> curve
  const [batchOrders, setBatchOrders] = useState([]);
  
  // balances
  const [baseBalance, setBaseBalance] = useState(0);
  const [quoteBalance, setQuoteBalance] = useState(0);

  // swap inputs
  const [swapInput, setSwapInput] = useState("");
  const [swapOutput, setSwapOutput] = useState("");
  const [swapQuote, setSwapQuote] = useState(null);

  // popups
  const [tokenSearchPopup, setTokenSearchPopup] = useState(-1); // 0 -> base, 1 -> quote

  const [orderInProgress, setOrderInProgress] = useState(false);

  useEffect(() => { // chart strategy visualiser
    if(batchOrders && batchOrders.length > 0) {
      setStrategyPreview(batchOrders);
    } else {
      console.log("no batch orders")
      setStrategyPreview(null);
    }
  }, [batchOrders]);

  useEffect(() => { // reset batch orders when input is changed
    if(limitPrice > 0 && amount && priceTick > 0 && orderCount && strategy > 0) {

    } else {
      setBatchOrders(null);
    }
  }, [limitPrice,amount,priceTick,orderCount, strategy])

  useEffect(() => { // override prices if user sweeps from orderbook
    if(overridePrice) {
      setLimitPrice(formatNumber(overridePrice, "auto"));
    }
  }, [overridePrice]);

  useEffect(() => { // override prices if user sweeps from orderbook
    if(overridePrice && overrideSize) {
      if(orderSide === 0) {
        setAmount(overrideSize * overridePrice);
        setSize(overrideSize);
      } else {
        setAmount(overrideSize);
        setSize(overrideSize * overridePrice);
      }
    }
  }, [overrideSize]);
  
  useEffect(() => {
    if(market) {
      // set initial tokens, if user wants to place limit order with different token.
      setBase(market.baseToken);
      setQuote(market.quoteToken);
      setDefaultBase(market.baseToken);
      setDefaultQuote(market.quoteToken);
    }
  }, [market]);

  useEffect(() => {
    if(base && quote && defaultBase && defaultQuote) {
      if((base.address !== defaultBase.address && orderSide === 0) || (base.address !== defaultQuote.address && orderSide === 1)) {
        console.log('[orderbox] doesnt match', base.address, quote.address, market.baseMint.toBase58(), market.quoteMint.toBase58())

        updateMarketWithTokens(base, quote).then(res => {
          console.log('[orderbox] updateWithTokens', res)
        })
      }
    }
  }, [base, quote])

  useEffect(() => {
    if(state.accounts.length > 0 && base && quote) {
      let b = 0;
      let q = 0;
      for(let i = 0; i < state.accounts.length; i++) {
        if(state.accounts[i].address === base.address) {
          b = state.accounts[i].balance;
        } else
        if(state.accounts[i].address === quote.address) {
          q = state.accounts[i].balance;
        }
      }
      if(base.address === 'So11111111111111111111111111111111111111112' && b === 0 && wallet.connected) {
        // user has no wsol, get native sol balance
        connection.getBalance(wallet.publicKey).then((balance) => {
          b = balance / 10 ** 9;
          setBaseBalance(b);
        });
      } else {
        setBaseBalance(b);
      }
      setQuoteBalance(q);
    }
  }, [base, quote, state.accounts]);

  useEffect(() => { // change to swap if market doesn't exist
    if(market && market.empty) setOrderType(1);
  }, [market]);

  // useEffect(() => { // switch to swap when orderbook is empty
  //   if(base && quote && orderbook) {
  //     console.log('checking order type', base, quote, orderbook);
  //     let _orderType = (orderbook.bids.length === 0 && orderbook.asks.length === 0) ? 1 : 0;
  //     if(orderType !== _orderType && orderType === 0) {
  //       setOrderType(_orderType);
  //     }
  //   }
  // }, [base, quote, orderbook])

  function setAmountWithSize(size) { 
    let amountDecimals = 6;
    let sizeDecimals = 6;
    if(!Number(size)) {
      setSize(size);
      return null; // ignore if user is typing dot in the input
    }
    if(orderSide === 0) {
      amountDecimals = quote.decimals;
      sizeDecimals = base.decimals;
    } else {
      amountDecimals = base.decimals;
      sizeDecimals = quote.decimals;
    }
    let _size = Number(parseFloat(size).toFixed(sizeDecimals))
    setSize(_size);
    if(orderSide === 0) {
      setAmount(Number((limitPrice * _size).toFixed(amountDecimals)));
    } else {
      setAmount(Number((_size / limitPrice).toFixed(amountDecimals)));
    }
  }
  function setSizeWithAmount(amount) {
    let amountDecimals = 6;
    let sizeDecimals = 6;

    if(!Number(amount)) {
      setAmount(amount);
      return null; // ignore if user is typing dot in the input
    }
    if(orderSide === 0) {
      amountDecimals = quote.decimals;
      sizeDecimals = base.decimals;
    } else {
      amountDecimals = base.decimals;
      sizeDecimals = quote.decimals;
    }
    let _amount = Number(parseFloat(amount).toFixed(amountDecimals))
    setAmount(_amount);
    if(orderSide === 0) {
      setSize(Number(((_amount) / limitPrice).toFixed(sizeDecimals)));
    } else {
      setSize(Number((_amount * limitPrice).toFixed(sizeDecimals)));
    }
  }
  function setPrice(price) {
    if(!Number(price)) {
      setLimitPrice(price);
      return null; // ignore if user is typing dot in the input
    }
    let sizeDecimals = quote.decimals;
    if(orderSide === 0) sizeDecimals = base.decimals;
    let _price = Number(parseFloat(price).toFixed(6));
    setLimitPrice(_price);
    if(size > 0) {// update amount user will receive on a new limit price
      if(orderSide === 0)
        setSize(Number((amount / _price).toFixed(sizeDecimals)));
      else 
        setSize(Number((amount * _price).toFixed(sizeDecimals)));
    }
  }

  const switchSide = (side) => {
    if(market && base && quote) {
      setBase(quote);
      setQuote(base);
      setOrderSide(side);
      setAmount("");
      setSize("");
      setSwapInput(swapOutput);
    }
  }

  const selectToken = (token) => { // switch to token from search popup
    console.log("[orderbox]", token, base, quote, market)
    if(tokenSearchPopup === 1) { // 1 = you pay (quote), 0 = you receive (base)
      setBase(token);
      if(token.address !== market.baseMint.toBase58() && token.address !== market.quoteMint.toBase58()) { // user is trying to trade on a different market
        console.log("[orderbox] needs to switch market", market, token.address, base.address, quote.address)
        // updateMarket({
        //   base: token,
        //   quote: quote
        // });
      }
    } else {
      setQuote(token);
    }
    
    setTokenSearchPopup(-1);
  }

  const makeOrder = async () => {
    setBatchOrders(null);
    setOrderInProgress(true);
    if(strategy === 0) {
      await placeOrder(
        "clob",
        orderSide === 0 ? 'buy' : 'sell',
        limitPrice,
        amount
      ).then(res => {
        setOrderInProgress(false);
      })
    } else if(strategy === 1 && batchOrders) {
      if(batchOrders.length > 0) {
        let error = false;
        batchOrders.map(order => {
          if(!order.price || !order.amount) {
            error = true;
            console.log('ERROR', order)
            return;
          }
        })
        if(batchOrders.length > 7) error = true;

        if(!error) {
          await placeOrder(
            "batch",
            orderSide === 0 ? 'buy' : 'sell',
            null,
            null,
            batchOrders
          ).then(res => {
            setOrderInProgress(false);
            setOrderCount("");
          });
        } else {
          setOrderInProgress(false);
          toast.error(ToastMaker('Invalid Order', 'Make sure order is correct'), {id: 1});
        }
      }
    }
  }

  return <div className={styles.orderbox}>
    {
      
      strategy === 0 ? // normal limit order
      <div className={`flex flex-col`}>
        <div className={`w-full ${orderType === 1 && 'hidden'} ${market?.empty && 'hidden'}`}>
          <div className="w-full px-2">
            <div className="w-full h-12 p-1 grid grid-cols-2 items-center border rounded-sm overflow-hidden">
              <p className={`w-full h-full rounded-sm text-sm font-bold cursor-pointer flex items-center justify-center ${orderSide === 0 ? ' bg-green-500 text-black' : ''}`} onClick={() => {
                if(orderSide === 1) switchSide(0)
              }}>
                Buy
              </p>
              <p className={`w-full h-full text-sm rounded-sm font-bold cursor-pointer flex items-center justify-center ${orderSide === 1 ? ' bg-red-500 text-black' : ''}`} onClick={() => {
                if(orderSide === 0) switchSide(1)
              }}>
                Sell
              </p>
            </div>
          </div>
        </div>
        {
          <div className={`flex flex-col ${isDesktop ? 'px-2' : ''}`}>
            <div className={'flex border w-full flex-col mt-2 gap-1 rounded-md p-2'}>
              <div className={'w-full flex items-center justify-between'}>
                <p className={'text-sm text-muted-foreground'}>{orderSide === 0 ? "Buy" : "Sell"} Price / Limit Price</p>
                <p className={'text-sm font-bold underline'} onClick={() => {
                    if(orderbook) {
                      if(orderSide === 0) {
                        setLimitPrice(orderbook.asks[0].price);
                      } else {
                        setLimitPrice(orderbook.bids[0].price);
                      }
                    }
                  }}>Use Market</p>
              </div>
              <div className={`w-full relative flex items-center justify-end`}>
                <input onWheel={(e) => e.target.blur()} className={'absolute font-[Font-Bold] font-bold pl-1 text-xl w-full h-full top-0 left-0 bg-transparent'} value={limitPrice} lang="en" onChange={(e) => setPrice(e.target.value)} type="number" placeholder="0.00" inputMode='decimal' pattern="[0-9,]*"/>
                
                <div className="flex items-center gap-2">
                  { (orderbook && orderbook.bids.length > 0 && orderbook.asks.length > 0 && limitPrice > 0) &&
                    (orderSide === 0 ?
                      limitPrice !== orderbook.asks[0].price &&
                      <p className={`text-xs ${limitPrice < orderbook.asks[0].price ? 'text-green-500' : 'text-red-500'}`}>
                      {
                        Math.abs(formatNumber((limitPrice - orderbook.asks[0].price) / orderbook.asks[0].price * 100, "2")) + `% ${limitPrice > orderbook.asks[0].price ? 'above' : 'below'} market`
                      }
                    </p>
                      :
                      limitPrice !== orderbook.bids[0].price &&
                      <p className={`text-xs ${limitPrice < orderbook.bids[0].price ? 'text-red-500' : 'text-green-500'}`}>
                        {
                          Math.abs(formatNumber((orderbook.bids[0].price - limitPrice) / orderbook.bids[0].price * 100, "2")) + `% ${limitPrice < orderbook.bids[0].price ? 'below' : 'above'} market`
                        }
                      </p>)
                  }
                  <div className={'flex items-center gap-1 bg-background-over p-1.5 rounded z-10'}>
                    {
                      market ?
                      <img src={market.quoteToken.logoURI} width="24px" height="24px"/>
                      :
                      <div className="skeleton" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
                    }
                    {
                      market ? 
                      <p className="font-bold text-sm">{market.quoteToken.symbol}</p> 
                      :
                      <div className="skeleton" style={{width:"40px", height:"20px"}}/>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex border w-full flex-col mt-2 mb-2 gap-1 rounded-md py-2`}>
              <div className={'w-full flex items-center justify-between px-2'}>
                <div className="flex items-center gap-2">
                  <p className={`text-sm text-muted-foreground`}>You Pay</p>
                  <div className="flex items-center gap-1">
                    <Badge onClick={() => setSizeWithAmount(quoteBalance/2)} variant={"outline"} size={"sm"} className="cursor-pointer text-xs font-bold hover:bg-background-over">50%</Badge>
                  </div>
                </div>
                {quote &&
                  (quoteBalance ?
                  <p className={'text-sm text-muted-foreground'} onClick={() => setSizeWithAmount(quoteBalance)}>Max: {formatNumber(quoteBalance, "auto")} {quote.symbol}</p>
                  :
                  <p className={'text-sm text-muted-foreground'}>Max: 0 {quote.symbol}</p>)
                }
              </div>
              <div className={`w-full relative flex items-center justify-end px-2`}>
                <input onWheel={(e) => e.target.blur()} className={'absolute font-[Font-Bold] font-bold pl-3 text-xl w-full h-full top-0 left-0 bg-transparent'} value={amount} lang="en" onChange={(e) => setSizeWithAmount(e.target.value)} type="number" placeholder="0.00" inputMode='decimal' pattern="[0-9]*"/>
                <div className={`flex items-center gap-1 bg-background-over p-1 px-2 rounded z-10`}>
                  {
                    quote ?
                    <img className="rounded-full" src={quote.logoURI} width="24px" height="24px"/>
                    :
                    <div className="skeleton" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
                  }
                  {
                    quote ? 
                    <p className="font-bold text-sm">{quote.symbol}</p> 
                    :
                    <div className="skeleton" style={{width:"40px", height:"20px"}}/>
                  }
                </div>
              </div>
              <div className="w-full border-t my-2"/>
              <div className={'w-full flex items-center justify-between px-2'}>
                <p className={'text-sm text-muted-foreground'}>You Receive</p>
                {
                  (base && baseBalance) ?
                  <p className={'text-sm text-muted-foreground'}>Balance: {formatNumber(baseBalance, "auto")} {base.symbol}</p>
                  :
                  <p className={'text-sm'}></p>
                }
              </div>
              <div className={'w-full mt-1 mb-1 relative flex items-center justify-end px-2'}>
                {/* setTokenSearchPopup(1)}> */}
                <input onWheel={(e) => e.target.blur()} className={'absolute font-[Font-Bold] font-bold pl-3 text-xl w-full h-full top-0 left-0 bg-transparent'} value={size} lang="en" onChange={(e) => setAmountWithSize(e.target.value)} type="number" placeholder="0.00" inputMode='decimal' pattern="[0-9]*"/>
                <div className="flex items-center gap-1 bg-background-over p-1 px-2 rounded z-10">
                  {
                    base ?
                    <img className="rounded-full" src={base.logoURI} width="24px" height="24px"/>
                    :
                    <div className="skeleton" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
                  }
                  {
                    base ? 
                    <p className="font-bold text-sm">{base.symbol}</p> 
                    :
                    <div className="skeleton" style={{width:"40px", height:"20px"}}/>
                  }
                </div>
            </div>

            </div>
            
            {
              wallet.connected ?
              ((limitPrice > 0 && amount > 0 && ((orderSide === 0 && quoteBalance < amount) || (orderSide === 1 && quoteBalance < amount))) ?
              <div className={'flex w-full p-2 py-4 rounded-xl bg-black items-center justify-center text-muted-foreground font-bold'}>
                <p>Insufficient Balance</p>
              </div>
              :
              (limitPrice > 0 && amount > 0) ?
                (!orderInProgress ?
                <div className={`flex w-full pointer p-2 py-4 rounded-md items-center justify-center text-black font-bold ${orderSide === 0 ? 'bg-green-500' : 'bg-red-500'}`} onClick={() => makeOrder()}>
                  <p>Place Order</p>
                </div>
                :
                <div className={'flex w-full gap-2 p-2 py-4 rounded-md bg-black items-center justify-center text-muted-foreground font-bold'}>
                  <LoaderIcon/>
                  <p>Placing Order</p>
                </div>)
              :
              <div className={'flex w-full p-2 py-4 rounded-md bg-black items-center justify-center text-muted-foreground font-bold'}>
                <p>Enter Order Details</p>
              </div>)
              :
              <div className={'flex w-full p-2 py-4 rounded-md bg-black items-center justify-center text-muted-foreground font-bold'}>
                <p>Please connect wallet</p>
              </div>
            }
            
          </div>
        }
      </div>
      :
      strategy === 1 && // spread order
      <div className={`flex flex-col ${isDesktop ? 'px-2' : ''}`}>
        <div className={`w-full ${orderType === 1 && 'hidden'} ${market?.empty && 'hidden'}`}>
          <div className="w-full">
            <div className="w-full h-12 p-1 grid grid-cols-2 items-center border rounded-sm overflow-hidden">
              <p className={`w-full h-full rounded-sm text-sm font-bold cursor-pointer flex items-center justify-center ${orderSide === 0 ? ' bg-green-500 text-black' : ''}`} onClick={() => {
                if(orderSide === 1) switchSide(0)
              }}>
                Buy
              </p>
              <p className={`w-full h-full text-sm rounded-sm font-bold cursor-pointer flex items-center justify-center ${orderSide === 1 ? ' bg-red-500 text-black' : ''}`} onClick={() => {
                if(orderSide === 0) switchSide(1)
              }}>
                Sell
              </p>
            </div>
          </div>
        </div>
        <div className={`flex flex-col`}>
          {/*  */}
          <div className={`flex border w-full flex-col mt-2 mb-2 gap-1 rounded-md py-2`}>
            <div className={'w-full flex items-center justify-between px-2'}>
              <div className="flex items-center gap-2">
                <p className={`text-sm text-muted-foreground`}>Starting Price</p>
              </div>
              <div className="flex items-center gap-2">
                <p className={'text-sm cursor-pointer font-bold underline'} onClick={() => {
                    if(orderbook) {
                      setLimitPrice((orderbook.asks[0].price + orderbook.bids[0].price) / 2);
                    }
                  }}>Midpoint</p>
                <p className={'text-sm cursor-pointer font-bold underline'} onClick={() => {
                    if(orderbook) {
                      if(orderSide === 0) {
                        setLimitPrice(orderbook.bids[0].price);
                      } else {
                        setLimitPrice(orderbook.asks[0].price);
                      }
                    }
                  }}>
                  {
                    orderSide === 0 ?
                    "Bid"
                    :
                    "Ask"
                  }
                </p>
              </div>
            </div>
            <div className={`w-full relative flex items-center justify-end px-2`}>
              <input
                onWheel={(e) => e.target.blur()}
                className={'absolute font-[Font-Bold] font-bold pl-3 text-xl w-full h-full top-0 left-0 bg-transparent'}
                value={limitPrice}
                lang="en"
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                placeholder="0.00"
                inputMode='decimal'
                pattern="[0-9,]*"
              />
              <div className="flex items-center gap-2">
                { (orderbook && orderbook.bids.length > 0 && orderbook.asks.length > 0 && limitPrice > 0) &&
                  (orderSide === 0 ?
                    limitPrice !== orderbook.asks[0].price &&
                    <p className={`text-xs ${limitPrice < orderbook.asks[0].price ? 'text-green-500' : 'text-red-500'}`}>
                    {
                      Math.abs(formatNumber((limitPrice - orderbook.asks[0].price) / orderbook.asks[0].price * 100, "2")) + `% ${limitPrice > orderbook.asks[0].price ? 'above' : 'below'} market`
                    }
                  </p>
                    :
                    limitPrice !== orderbook.bids[0].price &&
                    <p className={`text-xs ${limitPrice < orderbook.bids[0].price ? 'text-red-500' : 'text-green-500'}`}>
                      {
                        Math.abs(formatNumber((orderbook.bids[0].price - limitPrice) / orderbook.bids[0].price * 100, "2")) + `% ${limitPrice < orderbook.bids[0].price ? 'below' : 'above'} market`
                      }
                    </p>)
                }
                <div className={`flex items-center gap-1 bg-background-over p-1.5 rounded z-10`}>
                  {
                    market ?
                    <img className="rounded-full" src={market.quoteToken.logoURI} width="24px" height="24px"/>
                    :
                    <div className="skeleton" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
                  }
                  {
                    market ? 
                    <p className="text-sm font-bold">{market.quoteToken.symbol}</p> 
                    :
                    <div className="skeleton" style={{width:"40px", height:"20px"}}/>
                  }
                </div>
              </div>
            </div>
            <div className="w-full border-t my-2"/>
            <div className={'w-full flex items-center justify-between px-2'}>
              <p className={'text-sm text-muted-foreground'}>Total Order Size</p>
              {
              quote &&
                (quoteBalance ?
                <p className={`text-sm text-muted-foreground cursor-pointer`} onClick={() => setSizeWithAmount(quoteBalance)}>Max: {quoteBalance} {quote.symbol}</p>
                :
                <p className={'text-sm text-muted-foreground cursor-pointer'}>Max: 0 {quote.symbol}</p>)
              }
            </div>
            <div className={'w-full mt-1 mb-1 relative flex items-center justify-end px-2'}>
              <input
                onWheel={(e) => e.target.blur()} 
                className={'absolute font-[Font-Bold] font-bold pl-3 text-xl w-full h-full top-0 left-0 bg-transparent'} 
                value={amount} 
                lang="en" 
                onChange={(e) => setSizeWithAmount(e.target.value)} 
                type="number" 
                placeholder="0.00" 
                inputMode='decimal' 
                pattern="[0-9]*"
              />
              <div className={`flex items-center gap-1 bg-background-over p-1.5 rounded z-10`}>
                  {
                    quote ?
                    <img className="rounded-full" src={quote.logoURI} width="24px" height="24px"/>
                    :
                    <div className="skeleton" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
                  }
                  {
                    quote ? 
                    <p className="text-sm font-bold">{quote.symbol}</p> 
                    :
                    <div className="skeleton" style={{width:"40px", height:"20px"}}/>
                  }
                </div>
            </div>
          </div>
          {/*  */}
          
          <div className="grid grid-cols-2 items-center border rounded-md divide-x">
            <div className={`flex flex-col w-full h-full py-2 px-1`}>
              <div className={`flex items-center justify-between px-2`}>
                <p className={`text-sm text-muted-foreground`}>
                  {
                    orderSide === 0 ? "Decrement" : "Increment"
                  }
                </p>
              </div>
              <div className={`w-full mt-2 mb-1 relative flex items-center justify-end px-2`}>
                <input 
                  className={'font-[Font-Bold] font-bold text-xl w-full h-full top-0 left-0 bg-transparent'} 
                  value={priceTick} lang="en" onChange={(e) => setPriceTick(e.target.value)} type="number" placeholder="0.00" inputMode='decimal' pattern="[0-9]*"/>
              </div>
            </div>
            <div className={`flex flex-col w-full h-full py-2 px-1`}>
              <div className={`flex items-center justify-end px-2`}>
              <p className={`text-sm text-muted-foreground`}>
                Total Orders (up to 7)
              </p>
              </div>
              <div className={`w-full mt-2 mb-1 relative flex items-center justify-end px-2`}>
                <input 
                  className={'font-[Font-Bold] font-bold pl-1 text-right text-xl w-full h-full top-0 left-0 bg-transparent'} 
                  value={orderCount} lang="en" onChange={(e) => {
                    if(Number(e.target.value) > 16) e.target.value = 16;
                    setOrderCount(e.target.value)
                  }
                } type="number" placeholder="0.00" inputMode='decimal' pattern="[0-9]*"/>
              </div>
            </div>
          </div>
          <div className="w-full grid grid-cols-2 items-center h-12 my-2 border rounded-sm p-1 select-none">
            <div 
              onClick={() => {if(placementStrat !== 0) setPlacementStrat(0)}}
              className={`${placementStrat === 0 ? 'bg-background-over text-white' : 'text-muted-foreground bg-background'} flex rounded-sm cursor-pointer gap-1 items-center justify-center w-full h-full`}
              >
              <EqualIcon className="w-6 h-6"/>
              <p className="text-sm font-bold">Equal Placement</p>
            </div>
            <div onClick={() => {if(placementStrat !== 1) setPlacementStrat(1)}} className={`${placementStrat === 1 ? 'bg-background-over text-white' : 'text-muted-foreground bg-background'} flex rounded-sm gap-1 cursor-pointer items-center justify-center w-full h-full`}>
              <LinearIcon className="w-6 h-6"/>
              <p className="text-sm font-bold">Linear Placement</p>
            </div>
          </div>
          <div className="w-0 h-0 flex flex-col opacity-0 items-center gap-2 mt-2">
              {
                (limitPrice > 0 && amount && priceTick > 0 && orderCount > 0) ?
                <BarchartVisualiser 
                  limitPrice={limitPrice}
                  orderSide={orderSide}
                  orderSize={amount}
                  placementStrat={placementStrat}
                  tick={priceTick}
                  orderCount={orderCount}
                  setBatchOrders={setBatchOrders}
                />
                :
                <div className="w-full h-[100px] flex items-center justify-center">
                  <p className="text-muted-foreground text-xs">Please enter details</p>
                </div>
              }
            </div>
          {
              (limitPrice > 0 && amount > 0 && priceTick > 0 && orderCount > 0) ?
                quoteBalance > amount ?
                  (!orderInProgress ?
                    <div className={`flex w-full pointer p-2 py-4 rounded-xl items-center justify-center text-black font-bold ${orderSide === 0 ? 'bg-green-500' : 'bg-red-500'}`} onClick={() => makeOrder()}>
                      <p>Place Order</p>
                    </div>
                    :
                    <div className={'flex w-full gap-2 p-2 py-4 rounded-xl bg-black items-center justify-center text-muted-foreground font-bold'}>
                      <LoaderIcon/>
                      <p>Placing Order</p>
                    </div>
                  )
                  :
                  <div className={'flex w-full p-2 py-4 rounded-xl bg-black items-center justify-center text-muted-foreground font-bold'}>
                    <p>Insufficient Balance</p>
                  </div>
              :
                <div className={'flex w-full p-2 py-4 rounded-xl bg-black items-center justify-center text-muted-foreground font-bold'}>
                  <p>Enter Order Details</p>
                </div>
            }
        </div>
      </div>
      
      }
    {
      <TokenSearchPopup 
        popupOpen={tokenSearchPopup} 
        closePopup={() => setTokenSearchPopup(-1)}
        onSelect={
          (token) => {
            if(token.address !== base.address && token.address != quote.address) {
              selectToken(token)
            } else {
              setTokenSearchPopup(-1);
            }
          }
        }
      />
    }
  </div>
}

 