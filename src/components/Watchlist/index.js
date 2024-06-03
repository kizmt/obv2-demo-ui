import { ArrowBottomRightIcon, ArrowTopRightIcon, ChevronDownIcon, DashboardIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, RowsIcon } from "@radix-ui/react-icons";
import styles from "./Watchlist.module.scss"
import { useSelector } from "react-redux";
import useWindowDimensions, { GET_TOKEN_INFO, USDC_TOKEN, formatNumber } from "@/utils/utils";
import { useEffect, useState } from "react";
import { MarketSelector } from "@/components/MarketSelector";
import { TokenIcon } from "@/components/TokenIcon";
import {UNKNOWN_IMAGE_URL} from "@/utils/utils";
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "../ui/skeleton";

// -- mobile
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
import { Button } from "../ui/button";
import Link from "next/link";
// --
export const Watchlist = ({market, updateMarket}) => {
  const state = useSelector((state) => state.storage);
  const {width} = useWindowDimensions() || 1000;
  const [dropdown, setDropdown] = useState(false);
  const [baseToken, setBaseToken] = useState(null);
  const [quoteToken, setQuoteToken] = useState(null);
  const [marketInfo, setMarketInfo] = useState(null);

  useEffect(() => {
    if(market && state.tokenList) {
      let baseToken = state.tokenList.find(t => t.address === market.baseMint.toBase58());
      let quoteToken = state.tokenList.find(t => t.address === market.quoteMint.toBase58());

      if(baseToken) {
        GET_TOKEN_INFO(baseToken.address).then(tokenInfo => {
          if(tokenInfo.success) setMarketInfo(tokenInfo.data);
        })
      }
      if(!baseToken) baseToken = { symbol: market.baseMint.toBase58().slice(0,4), logoURI: UNKNOWN_IMAGE_URL, address: market.baseMint.toBase58() };
      if(!quoteToken) quoteToken = { symbol: market.quoteMint.toBase58().slice(0,4), logoURI: UNKNOWN_IMAGE_URL, address: market.quoteMint.toBase58() };
      
      setBaseToken(baseToken);
      setQuoteToken(quoteToken);
    }
  }, [state.tokenList, market]) 

  if(!baseToken || !quoteToken || !marketInfo) {// skeleton
    return <div className={`${styles.watchlist} border-b`}>
      <div className={`${styles.item} ${styles.currentMarket}`}>
        <div className={styles.icons}>
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div>
          <div className={styles.marketInfo}>
            <Skeleton className="h-4 w-[72px]" />
            <Skeleton className="h-4 w-[64px]" />
          </div>
        </div>
        <ChevronDownIcon/>
      </div>
      <div className={styles.marketInformation}>
        <div className={styles.priceInfo}>
          <div className={`${styles.change}`}>
            <Skeleton className="h-4 w-[24px]" />
            <div className={`${styles.value}`}>
              <Skeleton className="h-4 w-[54px]" />
            </div>
          </div>
          <div className={`${styles.change}`}>
            <Skeleton className="h-4 w-[24px]" />
            <div className={`${styles.value}`}>
              <Skeleton className="h-4 w-[54px]" />
            </div>
          </div>
          <div className={`${styles.change}`}>
            <Skeleton className="h-4 w-[24px]" />
            <div className={`${styles.value}`}>
              <Skeleton className="h-4 w-[54px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  }

  if(width <= 768) {
    return <div className="flex flex-col items-center w-full">
      <div className={`w-full flex items-center justify-between h-[69px] p-2 md:border-b`}>
        { baseToken && quoteToken &&
          <div className={`flex items-center p-1 gap-2 rounded-t-lg cursor-pointer hover:bg-background-over`} onClick={() => setDropdown(true)}>
            <div className={'flex items-center'}>
              <img className={'rounded-full'} width={24} height={24} src={baseToken.logoURI} alt={baseToken.symbol}/>
              <img className={'rounded-full hidden md:block'} src={quoteToken.logoURI} width={24} height={24} alt={quoteToken.symbol}/>
            </div>
            <div>
              <div className={'flex flex-col gap-0'}>
                <p className={'text-sm font-bold text-foreground'}>
                  { baseToken && quoteToken &&
                    baseToken.symbol + "-" + quoteToken.symbol
                  }
                </p>
                {
                  market?.empty ?
                  <Badge variant={"outline"} className="flex items-center gap-1">
                    <ExclamationTriangleIcon width={10} height={10}/>
                    <p className="text-xs text-muted-foreground">No market</p>
                  </Badge>
                  :
                  <Link href={"https://solscan.io/account/" + market.address.toBase58()} target="_blank" rel="noopener noreferrer">
                    <Badge variant={"outline"} className="text-xs rounded">
                      <p>{market.address.toBase58().slice(0,3) + "..." + market.address.toBase58().slice(-3)}</p>
                    </Badge>
                  </Link>
                }
              </div>
            </div>
            <ChevronDownIcon/>
          </div>
        }
        {
          marketInfo &&
          <div className={'flex items-center'}>
            <div className={'flex items-center gap-4 pr-2'}>
              {
                marketInfo.v24hUSD &&
                <div className={`flex flex-col gap-1 items-end md:items-center`}>
                  <p className={'text-xs text-muted-foreground'}>Volume</p>
                  <div className={'flex justify-end'}>
                    <p className="text-sm font-bold">${formatNumber(marketInfo.v24hUSD, "auto")}</p>
                  </div>
                </div>
              }
              <Drawer>
                <DrawerTrigger asChild>
                  <RowsIcon color="hsl(var(--muted-foreground))"/>
                </DrawerTrigger>
                <DrawerContent className="outline-none">
                  <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                      <DrawerTitle>Market Information</DrawerTitle>
                      <DrawerDescription>{marketInfo.name}</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 pb-0 flex flex-col gap-2">
                      {
                        marketInfo.priceChange30mPercent &&
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">30m change</p>
                          <div className={`flex items-center gap-1`}>
                            {
                              marketInfo.priceChange30mPercent > 0 ?
                              <ArrowTopRightIcon color="var(--green700)" width={12} height={12}/>
                              :
                              <ArrowBottomRightIcon color="var(--red700)" width={12} height={12}/>
                            }
                            <p className={`text-sm font-bold`}
                              style={{color: marketInfo.priceChange30mPercent > 0 ? "var(--green700)" : "var(--red700)"}}>
                              {formatNumber(Math.abs(marketInfo.priceChange30mPercent), 2)}%
                            </p>
                          </div>
                        </div>
                      }
                      {
                        marketInfo.priceChange1hPercent &&
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">1h change</p>
                          <div className={`flex items-center gap-1`}>
                            {
                              marketInfo.priceChange1hPercent > 0 ?
                              <ArrowTopRightIcon color="var(--green700)" width={12} height={12}/>
                              :
                              <ArrowBottomRightIcon color="var(--red700)" width={12} height={12}/>
                            }
                            <p className={`text-sm font-bold`}
                              style={{color: marketInfo.priceChange1hPercent > 0 ? "var(--green700)" : "var(--red700)"}}>
                              {formatNumber(Math.abs(marketInfo.priceChange1hPercent), 2)}%
                            </p>
                          </div>
                        </div>
                      }
                      {
                        marketInfo.priceChange4hPercent &&
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">4h change</p>
                          <div className={`flex items-center gap-1`}>
                            {
                              marketInfo.priceChange4hPercent > 0 ?
                              <ArrowTopRightIcon color="var(--green700)" width={12} height={12}/>
                              :
                              <ArrowBottomRightIcon color="var(--red700)" width={12} height={12}/>
                            }
                            <p className={`text-sm font-bold`}
                              style={{color: marketInfo.priceChange4hPercent > 0 ? "var(--green700)" : "var(--red700)"}}>
                              {formatNumber(Math.abs(marketInfo.priceChange4hPercent), 2)}%
                            </p>
                          </div>
                        </div>
                      }
                      {
                        marketInfo.priceChange24hPercent &&
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">24h change</p>
                          <div className={`flex items-center gap-1`}>
                            {
                              marketInfo.priceChange24hPercent > 0 ?
                              <ArrowTopRightIcon color="var(--green700)" width={12} height={12}/>
                              :
                              <ArrowBottomRightIcon color="var(--red700)" width={12} height={12}/>
                            }
                            <p className={`text-sm font-bold`}
                              style={{color: marketInfo.priceChange24hPercent > 0 ? "var(--green700)" : "var(--red700)"}}>
                              {formatNumber(Math.abs(marketInfo.priceChange24hPercent), 2)}%
                            </p>
                          </div>
                        </div>
                      }
                      {
                        marketInfo.v24hUSD &&
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">24h volume</p>
                          <div className={`flex items-center gap-1`}>
                            <p className={`text-sm font-bold text-foreground`}>
                              ${formatNumber(marketInfo.v24hUSD, "auto")}
                            </p>
                          </div>
                        </div>
                      }
                      {
                        marketInfo.mc &&
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">Fully diluted market cap</p>
                          <div className={`flex items-center gap-1`}>
                            <p className={`text-sm font-bold text-foreground`}>
                              ${formatNumber(marketInfo.mc, "auto")}
                            </p>
                          </div>
                        </div>
                      }
                    </div>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        }
        {
          dropdown &&
          <MarketSelector open={dropdown} closePopup={() => setDropdown(false)} onSelect={(address) => { 
            updateMarket(address)
            setDropdown(false);
          }
        }/>
        }
        
      </div>
      <div className="w-full flex gap-6 p-2 items-center overflow-x-scroll border-t">
        {
          <div className={`flex items-center gap-2 whitespace-nowrap`}>
            <p className={'text-sm text-muted-foreground'}>24h</p>
            <div className={`flex items-center gap-1 text-sm font-bold ${marketInfo.priceChange24hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {
                marketInfo.priceChange24hPercent > 0 ?
                <ArrowTopRightIcon width={12} height={12}/>
                :
                <ArrowBottomRightIcon width={12} height={12}/>
              }
              <p>{formatNumber(Math.abs(marketInfo.priceChange24hPercent), 2)}%</p>
            </div>
          </div>
        }
        {
            marketInfo.priceChange1hPercent &&
            <div className={`flex items-center gap-2 whitespace-nowrap`}>
              <p className={'text-sm text-muted-foreground'}>1h</p>
              <div className={`flex items-center gap-1 text-sm font-bold ${marketInfo.priceChange1hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {
                  marketInfo.priceChange1hPercent > 0 ?
                  <ArrowTopRightIcon width={12} height={12}/>
                  :
                  <ArrowBottomRightIcon width={12} height={12}/>
                }
                <p>{formatNumber(Math.abs(marketInfo.priceChange1hPercent), 2)}%</p>
              </div>
            </div>
          }
          {
            marketInfo.priceChange4hPercent &&
            <div className={`flex items-center gap-2 whitespace-nowrap`}>
              <p className={'text-sm text-muted-foreground'}>4h</p>
              <div className={`flex items-center gap-1 text-sm font-bold ${marketInfo.priceChange4hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {
                  marketInfo.priceChange4hPercent > 0 ?
                  <ArrowTopRightIcon width={12} height={12}/>
                  :
                  <ArrowBottomRightIcon width={12} height={12}/>
                }
                <p>{formatNumber(Math.abs(marketInfo.priceChange4hPercent), 2)}%</p>
              </div>
            </div>
          }
          {
            marketInfo.priceChange24hPercent &&
            <div className={`flex items-center gap-2 whitespace-nowrap`}>
              <p className={'text-sm text-muted-foreground'}>24h</p>
              <div className={`flex items-center gap-1 text-sm font-bold ${marketInfo.priceChange24hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {
                  marketInfo.priceChange24hPercent > 0 ?
                  <ArrowTopRightIcon width={12} height={12}/>
                  :
                  <ArrowBottomRightIcon width={12} height={12}/>
                }
                <p>{formatNumber(Math.abs(marketInfo.priceChange24hPercent), 2)}%</p>
              </div>
            </div>
          }
          {
            marketInfo.v24hUSD &&
            <div className={`flex items-center gap-2 whitespace-nowrap`}>
              <p className={'text-sm text-muted-foreground'}>Volume (24h)</p>
              <div className={'text-sm font-bold flex items-center'}>
                <p>${formatNumber(marketInfo.v24hUSD, "auto")}</p>
              </div>
            </div>
          }
          {
            marketInfo.mc &&
            <div className={`flex items-center gap-2 whitespace-nowrap`}>
              <p className={'text-sm text-muted-foreground'}>FDV</p>
              <div className={'text-sm font-bold flex items-center'}>
                <p>${formatNumber(marketInfo.mc, "auto")}</p>
              </div>
            </div>
          }
      </div>
    </div>
  }

  // desktop mode
  return <><div className={`flex items-center justify-between h-[69px] p-2 md:border-b`}>

    { baseToken && quoteToken &&
      <div className={`flex items-center p-1 gap-2 rounded-t-lg cursor-pointer hover:bg-background-over`} onClick={() => setDropdown(true)}>
        <div className={'flex items-center'}>
          <img className={'rounded-full'} width={24} height={24} src={baseToken.logoURI} alt={baseToken.symbol}/>
          <img className={'rounded-full hidden md:block'} src={quoteToken.logoURI} width={24} height={24} alt={quoteToken.symbol}/>
        </div>
        <div>
          <div className={'flex flex-col gap-0'}>
            <p className={'text-sm font-bold text-foreground'}>
              { baseToken && quoteToken &&
                baseToken.symbol + "-" + quoteToken.symbol
              }
            </p>
              {
                market?.empty ?
                <Badge variant={"outline"} className="flex items-center gap-1">
                  <ExclamationTriangleIcon width={10} height={10}/>
                  <p className="text-xs text-muted-foreground">No market</p>
                </Badge>
                :
                <Link className="z-100" href={"https://solscan.io/account/" + market.address.toBase58()} target="_blank" rel="noopener noreferrer">
                  <Badge variant={"outline"} className="text-xs rounded">
                    <p>{market.address.toBase58().slice(0,3) + "..." + market.address.toBase58().slice(-3)}</p>
                  </Badge>
                </Link>
                }
          </div>
        </div>
        <ChevronDownIcon/>
      </div>
    }
    {
      marketInfo &&
      <div className={'flex items-center'}>
        <div className={'flex items-center gap-6 pr-4'}>
          {
            marketInfo.priceChange30mPercent &&
            <div className={`flex-col items-center gap-1 hidden md:flex`}>
              <p className={'text-xs text-muted-foreground'}>30m</p>
              <div className={`flex items-center gap-1 text-sm font-bold ${marketInfo.priceChange30mPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {
                  marketInfo.priceChange30mPercent > 0 ?
                  <ArrowTopRightIcon width={12} height={12}/>
                  :
                  <ArrowBottomRightIcon width={12} height={12}/>
                }
                <p>{formatNumber(Math.abs(marketInfo.priceChange30mPercent), 2)}%</p>
              </div>
            </div>
          }
          {
            marketInfo.priceChange1hPercent &&
            <div className={`flex-col items-center gap-1 hidden md:flex`}>
              <p className={'text-xs text-muted-foreground'}>1h</p>
              <div className={`flex items-center gap-1 text-sm font-bold ${marketInfo.priceChange1hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {
                  marketInfo.priceChange1hPercent > 0 ?
                  <ArrowTopRightIcon width={12} height={12}/>
                  :
                  <ArrowBottomRightIcon width={12} height={12}/>
                }
                <p>{formatNumber(Math.abs(marketInfo.priceChange1hPercent), 2)}%</p>
              </div>
            </div>
          }
          {
            marketInfo.priceChange4hPercent &&
            <div className={`flex-col items-center gap-1 hidden md:flex`}>
              <p className={'text-xs text-muted-foreground'}>4h</p>
              <div className={`flex items-center gap-1 text-sm font-bold ${marketInfo.priceChange4hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {
                  marketInfo.priceChange4hPercent > 0 ?
                  <ArrowTopRightIcon width={12} height={12}/>
                  :
                  <ArrowBottomRightIcon width={12} height={12}/>
                }
                <p>{formatNumber(Math.abs(marketInfo.priceChange4hPercent), 2)}%</p>
              </div>
            </div>
          }
          {
            marketInfo.priceChange24hPercent &&
            <div className={`flex flex-col gap-1 items-end md:items-center`}>
              <p className={'text-xs text-muted-foreground'}>24h</p>
              <div className={`flex items-center gap-1 text-sm font-bold ${marketInfo.priceChange24hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {
                  marketInfo.priceChange24hPercent > 0 ?
                  <ArrowTopRightIcon width={12} height={12}/>
                  :
                  <ArrowBottomRightIcon width={12} height={12}/>
                }
                <p>{formatNumber(Math.abs(marketInfo.priceChange24hPercent), 2)}%</p>
              </div>
            </div>
          }
          {
            marketInfo.v24hUSD &&
            <div className={`flex flex-col items-center gap-1`}>
              <p className={'text-xs text-muted-foreground'}>Volume (24h)</p>
              <div className={'text-sm font-bold flex items-center'}>
                <p>${formatNumber(marketInfo.v24hUSD, "auto")}</p>
              </div>
            </div>
          }
          {
            marketInfo.mc &&
            <div className={`flex flex-col items-end gap-1`}>
              <p className={'text-xs text-muted-foreground'}>FDV</p>
              <div className={'text-sm font-bold flex items-center'}>
                <p>${formatNumber(marketInfo.mc, "auto")}</p>
              </div>
            </div>
          }
        </div>
      </div>
    }
    
  </div>
  {
      dropdown &&
      <MarketSelector open={dropdown} closePopup={() => setDropdown(false)} onSelect={(address) => { 
        updateMarket(address)
        setDropdown(false);
      }
      }/>
    }
  </>
}
