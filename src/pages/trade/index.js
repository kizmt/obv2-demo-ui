import { useRouter } from "next/router";
import { v2m } from "./[...params]";
import { useEffect } from "react";

const TradeDefaultPage = () => {

  const router = useRouter();

  useEffect(() => {
    let lastMarket = localStorage.getItem("lastMarket");
    if(lastMarket) {
      router.replace(`/trade/v2/${lastMarket}`);
      return;
    }
    router.replace(`/trade/v2/${v2m}`);
  }, []);
  
  return <>
  </>
  
}

export default TradeDefaultPage;