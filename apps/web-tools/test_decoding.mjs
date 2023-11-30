import ExchangeGetVersionRequest from './payloads/ExchangeGetVersionRequest.js';
import ExchangeGetVersionResponse from './payloads/ExchangeGetVersionResponse.js';
import ExchangeStartTransactionRequest from './payloads/ExchangeStartTransactionRequest.js';
import ExchangeStartTransactionResponse from './payloads/ExchangeStartTransactionResponse.js';
import ExchangeSetPartnerPublicKeyRequest from './payloads/ExchangeSetPartnerPublicKeyRequest.js';
import ExchangeSetPartnerPublicKeyResponse from './payloads/ExchangeSetPartnerPublicKeyResponse.js';
import { KaitaiStream } from "kaitai-struct";

const decoders = [
  s => new ExchangeStartTransactionRequest(s),
  s => new ExchangeSetPartnerPublicKeyRequest(s),
  s => new ExchangeGetVersionRequest(s),
  s => new ExchangeSetPartnerPublicKeyResponse(s),
  s => new ExchangeStartTransactionResponse(s),
  s => new ExchangeGetVersionResponse(s)
]

function tryDecode(payload) {
  for (const decoder of decoders) {
    try {
      return decoder(new KaitaiStream(payload));
    } catch (error) {
      // console.warn('Not a', decoder, ": ", error);
    }
  }
  return undefined;
}

const start_transaction_request = Buffer.from("e003010000", "hex");
const start_transaction_response = Buffer.from("42505a4f4d4f5348504e9000", "hex");
const set_partner_public_key_request = Buffer.from("e00401004b094368616e67656c6c790480d7c0d3a9183597395f58dda05999328da6f18fabd5cda0aff8e8e3fc633436a2dbf48ecb23d40df7c3c7d3e774b77b4b5df0e9f7e08cf1cdf2dba788eb085b", "hex");
const set_partner_public_key_response = Buffer.from("9000", "hex");
const message = tryDecode(set_partner_public_key_response);

if (message == undefined) {
  console.error('failed decoding');
} else {
  // console.log(message)
  console.log(message._debug)
}
