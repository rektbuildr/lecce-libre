import ExchangeGetVersionRequest from './payloads/ExchangeGetVersionRequest.js';
import ExchangeGetVersionResponse from './payloads/ExchangeGetVersionResponse.js';
import ExchangeStartTransactionRequest from './payloads/ExchangeStartTransactionRequest.js';
import ExchangeStartTransactionResponse from './payloads/ExchangeStartTransactionResponse.js';
import ExchangeSetPartnerPublicKeyRequest from './payloads/ExchangeSetPartnerPublicKeyRequest.js';
import ExchangeSetPartnerPublicKeyResponse from './payloads/ExchangeSetPartnerPublicKeyResponse.js';
import { KaitaiStream } from "kaitai-struct";

const decoders = [
  s => new ExchangeGetVersionRequest(s),
  s => new ExchangeGetVersionResponse(s),
  s => new ExchangeStartTransactionRequest(s),
  s => new ExchangeStartTransactionResponse(s),
  s => new ExchangeSetPartnerPublicKeyRequest(s),
  s => new ExchangeSetPartnerPublicKeyResponse(s)
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

const payload = Buffer.from("e003000100", "hex");
const message = tryDecode(payload);

if (message == undefined) {
  console.error('failed decoding');
} else {
  // console.log(message)
  console.log(message._debug)
}
