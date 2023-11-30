// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.BitcoinTransaction = factory(root.KaitaiStream);
  }
}(typeof self !== 'undefined' ? self : this, function (KaitaiStream) {
/**
 * @see {@link https://bitcoin.org/en/developer-guide#transactions
 * https://en.bitcoin.it/wiki/Transaction
 * |Source}
 */

var BitcoinTransaction = (function() {
  function BitcoinTransaction(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  BitcoinTransaction.prototype._read = function() {
    this.version = this._io.readU4le();
    this.numVins = this._io.readU1();
    this.vins = [];
    for (var i = 0; i < this.numVins; i++) {
      this.vins.push(new Vin(this._io, this, this._root));
    }
    this.numVouts = this._io.readU1();
    this.vouts = [];
    for (var i = 0; i < this.numVouts; i++) {
      this.vouts.push(new Vout(this._io, this, this._root));
    }
    this.locktime = this._io.readU4le();
  }

  var Vin = BitcoinTransaction.Vin = (function() {
    function Vin(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    Vin.prototype._read = function() {
      this.txid = this._io.readBytes(32);
      this.outputId = this._io.readU4le();
      this.lenScript = this._io.readU1();
      this._raw_scriptSig = this._io.readBytes(this.lenScript);
      var _io__raw_scriptSig = new KaitaiStream(this._raw_scriptSig);
      this.scriptSig = new ScriptSignature(_io__raw_scriptSig, this, this._root);
      this.endOfVin = this._io.readBytes(4);
      if (!((KaitaiStream.byteArrayCompare(this.endOfVin, [255, 255, 255, 255]) == 0))) {
        throw new KaitaiStream.ValidationNotEqualError([255, 255, 255, 255], this.endOfVin, this._io, "/types/vin/seq/4");
      }
    }

    var ScriptSignature = Vin.ScriptSignature = (function() {
      ScriptSignature.SighashType = Object.freeze({
        SIGHASH_ALL: 1,
        SIGHASH_NONE: 2,
        SIGHASH_SINGLE: 3,
        SIGHASH_ANYONECANPAY: 80,

        1: "SIGHASH_ALL",
        2: "SIGHASH_NONE",
        3: "SIGHASH_SINGLE",
        80: "SIGHASH_ANYONECANPAY",
      });

      function ScriptSignature(_io, _parent, _root) {
        this._io = _io;
        this._parent = _parent;
        this._root = _root || this;

        this._read();
      }
      ScriptSignature.prototype._read = function() {
        this.lenSigStack = this._io.readU1();
        this.derSig = new DerSignature(this._io, this, this._root);
        this.sigType = this._io.readU1();
        this.lenPubkeyStack = this._io.readU1();
        this.pubkey = new PublicKey(this._io, this, this._root);
      }

      var DerSignature = ScriptSignature.DerSignature = (function() {
        function DerSignature(_io, _parent, _root) {
          this._io = _io;
          this._parent = _parent;
          this._root = _root || this;

          this._read();
        }
        DerSignature.prototype._read = function() {
          this.sequence = this._io.readBytes(1);
          if (!((KaitaiStream.byteArrayCompare(this.sequence, [48]) == 0))) {
            throw new KaitaiStream.ValidationNotEqualError([48], this.sequence, this._io, "/types/vin/types/script_signature/types/der_signature/seq/0");
          }
          this.lenSig = this._io.readU1();
          this.sep1 = this._io.readBytes(1);
          if (!((KaitaiStream.byteArrayCompare(this.sep1, [2]) == 0))) {
            throw new KaitaiStream.ValidationNotEqualError([2], this.sep1, this._io, "/types/vin/types/script_signature/types/der_signature/seq/2");
          }
          this.lenSigR = this._io.readU1();
          this.sigR = this._io.readBytes(this.lenSigR);
          this.sep2 = this._io.readBytes(1);
          if (!((KaitaiStream.byteArrayCompare(this.sep2, [2]) == 0))) {
            throw new KaitaiStream.ValidationNotEqualError([2], this.sep2, this._io, "/types/vin/types/script_signature/types/der_signature/seq/5");
          }
          this.lenSigS = this._io.readU1();
          this.sigS = this._io.readBytes(this.lenSigS);
        }

        /**
         * 'r' value's length.
         */

        /**
         * 'r' value of the ECDSA signature.
         * @see {@link https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm|Source}
         */

        /**
         * 's' value's length.
         */

        /**
         * 's' value of the ECDSA signature.
         * @see {@link https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm|Source}
         */

        return DerSignature;
      })();

      var PublicKey = ScriptSignature.PublicKey = (function() {
        function PublicKey(_io, _parent, _root) {
          this._io = _io;
          this._parent = _parent;
          this._root = _root || this;

          this._read();
        }
        PublicKey.prototype._read = function() {
          this.type = this._io.readU1();
          this.x = this._io.readBytes(32);
          this.y = this._io.readBytes(32);
        }

        /**
         * 'x' coordinate of the public key on the elliptic curve.
         */

        /**
         * 'y' coordinate of the public key on the elliptic curve.
         */

        return PublicKey;
      })();

      /**
       * DER-encoded ECDSA signature.
       * @see {@link https://en.wikipedia.org/wiki/X.690#DER_encoding
       * https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm
       * |Source}
       */

      /**
       * Type of signature.
       */

      /**
       * Public key (bitcoin address of the recipient).
       */

      return ScriptSignature;
    })();

    /**
     * Previous transaction hash.
     */

    /**
     * ID indexing an ouput of the transaction refered by txid.
     * This output will be used as an input in the present transaction.
     */

    /**
     * ScriptSig's length.
     */

    /**
     * ScriptSig.
     * @see {@link https://en.bitcoin.it/wiki/Transaction#Input
     * https://en.bitcoin.it/wiki/Script
     * |Source}
     */

    /**
     * Magic number indicating the end of the current input.
     */

    return Vin;
  })();

  var Vout = BitcoinTransaction.Vout = (function() {
    function Vout(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    Vout.prototype._read = function() {
      this.amount = this._io.readU8le();
      this.lenScript = this._io.readU1();
      this.scriptPubKey = this._io.readBytes(this.lenScript);
    }

    /**
     * Number of Satoshis to be transfered.
     */

    /**
     * ScriptPubKey's length.
     */

    /**
     * ScriptPubKey.
     * @see {@link https://en.bitcoin.it/wiki/Transaction#Output
     * https://en.bitcoin.it/wiki/Script
     * |Source}
     */

    return Vout;
  })();

  /**
   * Version number.
   */

  /**
   * Number of input transactions.
   */

  /**
   * Input transactions.
   * An input refers to an output from a previous transaction.
   */

  /**
   * Number of output transactions.
   */

  /**
   * Output transactions.
   */

  return BitcoinTransaction;
})();
return BitcoinTransaction;
}));
