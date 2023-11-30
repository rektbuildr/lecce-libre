// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.ExchangeStartTransactionResponse = factory(root.KaitaiStream);
  }
}(typeof self !== 'undefined' ? self : this, function (KaitaiStream) {
var ExchangeStartTransactionResponse = (function() {
  function ExchangeStartTransactionResponse(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;
    this._debug = {};

    this._read();
  }
  ExchangeStartTransactionResponse.prototype._read = function() {
    this._debug.transactionId = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.transactionId = KaitaiStream.bytesToStr(this._io.readBytes(10), "ASCII");
    this._debug.transactionId.end = this._io.pos;
  }

  return ExchangeStartTransactionResponse;
})();
return ExchangeStartTransactionResponse;
}));
