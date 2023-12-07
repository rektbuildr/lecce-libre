import type { AppManifest } from "./types";

/**
 * This signature is to be compatible with track method of `segment.js` file in LLM and LLD
 * `` in jsflow
 * { @ link @ledger-desktop/ renderer/anal ytics/segment#track }
 */
type TrackWalletAPI = (
  event: string,
  properties: Record<string, any> | null,
  mandatory: boolean | null,
) => void;

/**
 * Obtain Event data from WalletAPI App manifest
 *
 * @param {AppManifest} manifest
 * @returns Object - event data
 */
function getEventData(manifest: AppManifest) {
  return { walletAPI: manifest.name };
}

/**
 * Wrap call to underlying trackCall function.
 * @param trackCall
 * @returns a dictionary of event to trigger.
 */
// Disabling explicit module boundary types as we're using const
// in order to get the exact type matching the tracking wrapper API
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function trackingWrapper(trackCall: TrackWalletAPI) {
  const track = (event: string, properties: Record<string, any> | null) =>
    trackCall(event, properties, null);

  return {
    // Failed to load the iframe
    load: (manifest: AppManifest) => {
     // );
    },

    // Failed to load the iframe
    reload: (manifest: AppManifest) => {
     // );
    },

    // Failed to load the iframe
    loadFail: (manifest: AppManifest) => {
      // TODO: handle iframe failed
     // );
    },

    // Successfully loaded the iframe
    loadSuccess: (manifest: AppManifest) => {
     // );
    },

    // Sign transaction modal open
    signTransactionRequested: (manifest: AppManifest) => {
     // );
    },

    // Failed to sign transaction (cancel or error)
    signTransactionFail: (manifest: AppManifest) => {
     // );
    },

    // Successfully signed transaction
    signTransactionSuccess: (manifest: AppManifest) => {
     // );
    },

    // Select account modal open
    requestAccountRequested: (manifest: AppManifest) => {
     // );
    },

    // Failed to select account (cancel or error)
    requestAccountFail: (manifest: AppManifest) => {
     // );
    },

    // The user successfully selected an account
    requestAccountSuccess: (manifest: AppManifest) => {
     // );
    },

    // Select account modal open
    receiveRequested: (manifest: AppManifest) => {
     // );
    },

    // Failed to select account (cancel or error)
    receiveFail: (manifest: AppManifest) => {
     // );
    },

    // The user successfully selected an account
    receiveSuccess: (manifest: AppManifest) => {
     // );
    },

    // Failed to broadcast a signed transaction
    broadcastFail: (manifest: AppManifest) => {
     // );
    },

    // Successfully broadcast a signed transaction
    broadcastSuccess: (manifest: AppManifest) => {
     // );
    },

    // Successfully broadcast a signed transaction
    broadcastOperationDetailsClick: (manifest: AppManifest) => {
     // );
    },

    // Generate Exchange nonce modal open
    startExchangeRequested: (manifest: AppManifest) => {
     // );
    },

    // Successfully generated an Exchange app nonce
    startExchangeSuccess: (manifest: AppManifest) => {
     // );
    },

    // Failed to generate an Exchange app nonce
    startExchangeFail: (manifest: AppManifest) => {
     // );
    },

    completeExchangeRequested: (manifest: AppManifest) => {
     // );
    },

    // Successfully completed an Exchange
    completeExchangeSuccess: (manifest: AppManifest) => {
     // );
    },

    // Failed to complete an Exchange
    completeExchangeFail: (manifest: AppManifest) => {
     // );
    },

    signMessageRequested: (manifest: AppManifest) => {
     // );
    },

    signMessageSuccess: (manifest: AppManifest) => {
     // );
    },

    signMessageFail: (manifest: AppManifest) => {
     // );
    },

    signMessageUserRefused: (manifest: AppManifest) => {
     // );
    },
    deviceTransportRequested: (manifest: AppManifest) => {
     // );
    },
    deviceTransportSuccess: (manifest: AppManifest) => {
     // );
    },
    deviceTransportFail: (manifest: AppManifest) => {
     // );
    },
    deviceSelectRequested: (manifest: AppManifest) => {
     // );
    },
    deviceSelectSuccess: (manifest: AppManifest) => {
     // );
    },
    deviceSelectFail: (manifest: AppManifest) => {
     // );
    },
    deviceOpenRequested: (manifest: AppManifest) => {
     // );
    },
    deviceExchangeRequested: (manifest: AppManifest) => {
     // );
    },
    deviceExchangeSuccess: (manifest: AppManifest) => {
     // );
    },
    deviceExchangeFail: (manifest: AppManifest) => {
     // );
    },
    deviceCloseRequested: (manifest: AppManifest) => {
     // );
    },
    deviceCloseSuccess: (manifest: AppManifest) => {
     // );
    },
    deviceCloseFail: (manifest: AppManifest) => {
     // );
    },
    bitcoinFamillyAccountXpubRequested: (manifest: AppManifest) => {
     // );
    },
    bitcoinFamillyAccountXpubFail: (manifest: AppManifest) => {
     // );
    },
    bitcoinFamillyAccountXpubSuccess: (manifest: AppManifest) => {
     // );
    },
  } as const;
}

export type TrackingAPI = ReturnType<typeof trackingWrapper>;
