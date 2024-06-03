import { use, useEffect, useState } from "react";
import styles from "./Orderbook.module.scss";
import { formatNumber } from "@/utils/utils";
import { useSelector } from "react-redux";
import { priceData } from "@/utils/openbookv2/utils";
import { Badge } from "../ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from "../ui/button";
import Link from "next/link";

export const Orderbook = ({
  orderbookType, 
  orderbook, 
  market=undefined, 
  className="flex",
  setOverridePrice=()=>null,
  setOverrideSize=()=>null,
}) => {
  const [orders, setOrders] = useState(null);
  const [updatedOrders, setUpdatedOrders] = useState({});
  const [askTotals, setAskTotals] = useState([]);
  const [bidTotals, setBidTotals] = useState([]);

  // highlights
  const [highlightedOrders, setHighlightedOrders] = useState(-1); // only show current market orders
  const [highlightedSide, setHighlightedSide] = useState([]); // only show current market orders
  const [averagePrice, setAveragePrice] = useState(0);
  const [totalSize, setTotalSize] = useState(0);

  //
  const [markPrice, setMarkPrice] = useState(null);

  const handleMouseEnter = (orderIndex, side) => {
    // Set state to mark all orders up to this index as highlighted
    let avgPrice = 0;
    let totSize = 0;
    if(side === 0) {
      const totalValue = orderbook.bids.slice(0,orderIndex+1).reduce((acc, order) => acc + (order.price * order.size), 0);
      const totalSize = orderbook.bids.slice(0,orderIndex+1).reduce((acc, order) => acc + order.size, 0);
      avgPrice = totalValue / totalSize;
      totSize = totalSize;
    } else if(side === 1) {
      const totalValue = orderbook.asks.slice(0,orderIndex+1).reduce((acc, order) => acc + (order.price * order.size), 0);
      const totalSize = orderbook.asks.slice(0,orderIndex+1).reduce((acc, order) => acc + order.size, 0);
      avgPrice = totalValue / totalSize;
      totSize = totalSize;
    }
    setAveragePrice(avgPrice);
    setTotalSize(totSize);
    setHighlightedOrders(orderIndex);
    setHighlightedSide(side);
  };

  const handleMouseLeave = () => {
      // Reset the state to remove highlights
      setAveragePrice(0);
      setTotalSize(0);
      setHighlightedOrders(-1);
      setHighlightedSide(0);
  };

  useEffect(() => { // set bid/ask totals
    if(orderbook) {
      // console.log('orderbook', orderbook)
      let _askTotals = [];
      let _bidTotals = [];
      let askTotal = 0;
      let bidTotal = 0;
      orderbook.asks.forEach(ask => {
        askTotal += ask.size;
        _askTotals.push(askTotal);
      })
      orderbook.bids.forEach(bid => {
        bidTotal += bid.size;
        _bidTotals.push(bidTotal);
      })
      setAskTotals(_askTotals);
      setBidTotals(_bidTotals);

      // calculate mark price
      if(orderbook.bids.length > 0 && orderbook.asks.length > 0) {
        const weightedBid = (orderbook.bids[0].price * orderbook.bids[0].size) / (orderbook.bids[0].size + orderbook.asks[0].size);
        const weightedAsk = (orderbook.asks[0].price * orderbook.asks[0].size) / (orderbook.bids[0].size + orderbook.asks[0].size);
        setMarkPrice(weightedBid + weightedAsk);
      } else {
        setMarkPrice(null);
      }
      if(!orders) setOrders(orderbook);
    }
  },[orderbook]);

  useEffect(() => {
    let timer;
    if(orderbook && orders) {
      const newUpdates = {};
      const updateCheck = (newOrders, oldOrders) => {
          newOrders.forEach(newOrder => {
              const existingOrder = oldOrders.find(o => o.price === newOrder.price);
              if (!existingOrder || newOrder.size !== existingOrder.size) {
                  newUpdates[newOrder.price] = true;
              }
          });
      };
      updateCheck(orderbook.bids, orders.bids);
      updateCheck(orderbook.asks, orders.asks);
  
      setOrders(orderbook);
      setUpdatedOrders(newUpdates);
  
      timer = setTimeout(() => setUpdatedOrders({}), 500); // Adjust the flash duration
    } 
    return () => clearTimeout(timer);
  }, [orderbook]);

  if(orderbook && orderbook.bids.length === 0 && orderbook.asks.length === 0) {
    if(market.empty) {
      return <div className={`w-full h-[320] flex flex-col gap-2 items-center justify-center border rounded-md p-3`}>
        <p className="text-sm">Market doesn't exist</p>
        <p className="text-xs text-green-500 text-center">You can use the swap below</p>
        <p className="text-xs text-muted-foreground text-center">or create a new market to place limit orders</p>
        <Link className="w-full" href={`/tools/create?baseMint=${market.baseMint.toBase58()}&quoteMint=${market.quoteMint.toBase58()}&baseDecimals=${market.baseDecimals}&quoteDecimals=${market.quoteDecimals}`}>
          <Button variant={"outline"} className="w-full">Create Market</Button>
        </Link>
      </div>
    }
    return <div className={`w-full h-[320] flex flex-col gap-2 items-center justify-center`}>
      <p className="text-sm text-muted-foreground">Orderbook is currently empty</p>
      <p className="text-xs text-muted-foreground text-center">Start by placing an order or swap</p>

    </div>
  }
  return <div className={`${styles.orderbook} ${className}`}
  >

    {
      orderbookType === 0 &&
      <div className={'w-full flex items-center justify-between px-2 pb-2 gap-1'}>
        {
          markPrice &&
          <p className="text-lg font-bold">{formatNumber(markPrice, "auto")}</p>
        }
        { orderbook &&
          (orderbook.bids.length > 0 && orderbook.asks.length > 0) &&
          <Badge variant={'outline'} className="text-muted-foreground rounded">
            SPREAD: {formatNumber((orderbook.asks[0].price - orderbook.bids[0].price) / orderbook.bids[0].price * 100, "2")}%
          </Badge>
          // <p className={styles.spread}>
          //   {/* ({formatNumber(combinedAsks[0][0] - combinedBids[0][0], "auto")}) */}
          // </p>
        }
      </div>
    }
    
    {
      orderbookType === 0 &&
      <div className={styles.orderbookTable}>
        <div className={styles.orderBookSide} onMouseLeave={handleMouseLeave}>
          <div className={styles.bookTop}>
            <p className={styles.size}>Amount</p>
            <p className={styles.price}>Bid</p>
          </div>
          <div className={`${styles.bookBody} relative`}>
            {
              highlightedSide === 0 && highlightedOrders > -1 &&
              <div className="pointer-events-none w-full mt-2 absolute z-10 border border-dashed border-green-500" style={{height: `${(highlightedOrders+1) * 24}px`, top: 0, left: 0}}/>
            }
            { // Fill order bulk
              highlightedSide === 0 && highlightedOrders > -1 &&
              <HoverCard open={highlightedOrders > -1} openDelay={100} closeDelay={1000}>
                <HoverCardTrigger></HoverCardTrigger>
                <HoverCardContent sideOffset={0} className="items-center flex-col gap-3 absolute md:right-[84px] 2xl:right-24 hidden md:flex"
                  style={{top: `${(highlightedOrders+1) * 24 - 61}px`}}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-start flex-col gap-1">
                      <p className="text-xs text-muted-foreground">Average Price</p>
                      <p className="text-sm font-bold">{formatNumber(averagePrice, "auto")}</p>
                    </div>
                    <div className="flex items-end flex-col gap-1">
                      <p className="text-xs text-muted-foreground">Total Size</p>
                      <p className="text-sm font-bold">{formatNumber(totalSize, "auto")}</p>
                    </div>
                  </div>
                  <Button onClick={() => {
                    setOverridePrice(orderbook.bids[highlightedOrders].price);
                    setOverrideSize(totalSize);
                  }} variant={"default"} className="w-full bg-green-500 hover:bg-green-600 text-black">Fill Order</Button>
                </HoverCardContent>
              </HoverCard>
            }
            { // TODO: fix inssuficient balance on mobile
              orderbook && orderbook.bids.map((bid, i) => {
                return <div
                  onMouseEnter={() => handleMouseEnter(i, 0)}
                  className={`px-2 ${styles.row} ${updatedOrders[bid.price] ? styles.flashGreen: ''}`} key={i}
                >
                  <div className={`${styles.orderSizeBar} ${styles.reverse}`} style={{width: (bid.size / bidTotals[bidTotals.length-1]) * 100 + "%",  opacity:0.3,backgroundColor: "var(--green700)"}}></div>
                  <div className={`${styles.orderSizeBar} ${styles.reverse} ${styles.total}`} style={{width: (bidTotals[i] / bidTotals[bidTotals.length-1]) * 100 + "%", backgroundColor: "var(--green700)"}}></div>
                  {
                    bid.userInOrder &&
                    <div className={`w-[2px] h-[8px] top-[7px] rounded-full absolute left-0`} style={{backgroundColor: "var(--green700)"}}/>
                  }
                  <p onClick={() => setOverrideSize(bid.size)} className={styles.size}>{formatNumber(bid.size, "auto")}</p>
                  <p onClick={() => setOverridePrice(bid.price)} className={styles.price} style={{color:"var(--green700)"}}>{formatNumber(bid.price, "auto")}</p>
                  {/* <div className="total">{bid.total}</div> */}
                </div>
              })
            }
          </div>
        </div>
        
        <div className={styles.orderBookSide} onMouseLeave={handleMouseLeave}>
          <div className={styles.bookTop}>
            <p className={styles.price}>Ask</p>
            <p className={styles.size}>Amount</p>
          </div>
          <div className={`${styles.bookBody} relative pl-1`}>
            {
              highlightedSide === 1 && highlightedOrders > -1 &&
              <div className="pointer-events-none w-full mt-2 absolute z-10 border border-dashed border-red-500" style={{height: `${(highlightedOrders+1) * 24}px`, top: 0, left: 0}}/>
            }
            { // Fill order bulk
              highlightedSide === 1 && highlightedOrders > -1 &&
              <HoverCard open={highlightedOrders > -1} openDelay={100} closeDelay={100}>
                <HoverCardTrigger></HoverCardTrigger>
                <HoverCardContent  sideOffset={0} className="items-center flex-col gap-3 absolute md:right-[84px] 2xl:right-24 hidden md:flex"
                  style={{top: `${(highlightedOrders+1) * 24 - 61}px`}}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-start flex-col gap-1">
                      <p className="text-xs text-muted-foreground">Average Price</p>
                      <p className="text-sm font-bold">{formatNumber(averagePrice, "auto")}</p>
                    </div>
                    <div className="flex items-end flex-col gap-1">
                      <p className="text-xs text-muted-foreground">Total Size</p>
                      <p className="text-sm font-bold">{formatNumber(totalSize, "auto")}</p>
                    </div>
                  </div>
                  <Button onClick={() => {
                    setOverridePrice(orderbook.asks[highlightedOrders].price);
                    setOverrideSize(totalSize);
                  }} variant={"default"} className="w-full bg-red-500 hover:bg-red-600 text-black">Fill Order</Button>
                </HoverCardContent>
              </HoverCard>
            }
            {
              orderbook && orderbook.asks.map((ask, i) => {
                return <div 
                  onMouseEnter={() => handleMouseEnter(i, 1)}
                  className={`px-2 ${styles.row} ${updatedOrders[ask.price] ? styles.flashRed: ''}`} key={i}
                  >
                  <div className={`${styles.orderSizeBar} `} style={{width: (ask.size / askTotals[askTotals.length-1]) * 100 + "%", opacity:0.1, backgroundColor: "var(--red700)"}}></div>
                  <div className={`${styles.orderSizeBar} ${styles.total}`} style={{width: (askTotals[i] / askTotals[askTotals.length-1]) * 100 + "%", backgroundColor: "var(--red700)"}}></div>
                  {
                    ask.userInOrder &&
                    <div className={`w-[2px] h-[8px] top-[7px] rounded-full absolute right-0`} style={{backgroundColor: "var(--red700)"}}/>
                  }
                  <p onClick={() => setOverridePrice(ask.price)} className={styles.price} style={{color:"var(--red700)"}}>{formatNumber(ask.price,"auto")}</p>
                  <p onClick={() => setOverrideSize(ask.size)} className={styles.size}>{formatNumber(ask.size,"auto")}</p>
                  {/* <div className="total">{bid.total}</div> */}
                </div>
              })
            }
          </div>
        </div>
        {/* <div className="middlePart">
          <div className="price">
            <p>{formatNumber(orderBook && orderBook.asks[0] ? orderBook.asks[0][0] : 0,"auto")}</p>
          </div>
          <div className="spread">
            <p>{formatNumber(orderBook && orderBook.asks[0] && orderBook.bids[0] ? orderBook.asks[0][0] - orderBook.bids[0][0] : 0,"auto")}</p>
          </div>
          <div className="price">
            <p>{formatNumber(orderBook && orderBook.bids[0] ? orderBook.bids[0][0] : 0,"auto")}</p>
          </div>
        </div> */}
        
      </div>
    }
  </div>
}