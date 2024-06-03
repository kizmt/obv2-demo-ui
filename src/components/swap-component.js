import { SOL_TOKEN, ToastMaker, USDC_TOKEN, formatNumber, sendSignedTransaction } from "@/utils/utils";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Badge } from "./ui/badge";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { Skeleton } from "./ui/skeleton";
import SwapIcon from "/public/assets/icons/swap.svg";
import ReloadIcon from "/public/assets/icons/reload.svg";
import SettingsIcon from "/public/assets/icons/settings.svg";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import LogoText from "/public/assets/icons/logo.svg"
import toast, { LoaderIcon } from "react-hot-toast";
import { VersionedTransaction } from "@solana/web3.js";
import Link from "next/link";
import { CONFIRM_TX } from "@/utils/openbookv2/utils";
import { TokenSearchPopup } from "./TokenSearchPopup";
import { reloadBalances, setDex } from "@/redux/state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "./ui/button";
import { SwapSettingsPopup } from "./swap-settings";


export const SwapComponent = ({
  fromAddress,
  toAddress
}) => {
  const state = useSelector((state) => state.storage);
  const dispatch = useDispatch();
  const wallet = useWallet();
  const {connection} = useConnection();
  const {visible, setVisible} = useWalletModal();


  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromBalance, setFromBalance] = useState(0);
  const [toBalance, setToBalance] = useState(0);
  const [toAmountLoading, setToAmountLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [slippage, setSlippage] = useState(50);
  const [quote, setQuote] = useState(null);
  const [infoDropdown, setInfoDropdown] = useState(true);
  const [reloadingBalances, setReloadingBalances] = useState(false);
  const [fromTokenData, setFromTokenData] = useState(null);
  const [toTokenData, setToTokenData] = useState(null);

  // popups
  const [swapImpactWarning, setSwapImpactWarning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tokenSearchPopup, setTokenSearchPopup] = useState(-1);

  // popup info
  const [customSlippage, setCustomSlippage] = useState("");
  const [useWSol, setUseWSol] = useState(false); // wrap sol or not during swap
  const [excludeDexes, setExcludeDexes] = useState([]);
  const [directRouteOnly, setDirectRouteOnly] = useState(false);

  useEffect(() => { // set excluded dexes from localstorage, set directRouteOnly
    let dexes = localStorage.getItem('excludeDexes');
    if(dexes) {
      setExcludeDexes(JSON.parse(dexes));
    }
    let directRoute = localStorage.getItem('directRouteOnly');
    if(directRoute) {
      setDirectRouteOnly(JSON.parse(directRoute));
    }
  }, [])

  useEffect(() => {
    if(fromAmount > 0) {
      loadQuote();
    }
  },[directRouteOnly]);

  useEffect(() => {
    if(parseFloat(customSlippage) > 0 && parseFloat(customSlippage) <= 10000) {
      setSlippage(parseFloat(customSlippage * 100));
    }
  }, [customSlippage]);
  
  useEffect(() => { // set from to tokens to default or by url
    if(fromAddress && toAddress && state.tokenList) {
      let from = state.tokenList.find((token) => token.address === fromAddress);
      let to = state.tokenList.find((token) => token.address === toAddress);
      console.log(from, to);
      if(from && to) {
        setFromToken(from);
        setToToken(to);
      } else {
        setFromToken(USDC_TOKEN);
        setToToken(SOL_TOKEN);
      }
    } else {
      setFromToken(USDC_TOKEN);
      setToToken(SOL_TOKEN);
    }

    // Load / set slippage in local storage
    let slippageSetting = localStorage.getItem('slippage');
    if(slippageSetting) {
      setSlippage(Number(slippageSetting));
    } else {
      localStorage.setItem('slippage', 50);
    }
  }, [state.tokenList, fromAddress, toAddress]);

  useEffect(() => { // set from & to balances
    if(state.accounts && fromToken && toToken) {
      let from = state.accounts.find((account) => account.address === fromToken.address);
      let to = state.accounts.find((account) => account.address === toToken.address);
      if(from) {
        setFromBalance(from.balance);
      } 
      if(to) {
        setToBalance(to.balance);
      }
      let _from = null;
      let _to = null;
      if(!fromToken.strict) _from = fromToken.address;
      if(!toToken.strict) _to = toToken.address;
      loadBirdeyeData(_from, _to);
    }
  }, [state.accounts, fromToken, toToken]);

  useEffect(() => { // get quote on fromAmount enter
    if(fromAmount === "") {
      setToAmount("");
      return;
    }
    setToAmountLoading(true);
    let triggerTimeout = setTimeout(loadQuote, 300);
    let reloadInterval = setInterval(loadQuote, 15000);
    return () => {
      clearTimeout(triggerTimeout);
      clearInterval(reloadInterval);
    }
  }, [fromAmount]);

  const loadQuote = async () => {
    if(fromAmount > 0) {
      try {
        let req = await fetch(
          `https://quote-api.jup.ag/v6/quote?`+
          `inputMint=${fromToken.address}&`+
          `outputMint=${toToken.address}&`+
          `amount=${parseInt(fromAmount * 10**fromToken.decimals)}&`+
          `slippageBps=${slippage}`+
          `&onlyDirectRoutes=${directRouteOnly}`+
          `${excludeDexes.length > 0 ? `&excludeDexes=${excludeDexes.toString()}`: ``}

        `);
        let quote = await req.json();
        if(quote.error) {
          toast.error(ToastMaker("No Routes Found", "Please try a different pair"), {id:1});
          setToAmountLoading(false);
          return;
        }
        console.log(quote);
        if(parseInt(quote.inAmount) !== parseInt(fromAmount * 10**fromToken.decimals)) {
          loadQuote();
          return;
        }
        setQuote(quote);
        setToAmount(parseInt(quote.outAmount) / 10**toToken.decimals);
        setToAmountLoading(false);
      } catch (e) {
        setToAmountLoading(false);
        toast.error(ToastMaker("Error Fetching Quote", "Please try again"), {id:1});
        return;
      }
    } else {
      setToAmount("");
    }
  }

  const loadBirdeyeData = async (from, to) => {
    const options = {
      method: 'GET',
      headers: {
        'x-chain': 'solana',
        'X-API-KEY': process.env.NEXT_PUBLIC_CANDLESTICK_API_KEY
      }
    };
    
    let fromData = from ? await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${from}`, options).then(response => response.json()) : {success: false}
    let toData = to ? await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${to}`, options).then(response => response.json()) : {success: false}
    if(fromData.success) setFromTokenData(fromData.data);
    if(toData.success) setToTokenData(toData.data);
  }

  const switchSide = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromBalance(toBalance);
    setToBalance(fromBalance);
    setFromAmount(toAmount);
  }

  const swap = async (override = false) => {
    if(quote) {

      if(!override && parseFloat(quote.priceImpactPct) * 100 > 5) {
        setSwapImpactWarning(true);
        return;
      }
      let from = fromToken.symbol;
      let to = toToken.symbol;
      let fromAmt = fromAmount;
      let toAmt = toAmount;
      setSwapping(true);
      try {
        toast.loading(ToastMaker("Swapping", "Preparing Transaction"), {id:1});
        const { swapTransaction } = await (
          await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              // quoteResponse from /quote api
              quoteResponse: quote,
              // user public key to be used for the swap
              userPublicKey: wallet.publicKey.toString(),
              // auto wrap and unwrap SOL. default is true
              wrapAndUnwrapSol: true,
              dynamicComputeUnitLimit: true,
              prioritizationFeeLamports: 'auto'
              // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
              // feeAccount: "fee_account_public_key"
            })
          })
        ).json();
        console.log(swapTransaction);
        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
        let transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        let signedTx = await wallet.signTransaction(transaction);
        let txid = await sendSignedTransaction(connection, signedTx);
        toast.loading(ToastMaker("Swapping", <div className="flex flex-col">
          <p className="text-sm text-muted-foreground">Confirming Transaction</p>
          <Link className="text-cyan-500 text-xs font-bold" target="_blank" href={`https://solscan.io/tx/${txid}`}>View on Solscan</Link>
        </div>), {id:1});
        console.log('tx', txid)
        let status = await CONFIRM_TX(connection, txid);
        console.log(status);
        if(!status?.value?.err) {
          toast.success(ToastMaker("Swap Complete", <div className="flex flex-col">
            <p className="text-sm text-muted-foreground">Swap {fromAmount} {from} to {toAmount} {to}</p>
            <Link className="text-cyan-500 text-xs font-bold" target="_blank" href={`https://solscan.io/tx/${txid}`}>View on Solscan</Link>
          </div>), {id:1});
          setSwapping(false);
          dispatch(reloadBalances());
          return;
        } else {
          if(status.value.err[1] && status.value.err[1].Custom) {
            if(status.value.err[1].Custom === 6001) {
              toast.error(ToastMaker(<p className="text-red-500">Swap Failed</p>, <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Slippage Tolerance Exceeded</p>
                <Link className="text-cyan-500 text-xs font-bold" target="_blank" href={`https://solscan.io/tx/${txid}`}>View on Solscan</Link>
              </div>), {id:1});
              setSwapping(false);
              return;
            }
          }
          toast.error(ToastMaker(<p className="text-yellow-500">Swap Status Unknown</p>, <div className="flex flex-col">
            <p className="text-sm text-muted-foreground">Swap Failed or wasn't seen on chain.</p>
            <Link className="text-cyan-500 text-xs font-bold" target="_blank" href={`https://solscan.io/tx/${txid}`}>View on Solscan</Link>
          </div>), {id:1});
          setSwapping(false);
        }
      } catch (e) {
        setSwapping(false);
        toast.error(ToastMaker("Swap Cancelled", "You cancelled the swap"), {id:1});
        dispatch(reloadBalances());
      }
      
    }
  }

  const reload = async () => {
    setReloadingBalances(true);
    if(parseFloat(fromAmount) > 0) {
      setToAmountLoading(true);
      loadQuote();
    }
    dispatch(reloadBalances());
    setTimeout(() => {
      setReloadingBalances(false);
    }, 2000);
  }


  return <div className="flex flex-col w-svw px-2 md:px-0 md:w-[400px]">
    <div className="w-full hidden md:flex items-center border overflow-hidden justify-between p-4 h-[58px] rounded-sm relative bg-background hover:bg-background-over transition-all">
      <LogoText className="z-10" height={32}/>
      <p className="text-sm font-bold  z-10">Swap</p>
      <div className="hero"/>
    </div>
    <div className="flex w-full items-center justify-between mt-8">
      <div onClick={() => reload()} className="flex w-6 h-6 rounded-full text-muted-foreground hover:text-white cursor-pointer bg-background-over border items-center justify-center">
        <ReloadIcon className="w-4 h-4"/>
      </div>

      <div onClick={() => setShowSettings(true)} className="flex px-2 gap-1 h-6 rounded-full text-muted-foreground hover:text-white cursor-pointer bg-background-over border items-center justify-center">
        <p className="text-xs font-bold">{slippage / 100}%</p>
        <div className="w-[1px] h-full bg-border"/>
        <SettingsIcon className="w-4 h-4"/>
      </div>
    </div>
    <div className={`flex border w-full flex-col mt-2 mb-2 gap-2 rounded-md py-2`}>
      <div className={'w-full flex items-center justify-between px-3'}>
        <div className="flex items-center gap-2">
          <p className={`text-sm text-muted-foreground`}>You Pay</p>
          <div className="flex items-center gap-1">
            <Badge onClick={() => setFromAmount(fromBalance/2)} variant={"outline"} size={"sm"} className="cursor-pointer text-xs font-bold hover:bg-background-over">50%</Badge>
          </div>
        </div>
        {fromToken &&
          (fromBalance ?
          <p className={'text-sm text-muted-foreground cursor-pointer'} onClick={() => setFromAmount(fromBalance)}>Max: {formatNumber(fromBalance, "auto")} {fromToken.symbol}</p>
          :
          <p className={'text-sm text-muted-foreground'}>Max: 0 {fromToken.symbol}</p>)
        }
      </div>
      <div className={`w-full relative flex items-center justify-end px-2`}>
        <input 
          onWheel={(e) => e.target.blur()} 
          className={'absolute outline-none font-[Font-Bold] font-bold pl-3 text-xl w-full h-full top-0 left-0 bg-transparent'} 
          value={fromAmount} 
          lang="en" 
          onChange={(e) => setFromAmount(e.target.value)} 
          type="number" 
          placeholder="0.00" 
          inputMode='decimal' 
          pattern="[0-9]*"
        />
      <div onClick={() => setTokenSearchPopup(0)} className={`flex hover:border-secondary hover:text-cyan-500 transition-all items-center gap-1 bg-background p-1 px-2 rounded-sm border cursor-pointer z-10`}>
          {
            fromToken ?
            <img className="rounded-full" src={fromToken.logoURI} width="24px" height="24px"/>
            :
            <div className="skeleton" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
          }
          {
            fromToken ? 
            <p className="font-bold text-sm text-white">{fromToken.symbol}</p> 
            :
            <div className="skeleton" style={{width:"40px", height:"20px"}}/>
          }
          <ChevronDownIcon width={20} height={20}/>
        </div>
      </div>
      {/* <div className="w-full border-t my-2"/> */}
      <div className={'flex select-none items-center justify-center relative w-full -my-3'}>
        <hr className={'w-full absolute border-t z-0'}/>
        <div className={'w-[36px] h-[36px] rounded-full border flex items-center justify-center bg-background-over z-10 cursor-pointer hover:border-secondary hover:text-secondary'} onClick={() => switchSide()}>
          <SwapIcon width={20} height={20}/>
        </div>
      </div>
      <div className={'w-full flex items-center justify-between px-2'}>
        <div className="flex items-center gap-2">
          <p className={'text-sm text-muted-foreground'}>You Receive</p>
        </div>
        {
          (toToken && toBalance) ?
          <p className={'text-sm text-muted-foreground'}>Balance: {formatNumber(toBalance, "auto")} {toToken.symbol}</p>
          :
          <p className={'text-sm'}></p>
        }
      </div>
      <div className={'w-full mt-1 mb-1 relative flex items-center justify-end px-2'}>
        {
          toAmountLoading ?
          <Skeleton className="absolute w-20 h-full rounded-sm left-2"/>
          :
            (toToken && toAmount) ?
            <p className={'absolute outline-none font-[Font-Bold] font-bold pl-3 text-xl w-full h-full top-0 left-0 bg-transparent'}>
              {
              formatNumber(parseFloat(toAmount), toToken.decimals) 
              }
            </p>
            :
            <p className={'absolute outline-none text-muted-foreground font-[Font-Bold] font-bold pl-3 text-xl w-full h-full top-0 left-0 bg-transparent'}>
              0.00
            </p>
        }
        
        <div onClick={() => setTokenSearchPopup(1)} className="flex items-center gap-1 bg-background p-1 px-2 rounded-sm border hover:border-secondary hover:text-cyan-500 transition-all cursor-pointer z-10">
          {
            toToken ?
            <img className="rounded-full" src={toToken.logoURI} width="24px" height="24px"/>
            :
            <div className="skeleton" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
          }
          {
            toToken ? 
            <p className="font-bold text-sm text-white">{toToken.symbol}</p> 
            :
            <div className="skeleton" style={{width:"40px", height:"20px"}}/>
          }
          <ChevronDownIcon width={20} height={20}/>
        </div>
      </div>
    </div>

    {
      !toAmountLoading && toAmount > 0 && fromToken && toToken && fromAmount > 0 && fromBalance >= fromAmount &&  wallet.connected ?
        swapping ?
        <div className="w-full h-[58px] rounded-sm bg-background-over flex gap-1 items-center justify-center cursor-pointer hover:bg-border">
          <LoaderIcon/>
          <p className="text-lg font-bold text-muted-foreground">Swapping</p>
        </div>
        :
        <div onClick={() => swap()} className="w-full h-[58px] rounded-sm bg-green-500 flex items-center justify-center cursor-pointer hover:bg-green-600">
          <p className="text-lg font-bold text-black">Swap</p>
        </div>
      :
      !wallet.connected ?
      <div onClick={() => setVisible(true)} className="w-full h-[58px] rounded-sm bg-secondary flex items-center justify-center cursor-pointer hover:bg-purple-500">
        <p className="text-lg font-bold text-white">Connect Wallet</p>
      </div>
      :
      fromBalance < fromAmount ?
      <div className="w-full h-[58px] rounded-sm bg-background-over flex items-center justify-center">
        <p className="text-lg font-bold text-muted-foreground">Insufficient Balance</p>
      </div>
      :
      <div className="w-full h-[58px] rounded-sm bg-background-over flex items-center justify-center">
        <p className="text-lg font-bold text-muted-foreground">Enter Swap Details</p>
      </div>
    }
    

    {
      (fromToken && toToken && toAmount && fromAmount && quote && !toAmountLoading) ?
      <div className="w-full flex flex-col gap-4 mt-2">
        <div className="w-full flex items-center justify-between">
          <p className="text-xs font-[Font-Bold] text-muted-foreground">1 {toToken.symbol} ≈ {formatNumber(fromAmount / toAmount,"auto")} {fromToken.symbol}</p>
          <div onClick={() => setInfoDropdown(!infoDropdown)} className="flex cursor-pointer select-none items-center gap-1 text-muted-foreground">
            <p className="text-xs ">Show More</p>
            <ChevronDownIcon width={16} height={16} className={`transition-all ${infoDropdown ? 'rotate-180' : 'rotate-0'}`}/>
          </div>
        </div>

        {
          infoDropdown ?
          <div className="flex flex-col gap-4">
            <div className="w-full flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Price Impact</p>
              <p className={`text-xs font-bold font-[Font-Bold] ${
                parseFloat(quote.priceImpactPct) * 100 <= 2 ? 'text-green-500' :
                parseFloat(quote.priceImpactPct) * 100 <= 5 ? 'text-yellow-500' : 'text-red-500'
                }`}>{formatNumber(parseFloat(quote.priceImpactPct) * 100,2)}%</p>
            </div>
            {
              directRouteOnly ?
              <div className="w-full flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Direct Route Only</p>
                <p className={`text-xs font-bold font-[Font-Bold] text-yellow-600`}>ON</p>
              </div>
              :""
            }
            {
              excludeDexes.length > 0 ?
              <div className="w-full flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Excluded Dexes</p>
                <p className={`text-xs font-bold font-[Font-Bold] text-yellow-600`}>
                  {
                    excludeDexes.length > 3 ?
                    `${excludeDexes.length} Dexes`
                    :
                    excludeDexes.join(", ")
                  }
                </p>
              </div>
              :""
            }
            <div className="w-full flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Minimum Received</p>
              <p className={`text-xs font-bold font-[Font-Bold] `}>
                {formatNumber(parseInt(quote.otherAmountThreshold) / 10**toToken.decimals ,2)} {toToken.symbol}
              </p>
            </div>
            
            { (fromTokenData && fromTokenData.liquidity) ?
              <div className="w-full flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{fromToken.symbol} Liquidity (TVL)</p>
                <p className={`text-xs font-bold font-[Font-Bold] `}>
                  ${
                    formatNumber(fromTokenData.liquidity, "auto")
                  }
                </p>
              </div>
              :
              ""
            }
            { (toTokenData && toTokenData.liquidity) ?
              <div className="w-full flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{toToken.symbol} Liquidity (TVL)</p>
                <p className={`text-xs font-bold font-[Font-Bold] `}>
                  ${
                    formatNumber(toTokenData.liquidity, "auto")
                  }
                </p>
              </div>
              :
              ""
            }
          </div>
        :
        ""
        }
      </div>
      :
      ""
    }
    {
      swapImpactWarning ?
      <Dialog 
        open={swapImpactWarning}
        onOpenChange={() => setSwapImpactWarning(false)}
      >
        <DialogTrigger/>
        <DialogContent className="max-w-[310px] rounded-sm md:max-w-[380px] p-4">
          <DialogHeader>
            <DialogTitle className="text-yellow-500">High Price Impact Warning</DialogTitle>
            <DialogDescription>
              <p className="text-sm text-muted-foreground">
                You might get significantly less than the current market value.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              This often occurs with large trades or in markets with low liquidity.
            </p>
            <p className="text-sm font-bold text-center md:text-left">
              Do you wish to continue?
            </p>
            <div className="w-full grid items-center grid-cols-2 gap-2">
              <Button onClick={() => setSwapImpactWarning(false)} variant={"secondary"} className="w-full">
                Cancel
              </Button>
              <Button onClick={() => {
                swap(true);
                setSwapImpactWarning(false);
              }} variant={"outline"} className="w-full border-yellow-500 hover:bg-transparent text-yellow-500 hover:text-yellow-700 hover:border-yellow-700">
                Swap Anyway
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      :
      ""
    }

    {
      showSettings ?
      <SwapSettingsPopup
        open={showSettings}
        onClose={() => setShowSettings(false)}
        slippage={slippage}
        setSlippage={setSlippage}
        customSlippage={customSlippage}
        setCustomSlippage={setCustomSlippage}
        useWSol={useWSol}
        setUseWSol={setUseWSol}
        excludeDexes={excludeDexes}
        setExcludeDexes={setExcludeDexes}
        directRouteOnly={directRouteOnly}
        setDirectRouteOnly={setDirectRouteOnly}
      />
      :
      ""
    }

    {
      <TokenSearchPopup
        popupOpen={tokenSearchPopup} 
        closePopup={() => setTokenSearchPopup(-1)}
        onSelect={
          (token) => {
            if(tokenSearchPopup === 0) {
              setFromBalance("");
              setFromToken(token);
            } else if(tokenSearchPopup === 1){
              setToBalance("");
              setToToken(token);
            }
            setTokenSearchPopup(-1);
            setFromAmount("");
          }
        }
      />
    }
    {
      
    }
  </div>
}

