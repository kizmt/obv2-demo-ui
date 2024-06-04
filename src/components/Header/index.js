import { WalletComponent } from "@/components/WalletComponent";
import styles from "./Header.module.scss";
import LogoText from "/public/assets/icons/logo.svg";
import { useSelector } from "react-redux";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import React from "react";
import useWindowDimensions from "@/utils/utils";



export const Header = ({ path }) => {
  const state = useSelector(state => state.storage);
  const { width } = useWindowDimensions() || 1000;
  const wallet = useWallet();

  return (
    <div className="w-full px-2">
      <div className={`${styles.header} w-full mt-2 border rounded-[8px] p-4 flex justify-between items-center`}>
        <div className="flex items-center gap-2">
        </div>
        {width > 768 && (
          <div className={`${styles.menu} flex gap-4`}>
          </div>
        )}
        <div className="wallet">
          <WalletComponent />
        </div>
      </div>
    </div>
  );
};
