import { useEffect, useState } from "react";
import styles from "./OrderboxSwap.module.scss"
import { GET_USER_TOKENS, getJupQuote, placeJupOrder } from "@/utils/utils";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import SwapIcon from "/public/assets/icons/swap.svg";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { LoaderIcon } from "react-hot-toast";

export const OrderBoxSwap = ({orderSide, wallet, connection, quote, quoteBalance, base, baseBalance, side, switchSide, swap, showReverse=true,setTokenSearchPopup}) => {
  const dispatch = useDispatch();
  const [swapInput, setSwapInput] = useState("");
  const [swapOutput, setSwapOutput] = useState("");
  const [swapQuote, setSwapQuote] = useState(null);
  const [orderInProgress, setOrderInProgress] = useState(false);

  useEffect(() => {
    if(swapInput > 0) {
       getJupQuote({
        base: base,
        quote: quote
       }, orderSide === 0 ? 'buy' : 'sell', swapInput).then((res) => {
        setSwapOutput(res.quoteUI);
        setSwapQuote(res.quoteResponse);
       })
    } else {
      setSwapOutput("");
      setSwapQuote(null);
    }
  }, [swapInput])

  const makeOrder = () => {
    setOrderInProgress(true);
    swap(
      {
        base: base,
        quote: quote
      },
      orderSide === 0 ? 'buy' : 'sell',
      swapInput
    ).then((res) => {
      console.log("[jup] sent");
      setOrderInProgress(false);
      setTimeout(() => GET_USER_TOKENS(wallet.publicKey.toBase58(), connection, dispatch),1000);
    });
  }


  return <div className={styles.orderInputs}>
    <div className={styles.orderInput}>
      <div className={'flex items-center justify-between text-muted-foreground'}>
        <p>You Pay</p>
        {
          (quote && quoteBalance) ?
          <p onClick={() => setSwapInput(quoteBalance)} className={`${styles.balance} cursor-pointer`}>Max: {quoteBalance} {quote.symbol}</p>
          :
          <p className={styles.balance}>Balance: 0 {quote.symbol}</p>
        }
      </div>
      <div className={`${styles.input} border`}>
        <div onClick={() => setTokenSearchPopup(0)} className={`flex items-center gap-1 border bg-background-over hover:bg-border hover:border-transparent transition-all p-1.5 px-2 rounded-lg cursor-pointer z-10`}>
          {
            quote ?
            <img className="rounded-full" src={quote ? quote.logoURI : "https://i.imgur.com/WRxAdjU.png"} width="24px" height="24px"/>
            :
            <div className="skeleton" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
          }
          {
            quote ? 
            <p>{quote.symbol}</p> 
            :
            <div className="skeleton" style={{width:"40px", height:"20px"}}/>
          }
          <ChevronDownIcon/>
        </div>
        <input className="outline-none placeholder:text-muted-background" value={swapInput} lang="en" onChange={(e) => setSwapInput(e.target.value)} type="number" placeholder="0.00" inputMode='numeric' pattern="[0-9]*"/>
      </div>
    </div>
    {
      showReverse &&
      <div className={'flex items-center justify-center relative w-full'}>
        <hr className={'w-full absolute border-t z-0'}/>
        <div className={'w-[36px] h-[36px] rounded-full border-2 flex items-center justify-center bg-background-over z-10 cursor-pointer hover:border-cyan-500 hover:text-cyan-500'} onClick={() => switchSide(side === 0 ? 1 : 0)}>
          <SwapIcon width={20} height={20}/>
        </div>
      </div>
    }
    
    <div className={styles.orderInput}>
      <div className={'flex items-center justify-between text-muted-foreground'}>
        <p className={styles.label}>You'll receive</p>
        {
          (base && baseBalance) ?
          <p className={styles.balance}>Balance: {baseBalance} {base.symbol}</p>
          :
          <p className={styles.balance}>Balance: 0 {base.symbol}</p>
        }
      </div>
      <div className={`${styles.input} border`}>
        <div onClick={() => setTokenSearchPopup(1)} className={'flex items-center gap-1 border bg-background-over hover:bg-border hover:border-transparent transition-all p-1.5 px-2 rounded-lg cursor-pointer z-10'}>
          {
            base ?
            <img className="rounded-full" src={base ? base.logoURI : "https://i.imgur.com/WRxAdjU.png"} width="24px" height="24px"/>
            :
            <div className="skeleton" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
          }
          {
            base ? 
            <p>{base.symbol}</p> 
            :
            <div className="skeleton" style={{width:"40px", height:"20px"}}/>
          }
          <ChevronDownIcon/>
        </div>
        <input value={swapOutput} lang="en" disabled type="number" placeholder="0.00" inputMode='numeric' pattern="[0-9]*"/>
      </div>
    </div>
    {
      swapQuote ?
      <div className={'w-full flex items-center border justify-center p-2 rounded-xl gap-1 text-xs text-muted-foreground'}>
        <p>Best price on </p>
        {
          swapQuote.routePlan.map((route, i) => {
            if(i < 3)
            return <p>
              {route.swapInfo.label} {i < (swapQuote.routePlan.length-1) && "+"}
            </p>
          })
        }
      </div>
      :
      <div className={'w-full flex items-center border justify-center p-2 rounded-xl gap-1 text-xs text-muted-foreground'}>
        <p>Swapping with the best rate</p>
      </div>
    }
    {
      orderInProgress ?
        <div className={'flex w-full p-2 py-4 rounded-xl bg-muted items-center justify-center gap-2 text-muted-foreground font-bold'} style={{backgroundColor:"black", opacity:0.4}}>
          <LoaderIcon/>
          <p>Swapping</p>
        </div>
      :
        (Number(swapInput) > Number(quoteBalance)) ?
        <div className={'flex w-full p-2 py-4 rounded-xl bg-black items-center justify-center text-muted-foreground font-bold'}>
          Insufficient Balance
        </div>
        :
          (swapInput > 0 && swapQuote ?
          <div className={'flex w-full pointer p-2 py-4 rounded-xl bg-green-500 items-center justify-center text-black font-bold'} onClick={() => makeOrder()}>
            Swap
          </div>
          :
          <div className={'flex w-full p-2 py-4 rounded-xl bg-black items-center justify-center text-muted-foreground font-bold'} style={{backgroundColor:"black", opacity:0.4}}>
            <p>Enter Swap Amount</p>
          </div>)
    }
    
  </div>
}