import { PublicKey } from "@solana/web3.js";
import { FakeProvider } from "./useOpenbookClient";
import { IDL, OPENBOOK_PROGRAM_ID } from "openbook-v2";
import * as anchor from '@coral-xyz/anchor';


export const V2_DECODE_ONCHAIN = async (connection, address, toDecode) => {

  let response = await connection.getAccountInfo(new PublicKey(address), "confirmed");
  try {
    let rawResponse = response.data;
    const decodedData = Buffer.from(rawResponse, 'base64');
    const provider = new FakeProvider(connection)
    const program = new anchor.Program(IDL, OPENBOOK_PROGRAM_ID, provider);
    const deserializedData = program.coder.accounts.decode(toDecode, decodedData);
    return deserializedData;
  }
  catch(e) {
    return {
      error: e,
      result: response,
      message:"Something went wrong"
    }
  }
}