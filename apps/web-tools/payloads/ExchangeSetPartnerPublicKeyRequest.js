// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.ExchangeSetPartnerPublicKeyRequest = factory(root.KaitaiStream);
  }
}(typeof self !== 'undefined' ? self : this, function (KaitaiStream) {
var ExchangeSetPartnerPublicKeyRequest = (function() {
  ExchangeSetPartnerPublicKeyRequest.Subcommand = Object.freeze({
    SWAP: 0,
    SELL: 1,
    FUND: 2,

    0: "SWAP",
    1: "SELL",
    2: "FUND",
  });

  ExchangeSetPartnerPublicKeyRequest.RateType = Object.freeze({
    FIXED: 0,
    FLOATING: 1,

    0: "FIXED",
    1: "FLOATING",
  });

  function ExchangeSetPartnerPublicKeyRequest(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;
    this._debug = {};

    this._read();
  }
  ExchangeSetPartnerPublicKeyRequest.prototype._read = function() {
    this._debug.instructionClass = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.instructionClass = this._io.readBytes(1);
    this._debug.instructionClass.end = this._io.pos;
    if (!((KaitaiStream.byteArrayCompare(this.instructionClass, [224]) == 0))) {
      throw new KaitaiStream.ValidationNotEqualError([224], this.instructionClass, this._io, "/seq/0");
    }
    this._debug.instruction = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.instruction = this._io.readBytes(1);
    this._debug.instruction.end = this._io.pos;
    if (!((KaitaiStream.byteArrayCompare(this.instruction, [4]) == 0))) {
      throw new KaitaiStream.ValidationNotEqualError([4], this.instruction, this._io, "/seq/1");
    }
    this._debug.p1 = { start: this._io.pos, ioOffset: this._io.byteOffset, enumName: "ExchangeSetPartnerPublicKeyRequest.RateType" };
    this.p1 = this._io.readU1();
    this._debug.p1.end = this._io.pos;
    this._debug.p2 = { start: this._io.pos, ioOffset: this._io.byteOffset, enumName: "ExchangeSetPartnerPublicKeyRequest.Subcommand" };
    this.p2 = this._io.readU1();
    this._debug.p2.end = this._io.pos;
    this._debug.dataLen = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.dataLen = this._io.readU1();
    this._debug.dataLen.end = this._io.pos;
    this._debug.nameLen = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.nameLen = this._io.readU1();
    this._debug.nameLen.end = this._io.pos;
    this._debug.name = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.name = KaitaiStream.bytesToStr(this._io.readBytes(this.nameLen), "ASCII");
    this._debug.name.end = this._io.pos;
    this._debug.partnerPublicKey = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.partnerPublicKey = KaitaiStream.bytesToStr(this._io.readBytes(65), "ASCII");
    this._debug.partnerPublicKey.end = this._io.pos;
  }

  return ExchangeSetPartnerPublicKeyRequest;
})();
return ExchangeSetPartnerPublicKeyRequest;
}));
