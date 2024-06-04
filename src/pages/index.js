import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v1m, v2m } from "./trade/[...params]";
import { Header } from "@/components/Header";
import { SwapComponent } from "@/components/swap-component";
import { Footer } from "@/components/Footer";


const Root = () => {
  const state = useSelector((state) => state.storage);
  const dispatch = useDispatch();
  const router = useRouter();
  const query = router.query;
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");

  useEffect(() => {
    if(query.from && query.to) {
      setFromAddress(query.from);
      setToAddress(query.to);
    }
  }, [query]);
  return <div className="flex flex-col w-full items-center relative">
    <Header path={"/swap"}/>
    <div className="mt-4 md:mt-12 px-2">
      <SwapComponent fromAddress={fromAddress} toAddress={toAddress}/>
    </div>
  </div>
}

export default Root;