// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.ExchangeStartTransactionRequest = factory(root.KaitaiStream);
  }
}(typeof self !== 'undefined' ? self : this, function (KaitaiStream) {
var ExchangeStartTransactionRequest = (function() {
  ExchangeStartTransactionRequest.Subcommand = Object.freeze({
    SWAP: 0,
    SELL: 1,
    FUND: 2,

    0: "SWAP",
    1: "SELL",
    2: "FUND",
  });

  ExchangeStartTransactionRequest.RateType = Object.freeze({
    FIXED: 0,
    FLOATING: 1,

    0: "FIXED",
    1: "FLOATING",
  });

  function ExchangeStartTransactionRequest(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;
    this._debug = {};

    this._read();
  }
  ExchangeStartTransactionRequest.prototype._read = function() {
    this._debug.instructionClass = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.instructionClass = this._io.readBytes(1);
    this._debug.instructionClass.end = this._io.pos;
    if (!((KaitaiStream.byteArrayCompare(this.instructionClass, [224]) == 0))) {
      throw new KaitaiStream.ValidationNotEqualError([224], this.instructionClass, this._io, "/seq/0");
    }
    this._debug.instruction = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.instruction = this._io.readBytes(1);
    this._debug.instruction.end = this._io.pos;
    if (!((KaitaiStream.byteArrayCompare(this.instruction, [3]) == 0))) {
      throw new KaitaiStream.ValidationNotEqualError([3], this.instruction, this._io, "/seq/1");
    }
    this._debug.p1 = { start: this._io.pos, ioOffset: this._io.byteOffset, enumName: "ExchangeStartTransactionRequest.RateType" };
    this.p1 = this._io.readU1();
    this._debug.p1.end = this._io.pos;
    this._debug.p2 = { start: this._io.pos, ioOffset: this._io.byteOffset, enumName: "ExchangeStartTransactionRequest.Subcommand" };
    this.p2 = this._io.readU1();
    this._debug.p2.end = this._io.pos;
  }

  return ExchangeStartTransactionRequest;
})();
return ExchangeStartTransactionRequest;
}));
