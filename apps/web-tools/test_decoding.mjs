import ExchangeStartTransactionRequest from './payloads/ExchangeStartTransactionRequest.js';
import ExchangeStartTransactionResponse from './payloads/ExchangeStartTransactionResponse.js';
import { KaitaiStream } from "kaitai-struct";

const decoders = [
  s => new ExchangeStartTransactionRequest(s),
  s => new ExchangeStartTransactionResponse(s)
]

function tryDecode(payload) {
  for (const decoder of decoders) {
    try {
      return decoder(new KaitaiStream(payload));
    } catch (error) {
      console.warn('Not a', decoder, ": ", error);
    }
  }
  return undefined;
}

const payload = Buffer.from("e0030001", "hex");
const message = tryDecode(payload);

if (message == undefined) {
  console.error('failed decoding');
} else {
  // console.log(message)
  console.log(message._debug)
}
