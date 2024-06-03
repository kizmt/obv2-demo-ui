import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import EmptyWallet from "./emptyWallet";


export function FakeProvider(connection: Connection): AnchorProvider {
  return new AnchorProvider(
    connection,
    new EmptyWallet(Keypair.generate()),
    {
      /** disable transaction verification step */
      skipPreflight: true,
      /** desired commitment level */
      commitment: "confirmed",
      /** preflight commitment level */
      preflightCommitment: "confirmed",
      /** Maximum number of times for the RPC node to retry sending the transaction to the leader. */
      maxRetries: 3,
      /** The minimum slot that the request can be evaluated at */
      minContextSlot: 10,
    }
  );
}
export function Provider(connection: Connection, wallet:any): AnchorProvider {
  return new AnchorProvider(
    connection,
    wallet,
    {
      /** disable transaction verification step */
      skipPreflight: true,
      /** desired commitment level */
      commitment: "confirmed",
      /** preflight commitment level */
      preflightCommitment: "confirmed",
      /** Maximum number of times for the RPC node to retry sending the transaction to the leader. */
      maxRetries: 3,
      /** The minimum slot that the request can be evaluated at */
      minContextSlot: 10,
    }
  );
}
