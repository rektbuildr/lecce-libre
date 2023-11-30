// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.ExchangeGetVersionRequest = factory(root.KaitaiStream);
  }
}(typeof self !== 'undefined' ? self : this, function (KaitaiStream) {
var ExchangeGetVersionRequest = (function() {
  function ExchangeGetVersionRequest(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;
    this._debug = {};

    this._read();
  }
  ExchangeGetVersionRequest.prototype._read = function() {
    this._debug.instructionClass = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.instructionClass = this._io.readBytes(1);
    this._debug.instructionClass.end = this._io.pos;
    if (!((KaitaiStream.byteArrayCompare(this.instructionClass, [224]) == 0))) {
      throw new KaitaiStream.ValidationNotEqualError([224], this.instructionClass, this._io, "/seq/0");
    }
    this._debug.instruction = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.instruction = this._io.readBytes(1);
    this._debug.instruction.end = this._io.pos;
    if (!((KaitaiStream.byteArrayCompare(this.instruction, [2]) == 0))) {
      throw new KaitaiStream.ValidationNotEqualError([2], this.instruction, this._io, "/seq/1");
    }
    this._debug.p1 = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.p1 = this._io.readBytes(1);
    this._debug.p1.end = this._io.pos;
    if (!((KaitaiStream.byteArrayCompare(this.p1, [0]) == 0))) {
      throw new KaitaiStream.ValidationNotEqualError([0], this.p1, this._io, "/seq/2");
    }
    this._debug.p2 = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.p2 = this._io.readBytes(1);
    this._debug.p2.end = this._io.pos;
    if (!((KaitaiStream.byteArrayCompare(this.p2, [0]) == 0))) {
      throw new KaitaiStream.ValidationNotEqualError([0], this.p2, this._io, "/seq/3");
    }
    this._debug.dataLen = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.dataLen = this._io.readBytes(1);
    this._debug.dataLen.end = this._io.pos;
    if (!((KaitaiStream.byteArrayCompare(this.dataLen, [0]) == 0))) {
      throw new KaitaiStream.ValidationNotEqualError([0], this.dataLen, this._io, "/seq/4");
    }
  }

  return ExchangeGetVersionRequest;
})();
return ExchangeGetVersionRequest;
}));
