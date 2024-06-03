// import { TVChartContainer } from "components/TVChartContainer";
import styles from "./Chart.module.scss";
import React, { Suspense } from "react";
import { Watchlist } from "@/components/Watchlist";


export const Chart = ({market, updateMarket, openOrders, showWatchlist=true, className="", strategyPreview=null}) => {

  return <div className={`${styles.chart} border ${className}`}>
    {
      showWatchlist &&
      <Watchlist market={market} updateMarket={(p) => updateMarket(p)}/>
    }
  </div>
}
