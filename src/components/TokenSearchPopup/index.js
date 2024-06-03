import styles from "./TokenSearchPopup.module.scss"
import { useSelector } from "react-redux";
import { Cross1Icon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { formatNumber } from "@/utils/utils";
import WarningIcon from "/public/assets/icons/warning.svg";
import CheckmarkIcon from "/public/assets/icons/checkmark.svg";

import { Input } from "@/components/ui/input"
import { Button } from "../ui/button";
import Image from 'next/image';
import SafeImage from "../SafeImage";
import { Badge } from "../ui/badge";
import { Dialog, Tooltip } from "@mui/material";


export const TokenSearchPopup = ({popupOpen, closePopup, onSelect}) => {
  const state = useSelector((state) => state.storage);
  const wallet = useWallet();
  const [list, setList] = useState([]);
  const [top, setTop] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  
  // useEffect(() => {
  //   console.log('acc', state.accounts)
  //   if(state.accounts.length > 0 && state.tokenList) {
  //     const newList = state.accounts.map((item) => {
  //       const token = state.tokenList.find((token) => token.address === item.address);
  //       return {
  //         ...item,
  //         ...token,
  //       }
  //     })
  //     console.log('tokensearch',newList)
  //     newList.sort((a, b) => a?.balance > b?.balance ? -1 : 1);
  //     newList.sort((a, b) => a?.price_info?.total_price > b?.price_info?.total_price ? -1 : 1);
  //     setList(newList);
  //   }
  // }, [state.accounts, state.tokenList])

  useEffect(() => {
    if(state.tokenList) {
      if(searchValue.length > 2) { // only start filtering when 2+ characters are entered
        let arr = [];
        for(let i = 0; i < state.tokenList.length; i++) {
          if ((state.tokenList[i].symbol.toLowerCase().includes(searchValue.toLowerCase()) || 
              state.tokenList[i].name.toLowerCase().includes(searchValue.toLowerCase()) ||
              state.tokenList[i].address.toLowerCase().includes(searchValue.toLowerCase())
              ) && 
              !(state.tokenList[i].tags && state.tokenList[i].tags.includes("lp-token")) &&
              state.tokenList[i].chainId == 101) {
            arr.push(state.tokenList[i]);
          }
        }
        let sorted = arr.filter(item => item.symbol.toLowerCase().includes(searchValue.toLowerCase())).sort((a, b) => {
          if(a.symbol.toLowerCase().indexOf(searchValue.toLowerCase()) > b.symbol.toLowerCase().indexOf(searchValue.toLowerCase())) {
            return 1;
          } else if (a.symbol.toLowerCase().indexOf(searchValue.toLowerCase()) < b.symbol.toLowerCase().indexOf(searchValue.toLowerCase())) {
            return -1;
          } else {
            if(a.symbol > b.symbol)
              return 1;
            else
              return -1;
          }
        });
        // sort by if token symbol matches exactly
        sorted.sort((a, b) => a.symbol.toLowerCase() === searchValue.toLowerCase() ? -1 : 1);

        // sort by if token has strict = true
        sorted.sort((a, b) => a.strict && !b.strict ? -1 : 1);

        
        if(sorted.length > 0) {
          setList(sorted);
        } else {
          setList(arr);
        }
      } else if(searchValue === "") { // if search field is empty, render list
        let arr = []; // filter out nfts and tokenized stocks
        for(let i = 0; i < state.tokenList.length; i++) {
          if(
            !(state.tokenList[i].tags &&
              (state.tokenList[i].tags.indexOf("nft") != -1 ||
                state.tokenList[i].tags.indexOf("NFT") != -1 ||
                  state.tokenList[i].tags.indexOf("tokenized-stock") != -1)) && 
                    state.tokenList[i].extensions && state.tokenList[i].chainId == 101) {
                      let item = Object.assign({},state.tokenList[i]);
                      item.balance = state.accounts.find((acc) => acc.address === item.address)?.balance || 0;
                      item.balanceUSD = state.accounts.find((acc) => acc.address === item.address)?.price_info?.total_price || 0;
            arr.push(item);
          }
        }
        // sort by strict = true
        arr.sort((a, b) => a.strict && !b.strict ? -1 : 1);
        arr.sort((a, b) => a.balance > b.balance ? -1 : 1);
        arr.sort((a, b) => a.balanceUSD > b.balanceUSD ? -1 : 1);
        setList(arr);
      }
    }
  }, [state.tokenList, searchValue, state.accounts]);

  useEffect(() => {
    if(state.topTokens && state.tokenList) {
      let _top = [];
      for(let i = 0; i < state.topTokens.length; i++) {
        if(i < 8) _top.push(state.topTokens[i]);
      }
      for(let i = 0; i < _top.length; i++) {
        const token = state.tokenList.find((token) => token.address === _top[i]);
        _top[i] = {
          ...token,
        }
      }
      setTop(_top);
    }
  }, [state.topTokens, state.tokenList])


  return <Dialog 
    open={popupOpen > -1}
    onClose={() => closePopup()}
    classes={{ root: "popup_container" }}
    aria-labelledby="simple-dialog-title"
    transitionDuration={0.2}
    className="text-white"
    style={{ alignItems: 'flex-start', }}
    PaperProps={{ style: { margin: '20px', background:'none', alignItems:'flex-start' } }}
  >
    <div className="max-w-sm md:max-w-[430px] h-[602px] md:h-[652px] p-4 bg-background border rounded-sm text-white flex flex-col gap-4 shrink-0">
      <div>
        <p className="text-md font-bold">Select a Token</p>
        <p className="text-sm text-muted-foreground">
          {
            popupOpen === 0 ?
            "Token you select will be the token you get charged for your transaction"
            :
            "Token you select will be the token you receive"
          }
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="h-[48px]" type="search" placeholder="Search token name, symbol or address"/>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {
            top &&
            top.map((item, i) => {
              if(item.address)
              return <Button variant={"outline"} className={'w-full h-[42px] flex gap-1 items-center justify-center hover:bg-background-over'} key={i} onClick={() => onSelect(item)}>
                <img className="rounded-full" width={24} height={24} src={item.logoURI ? item.logoURI : "https://i.imgur.com/WRxAdjU.png"} alt="logo" />
                <p className={'font-bold text-xs'}>{item.symbol || (item.address.slice(0,3) + "..." + item.address.slice(-3))}</p>
              </Button>
            })
          }
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">Token</p>
          <p className="text-xs text-muted-foreground">Your Balance</p>
        </div>
        <div className={'flex flex-col items-center overflow-y-scroll max-h-[250px] md:max-h-[350px]'}>
        { list.length > 0 &&
          list.map((item,i) => {
            if(i < 100)
            return <div className={'w-full flex items-center rounded justify-between hover:bg-background-over p-2 cursor-pointer'} key={i} onClick={() => onSelect(item)}>
              <div className={'flex items-center gap-2'}>
                <div className="flex items-center justify-between relative">
                  
                  <Image
                    src={item.logoURI ? item.logoURI : "https://i.imgur.com/WRxAdjU.png"}
                    alt={`${item.symbol} icon`}
                    width={24} // Adjust based on your layout
                    height={24}
                    layout="fixed"
                    className="rounded-full"
                    loading="lazy"
                    onError={(e) => e.preventDefault()}
                  />
                  {
                    !item.strict ?
                    <Tooltip title="This token is not on the validated list">
                      <div className="w-3 h-3 absolute -bottom-1 -right-1">
                        <WarningIcon className="w-3 h-3"/>
                      </div>
                    </Tooltip>
                    :
                    <Tooltip title="This token is on the validated list">
                      <div className="w-3 h-3 absolute -bottom-1 -right-1">
                        <CheckmarkIcon className="w-3 h-3"/>
                      </div>
                    </Tooltip>
                  }
                </div>
                <div className={'flex flex-col gap-1'}>
                  <div className="flex items-center gap-2">
                    <p className={'text-sm font-bold'}>{item.symbol || (item.address.slice(0,3) + "..." + item.address.slice(-3))}</p>
                    <Badge onClick={(e) => e.preventDefault()} variant={"outline"} className="rounded">{item.address.slice(0,3) + "..." + item.address.slice(-3)}</Badge>
                  </div>
                  <p className={'text-xs text-muted-foreground'}>{item.name || "Unknown"}</p>
                </div>
              </div>
              <div className={'flex flex-col items-end gap-1'}>
                <p className={'text-xs font-bold'}>{item.balance > 0 && formatNumber(item.balance, "auto")}</p>
                <p className={'text-xs text-muted-foreground'}>{item.balanceUSD ? ("$" + formatNumber(item.balanceUSD, 2)) : ""}</p>
              </div>
            </div>
          })
        }
      </div>
      </div>
    </div>
  </Dialog>
}