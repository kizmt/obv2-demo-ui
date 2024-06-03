import styles from "./MarketSelector.module.scss"
import { ArrowTopRightIcon, Cross1Icon, MagnifyingGlassIcon, PlusCircledIcon, RocketIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "../ui/button";
import Image from 'next/image';
import { Badge } from "../ui/badge";


export const MarketSelector = ({open, closePopup, onSelect}) => {

  const state = useSelector((state) => state.storage);
  const [markets, setMarkets] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [list, setList] = useState([]);

  useEffect(() => {

    if(state.dex === "v1") {
      if(state.marketsV1) {
        setMarkets(state.marketsV1);
      }
    } else if(state.dex === "v2") {
      if(state.marketsV2) {
        setMarkets(state.marketsV2);
      }
    }
  }, [state.marketsV1, state.marketsV2]);

  useEffect(() => {
    if(state.marketsV2) {
      if(searchValue.length > 2) { // only start filtering when 2+ characters are entered
        let arr = [];
        for(let i = 0; i < state.marketsV2.length; i++) {
          let market = state.marketsV2[i];
          if (market.name.toLowerCase().includes(searchValue.toLowerCase()) || 
              market.baseToken.name.toLowerCase().includes(searchValue.toLowerCase()) ||
              market.baseToken.symbol.toLowerCase().includes(searchValue.toLowerCase()) ||
              market.quoteToken.name.toLowerCase().includes(searchValue.toLowerCase()) ||
              market.quoteToken.symbol.toLowerCase().includes(searchValue.toLowerCase())
              ) {
            arr.push(market);
          }
        }
        let sorted = arr.filter(item => item.name.toLowerCase().includes(searchValue.toLowerCase())).sort((a, b) => {
          if(a.name.toLowerCase().indexOf(searchValue.toLowerCase()) > b.name.toLowerCase().indexOf(searchValue.toLowerCase())) {
            return 1;
          } else if (a.name.toLowerCase().indexOf(searchValue.toLowerCase()) < b.name.toLowerCase().indexOf(searchValue.toLowerCase())) {
            return -1;
          } else {
            if(a.name > b.name)
              return 1;
            else
              return -1;
          }
        });
        if(sorted.length > 0) {
          setList(sorted);
        } else {
          setList(arr);
        }
      } else if(searchValue === "") { // if search field is empty, render list
        setList(state.marketsV2);
      }
    }
  }, [state.marketsV2, searchValue]);
  
  return <Dialog 
  open={open}
  onOpenChange={() => closePopup()}   
  >
    <DialogTrigger></DialogTrigger>
    <DialogContent className="max-w-[360px] md:max-w-[420px]">
      <DialogHeader>
        <DialogTitle>Select a Market</DialogTitle>
        <DialogDescription>
          Select a Market to trade on
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="h-[48px]" type="search" placeholder="Search token name, symbol or address"/>
        <div className="flex items-center gap-2">
          <Link href={"/createMarket"} className="w-full">
            <Button className="w-full h-[42px]" variant={'outline'}>Create a Market</Button>
          </Link>
          
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">Market</p>
          {/* <p className="text-xs text-muted-foreground">Your Balance</p> */}
        </div>
        <div className={'flex flex-col items-center overflow-y-scroll max-h-[400px]'}>
        { list &&
          list.map((item,i) => {
            return <div className={'w-full flex items-center rounded justify-between hover:bg-background-over p-2 cursor-pointer'} key={i} onClick={() => onSelect(item.address)}>
              <div className={'flex items-center gap-2'}>
                <Image
                  src={item.baseToken.logoURI ? item.baseToken.logoURI : "https://i.imgur.com/WRxAdjU.png"}
                  alt={`${item.baseToken.symbol} icon`}
                  width={24} // Adjust based on your layout
                  height={24}
                  layout="fixed"
                  className="rounded-full"
                />
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">{item.baseToken.name} / {item.quoteToken.name}</p>
                  <p className="font-bold text-sm">{item.name}</p>
                </div>
              </div>
              <Badge variant={'outline'} className="rounded">{item.address.slice(0,3) + '...'+ item.address.slice(-3)}</Badge>
            </div>
          })
        }
      </div>
      </div>
    </DialogContent>
  </Dialog>

  return <Dialog
    classes={{ root: "popup_container", paper: styles.marketSelectorPopup }}
    aria-labelledby="simple-dialog-title"
    open={open}
    onClose={() => closePopup()}
  >
    <div className={styles.marketSelectorWrapper}>
      <div className={styles.tokenSearchPopupHeader}>
        <p className={styles.title}>Select a Market</p>
        <div className={styles.closeBtn} onClick={() => closePopup()}>
          <Cross1Icon/>
        </div>
      </div>
      <div className={styles.tokenSearchPopupContent}>
        <div className={styles.topContent}>
          <div className={styles.searchBar}>
            <MagnifyingGlassIcon/>
            <input type="text" placeholder="Search market" />
          </div>
          <div className={styles.marketShortcuts}>
            <Link href="/markets/create" className={styles.createMarketBtn}>
              <PlusCircledIcon className={styles.icon}/>
              <p>Create a Market</p>
            </Link>
            <Link href={"/markets/list"} className={styles.createMarketBtn}>
              <RocketIcon className={styles.icon}/>
              <p>List a Market</p>
            </Link>
          </div>
        </div>
        <div className={styles.list}>
          { markets &&
            markets.map((market, i) => {
              return <div className={styles.item} key={i} onClick={() => onSelect(market.address)}>
                <div className={styles.itemLeft}>
                  <div className={styles.icons}>
                    <img width="32px" height="32px" className={`${styles.icon} borderCircle`} src={market.baseToken.logoURI}/>
                    <img width="32px" height="32px" className={`${styles.icon} borderCircle`} src={market.quoteToken.logoURI}/>
                  </div>
                  <div className={styles.texts}>
                    <div className={styles.name}>{market.name || "UNKNOWN"}</div>
                    <a target="_blank" href={"https://solscan.io/account/"+market.address} className={styles.address}>
                      {
                        market.address.slice(0,6) + "..." + market.address.slice(-3)
                      }
                      <ArrowTopRightIcon width={8} height={8}/>
                    </a>
                  </div>
                </div>
                {/* <div className="itemRight">
                  <div className="change">
                    <ArrowTopRightIcon color="var(--green700)"/>
                    <p className="percent numFont">3.74%</p>
                  </div>
                </div> */}
              </div>
            })
          }
        </div>
      </div>
    </div>
  </Dialog>
}