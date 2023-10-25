import type {
  LoadConfig,
  LedgerEthTransactionResolution,
} from "@ledgerhq/hw-app-eth/lib/services/types";
import { EIP712Message } from "@ledgerhq/types-live";

export type EvmAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};

export type EvmSignature = {
  s: string;
  v: string | number;
  r: string;
};

export interface EvmSigner {
  setLoadConfig(loadConfig: LoadConfig): void;
  getAddress(path: string, boolDisplay?: boolean, boolChaincode?: boolean): Promise<EvmAddress>;
  signTransaction(
    path: string,
    rawTxHex: string,
    resolution?: LedgerEthTransactionResolution | null,
  ): Promise<EvmSignature>;
  signPersonalMessage(
    path: string,
    messageHex: string,
  ): Promise<{
    v: number;
    s: string;
    r: string;
  }>;
  signEIP712HashedMessage(
    path: string,
    domainSeparatorHex: string,
    hashStructMessageHex: string,
  ): Promise<{
    v: number;
    s: string;
    r: string;
  }>;
  signEIP712Message(
    path: string,
    jsonMessage: EIP712Message,
    fullImplem?: boolean,
  ): Promise<{
    v: number;
    s: string;
    r: string;
  }>;
}
