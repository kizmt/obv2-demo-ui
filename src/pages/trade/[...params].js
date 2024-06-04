import { useRouter } from "next/router";
import {Header} from "@/components/Header";
import styles from "./trade.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Orderbox } from "@/components/Orderbox";
import { Chart } from "@/components/Chart";
import { UseMarket } from "@/utils/useMarket";
import useWindowDimensions, { SOL_TOKEN, USDC_TOKEN } from "@/utils/utils";
import { Orderbook } from "@/components/Orderbook";
import { Selector } from "@/components/Selector";
import { ArrowRightIcon, ChevronDownIcon, ChevronRightIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Watchlist } from "@/components/Watchlist";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import CandlesIcon from "/public/assets/icons/candles.svg";
import KingIcon from "/public/assets/icons/king.svg";
import PacmanIcon from "/public/assets/icons/pacman.svg";
import StackIcon from "/public/assets/icons/stack.svg";
import WickIcon from "/public/assets/icons/wick.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

//----Mobile
import * as React from "react" 
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/Footer";
import Head from "next/head";

//

const defaultPair = {
  base: SOL_TOKEN,
  quote: USDC_TOKEN,
  market: "CFSMrBssNG8Ud1edW59jNLnq2cwrQ9uY5cM3wXmqRJj3"
}

export const v2m = "CFSMrBssNG8Ud1edW59jNLnq2cwrQ9uY5cM3wXmqRJj3";


export async function getServerSideProps(context) {
  // Extract params from the URL
  const { params } = context.query;

  // Define the thumbnail URL based on the params
  const thumbnail = params ? `https://prism-og.vercel.app/api/trade?address=${params[1]}` : null;

  // Pass the thumbnail URL as a prop to the page component
  return { props: { thumbnail } };
}

