// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.ExchangeSetPartnerPublicKeyResponse = factory(root.KaitaiStream);
  }
}(typeof self !== 'undefined' ? self : this, function (KaitaiStream) {
var ExchangeSetPartnerPublicKeyResponse = (function() {
  ExchangeSetPartnerPublicKeyResponse.Status = Object.freeze({
    DENIED_BY_USER: 27013,
    INCORRECT_COMMAND_DATA: 27264,
    DESERIALIZATION_FAILED: 27265,
    WRONG_TRANSACTION_ID: 27266,
    INVALID_ADDRESS: 27267,
    USER_REFUSED: 27268,
    INTERNAL_ERROR: 27269,
    WRONG_PARAMETERS: 27270,
    WRONG_DATA_LENGTH: 27271,
    UNSUPPORTED_INSTRUCTION: 27904,
    UNSUPPORTED_INSTRUCTION_CLASS: 28160,
    SUCCESS: 36864,
    INCORRECT_SIGNATURE: 40218,
    WRONG_RESPONSE_LENGTH: 45056,
    BAD_STATE: 45063,
    SIGNATURE_FAILED: 45064,
    EXECUTION_INTERRUPTED: 57344,

    27013: "DENIED_BY_USER",
    27264: "INCORRECT_COMMAND_DATA",
    27265: "DESERIALIZATION_FAILED",
    27266: "WRONG_TRANSACTION_ID",
    27267: "INVALID_ADDRESS",
    27268: "USER_REFUSED",
    27269: "INTERNAL_ERROR",
    27270: "WRONG_PARAMETERS",
    27271: "WRONG_DATA_LENGTH",
    27904: "UNSUPPORTED_INSTRUCTION",
    28160: "UNSUPPORTED_INSTRUCTION_CLASS",
    36864: "SUCCESS",
    40218: "INCORRECT_SIGNATURE",
    45056: "WRONG_RESPONSE_LENGTH",
    45063: "BAD_STATE",
    45064: "SIGNATURE_FAILED",
    57344: "EXECUTION_INTERRUPTED",
  });

  function ExchangeSetPartnerPublicKeyResponse(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;
    this._debug = {};

    this._read();
  }
  ExchangeSetPartnerPublicKeyResponse.prototype._read = function() {
    this._debug.status = { start: this._io.pos, ioOffset: this._io.byteOffset, enumName: "ExchangeSetPartnerPublicKeyResponse.Status" };
    this.status = this._io.readU2be();
    this._debug.status.end = this._io.pos;
  }

  return ExchangeSetPartnerPublicKeyResponse;
})();
return ExchangeSetPartnerPublicKeyResponse;
}));
