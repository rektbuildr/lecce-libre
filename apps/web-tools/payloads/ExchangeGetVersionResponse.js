// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.ExchangeGetVersionResponse = factory(root.KaitaiStream);
  }
}(typeof self !== 'undefined' ? self : this, function (KaitaiStream) {
var ExchangeGetVersionResponse = (function() {
  function ExchangeGetVersionResponse(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;
    this._debug = {};

    this._read();
  }
  ExchangeGetVersionResponse.prototype._read = function() {
    this._debug.major = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.major = this._io.readS1();
    this._debug.major.end = this._io.pos;
    this._debug.minor = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.minor = this._io.readS1();
    this._debug.minor.end = this._io.pos;
    this._debug.increment = { start: this._io.pos, ioOffset: this._io.byteOffset };
    this.increment = this._io.readS1();
    this._debug.increment.end = this._io.pos;
  }

  return ExchangeGetVersionResponse;
})();
return ExchangeGetVersionResponse;
}));
