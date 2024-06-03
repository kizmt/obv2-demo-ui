import { PublicKey } from "@solana/web3.js";

export interface MARKET {
  address: PublicKey;
  account: any;
  empty:boolean;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseToken: any;
  quoteToken: any;
  baseDecimals: number;
  quoteDecimals: number;
  programId: PublicKey;
  makerFee?: number;
  takerFee?: number;
  bidsAddress: PublicKey;
  asksAddress: PublicKey;
}

export interface ORDERBOOK_ORDER {
  price: number;
  size: number;
  side: string;
  clientOrderId: string;
  owner: PublicKey;
  userInOrder: boolean;
}