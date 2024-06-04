import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import styles from "./CreateMarket.module.scss"
import { useState } from "react";
import toast, { CheckmarkIcon } from "react-hot-toast";
import { ToastMaker } from "@/utils/utils";
import { CONFIRM_TX } from "@/utils/openbookv2/utils";
import { Keypair, Transaction } from "@solana/web3.js";
import { Link } from "next/link";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Selector } from "@/components/Selector";

export const CreateMarket = () => {

  const wallet = useWallet();
  const {connection} = useConnection();
  const [marketName, setMarketName] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [quoteAddress, setQuoteAddress] = useState("");
  const [quoteLotSize, setQuoteLotSize] = useState("1");
  const [baseLotSize, setBaseLotSize] = useState("1000000");
  const [makerFee, setMakerFee] = useState("");
  const [takerFee, setTakerFee] = useState("");
  const [timeExpiry, setTimeExpiry] = useState("0");
  const [clob, setClob] = useState("v2");
  const [overlay, setOverlay] = useState(false);
  const [newMarketAddress, setNewMarketAddress] = useState(null);

  const createMarket = async () => {
    setOverlay(true);
    if(marketName.length < 3 || baseAddress.length < 30 
      || quoteAddress.length < 30 || quoteLotSize.length < 1 
      || baseLotSize.length < 1 || makerFee.length < 1
      || takerFee.length < 1 || timeExpiry.length < 1) {
      toast.error("Please fill all fields");
      setOverlay(false);
      return;
    }
    toast.loading("Creating market...", {id: 1});
    let createMarketTx = await fetch("https://v4..ag/createMarket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pubkey: wallet.publicKey.toBase58(),
        name: marketName,
        base: baseAddress,
        quote: quoteAddress,
        quoteLotSize: quoteLotSize,
        baseLotSize: baseLotSize,
        makerFee: makerFee * 100,
        takerFee: takerFee * 100,
        timeExpiry: timeExpiry,
      })
    }).then(res => res.json());
    if(createMarketTx.success) {
      toast.loading(ToastMaker("Creating Market", "Please approve transaction"), {id: 1});
      const swapTransactionBuf = Buffer.from(createMarketTx.transaction, 'base64');
      let transaction = Transaction.from(swapTransactionBuf);
      
      let signedTx = await wallet.signTransaction(transaction);
      // wallet.signAllTransactions([transaction])
      // Execute the transaction
      const rawTransaction = signedTx.serialize()
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        // maxRetries: 2
      });
      let tx = await CONFIRM_TX(connection, txid);
      toast.success(ToastMaker("Market created!", createMarketTx.address), {id: 1, duration: 10000});
      setNewMarketAddress(createMarketTx.address);
      let localMarketObj = {
        pubkey: wallet.publicKey.toBase58(),
        name: marketName,
        baseMint: baseAddress,
        quoteMint: quoteAddress,
        address: createMarketTx.address
      }
      let localMarkets = localStorage.getItem("local_markets");
      if(JSON.parse(localMarkets)) {
        let arr = JSON.parse(localMarkets);
        arr.push(localMarketObj);
        localStorage.setItem("local_markets", JSON.stringify(arr));
      } else {
        localStorage.setItem("local_markets", JSON.stringify([localMarketObj]));
      }
      //TODO: refetch markets
      // closePopup();
    }
  }

  if(newMarketAddress)
  return <div className="marketCreated">
    <div className="topSection">
      <CheckmarkIcon/>
      <p className="title">Market Created!</p>
    </div>
    <p className="description">Your market has been created successfully.</p>
    <p className="label">Market Address:</p>
    <a target="_blank" href={"https://solscan.io/account/"+newMarketAddress} className="address">{newMarketAddress}</a>
    <Link href={`/trade/v2/${newMarketAddress}`} className="link">Go to Market</Link>
  </div>

  return <div className="createMarketOuter">
    <div className="clob">
      <div className="input">
        <label>Openbook Version</label>
        <label className="secondary">V2 is a new version of Openbook and lets you set custom fees.</label>
        <div style={{maxWidth:"fit-content"}}>
          <Selector type={1} items={["V1", "V2"]} selected={clob === "v2" ? 1 : 0} onClick={(i) => setClob(i === 0 ? "v1" : "v2")}/>
        </div>
      </div>
    </div>
    <div className="createMarketWrapper">
      {/* <div className="imageContainer">
        <img src={createMarketImage} width={"100%"} height={"100%"}/>
      </div> */}
        <div className="createMarketForm showScrollbar">
          <div className="topSection">
            <p className="title">Create a Market</p>
            <Link href="/" className="closeBtn">
              <Cross1Icon/>
            </Link>
          </div>
          <div className="createMarketInputs">
            {
              clob === "v2" &&
              <div className="input">
                <label>Market Name</label>
                <label className="secondary">Example: SOL-USDC.</label>
                <input type="text" placeholder="SOL-USDC" value={marketName} onChange={(e) => setMarketName(e.target.value)}/>
              </div>
            }
            <div className="input">
              <label>Base Token Address</label>
              <label className="secondary">The main token being traded in a pair on a market. eg. SOL.</label>
              <input type="text" placeholder="So11111111111111111111111111111111111111112" value={baseAddress} onChange={(e) => setBaseAddress(e.target.value)}/>
            </div>
            
            <div className="input">
              <label>Quote Token Address</label>
              <label className="secondary">The token against which the value of the base token is priced in a trading pair. eg. USDC.</label>
              <input type="text" placeholder="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" value={quoteAddress} onChange={(e) => setQuoteAddress(e.target.value)}/>
            </div>
            
            <div className="input">
              <label>Quote Lot Size</label>
              <label className="secondary">The minimum amount of the quote token that can be traded on your market.</label>
              <input type="text" placeholder="1" value={quoteLotSize} onChange={(e) => setQuoteLotSize(e.target.value)}/>
            </div>

            <div className="input">
              <label>Base Lot Size</label>
              <label className="secondary">The minimum number of the base token (the main token being traded) that you can trade on your market.</label>
              <input type="text" placeholder="1000000" value={baseLotSize} onChange={(e) => setBaseLotSize(e.target.value)}/>
            </div>
            
            {
              clob === "v2" &&
              <div className="input">
                <label>Maker Fees</label>
                <label className="secondary">The amount of fees users pay when placing orders (in bps, 1% = 100bps)</label>
                <input type="text" placeholder="10" value={makerFee} onChange={(e) => setMakerFee(e.target.value)}/>
              </div>
            }
            {
              clob === "v2" &&
              <div className="input">
                <label>Taker Fees</label>
                <label className="secondary">The amount of fees users pay when filling orders (in bps, 1% = 100bps)</label>
                <input type="text" placeholder="10" value={takerFee} onChange={(e) => setTakerFee(e.target.value)}/>
              </div>
            }
          </div>
          <div className="fee flex justify-between">
            <p>Create Fee:</p>
            <p>
              {
                clob === "v2" ?
                "1.91496 SOL"
                :
                "3 SOL"
              }
            </p>
          </div>
          {
            overlay ?
            <div className="createButton disabled">
              <p>Creating Market...</p>
            </div>
            :
            <div className="createButton" onClick={() => createMarket()}>
              <p>Create</p>
            </div>
          }
        </div>
    </div>
  </div>
  
}