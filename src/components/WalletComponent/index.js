import styles from "./WalletComponent.module.scss"
import {
  WalletDisconnectButton,
  WalletMultiButton,
  WalletModal,
  useWalletModal
} from '@solana/wallet-adapter-react-ui';
import { useWalletDisconnectButton } from '@solana/wallet-adapter-base-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from "react";
import { ChevronDownIcon, PersonIcon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { useDispatch, useSelector } from "react-redux";
import { setPriorityFee } from "@/redux/state";

require('@solana/wallet-adapter-react-ui/styles.css');


export const WalletComponent = ({}) => {
  const state = useSelector(state => state.storage);
  const dispatch = useDispatch();
  const wallet = useWallet();
  const {visible, setVisible} = useWalletModal();
  const { buttonDisabled, buttonState, onButtonClick, walletIcon, walletName } = useWalletDisconnectButton();
  const [priorityFeeOption, setPriorityFeeOption] = useState(0);
  const [prioFee, setPrioFee] = useState(0.0005);

  useEffect(() => { // connect to a wallet if its selected but not connected
    let timeout = null;
    if(!wallet.connected && wallet.wallet) {
      timeout = setTimeout(() => wallet.connect(), 1000)
    }

    return () => clearTimeout(timeout)
  },[wallet]);

  useEffect(() => {
    if(prioFee) {
      let prio = Number(prioFee);
      if(Number(prio) === 0.0005) {
        if(priorityFeeOption !== 0) {
          setPriorityFeeOption(0);
          dispatch(setPriorityFee(0.0005));
        }
      } else if(Number(prio) === 0.002) {
        if(priorityFeeOption !== 1) {
          setPriorityFeeOption(1);
          dispatch(setPriorityFee(0.002));
        }
      } else if(prio !== 0.0005 && prio !== 0.002 && priorityFeeOption !== 2) {
        console.log('prio fee is', prio)
        setPriorityFeeOption(2);
        dispatch(setPriorityFee(prio));
      }
    }
  }, [prioFee]);

  useEffect(() => {
    let prio = localStorage.getItem('priorityFee');
    if(prio) {
      prio = Number(prio);
      setPrioFee(Number(prio));
      if(prio === 0.0005) {
        setPriorityFeeOption(0);
      } else if(prio === 0.002) {
        setPriorityFeeOption(1);
      } else {
        setPriorityFeeOption(2);
      }
    } else {
      setPrioFee(0.0005);
      if(prio === 0.0005) {
        setPriorityFeeOption(0);
      } else if(prio === 0.002) {
        setPriorityFeeOption(1);
      } else {
        setPriorityFeeOption(2);
      }
      dispatch(setPriorityFee(0.0005));
    }
  }, [])

  return <div className={styles.walletWrapper}>
    {
      wallet.connected ?
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"secondary"} className={"flex items-center gap-2 p-1 md:p-2"}>
            <Image width={24} height={24} src={walletIcon} alt={walletName} />
            <p className={styles.label}>{wallet.publicKey.toBase58().slice(0,3) + "..." + wallet.publicKey.toBase58().slice(-3)}</p>
            <ChevronDownIcon/>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 mr-6">
          <div className='flex flex-col w-full gap-2 p-2'>
            <p className='text-xs text-muted-foreground'>Priority Fees</p>
            <div className='w-full grid grid-cols-3 h-10 border rounded-md overflow-hidden'>
              <div onClick={() => {
                setPrioFee(0.0005);
              }} className={`${priorityFeeOption === 0 ? 'bg-secondary font-bold' : ''} cursor-pointer w-full h-full flex items-center justify-center border-r`}>
                <p className='text-xs'>High</p>
              </div>
              <div onClick={() => {
                setPrioFee(0.002);
              }} className={`${priorityFeeOption === 1 ? 'bg-secondary font-bold' : ''} cursor-pointer w-full h-full flex items-center justify-center border-r`}>
                <p className='text-xs'>Turbo</p>
              </div>
              <div onClick={() => {
                setPrioFee(0.01);
                setPriorityFeeOption(2);
                localStorage.setItem('priorityFee', 0.01);
              }} className={`${priorityFeeOption === 2 ? 'bg-secondary font-bold' : ''} cursor-pointer w-full h-full flex items-center justify-center`}>
                <p className='text-xs'>Custom</p>
              </div>
            </div>
            {
              priorityFeeOption === 2 &&
              <div className='w-full relative flex items-center gap-2'>
                <Input  type='number' value={prioFee} onChange={(e) => {
                  if(e.target.value < 1) {
                    setPrioFee(Number(e.target.value));
                    dispatch(setPriorityFee(Number(e.target.value)));
                  }
                }} className='w-full h-12 border border-secondary rounded-md p-2 font-bold text-sm px-4'/>
                <span className="absolute right-4 top-0 h-12 flex items-center text-muted-foreground font-bold">SOL</span>
              </div>
            }
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => onButtonClick()}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      :
      <Button variant="secondary" className={"flex items-center gap-1"} onClick={() => setVisible(true)}>
        {/* <PersonIcon width={20} height={20}/> */}
        <p className={styles.label}>Connect</p>
      </Button>
    }
  </div>
}
