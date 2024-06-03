import { Header } from "@/components/Header";
import { MarketCreatedPopup } from "@/components/market-created-popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONFIRM_TX } from "@/utils/openbookv2/utils";
import { ToastMaker } from "@/utils/utils";
import { InfoCircledIcon, Link1Icon } from "@radix-ui/react-icons";
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { useSelector } from "react-redux";

const createMarketPage = () => {
  const state = useSelector(state => state.storage);
  const wallet = useWallet();
  const {connection} = useConnection();
  const [marketName, setMarketName] = useState("");
  const [baseMint, setBaseMint] = useState("");
  const [quoteMint, setQuoteMint] = useState("");
  const [minOrderSize, setMinOrderSize] = useState("");
  const [tickSize, setTickSize] = useState("");
  const [creatingMarket, setCreatingMarket] = useState(false);


  const [marketCreated, setMarketCreated] = useState(false);
  const [newMarket, setNewMarket] = useState(null);

  const [localMarkets, setLocalMarkets] = useState([]);

  useEffect(() => {
    let localMarkets = localStorage.getItem('localMarkets');
    if(localMarkets) {
      setLocalMarkets(JSON.parse(localMarkets));
    }
  }, []);

  const createMarket = async () => {
    setCreatingMarket(true);
    try {
      console.log("Create Market");
      let baseToken = await connection.getParsedAccountInfo(new PublicKey(baseMint));
      let quoteToken = await connection.getParsedAccountInfo(new PublicKey(quoteMint));

      let baseDecimals = baseToken.value?.data.parsed.info.decimals;
      let quoteDecimals = quoteToken.value?.data.parsed.info.decimals;

      let baseLotSize = 10**baseDecimals * parseFloat(minOrderSize);
      let quoteLotSize = 10**quoteDecimals * parseFloat(minOrderSize) * parseFloat(tickSize);

      let priorityFee = Number(localStorage.getItem('priorityFee'));
      if(quoteLotSize < 1) {
        toast.error(ToastMaker("Invalid Parameters", 
        "Please increase either Minimum Order Size or the Tick Size"));
        setCreatingMarket(false)
        return;
      }
      if(marketName.length < 3) {
        toast.error(ToastMaker("Invalid Market Name",
        "Please provide a valid market name"));
        setCreatingMarket(false)
        return;
      }

      console.log("Base Decimals", baseDecimals, "Quote Decimals", quoteDecimals);
      console.log("Base Lot Size", baseLotSize, "Quote Lot Size", quoteLotSize);
      console.log("Base Token", baseToken, "Quote Token", quoteToken);

      console.log('Fee', quoteLotSize * 10**quoteDecimals * 0.1);
      
      let marketRequest = await fetch('https://v4.prism.ag/createMarket',
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pubkey: wallet.publicKey.toBase58(),
          name: marketName,
          base: baseMint,
          quote: quoteMint,
          baseLotSize: baseLotSize,
          quoteLotSize: quoteLotSize, 
          makerFee: 10**quoteDecimals / 1000,
          takerFee: 10**quoteDecimals / 1000,
          timeExpiry: 0,
          clob:'v2',
          priorityFee: priorityFee
          // quoteLotSize * 10**quoteDecimals * 0.1 = fee
        })
      });
      let response = await marketRequest.json();
      console.log(response);
      if(response.success) {
        setNewMarket(response.address);
        const buff = Buffer.from(response.transaction, 'base64');
        let tx = Transaction.from(buff);
        let signedTx;
        toast.loading(ToastMaker("Preparing","Please approve transaction"),{id:"1"})

        try {
          //@ts-ignore
          signedTx = await wallet.signTransaction(tx);
        }  catch(e) {
          console.log("[EEEE]", e.message)
          if(e.message === "Transaction rejected" || e.message === 'User rejected the request.') {
            //@ts-ignore
            toast.error(ToastMaker("Transaction Rejected", "You rejected the transaction"), {id:"1"});
            return;
          }
          return;
        }
    
        
      toast.loading(ToastMaker("Sending Transaction","Market is being created"),{id:"1"})
      
      let txid;
      try {
        txid = await connection.sendRawTransaction(signedTx.serialize(), {skipPreflight: true});
      } catch (e) {
        console.log(e);
        toast.error("Transaction failed to send. Please try again", {id:"1"})
        return;
      }
        toast.loading(ToastMaker("Finalizing Transaction","Please wait"),{id:"1"});
        let status = await CONFIRM_TX(connection, txid);
        console.log('status', status)
        if(!status?.value?.err) {
          //@ts-ignore
          toast.success(ToastMaker("Transaction Confirmed","", {
            title:"View on solscan",
            href:"https://solscan.io/tx/"+txid
          }),{id:"1", duration:6000});
          setMarketCreated(true);
        } else {
          console.log(status.value.err);
          //@ts-ignore
          toast.error(ToastMaker("Transaction Failed","", {
            title:"View on solscan"
          }),{id:"1", duration:6000});
        }
      } else {
        toast.error(ToastMaker("Something went wrong", response.error));
      }
    } catch (err) {
      console.error(err);
    }
    setCreatingMarket(false);
  }

  return <div className="flex flex-col items-center h-full w-full px-2 md:px-4 gap-4">
    <Header path={"/tools"}/>
    <div className="w-full flex flex-col items-center justify-center">
      <h1 className="text-2xl text-white font-bold">Market Creator</h1>
      <p className="text-sm text-muted-foreground text-center">
        The easiest way to create a new Openbook v2 market
      </p>
    </div>
    <div className="w-full flex flex-col mt-4 gap-4 max-w-96 border p-4 bg-background rounded-lg">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label>Market Name</Label>
        </div>
        <Input value={marketName} onChange={(e) => setMarketName(e.target.value)} className="rounded-md h-12 bg-background" placeholder="SOL-USDC"/>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label>Base Token Mint</Label>
          <p className="text-xs text-muted-foreground">
            The base token mint for the market.
          </p>
        </div>
        <Input value={baseMint} onChange={(e) => setBaseMint(e.target.value)} className="rounded-md h-12 bg-background" placeholder="So11111111111111111111111111111111111111112"/>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label>Quote Token Mint</Label>
          <p className="text-xs text-muted-foreground">
            The quote token mint for the market.
          </p>
        </div>
        <Input value={quoteMint} onChange={(e) => setQuoteMint(e.target.value)} className="rounded-md h-12 bg-background" placeholder="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"/>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label>Minimum Order Size</Label>
          <p className="text-xs text-muted-foreground">
            The minimum size of the base token that can be traded.
          </p>
        </div>
        <Input type="number" value={minOrderSize} onChange={(e) => setMinOrderSize(e.target.value)} className="rounded-md h-12 bg-background" placeholder="1"/>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label>Minimum Price Difference</Label>
          <p className="text-xs text-muted-foreground">
            Also known as Tick Size, the minimum price increment in quote token that the orders can be placed at.
          </p>
        </div>
        <Input type="number" value={tickSize} onChange={(e) => setTickSize(e.target.value)} className="rounded-md h-12 bg-background" placeholder="0.001"/>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Create Fee:
        </p>
        <p className="text-sm">
          ~1.92 SOL
        </p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          UI Maker Fee / Taker Fee:
        </p>
        <p className="text-sm">
          0.1% / 0.1%
        </p>
      </div>
      {
        creatingMarket ?
        <Button variant={"secondary"} className="w-full h-12 gap-1" disabled>
          <LoaderIcon/>
          Creating Market
        </Button>
        :
        baseMint.length > 40 && quoteMint.length > 40 && minOrderSize.length > 0 && tickSize.length > 0 && wallet.connected ?
        <Button variant={"default"} className="w-full h-12 bg-cyan-500 hover:bg-cyan-700" onClick={() => createMarket()}>
          Create Market
        </Button>
        :
        <Button variant={"secondary"} className="w-full h-12" disabled>
          Create Market
        </Button>

      }
    </div>

    {
      localMarkets.length > 0 &&
      <div className="w-full flex flex-col gap-2 mt-4 max-w-96 border p-4 bg-background-over rounded-lg">
        <h2 className="text-lg text-white font-bold">Local Markets</h2>
        <p className="text-sm text-muted-foreground">
          Markets created by you on this device
        </p>
        {
          localMarkets.map((market, i) => {
            return <Link href={"/trade/v2/"+market} target="_blank" key={i} className="w-full flex items-center gap-2 hover:text-cyan-500 transition-all cursor-pointer">
              <Link1Icon/>
              <p className="text-xs">{market}</p>
            </Link>
          })
        }
      </div>
    }
    {
      marketCreated &&
      <MarketCreatedPopup open={marketCreated} onClose={() => setMarketCreated(false)} market={newMarket}/>
    }
  </div>
}

export default createMarketPage;