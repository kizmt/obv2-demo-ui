import { createSlice } from "@reduxjs/toolkit";
import globalState from "./globalState";

export const stateSlice = createSlice({
  name: "state",
  initialState: globalState,
  reducers: {
    setPendingStates: (state, action) => {
      state.pendingStates = action.payload;
    },
    setSupportedTokens: (state, action) => {
      state.supportedTokens = action.payload;
    },
    setAvailableTokens: (state, action) => {
      state.availableTokens = action.payload;
    },
    setTokenList: (state, action) => {
      let arr = action.payload.tokens;
      for(let i = 0; i < arr.length; i++) {
        arr[i].strict = true;
      }
      state.tokenList = arr;
      state.strictTokenList = arr;
      console.log('tokenList',state.tokenList)
    },
    mergeTokenList: (state, action) => {
      let strictTokens = Object.assign([], state.tokenList);
      let allTokens = Object.assign([],action.payload.tokens);
      // set strict to true to allTokens where strictTokens token exists in allTokens
      for(let i = 0; i < strictTokens.length; i++) {
        let index = allTokens.findIndex((token) => token.address === strictTokens[i].address);
        if(index !== -1) {
          allTokens[index].strict = true;
        }
      }
      console.log('allTokens',allTokens)
      state.tokenList = allTokens;
    },
    setGeneralStats: (state, action) => {
      state.generalStats = action.payload;
    },
    setFundsList: (state, action) => {
      state.fundsList = action.payload;
    },
    setTokenAccounts: (state, action) => {
      state.tokenAccounts = action.payload;
    },
    setExplorerStats: (state, action) => {
      state.explorerStats = action.payload;
    },
    setExplorerHistory: (state, action) => {
      state.explorerHistory = action.payload;
    },
    setWalletConnected: (state, action) => {
      state.connected = true;
      state.publicKey = action.payload.toBase58();
    },
    setWalletDisconnected: (state, action) => {
      state.connected = false;
      state.publicKey = null;
    },
    setAccounts: (state, action) => {
      state.accounts = action.payload;
    },
    setOpenOrders: (state, action) => {
      state.openOrders = action.payload;
    },
    setNewTx: (state, action) => {
      state.newTx = action.payload;
    },
    setBenchmarkCharts: (state, action) => {
      state.benchmarkCharts = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    setDex: (state, action) => {
      state.dex = action.payload
    },
    setClosedOpenOrders: (state, action) => {
      state.closedOpenOrders = action.payload
    },
    setTopTokens: (state, action) => {
      state.topTokens = action.payload
    },
    refreshState: (state, action) => {
      state.refreshState = action.payload
    },
    setWallet: (state, action) => {
      state.wallet = action.payload
    },
    setMarketsV2: (state, action) => {
      state.marketsV2 = action.payload
    },
    setPriorityFee: (state, action) => {
      state.priorityFee = action.payload
    },
    reloadBalances: (state) => {
      state.refreshState += 1;
    }
  }
});

// Action creators are generated for each case reducer function
export const { setPendingStates, setSupportedTokens, 
setAvailableTokens, setTokenList, mergeTokenList, setFundsList, setTokenAccounts, setExplorerHistory, setExplorerStats, 
setWalletConnected, setWalletDisconnected, setProvider, initWallet, setAccounts, setOpenOrders, setNewTx,
setGeneralStats, setBenchmarkCharts, setMarketsV2, setPriorityFee, reloadBalances, setWallet, setTheme, setDex, setClosedOpenOrders, setTopTokens, refreshState } = stateSlice.actions;

export default stateSlice.reducer;
