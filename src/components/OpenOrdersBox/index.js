import { useEffect, useState } from "react";
import styles from "./OpenOrdersBox.module.scss";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { TokenIcon } from "@/components/TokenIcon";
import { Selector } from "@/components/Selector";
import { useSelector } from "react-redux";
import useWindowDimensions, { ToastMaker, UNKNOWN_IMAGE_URL, formatNumber } from "@/utils/utils";
import toast from "react-hot-toast";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { format, formatDistance } from "date-fns";
import { Tooltip } from "@mui/material";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export const OpenOrdersBox = ({currentMarket, openOrders, updateMarket, unsettledBalances, loadUnsettledBalances, settleFunds, cancelOrder, cancelAllOrders}) => {
  const state = useSelector((state) => state.storage);

  const {connection} = useConnection();
  const [formattedOpenOrders, setFormattedOpenOrders] = useState(null);
  const [page, setPage] = useState(0);
  const wallet = useWallet();
  const [unsettled, setUnsettled] = useState(null);
  const [tradeHistory, setTradeHistory] = useState(null);
  const {width} = useWindowDimensions() || 1000;
  const [showAll, setShowAll] = useState(false); // only show current market orders
  
  useEffect(() => {
    if(openOrders) {
      let bidsAndAsks = [];
      Object.keys(openOrders).map((market, i) => {
        let openOrder = openOrders[market];
        let baseToken, quoteToken;
        baseToken = state.tokenList.find(t => t.address === openOrder.baseMint);
        quoteToken = state.tokenList.find(t => t.address === openOrder.quoteMint);
        if(!baseToken) baseToken = {
          logoURI: UNKNOWN_IMAGE_URL,
          symbol: openOrder.baseMint.slice(0,4),
          address: openOrder.baseMint,
          name: openOrder.baseMint.slice(0,4)
        }
        if(!quoteToken) quoteToken = {
          logoURI: UNKNOWN_IMAGE_URL,
          symbol: openOrder.quoteMint.slice(0,4),
          address: openOrder.quoteMint,
          name: openOrder.quoteMint.slice(0,4)
        }
        openOrder.bids.map(bid => {
          bidsAndAsks.push({
            market: market,
            price: bid.price,
            size: bid.size,
            side: 'buy',
            baseToken: baseToken,
            quoteToken: quoteToken,
            openOrdersAddress: openOrder.openOrdersAddress,
            clientOrderId: bid.clientOrderId
          })
        })
        openOrder.asks.map(ask => {
          bidsAndAsks.push({
            market: market,
            price: ask.price,
            size: ask.size,
            side: 'sell',
            baseToken: baseToken,
            quoteToken: quoteToken,
            openOrdersAddress: openOrder.openOrdersAddress,
            clientOrderId: ask.clientOrderId
          })
        })
        // TODO: add functionality to only show market specific orders instead of all
      })
      bidsAndAsks.sort((a,b) => a.price > b.price ? -1 : 1);
      // console.log("for", bidsAndAsks)
      setFormattedOpenOrders(bidsAndAsks);
    }
  }, [openOrders, state.tokenList]);

  useEffect(() => { // V1 unsettled balances doens't have baseMint, quoteMint
    if(unsettledBalances) {
      let _unsettled = [];
      console.log("[unsettled]", unsettledBalances)
      unsettledBalances.map((item, i) => {
        if(!item.baseMint) item.baseMint = "";
        if(!item.quoteMint) item.quoteMint = "";
        let baseToken, quoteToken;
        baseToken = state.tokenList.find(t => t.address === item.baseMint);
        quoteToken = state.tokenList.find(t => t.address === item.quoteMint);
        if(!baseToken) baseToken = {
          logoURI: UNKNOWN_IMAGE_URL,
          symbol: item.baseMint.slice(0,4),
          address: item.baseMint,
          name: item.baseMint.slice(0,4)
        }
        if(!quoteToken) quoteToken = {
          logoURI: UNKNOWN_IMAGE_URL,
          symbol: item.quoteMint.slice(0,4),
          address: item.quoteMint,
          name: item.quoteMint.slice(0,4)
        }
        _unsettled.push({
          ...item,
          baseToken: baseToken,
          quoteToken: quoteToken
        })
      })
      setUnsettled(_unsettled);
    }
  }, [unsettledBalances])


  useEffect(() => {
    if(page === 2) {
      loadUnsettledBalances();
    }
  }, [page])

  useEffect(() => { // user trading history
    if(page === 1 && currentMarket && wallet.connected) {
      fetch("https://prod.arcana.markets/api/openbookv2/markets/"+currentMarket.address+"/trades").then(res => res.json())
      .then(res => {
        if(res.trades) {
          let recentTrades = res.trades;
          let userTrades = [];
          console.log("[trades]", recentTrades);
          recentTrades.map((trade, i) => {
            if(trade.makerOwner === wallet.publicKey.toBase58() || trade.takerOwner === wallet.publicKey.toBase58()) {
              let baseToken = state.tokenList.find(t => t.address === currentMarket.baseMint.toBase58());
              let quoteToken = state.tokenList.find(t => t.address === currentMarket.quoteMint.toBase58());

              let obj = {
                ...trade,
                baseToken: baseToken,
                quoteToken: quoteToken,
              };
              console.log("[trade]", obj)
              if(trade.makerOwner === wallet.publicKey.toBase58()) { // if user is maker, takerSide=1 means taker sold so maker bought. if not, vise versa
                if(trade.takerSide === 1) {
                  obj.side = "buy";
                } else {
                  obj.side = "sell";
                }
              } else {
                if(trade.takerSide === 1) {
                  obj.side = "sell";
                } else {
                  obj.side = "buy";
                }
              }
              userTrades.push(obj);
            }
          })
          console.log("[userTrades]", userTrades);
          setTradeHistory(userTrades);
        }
      })
    }
  }, [page, wallet.connected]);

  
  // don't display if market doesn't exist
  if(currentMarket && currentMarket.empty)
    return <></>

  return <div className={'w-full flex flex-col mb-16 md:mb-0'}>
      <div className="w-full rounded-md flex items-center gap-1">
        <p className={`text-sm font-bold cursor-pointer flex items-center gap-1 rounded-sm rounded-b-none p-2 justify-center ${page === 0 ? ' text-white border border-b-0' : 'text-muted-foreground border border-b-0 border-transparent'}`} onClick={() => setPage(0)}>
          Open Orders
        </p>
        <p className={`text-sm font-bold cursor-pointer flex items-center gap-1 rounded-sm rounded-b-none p-2 justify-center ${page === 1 ? ' text-white border border-b-0' : 'text-muted-foreground border border-b-0 border-transparent'}`} onClick={() => setPage(1)}>
          Order History
        </p>
        <p className={`text-sm font-bold cursor-pointer flex items-center gap-1 rounded-sm rounded-b-none p-2 justify-center ${page === 2 ? ' text-white border border-b-0' : 'text-muted-foreground border border-b-0 border-transparent'}`} onClick={() => setPage(2)}>
          Settle Balances
        </p>
      </div>
    {
      page === 0 &&
      <div className="w-full border rounded-md rounded-tl-none overflow-x-scroll">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="flex flex-shrink-0 items-center gap-2 min-w-[130px]">
                <p className="text-xs">Market</p>
                <Badge variant={"outline"} className="rounded cursor-pointer">See All</Badge>
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs">Side</TableHead>
              <TableHead className="whitespace-nowrap text-xs">Size</TableHead>
              <TableHead className="whitespace-nowrap text-xs">Price</TableHead>
              <TableHead className="whitespace-nowrap text-xs">Amount</TableHead>
              <TableHead className="flex items-center justify-end gap-2 text-right whitespace-nowrap text-xs">
                <Badge variant="outline" className="rounded text-xs cursor-pointer" onClick={() => cancelAllOrders()}>Cancel All</Badge>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              formattedOpenOrders && 
              formattedOpenOrders.map((openOrder, i) => (
              // openOrder.market === currentMarket.address.toBase58() &&
              <TableRow key={openOrder.clientOrderId}>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-1 whitespace-nowrap min-w-[130px]">
                    <img className="borderCircle" src={openOrder.baseToken.logoURI} alt={openOrder.baseToken.symbol} width={24} height={24}/>
                    <img className={`hidden md:block borderCircle ${styles.last}`} src={openOrder.quoteToken.logoURI} alt={openOrder.quoteToken.symbol} width={24} height={24}/>
                    <div className={'flex flex-col md:flex-row md:items-center md:gap-2'}>
                      <p className={'text-sm font-bold cursor-pointer'} onClick={() => updateMarket(openOrder.market)}>{openOrder.baseToken.symbol}-{openOrder.quoteToken.symbol}</p>
                      <Badge variant={"outline"} className="text-xs rounded flex items-center gap-1">
                        <a target="_blank" href={"https://solscan.io/account/"+openOrder.market}>
                          <p>{openOrder.market.slice(0,3)+"..."+openOrder.market.slice(-3)}</p>
                        </a>
                        <ArrowTopRightIcon width={10} height={10}/>
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap min-w-[60px]">
                  <p className={`text-xs ${openOrder.side === "buy" ? 'text-green-500' : 'text-red-500'}`}>{openOrder.side.toUpperCase()}</p>
                </TableCell>       

                <TableCell className="whitespace-nowrap">
                  <p className='text-sm'>{formatNumber(openOrder.size,"auto")} {openOrder.baseToken.symbol}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <p className={'text-sm'}>{formatNumber(openOrder.price,"auto")} {openOrder.quoteToken.symbol}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <p className={`text-muted-foreground`}>{formatNumber(openOrder.size * openOrder.price, "auto")} {openOrder.quoteToken.symbol}</p>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {
                    currentMarket.address.toBase58() === openOrder.market ?
                      <Button variant={"secondary"} className="text-xs" onClick={() => cancelOrder(openOrder)}>Cancel</Button>
                    :
                      <Button onClick={() => updateMarket(openOrder.market)} variant={"outline"}>Go to Market</Button>
                  }
                </TableCell>
              </TableRow>
              ))
            }
          </TableBody>
        </Table>
        {
          formattedOpenOrders && formattedOpenOrders.length === 0 &&
          <div className="w-full h-[52.5px] flex items-center justify-center">
            <p className="text-muted-foreground">Your open orders will show up here</p>
          </div>
        }
      </div>
    }

    { // user trading history
      page === 1 &&
      <div className="border rounded-md rounded-tl-none overflow-x-scroll">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap text-xs">Time</TableHead>
              <TableHead className="whitespace-nowrap text-xs">Side</TableHead>
              <TableHead className="whitespace-nowrap text-xs">Size</TableHead>
              <TableHead className="whitespace-nowrap text-xs">At Price</TableHead>
              <TableHead className="text-right whitespace-nowrap text-xs">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              (tradeHistory && tradeHistory.length > 0) &&
              tradeHistory.map((trade, i) => {
                return <TableRow key={trade.timeStamp} className="h-[53px]">
                  <TableCell className="whitespace-nowrap">
                    <Tooltip title={format(Number(trade.timeStamp)," hh:m dd-MM-yyyy")}><p className="text-muted-foreground">{ formatDistance(Number(trade.timeStamp),new Date().getTime(), { addSuffix: "true"}) }</p></Tooltip>
                  </TableCell>
                  <TableCell className={`text-xs whitespace-nowrap ${trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.side.toUpperCase()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {trade.quantityDouble} {trade.baseToken.symbol}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {trade.priceDouble} {trade.quoteToken.symbol}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatNumber(trade.priceDouble * trade.quantityDouble, "2")} {trade.quoteToken.symbol}
                  </TableCell>
                </TableRow>
              })
            }
          </TableBody>
        </Table>
        {
          (!tradeHistory || tradeHistory.length === 0) &&
          <div className="w-full h-[53.5px] flex items-center justify-center">
            <p className="text-muted-foreground">Your trade history will show up here</p>
          </div>
        }
      </div>
    }

    {
      page === 2 &&
      <div className="border rounded-md rounded-tl-none overflow-x-scroll">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap text-xs">Market</TableHead>
              <TableHead className="whitespace-nowrap text-xs">Claimable Base</TableHead>
              <TableHead className="whitespace-nowrap text-xs">Claimable Quote</TableHead>
              <TableHead className="text-right whitespace-nowrap text-xs">Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              (unsettled && unsettled.length > 0) &&
              unsettled.map((item, i) => {
                return <TableRow key={item.market} className="h-[53px]">
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1 whitespace-nowrap min-w-[130px]">
                      <img className="borderCircle" src={item.baseToken.logoURI} alt={item.baseToken.symbol} width={24} height={24}/>
                      <img className={`hidden md:block borderCircle ${styles.last}`} src={item.quoteToken.logoURI} alt={item.quoteToken.symbol} width={24} height={24}/>
                      <div className={'flex flex-col md:flex-row md:items-center md:gap-2'}>
                        <p className={'text-sm cursor-pointer'} onClick={() => updateMarket(item.market)}>{item.baseToken.symbol}-{item.quoteToken.symbol}</p>
                        <Badge variant={"outline"} className="text-xs rounded flex items-center gap-1">
                          <a target="_blank" href={"https://solscan.io/account/"+item.market}>
                            <p>{item.market.slice(0,3)+"..."+item.market.slice(-3)}</p>
                          </a>
                          <ArrowTopRightIcon width={10} height={10}/>
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={`text-xs whitespace-nowrap ${item.base > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {formatNumber(item.base / 10**item.baseToken.decimals, "auto")} { item.baseToken.symbol }
                  </TableCell>
                  <TableCell className={`text-xs whitespace-nowrap ${item.quote > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {formatNumber(item.quote / 10**item.quoteToken.decimals, "auto")} { item.quoteToken.symbol }
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant={"secondary"} className="text-xs" onClick={() => settleFunds(item.market, item.openOrdersAddress)}>Claim</Button>
                  </TableCell>
                </TableRow>
              })
            }
          </TableBody>
        </Table>
        {
          (!unsettled || unsettled.length === 0) &&
          <div className="w-full h-[53.5px] flex items-center justify-center">
            <p className="text-muted-foreground">Your unsettled balances (on executed orders) will show up here, where you can claim them.</p>
          </div>
        }
      </div>
    }
  </div>
}