const TradePage = ({thumbnail}) => {
  const router = useRouter();


  const params = router.query.params;
  if(params.length < 2) return;

  const clobVersion = params[0];
  const marketAddress = params[1];
  const state = useSelector((state) => state.storage);
  const dispatch = useDispatch();
  const { connection } = useConnection();
  const {width} = useWindowDimensions() || 1000;
  const [isDesktop, setIsDesktop] = useState(false);
  const { 
    currentMarket,
    orderbook,
    openOrders,
    unsettledBalances,
    loadUnsettledBalances,
    settleFunds,
    cancelOrder,
    cancelAllOrders,
    updateMarket,
    updateMarketWithTokens,
    placeOrder,
    swap
  } = UseMarket();

  // ui
  const [orderbookType, setOrderbookType] = useState(0);
  const [whitelistedMarket, setWhitelistedMarket] = useState(true);
  const [hasOrdersInOrderbook, setHasOrdersInOrderbook] = useState(true);
  const [mobileViewType, setMobileViewType] = useState(0);

  // orderbook override price & size (for sweep)
  const [overridePrice, setOverridePrice] = useState(null);
  const [overrideSize, setOverrideSize] = useState(null);
  const [strategyPreview, setStrategyPreview] = useState(null);

  // orderbox override (limit/strategy)
  const [strategyOverride, setStrategyOverride] = useState(0);

  useEffect(() => { // set layout type (desktop/mobile)
    if(width > 768 && !isDesktop) {
      setIsDesktop(true);
    } else if(width <= 768 && isDesktop) {
      setIsDesktop(true);
    }
  }, [width, isDesktop]);

  useEffect(() => { // Initial Load market. default or by link
    if(state.tokenList) {
      if(marketAddress && clobVersion) {
        updateMarket(marketAddress).then(res => {
          console.log("[market]", res);
        });
      } else {
        updateMarket(state.dex === "v1" ? v1m : v2m).then(res => {
          console.log("[market]", res);
        })
      }
      console.log('path', clobVersion, marketAddress)
    }
    
  }, [state.tokenList, clobVersion, marketAddress]);

  useEffect(() => { // Check if market is in official list
    if(currentMarket && state.marketsV1 && state.marketsV2) {
      if(state.dex === "v1") {
        if(state.marketsV1.find(m => m.address === currentMarket.address.toBase58())) {
          setWhitelistedMarket(true);
        } else {
          setWhitelistedMarket(false);
        }
      } else if(state.dex === "v2") {
        if(state.marketsV2.find(m => m.address === currentMarket.address.toBase58())) {
          setWhitelistedMarket(true);
        } else {
          setWhitelistedMarket(false);
        }
      }
    }
  }, [currentMarket, state.marketsV1, state.marketsV2]);

  useEffect(() => { // Check if orderbook is empty
    if(orderbook) {
      if(orderbook.bids.length > 0 || orderbook.asks.length > 0) {
        if(!hasOrdersInOrderbook) {
          setHasOrdersInOrderbook(true);
          // setOrderbookType(0);
        }
      } else {
        if(hasOrdersInOrderbook) {
          setHasOrdersInOrderbook(false);
          // setOrderbookType(1);
        }
      }
    }
  }, [orderbook])
  

  return <div className="flex flex-col w-full items-center relative">
    <Head>
      <title>
        {
          currentMarket ?
          `${currentMarket.baseToken.symbol + '-' + currentMarket.quoteToken.symbol} | PRISM`
          :
          'Trade | Openbook'
        }
      </title>
      <meta property="og:title" content={"Trade | Prism"} />
      <meta property="og:description" content={`Prism is pioneering decentralized trading on Solana using orderbooks & innovative trading tools like DCA, Strategy Trading & More.`} />
      <meta property="og:image" content={thumbnail ? thumbnail : "https://i.imgur.com/aevnDp8.png"} />
      <meta name="twitter:image" content={thumbnail ? thumbnail : "https://i.imgur.com/aevnDp8.png"} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
    {/* <div className="flex w-full justify-center items-center p-2 bg-cyan-800 botder border-b border-b-cyan-500">
      <p className="w-full text-center text-xs text-white">Openbook V2 is a new program and hasn't been stress-tested. The program is audited, but there might still be bugs/vulnerabilities. Use with caution</p>
    </div> */}
    <Header path={"/trade"}/>
    <div className={`${styles.tradePage} mt-2`}>
      

      {/* <div className="flex items-center gap-2 w-full">
        <div className="flex items-center w-full justify-center gap-4 px-1">
          <div className="flex flex-col gap-1 w-full">
            <p className="text-sm font-bold text-center">New Chapter: Prism v4</p>
            <p className="text-xs text-muted-foreground text-center">Learn more about what's new on Prism and it's products</p>
          </div>
        </div>
      </div> */}
      {
        !whitelistedMarket && !currentMarket?.empty &&
        <Alert variant={"default"}>
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle className="font-bold warning-foreground">Unofficial Market</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            This market is not in the verified markets list
          </AlertDescription>
        </Alert>
      }
      {
        isDesktop ? // Desktop Layout
        <div className={`${styles.section}`}>
          <div className={styles.side}>
            <Chart 
              market={currentMarket}
              updateMarket={updateMarket}
              openOrders={openOrders}
              suppressHydrationWarning
              className="flex"
              strategyPreview={strategyPreview}
            />
          </div>
          <div className={styles.side}>
            <div className={`${styles.orderbookAndBox} border bg-card overflow-hidden`}>
              <DropdownMenu className="w-full">
                <DropdownMenuTrigger className="outline-none select-none">
                <div className="flex flex-col w-full relative -mt-2">
                  {
                    strategyOverride === 0 ?
                    <div className="w-full h-[68px] cursor-pointer hover:bg-background-over transition-all px-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-12 z-10 h-12 backdrop-blur bg-white/5 rounded-sm flex items-center justify-center">
                          <CandlesIcon className="h-6 w-6"/>
                        </div>
                        <div className="flex z-10 flex-col items-start">
                          <p className="text-lg font-bold">Limit Order</p>
                          <p className="text-xs text-muted-foreground">Place a limit buy/sell order in the orderbook</p>
                        </div>
                      </div>
                      <div className='hero'/>
                      <ChevronDownIcon className="h-5 w-5 z-10"/>
                    </div>
                    :
                    strategyOverride === 1 &&
                    <div className="w-full h-[68px] cursor-pointer hover:bg-background-over transition-all px-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-12 z-10 h-12 backdrop-blur bg-white/5 rounded-sm flex items-center justify-center">
                          <StackIcon className="h-6 w-6"/>
                        </div>
                        <div className="flex z-10 items-start flex-col">
                          <p className="text-lg font-bold">Stack Order</p>
                          <p className="text-xs text-muted-foreground">Place multiple orders instantly with a strategy</p>
                        </div>
                      </div>
                      <div className='hero'/>
                      <ChevronDownIcon className="h-5 w-5 z-10"/>

                    </div>
                  }
                  <div className="w-full border-t"/>
                </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-96">
                  <DropdownMenuItem onClick={() => setStrategyOverride(0)} className="w-full cursor-pointer rounded flex items-center gap-2">
                    <div className="w-12 h-12 bg-background-over rounded-sm flex items-center justify-center">
                      <CandlesIcon className={`h-6 w-6 ${strategyOverride === 0 ? 'text-secondary' : ''}`}/>
                    </div>
                    <div className="flex flex-col">
                      <p className={`text-lg font-bold ${strategyOverride === 0 ? 'text-secondary' : ''}`}>Limit Order</p>
                      <p className="text-xs text-muted-foreground">Place a limit buy/sell order in the orderbook</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className={styles.orderbookOuterWrapper}>
                {
                  orderbook && orderbook.bids.length > 0 && orderbook.asks.length > 0 ?
                  <Orderbook
                    orderbookType={orderbookType}
                    orderbook={orderbook}
                    market={currentMarket}
                    setOverridePrice={setOverridePrice}
                    setOverrideSize={setOverrideSize}
                  />
                  :
                  ""
                }
                
              </div>
              <div className="w-full border-t"/>
              <Orderbox 
                market={currentMarket}
                orderbook={orderbook} 
                placeOrder={placeOrder}
                updateMarket={null}
                updateMarketWithTokens={updateMarketWithTokens}
                hasOrdersInOrderbook={hasOrdersInOrderbook}
                isDesktop={isDesktop}
                swap={swap}
                overridePrice={overridePrice}
                overrideSize={overrideSize}
                setStrategyPreview={setStrategyPreview}
                strategy={strategyOverride}
              />
            </div>
          </div>
        </div>
        : // Mobile Layout
        <div className={styles.section}>
          <div className={styles.side}>
            <div className={'flex flex-col gap-1 border rounded-2xl'}>
              <Watchlist market={currentMarket} updateMarket={(p) => updateMarket(p)}/>
              <Selector parentStyle={{borderLeft:"none", borderRight:"none", borderRadius:0}} type={0} items={["Chart", "Orderbook"]} selected={mobileViewType} onClick={(i) => setMobileViewType(i)}/>

              <Chart
                market={currentMarket}
                updateMarket={updateMarket}
                openOrders={openOrders}
                showWatchlist={false}
                className={mobileViewType === 0 ? "flex" : "hidden"}
                strategyPreview={strategyPreview}
              />
              <div className={`flex flex-col overflow-hidden ${mobileViewType === 1 ? "flex" : "hidden"}`}>
                <Orderbook
                  orderbookType={orderbookType}
                  orderbook={orderbook}
                  market={currentMarket}
                />
              </div>
              <Drawer>
                <DrawerTrigger asChild>
                  <div 
                    className="w-full p-4 flex items-center bg-black justify-center rounded-2xl font-bold text-lg"
                  >Place Order</div>
                </DrawerTrigger>
                <DrawerContent className="outline-none">
                  <div className="mx-auto w-full max-w-sm pb-6">
                    <div className="p-4 pb-0 flex flex-col gap-2 pb-3">
                    <Orderbox 
                      market={currentMarket}
                      orderbook={orderbook} 
                      placeOrder={placeOrder}
                      updateMarket={null}
                      hasOrdersInOrderbook={hasOrdersInOrderbook}
                      swap={swap}
                      setStrategyPreview={setStrategyPreview}
                    />
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
          <div className={styles.side}>
          </div>
        </div>
      }
    </div>
    <Footer/>
  </div>
}

export default TradePage;