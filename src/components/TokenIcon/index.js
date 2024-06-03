import { useEffect, useState } from "react";
import styles from "./TokenIcon.module.scss"
import { useSelector } from "react-redux";
import { log } from "@/utils/utils";


export const TokenIcon = ({size, token}) => {
  const state = useSelector((state) => state.storage);
  const [outputURI, setOutputURI] = useState(null);

  useEffect(() => {
    // log("[TokenIcon]", token)
    if(state.tokenList && token) {
      state.tokenList.forEach(object => {
        if(object.address === token || (object.symbol && object.symbol === token)) {
          setOutputURI(object.logoURI);
          return;
        }
      });
    }
    return () => {
      //setOutputURI("https://i.imgur.com/WRxAdjU.png");
    }
  },[state.tokenList, token])

  return <img 
    className={styles.tokenIcon}
    src={outputURI} 
    width={size}
    height={size}
    alt={token ? token : "Unknown"}
    onError={(e) => e.target.src="https://i.imgur.com/WRxAdjU.png"}
    />
}