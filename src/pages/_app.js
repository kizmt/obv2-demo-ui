import "@/styles/globals.css";
import "@/styles/App.scss";
import React, { useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import store from '@/redux/store';
import { RPC_ENDPOINT, STRICT_TOKEN_LIST_API } from '@/redux/globalState';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import { useDispatch, useSelector } from "react-redux";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { mergeTokenList, setAccounts, setDex, setPriorityFee, setTheme, setTokenList, setTopTokens, setWallet, setWalletConnected } from "@/redux/state";
import { TOKEN_LIST_API } from "@/redux/globalState";
import { GET_USER_TOKENS } from "@/utils/utils";
import { ThemeProvider } from "@/components/theme-provider"
import { useRouter } from "next/router";
import { v2m } from "./trade/[...params]";

function MyApp({ Component, pageProps }) {
  return <Provider store={store}>
    <Web3Wrapper Component={Component} pageProps={pageProps}/>
  </Provider>
}


function Web3Wrapper({Component, pageProps}) {

  const network = "mainnet-beta";
  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => RPC_ENDPOINT, [RPC_ENDPOINT]);

  const wallets = useMemo(
      () => [
          /**
           * Wallets that implement either of these standards will be available automatically.
           *
           *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
           *     (https://github.com/solana-mobile/mobile-wallet-adapter)
           *   - Solana Wallet Standard
           *     (https://github.com/solana-labs/wallet-standard)
           *
           * If you wish to support a wallet that supports neither of those standards,
           * instantiate its legacy wallet adapter here. Common legacy adapters can be found
           * in the npm package `@solana/wallet-adapter-wallets`.
           */
          new PhantomWalletAdapter(),
          new SolflareWalletAdapter(),
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <App Component={Component} pageProps={pageProps} />
          </ThemeProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function App({Component, pageProps}) {
  const state = useSelector((state) => state.storage);
  const dispatch = useDispatch();
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();
  const params = router.query.params || [];
  const clobVersion = params[0];

  const [triggerTokenListMerge, setTriggerTokenListMerge] = useState(false);

  useEffect(() => { // Gated Access TODO: Remove after launch
    let access = localStorage.getItem("xhKjHj");
    if(access !== "l") {
      // router.push("/access");
      // return;
    }
  }, []);

  useEffect(() => { // set prio fee from storage
    let prio = localStorage.getItem('priorityFee');
    if(!prio) {
      localStorage.setItem('priorityFee', 0.0005);
    } else {
      if(!state.priorityFee) {
        dispatch(setPriorityFee(Number(prio)));
      } else {
        localStorage.setItem('priorityFee', state.priorityFee);
      }
    }
  },[state.priorityFee]);

  useEffect(() => {
    fetch(STRICT_TOKEN_LIST_API).then(response => response.json())
    .then(tokenlist => {
      let arr = {
        tokens: tokenlist
      }
      dispatch(setTokenList(arr));
      setTriggerTokenListMerge(true);
    })
  },[]);

  useEffect(() => { // load strict list after all tl is loaded
    if(triggerTokenListMerge) {
      fetch(TOKEN_LIST_API).then(response => response.json())
      .then(tokenlist => {
        let arr = {
          tokens: tokenlist
        }
        dispatch(mergeTokenList(arr));
      })
    }
  }, [triggerTokenListMerge])

  useEffect(() => {
    if(clobVersion) {
      dispatch(setDex(clobVersion));
    }
  }, [clobVersion])

  // force theme to dark
  useEffect(() => {
    let theme = localStorage.getItem('theme');
    if(theme !== 'dark') {
      localStorage.setItem('theme', 'dark');
      router.reload();
    }
  }, [])

  useEffect(() => {
    if(wallet.connected) {
      GET_USER_TOKENS(wallet.publicKey.toBase58(), connection, dispatch);
    }
  }, [wallet])

  useEffect(() => {
    if(wallet.connected && state.refreshState > 0) {
      GET_USER_TOKENS(wallet.publicKey.toBase58(), connection, dispatch);
    }
  }, [state.refreshState]);

  useEffect(() => { // fetch top tokens
    fetch("https://cache.jup.ag/top-tokens").then((res) => res.json()).then((res) => {
      dispatch(setTopTokens(res));
    });
  },[])

  return <div className="app">
    <Component {...pageProps} />
    <Toaster 
      position="bottom-left"
      
      toastOptions={{
        className: 'border shadow-lg',
        style: {
          fontSize: '16px',
        },
        style: {
          background: 'hsl(var(--background-over))',
          color: '#fff',
        },
      }}
    />
  </div>
}


export default MyApp;