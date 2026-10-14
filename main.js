/*
Obsidian Messenger — vault-local markdown message bus.
Built from src/. See SPEC.md for the protocol.
*/

"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/tweetnacl/nacl-fast.js
var require_nacl_fast = __commonJS({
  "node_modules/tweetnacl/nacl-fast.js"(exports, module2) {
    (function(nacl6) {
      "use strict";
      var gf = function(init) {
        var i, r = new Float64Array(16);
        if (init) for (i = 0; i < init.length; i++) r[i] = init[i];
        return r;
      };
      var randombytes = function() {
        throw new Error("no PRNG");
      };
      var _0 = new Uint8Array(16);
      var _9 = new Uint8Array(32);
      _9[0] = 9;
      var gf0 = gf(), gf1 = gf([1]), _121665 = gf([56129, 1]), D = gf([30883, 4953, 19914, 30187, 55467, 16705, 2637, 112, 59544, 30585, 16505, 36039, 65139, 11119, 27886, 20995]), D2 = gf([61785, 9906, 39828, 60374, 45398, 33411, 5274, 224, 53552, 61171, 33010, 6542, 64743, 22239, 55772, 9222]), X = gf([54554, 36645, 11616, 51542, 42930, 38181, 51040, 26924, 56412, 64982, 57905, 49316, 21502, 52590, 14035, 8553]), Y = gf([26200, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214]), I = gf([41136, 18958, 6951, 50414, 58488, 44335, 6150, 12099, 55207, 15867, 153, 11085, 57099, 20417, 9344, 11139]);
      function ts64(x, i, h, l) {
        x[i] = h >> 24 & 255;
        x[i + 1] = h >> 16 & 255;
        x[i + 2] = h >> 8 & 255;
        x[i + 3] = h & 255;
        x[i + 4] = l >> 24 & 255;
        x[i + 5] = l >> 16 & 255;
        x[i + 6] = l >> 8 & 255;
        x[i + 7] = l & 255;
      }
      function vn(x, xi, y, yi, n) {
        var i, d = 0;
        for (i = 0; i < n; i++) d |= x[xi + i] ^ y[yi + i];
        return (1 & d - 1 >>> 8) - 1;
      }
      function crypto_verify_16(x, xi, y, yi) {
        return vn(x, xi, y, yi, 16);
      }
      function crypto_verify_32(x, xi, y, yi) {
        return vn(x, xi, y, yi, 32);
      }
      function core_salsa20(o, p, k, c) {
        var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
        var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
        for (var i = 0; i < 20; i += 2) {
          u = x0 + x12 | 0;
          x4 ^= u << 7 | u >>> 32 - 7;
          u = x4 + x0 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x4 | 0;
          x12 ^= u << 13 | u >>> 32 - 13;
          u = x12 + x8 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x1 | 0;
          x9 ^= u << 7 | u >>> 32 - 7;
          u = x9 + x5 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x9 | 0;
          x1 ^= u << 13 | u >>> 32 - 13;
          u = x1 + x13 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x6 | 0;
          x14 ^= u << 7 | u >>> 32 - 7;
          u = x14 + x10 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x14 | 0;
          x6 ^= u << 13 | u >>> 32 - 13;
          u = x6 + x2 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x11 | 0;
          x3 ^= u << 7 | u >>> 32 - 7;
          u = x3 + x15 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x3 | 0;
          x11 ^= u << 13 | u >>> 32 - 13;
          u = x11 + x7 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
          u = x0 + x3 | 0;
          x1 ^= u << 7 | u >>> 32 - 7;
          u = x1 + x0 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x1 | 0;
          x3 ^= u << 13 | u >>> 32 - 13;
          u = x3 + x2 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x4 | 0;
          x6 ^= u << 7 | u >>> 32 - 7;
          u = x6 + x5 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x6 | 0;
          x4 ^= u << 13 | u >>> 32 - 13;
          u = x4 + x7 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x9 | 0;
          x11 ^= u << 7 | u >>> 32 - 7;
          u = x11 + x10 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x11 | 0;
          x9 ^= u << 13 | u >>> 32 - 13;
          u = x9 + x8 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x14 | 0;
          x12 ^= u << 7 | u >>> 32 - 7;
          u = x12 + x15 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x12 | 0;
          x14 ^= u << 13 | u >>> 32 - 13;
          u = x14 + x13 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
        }
        x0 = x0 + j0 | 0;
        x1 = x1 + j1 | 0;
        x2 = x2 + j2 | 0;
        x3 = x3 + j3 | 0;
        x4 = x4 + j4 | 0;
        x5 = x5 + j5 | 0;
        x6 = x6 + j6 | 0;
        x7 = x7 + j7 | 0;
        x8 = x8 + j8 | 0;
        x9 = x9 + j9 | 0;
        x10 = x10 + j10 | 0;
        x11 = x11 + j11 | 0;
        x12 = x12 + j12 | 0;
        x13 = x13 + j13 | 0;
        x14 = x14 + j14 | 0;
        x15 = x15 + j15 | 0;
        o[0] = x0 >>> 0 & 255;
        o[1] = x0 >>> 8 & 255;
        o[2] = x0 >>> 16 & 255;
        o[3] = x0 >>> 24 & 255;
        o[4] = x1 >>> 0 & 255;
        o[5] = x1 >>> 8 & 255;
        o[6] = x1 >>> 16 & 255;
        o[7] = x1 >>> 24 & 255;
        o[8] = x2 >>> 0 & 255;
        o[9] = x2 >>> 8 & 255;
        o[10] = x2 >>> 16 & 255;
        o[11] = x2 >>> 24 & 255;
        o[12] = x3 >>> 0 & 255;
        o[13] = x3 >>> 8 & 255;
        o[14] = x3 >>> 16 & 255;
        o[15] = x3 >>> 24 & 255;
        o[16] = x4 >>> 0 & 255;
        o[17] = x4 >>> 8 & 255;
        o[18] = x4 >>> 16 & 255;
        o[19] = x4 >>> 24 & 255;
        o[20] = x5 >>> 0 & 255;
        o[21] = x5 >>> 8 & 255;
        o[22] = x5 >>> 16 & 255;
        o[23] = x5 >>> 24 & 255;
        o[24] = x6 >>> 0 & 255;
        o[25] = x6 >>> 8 & 255;
        o[26] = x6 >>> 16 & 255;
        o[27] = x6 >>> 24 & 255;
        o[28] = x7 >>> 0 & 255;
        o[29] = x7 >>> 8 & 255;
        o[30] = x7 >>> 16 & 255;
        o[31] = x7 >>> 24 & 255;
        o[32] = x8 >>> 0 & 255;
        o[33] = x8 >>> 8 & 255;
        o[34] = x8 >>> 16 & 255;
        o[35] = x8 >>> 24 & 255;
        o[36] = x9 >>> 0 & 255;
        o[37] = x9 >>> 8 & 255;
        o[38] = x9 >>> 16 & 255;
        o[39] = x9 >>> 24 & 255;
        o[40] = x10 >>> 0 & 255;
        o[41] = x10 >>> 8 & 255;
        o[42] = x10 >>> 16 & 255;
        o[43] = x10 >>> 24 & 255;
        o[44] = x11 >>> 0 & 255;
        o[45] = x11 >>> 8 & 255;
        o[46] = x11 >>> 16 & 255;
        o[47] = x11 >>> 24 & 255;
        o[48] = x12 >>> 0 & 255;
        o[49] = x12 >>> 8 & 255;
        o[50] = x12 >>> 16 & 255;
        o[51] = x12 >>> 24 & 255;
        o[52] = x13 >>> 0 & 255;
        o[53] = x13 >>> 8 & 255;
        o[54] = x13 >>> 16 & 255;
        o[55] = x13 >>> 24 & 255;
        o[56] = x14 >>> 0 & 255;
        o[57] = x14 >>> 8 & 255;
        o[58] = x14 >>> 16 & 255;
        o[59] = x14 >>> 24 & 255;
        o[60] = x15 >>> 0 & 255;
        o[61] = x15 >>> 8 & 255;
        o[62] = x15 >>> 16 & 255;
        o[63] = x15 >>> 24 & 255;
      }
      function core_hsalsa20(o, p, k, c) {
        var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
        var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
        for (var i = 0; i < 20; i += 2) {
          u = x0 + x12 | 0;
          x4 ^= u << 7 | u >>> 32 - 7;
          u = x4 + x0 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x4 | 0;
          x12 ^= u << 13 | u >>> 32 - 13;
          u = x12 + x8 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x1 | 0;
          x9 ^= u << 7 | u >>> 32 - 7;
          u = x9 + x5 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x9 | 0;
          x1 ^= u << 13 | u >>> 32 - 13;
          u = x1 + x13 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x6 | 0;
          x14 ^= u << 7 | u >>> 32 - 7;
          u = x14 + x10 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x14 | 0;
          x6 ^= u << 13 | u >>> 32 - 13;
          u = x6 + x2 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x11 | 0;
          x3 ^= u << 7 | u >>> 32 - 7;
          u = x3 + x15 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x3 | 0;
          x11 ^= u << 13 | u >>> 32 - 13;
          u = x11 + x7 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
          u = x0 + x3 | 0;
          x1 ^= u << 7 | u >>> 32 - 7;
          u = x1 + x0 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x1 | 0;
          x3 ^= u << 13 | u >>> 32 - 13;
          u = x3 + x2 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x4 | 0;
          x6 ^= u << 7 | u >>> 32 - 7;
          u = x6 + x5 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x6 | 0;
          x4 ^= u << 13 | u >>> 32 - 13;
          u = x4 + x7 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x9 | 0;
          x11 ^= u << 7 | u >>> 32 - 7;
          u = x11 + x10 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x11 | 0;
          x9 ^= u << 13 | u >>> 32 - 13;
          u = x9 + x8 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x14 | 0;
          x12 ^= u << 7 | u >>> 32 - 7;
          u = x12 + x15 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x12 | 0;
          x14 ^= u << 13 | u >>> 32 - 13;
          u = x14 + x13 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
        }
        o[0] = x0 >>> 0 & 255;
        o[1] = x0 >>> 8 & 255;
        o[2] = x0 >>> 16 & 255;
        o[3] = x0 >>> 24 & 255;
        o[4] = x5 >>> 0 & 255;
        o[5] = x5 >>> 8 & 255;
        o[6] = x5 >>> 16 & 255;
        o[7] = x5 >>> 24 & 255;
        o[8] = x10 >>> 0 & 255;
        o[9] = x10 >>> 8 & 255;
        o[10] = x10 >>> 16 & 255;
        o[11] = x10 >>> 24 & 255;
        o[12] = x15 >>> 0 & 255;
        o[13] = x15 >>> 8 & 255;
        o[14] = x15 >>> 16 & 255;
        o[15] = x15 >>> 24 & 255;
        o[16] = x6 >>> 0 & 255;
        o[17] = x6 >>> 8 & 255;
        o[18] = x6 >>> 16 & 255;
        o[19] = x6 >>> 24 & 255;
        o[20] = x7 >>> 0 & 255;
        o[21] = x7 >>> 8 & 255;
        o[22] = x7 >>> 16 & 255;
        o[23] = x7 >>> 24 & 255;
        o[24] = x8 >>> 0 & 255;
        o[25] = x8 >>> 8 & 255;
        o[26] = x8 >>> 16 & 255;
        o[27] = x8 >>> 24 & 255;
        o[28] = x9 >>> 0 & 255;
        o[29] = x9 >>> 8 & 255;
        o[30] = x9 >>> 16 & 255;
        o[31] = x9 >>> 24 & 255;
      }
      function crypto_core_salsa20(out, inp, k, c) {
        core_salsa20(out, inp, k, c);
      }
      function crypto_core_hsalsa20(out, inp, k, c) {
        core_hsalsa20(out, inp, k, c);
      }
      var sigma = new Uint8Array([101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107]);
      function crypto_stream_salsa20_xor(c, cpos, m, mpos, b, n, k) {
        var z = new Uint8Array(16), x = new Uint8Array(64);
        var u, i;
        for (i = 0; i < 16; i++) z[i] = 0;
        for (i = 0; i < 8; i++) z[i] = n[i];
        while (b >= 64) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < 64; i++) c[cpos + i] = m[mpos + i] ^ x[i];
          u = 1;
          for (i = 8; i < 16; i++) {
            u = u + (z[i] & 255) | 0;
            z[i] = u & 255;
            u >>>= 8;
          }
          b -= 64;
          cpos += 64;
          mpos += 64;
        }
        if (b > 0) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < b; i++) c[cpos + i] = m[mpos + i] ^ x[i];
        }
        return 0;
      }
      function crypto_stream_salsa20(c, cpos, b, n, k) {
        var z = new Uint8Array(16), x = new Uint8Array(64);
        var u, i;
        for (i = 0; i < 16; i++) z[i] = 0;
        for (i = 0; i < 8; i++) z[i] = n[i];
        while (b >= 64) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < 64; i++) c[cpos + i] = x[i];
          u = 1;
          for (i = 8; i < 16; i++) {
            u = u + (z[i] & 255) | 0;
            z[i] = u & 255;
            u >>>= 8;
          }
          b -= 64;
          cpos += 64;
        }
        if (b > 0) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < b; i++) c[cpos + i] = x[i];
        }
        return 0;
      }
      function crypto_stream(c, cpos, d, n, k) {
        var s = new Uint8Array(32);
        crypto_core_hsalsa20(s, n, k, sigma);
        var sn = new Uint8Array(8);
        for (var i = 0; i < 8; i++) sn[i] = n[i + 16];
        return crypto_stream_salsa20(c, cpos, d, sn, s);
      }
      function crypto_stream_xor(c, cpos, m, mpos, d, n, k) {
        var s = new Uint8Array(32);
        crypto_core_hsalsa20(s, n, k, sigma);
        var sn = new Uint8Array(8);
        for (var i = 0; i < 8; i++) sn[i] = n[i + 16];
        return crypto_stream_salsa20_xor(c, cpos, m, mpos, d, sn, s);
      }
      var poly1305 = function(key) {
        this.buffer = new Uint8Array(16);
        this.r = new Uint16Array(10);
        this.h = new Uint16Array(10);
        this.pad = new Uint16Array(8);
        this.leftover = 0;
        this.fin = 0;
        var t0, t1, t2, t3, t4, t5, t6, t7;
        t0 = key[0] & 255 | (key[1] & 255) << 8;
        this.r[0] = t0 & 8191;
        t1 = key[2] & 255 | (key[3] & 255) << 8;
        this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
        t2 = key[4] & 255 | (key[5] & 255) << 8;
        this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
        t3 = key[6] & 255 | (key[7] & 255) << 8;
        this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
        t4 = key[8] & 255 | (key[9] & 255) << 8;
        this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
        this.r[5] = t4 >>> 1 & 8190;
        t5 = key[10] & 255 | (key[11] & 255) << 8;
        this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
        t6 = key[12] & 255 | (key[13] & 255) << 8;
        this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
        t7 = key[14] & 255 | (key[15] & 255) << 8;
        this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
        this.r[9] = t7 >>> 5 & 127;
        this.pad[0] = key[16] & 255 | (key[17] & 255) << 8;
        this.pad[1] = key[18] & 255 | (key[19] & 255) << 8;
        this.pad[2] = key[20] & 255 | (key[21] & 255) << 8;
        this.pad[3] = key[22] & 255 | (key[23] & 255) << 8;
        this.pad[4] = key[24] & 255 | (key[25] & 255) << 8;
        this.pad[5] = key[26] & 255 | (key[27] & 255) << 8;
        this.pad[6] = key[28] & 255 | (key[29] & 255) << 8;
        this.pad[7] = key[30] & 255 | (key[31] & 255) << 8;
      };
      poly1305.prototype.blocks = function(m, mpos, bytes2) {
        var hibit = this.fin ? 0 : 1 << 11;
        var t0, t1, t2, t3, t4, t5, t6, t7, c;
        var d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;
        var h0 = this.h[0], h1 = this.h[1], h2 = this.h[2], h3 = this.h[3], h4 = this.h[4], h5 = this.h[5], h6 = this.h[6], h7 = this.h[7], h8 = this.h[8], h9 = this.h[9];
        var r0 = this.r[0], r1 = this.r[1], r2 = this.r[2], r3 = this.r[3], r4 = this.r[4], r5 = this.r[5], r6 = this.r[6], r7 = this.r[7], r8 = this.r[8], r9 = this.r[9];
        while (bytes2 >= 16) {
          t0 = m[mpos + 0] & 255 | (m[mpos + 1] & 255) << 8;
          h0 += t0 & 8191;
          t1 = m[mpos + 2] & 255 | (m[mpos + 3] & 255) << 8;
          h1 += (t0 >>> 13 | t1 << 3) & 8191;
          t2 = m[mpos + 4] & 255 | (m[mpos + 5] & 255) << 8;
          h2 += (t1 >>> 10 | t2 << 6) & 8191;
          t3 = m[mpos + 6] & 255 | (m[mpos + 7] & 255) << 8;
          h3 += (t2 >>> 7 | t3 << 9) & 8191;
          t4 = m[mpos + 8] & 255 | (m[mpos + 9] & 255) << 8;
          h4 += (t3 >>> 4 | t4 << 12) & 8191;
          h5 += t4 >>> 1 & 8191;
          t5 = m[mpos + 10] & 255 | (m[mpos + 11] & 255) << 8;
          h6 += (t4 >>> 14 | t5 << 2) & 8191;
          t6 = m[mpos + 12] & 255 | (m[mpos + 13] & 255) << 8;
          h7 += (t5 >>> 11 | t6 << 5) & 8191;
          t7 = m[mpos + 14] & 255 | (m[mpos + 15] & 255) << 8;
          h8 += (t6 >>> 8 | t7 << 8) & 8191;
          h9 += t7 >>> 5 | hibit;
          c = 0;
          d0 = c;
          d0 += h0 * r0;
          d0 += h1 * (5 * r9);
          d0 += h2 * (5 * r8);
          d0 += h3 * (5 * r7);
          d0 += h4 * (5 * r6);
          c = d0 >>> 13;
          d0 &= 8191;
          d0 += h5 * (5 * r5);
          d0 += h6 * (5 * r4);
          d0 += h7 * (5 * r3);
          d0 += h8 * (5 * r2);
          d0 += h9 * (5 * r1);
          c += d0 >>> 13;
          d0 &= 8191;
          d1 = c;
          d1 += h0 * r1;
          d1 += h1 * r0;
          d1 += h2 * (5 * r9);
          d1 += h3 * (5 * r8);
          d1 += h4 * (5 * r7);
          c = d1 >>> 13;
          d1 &= 8191;
          d1 += h5 * (5 * r6);
          d1 += h6 * (5 * r5);
          d1 += h7 * (5 * r4);
          d1 += h8 * (5 * r3);
          d1 += h9 * (5 * r2);
          c += d1 >>> 13;
          d1 &= 8191;
          d2 = c;
          d2 += h0 * r2;
          d2 += h1 * r1;
          d2 += h2 * r0;
          d2 += h3 * (5 * r9);
          d2 += h4 * (5 * r8);
          c = d2 >>> 13;
          d2 &= 8191;
          d2 += h5 * (5 * r7);
          d2 += h6 * (5 * r6);
          d2 += h7 * (5 * r5);
          d2 += h8 * (5 * r4);
          d2 += h9 * (5 * r3);
          c += d2 >>> 13;
          d2 &= 8191;
          d3 = c;
          d3 += h0 * r3;
          d3 += h1 * r2;
          d3 += h2 * r1;
          d3 += h3 * r0;
          d3 += h4 * (5 * r9);
          c = d3 >>> 13;
          d3 &= 8191;
          d3 += h5 * (5 * r8);
          d3 += h6 * (5 * r7);
          d3 += h7 * (5 * r6);
          d3 += h8 * (5 * r5);
          d3 += h9 * (5 * r4);
          c += d3 >>> 13;
          d3 &= 8191;
          d4 = c;
          d4 += h0 * r4;
          d4 += h1 * r3;
          d4 += h2 * r2;
          d4 += h3 * r1;
          d4 += h4 * r0;
          c = d4 >>> 13;
          d4 &= 8191;
          d4 += h5 * (5 * r9);
          d4 += h6 * (5 * r8);
          d4 += h7 * (5 * r7);
          d4 += h8 * (5 * r6);
          d4 += h9 * (5 * r5);
          c += d4 >>> 13;
          d4 &= 8191;
          d5 = c;
          d5 += h0 * r5;
          d5 += h1 * r4;
          d5 += h2 * r3;
          d5 += h3 * r2;
          d5 += h4 * r1;
          c = d5 >>> 13;
          d5 &= 8191;
          d5 += h5 * r0;
          d5 += h6 * (5 * r9);
          d5 += h7 * (5 * r8);
          d5 += h8 * (5 * r7);
          d5 += h9 * (5 * r6);
          c += d5 >>> 13;
          d5 &= 8191;
          d6 = c;
          d6 += h0 * r6;
          d6 += h1 * r5;
          d6 += h2 * r4;
          d6 += h3 * r3;
          d6 += h4 * r2;
          c = d6 >>> 13;
          d6 &= 8191;
          d6 += h5 * r1;
          d6 += h6 * r0;
          d6 += h7 * (5 * r9);
          d6 += h8 * (5 * r8);
          d6 += h9 * (5 * r7);
          c += d6 >>> 13;
          d6 &= 8191;
          d7 = c;
          d7 += h0 * r7;
          d7 += h1 * r6;
          d7 += h2 * r5;
          d7 += h3 * r4;
          d7 += h4 * r3;
          c = d7 >>> 13;
          d7 &= 8191;
          d7 += h5 * r2;
          d7 += h6 * r1;
          d7 += h7 * r0;
          d7 += h8 * (5 * r9);
          d7 += h9 * (5 * r8);
          c += d7 >>> 13;
          d7 &= 8191;
          d8 = c;
          d8 += h0 * r8;
          d8 += h1 * r7;
          d8 += h2 * r6;
          d8 += h3 * r5;
          d8 += h4 * r4;
          c = d8 >>> 13;
          d8 &= 8191;
          d8 += h5 * r3;
          d8 += h6 * r2;
          d8 += h7 * r1;
          d8 += h8 * r0;
          d8 += h9 * (5 * r9);
          c += d8 >>> 13;
          d8 &= 8191;
          d9 = c;
          d9 += h0 * r9;
          d9 += h1 * r8;
          d9 += h2 * r7;
          d9 += h3 * r6;
          d9 += h4 * r5;
          c = d9 >>> 13;
          d9 &= 8191;
          d9 += h5 * r4;
          d9 += h6 * r3;
          d9 += h7 * r2;
          d9 += h8 * r1;
          d9 += h9 * r0;
          c += d9 >>> 13;
          d9 &= 8191;
          c = (c << 2) + c | 0;
          c = c + d0 | 0;
          d0 = c & 8191;
          c = c >>> 13;
          d1 += c;
          h0 = d0;
          h1 = d1;
          h2 = d2;
          h3 = d3;
          h4 = d4;
          h5 = d5;
          h6 = d6;
          h7 = d7;
          h8 = d8;
          h9 = d9;
          mpos += 16;
          bytes2 -= 16;
        }
        this.h[0] = h0;
        this.h[1] = h1;
        this.h[2] = h2;
        this.h[3] = h3;
        this.h[4] = h4;
        this.h[5] = h5;
        this.h[6] = h6;
        this.h[7] = h7;
        this.h[8] = h8;
        this.h[9] = h9;
      };
      poly1305.prototype.finish = function(mac, macpos) {
        var g = new Uint16Array(10);
        var c, mask, f, i;
        if (this.leftover) {
          i = this.leftover;
          this.buffer[i++] = 1;
          for (; i < 16; i++) this.buffer[i] = 0;
          this.fin = 1;
          this.blocks(this.buffer, 0, 16);
        }
        c = this.h[1] >>> 13;
        this.h[1] &= 8191;
        for (i = 2; i < 10; i++) {
          this.h[i] += c;
          c = this.h[i] >>> 13;
          this.h[i] &= 8191;
        }
        this.h[0] += c * 5;
        c = this.h[0] >>> 13;
        this.h[0] &= 8191;
        this.h[1] += c;
        c = this.h[1] >>> 13;
        this.h[1] &= 8191;
        this.h[2] += c;
        g[0] = this.h[0] + 5;
        c = g[0] >>> 13;
        g[0] &= 8191;
        for (i = 1; i < 10; i++) {
          g[i] = this.h[i] + c;
          c = g[i] >>> 13;
          g[i] &= 8191;
        }
        g[9] -= 1 << 13;
        mask = (c ^ 1) - 1;
        for (i = 0; i < 10; i++) g[i] &= mask;
        mask = ~mask;
        for (i = 0; i < 10; i++) this.h[i] = this.h[i] & mask | g[i];
        this.h[0] = (this.h[0] | this.h[1] << 13) & 65535;
        this.h[1] = (this.h[1] >>> 3 | this.h[2] << 10) & 65535;
        this.h[2] = (this.h[2] >>> 6 | this.h[3] << 7) & 65535;
        this.h[3] = (this.h[3] >>> 9 | this.h[4] << 4) & 65535;
        this.h[4] = (this.h[4] >>> 12 | this.h[5] << 1 | this.h[6] << 14) & 65535;
        this.h[5] = (this.h[6] >>> 2 | this.h[7] << 11) & 65535;
        this.h[6] = (this.h[7] >>> 5 | this.h[8] << 8) & 65535;
        this.h[7] = (this.h[8] >>> 8 | this.h[9] << 5) & 65535;
        f = this.h[0] + this.pad[0];
        this.h[0] = f & 65535;
        for (i = 1; i < 8; i++) {
          f = (this.h[i] + this.pad[i] | 0) + (f >>> 16) | 0;
          this.h[i] = f & 65535;
        }
        mac[macpos + 0] = this.h[0] >>> 0 & 255;
        mac[macpos + 1] = this.h[0] >>> 8 & 255;
        mac[macpos + 2] = this.h[1] >>> 0 & 255;
        mac[macpos + 3] = this.h[1] >>> 8 & 255;
        mac[macpos + 4] = this.h[2] >>> 0 & 255;
        mac[macpos + 5] = this.h[2] >>> 8 & 255;
        mac[macpos + 6] = this.h[3] >>> 0 & 255;
        mac[macpos + 7] = this.h[3] >>> 8 & 255;
        mac[macpos + 8] = this.h[4] >>> 0 & 255;
        mac[macpos + 9] = this.h[4] >>> 8 & 255;
        mac[macpos + 10] = this.h[5] >>> 0 & 255;
        mac[macpos + 11] = this.h[5] >>> 8 & 255;
        mac[macpos + 12] = this.h[6] >>> 0 & 255;
        mac[macpos + 13] = this.h[6] >>> 8 & 255;
        mac[macpos + 14] = this.h[7] >>> 0 & 255;
        mac[macpos + 15] = this.h[7] >>> 8 & 255;
      };
      poly1305.prototype.update = function(m, mpos, bytes2) {
        var i, want;
        if (this.leftover) {
          want = 16 - this.leftover;
          if (want > bytes2)
            want = bytes2;
          for (i = 0; i < want; i++)
            this.buffer[this.leftover + i] = m[mpos + i];
          bytes2 -= want;
          mpos += want;
          this.leftover += want;
          if (this.leftover < 16)
            return;
          this.blocks(this.buffer, 0, 16);
          this.leftover = 0;
        }
        if (bytes2 >= 16) {
          want = bytes2 - bytes2 % 16;
          this.blocks(m, mpos, want);
          mpos += want;
          bytes2 -= want;
        }
        if (bytes2) {
          for (i = 0; i < bytes2; i++)
            this.buffer[this.leftover + i] = m[mpos + i];
          this.leftover += bytes2;
        }
      };
      function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
        var s = new poly1305(k);
        s.update(m, mpos, n);
        s.finish(out, outpos);
        return 0;
      }
      function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
        var x = new Uint8Array(16);
        crypto_onetimeauth(x, 0, m, mpos, n, k);
        return crypto_verify_16(h, hpos, x, 0);
      }
      function crypto_secretbox(c, m, d, n, k) {
        var i;
        if (d < 32) return -1;
        crypto_stream_xor(c, 0, m, 0, d, n, k);
        crypto_onetimeauth(c, 16, c, 32, d - 32, c);
        for (i = 0; i < 16; i++) c[i] = 0;
        return 0;
      }
      function crypto_secretbox_open(m, c, d, n, k) {
        var i;
        var x = new Uint8Array(32);
        if (d < 32) return -1;
        crypto_stream(x, 0, 32, n, k);
        if (crypto_onetimeauth_verify(c, 16, c, 32, d - 32, x) !== 0) return -1;
        crypto_stream_xor(m, 0, c, 0, d, n, k);
        for (i = 0; i < 32; i++) m[i] = 0;
        return 0;
      }
      function set25519(r, a) {
        var i;
        for (i = 0; i < 16; i++) r[i] = a[i] | 0;
      }
      function car25519(o) {
        var i, v, c = 1;
        for (i = 0; i < 16; i++) {
          v = o[i] + c + 65535;
          c = Math.floor(v / 65536);
          o[i] = v - c * 65536;
        }
        o[0] += c - 1 + 37 * (c - 1);
      }
      function sel25519(p, q, b) {
        var t, c = ~(b - 1);
        for (var i = 0; i < 16; i++) {
          t = c & (p[i] ^ q[i]);
          p[i] ^= t;
          q[i] ^= t;
        }
      }
      function pack25519(o, n) {
        var i, j, b;
        var m = gf(), t = gf();
        for (i = 0; i < 16; i++) t[i] = n[i];
        car25519(t);
        car25519(t);
        car25519(t);
        for (j = 0; j < 2; j++) {
          m[0] = t[0] - 65517;
          for (i = 1; i < 15; i++) {
            m[i] = t[i] - 65535 - (m[i - 1] >> 16 & 1);
            m[i - 1] &= 65535;
          }
          m[15] = t[15] - 32767 - (m[14] >> 16 & 1);
          b = m[15] >> 16 & 1;
          m[14] &= 65535;
          sel25519(t, m, 1 - b);
        }
        for (i = 0; i < 16; i++) {
          o[2 * i] = t[i] & 255;
          o[2 * i + 1] = t[i] >> 8;
        }
      }
      function neq25519(a, b) {
        var c = new Uint8Array(32), d = new Uint8Array(32);
        pack25519(c, a);
        pack25519(d, b);
        return crypto_verify_32(c, 0, d, 0);
      }
      function par25519(a) {
        var d = new Uint8Array(32);
        pack25519(d, a);
        return d[0] & 1;
      }
      function unpack25519(o, n) {
        var i;
        for (i = 0; i < 16; i++) o[i] = n[2 * i] + (n[2 * i + 1] << 8);
        o[15] &= 32767;
      }
      function A(o, a, b) {
        for (var i = 0; i < 16; i++) o[i] = a[i] + b[i];
      }
      function Z(o, a, b) {
        for (var i = 0; i < 16; i++) o[i] = a[i] - b[i];
      }
      function M(o, a, b) {
        var v, c, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0, t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0, t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0, b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11], b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
        v = a[0];
        t0 += v * b0;
        t1 += v * b1;
        t2 += v * b2;
        t3 += v * b3;
        t4 += v * b4;
        t5 += v * b5;
        t6 += v * b6;
        t7 += v * b7;
        t8 += v * b8;
        t9 += v * b9;
        t10 += v * b10;
        t11 += v * b11;
        t12 += v * b12;
        t13 += v * b13;
        t14 += v * b14;
        t15 += v * b15;
        v = a[1];
        t1 += v * b0;
        t2 += v * b1;
        t3 += v * b2;
        t4 += v * b3;
        t5 += v * b4;
        t6 += v * b5;
        t7 += v * b6;
        t8 += v * b7;
        t9 += v * b8;
        t10 += v * b9;
        t11 += v * b10;
        t12 += v * b11;
        t13 += v * b12;
        t14 += v * b13;
        t15 += v * b14;
        t16 += v * b15;
        v = a[2];
        t2 += v * b0;
        t3 += v * b1;
        t4 += v * b2;
        t5 += v * b3;
        t6 += v * b4;
        t7 += v * b5;
        t8 += v * b6;
        t9 += v * b7;
        t10 += v * b8;
        t11 += v * b9;
        t12 += v * b10;
        t13 += v * b11;
        t14 += v * b12;
        t15 += v * b13;
        t16 += v * b14;
        t17 += v * b15;
        v = a[3];
        t3 += v * b0;
        t4 += v * b1;
        t5 += v * b2;
        t6 += v * b3;
        t7 += v * b4;
        t8 += v * b5;
        t9 += v * b6;
        t10 += v * b7;
        t11 += v * b8;
        t12 += v * b9;
        t13 += v * b10;
        t14 += v * b11;
        t15 += v * b12;
        t16 += v * b13;
        t17 += v * b14;
        t18 += v * b15;
        v = a[4];
        t4 += v * b0;
        t5 += v * b1;
        t6 += v * b2;
        t7 += v * b3;
        t8 += v * b4;
        t9 += v * b5;
        t10 += v * b6;
        t11 += v * b7;
        t12 += v * b8;
        t13 += v * b9;
        t14 += v * b10;
        t15 += v * b11;
        t16 += v * b12;
        t17 += v * b13;
        t18 += v * b14;
        t19 += v * b15;
        v = a[5];
        t5 += v * b0;
        t6 += v * b1;
        t7 += v * b2;
        t8 += v * b3;
        t9 += v * b4;
        t10 += v * b5;
        t11 += v * b6;
        t12 += v * b7;
        t13 += v * b8;
        t14 += v * b9;
        t15 += v * b10;
        t16 += v * b11;
        t17 += v * b12;
        t18 += v * b13;
        t19 += v * b14;
        t20 += v * b15;
        v = a[6];
        t6 += v * b0;
        t7 += v * b1;
        t8 += v * b2;
        t9 += v * b3;
        t10 += v * b4;
        t11 += v * b5;
        t12 += v * b6;
        t13 += v * b7;
        t14 += v * b8;
        t15 += v * b9;
        t16 += v * b10;
        t17 += v * b11;
        t18 += v * b12;
        t19 += v * b13;
        t20 += v * b14;
        t21 += v * b15;
        v = a[7];
        t7 += v * b0;
        t8 += v * b1;
        t9 += v * b2;
        t10 += v * b3;
        t11 += v * b4;
        t12 += v * b5;
        t13 += v * b6;
        t14 += v * b7;
        t15 += v * b8;
        t16 += v * b9;
        t17 += v * b10;
        t18 += v * b11;
        t19 += v * b12;
        t20 += v * b13;
        t21 += v * b14;
        t22 += v * b15;
        v = a[8];
        t8 += v * b0;
        t9 += v * b1;
        t10 += v * b2;
        t11 += v * b3;
        t12 += v * b4;
        t13 += v * b5;
        t14 += v * b6;
        t15 += v * b7;
        t16 += v * b8;
        t17 += v * b9;
        t18 += v * b10;
        t19 += v * b11;
        t20 += v * b12;
        t21 += v * b13;
        t22 += v * b14;
        t23 += v * b15;
        v = a[9];
        t9 += v * b0;
        t10 += v * b1;
        t11 += v * b2;
        t12 += v * b3;
        t13 += v * b4;
        t14 += v * b5;
        t15 += v * b6;
        t16 += v * b7;
        t17 += v * b8;
        t18 += v * b9;
        t19 += v * b10;
        t20 += v * b11;
        t21 += v * b12;
        t22 += v * b13;
        t23 += v * b14;
        t24 += v * b15;
        v = a[10];
        t10 += v * b0;
        t11 += v * b1;
        t12 += v * b2;
        t13 += v * b3;
        t14 += v * b4;
        t15 += v * b5;
        t16 += v * b6;
        t17 += v * b7;
        t18 += v * b8;
        t19 += v * b9;
        t20 += v * b10;
        t21 += v * b11;
        t22 += v * b12;
        t23 += v * b13;
        t24 += v * b14;
        t25 += v * b15;
        v = a[11];
        t11 += v * b0;
        t12 += v * b1;
        t13 += v * b2;
        t14 += v * b3;
        t15 += v * b4;
        t16 += v * b5;
        t17 += v * b6;
        t18 += v * b7;
        t19 += v * b8;
        t20 += v * b9;
        t21 += v * b10;
        t22 += v * b11;
        t23 += v * b12;
        t24 += v * b13;
        t25 += v * b14;
        t26 += v * b15;
        v = a[12];
        t12 += v * b0;
        t13 += v * b1;
        t14 += v * b2;
        t15 += v * b3;
        t16 += v * b4;
        t17 += v * b5;
        t18 += v * b6;
        t19 += v * b7;
        t20 += v * b8;
        t21 += v * b9;
        t22 += v * b10;
        t23 += v * b11;
        t24 += v * b12;
        t25 += v * b13;
        t26 += v * b14;
        t27 += v * b15;
        v = a[13];
        t13 += v * b0;
        t14 += v * b1;
        t15 += v * b2;
        t16 += v * b3;
        t17 += v * b4;
        t18 += v * b5;
        t19 += v * b6;
        t20 += v * b7;
        t21 += v * b8;
        t22 += v * b9;
        t23 += v * b10;
        t24 += v * b11;
        t25 += v * b12;
        t26 += v * b13;
        t27 += v * b14;
        t28 += v * b15;
        v = a[14];
        t14 += v * b0;
        t15 += v * b1;
        t16 += v * b2;
        t17 += v * b3;
        t18 += v * b4;
        t19 += v * b5;
        t20 += v * b6;
        t21 += v * b7;
        t22 += v * b8;
        t23 += v * b9;
        t24 += v * b10;
        t25 += v * b11;
        t26 += v * b12;
        t27 += v * b13;
        t28 += v * b14;
        t29 += v * b15;
        v = a[15];
        t15 += v * b0;
        t16 += v * b1;
        t17 += v * b2;
        t18 += v * b3;
        t19 += v * b4;
        t20 += v * b5;
        t21 += v * b6;
        t22 += v * b7;
        t23 += v * b8;
        t24 += v * b9;
        t25 += v * b10;
        t26 += v * b11;
        t27 += v * b12;
        t28 += v * b13;
        t29 += v * b14;
        t30 += v * b15;
        t0 += 38 * t16;
        t1 += 38 * t17;
        t2 += 38 * t18;
        t3 += 38 * t19;
        t4 += 38 * t20;
        t5 += 38 * t21;
        t6 += 38 * t22;
        t7 += 38 * t23;
        t8 += 38 * t24;
        t9 += 38 * t25;
        t10 += 38 * t26;
        t11 += 38 * t27;
        t12 += 38 * t28;
        t13 += 38 * t29;
        t14 += 38 * t30;
        c = 1;
        v = t0 + c + 65535;
        c = Math.floor(v / 65536);
        t0 = v - c * 65536;
        v = t1 + c + 65535;
        c = Math.floor(v / 65536);
        t1 = v - c * 65536;
        v = t2 + c + 65535;
        c = Math.floor(v / 65536);
        t2 = v - c * 65536;
        v = t3 + c + 65535;
        c = Math.floor(v / 65536);
        t3 = v - c * 65536;
        v = t4 + c + 65535;
        c = Math.floor(v / 65536);
        t4 = v - c * 65536;
        v = t5 + c + 65535;
        c = Math.floor(v / 65536);
        t5 = v - c * 65536;
        v = t6 + c + 65535;
        c = Math.floor(v / 65536);
        t6 = v - c * 65536;
        v = t7 + c + 65535;
        c = Math.floor(v / 65536);
        t7 = v - c * 65536;
        v = t8 + c + 65535;
        c = Math.floor(v / 65536);
        t8 = v - c * 65536;
        v = t9 + c + 65535;
        c = Math.floor(v / 65536);
        t9 = v - c * 65536;
        v = t10 + c + 65535;
        c = Math.floor(v / 65536);
        t10 = v - c * 65536;
        v = t11 + c + 65535;
        c = Math.floor(v / 65536);
        t11 = v - c * 65536;
        v = t12 + c + 65535;
        c = Math.floor(v / 65536);
        t12 = v - c * 65536;
        v = t13 + c + 65535;
        c = Math.floor(v / 65536);
        t13 = v - c * 65536;
        v = t14 + c + 65535;
        c = Math.floor(v / 65536);
        t14 = v - c * 65536;
        v = t15 + c + 65535;
        c = Math.floor(v / 65536);
        t15 = v - c * 65536;
        t0 += c - 1 + 37 * (c - 1);
        c = 1;
        v = t0 + c + 65535;
        c = Math.floor(v / 65536);
        t0 = v - c * 65536;
        v = t1 + c + 65535;
        c = Math.floor(v / 65536);
        t1 = v - c * 65536;
        v = t2 + c + 65535;
        c = Math.floor(v / 65536);
        t2 = v - c * 65536;
        v = t3 + c + 65535;
        c = Math.floor(v / 65536);
        t3 = v - c * 65536;
        v = t4 + c + 65535;
        c = Math.floor(v / 65536);
        t4 = v - c * 65536;
        v = t5 + c + 65535;
        c = Math.floor(v / 65536);
        t5 = v - c * 65536;
        v = t6 + c + 65535;
        c = Math.floor(v / 65536);
        t6 = v - c * 65536;
        v = t7 + c + 65535;
        c = Math.floor(v / 65536);
        t7 = v - c * 65536;
        v = t8 + c + 65535;
        c = Math.floor(v / 65536);
        t8 = v - c * 65536;
        v = t9 + c + 65535;
        c = Math.floor(v / 65536);
        t9 = v - c * 65536;
        v = t10 + c + 65535;
        c = Math.floor(v / 65536);
        t10 = v - c * 65536;
        v = t11 + c + 65535;
        c = Math.floor(v / 65536);
        t11 = v - c * 65536;
        v = t12 + c + 65535;
        c = Math.floor(v / 65536);
        t12 = v - c * 65536;
        v = t13 + c + 65535;
        c = Math.floor(v / 65536);
        t13 = v - c * 65536;
        v = t14 + c + 65535;
        c = Math.floor(v / 65536);
        t14 = v - c * 65536;
        v = t15 + c + 65535;
        c = Math.floor(v / 65536);
        t15 = v - c * 65536;
        t0 += c - 1 + 37 * (c - 1);
        o[0] = t0;
        o[1] = t1;
        o[2] = t2;
        o[3] = t3;
        o[4] = t4;
        o[5] = t5;
        o[6] = t6;
        o[7] = t7;
        o[8] = t8;
        o[9] = t9;
        o[10] = t10;
        o[11] = t11;
        o[12] = t12;
        o[13] = t13;
        o[14] = t14;
        o[15] = t15;
      }
      function S(o, a) {
        M(o, a, a);
      }
      function inv25519(o, i) {
        var c = gf();
        var a;
        for (a = 0; a < 16; a++) c[a] = i[a];
        for (a = 253; a >= 0; a--) {
          S(c, c);
          if (a !== 2 && a !== 4) M(c, c, i);
        }
        for (a = 0; a < 16; a++) o[a] = c[a];
      }
      function pow2523(o, i) {
        var c = gf();
        var a;
        for (a = 0; a < 16; a++) c[a] = i[a];
        for (a = 250; a >= 0; a--) {
          S(c, c);
          if (a !== 1) M(c, c, i);
        }
        for (a = 0; a < 16; a++) o[a] = c[a];
      }
      function crypto_scalarmult(q, n, p) {
        var z = new Uint8Array(32);
        var x = new Float64Array(80), r, i;
        var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf();
        for (i = 0; i < 31; i++) z[i] = n[i];
        z[31] = n[31] & 127 | 64;
        z[0] &= 248;
        unpack25519(x, p);
        for (i = 0; i < 16; i++) {
          b[i] = x[i];
          d[i] = a[i] = c[i] = 0;
        }
        a[0] = d[0] = 1;
        for (i = 254; i >= 0; --i) {
          r = z[i >>> 3] >>> (i & 7) & 1;
          sel25519(a, b, r);
          sel25519(c, d, r);
          A(e, a, c);
          Z(a, a, c);
          A(c, b, d);
          Z(b, b, d);
          S(d, e);
          S(f, a);
          M(a, c, a);
          M(c, b, e);
          A(e, a, c);
          Z(a, a, c);
          S(b, a);
          Z(c, d, f);
          M(a, c, _121665);
          A(a, a, d);
          M(c, c, a);
          M(a, d, f);
          M(d, b, x);
          S(b, e);
          sel25519(a, b, r);
          sel25519(c, d, r);
        }
        for (i = 0; i < 16; i++) {
          x[i + 16] = a[i];
          x[i + 32] = c[i];
          x[i + 48] = b[i];
          x[i + 64] = d[i];
        }
        var x32 = x.subarray(32);
        var x16 = x.subarray(16);
        inv25519(x32, x32);
        M(x16, x16, x32);
        pack25519(q, x16);
        return 0;
      }
      function crypto_scalarmult_base(q, n) {
        return crypto_scalarmult(q, n, _9);
      }
      function crypto_box_keypair(y, x) {
        randombytes(x, 32);
        return crypto_scalarmult_base(y, x);
      }
      function crypto_box_beforenm(k, y, x) {
        var s = new Uint8Array(32);
        crypto_scalarmult(s, x, y);
        return crypto_core_hsalsa20(k, _0, s, sigma);
      }
      var crypto_box_afternm = crypto_secretbox;
      var crypto_box_open_afternm = crypto_secretbox_open;
      function crypto_box(c, m, d, n, y, x) {
        var k = new Uint8Array(32);
        crypto_box_beforenm(k, y, x);
        return crypto_box_afternm(c, m, d, n, k);
      }
      function crypto_box_open(m, c, d, n, y, x) {
        var k = new Uint8Array(32);
        crypto_box_beforenm(k, y, x);
        return crypto_box_open_afternm(m, c, d, n, k);
      }
      var K2 = [
        1116352408,
        3609767458,
        1899447441,
        602891725,
        3049323471,
        3964484399,
        3921009573,
        2173295548,
        961987163,
        4081628472,
        1508970993,
        3053834265,
        2453635748,
        2937671579,
        2870763221,
        3664609560,
        3624381080,
        2734883394,
        310598401,
        1164996542,
        607225278,
        1323610764,
        1426881987,
        3590304994,
        1925078388,
        4068182383,
        2162078206,
        991336113,
        2614888103,
        633803317,
        3248222580,
        3479774868,
        3835390401,
        2666613458,
        4022224774,
        944711139,
        264347078,
        2341262773,
        604807628,
        2007800933,
        770255983,
        1495990901,
        1249150122,
        1856431235,
        1555081692,
        3175218132,
        1996064986,
        2198950837,
        2554220882,
        3999719339,
        2821834349,
        766784016,
        2952996808,
        2566594879,
        3210313671,
        3203337956,
        3336571891,
        1034457026,
        3584528711,
        2466948901,
        113926993,
        3758326383,
        338241895,
        168717936,
        666307205,
        1188179964,
        773529912,
        1546045734,
        1294757372,
        1522805485,
        1396182291,
        2643833823,
        1695183700,
        2343527390,
        1986661051,
        1014477480,
        2177026350,
        1206759142,
        2456956037,
        344077627,
        2730485921,
        1290863460,
        2820302411,
        3158454273,
        3259730800,
        3505952657,
        3345764771,
        106217008,
        3516065817,
        3606008344,
        3600352804,
        1432725776,
        4094571909,
        1467031594,
        275423344,
        851169720,
        430227734,
        3100823752,
        506948616,
        1363258195,
        659060556,
        3750685593,
        883997877,
        3785050280,
        958139571,
        3318307427,
        1322822218,
        3812723403,
        1537002063,
        2003034995,
        1747873779,
        3602036899,
        1955562222,
        1575990012,
        2024104815,
        1125592928,
        2227730452,
        2716904306,
        2361852424,
        442776044,
        2428436474,
        593698344,
        2756734187,
        3733110249,
        3204031479,
        2999351573,
        3329325298,
        3815920427,
        3391569614,
        3928383900,
        3515267271,
        566280711,
        3940187606,
        3454069534,
        4118630271,
        4000239992,
        116418474,
        1914138554,
        174292421,
        2731055270,
        289380356,
        3203993006,
        460393269,
        320620315,
        685471733,
        587496836,
        852142971,
        1086792851,
        1017036298,
        365543100,
        1126000580,
        2618297676,
        1288033470,
        3409855158,
        1501505948,
        4234509866,
        1607167915,
        987167468,
        1816402316,
        1246189591
      ];
      function crypto_hashblocks_hl(hh, hl, m, n) {
        var wh = new Int32Array(16), wl = new Int32Array(16), bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7, bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7, th, tl, i, j, h, l, a, b, c, d;
        var ah0 = hh[0], ah1 = hh[1], ah2 = hh[2], ah3 = hh[3], ah4 = hh[4], ah5 = hh[5], ah6 = hh[6], ah7 = hh[7], al0 = hl[0], al1 = hl[1], al2 = hl[2], al3 = hl[3], al4 = hl[4], al5 = hl[5], al6 = hl[6], al7 = hl[7];
        var pos = 0;
        while (n >= 128) {
          for (i = 0; i < 16; i++) {
            j = 8 * i + pos;
            wh[i] = m[j + 0] << 24 | m[j + 1] << 16 | m[j + 2] << 8 | m[j + 3];
            wl[i] = m[j + 4] << 24 | m[j + 5] << 16 | m[j + 6] << 8 | m[j + 7];
          }
          for (i = 0; i < 80; i++) {
            bh0 = ah0;
            bh1 = ah1;
            bh2 = ah2;
            bh3 = ah3;
            bh4 = ah4;
            bh5 = ah5;
            bh6 = ah6;
            bh7 = ah7;
            bl0 = al0;
            bl1 = al1;
            bl2 = al2;
            bl3 = al3;
            bl4 = al4;
            bl5 = al5;
            bl6 = al6;
            bl7 = al7;
            h = ah7;
            l = al7;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = (ah4 >>> 14 | al4 << 32 - 14) ^ (ah4 >>> 18 | al4 << 32 - 18) ^ (al4 >>> 41 - 32 | ah4 << 32 - (41 - 32));
            l = (al4 >>> 14 | ah4 << 32 - 14) ^ (al4 >>> 18 | ah4 << 32 - 18) ^ (ah4 >>> 41 - 32 | al4 << 32 - (41 - 32));
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = ah4 & ah5 ^ ~ah4 & ah6;
            l = al4 & al5 ^ ~al4 & al6;
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = K2[i * 2];
            l = K2[i * 2 + 1];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = wh[i % 16];
            l = wl[i % 16];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            th = c & 65535 | d << 16;
            tl = a & 65535 | b << 16;
            h = th;
            l = tl;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = (ah0 >>> 28 | al0 << 32 - 28) ^ (al0 >>> 34 - 32 | ah0 << 32 - (34 - 32)) ^ (al0 >>> 39 - 32 | ah0 << 32 - (39 - 32));
            l = (al0 >>> 28 | ah0 << 32 - 28) ^ (ah0 >>> 34 - 32 | al0 << 32 - (34 - 32)) ^ (ah0 >>> 39 - 32 | al0 << 32 - (39 - 32));
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = ah0 & ah1 ^ ah0 & ah2 ^ ah1 & ah2;
            l = al0 & al1 ^ al0 & al2 ^ al1 & al2;
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            bh7 = c & 65535 | d << 16;
            bl7 = a & 65535 | b << 16;
            h = bh3;
            l = bl3;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = th;
            l = tl;
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            bh3 = c & 65535 | d << 16;
            bl3 = a & 65535 | b << 16;
            ah1 = bh0;
            ah2 = bh1;
            ah3 = bh2;
            ah4 = bh3;
            ah5 = bh4;
            ah6 = bh5;
            ah7 = bh6;
            ah0 = bh7;
            al1 = bl0;
            al2 = bl1;
            al3 = bl2;
            al4 = bl3;
            al5 = bl4;
            al6 = bl5;
            al7 = bl6;
            al0 = bl7;
            if (i % 16 === 15) {
              for (j = 0; j < 16; j++) {
                h = wh[j];
                l = wl[j];
                a = l & 65535;
                b = l >>> 16;
                c = h & 65535;
                d = h >>> 16;
                h = wh[(j + 9) % 16];
                l = wl[(j + 9) % 16];
                a += l & 65535;
                b += l >>> 16;
                c += h & 65535;
                d += h >>> 16;
                th = wh[(j + 1) % 16];
                tl = wl[(j + 1) % 16];
                h = (th >>> 1 | tl << 32 - 1) ^ (th >>> 8 | tl << 32 - 8) ^ th >>> 7;
                l = (tl >>> 1 | th << 32 - 1) ^ (tl >>> 8 | th << 32 - 8) ^ (tl >>> 7 | th << 32 - 7);
                a += l & 65535;
                b += l >>> 16;
                c += h & 65535;
                d += h >>> 16;
                th = wh[(j + 14) % 16];
                tl = wl[(j + 14) % 16];
                h = (th >>> 19 | tl << 32 - 19) ^ (tl >>> 61 - 32 | th << 32 - (61 - 32)) ^ th >>> 6;
                l = (tl >>> 19 | th << 32 - 19) ^ (th >>> 61 - 32 | tl << 32 - (61 - 32)) ^ (tl >>> 6 | th << 32 - 6);
                a += l & 65535;
                b += l >>> 16;
                c += h & 65535;
                d += h >>> 16;
                b += a >>> 16;
                c += b >>> 16;
                d += c >>> 16;
                wh[j] = c & 65535 | d << 16;
                wl[j] = a & 65535 | b << 16;
              }
            }
          }
          h = ah0;
          l = al0;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[0];
          l = hl[0];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[0] = ah0 = c & 65535 | d << 16;
          hl[0] = al0 = a & 65535 | b << 16;
          h = ah1;
          l = al1;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[1];
          l = hl[1];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[1] = ah1 = c & 65535 | d << 16;
          hl[1] = al1 = a & 65535 | b << 16;
          h = ah2;
          l = al2;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[2];
          l = hl[2];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[2] = ah2 = c & 65535 | d << 16;
          hl[2] = al2 = a & 65535 | b << 16;
          h = ah3;
          l = al3;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[3];
          l = hl[3];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[3] = ah3 = c & 65535 | d << 16;
          hl[3] = al3 = a & 65535 | b << 16;
          h = ah4;
          l = al4;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[4];
          l = hl[4];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[4] = ah4 = c & 65535 | d << 16;
          hl[4] = al4 = a & 65535 | b << 16;
          h = ah5;
          l = al5;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[5];
          l = hl[5];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[5] = ah5 = c & 65535 | d << 16;
          hl[5] = al5 = a & 65535 | b << 16;
          h = ah6;
          l = al6;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[6];
          l = hl[6];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[6] = ah6 = c & 65535 | d << 16;
          hl[6] = al6 = a & 65535 | b << 16;
          h = ah7;
          l = al7;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[7];
          l = hl[7];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[7] = ah7 = c & 65535 | d << 16;
          hl[7] = al7 = a & 65535 | b << 16;
          pos += 128;
          n -= 128;
        }
        return n;
      }
      function crypto_hash(out, m, n) {
        var hh = new Int32Array(8), hl = new Int32Array(8), x = new Uint8Array(256), i, b = n;
        hh[0] = 1779033703;
        hh[1] = 3144134277;
        hh[2] = 1013904242;
        hh[3] = 2773480762;
        hh[4] = 1359893119;
        hh[5] = 2600822924;
        hh[6] = 528734635;
        hh[7] = 1541459225;
        hl[0] = 4089235720;
        hl[1] = 2227873595;
        hl[2] = 4271175723;
        hl[3] = 1595750129;
        hl[4] = 2917565137;
        hl[5] = 725511199;
        hl[6] = 4215389547;
        hl[7] = 327033209;
        crypto_hashblocks_hl(hh, hl, m, n);
        n %= 128;
        for (i = 0; i < n; i++) x[i] = m[b - n + i];
        x[n] = 128;
        n = 256 - 128 * (n < 112 ? 1 : 0);
        x[n - 9] = 0;
        ts64(x, n - 8, b / 536870912 | 0, b << 3);
        crypto_hashblocks_hl(hh, hl, x, n);
        for (i = 0; i < 8; i++) ts64(out, 8 * i, hh[i], hl[i]);
        return 0;
      }
      function add2(p, q) {
        var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf(), g = gf(), h = gf(), t = gf();
        Z(a, p[1], p[0]);
        Z(t, q[1], q[0]);
        M(a, a, t);
        A(b, p[0], p[1]);
        A(t, q[0], q[1]);
        M(b, b, t);
        M(c, p[3], q[3]);
        M(c, c, D2);
        M(d, p[2], q[2]);
        A(d, d, d);
        Z(e, b, a);
        Z(f, d, c);
        A(g, d, c);
        A(h, b, a);
        M(p[0], e, f);
        M(p[1], h, g);
        M(p[2], g, f);
        M(p[3], e, h);
      }
      function cswap(p, q, b) {
        var i;
        for (i = 0; i < 4; i++) {
          sel25519(p[i], q[i], b);
        }
      }
      function pack(r, p) {
        var tx = gf(), ty = gf(), zi = gf();
        inv25519(zi, p[2]);
        M(tx, p[0], zi);
        M(ty, p[1], zi);
        pack25519(r, ty);
        r[31] ^= par25519(tx) << 7;
      }
      function scalarmult(p, q, s) {
        var b, i;
        set25519(p[0], gf0);
        set25519(p[1], gf1);
        set25519(p[2], gf1);
        set25519(p[3], gf0);
        for (i = 255; i >= 0; --i) {
          b = s[i / 8 | 0] >> (i & 7) & 1;
          cswap(p, q, b);
          add2(q, p);
          add2(p, p);
          cswap(p, q, b);
        }
      }
      function scalarbase(p, s) {
        var q = [gf(), gf(), gf(), gf()];
        set25519(q[0], X);
        set25519(q[1], Y);
        set25519(q[2], gf1);
        M(q[3], X, Y);
        scalarmult(p, q, s);
      }
      function crypto_sign_keypair(pk, sk, seeded) {
        var d = new Uint8Array(64);
        var p = [gf(), gf(), gf(), gf()];
        var i;
        if (!seeded) randombytes(sk, 32);
        crypto_hash(d, sk, 32);
        d[0] &= 248;
        d[31] &= 127;
        d[31] |= 64;
        scalarbase(p, d);
        pack(pk, p);
        for (i = 0; i < 32; i++) sk[i + 32] = pk[i];
        return 0;
      }
      var L = new Float64Array([237, 211, 245, 92, 26, 99, 18, 88, 214, 156, 247, 162, 222, 249, 222, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16]);
      function modL(r, x) {
        var carry, i, j, k;
        for (i = 63; i >= 32; --i) {
          carry = 0;
          for (j = i - 32, k = i - 12; j < k; ++j) {
            x[j] += carry - 16 * x[i] * L[j - (i - 32)];
            carry = Math.floor((x[j] + 128) / 256);
            x[j] -= carry * 256;
          }
          x[j] += carry;
          x[i] = 0;
        }
        carry = 0;
        for (j = 0; j < 32; j++) {
          x[j] += carry - (x[31] >> 4) * L[j];
          carry = x[j] >> 8;
          x[j] &= 255;
        }
        for (j = 0; j < 32; j++) x[j] -= carry * L[j];
        for (i = 0; i < 32; i++) {
          x[i + 1] += x[i] >> 8;
          r[i] = x[i] & 255;
        }
      }
      function reduce(r) {
        var x = new Float64Array(64), i;
        for (i = 0; i < 64; i++) x[i] = r[i];
        for (i = 0; i < 64; i++) r[i] = 0;
        modL(r, x);
      }
      function crypto_sign(sm, m, n, sk) {
        var d = new Uint8Array(64), h = new Uint8Array(64), r = new Uint8Array(64);
        var i, j, x = new Float64Array(64);
        var p = [gf(), gf(), gf(), gf()];
        crypto_hash(d, sk, 32);
        d[0] &= 248;
        d[31] &= 127;
        d[31] |= 64;
        var smlen = n + 64;
        for (i = 0; i < n; i++) sm[64 + i] = m[i];
        for (i = 0; i < 32; i++) sm[32 + i] = d[32 + i];
        crypto_hash(r, sm.subarray(32), n + 32);
        reduce(r);
        scalarbase(p, r);
        pack(sm, p);
        for (i = 32; i < 64; i++) sm[i] = sk[i];
        crypto_hash(h, sm, n + 64);
        reduce(h);
        for (i = 0; i < 64; i++) x[i] = 0;
        for (i = 0; i < 32; i++) x[i] = r[i];
        for (i = 0; i < 32; i++) {
          for (j = 0; j < 32; j++) {
            x[i + j] += h[i] * d[j];
          }
        }
        modL(sm.subarray(32), x);
        return smlen;
      }
      function unpackneg(r, p) {
        var t = gf(), chk = gf(), num = gf(), den = gf(), den2 = gf(), den4 = gf(), den6 = gf();
        set25519(r[2], gf1);
        unpack25519(r[1], p);
        S(num, r[1]);
        M(den, num, D);
        Z(num, num, r[2]);
        A(den, r[2], den);
        S(den2, den);
        S(den4, den2);
        M(den6, den4, den2);
        M(t, den6, num);
        M(t, t, den);
        pow2523(t, t);
        M(t, t, num);
        M(t, t, den);
        M(t, t, den);
        M(r[0], t, den);
        S(chk, r[0]);
        M(chk, chk, den);
        if (neq25519(chk, num)) M(r[0], r[0], I);
        S(chk, r[0]);
        M(chk, chk, den);
        if (neq25519(chk, num)) return -1;
        if (par25519(r[0]) === p[31] >> 7) Z(r[0], gf0, r[0]);
        M(r[3], r[0], r[1]);
        return 0;
      }
      function crypto_sign_open(m, sm, n, pk) {
        var i;
        var t = new Uint8Array(32), h = new Uint8Array(64);
        var p = [gf(), gf(), gf(), gf()], q = [gf(), gf(), gf(), gf()];
        if (n < 64) return -1;
        if (unpackneg(q, pk)) return -1;
        for (i = 0; i < n; i++) m[i] = sm[i];
        for (i = 0; i < 32; i++) m[i + 32] = pk[i];
        crypto_hash(h, m, n);
        reduce(h);
        scalarmult(p, q, h);
        scalarbase(q, sm.subarray(32));
        add2(p, q);
        pack(t, p);
        n -= 64;
        if (crypto_verify_32(sm, 0, t, 0)) {
          for (i = 0; i < n; i++) m[i] = 0;
          return -1;
        }
        for (i = 0; i < n; i++) m[i] = sm[i + 64];
        return n;
      }
      var crypto_secretbox_KEYBYTES = 32, crypto_secretbox_NONCEBYTES = 24, crypto_secretbox_ZEROBYTES = 32, crypto_secretbox_BOXZEROBYTES = 16, crypto_scalarmult_BYTES = 32, crypto_scalarmult_SCALARBYTES = 32, crypto_box_PUBLICKEYBYTES = 32, crypto_box_SECRETKEYBYTES = 32, crypto_box_BEFORENMBYTES = 32, crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES, crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES, crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES, crypto_sign_BYTES = 64, crypto_sign_PUBLICKEYBYTES = 32, crypto_sign_SECRETKEYBYTES = 64, crypto_sign_SEEDBYTES = 32, crypto_hash_BYTES = 64;
      nacl6.lowlevel = {
        crypto_core_hsalsa20,
        crypto_stream_xor,
        crypto_stream,
        crypto_stream_salsa20_xor,
        crypto_stream_salsa20,
        crypto_onetimeauth,
        crypto_onetimeauth_verify,
        crypto_verify_16,
        crypto_verify_32,
        crypto_secretbox,
        crypto_secretbox_open,
        crypto_scalarmult,
        crypto_scalarmult_base,
        crypto_box_beforenm,
        crypto_box_afternm,
        crypto_box,
        crypto_box_open,
        crypto_box_keypair,
        crypto_hash,
        crypto_sign,
        crypto_sign_keypair,
        crypto_sign_open,
        crypto_secretbox_KEYBYTES,
        crypto_secretbox_NONCEBYTES,
        crypto_secretbox_ZEROBYTES,
        crypto_secretbox_BOXZEROBYTES,
        crypto_scalarmult_BYTES,
        crypto_scalarmult_SCALARBYTES,
        crypto_box_PUBLICKEYBYTES,
        crypto_box_SECRETKEYBYTES,
        crypto_box_BEFORENMBYTES,
        crypto_box_NONCEBYTES,
        crypto_box_ZEROBYTES,
        crypto_box_BOXZEROBYTES,
        crypto_sign_BYTES,
        crypto_sign_PUBLICKEYBYTES,
        crypto_sign_SECRETKEYBYTES,
        crypto_sign_SEEDBYTES,
        crypto_hash_BYTES,
        gf,
        D,
        L,
        pack25519,
        unpack25519,
        M,
        A,
        S,
        Z,
        pow2523,
        add: add2,
        set25519,
        modL,
        scalarmult,
        scalarbase
      };
      function checkLengths(k, n) {
        if (k.length !== crypto_secretbox_KEYBYTES) throw new Error("bad key size");
        if (n.length !== crypto_secretbox_NONCEBYTES) throw new Error("bad nonce size");
      }
      function checkBoxLengths(pk, sk) {
        if (pk.length !== crypto_box_PUBLICKEYBYTES) throw new Error("bad public key size");
        if (sk.length !== crypto_box_SECRETKEYBYTES) throw new Error("bad secret key size");
      }
      function checkArrayTypes() {
        for (var i = 0; i < arguments.length; i++) {
          if (!(arguments[i] instanceof Uint8Array))
            throw new TypeError("unexpected type, use Uint8Array");
        }
      }
      function cleanup(arr) {
        for (var i = 0; i < arr.length; i++) arr[i] = 0;
      }
      nacl6.randomBytes = function(n) {
        var b = new Uint8Array(n);
        randombytes(b, n);
        return b;
      };
      nacl6.secretbox = function(msg, nonce, key) {
        checkArrayTypes(msg, nonce, key);
        checkLengths(key, nonce);
        var m = new Uint8Array(crypto_secretbox_ZEROBYTES + msg.length);
        var c = new Uint8Array(m.length);
        for (var i = 0; i < msg.length; i++) m[i + crypto_secretbox_ZEROBYTES] = msg[i];
        crypto_secretbox(c, m, m.length, nonce, key);
        return c.subarray(crypto_secretbox_BOXZEROBYTES);
      };
      nacl6.secretbox.open = function(box, nonce, key) {
        checkArrayTypes(box, nonce, key);
        checkLengths(key, nonce);
        var c = new Uint8Array(crypto_secretbox_BOXZEROBYTES + box.length);
        var m = new Uint8Array(c.length);
        for (var i = 0; i < box.length; i++) c[i + crypto_secretbox_BOXZEROBYTES] = box[i];
        if (c.length < 32) return null;
        if (crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) return null;
        return m.subarray(crypto_secretbox_ZEROBYTES);
      };
      nacl6.secretbox.keyLength = crypto_secretbox_KEYBYTES;
      nacl6.secretbox.nonceLength = crypto_secretbox_NONCEBYTES;
      nacl6.secretbox.overheadLength = crypto_secretbox_BOXZEROBYTES;
      nacl6.scalarMult = function(n, p) {
        checkArrayTypes(n, p);
        if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error("bad n size");
        if (p.length !== crypto_scalarmult_BYTES) throw new Error("bad p size");
        var q = new Uint8Array(crypto_scalarmult_BYTES);
        crypto_scalarmult(q, n, p);
        return q;
      };
      nacl6.scalarMult.base = function(n) {
        checkArrayTypes(n);
        if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error("bad n size");
        var q = new Uint8Array(crypto_scalarmult_BYTES);
        crypto_scalarmult_base(q, n);
        return q;
      };
      nacl6.scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
      nacl6.scalarMult.groupElementLength = crypto_scalarmult_BYTES;
      nacl6.box = function(msg, nonce, publicKey, secretKey) {
        var k = nacl6.box.before(publicKey, secretKey);
        return nacl6.secretbox(msg, nonce, k);
      };
      nacl6.box.before = function(publicKey, secretKey) {
        checkArrayTypes(publicKey, secretKey);
        checkBoxLengths(publicKey, secretKey);
        var k = new Uint8Array(crypto_box_BEFORENMBYTES);
        crypto_box_beforenm(k, publicKey, secretKey);
        return k;
      };
      nacl6.box.after = nacl6.secretbox;
      nacl6.box.open = function(msg, nonce, publicKey, secretKey) {
        var k = nacl6.box.before(publicKey, secretKey);
        return nacl6.secretbox.open(msg, nonce, k);
      };
      nacl6.box.open.after = nacl6.secretbox.open;
      nacl6.box.keyPair = function() {
        var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
        crypto_box_keypair(pk, sk);
        return { publicKey: pk, secretKey: sk };
      };
      nacl6.box.keyPair.fromSecretKey = function(secretKey) {
        checkArrayTypes(secretKey);
        if (secretKey.length !== crypto_box_SECRETKEYBYTES)
          throw new Error("bad secret key size");
        var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
        crypto_scalarmult_base(pk, secretKey);
        return { publicKey: pk, secretKey: new Uint8Array(secretKey) };
      };
      nacl6.box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
      nacl6.box.secretKeyLength = crypto_box_SECRETKEYBYTES;
      nacl6.box.sharedKeyLength = crypto_box_BEFORENMBYTES;
      nacl6.box.nonceLength = crypto_box_NONCEBYTES;
      nacl6.box.overheadLength = nacl6.secretbox.overheadLength;
      nacl6.sign = function(msg, secretKey) {
        checkArrayTypes(msg, secretKey);
        if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
          throw new Error("bad secret key size");
        var signedMsg = new Uint8Array(crypto_sign_BYTES + msg.length);
        crypto_sign(signedMsg, msg, msg.length, secretKey);
        return signedMsg;
      };
      nacl6.sign.open = function(signedMsg, publicKey) {
        checkArrayTypes(signedMsg, publicKey);
        if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
          throw new Error("bad public key size");
        var tmp = new Uint8Array(signedMsg.length);
        var mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
        if (mlen < 0) return null;
        var m = new Uint8Array(mlen);
        for (var i = 0; i < m.length; i++) m[i] = tmp[i];
        return m;
      };
      nacl6.sign.detached = function(msg, secretKey) {
        var signedMsg = nacl6.sign(msg, secretKey);
        var sig = new Uint8Array(crypto_sign_BYTES);
        for (var i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
        return sig;
      };
      nacl6.sign.detached.verify = function(msg, sig, publicKey) {
        checkArrayTypes(msg, sig, publicKey);
        if (sig.length !== crypto_sign_BYTES)
          throw new Error("bad signature size");
        if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
          throw new Error("bad public key size");
        var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
        var m = new Uint8Array(crypto_sign_BYTES + msg.length);
        var i;
        for (i = 0; i < crypto_sign_BYTES; i++) sm[i] = sig[i];
        for (i = 0; i < msg.length; i++) sm[i + crypto_sign_BYTES] = msg[i];
        return crypto_sign_open(m, sm, sm.length, publicKey) >= 0;
      };
      nacl6.sign.keyPair = function() {
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
        crypto_sign_keypair(pk, sk);
        return { publicKey: pk, secretKey: sk };
      };
      nacl6.sign.keyPair.fromSecretKey = function(secretKey) {
        checkArrayTypes(secretKey);
        if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
          throw new Error("bad secret key size");
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        for (var i = 0; i < pk.length; i++) pk[i] = secretKey[32 + i];
        return { publicKey: pk, secretKey: new Uint8Array(secretKey) };
      };
      nacl6.sign.keyPair.fromSeed = function(seed) {
        checkArrayTypes(seed);
        if (seed.length !== crypto_sign_SEEDBYTES)
          throw new Error("bad seed size");
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
        for (var i = 0; i < 32; i++) sk[i] = seed[i];
        crypto_sign_keypair(pk, sk, true);
        return { publicKey: pk, secretKey: sk };
      };
      nacl6.sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
      nacl6.sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
      nacl6.sign.seedLength = crypto_sign_SEEDBYTES;
      nacl6.sign.signatureLength = crypto_sign_BYTES;
      nacl6.hash = function(msg) {
        checkArrayTypes(msg);
        var h = new Uint8Array(crypto_hash_BYTES);
        crypto_hash(h, msg, msg.length);
        return h;
      };
      nacl6.hash.hashLength = crypto_hash_BYTES;
      nacl6.verify = function(x, y) {
        checkArrayTypes(x, y);
        if (x.length === 0 || y.length === 0) return false;
        if (x.length !== y.length) return false;
        return vn(x, 0, y, 0, x.length) === 0 ? true : false;
      };
      nacl6.setPRNG = function(fn) {
        randombytes = fn;
      };
      (function() {
        var crypto = typeof self !== "undefined" ? self.crypto || self.msCrypto : null;
        if (crypto && crypto.getRandomValues) {
          var QUOTA = 65536;
          nacl6.setPRNG(function(x, n) {
            var i, v = new Uint8Array(n);
            for (i = 0; i < n; i += QUOTA) {
              crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
            }
            for (i = 0; i < n; i++) x[i] = v[i];
            cleanup(v);
          });
        } else if (typeof require !== "undefined") {
          crypto = require("crypto");
          if (crypto && crypto.randomBytes) {
            nacl6.setPRNG(function(x, n) {
              var i, v = crypto.randomBytes(n);
              for (i = 0; i < n; i++) x[i] = v[i];
              cleanup(v);
            });
          }
        }
      })();
    })(typeof module2 !== "undefined" && module2.exports ? module2.exports : self.nacl = self.nacl || {});
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ObsidianMessengerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian14 = require("obsidian");

// src/mailbox/envelope.ts
var ADDRESS_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
var CLOSING_MARKER = "<!-- /messenger -->";
var MAX_BAR_SECONDS = 31536e3;
function isExpired(message, now = Date.now()) {
  if (!message.exp) return false;
  const at = Date.parse(message.exp);
  return Number.isFinite(at) && at <= now;
}
var BLOCK_RE_SOURCE = /<!--\s*messenger:\s*(\{[^\r\n]*\})\s*-->\r?\n([\s\S]*?)<!--\s*\/messenger\s*-->/.source;
function newMessageId() {
  return `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
function encodeMessage(message) {
  const header = {
    id: message.id,
    from: message.from,
    to: message.to,
    ts: message.ts,
    replyTo: message.replyTo ?? null
  };
  if (message.om2) {
    header.v = 2;
    header.from2 = message.om2.from2;
    header.to2 = message.om2.to2;
    header.sender = message.om2.sender;
    header.sig = message.om2.sig;
  }
  if (message.enc) header.enc = { v: message.enc.v, iv: message.enc.iv };
  if (typeof message.exp === "string" && message.exp) header.exp = message.exp;
  if (typeof message.bar === "number" && Number.isFinite(message.bar)) {
    header.bar = Math.round(message.bar);
  }
  const body = message.body.replace(/\s+$/, "");
  return `<!-- messenger: ${JSON.stringify(header)} -->
${body}
<!-- /messenger -->

`;
}
function parseInbox(content) {
  const out = [];
  const re = new RegExp(BLOCK_RE_SOURCE, "g");
  let match;
  while ((match = re.exec(content)) !== null) {
    try {
      const header = JSON.parse(match[1]);
      if (typeof header.id === "string" && typeof header.from === "string" && typeof header.to === "string" && typeof header.ts === "string") {
        const env = {
          id: header.id,
          from: header.from,
          to: header.to,
          ts: header.ts,
          replyTo: typeof header.replyTo === "string" ? header.replyTo : null,
          body: match[2].replace(/\s+$/, "")
        };
        if (header.enc && typeof header.enc === "object" && header.enc.v === 1 && typeof header.enc.iv === "string" && header.enc.iv.length > 0 && header.enc.iv.length <= 64) {
          env.enc = { v: 1, iv: header.enc.iv };
          env.encLocked = true;
        }
        if (typeof header.exp === "string" && Number.isFinite(Date.parse(header.exp))) {
          env.exp = header.exp;
        }
        if (typeof header.bar === "number" && Number.isFinite(header.bar) && header.bar >= 1 && header.bar <= MAX_BAR_SECONDS) {
          env.bar = Math.round(header.bar);
        }
        if (header.v === 2 && typeof header.from2 === "string" && typeof header.to2 === "string" && typeof header.sender === "string" && typeof header.sig === "string") {
          env.om2 = {
            v: 2,
            from2: header.from2,
            to2: header.to2,
            sender: header.sender,
            sig: header.sig
          };
        }
        out.push(env);
      }
    } catch {
    }
  }
  return out;
}

// src/bus.ts
var MessengerError = class extends Error {
  constructor(message, code) {
    super(message);
    this.name = "MessengerError";
    this.code = code;
  }
};
var MailBus = class {
  constructor(store, hooks = {}) {
    this.store = store;
    this.hooks = hooks;
    this.handlers = [];
    this.cursors = {};
    this.ticking = false;
    /**
     * When on, every send also appends a copy to the sender's outbox
     * (SPEC §13) so sent history survives the recipient's folder. Off by
     * default — the vault is shared, and the recipient's inbox already holds
     * the conversation.
     */
    this.keepOutbox = false;
    /**
     * Where loadConversation reads per-peer display timestamps from (SPEC §16
     * burn-after-read). The plugin points this at settings.readAt.
     */
    this.readAtSource = null;
    /**
     * Per-address GC overrides (per-address retention): when set, resolved for
     * every address at GC time; a null return falls back to the gc() arguments.
     * The plugin points this at settings' per-peer retention records.
     */
    this.gcPolicySource = null;
  }
  setCursors(cursors) {
    this.cursors = { ...cursors };
  }
  getCursors() {
    return { ...this.cursors };
  }
  subscribe(handler, address) {
    const entry = { addresses: address ? /* @__PURE__ */ new Set([address]) : null, fn: handler };
    this.handlers.push(entry);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== entry);
    };
  }
  async send(from, to, body, options = {}) {
    if (!ADDRESS_RE.test(from)) {
      throw new MessengerError(`Invalid sender address: ${from}`, "invalid_address");
    }
    if (!ADDRESS_RE.test(to)) {
      throw new MessengerError(`Invalid recipient address: ${to}`, "invalid_address");
    }
    if (!body.trim()) throw new MessengerError("Message body is empty", "invalid_body");
    if (body.includes(CLOSING_MARKER)) {
      throw new MessengerError(
        `Message body contains the block delimiter "${CLOSING_MARKER}"`,
        "invalid_body"
      );
    }
    const replyTo = options.replyTo ?? null;
    if (replyTo !== null && (replyTo.length === 0 || replyTo.length > 64 || replyTo.includes("-->"))) {
      throw new MessengerError(`Invalid replyTo id: ${replyTo}`, "invalid_reply_to");
    }
    const message = {
      id: newMessageId(),
      from,
      to,
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      replyTo,
      body
    };
    if (options.burnAfterMs && options.burnAfterMs > 0) {
      message.exp = new Date(Date.now() + options.burnAfterMs).toISOString();
    }
    if (options.burnOnReadSec && options.burnOnReadSec >= 1) {
      message.bar = Math.round(options.burnOnReadSec);
    }
    const sealed = await this.store.append(to, message);
    if (this.keepOutbox) {
      try {
        await this.store.appendOutbox(from, message);
      } catch (err) {
        this.hooks.onError?.(err, from);
      }
    }
    if (sealed) {
      message.enc = { v: 1, iv: sealed.iv };
      message.body = sealed.ct;
    }
    try {
      this.hooks.onSend?.(message);
    } catch (err) {
      this.hooks.onError?.(err, to);
    }
    return message;
  }
  /** One poll pass over every inbox. Returns the number of messages delivered. */
  async tick() {
    if (this.ticking) return 0;
    this.ticking = true;
    try {
      let processed = 0;
      for (const address of await this.store.listAddresses()) {
        const messages = await this.store.readInbox(address);
        const pending = pendingAfter(messages, this.cursors[address] ?? null);
        for (const message of pending) {
          for (const handler of this.handlers) {
            if (handler.addresses && !handler.addresses.has(address)) continue;
            try {
              await handler.fn(message);
            } catch (err) {
              this.hooks.onError?.(err, address);
            }
          }
          this.cursors[address] = { id: message.id, ts: message.ts };
          processed++;
          this.hooks.onDispatch?.(message);
        }
      }
      return processed;
    } finally {
      this.ticking = false;
    }
  }
  /**
   * Both halves of a conversation {me, peer}: mail the peer sent me (my
   * inbox), mail I sent them (their inbox — the sender keeps no copy), plus
   * my outbox copies when keepOutbox is on. Deduped by id, oldest first.
   * Burn-expired mail is gone from the view (SPEC §16): `exp` was already
   * filtered at read time; `bar` messages drop once this vault has displayed
   * the conversation past their window.
   */
  async loadConversation(me, peer) {
    const [mine, theirs] = await Promise.all([
      this.store.readInbox(me),
      this.store.readInbox(peer)
    ]);
    const byId = /* @__PURE__ */ new Map();
    const add2 = (m) => {
      if (!byId.has(m.id)) byId.set(m.id, m);
    };
    if (peer === me) {
      mine.filter((m) => m.from === me).forEach(add2);
      if (this.keepOutbox) {
        (await this.store.readOutbox(me)).filter((m) => m.to === me).forEach(add2);
      }
    } else {
      mine.filter((m) => m.from === peer).forEach(add2);
      theirs.filter((m) => m.from === me).forEach(add2);
      if (this.keepOutbox) {
        (await this.store.readOutbox(me)).filter((m) => m.to === peer).forEach(add2);
      }
    }
    const readAt = this.readAtSource?.()[peer];
    const shown = [...byId.values()].sort(
      (a, b) => a.ts.localeCompare(b.ts) || a.id.localeCompare(b.id)
    );
    if (!readAt) return shown;
    const readMs = Date.parse(readAt);
    const now = Date.now();
    return shown.filter((m) => !(m.bar && now >= readMs + m.bar * 1e3));
  }
  /**
   * The burn sweep (SPEC §16): delete burned blocks from every inbox and
   * outbox on disk. `exp` is absolute; `bar` burns relative to when this
   * vault displayed the message's conversation (readAt, keyed by peer).
   * Returns the number of blocks dropped.
   */
  async burnSweep(me, readAtByPeer) {
    const now = Date.now();
    const burned = (m) => {
      if (isExpired(m, now)) return true;
      if (m.bar) {
        const peer = m.from === me ? m.to : m.from;
        const read = readAtByPeer[peer];
        if (read && now >= Date.parse(read) + m.bar * 1e3) return true;
      }
      return false;
    };
    let dropped = 0;
    for (const address of await this.store.listAddresses()) {
      dropped += await this.store.sweepBurned(address, burned);
    }
    return dropped;
  }
  /**
   * Drop messages older than maxAgeMs from every inbox, and everything past
   * maxMessages per inbox when set (oldest first). Per-address overrides from
   * gcPolicySource win over the arguments (per-address retention). The
   * receiver's own cursor protects still-reachable mail from the age drop
   * (SPEC §7 invariant); the size cap applies regardless of age. Returns
   * count dropped.
   */
  async gc(maxAgeMs, maxMessages = 0) {
    let dropped = 0;
    for (const address of await this.store.listAddresses()) {
      let ageMs = maxAgeMs;
      let cap = maxMessages;
      const policy = this.gcPolicySource?.(address);
      if (policy) {
        if (typeof policy.maxAgeMs === "number") ageMs = policy.maxAgeMs;
        if (typeof policy.maxMessages === "number") cap = policy.maxMessages;
      }
      dropped += await this.store.gc(address, ageMs, cap, this.cursors[address] ?? null);
      await this.store.gcReceipts(address, ageMs);
      dropped += await this.store.gcOutbox(address, ageMs, cap);
    }
    return dropped;
  }
};
function pendingAfter(messages, cursor) {
  if (!cursor) return messages;
  const idx = messages.findIndex((m) => m.id === cursor.id);
  if (idx >= 0) return messages.slice(idx + 1);
  const ts = Date.parse(cursor.ts);
  return messages.filter((m) => Date.parse(m.ts) > ts);
}

// src/mailbox/receipts.ts
var RECEIPT_LINE_RE = /<!--\s*receipts:\s*(\{[^\r\n]*\})\s*-->/g;
var RECEIPT_RANK = {
  delivered: 1,
  read: 2
};
var receiptsHeader = (address) => `# Receipts \u2014 ${address}

Append-only acknowledgments of this inbox's mail. Written by the owner's plugin, read by senders. See SPEC.md \xA711.

`;
function encodeReceiptBlock(by, state, ts, ids) {
  const payload = JSON.stringify({ by, state, ts, ids });
  return `<!-- receipts: ${payload} -->
`;
}
function parseReceipts(content) {
  const out = /* @__PURE__ */ new Map();
  const re = new RegExp(RECEIPT_LINE_RE.source, "g");
  let match;
  while ((match = re.exec(content)) !== null) {
    try {
      const header = JSON.parse(match[1]);
      if (header.state !== "delivered" && header.state !== "read") continue;
      if (typeof header.ts !== "string") continue;
      if (!Array.isArray(header.ids)) continue;
      for (const id of header.ids) {
        if (typeof id !== "string") continue;
        const existing = out.get(id);
        if (!existing || RECEIPT_RANK[header.state] >= RECEIPT_RANK[existing.state]) {
          out.set(id, { state: header.state, ts: header.ts });
        }
      }
    } catch {
    }
  }
  return out;
}
function pruneReceiptLines(content, cutoffMs) {
  const kept = [];
  const re = new RegExp(RECEIPT_LINE_RE.source, "g");
  let match;
  while ((match = re.exec(content)) !== null) {
    try {
      const header = JSON.parse(match[1]);
      if (typeof header.ts === "string" && Date.parse(header.ts) > cutoffMs) {
        kept.push(match[0]);
      }
    } catch {
    }
  }
  return kept.length ? kept.join("\n") + "\n" : "";
}

// src/reserved.ts
var BUS_ADDRESS = "message-bus";
var RESERVED_ADDRESSES = [
  // system & infrastructure — the bus, its files, and mail machinery
  "abuse",
  "admin",
  "administrator",
  "alert",
  "alerts",
  "announce",
  "announcements",
  "api",
  "backup",
  "bus",
  "contacts",
  "daemon",
  "help",
  "helpdesk",
  "hostmaster",
  "inbox",
  "mail",
  "messenger",
  "mod",
  "moderator",
  "netadmin",
  "newsletter",
  "no-reply",
  "noreply",
  "notifications",
  "obsidian",
  "obsidian-messenger",
  "official",
  "outbox",
  "postmaster",
  "receipts",
  "registry",
  "root",
  "security",
  "server",
  "staff",
  "sudo",
  "support",
  "sync",
  "sysadmin",
  "system",
  "team",
  "message-bus",
  "webmaster",
  // corporate roles that sign things
  "ceo",
  "cfo",
  "coo",
  "cto",
  "hr",
  "payroll",
  // finance — cards, banks, brokers, transfers
  "amex",
  "bank",
  "bank-of-america",
  "banker",
  "banking",
  "bankofamerica",
  "billing",
  "binance",
  "bitcoin",
  "blackrock",
  "bluecross",
  "capital-one",
  "cash",
  "cashapp",
  "chase",
  "citibank",
  "citigroup",
  "coinbase",
  "crypto",
  "discover",
  "ethereum",
  "etrade",
  "fidelity",
  "hsbc",
  "invoice",
  "jp-morgan",
  "jpmorgan",
  "klarna",
  "kraken",
  "ledger",
  "mastercard",
  "metamask",
  "moneygram",
  "pay",
  "payment",
  "payments",
  "paypal",
  "pnc",
  "revolut",
  "rbc",
  "robinhood",
  "schwab",
  "statefarm",
  "state-farm",
  "stripe",
  "synchrony",
  "td-bank",
  "trezor",
  "trustwallet",
  "trust-wallet",
  "unionpay",
  "us-bank",
  "usaa",
  "vanguard",
  "venmo",
  "visa",
  "wallet",
  "wellsfargo",
  "wells-fargo",
  "westernunion",
  "western-union",
  "zelle",
  // insurance & health
  "aetna",
  "aig",
  "allstate",
  "cigna",
  "geico",
  "humana",
  "kaiser",
  "liberty-mutual",
  "metlife",
  "nationwide",
  "progressive",
  "prudential",
  "unitedhealth",
  "united-health",
  // government, law, emergency — US
  "911",
  "army",
  "atf",
  "border-patrol",
  "cbp",
  "cdc",
  "cia",
  "coast-guard",
  "congress",
  "court",
  "customs",
  "dea",
  "dmv",
  "dod",
  "dhs",
  "district-attorney",
  "emergency",
  "epa",
  "faa",
  "fbi",
  "fda",
  "federal-reserve",
  "fcc",
  "ftc",
  "gov",
  "government",
  "ice",
  "immigration",
  "internal-revenue-service",
  "irs",
  "judge",
  "marines",
  "medicaid",
  "medicare",
  "national-guard",
  "navy",
  "nih",
  "nsa",
  "passport",
  "police",
  "potus",
  "president",
  "secret-service",
  "senate",
  "sheriff",
  "social-security",
  "ssa",
  "state-department",
  "treasury",
  "uscis",
  "us-air-force",
  "us-army",
  "us-navy",
  "us-postal-service",
  "usps",
  "us-treasury",
  "va",
  "white-house",
  "whitehouse",
  // government, law, emergency — international
  "000",
  "100",
  "101",
  "110",
  "112",
  "113",
  "117",
  "118",
  "119",
  "999",
  "europol",
  "gov-uk",
  "hmrc",
  "home-office",
  "interpol",
  "met-police",
  "nhs",
  "scotland-yard",
  // political titles & offices
  "ambassador",
  "chancellor",
  "congressman",
  "congresswoman",
  "governor",
  "mayor",
  "minister",
  "prime-minister",
  "senator",
  "secretary",
  // news brands — fake-breaking-news impersonation
  "bbc",
  "bloomberg",
  "cnn",
  "forbes",
  "fox-news",
  "msnbc",
  "new-york-times",
  "npr",
  "nytimes",
  "reuters",
  "wall-street-journal",
  "wsj",
  // religion — titles & institutions, never personal names of figures
  // (muhammad and jesus are among the most common given names on earth;
  // blocking them blocks real people, not borrowed weight)
  "archbishop",
  "ayatollah",
  "bishop",
  "cardinal",
  "church",
  "dalai-lama",
  "diocese",
  "guru",
  "imam",
  "monsignor",
  "mosque",
  "pastor",
  "pope",
  "priest",
  "rabbi",
  "reverend",
  "synagogue",
  "vatican",
  // public figures — the most-impersonated people, full distinctive names
  // (plus bare surnames where the surname itself is unmistakable, so
  // "musk-giveaway" and "trump-crypto" reject too)
  "andrew-tate",
  "barack-obama",
  "beyonce",
  "biden",
  "bill-clinton",
  "bill-gates",
  "boris-johnson",
  "conor-mcgregor",
  "donald-trump",
  "dwayne-johnson",
  "ellen-degeneres",
  "elon-musk",
  "eminem",
  "hillary-clinton",
  "jack-dorsey",
  "jeff-bezos",
  "joe-biden",
  "joe-rogan",
  "justin-bieber",
  "kamala-harris",
  "kim-kardashian",
  "kanye-west",
  "leonardo-dicaprio",
  "macron",
  "mark-zuckerberg",
  "merkel",
  "mrbeast",
  "musk",
  "nancy-pelosi",
  "obama",
  "oprah",
  "putin",
  "rihanna",
  "satoshi-nakamoto",
  "snoop-dogg",
  "steve-jobs",
  "sundar-pichai",
  "taylor-swift",
  "tim-cook",
  "trump",
  "vitalik-buterin",
  "warren-buffett",
  "will-smith",
  "zelensky",
  // athletes — global-tier, same full-name rule
  "cristiano-ronaldo",
  "kevin-durant",
  "lebron",
  "lebron-james",
  "lionel-messi",
  "messi",
  "michael-jordan",
  "neymar",
  "patrick-mahomes",
  "pele",
  "ronaldo",
  "serena-williams",
  "stephen-curry",
  "tom-brady",
  // scam phrases — the words fake authority is always saying
  "giftcard",
  "gift-card",
  "kyc",
  "lottery",
  "seedphrase",
  "seed-phrase",
  "sweepstakes",
  "verification",
  "verified",
  "verify",
  // international organizations
  "imf",
  "nato",
  "red-cross",
  "unicef",
  "unesco",
  "united-nations",
  "who",
  "world-bank",
  "wto",
  // big tech & platforms
  "adobe",
  "airbnb",
  "alibaba",
  "amazon",
  "android",
  "aol",
  "apple",
  "baidu",
  "bing",
  "bytedance",
  "canva",
  "chrome",
  "cisco",
  "discord",
  "docker",
  "dropbox",
  "duckduckgo",
  "facebook",
  "figma",
  "firefox",
  "gcp",
  "github",
  "gitlab",
  "gmail",
  "google",
  "hotmail",
  "ibm",
  "icloud",
  "instagram",
  "intel",
  "linkedin",
  "meta",
  "microsoft",
  "netflix",
  "notion",
  "nvidia",
  "openai",
  "oracle",
  "outlook",
  "pinterest",
  "playstation",
  "reddit",
  "roblox",
  "salesforce",
  "safari",
  "samsung",
  "signal",
  "skype",
  "slack",
  "snapchat",
  "sony",
  "spotify",
  "steam",
  "telegram",
  "tencent",
  "tiktok",
  "twitch",
  "twitter",
  "whatsapp",
  "windows",
  "xbox",
  "xiaomi",
  "yahoo",
  "youtube",
  "zoom",
  // AI labs & assistants
  "anthropic",
  "chatgpt",
  "claude",
  "copilot",
  "deepmind",
  "deepseek",
  "gemini",
  "grok",
  "huggingface",
  "midjourney",
  "mistral",
  "perplexity",
  "runway",
  "scale-ai",
  "stability-ai",
  "xai",
  // cloud, dev & security vendors
  "1password",
  "aws",
  "azure",
  "bitbucket",
  "bitwarden",
  "centos",
  "cloudflare",
  "cloudflare-security",
  "crowdstrike",
  "cyberark",
  "debian",
  "digitalocean",
  "fedora",
  "fortinet",
  "heroku",
  "kaspersky",
  "kubernetes",
  "lastpass",
  "linux",
  "malwarebytes",
  "mcafee",
  "microsoft-365",
  "netlify",
  "npm",
  "norton",
  "okta",
  "pypi",
  "redhat",
  "sophos",
  "splunk",
  "ubuntu",
  "vercel",
  "virustotal",
  // Fortune-500-scale consumer brands
  "aldi",
  "amtrak",
  "audi",
  "autodesk",
  "berkshire-hathaway",
  "best-buy",
  "bestbuy",
  "bmw",
  "boeing",
  "caterpillar",
  "chevron",
  "chipotle",
  "coca-cola",
  "coke",
  "costco",
  "deere",
  "delta",
  "dhl",
  "doordash",
  "exxon",
  "exxonmobil",
  "fedex",
  "ford",
  "general-electric",
  "general-motors",
  "grubhub",
  "hilton",
  "home-depot",
  "homedepot",
  "honda",
  "hyundai",
  "instacart",
  "johnson-johnson",
  "kroger",
  "lowes",
  "lyft",
  "macys",
  "marriott",
  "mcdonalds",
  "mercedes",
  "nike",
  "nordstrom",
  "pepsi",
  "pepsico",
  "pfizer",
  "starbucks",
  "target",
  "toyota",
  "uber",
  "united-airlines",
  "ups",
  "volkswagen",
  "walmart",
  "walgreens",
  // energy & industry
  "bp",
  "duke-energy",
  "shell",
  "totalenergies",
  // academia — institutions
  "berkeley",
  "brown",
  "caltech",
  "cambridge",
  "carnegie-mellon",
  "columbia",
  "cornell",
  "dartmouth",
  "duke",
  "epfl",
  "eth-zurich",
  "harvard",
  "imperial",
  "johns-hopkins",
  "mit",
  "michigan",
  "northwestern",
  "nyu",
  "oxford",
  "princeton",
  "penn-state",
  "stanford",
  "tsinghua",
  "ucla",
  "ucberkeley",
  "uchicago",
  "upenn",
  "yale",
  // academia — the offices scammers impersonate
  "admissions",
  "bursar",
  "dean",
  "edu",
  "fafsa",
  "financial-aid",
  "provost",
  "registrar",
  "scholarship",
  "scholarships",
  "tuition"
];
var RESERVED_SET = new Set(RESERVED_ADDRESSES);
function isReservedAddress(address) {
  const norm = address.trim().toLowerCase();
  if (norm === "") return false;
  if (RESERVED_SET.has(norm)) return true;
  const tokens = norm.split(/[._-]+/);
  return tokens.some((t) => t !== "" && RESERVED_SET.has(t));
}

// src/api.ts
var sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
function createApi(bus, store, ctx2) {
  const waitForDelivery = async (peer, messageId, options = {}) => {
    if (!ADDRESS_RE.test(peer)) {
      throw new MessengerError(`Invalid recipient address: ${peer}`, "invalid_address");
    }
    const until = options.until ?? "delivered";
    const timeoutMs = Math.max(1, options.timeoutMs ?? 6e4);
    const pollMs = Math.min(6e4, Math.max(250, options.pollMs ?? 1e3));
    const deadline = Date.now() + timeoutMs;
    for (; ; ) {
      if (await store.hasReceipts(peer)) {
        const hit = parseReceipts(await store.readReceiptsRaw(peer)).get(messageId);
        if (hit && RECEIPT_RANK[hit.state] >= RECEIPT_RANK[until]) return hit;
      }
      if (Date.now() >= deadline) {
        throw new MessengerError(
          `No ${until} receipt from ${peer} for ${messageId} within ${timeoutMs}ms`,
          "receipt_timeout"
        );
      }
      await sleep(Math.min(pollMs, Math.max(1, deadline - Date.now())));
    }
  };
  const api = {
    version: 1,
    onMessage: (handler, address) => bus.subscribe(handler, address),
    checkInboxes: () => bus.tick(),
    registry: () => store.readRegistry(),
    contacts: () => ctx2.contacts(),
    async addContact(address, name) {
      if (!ADDRESS_RE.test(address)) {
        throw new MessengerError(`Invalid messenger address: ${address}`, "invalid_address");
      }
      if (isReservedAddress(address)) {
        throw new MessengerError(
          `Reserved messenger address: ${address} \u2014 no one can hold a name with that weight (SPEC \xA72)`,
          "reserved_address"
        );
      }
      await ctx2.addContact(address, name ?? address);
    },
    async conversations(options) {
      const me = ctx2.address();
      const readAt = ctx2.readAt();
      const muted = ctx2.mutedPeers();
      const [addresses, registry, mine] = await Promise.all([
        store.listAddresses(),
        store.readRegistry(),
        store.readInbox(me)
      ]);
      const names = new Map(registry.map((r) => [r.address, r.name]));
      const unreadBySender = /* @__PURE__ */ new Map();
      const since = (from) => readAt[from] ?? "";
      for (const m of mine) {
        if (m.from === me || m.ts <= since(m.from)) continue;
        unreadBySender.set(m.from, (unreadBySender.get(m.from) ?? 0) + 1);
      }
      const out = [];
      for (const address of addresses) {
        const messages = await bus.loadConversation(me, address);
        const last = messages[messages.length - 1] ?? null;
        out.push({
          address,
          name: names.get(address) ?? address,
          unread: address === me ? 0 : unreadBySender.get(address) ?? 0,
          lastTs: last?.ts ?? null,
          muted: muted[address] === true
        });
      }
      out.sort(
        (a, b) => (b.lastTs ?? "").localeCompare(a.lastTs ?? "") || a.address.localeCompare(b.address)
      );
      const offset = Math.max(0, options?.offset ?? 0);
      const limit = options?.limit;
      return limit === void 0 ? out.slice(offset) : out.slice(offset, offset + Math.max(0, limit));
    },
    async messages(peer, options = {}) {
      if (!ADDRESS_RE.test(peer)) {
        throw new MessengerError(`Invalid messenger address: ${peer}`, "invalid_address");
      }
      const all = await bus.loadConversation(ctx2.address(), peer);
      const bounded = options.before ? all.filter((m) => m.ts < options.before) : all;
      const limit = Math.max(0, options.limit ?? 50);
      return bounded.slice(Math.max(0, bounded.length - limit));
    },
    markRead: (peer) => ctx2.markPeerRead(peer),
    waitForDelivery,
    async client(address, options) {
      if (!ADDRESS_RE.test(address)) {
        throw new MessengerError(`Invalid messenger address: ${address}`, "invalid_address");
      }
      if (isReservedAddress(address)) {
        throw new MessengerError(
          `Reserved messenger address: ${address} \u2014 no one can hold a name with that weight (SPEC \xA72)`,
          "reserved_address"
        );
      }
      await store.ensureAddress(address);
      await store.upsertRegistry({
        address,
        name: options?.name ?? address,
        updated: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (address !== ctx2.address()) {
        await ctx2.addContact(address, options?.name ?? address);
      }
      return {
        address,
        send: (to, body, sendOptions) => bus.send(address, to, body, sendOptions),
        async sendAndWait(to, body, sendOptions = {}) {
          const message = await bus.send(address, to, body, sendOptions);
          const receipt = await waitForDelivery(to, message.id, {
            until: sendOptions.until,
            timeoutMs: sendOptions.timeoutMs
          });
          return { message, receipt };
        },
        onMessage: (handler) => bus.subscribe(handler, address)
      };
    }
  };
  return api;
}

// src/mailbox/store.ts
var import_obsidian = require("obsidian");
var inboxHeader = (address) => `# Inbox \u2014 ${address}

Append-only, oldest at top. Do not reorder or edit delivered blocks. See SPEC.md.

`;
var outboxHeader = (address) => `# Outbox \u2014 ${address}

Copies of mail this address sent (settings: keep a copy of sent mail). See SPEC.md \xA713.

`;
var CONFLICT_SIBLING = /^inbox[ .(].*\.md$/i;
var MailboxStore = class {
  constructor(adapter, root) {
    this.adapter = adapter;
    this.root = root;
    /** Parsed files keyed by path, revalidated against stat on every read. */
    this.inboxCache = /* @__PURE__ */ new Map();
    this.rawCache = /* @__PURE__ */ new Map();
    /**
     * Stat fingerprints from the last GC parse, keyed by file: an unchanged
     * file whose oldest kept message hasn't aged past the cutoff skips the
     * read+parse entirely (messages can't newly expire while bytes stand still).
     */
    this.gcStats = /* @__PURE__ */ new Map();
    /** Same idea for the burn sweep — a file with no burn fields never burns. */
    this.sweepStats = /* @__PURE__ */ new Map();
    /**
     * Parsed registry, revalidated against stat: every chat refresh reads it
     * (list names, thread metas), but it only changes through this class or a
     * hand edit (which bumps mtime).
     */
    this.registryCache = null;
    /**
     * The vault key, while a session has it (SPEC §15). Sealed bodies are
     * opened on read and sealed on fresh append; with no key, sealed blocks
     * pass through reads and rewrites untouched — ciphertext is never lost.
     */
    this.cipher = null;
  }
  setRoot(root) {
    this.root = root;
    this.inboxCache.clear();
    this.rawCache.clear();
    this.gcStats.clear();
    this.registryCache = null;
  }
  /** Install or drop the vault key; cached reads depend on it. */
  setCipher(cipher) {
    this.cipher = cipher;
    this.inboxCache.clear();
  }
  hasCipher() {
    return this.cipher !== null;
  }
  /**
   * Encode one message for disk: pre-sealed bodies pass through as-is (the
   * body already is ciphertext that matches the iv), fresh plaintext gets a
   * new seal when a key is in session, otherwise it stays plaintext.
   * Returns the block and the sealed body actually written, if any.
   */
  async encodeBlock(message) {
    if (message.enc) {
      return {
        block: encodeMessage(message),
        sealed: { iv: message.enc.iv, ct: message.body }
      };
    }
    if (this.cipher) {
      const { iv, ct } = await this.cipher.seal(message.body);
      const seal = { v: 1, iv };
      return { block: encodeMessage({ ...message, body: ct, enc: seal }), sealed: { iv, ct } };
    }
    return { block: encodeMessage(message), sealed: null };
  }
  /**
   * Open sealed bodies (clearing their markers), drop burn-expired mail, and
   * leave undecryptable bodies locked-and-preserved for the caller to flag.
   */
  async resolveBodies(messages) {
    const live = messages.filter((m) => !isExpired(m));
    const cipher = this.cipher;
    if (!cipher || !live.some((m) => m.enc)) return live;
    return Promise.all(
      live.map(async (m) => {
        if (!m.enc) return m;
        try {
          const body = await cipher.open(m.enc.iv, m.body);
          const opened = { ...m, body };
          delete opened.enc;
          delete opened.encLocked;
          return opened;
        } catch {
          return m;
        }
      })
    );
  }
  get rootPath() {
    return (0, import_obsidian.normalizePath)(this.root);
  }
  /** Dot-prefixed roots live outside Obsidian's vault index. */
  get hidden() {
    return this.rootPath.startsWith(".");
  }
  get registryPath() {
    return (0, import_obsidian.normalizePath)(`${this.root}/registry.md`);
  }
  inboxPath(address) {
    return (0, import_obsidian.normalizePath)(`${this.root}/${address}/inbox.md`);
  }
  receiptsPath(address) {
    return (0, import_obsidian.normalizePath)(`${this.root}/${address}/receipts.md`);
  }
  outboxPath(address) {
    return (0, import_obsidian.normalizePath)(`${this.root}/${address}/outbox.md`);
  }
  /** Folder holding everything this participant owns (inbox, receipts, outbox). */
  addressPath(address) {
    return (0, import_obsidian.normalizePath)(`${this.root}/${address}`);
  }
  async ensureRoot() {
    await ensureFolder(this.adapter, this.root);
  }
  async ensureAddress(address) {
    if (!ADDRESS_RE.test(address)) {
      throw new Error(`Invalid messenger address: ${address}`);
    }
    await ensureFolder(this.adapter, `${this.root}/${address}`);
  }
  /** All address folders under the root, sorted. */
  async listAddresses() {
    let folders;
    try {
      folders = (await this.adapter.list(this.rootPath)).folders;
    } catch {
      return [];
    }
    return folders.map((folder) => folder.split("/").pop() ?? "").filter(Boolean).sort();
  }
  /**
   * Append one message to an address's inbox, sealing the body when a key is
   * in session. Returns the sealed body written (or null for plaintext) so
   * callers can keep ciphertext-only copies (retransmission memory, SPEC §14).
   */
  async append(address, message) {
    await ensureFolder(this.adapter, `${this.root}/${address}`);
    const path = this.inboxPath(address);
    const { block: block2, sealed } = await this.encodeBlock(message);
    if (await this.adapter.exists(path)) {
      await this.adapter.append(path, block2);
    } else {
      await this.adapter.append(path, inboxHeader(address) + block2);
    }
    return sealed;
  }
  statOf(path) {
    return statFile(this.adapter, path);
  }
  async removeQuietly(path) {
    try {
      await this.adapter.remove(path);
    } catch {
    }
  }
  /** Trash a merged conflict sibling; plain removal where trash is unsupported. */
  async trashQuietly(path) {
    try {
      await this.adapter.trashLocal(path);
      return;
    } catch {
    }
    await this.removeQuietly(path);
  }
  async readInbox(address) {
    const path = this.inboxPath(address);
    const st = await this.statOf(path);
    if (!st) {
      this.inboxCache.delete(path);
      return [];
    }
    const hit = this.inboxCache.get(path);
    if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) {
      return hit.messages;
    }
    const messages = await this.resolveBodies(parseInbox(await this.adapter.read(path)));
    this.inboxCache.set(path, { mtimeMs: st.mtimeMs, size: st.size, messages });
    return messages;
  }
  /**
   * Sender-side copy of outgoing mail (optional, settings.keepOutbox). Same
   * block format as an inbox; the chat view merges it with the recipient's
   * copy, deduped by id, so enabling it mid-history is safe.
   */
  async appendOutbox(address, message) {
    await ensureFolder(this.adapter, `${this.root}/${address}`);
    const path = this.outboxPath(address);
    const { block: block2, sealed } = await this.encodeBlock(message);
    this.inboxCache.delete(path);
    if (await this.adapter.exists(path)) {
      await this.adapter.append(path, block2);
    } else {
      await this.adapter.append(path, outboxHeader(address) + block2);
    }
    return sealed;
  }
  async readOutbox(address) {
    const path = this.outboxPath(address);
    const st = await this.statOf(path);
    if (!st) {
      this.inboxCache.delete(path);
      return [];
    }
    const hit = this.inboxCache.get(path);
    if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) {
      return hit.messages;
    }
    const messages = await this.resolveBodies(parseInbox(await this.adapter.read(path)));
    this.inboxCache.set(path, { mtimeMs: st.mtimeMs, size: st.size, messages });
    return messages;
  }
  /**
   * Drop outbox blocks older than maxAgeMs — and beyond maxMessages when
   * set — keeping the newest. Returns count dropped.
   */
  async gcOutbox(address, maxAgeMs, maxMessages = 0) {
    if (maxAgeMs <= 0 && maxMessages <= 0) return 0;
    const path = this.outboxPath(address);
    if (!await this.adapter.exists(path)) return 0;
    const cutoff = maxAgeMs > 0 ? Date.now() - maxAgeMs : Number.NEGATIVE_INFINITY;
    const st = await this.statOf(path);
    const fingerprint3 = st ? this.gcStats.get(path) : void 0;
    if (st && fingerprint3 && fingerprint3.mtimeMs === st.mtimeMs && fingerprint3.size === st.size && fingerprint3.minTs > cutoff) {
      return 0;
    }
    const content = await this.adapter.read(path);
    const all = parseInbox(content);
    const kept = all.filter((m) => Date.parse(m.ts) > cutoff && !isExpired(m));
    let dropped = all.length - kept.length;
    if (maxMessages > 0 && kept.length > maxMessages) {
      dropped += kept.length - maxMessages;
      kept.splice(0, kept.length - maxMessages);
    }
    if (dropped === 0) {
      if (st) {
        this.gcStats.set(path, {
          mtimeMs: st.mtimeMs,
          size: st.size,
          minTs: kept.reduce((min, m) => Math.min(min, Date.parse(m.ts)), Infinity)
        });
      }
      return 0;
    }
    this.inboxCache.delete(path);
    this.gcStats.delete(path);
    if (kept.length === 0) {
      await this.removeQuietly(path);
      return dropped;
    }
    await this.adapter.write(
      path,
      outboxHeader(address) + kept.map(encodeMessage).join("")
    );
    return dropped;
  }
  /**
   * Trash the folder holding an address's inbox/receipts/outbox — used by
   * "delete conversation". The system trash is preferred; a plain remove is
   * the fallback where the adapter can't trash (some mobile adapters).
   */
  async deleteAddress(address) {
    const folder = this.addressPath(address);
    this.inboxCache.clear();
    this.rawCache.clear();
    this.gcStats.clear();
    try {
      await this.adapter.trashLocal(folder);
      return;
    } catch {
    }
    await this.adapter.rmdir(folder, true).catch(() => {
    });
  }
  /** Append one receipt block to an address's receipts file (creating it). */
  async appendReceiptBlock(address, block2) {
    await ensureFolder(this.adapter, `${this.root}/${address}`);
    const path = this.receiptsPath(address);
    if (await this.adapter.exists(path)) {
      await this.adapter.append(path, block2);
    } else {
      await this.adapter.append(path, receiptsHeader(address) + block2);
    }
  }
  async readReceiptsRaw(address) {
    const path = this.receiptsPath(address);
    const st = await this.statOf(path);
    if (!st) {
      this.rawCache.delete(path);
      return "";
    }
    const hit = this.rawCache.get(path);
    if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) {
      return hit.content;
    }
    const content = await this.adapter.read(path);
    this.rawCache.set(path, { mtimeMs: st.mtimeMs, size: st.size, content });
    return content;
  }
  /**
   * Whether the address publishes a receipts file at all (SPEC §11) — the
   * signal senders use to decide whether receipts-based ACKs (and therefore
   * retransmission, §14) apply to this peer at all.
   */
  async hasReceipts(address) {
    return await this.statOf(this.receiptsPath(address)) !== null;
  }
  /** Drop receipt lines older than maxAgeMs from one address. */
  async gcReceipts(address, maxAgeMs) {
    if (maxAgeMs <= 0) return;
    const path = this.receiptsPath(address);
    if (!await this.adapter.exists(path)) return;
    const content = await this.adapter.read(path);
    const kept = pruneReceiptLines(content, Date.now() - maxAgeMs);
    this.rawCache.delete(path);
    if (!kept) {
      await this.removeQuietly(path);
      return;
    }
    const next = receiptsHeader(address) + kept;
    if (next !== content) {
      await this.adapter.write(path, next);
    }
  }
  /**
   * Drop blocks older than maxAgeMs — and beyond maxMessages when set — from
   * one inbox, keeping the newest. Duplicate-id blocks (retransmitted mail,
   * SPEC §14) collapse to their first occurrence. Returns count dropped.
   *
   * With a cursor (SPEC §7 invariant), no message newer than the cursor's ts
   * is ever age-dropped: a receiver whose cursor id was pruned falls back to
   * ts comparison (§4), and dropping such mail would lose it forever. The
   * maxMessages cap still applies regardless of age — the spec grants the
   * size cap that power explicitly so a busy inbox stays bounded.
   */
  async gc(address, maxAgeMs, maxMessages = 0, cursor = null) {
    if (maxAgeMs <= 0 && maxMessages <= 0) return 0;
    const path = this.inboxPath(address);
    if (!await this.adapter.exists(path)) return 0;
    const cutoff = maxAgeMs > 0 ? Date.now() - maxAgeMs : Number.NEGATIVE_INFINITY;
    const st = await this.statOf(path);
    const fingerprint3 = st ? this.gcStats.get(path) : void 0;
    if (st && fingerprint3 && fingerprint3.mtimeMs === st.mtimeMs && fingerprint3.size === st.size && fingerprint3.minTs > cutoff) {
      return 0;
    }
    const content = await this.adapter.read(path);
    const all = parseInbox(content);
    const seen = /* @__PURE__ */ new Set();
    const unique = all.filter((m) => !seen.has(m.id) && (seen.add(m.id), true));
    const cursorTs = cursor ? Date.parse(cursor.ts) : NaN;
    const reach = (m) => Number.isFinite(cursorTs) && !isExpired(m) && Date.parse(m.ts) > cursorTs;
    const kept = unique.filter((m) => Date.parse(m.ts) > cutoff && !isExpired(m) || reach(m));
    let dropped = all.length - kept.length;
    if (maxMessages > 0 && kept.length > maxMessages) {
      dropped += kept.length - maxMessages;
      kept.splice(0, kept.length - maxMessages);
    }
    if (dropped === 0) {
      if (st) {
        this.gcStats.set(path, {
          mtimeMs: st.mtimeMs,
          size: st.size,
          minTs: kept.reduce((min, m) => Math.min(min, Date.parse(m.ts)), Infinity)
        });
      }
      return 0;
    }
    this.inboxCache.delete(path);
    this.gcStats.delete(path);
    await this.adapter.write(
      path,
      inboxHeader(address) + kept.map(encodeMessage).join("")
    );
    return dropped;
  }
  /**
   * The burn sweep (SPEC §16): drop blocks the caller judges burned from one
   * address's inbox and outbox. Works without the vault key — the predicate
   * reads envelope fields only, and sealed bodies are re-encoded byte-for-byte.
   * Returns the number of blocks dropped.
   */
  async sweepBurned(address, isBurned) {
    let dropped = 0;
    dropped += await this.sweepFile(
      this.inboxPath(address),
      () => inboxHeader(address),
      isBurned
    );
    dropped += await this.sweepFile(
      this.outboxPath(address),
      () => outboxHeader(address),
      isBurned
    );
    return dropped;
  }
  async sweepFile(path, makeHeader, isBurned) {
    if (!await this.adapter.exists(path)) return 0;
    const st = await this.statOf(path);
    const prev = st ? this.sweepStats.get(path) : void 0;
    if (st && prev && prev.mtimeMs === st.mtimeMs && prev.size === st.size && !prev.hasBurnFields) {
      return 0;
    }
    const all = parseInbox(await this.adapter.read(path));
    const hasBurnFields = all.some((m) => m.exp || m.bar);
    if (!hasBurnFields) {
      if (st) this.sweepStats.set(path, { mtimeMs: st.mtimeMs, size: st.size, hasBurnFields: false });
      return 0;
    }
    const kept = all.filter((m) => !isBurned(m));
    const dropped = all.length - kept.length;
    if (dropped === 0) {
      if (st) this.sweepStats.set(path, { mtimeMs: st.mtimeMs, size: st.size, hasBurnFields: true });
      return 0;
    }
    this.inboxCache.delete(path);
    this.gcStats.delete(path);
    this.sweepStats.delete(path);
    if (kept.length === 0) {
      await this.removeQuietly(path);
      return dropped;
    }
    await this.adapter.write(path, makeHeader() + kept.map(encodeMessage).join(""));
    return dropped;
  }
  /**
   * Rewrite every inbox and outbox, sealing plaintext bodies (needs the
   * vault key) or unsealing everything (key active, writes plaintext).
   * The one-shot migration behind the encryption toggle — not part of the
   * poll loop.
   */
  async rewriteAll(seal) {
    if (seal && !this.cipher) {
      throw new Error("sealing rewrite requires the vault key");
    }
    let files = 0;
    let messages = 0;
    for (const address of await this.listAddresses()) {
      const targets = [
        [() => this.readInbox(address), this.inboxPath(address)],
        [() => this.readOutbox(address), this.outboxPath(address)]
      ];
      for (const [read, path] of targets) {
        const all = await read();
        if (all.length === 0) continue;
        const blocks = [];
        for (const message of all) {
          if (message.enc) {
            blocks.push(encodeMessage(message));
          } else if (seal) {
            blocks.push((await this.encodeBlock(message)).block);
          } else {
            blocks.push(encodeMessage(message));
          }
        }
        const header = path === this.outboxPath(address) ? outboxHeader(address) : inboxHeader(address);
        this.inboxCache.delete(path);
        this.gcStats.delete(path);
        this.sweepStats.delete(path);
        await this.adapter.write(path, header + blocks.join(""));
        files++;
        messages += all.length;
      }
    }
    return { files, messages };
  }
  /**
   * Sync engines that can't merge two devices appending at once leave
   * conflict copies beside the inbox (see CONFLICT_SIBLING). The poll loop
   * reads only inbox.md, so mail trapped in a sibling sits unseen forever.
   * Adoption appends any block whose id the canonical inbox lacks — SPEC §4
   * dedupes by id, and because adoption appends at the end of the file,
   * file-order delivery dispatches adopted mail even when its ts is old —
   * then trashes the sibling. A sibling that parses to no message blocks is
   * left alone: it may be user content that merely looks like a conflict.
   * Returns the number of blocks adopted.
   */
  async adoptConflicts(address) {
    let listing;
    try {
      listing = await this.adapter.list(this.addressPath(address));
    } catch {
      return 0;
    }
    const siblings = listing.files.filter((file) => {
      const name = file.split("/").pop() ?? "";
      return name !== "inbox.md" && CONFLICT_SIBLING.test(name);
    });
    let adopted = 0;
    for (const sibling of siblings) {
      let blocks;
      try {
        blocks = parseInbox(await this.adapter.read(sibling));
      } catch {
        continue;
      }
      if (blocks.length === 0) continue;
      const known = new Set((await this.readInbox(address)).map((m) => m.id));
      for (const message of blocks) {
        if (known.has(message.id)) continue;
        await this.append(address, message);
        known.add(message.id);
        adopted++;
      }
      await this.trashQuietly(sibling);
    }
    return adopted;
  }
  async upsertRegistry(entry) {
    const entries = await this.readRegistry();
    await this.writeRegistry([
      entry,
      ...entries.filter((e) => e.address !== entry.address)
    ]);
  }
  /** Drop an address from the registry — used when a participant renames. */
  async removeRegistry(address) {
    const entries = await this.readRegistry();
    const kept = entries.filter((e) => e.address !== address);
    if (kept.length === entries.length) return;
    await this.writeRegistry(kept);
  }
  /** Registry rows sorted by address; the file is rewritten, never appended. */
  async writeRegistry(entries) {
    entries.sort((a, b) => a.address.localeCompare(b.address));
    const escape = (s) => s.replace(/\|/g, "\\|");
    const table = "| address | name | updated |\n| --- | --- | --- |\n" + entries.map((e) => `| ${escape(e.address)} | ${escape(e.name)} | ${escape(e.updated)} |`).join("\n") + "\n";
    const content = `# Messenger registry

Who lives on this bus. Advisory only \u2014 any folder with an inbox.md is addressable. Rewritten by plugins, not appended.

${table}`;
    this.registryCache = null;
    await ensureFolder(this.adapter, this.root);
    await this.adapter.write(this.registryPath, content);
  }
  async readRegistry() {
    const st = await this.statOf(this.registryPath);
    if (!st) {
      this.registryCache = null;
      return [];
    }
    const hit = this.registryCache;
    if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) {
      return hit.entries;
    }
    const entries = parseRegistry(await this.adapter.read(this.registryPath));
    this.registryCache = { mtimeMs: st.mtimeMs, size: st.size, entries };
    return entries;
  }
};
function parseRegistry(content) {
  const entries = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed.split("|").map((c) => c.trim());
    if (cells.length < 5) continue;
    const address = cells[1];
    const name = cells[2];
    const updated = cells[3];
    if (!address || address === "---") continue;
    if (address === "address" && name === "name" && updated === "updated") continue;
    if (!ADDRESS_RE.test(address)) continue;
    entries.push({
      address,
      name: (name || address).replace(/\\\|/g, "|"),
      updated: updated.replace(/\\\|/g, "|")
    });
  }
  return entries;
}
async function ensureFolder(adapter, relPath) {
  const path = (0, import_obsidian.normalizePath)(relPath);
  const parts = path.split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (await adapter.exists(current)) continue;
    try {
      await adapter.mkdir(current);
    } catch {
    }
  }
}
async function statFile(adapter, path) {
  try {
    const st = await adapter.stat(path);
    return st && st.type === "file" ? { mtimeMs: st.mtime, size: st.size } : null;
  } catch {
    return null;
  }
}
async function listFilesRecursive(adapter, dir, out) {
  let listing;
  try {
    listing = await adapter.list((0, import_obsidian.normalizePath)(dir));
  } catch {
    return;
  }
  for (const file of listing.files) out.push(file);
  for (const folder of listing.folders) await listFilesRecursive(adapter, folder, out);
}
var MANAGED_NAMES = /* @__PURE__ */ new Set(["inbox.md", "receipts.md", "registry.md"]);
async function migrateRoot(adapter, from, to) {
  const source = (0, import_obsidian.normalizePath)(from);
  const target = (0, import_obsidian.normalizePath)(to);
  if (source === target || target.startsWith(`${source}/`) || source.startsWith(`${target}/`)) {
    return { copied: 0, skipped: 0, trashed: false };
  }
  const files = [];
  await listFilesRecursive(adapter, source, files);
  let copied = 0;
  let skipped = 0;
  for (const file of files) {
    const name = file.split("/").pop() ?? "";
    if (!MANAGED_NAMES.has(name)) {
      skipped++;
      continue;
    }
    const dest = `${target}${file.slice(source.length)}`;
    if (await adapter.exists(dest)) {
      skipped++;
      continue;
    }
    await ensureFolder(adapter, dest.split("/").slice(0, -1).join("/"));
    await adapter.write(dest, await adapter.read(file));
    copied++;
  }
  let trashed = false;
  if (files.length > 0 && skipped === 0) {
    try {
      await adapter.trashLocal(source);
      trashed = true;
    } catch {
    }
  }
  return { copied, skipped, trashed };
}

// src/retransmit.ts
var RETRANSMIT_AFTER_MS = 5 * 60 * 1e3;
var RETRANSMIT_MAX_ATTEMPTS = 4;
var RETRANSMIT_MAX_AGE_MS = 24 * 60 * 60 * 1e3;
function planRetransmit(entry, hasReceiptsFile, receipts, now) {
  const sentAt = Date.parse(entry.sentAt);
  if (!Number.isFinite(sentAt)) return "drop";
  const messageTs = Date.parse(entry.message.ts);
  const ageBase = Number.isFinite(messageTs) ? messageTs : sentAt;
  if (now - ageBase > RETRANSMIT_MAX_AGE_MS) return "drop";
  if (!hasReceiptsFile) return "wait";
  if (receipts?.has(entry.message.id)) return "clear";
  if (now - sentAt < RETRANSMIT_AFTER_MS) return "wait";
  if (entry.attempts >= RETRANSMIT_MAX_ATTEMPTS) return "drop";
  return "retransmit";
}

// src/passcode.ts
var PASSCODE_MIN = 4;
var PASSCODE_MAX = 64;
var ROUNDS = 1500;
var K = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var rotr = (x, n) => x >>> n | x << 32 - n;
var HEX = "0123456789abcdef";
var toHex = (bytes2) => {
  let out = "";
  for (const b of bytes2) out += HEX[b >>> 4] + HEX[b & 15];
  return out;
};
function sha256Hex(message) {
  const msg = new TextEncoder().encode(message);
  const l = msg.length;
  const padded = new Uint8Array(l + 9 + 63 >>> 6 << 6);
  padded.set(msg);
  padded[l] = 128;
  const view = new DataView(padded.buffer);
  const bits = l * 8;
  view.setUint32(padded.length - 8, Math.floor(bits / 4294967296));
  view.setUint32(padded.length - 4, bits % 4294967296);
  const h = new Uint32Array([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ]);
  const w = new Uint32Array(64);
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ w[i - 15] >>> 3;
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ w[i - 2] >>> 10;
      w[i] = w[i - 16] + s0 + w[i - 7] + s1 | 0;
    }
    let a = h[0], b = h[1], c = h[2], d = h[3];
    let e = h[4], f = h[5], g = h[6], hh = h[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = e & f ^ ~e & g;
      const t1 = hh + S1 + ch + K[i] + w[i] | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = a & b ^ a & c ^ b & c;
      const t2 = S0 + maj | 0;
      hh = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    h[0] = h[0] + a | 0;
    h[1] = h[1] + b | 0;
    h[2] = h[2] + c | 0;
    h[3] = h[3] + d | 0;
    h[4] = h[4] + e | 0;
    h[5] = h[5] + f | 0;
    h[6] = h[6] + g | 0;
    h[7] = h[7] + hh | 0;
  }
  let out = "";
  for (const word of h) {
    for (let shift = 28; shift >= 0; shift -= 4) out += HEX[word >>> shift & 15];
  }
  return out;
}
function makeSalt() {
  const bytes2 = new Uint8Array(16);
  const c = window.crypto;
  if (c && typeof c.getRandomValues === "function") {
    c.getRandomValues(bytes2);
  } else {
    for (let i = 0; i < bytes2.length; i++) bytes2[i] = Math.floor(Math.random() * 256);
  }
  return toHex(bytes2);
}
function isValidPasscode(passcode) {
  const pc = passcode.trim();
  return pc.length >= PASSCODE_MIN && pc.length <= PASSCODE_MAX;
}
var ENCRYPTION_PASSCODE_MIN = 8;
function isStrongPasscode(passcode) {
  const pc = passcode.trim();
  if (pc.length < ENCRYPTION_PASSCODE_MIN || pc.length > PASSCODE_MAX) return false;
  return /\D/.test(pc);
}
function hashPasscode(passcode, salt) {
  let hash = sha256Hex(`${salt}:obsidian-messenger:${passcode.trim()}`);
  for (let i = 0; i < ROUNDS; i++) {
    hash = sha256Hex(`${salt}:${i}:${hash}`);
  }
  return hash;
}
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function verifyPasscode(candidate, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  return constantTimeEqual(hashPasscode(candidate, salt), expectedHash);
}

// node_modules/@noble/hashes/esm/_assert.js
function number(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error(`positive integer expected, not ${n}`);
}
function isBytes(a) {
  return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
}
function bytes(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error(`Uint8Array expected of length ${lengths}, not of length=${b.length}`);
}
function exists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function output(out, instance) {
  bytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error(`digestInto() expects output buffer of length at least ${min}`);
  }
}

// node_modules/@noble/hashes/esm/utils.js
var u8 = (arr) => new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
var u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
var createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
var rotr2 = (word, shift) => word << 32 - shift | word >>> shift;
var isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
var byteSwap = (word) => word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
var byteSwapIfBE = isLE ? (n) => n : (n) => byteSwap(n);
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  bytes(data);
  return data;
}
var Hash = class {
  // Safe version that clones internal state
  clone() {
    return this._cloneInto();
  }
};
var toStr = {}.toString;
function wrapConstructor(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
function wrapConstructorWithOpts(hashCons) {
  const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
  const tmp = hashCons({});
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (opts) => hashCons(opts);
  return hashC;
}

// node_modules/@noble/hashes/esm/_blake.js
var SIGMA = /* @__PURE__ */ new Uint8Array([
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9,
  12,
  5,
  1,
  15,
  14,
  13,
  4,
  10,
  0,
  7,
  6,
  3,
  9,
  2,
  8,
  11,
  13,
  11,
  7,
  14,
  12,
  1,
  3,
  9,
  5,
  0,
  15,
  4,
  8,
  6,
  2,
  10,
  6,
  15,
  14,
  9,
  11,
  3,
  0,
  8,
  12,
  2,
  13,
  7,
  1,
  4,
  10,
  5,
  10,
  2,
  8,
  4,
  7,
  6,
  1,
  5,
  15,
  11,
  9,
  14,
  3,
  12,
  13,
  0,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3
]);
var BLAKE = class extends Hash {
  constructor(blockLen, outputLen, opts = {}, keyLen, saltLen, persLen) {
    super();
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.length = 0;
    this.pos = 0;
    this.finished = false;
    this.destroyed = false;
    number(blockLen);
    number(outputLen);
    number(keyLen);
    if (outputLen < 0 || outputLen > keyLen)
      throw new Error("outputLen bigger than keyLen");
    if (opts.key !== void 0 && (opts.key.length < 1 || opts.key.length > keyLen))
      throw new Error(`key must be up 1..${keyLen} byte long or undefined`);
    if (opts.salt !== void 0 && opts.salt.length !== saltLen)
      throw new Error(`salt must be ${saltLen} byte long or undefined`);
    if (opts.personalization !== void 0 && opts.personalization.length !== persLen)
      throw new Error(`personalization must be ${persLen} byte long or undefined`);
    this.buffer32 = u32(this.buffer = new Uint8Array(blockLen));
  }
  update(data) {
    exists(this);
    const { blockLen, buffer, buffer32 } = this;
    data = toBytes(data);
    const len = data.length;
    const offset = data.byteOffset;
    const buf = data.buffer;
    for (let pos = 0; pos < len; ) {
      if (this.pos === blockLen) {
        if (!isLE)
          byteSwap32(buffer32);
        this.compress(buffer32, 0, false);
        if (!isLE)
          byteSwap32(buffer32);
        this.pos = 0;
      }
      const take = Math.min(blockLen - this.pos, len - pos);
      const dataOffset = offset + pos;
      if (take === blockLen && !(dataOffset % 4) && pos + take < len) {
        const data32 = new Uint32Array(buf, dataOffset, Math.floor((len - pos) / 4));
        if (!isLE)
          byteSwap32(data32);
        for (let pos32 = 0; pos + blockLen < len; pos32 += buffer32.length, pos += blockLen) {
          this.length += blockLen;
          this.compress(data32, pos32, false);
        }
        if (!isLE)
          byteSwap32(data32);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      this.length += take;
      pos += take;
    }
    return this;
  }
  digestInto(out) {
    exists(this);
    output(out, this);
    const { pos, buffer32 } = this;
    this.finished = true;
    this.buffer.subarray(pos).fill(0);
    if (!isLE)
      byteSwap32(buffer32);
    this.compress(buffer32, 0, true);
    if (!isLE)
      byteSwap32(buffer32);
    const out32 = u32(out);
    this.get().forEach((v, i) => out32[i] = byteSwapIfBE(v));
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    const { buffer, length, finished, destroyed, outputLen, pos } = this;
    to || (to = new this.constructor({ dkLen: outputLen }));
    to.set(...this.get());
    to.length = length;
    to.finished = finished;
    to.destroyed = destroyed;
    to.outputLen = outputLen;
    to.buffer.set(buffer);
    to.pos = pos;
    return to;
  }
};

// node_modules/@noble/hashes/esm/_u64.js
var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
  let Ah = new Uint32Array(lst.length);
  let Al = new Uint32Array(lst.length);
  for (let i = 0; i < lst.length; i++) {
    const { h, l } = fromBig(lst[i], le);
    [Ah[i], Al[i]] = [h, l];
  }
  return [Ah, Al];
}
var toBig = (h, l) => BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
var shrSH = (h, _l, s) => h >>> s;
var shrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
var rotr32H = (_h, l) => l;
var rotr32L = (h, _l) => h;
var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
function add(Ah, Al, Bh, Bl) {
  const l = (Al >>> 0) + (Bl >>> 0);
  return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
}
var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
var u64 = {
  fromBig,
  split,
  toBig,
  shrSH,
  shrSL,
  rotrSH,
  rotrSL,
  rotrBH,
  rotrBL,
  rotr32H,
  rotr32L,
  rotlSH,
  rotlSL,
  rotlBH,
  rotlBL,
  add,
  add3L,
  add3H,
  add4L,
  add4H,
  add5H,
  add5L
};
var u64_default = u64;

// node_modules/@noble/hashes/esm/blake2b.js
var B2B_IV = /* @__PURE__ */ new Uint32Array([
  4089235720,
  1779033703,
  2227873595,
  3144134277,
  4271175723,
  1013904242,
  1595750129,
  2773480762,
  2917565137,
  1359893119,
  725511199,
  2600822924,
  4215389547,
  528734635,
  327033209,
  1541459225
]);
var BBUF = /* @__PURE__ */ new Uint32Array(32);
function G1b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = u64_default.add3L(Al, Bl, Xl);
  Ah = u64_default.add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: u64_default.rotr32H(Dh, Dl), Dl: u64_default.rotr32L(Dh, Dl) });
  ({ h: Ch, l: Cl } = u64_default.add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: u64_default.rotrSH(Bh, Bl, 24), Bl: u64_default.rotrSL(Bh, Bl, 24) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
function G2b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = u64_default.add3L(Al, Bl, Xl);
  Ah = u64_default.add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: u64_default.rotrSH(Dh, Dl, 16), Dl: u64_default.rotrSL(Dh, Dl, 16) });
  ({ h: Ch, l: Cl } = u64_default.add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: u64_default.rotrBH(Bh, Bl, 63), Bl: u64_default.rotrBL(Bh, Bl, 63) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
var BLAKE2b = class extends BLAKE {
  constructor(opts = {}) {
    super(128, opts.dkLen === void 0 ? 64 : opts.dkLen, opts, 64, 16, 16);
    this.v0l = B2B_IV[0] | 0;
    this.v0h = B2B_IV[1] | 0;
    this.v1l = B2B_IV[2] | 0;
    this.v1h = B2B_IV[3] | 0;
    this.v2l = B2B_IV[4] | 0;
    this.v2h = B2B_IV[5] | 0;
    this.v3l = B2B_IV[6] | 0;
    this.v3h = B2B_IV[7] | 0;
    this.v4l = B2B_IV[8] | 0;
    this.v4h = B2B_IV[9] | 0;
    this.v5l = B2B_IV[10] | 0;
    this.v5h = B2B_IV[11] | 0;
    this.v6l = B2B_IV[12] | 0;
    this.v6h = B2B_IV[13] | 0;
    this.v7l = B2B_IV[14] | 0;
    this.v7h = B2B_IV[15] | 0;
    const keyLength = opts.key ? opts.key.length : 0;
    this.v0l ^= this.outputLen | keyLength << 8 | 1 << 16 | 1 << 24;
    if (opts.salt) {
      const salt = u32(toBytes(opts.salt));
      this.v4l ^= byteSwapIfBE(salt[0]);
      this.v4h ^= byteSwapIfBE(salt[1]);
      this.v5l ^= byteSwapIfBE(salt[2]);
      this.v5h ^= byteSwapIfBE(salt[3]);
    }
    if (opts.personalization) {
      const pers = u32(toBytes(opts.personalization));
      this.v6l ^= byteSwapIfBE(pers[0]);
      this.v6h ^= byteSwapIfBE(pers[1]);
      this.v7l ^= byteSwapIfBE(pers[2]);
      this.v7h ^= byteSwapIfBE(pers[3]);
    }
    if (opts.key) {
      const tmp = new Uint8Array(this.blockLen);
      tmp.set(toBytes(opts.key));
      this.update(tmp);
    }
  }
  // prettier-ignore
  get() {
    let { v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h } = this;
    return [v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h];
  }
  // prettier-ignore
  set(v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h) {
    this.v0l = v0l | 0;
    this.v0h = v0h | 0;
    this.v1l = v1l | 0;
    this.v1h = v1h | 0;
    this.v2l = v2l | 0;
    this.v2h = v2h | 0;
    this.v3l = v3l | 0;
    this.v3h = v3h | 0;
    this.v4l = v4l | 0;
    this.v4h = v4h | 0;
    this.v5l = v5l | 0;
    this.v5h = v5h | 0;
    this.v6l = v6l | 0;
    this.v6h = v6h | 0;
    this.v7l = v7l | 0;
    this.v7h = v7h | 0;
  }
  compress(msg, offset, isLast) {
    this.get().forEach((v, i) => BBUF[i] = v);
    BBUF.set(B2B_IV, 16);
    let { h, l } = u64_default.fromBig(BigInt(this.length));
    BBUF[24] = B2B_IV[8] ^ l;
    BBUF[25] = B2B_IV[9] ^ h;
    if (isLast) {
      BBUF[28] = ~BBUF[28];
      BBUF[29] = ~BBUF[29];
    }
    let j = 0;
    const s = SIGMA;
    for (let i = 0; i < 12; i++) {
      G1b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G2b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G1b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G2b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G1b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G2b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G1b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G2b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G1b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G2b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G1b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G2b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G1b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G2b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G1b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
      G2b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
    }
    this.v0l ^= BBUF[0] ^ BBUF[16];
    this.v0h ^= BBUF[1] ^ BBUF[17];
    this.v1l ^= BBUF[2] ^ BBUF[18];
    this.v1h ^= BBUF[3] ^ BBUF[19];
    this.v2l ^= BBUF[4] ^ BBUF[20];
    this.v2h ^= BBUF[5] ^ BBUF[21];
    this.v3l ^= BBUF[6] ^ BBUF[22];
    this.v3h ^= BBUF[7] ^ BBUF[23];
    this.v4l ^= BBUF[8] ^ BBUF[24];
    this.v4h ^= BBUF[9] ^ BBUF[25];
    this.v5l ^= BBUF[10] ^ BBUF[26];
    this.v5h ^= BBUF[11] ^ BBUF[27];
    this.v6l ^= BBUF[12] ^ BBUF[28];
    this.v6h ^= BBUF[13] ^ BBUF[29];
    this.v7l ^= BBUF[14] ^ BBUF[30];
    this.v7h ^= BBUF[15] ^ BBUF[31];
    BBUF.fill(0);
  }
  destroy() {
    this.destroyed = true;
    this.buffer32.fill(0);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
};
var blake2b = /* @__PURE__ */ wrapConstructorWithOpts((opts) => new BLAKE2b(opts));

// node_modules/@noble/hashes/esm/argon2.js
var ARGON2_SYNC_POINTS = 4;
var toBytesOptional = (buf) => buf !== void 0 ? toBytes(buf) : new Uint8Array([]);
function mul(a, b) {
  const aL = a & 65535;
  const aH = a >>> 16;
  const bL = b & 65535;
  const bH = b >>> 16;
  const ll = Math.imul(aL, bL);
  const hl = Math.imul(aH, bL);
  const lh = Math.imul(aL, bH);
  const hh = Math.imul(aH, bH);
  const BUF = (ll >>> 16) + (hl & 65535) + lh | 0;
  const h = (hl >>> 16) + (BUF >>> 16) + hh | 0;
  return { h, l: BUF << 16 | ll & 65535 };
}
function relPos(areaSize, relativePos) {
  return areaSize - 1 - mul(areaSize, mul(relativePos, relativePos).h).h;
}
function mul2(a, b) {
  const { h, l } = mul(a, b);
  return { h: (h << 1 | l >>> 31) & 4294967295, l: l << 1 & 4294967295 };
}
function blamka(Ah, Al, Bh, Bl) {
  const { h: Ch, l: Cl } = mul2(Al, Bl);
  const Rll = add3L(Al, Bl, Cl);
  return { h: add3H(Rll, Ah, Bh, Ch), l: Rll | 0 };
}
var A2_BUF = new Uint32Array(256);
function G(a, b, c, d) {
  let Al = A2_BUF[2 * a], Ah = A2_BUF[2 * a + 1];
  let Bl = A2_BUF[2 * b], Bh = A2_BUF[2 * b + 1];
  let Cl = A2_BUF[2 * c], Ch = A2_BUF[2 * c + 1];
  let Dl = A2_BUF[2 * d], Dh = A2_BUF[2 * d + 1];
  ({ h: Ah, l: Al } = blamka(Ah, Al, Bh, Bl));
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotr32H(Dh, Dl), Dl: rotr32L(Dh, Dl) });
  ({ h: Ch, l: Cl } = blamka(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrSH(Bh, Bl, 24), Bl: rotrSL(Bh, Bl, 24) });
  ({ h: Ah, l: Al } = blamka(Ah, Al, Bh, Bl));
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotrSH(Dh, Dl, 16), Dl: rotrSL(Dh, Dl, 16) });
  ({ h: Ch, l: Cl } = blamka(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrBH(Bh, Bl, 63), Bl: rotrBL(Bh, Bl, 63) });
  A2_BUF[2 * a] = Al, A2_BUF[2 * a + 1] = Ah;
  A2_BUF[2 * b] = Bl, A2_BUF[2 * b + 1] = Bh;
  A2_BUF[2 * c] = Cl, A2_BUF[2 * c + 1] = Ch;
  A2_BUF[2 * d] = Dl, A2_BUF[2 * d + 1] = Dh;
}
function P(v00, v01, v02, v03, v04, v05, v06, v07, v08, v09, v10, v11, v12, v13, v14, v15) {
  G(v00, v04, v08, v12);
  G(v01, v05, v09, v13);
  G(v02, v06, v10, v14);
  G(v03, v07, v11, v15);
  G(v00, v05, v10, v15);
  G(v01, v06, v11, v12);
  G(v02, v07, v08, v13);
  G(v03, v04, v09, v14);
}
function block(x, xPos, yPos, outPos, needXor) {
  for (let i = 0; i < 256; i++)
    A2_BUF[i] = x[xPos + i] ^ x[yPos + i];
  for (let i = 0; i < 128; i += 16) {
    P(i, i + 1, i + 2, i + 3, i + 4, i + 5, i + 6, i + 7, i + 8, i + 9, i + 10, i + 11, i + 12, i + 13, i + 14, i + 15);
  }
  for (let i = 0; i < 16; i += 2) {
    P(i, i + 1, i + 16, i + 17, i + 32, i + 33, i + 48, i + 49, i + 64, i + 65, i + 80, i + 81, i + 96, i + 97, i + 112, i + 113);
  }
  if (needXor)
    for (let i = 0; i < 256; i++)
      x[outPos + i] ^= A2_BUF[i] ^ x[xPos + i] ^ x[yPos + i];
  else
    for (let i = 0; i < 256; i++)
      x[outPos + i] = A2_BUF[i] ^ x[xPos + i] ^ x[yPos + i];
}
function Hp(A, dkLen) {
  const A8 = u8(A);
  const T = new Uint32Array(1);
  const T8 = u8(T);
  T[0] = dkLen;
  if (dkLen <= 64)
    return blake2b.create({ dkLen }).update(T8).update(A8).digest();
  const out = new Uint8Array(dkLen);
  let V = blake2b.create({}).update(T8).update(A8).digest();
  let pos = 0;
  out.set(V.subarray(0, 32));
  pos += 32;
  for (; dkLen - pos > 64; pos += 32)
    out.set((V = blake2b(V)).subarray(0, 32), pos);
  out.set(blake2b(V, { dkLen: dkLen - pos }), pos);
  return u32(out);
}
function indexAlpha(r, s, laneLen, segmentLen, index, randL, sameLane = false) {
  let area;
  if (0 == r) {
    if (0 == s)
      area = index - 1;
    else if (sameLane)
      area = s * segmentLen + index - 1;
    else
      area = s * segmentLen + (index == 0 ? -1 : 0);
  } else if (sameLane)
    area = laneLen - segmentLen + index - 1;
  else
    area = laneLen - segmentLen + (index == 0 ? -1 : 0);
  const startPos = r !== 0 && s !== ARGON2_SYNC_POINTS - 1 ? (s + 1) * segmentLen : 0;
  const rel = relPos(area, randL);
  return (startPos + rel) % laneLen;
}
function argon2Init(type, password, salt, opts) {
  password = toBytes(password);
  salt = toBytes(salt);
  let { p, dkLen, m, t, version, key, personalization, maxmem, onProgress } = {
    ...opts,
    version: opts.version || 19,
    dkLen: opts.dkLen || 32,
    maxmem: 2 ** 32
  };
  number(p);
  number(dkLen);
  number(m);
  number(t);
  number(version);
  if (dkLen < 4 || dkLen >= 2 ** 32)
    throw new Error("Argon2: dkLen should be at least 4 bytes");
  if (p < 1 || p >= 2 ** 32)
    throw new Error("Argon2: p (parallelism) should be at least 1");
  if (t < 1 || t >= 2 ** 32)
    throw new Error("Argon2: t (iterations) should be at least 1");
  if (m < 8 * p)
    throw new Error(`Argon2: memory should be at least 8*p bytes`);
  if (version !== 16 && version !== 19)
    throw new Error(`Argon2: unknown version=${version}`);
  password = toBytes(password);
  if (password.length < 0 || password.length >= 2 ** 32)
    throw new Error("Argon2: password should be less than 4 GB");
  salt = toBytes(salt);
  if (salt.length < 8)
    throw new Error("Argon2: salt should be at least 8 bytes");
  key = toBytesOptional(key);
  personalization = toBytesOptional(personalization);
  if (onProgress !== void 0 && typeof onProgress !== "function")
    throw new Error("progressCb should be function");
  const lanes = p;
  const mP = 4 * p * Math.floor(m / (ARGON2_SYNC_POINTS * p));
  const laneLen = Math.floor(mP / p);
  const segmentLen = Math.floor(laneLen / ARGON2_SYNC_POINTS);
  const h = blake2b.create({});
  const BUF = new Uint32Array(1);
  const BUF8 = u8(BUF);
  for (const i of [p, dkLen, m, t, version, type]) {
    if (i < 0 || i >= 2 ** 32)
      throw new Error(`Argon2: wrong parameter=${i}, expected uint32`);
    BUF[0] = i;
    h.update(BUF8);
  }
  for (let i of [password, salt, key, personalization]) {
    BUF[0] = i.length;
    h.update(BUF8).update(i);
  }
  const H0 = new Uint32Array(18);
  const H0_8 = u8(H0);
  h.digestInto(H0_8);
  const memUsed = mP * 256;
  if (memUsed < 0 || memUsed >= 2 ** 32 || memUsed > maxmem) {
    throw new Error(`Argon2: wrong params (memUsed=${memUsed} maxmem=${maxmem}), should be less than 2**32`);
  }
  const B = new Uint32Array(memUsed);
  for (let l = 0; l < p; l++) {
    const i = 256 * laneLen * l;
    H0[17] = l;
    H0[16] = 0;
    B.set(Hp(H0, 1024), i);
    H0[16] = 1;
    B.set(Hp(H0, 1024), i + 256);
  }
  let perBlock = () => {
  };
  if (onProgress) {
    const totalBlock = t * ARGON2_SYNC_POINTS * p * segmentLen;
    const callbackPer = Math.max(Math.floor(totalBlock / 1e4), 1);
    let blockCnt = 0;
    perBlock = () => {
      blockCnt++;
      if (onProgress && (!(blockCnt % callbackPer) || blockCnt === totalBlock))
        onProgress(blockCnt / totalBlock);
    };
  }
  return { type, mP, p, t, version, B, laneLen, lanes, segmentLen, dkLen, perBlock };
}
function argon2Output(B, p, laneLen, dkLen) {
  const B_final = new Uint32Array(256);
  for (let l = 0; l < p; l++)
    for (let j = 0; j < 256; j++)
      B_final[j] ^= B[256 * (laneLen * l + laneLen - 1) + j];
  return u8(Hp(B_final, dkLen));
}
function processBlock(B, address, l, r, s, index, laneLen, segmentLen, lanes, offset, prev, dataIndependent, needXor) {
  if (offset % laneLen)
    prev = offset - 1;
  let randL, randH;
  if (dataIndependent) {
    if (index % 128 === 0) {
      address[256 + 12]++;
      block(address, 256, 2 * 256, 0, false);
      block(address, 0, 2 * 256, 0, false);
    }
    randL = address[2 * (index % 128)];
    randH = address[2 * (index % 128) + 1];
  } else {
    const T = 256 * prev;
    randL = B[T];
    randH = B[T + 1];
  }
  const refLane = r === 0 && s === 0 ? l : randH % lanes;
  const refPos = indexAlpha(r, s, laneLen, segmentLen, index, randL, refLane == l);
  const refBlock = laneLen * refLane + refPos;
  block(B, 256 * prev, 256 * refBlock, offset * 256, needXor);
}
function argon2(type, password, salt, opts) {
  const { mP, p, t, version, B, laneLen, lanes, segmentLen, dkLen, perBlock } = argon2Init(type, password, salt, opts);
  const address = new Uint32Array(3 * 256);
  address[256 + 6] = mP;
  address[256 + 8] = t;
  address[256 + 10] = type;
  for (let r = 0; r < t; r++) {
    const needXor = r !== 0 && version === 19;
    address[256 + 0] = r;
    for (let s = 0; s < ARGON2_SYNC_POINTS; s++) {
      address[256 + 4] = s;
      const dataIndependent = type == 1 || type == 2 && r === 0 && s < 2;
      for (let l = 0; l < p; l++) {
        address[256 + 2] = l;
        address[256 + 12] = 0;
        let startPos = 0;
        if (r === 0 && s === 0) {
          startPos = 2;
          if (dataIndependent) {
            address[256 + 12]++;
            block(address, 256, 2 * 256, 0, false);
            block(address, 0, 2 * 256, 0, false);
          }
        }
        let offset = l * laneLen + s * segmentLen + startPos;
        let prev = offset % laneLen ? offset - 1 : offset + laneLen - 1;
        for (let index = startPos; index < segmentLen; index++, offset++, prev++) {
          perBlock();
          processBlock(B, address, l, r, s, index, laneLen, segmentLen, lanes, offset, prev, dataIndependent, needXor);
        }
      }
    }
  }
  return argon2Output(B, p, laneLen, dkLen);
}
var argon2id = (password, salt, opts) => argon2(2, password, salt, opts);

// src/crypto.ts
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var DEFAULT_KDF = "argon2id";
var LEGACY_KDF = "pbkdf2";
var PBKDF2_ITERATIONS = 6e5;
var LEGACY_PBKDF2_ITERATIONS = 2e5;
var ARGON2ID_MEMORY_KIB = 19456;
var ARGON2ID_TIME = 2;
var ARGON2ID_PARALLELISM = 1;
var IV_BYTES = 12;
var KEY_BYTES = 32;
var SALT_BYTES = 16;
function subtle() {
  const c = window.crypto?.subtle;
  if (!c) throw new Error("WebCrypto unavailable in this runtime");
  return c;
}
function webcryptoAvailable() {
  return typeof window.crypto?.subtle === "object";
}
function toB64(bytes2) {
  let binary = "";
  for (let i = 0; i < bytes2.length; i += 32768) {
    binary += String.fromCharCode(...bytes2.subarray(i, i + 32768));
  }
  return btoa(binary);
}
function fromB64(b64) {
  const binary = atob(b64);
  const bytes2 = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes2[i] = binary.charCodeAt(i);
  return bytes2;
}
var HEX2 = "0123456789abcdef";
var randomHex = (nBytes) => {
  const bytes2 = new Uint8Array(nBytes);
  window.crypto.getRandomValues(bytes2);
  let out = "";
  for (const b of bytes2) out += HEX2[b >>> 4] + HEX2[b & 15];
  return out;
};
function hexToBytes(hex) {
  const bytes2 = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes2.length; i++) {
    bytes2[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes2;
}
function zeroKeyMaterial(bytes2) {
  if (bytes2) bytes2.fill(0);
}
function makeKeySalt() {
  return randomHex(SALT_BYTES);
}
async function deriveKekBytes(passcode, saltHex, kdf, iterations) {
  const secret = encoder.encode(passcode.trim());
  if (kdf === "argon2id") {
    return argon2id(secret, hexToBytes(saltHex), {
      t: ARGON2ID_TIME,
      m: ARGON2ID_MEMORY_KIB,
      p: ARGON2ID_PARALLELISM
    });
  }
  const material = await subtle().importKey("raw", secret, "PBKDF2", false, [
    "deriveBits"
  ]);
  return new Uint8Array(
    await subtle().deriveBits(
      { name: "PBKDF2", salt: hexToBytes(saltHex), iterations, hash: "SHA-256" },
      material,
      256
    )
  );
}
async function deriveKek(passcode, saltHex, kdf, iterations) {
  const bytes2 = await deriveKekBytes(passcode, saltHex, kdf, iterations);
  return subtle().importKey(
    "raw",
    bytes2,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
async function cipherFromRawKey(raw) {
  const key = await subtle().importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  zeroKeyMaterial(raw);
  return {
    async seal(body) {
      const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTES));
      const ct = await subtle().encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(body)
      );
      return { iv: toB64(iv), ct: toB64(new Uint8Array(ct)) };
    },
    async open(iv, ct) {
      const plain = await subtle().decrypt(
        { name: "AES-GCM", iv: fromB64(iv) },
        key,
        fromB64(ct)
      );
      return decoder.decode(plain);
    }
  };
}
async function createWrappedVaultKey(passcode, iterations = PBKDF2_ITERATIONS, kdf = DEFAULT_KDF) {
  const keySalt = makeKeySalt();
  const kek = await deriveKek(passcode, keySalt, kdf, iterations);
  const vk = window.crypto.getRandomValues(new Uint8Array(KEY_BYTES));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const wrapped = new Uint8Array(
    await subtle().encrypt({ name: "AES-GCM", iv }, kek, vk)
  );
  const bundle = new Uint8Array(iv.length + wrapped.length);
  bundle.set(iv, 0);
  bundle.set(wrapped, iv.length);
  return {
    keySalt,
    wrappedKey: toB64(bundle),
    cipher: await cipherFromRawKey(vk)
  };
}
async function openWrappedVaultKey(passcode, keySalt, wrappedKey, iterations = PBKDF2_ITERATIONS, kdf = DEFAULT_KDF) {
  const kek = await deriveKek(passcode, keySalt, kdf, iterations);
  const bundle = fromB64(wrappedKey);
  const iv = bundle.subarray(0, IV_BYTES);
  const wrapped = bundle.subarray(IV_BYTES);
  const vk = new Uint8Array(
    await subtle().decrypt({ name: "AES-GCM", iv }, kek, wrapped)
  );
  if (vk.length !== KEY_BYTES) throw new Error("vault key has wrong length");
  return cipherFromRawKey(vk);
}
async function rewrapRawVaultKey(rawKey, newPasscode, iterations = PBKDF2_ITERATIONS, kdf = DEFAULT_KDF) {
  const keySalt = makeKeySalt();
  const kek = await deriveKek(newPasscode, keySalt, kdf, iterations);
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const wrapped = new Uint8Array(
    await subtle().encrypt({ name: "AES-GCM", iv }, kek, rawKey)
  );
  const bundle = new Uint8Array(iv.length + wrapped.length);
  bundle.set(iv, 0);
  bundle.set(wrapped, iv.length);
  return { keySalt, wrappedKey: toB64(bundle) };
}
async function unwrapRawVaultKey(passcode, keySalt, wrappedKey, iterations = PBKDF2_ITERATIONS, kdf = DEFAULT_KDF) {
  const kek = await deriveKek(passcode, keySalt, kdf, iterations);
  const bundle = fromB64(wrappedKey);
  const vk = new Uint8Array(
    await subtle().decrypt(
      { name: "AES-GCM", iv: bundle.subarray(0, IV_BYTES) },
      kek,
      bundle.subarray(IV_BYTES)
    )
  );
  if (vk.length !== KEY_BYTES) throw new Error("vault key has wrong length");
  return vk;
}
var KEY_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
var KEY_CHARS = 25;
var KEY_GROUP = 5;
function generateVaultKeyString() {
  const bytes2 = window.crypto.getRandomValues(new Uint8Array(KEY_CHARS));
  const chars = Array.from(bytes2, (b) => KEY_ALPHABET[b & 31]);
  const groups = [];
  for (let i = 0; i < KEY_CHARS; i += KEY_GROUP) {
    groups.push(chars.slice(i, i + KEY_GROUP).join(""));
  }
  return groups.join("-");
}
function normalizeVaultKey(input) {
  const folded = input.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/I/g, "1").replace(/L/g, "1").replace(/O/g, "0");
  if (folded.length !== KEY_CHARS) return null;
  for (const ch of folded) {
    if (!KEY_ALPHABET.includes(ch)) return null;
  }
  const groups = [];
  for (let i = 0; i < KEY_CHARS; i += KEY_GROUP) {
    groups.push(folded.slice(i, i + KEY_GROUP));
  }
  return groups.join("-");
}

// src/appearance/wallpaper.ts
var WALLPAPERS = [
  { id: "aurora", name: "Aurora", hint: "Teal and violet ribbons over a deep sky (default)" },
  { id: "dusk", name: "Dusk", hint: "Rose fading into indigo" },
  { id: "midnight", name: "Midnight", hint: "Near-black blue with a low glow" },
  { id: "mist", name: "Mist", hint: "Soft grey-lavender haze" },
  { id: "meadow", name: "Meadow", hint: "Fresh greens on a morning wash" },
  { id: "sunset", name: "Sunset", hint: "Amber melting into coral" },
  { id: "ink", name: "Ink", hint: "Deep monochrome with paper grain" },
  { id: "paper", name: "Paper", hint: "Warm off-white sheet, subtle fibers" }
];
var EXTRA_IDS = /* @__PURE__ */ new Set(["none", "custom"]);
var isWallpaperId = (id) => typeof id === "string" && (EXTRA_IDS.has(id) || WALLPAPERS.some((w) => w.id === id));
var clamp = (n, min, max, fallback) => {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
};
function resolveWallpaper(peer, globalId, byPeer) {
  const perPeer = peer ? byPeer?.[peer] : void 0;
  if (isWallpaperId(perPeer)) return perPeer;
  if (isWallpaperId(globalId)) return globalId;
  return "none";
}
function resolveTint(peer, globalTint, byPeer) {
  const perPeer = peer ? byPeer?.[peer] : void 0;
  if (typeof perPeer === "string") return perPeer.trim();
  return typeof globalTint === "string" ? globalTint.trim() : "";
}
function wallpaperIdFor(peer, settings) {
  const ws = settings;
  return resolveWallpaper(peer, ws.wallpaper, ws.wallpaperByPeer);
}
function applyWallpaper(wrapEl, peer, plugin) {
  const ws = plugin.settings;
  const id = wallpaperIdFor(peer, plugin.settings);
  wrapEl.dataset.wallpaper = id;
  wrapEl.style.setProperty(
    "--messenger-wallpaper-opacity",
    String(clamp(ws.wallpaperIntensity, 0, 100, 100) / 100)
  );
  const tint = resolveTint(peer, ws.wallpaperTint, ws.wallpaperTintByPeer);
  wrapEl.classList.toggle("is-tinted", tint !== "");
  wrapEl.style.setProperty(
    "--messenger-wallpaper-tint",
    tint !== "" ? tint : "transparent"
  );
  wrapEl.style.setProperty(
    "--messenger-tint-alpha",
    String(clamp(ws.wallpaperTintStrength, 0, 100, 25) / 100)
  );
  wrapEl.style.setProperty(
    "--messenger-bubble-alpha",
    `${clamp(ws.bubbleAlpha, 30, 100, 88)}%`
  );
  if (id === "custom") {
    const file = ws.customWallpaperPath ? plugin.app.vault.getFileByPath(ws.customWallpaperPath) : null;
    if (file) {
      wrapEl.style.setProperty(
        "--messenger-wallpaper-image",
        `url("${plugin.app.vault.getResourcePath(file)}")`
      );
      return;
    }
  }
  wrapEl.style.removeProperty("--messenger-wallpaper-image");
}

// src/settings.ts
var DEFAULT_SETTINGS = {
  address: "owner",
  displayName: "",
  onboarded: false,
  root: "Messenger",
  hiddenStorage: true,
  pollSeconds: 5,
  retentionDays: 30,
  maxInboxMessages: 1e3,
  retentionDaysByPeer: {},
  maxInboxMessagesByPeer: {},
  unacked: {},
  debug: false,
  cursors: {},
  readAt: {},
  notifyPopup: true,
  notifySound: true,
  sendReadReceipts: true,
  mutedPeers: {},
  whoCanReachMe: "everyone",
  drafts: {},
  attachmentsFolder: "Messenger/Attachments",
  keepOutbox: false,
  stripHtml: false,
  wallpaper: "aurora",
  wallpaperByPeer: {},
  customWallpaperPath: "",
  wallpaperIntensity: 100,
  wallpaperTint: "",
  wallpaperTintByPeer: {},
  wallpaperTintStrength: 25,
  bubbleAlpha: 88,
  avatars: {},
  recentEmoji: [],
  passcodeHash: "",
  passcodeSalt: "",
  lockOnStart: true,
  lockedPeers: {},
  encryptMail: false,
  keySalt: "",
  wrappedKey: "",
  kdfIterations: LEGACY_PBKDF2_ITERATIONS,
  kdf: LEGACY_KDF,
  authMode: "passcode",
  om2: { enabled: false, relayUrl: "", handle: "" }
};
function clampInt(value, min, max, fallback) {
  const n = value == null ? NaN : typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}
function optInt(value, min, max) {
  const n = typeof value === "number" && Number.isFinite(value) ? value : NaN;
  if (!Number.isFinite(n)) return void 0;
  return Math.min(max, Math.max(min, Math.round(value)));
}
var WALLPAPER_IDS = /* @__PURE__ */ new Set([...WALLPAPERS.map((w) => w.id), "none", "custom"]);
function sanitizeSettings(raw) {
  const r = raw ?? {};
  const address = typeof r.address === "string" && ADDRESS_RE.test(r.address) ? r.address : DEFAULT_SETTINGS.address;
  const root = typeof r.root === "string" && r.root.trim() ? r.root.trim().replace(/^\/+|\/+$/g, "") : DEFAULT_SETTINGS.root;
  const cursors = {};
  if (r.cursors && typeof r.cursors === "object") {
    for (const [key, value] of Object.entries(r.cursors)) {
      const c = value;
      if (c && typeof c === "object" && typeof c.id === "string" && typeof c.ts === "string") {
        cursors[key] = { id: c.id, ts: c.ts };
      }
    }
  }
  const readAt = {};
  if (r.readAt && typeof r.readAt === "object") {
    for (const [key, value] of Object.entries(r.readAt)) {
      if (ADDRESS_RE.test(key) && typeof value === "string") readAt[key] = value;
    }
  }
  const wallpaperByPeer = {};
  if (r.wallpaperByPeer && typeof r.wallpaperByPeer === "object") {
    for (const [key, value] of Object.entries(r.wallpaperByPeer)) {
      if (ADDRESS_RE.test(key) && typeof value === "string" && WALLPAPER_IDS.has(value) && value !== "custom") {
        wallpaperByPeer[key] = value;
      }
    }
  }
  const safeColor = (value) => typeof value === "string" && value.trim().length > 0 && value.trim().length <= 40 && /^[#(),.%\s\w-]+$/.test(value.trim()) ? value.trim() : "";
  const wallpaperTintByPeer = {};
  if (r.wallpaperTintByPeer && typeof r.wallpaperTintByPeer === "object") {
    for (const [key, value] of Object.entries(r.wallpaperTintByPeer).slice(0, 500)) {
      if (ADDRESS_RE.test(key)) {
        const tint = safeColor(value);
        if (typeof value === "string" && (tint !== "" || value.trim() === "")) {
          wallpaperTintByPeer[key] = tint;
        }
      }
    }
  }
  const avatars = {};
  if (r.avatars && typeof r.avatars === "object") {
    for (const [key, value] of Object.entries(r.avatars).slice(0, 500)) {
      if (ADDRESS_RE.test(key) && typeof value === "string" && value.trim()) {
        avatars[key] = value.trim().slice(0, 500);
      }
    }
  }
  const flagRecord = (raw2) => {
    const out = {};
    if (raw2 && typeof raw2 === "object") {
      for (const [key, value] of Object.entries(raw2).slice(0, 500)) {
        if (ADDRESS_RE.test(key) && value === true) out[key] = true;
      }
    }
    return out;
  };
  const mutedPeers = flagRecord(r.mutedPeers);
  const lockedPeers = flagRecord(r.lockedPeers);
  const drafts = {};
  if (r.drafts && typeof r.drafts === "object") {
    for (const [key, value] of Object.entries(r.drafts).slice(0, 100)) {
      if (ADDRESS_RE.test(key) && typeof value === "string") {
        drafts[key] = value.slice(0, 2e4);
      }
    }
  }
  const recentEmoji = [];
  if (Array.isArray(r.recentEmoji)) {
    for (const code of r.recentEmoji) {
      if (recentEmoji.length >= 24) break;
      if (typeof code === "string" && code.trim()) {
        recentEmoji.push(code.trim().slice(0, 16));
      }
    }
  }
  const unacked = {};
  if (r.unacked && typeof r.unacked === "object") {
    for (const [key, value] of Object.entries(r.unacked).slice(0, 50)) {
      const u = value;
      const m = u?.message;
      if (u && typeof u === "object" && m && typeof m === "object" && key.length <= 64 && typeof m.id === "string" && m.id === key && typeof m.from === "string" && ADDRESS_RE.test(m.from) && typeof m.to === "string" && ADDRESS_RE.test(m.to) && typeof m.ts === "string" && Number.isFinite(Date.parse(m.ts)) && (m.replyTo === null || typeof m.replyTo === "string" && m.replyTo.length <= 64) && typeof m.body === "string" && typeof u.sentAt === "string" && Number.isFinite(Date.parse(u.sentAt)) && typeof u.attempts === "number" && Number.isFinite(u.attempts)) {
        const seal = m.enc;
        const enc = seal && typeof seal === "object" && seal.v === 1 && typeof seal.iv === "string" && seal.iv.length > 0 && seal.iv.length <= 64 ? { v: 1, iv: seal.iv } : void 0;
        const exp = typeof m.exp === "string" && Number.isFinite(Date.parse(m.exp)) ? m.exp : void 0;
        const bar = typeof m.bar === "number" && Number.isFinite(m.bar) && m.bar >= 1 && m.bar <= MAX_BAR_SECONDS ? Math.round(m.bar) : void 0;
        const message = {
          id: m.id,
          from: m.from,
          to: m.to,
          ts: m.ts,
          replyTo: typeof m.replyTo === "string" ? m.replyTo : null,
          body: m.body.slice(0, 2e4)
        };
        if (enc) message.enc = enc;
        if (exp) message.exp = exp;
        if (bar) message.bar = bar;
        unacked[key] = {
          message,
          sentAt: u.sentAt,
          attempts: Math.min(10, Math.max(0, Math.round(u.attempts)))
        };
      }
    }
  }
  const intRecord = (raw2, min, max) => {
    const out = {};
    if (raw2 && typeof raw2 === "object") {
      for (const [key, value] of Object.entries(raw2).slice(0, 500)) {
        if (!ADDRESS_RE.test(key)) continue;
        const n = clampInt(value, min, max, NaN);
        if (Number.isFinite(n)) out[key] = n;
      }
    }
    return out;
  };
  const retentionDaysByPeer = intRecord(r.retentionDaysByPeer, 0, 3650);
  const maxInboxMessagesByPeer = intRecord(r.maxInboxMessagesByPeer, 0, 1e5);
  const passcodeHash = typeof r.passcodeHash === "string" && /^[0-9a-f]{64}$/.test(r.passcodeHash) ? r.passcodeHash : "";
  const passcodeSalt = typeof r.passcodeSalt === "string" && /^[0-9a-f]{32}$/.test(r.passcodeSalt) ? r.passcodeSalt : "";
  const keySalt = typeof r.keySalt === "string" && /^[0-9a-f]{32}$/.test(r.keySalt) ? r.keySalt : "";
  const wrappedKey = typeof r.wrappedKey === "string" && r.wrappedKey.length >= 40 && r.wrappedKey.length <= 200 && /^[A-Za-z0-9+/]+={0,2}$/.test(r.wrappedKey) ? r.wrappedKey : "";
  const encryptMail = r.encryptMail === true && keySalt !== "" && wrappedKey !== "";
  const kdfIterations = clampInt(
    r.kdfIterations,
    1e5,
    5e6,
    LEGACY_PBKDF2_ITERATIONS
  );
  const kdf = r.kdf === "argon2id" ? "argon2id" : LEGACY_KDF;
  const authMode = encryptMail && r.authMode === "key" && passcodeHash === "" ? "key" : "passcode";
  return {
    address,
    displayName: typeof r.displayName === "string" ? r.displayName.trim().slice(0, 80) : "",
    onboarded: typeof r.onboarded === "boolean" ? r.onboarded : false,
    root,
    hiddenStorage: typeof r.hiddenStorage === "boolean" ? r.hiddenStorage : DEFAULT_SETTINGS.hiddenStorage,
    lastRoot: typeof r.lastRoot === "string" && r.lastRoot.trim() ? r.lastRoot : void 0,
    pollSeconds: clampInt(r.pollSeconds, 1, 3600, DEFAULT_SETTINGS.pollSeconds),
    retentionDays: clampInt(r.retentionDays, 0, 3650, DEFAULT_SETTINGS.retentionDays),
    maxInboxMessages: clampInt(
      r.maxInboxMessages,
      0,
      1e5,
      DEFAULT_SETTINGS.maxInboxMessages
    ),
    retentionDaysByPeer,
    maxInboxMessagesByPeer,
    unacked,
    debug: typeof r.debug === "boolean" ? r.debug : DEFAULT_SETTINGS.debug,
    cursors,
    readAt,
    notifyPopup: typeof r.notifyPopup === "boolean" ? r.notifyPopup : DEFAULT_SETTINGS.notifyPopup,
    notifySound: typeof r.notifySound === "boolean" ? r.notifySound : DEFAULT_SETTINGS.notifySound,
    sendReadReceipts: typeof r.sendReadReceipts === "boolean" ? r.sendReadReceipts : DEFAULT_SETTINGS.sendReadReceipts,
    mutedPeers,
    whoCanReachMe: r.whoCanReachMe === "contacts" ? "contacts" : "everyone",
    drafts,
    attachmentsFolder: typeof r.attachmentsFolder === "string" && r.attachmentsFolder.trim().replace(/^\/+|\/+$/g, "") ? r.attachmentsFolder.trim().replace(/^\/+|\/+$/g, "") : DEFAULT_SETTINGS.attachmentsFolder,
    keepOutbox: typeof r.keepOutbox === "boolean" ? r.keepOutbox : DEFAULT_SETTINGS.keepOutbox,
    stripHtml: typeof r.stripHtml === "boolean" ? r.stripHtml : DEFAULT_SETTINGS.stripHtml,
    wallpaper: typeof r.wallpaper === "string" && WALLPAPER_IDS.has(r.wallpaper) ? r.wallpaper : DEFAULT_SETTINGS.wallpaper,
    wallpaperByPeer,
    customWallpaperPath: typeof r.customWallpaperPath === "string" ? r.customWallpaperPath.trim().slice(0, 500) : "",
    wallpaperIntensity: clampInt(
      r.wallpaperIntensity,
      0,
      100,
      DEFAULT_SETTINGS.wallpaperIntensity
    ),
    wallpaperTint: safeColor(r.wallpaperTint),
    wallpaperTintByPeer,
    wallpaperTintStrength: clampInt(
      r.wallpaperTintStrength,
      0,
      100,
      DEFAULT_SETTINGS.wallpaperTintStrength
    ),
    bubbleAlpha: clampInt(
      r.bubbleAlpha,
      30,
      100,
      DEFAULT_SETTINGS.bubbleAlpha
    ),
    avatars,
    recentEmoji,
    passcodeHash,
    passcodeSalt,
    lockOnStart: typeof r.lockOnStart === "boolean" ? r.lockOnStart : DEFAULT_SETTINGS.lockOnStart,
    lockedPeers,
    encryptMail,
    keySalt: encryptMail ? keySalt : "",
    wrappedKey: encryptMail ? wrappedKey : "",
    kdfIterations: encryptMail ? kdfIterations : LEGACY_PBKDF2_ITERATIONS,
    kdf: encryptMail ? kdf : LEGACY_KDF,
    authMode: encryptMail ? authMode : "passcode",
    // remembered detached-window geometry (UI polish): finite integers in a
    // generous range — negative coordinates are legitimate on multi-monitor
    // setups, and the restore-time helper re-validates against live screens
    chatWinX: optInt(r.chatWinX, -32768, 32767),
    chatWinY: optInt(r.chatWinY, -32768, 32767),
    chatWinWidth: optInt(r.chatWinWidth, 320, 32767),
    chatWinHeight: optInt(r.chatWinHeight, 400, 32767),
    om2: sanitizeOm2(r.om2)
  };
}
function sanitizeOm2(raw) {
  const r = raw ?? {};
  const relayUrl = typeof r.relayUrl === "string" && /^https?:\/\//.test(r.relayUrl.trim()) ? r.relayUrl.trim().replace(/\/+$/, "") : "";
  const handle = typeof r.handle === "string" && /^@[^@\s]+@[^@\s]+$/.test(r.handle.trim()) ? r.handle.trim() : "";
  return {
    enabled: r.enabled === true && relayUrl !== "",
    relayUrl,
    handle
  };
}

// src/settings-tab.ts
var import_obsidian6 = require("obsidian");

// src/appearance/avatar.ts
var import_obsidian2 = require("obsidian");
var IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"];
function paintAvatar(el, address, plugin) {
  el.empty();
  el.setAttr("aria-hidden", "true");
  const file = avatarFileFor(plugin, address);
  if (file) {
    el.removeClass("is-generated");
    el.style.removeProperty("--messenger-avatar-gradient");
    const img = el.createEl("img", {
      cls: "messenger-avatar-img",
      attr: { alt: "", "aria-hidden": "true" }
    });
    img.src = plugin.app.vault.getResourcePath(file);
    return;
  }
  el.addClass("is-generated");
  el.setText(initials(address));
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = hash * 31 + address.charCodeAt(i) | 0;
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40 + Math.abs(hash >> 8) % 80) % 360;
  const lightnessOf = (hue) => hue >= 40 && hue <= 160 ? 34 : 42;
  const l1 = lightnessOf(h1);
  const l2 = lightnessOf(h2);
  el.style.setProperty(
    "--messenger-avatar-gradient",
    `linear-gradient(135deg, hsl(${h1} 46% ${l1}%), hsl(${h2} 52% ${l2}%))`
  );
}
function chooseVaultImage(app) {
  return new Promise((resolve) => {
    new VaultImageSuggestModal(app, resolve).open();
  });
}
var VaultImageSuggestModal = class extends import_obsidian2.FuzzySuggestModal {
  constructor(app, done) {
    super(app);
    this.done = done;
    this.settled = false;
    this.setPlaceholder("Search vault images\u2026");
  }
  getItems() {
    return this.app.vault.getFiles().filter((f) => IMAGE_EXTENSIONS.includes(f.extension.toLowerCase()));
  }
  getItemText(file) {
    return file.path;
  }
  renderSuggestion(match, el) {
    (0, import_obsidian2.setIcon)(el.createSpan({ cls: "messenger-avatar-picker-icon" }), "image");
    el.createSpan({ cls: "messenger-avatar-picker-path", text: match.item.path });
  }
  onChooseItem(file) {
    this.settled = true;
    this.done(file.path);
  }
  onClose() {
    if (!this.settled) this.done(null);
  }
};
function avatarFileFor(plugin, address) {
  const avatars = plugin.settings.avatars ?? {};
  const path = avatars[address];
  if (!path) return null;
  const file = plugin.app.vault.getAbstractFileByPath(path);
  return file instanceof import_obsidian2.TFile && IMAGE_EXTENSIONS.includes(file.extension.toLowerCase()) ? file : null;
}
function initials(address) {
  const parts = address.split(/[-._]/).filter(Boolean);
  const ini = (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
  return ini.toUpperCase();
}

// src/dialogs.ts
var import_obsidian4 = require("obsidian");

// src/contacts.ts
var import_obsidian3 = require("obsidian");
var CONTACT_STATES = /* @__PURE__ */ new Set([
  "request",
  "pending",
  "mutual",
  "blocked"
]);
var ContactsStore = class {
  constructor(adapter, root) {
    this.adapter = adapter;
    this.root = root;
    this.cache = null;
  }
  get contactsPath() {
    return (0, import_obsidian3.normalizePath)(`${this.root}/contacts.md`);
  }
  setRoot(root) {
    this.root = root;
    this.cache = null;
  }
  /**
   * One-time migration: with no contacts.md yet, every existing conversation
   * address starts as `mutual` so nothing an upgrade user already sees moves
   * into Contact requests. Returns whether the file was written.
   */
  async seed(addresses) {
    if (await this.pathExists()) return false;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const entries = [...new Set(addresses)].filter((a) => ADDRESS_RE.test(a)).sort().map((address) => ({ address, name: address, state: "mutual", updated: now }));
    await this.write(entries);
    return true;
  }
  async list() {
    return [...await this.read()].sort((a, b) => a.address.localeCompare(b.address));
  }
  /** Entries keyed by address — the shape classifyInbound wants. */
  async map() {
    return new Map((await this.read()).map((e) => [e.address, e]));
  }
  async get(address) {
    return (await this.read()).find((e) => e.address === address) ?? null;
  }
  async upsert(entry) {
    if (!ADDRESS_RE.test(entry.address) || !CONTACT_STATES.has(entry.state)) return;
    const kept = entry.name === "" || entry.updated === "" ? { ...entry, name: entry.name || entry.address, updated: entry.updated || (/* @__PURE__ */ new Date()).toISOString() } : entry;
    await this.write([kept, ...(await this.read()).filter((e) => e.address !== kept.address)]);
  }
  async setState(address, state) {
    const entries = await this.read();
    const hit = entries.find((e) => e.address === address);
    if (!hit || hit.state === state || !CONTACT_STATES.has(state)) return;
    hit.state = state;
    hit.updated = (/* @__PURE__ */ new Date()).toISOString();
    await this.write(entries);
  }
  async remove(address) {
    const entries = await this.read();
    if (!entries.some((e) => e.address === address)) return;
    await this.write(entries.filter((e) => e.address !== address));
  }
  async pathExists() {
    try {
      return await this.adapter.exists(this.contactsPath);
    } catch {
      return false;
    }
  }
  async read() {
    let st = null;
    try {
      const raw = await this.adapter.stat(this.contactsPath);
      st = raw && raw.type === "file" ? { mtimeMs: raw.mtime, size: raw.size } : null;
    } catch {
      st = null;
    }
    if (!st) {
      this.cache = null;
      return [];
    }
    if (this.cache && this.cache.mtimeMs === st.mtimeMs && this.cache.size === st.size) {
      return this.cache.entries;
    }
    const entries = parseContacts(await this.adapter.read(this.contactsPath));
    this.cache = { mtimeMs: st.mtimeMs, size: st.size, entries };
    return entries;
  }
  /** Rewritten, never appended — same rule as the registry. */
  async write(entries) {
    const sorted = [...entries].sort((a, b) => a.address.localeCompare(b.address));
    const escape = (s) => s.replace(/\|/g, "\\|");
    const table = "| address | name | state | updated | fp | key | relays |\n| --- | --- | --- | --- | --- | --- | --- |\n" + sorted.map(
      (e) => `| ${escape(e.address)} | ${escape(e.name)} | ${escape(e.state)} | ${escape(e.updated)} | ${escape(e.fp ?? "")} | ${escape(e.publicKey ?? "")} | ${escape((e.relays ?? []).join(" "))} |`
    ).join("\n") + "\n";
    const content = `# Messenger contacts

The social gate: request | pending | mutual | blocked (see SPEC.md \xA717). A name-based gate over self-declared addresses \u2014 not authentication (\xA78). Cross-vault contacts carry their OM-2 pin in the fp/key/relays columns. Rewritten by plugins, not appended.

${table}`;
    this.cache = null;
    try {
      await this.adapter.mkdir(this.root);
    } catch {
    }
    await this.adapter.write(this.contactsPath, content);
  }
};
function parseContacts(content) {
  const entries = [];
  const unescape = (s) => s.replace(/\\\|/g, "|");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed.split(/(?<!\\)\|/).map((c) => c.trim());
    if (cells.length < 6) continue;
    const address = cells[1];
    const name = cells[2];
    const state = cells[3];
    const updated = cells[4];
    if (!address || address === "---" || !ADDRESS_RE.test(address)) continue;
    if (address === "address" && name === "name" && state === "state") continue;
    if (!CONTACT_STATES.has(state)) continue;
    const entry = {
      address,
      name: (name || address).replace(/\\\|/g, "|"),
      state,
      updated: updated.replace(/\\\|/g, "|")
    };
    if (cells.length >= 9) {
      const fp = unescape(cells[5] ?? "");
      const publicKey = unescape(cells[6] ?? "");
      const relays = unescape(cells[7] ?? "").split(" ").filter(Boolean);
      if (fp) entry.fp = fp;
      if (publicKey) entry.publicKey = publicKey;
      if (relays.length > 0) entry.relays = relays;
    }
    entries.push(entry);
  }
  return entries;
}
function classifyInbound(from, contacts, myAddress, systemAddress, verified = false) {
  if (from === myAddress) return "self";
  if (from === systemAddress) return "system";
  const state = contacts.get(from)?.state;
  switch (state) {
    case "blocked":
      return "blocked";
    // block wins — verified upstream or not
    case "mutual":
      return "contact";
    case "pending":
      return "upgrade";
    default:
      return verified ? "upgrade" : "request";
  }
}
function slugify(raw) {
  const s = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^[._-]+/, "").replace(/[._-]+$/, "").slice(0, 64).replace(/[._-]+$/, "");
  return ADDRESS_RE.test(s) ? s : "";
}
function suggestAddress(picked, taken) {
  const owned = new Set(taken);
  const sources = [
    (picked.email ?? "").split("@")[0],
    (picked.tel ?? "").replace(/[^0-9]/g, ""),
    picked.name ?? ""
  ];
  for (const source of sources) {
    const base = slugify(source);
    if (!base) continue;
    if (!owned.has(base) && !isReservedAddress(base)) return base;
    for (let n = 2; n < 100; n++) {
      const candidate = `${base}-${n}`.slice(0, 64);
      if (!owned.has(candidate) && !isReservedAddress(candidate)) return candidate;
    }
  }
  return "";
}

// src/om2/crypto/keys.ts
var import_tweetnacl = __toESM(require_nacl_fast());

// node_modules/@noble/hashes/esm/_md.js
function setBigUint64(view, byteOffset, value, isLE2) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE2);
  const _32n2 = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n2 & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE2 ? 4 : 0;
  const l = isLE2 ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE2);
  view.setUint32(byteOffset + l, wl, isLE2);
}
var Chi = (a, b, c) => a & b ^ ~a & c;
var Maj = (a, b, c) => a & b ^ a & c ^ b & c;
var HashMD = class extends Hash {
  constructor(blockLen, outputLen, padOffset, isLE2) {
    super();
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE2;
    this.finished = false;
    this.length = 0;
    this.pos = 0;
    this.destroyed = false;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    exists(this);
    const { view, buffer, blockLen } = this;
    data = toBytes(data);
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    exists(this);
    output(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE: isLE2 } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    this.buffer.subarray(pos).fill(0);
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE2);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE2);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to || (to = new this.constructor());
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.length = length;
    to.pos = pos;
    to.finished = finished;
    to.destroyed = destroyed;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
};

// node_modules/@noble/hashes/esm/sha256.js
var SHA256_K = /* @__PURE__ */ new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_IV = /* @__PURE__ */ new Uint32Array([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA256 = class extends HashMD {
  constructor() {
    super(64, 32, 8, false);
    this.A = SHA256_IV[0] | 0;
    this.B = SHA256_IV[1] | 0;
    this.C = SHA256_IV[2] | 0;
    this.D = SHA256_IV[3] | 0;
    this.E = SHA256_IV[4] | 0;
    this.F = SHA256_IV[5] | 0;
    this.G = SHA256_IV[6] | 0;
    this.H = SHA256_IV[7] | 0;
  }
  get() {
    const { A, B, C, D, E, F, G: G2, H } = this;
    return [A, B, C, D, E, F, G2, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G2, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G2 | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr2(W15, 7) ^ rotr2(W15, 18) ^ W15 >>> 3;
      const s1 = rotr2(W2, 17) ^ rotr2(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G: G2, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr2(E, 6) ^ rotr2(E, 11) ^ rotr2(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G2) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr2(A, 2) ^ rotr2(A, 13) ^ rotr2(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G2;
      G2 = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G2 = G2 + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G2, H);
  }
  roundClean() {
    SHA256_W.fill(0);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    this.buffer.fill(0);
  }
};
var sha256 = /* @__PURE__ */ wrapConstructor(() => new SHA256());

// src/om2/crypto/base58.ts
var ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58Encode(bytes2) {
  if (bytes2.length === 0) return "";
  let zeros = 0;
  while (zeros < bytes2.length && bytes2[zeros] === 0) zeros++;
  const size = Math.floor((bytes2.length - zeros) * 138 / 100) + 1;
  const buf = new Uint8Array(size);
  let len = 0;
  for (let i = zeros; i < bytes2.length; i++) {
    let carry = bytes2[i];
    let j = 0;
    for (let k = size - 1; (carry !== 0 || j < len) && k >= 0; k--, j++) {
      carry += 256 * buf[k];
      buf[k] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    len = j;
  }
  let out = "";
  for (let i = size - len; i < size; i++) out += ALPHABET[buf[i]];
  return "1".repeat(zeros) + out;
}

// src/om2/crypto/b64.ts
function toB642(bytes2) {
  let s = "";
  for (let i = 0; i < bytes2.length; i++) s += String.fromCharCode(bytes2[i]);
  return btoa(s);
}
function fromB642(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function toB64u(bytes2) {
  return toB642(bytes2).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64u(s) {
  let t = s.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4 !== 0) t += "=";
  return fromB642(t);
}
function bytesToHex(bytes2) {
  let out = "";
  for (let i = 0; i < bytes2.length; i++) out += bytes2[i].toString(16).padStart(2, "0");
  return out;
}

// src/om2/crypto/keys.ts
function identityFromSeed(seed) {
  const kp = import_tweetnacl.default.sign.keyPair.fromSeed(seed);
  return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}
function fingerprint(publicKey) {
  const digest = sha256(publicKey).slice(0, 20);
  return `fp_${base58Encode(digest)}`;
}
function signDetached(identity, canonical) {
  return import_tweetnacl.default.sign.detached(new TextEncoder().encode(canonical), identity.secretKey);
}
function verifyDetached(publicKey, sig, canonical) {
  try {
    return import_tweetnacl.default.sign.detached.verify(new TextEncoder().encode(canonical), sig, publicKey);
  } catch {
    return false;
  }
}
function identityValid(identity) {
  const kp = import_tweetnacl.default.sign.keyPair.fromSecretKey(identity.secretKey);
  return bytesToHex(kp.publicKey) === bytesToHex(identity.publicKey);
}

// src/om2/invite.ts
var INVITE_PREFIX = "osinv1-";
var INVITE_LINK_BASE = "obsidian://message-bus-invite?code=";
function encodeInvite(invite) {
  const json = { v: 1, k: invite.publicKey, r: invite.relay };
  if (invite.handle) json.h = invite.handle;
  const bytes2 = new TextEncoder().encode(JSON.stringify(json));
  return INVITE_PREFIX + toB64u(bytes2);
}
function inviteLink(invite) {
  return INVITE_LINK_BASE + encodeURIComponent(encodeInvite(invite));
}
function decodeInvite(raw) {
  const code = extractCode(raw);
  if (!code) return null;
  try {
    const bytes2 = fromB64u(code.slice(INVITE_PREFIX.length));
    const json = JSON.parse(new TextDecoder().decode(bytes2));
    if (json.v !== 1) return null;
    if (typeof json.k !== "string" || fromB64u(json.k).length !== 32) return null;
    if (typeof json.r !== "string" || !/^https?:\/\//.test(json.r)) return null;
    const invite = {
      publicKey: json.k,
      relay: json.r.trim().replace(/\/+$/, "")
    };
    if (typeof json.h === "string" && /^@[^@\s]+@[^@\s]+$/.test(json.h.trim())) {
      invite.handle = json.h.trim();
    }
    return invite;
  } catch {
    return null;
  }
}
function inviteFingerprint(invite) {
  return fingerprint(fromB64u(invite.publicKey));
}
function extractCode(raw) {
  const s = raw.trim();
  if (s.startsWith(INVITE_PREFIX)) return s.split(/\s/)[0] ?? null;
  const m = /osinv1-[A-Za-z0-9_-]+/.exec(s);
  return m ? m[0] ?? null : null;
}

// src/om2/alias.ts
function sanitizeHandleForm(remote) {
  const m = /^@([^@\s]+)@([^@\s]+)$/.exec(remote);
  if (!m) return sanitizeFreeform(remote);
  const name = m[1];
  const host = m[2].replace(/\./g, "-");
  return sanitizeFreeform(`${name}.${host}`);
}
function sanitizeFpForm(fp) {
  return sanitizeFreeform(fp.replace(/^fp_/, "fp-"));
}
function sanitizeFreeform(s) {
  let out = s.replace(/[^a-zA-Z0-9._-]/g, "-");
  out = out.replace(/^[-._]+/, "");
  out = out.slice(0, 56);
  return out;
}
function collisionSuffix(publicKey) {
  return bytesToHex(sha256(publicKey)).slice(0, 6);
}
function aliasCandidate(remote, publicKey) {
  let alias = remote.handle ? sanitizeHandleForm(remote.handle) : sanitizeFpForm(remote.fp);
  if (!ADDRESS_RE.test(alias)) {
    alias = `fp-${collisionSuffix(publicKey)}`;
  }
  return alias;
}

// src/contact-import.ts
function contactsNavigator() {
  try {
    return navigator?.contacts ?? null;
  } catch {
    return null;
  }
}
function deviceContactsAvailable() {
  return contactsNavigator() !== null;
}
async function pickDeviceContacts() {
  const nav = contactsNavigator();
  if (!nav) return null;
  try {
    const picks = await nav.select(["name", "email", "tel"], { multiple: true });
    return picks.map((p) => ({
      name: firstString(p.name),
      email: firstString(p.email),
      tel: firstString(p.tel)
    }));
  } catch {
    return null;
  }
}
function firstString(v) {
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : "";
  return typeof v === "string" ? v : "";
}
function unfold(text) {
  const lines = [];
  for (const raw of text.split(/\r?\n/)) {
    if ((raw.startsWith(" ") || raw.startsWith("	")) && lines.length > 0) {
      lines[lines.length - 1] += raw.slice(1);
      continue;
    }
    lines.push(raw);
  }
  return lines;
}
function propName(line) {
  const head = line.split(/[;:]/, 1)[0] ?? "";
  return (head.includes(".") ? head.slice(head.lastIndexOf(".") + 1) : head).toLowerCase();
}
function propValue(line) {
  const idx = line.indexOf(":");
  return idx === -1 ? "" : line.slice(idx + 1).trim();
}
function unescapeValue(v) {
  return v.replace(
    /\\([nN\\,;])/g,
    (_m, c) => c === "n" || c === "N" ? "\n" : c
  );
}
function nameFromN(value) {
  const parts = value.split(";").map((p) => p.trim()).filter(Boolean);
  const [family = "", given = "", ...rest] = parts;
  return [given, ...rest, family].filter(Boolean).join(" ");
}
function cleanTel(v) {
  return v.replace(/^tel:/i, "").replace(/[\s()\-.]/g, "");
}
function parseVcf(text) {
  const out = [];
  let current = null;
  for (const line of unfold(text)) {
    const trimmed = line.trim();
    if (/^begin:vcard$/i.test(trimmed)) {
      current = { name: "", email: "", tel: "" };
      continue;
    }
    if (/^end:vcard$/i.test(trimmed)) {
      if (current && (current.name || current.email || current.tel)) out.push(current);
      current = null;
      continue;
    }
    if (!current || !trimmed.includes(":")) continue;
    const value = unescapeValue(propValue(trimmed));
    if (!value) continue;
    switch (propName(trimmed)) {
      case "fn":
        if (!current.name) current.name = value.replace(/\s+/g, " ").trim();
        break;
      case "n":
        if (!current.name) current.name = nameFromN(value).replace(/\s+/g, " ").trim();
        break;
      case "email":
        if (!current.email) {
          current.email = value.replace(/^mailto:/i, "").replace(/\s+/g, "");
        }
        break;
      case "tel":
        if (!current.tel) current.tel = cleanTel(value);
        break;
    }
  }
  return out;
}
function readVcfFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file"));
    reader.readAsText(file);
  });
}

// src/attachments.ts
var ATTACHMENT_IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "avif",
  "bmp"
];
function isImageFile(name) {
  const ext = name.includes(".") ? (name.split(".").pop() ?? "").toLowerCase() : "";
  return ATTACHMENT_IMAGE_EXTENSIONS.includes(ext);
}
function parseEmbedTargets(body) {
  const out = /* @__PURE__ */ new Set();
  for (const m of body.matchAll(/!\[\[([^\]\n]+)\]\]/g)) {
    const target = m[1].split("|")[0].split("#")[0].trim();
    if (target) out.add(target);
  }
  for (const m of body.matchAll(/!\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
    let target = m[1];
    const space = target.indexOf(" ");
    if (space !== -1) target = target.slice(0, space);
    try {
      target = decodeURIComponent(target);
    } catch {
    }
    target = target.split("#")[0].trim();
    if (target) out.add(target);
  }
  return [...out];
}
function resolveEmbedTarget(target, files) {
  if (/^(https?:|data:|mailto:|file:)/i.test(target)) return null;
  const norm = target.replace(/\\/g, "/").replace(/^\//, "");
  const exact = files.find((f) => f.path === norm);
  if (exact) return exact.path;
  const base = norm.split("/").pop() ?? norm;
  const byName = files.filter((f) => f.name === base);
  return byName.length === 1 ? byName[0].path : null;
}
function conversationAttachments(messages, files) {
  const items = [];
  const seen = /* @__PURE__ */ new Set();
  let skippedSealed = 0;
  for (const m of messages) {
    if (m.encLocked) {
      skippedSealed++;
      continue;
    }
    for (const target of parseEmbedTargets(m.body)) {
      const path = resolveEmbedTarget(target, files);
      if (!path) continue;
      const key = `${m.id}\0${path}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ path, from: m.from, ts: m.ts, msgId: m.id });
    }
  }
  items.sort((a, b) => b.ts.localeCompare(a.ts) || b.msgId.localeCompare(a.msgId));
  return { items, skippedSealed };
}
function findOrphans(folderFiles, holders) {
  return folderFiles.filter((f) => !holders.has(f.path));
}

// src/dialogs.ts
var ConfirmModal = class extends import_obsidian4.Modal {
  constructor(app, opts) {
    super(app);
    this.opts = opts;
  }
  onOpen() {
    this.titleEl.setText(this.opts.title);
    this.contentEl.createDiv(
      { cls: "messenger-confirm-text" },
      (el) => el.setText(this.opts.message)
    );
    new import_obsidian4.Setting(this.contentEl).addButton(
      (b) => b.setButtonText("Cancel").onClick(() => this.close())
    ).addButton(
      (b) => b.setButtonText(this.opts.cta).setDestructive().onClick(() => {
        this.close();
        void this.opts.onConfirm();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var RenameAddressModal = class extends import_obsidian4.Modal {
  constructor(app, address, currentName, onSave) {
    super(app);
    this.address = address;
    this.currentName = currentName;
    this.onSave = onSave;
    this.saving = false;
    this.value = currentName;
  }
  onOpen() {
    this.titleEl.setText(`Rename ${this.address}`);
    new import_obsidian4.Setting(this.contentEl).setName("Display name").setDesc("Shown in conversation lists. Empty = use the address.").addText((text) => {
      text.setValue(this.currentName).onChange((v) => this.value = v.trim());
      text.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") void this.trySave();
      });
    });
    new import_obsidian4.Setting(this.contentEl).addButton(
      (b) => b.setCta().setButtonText("Save").onClick(() => void this.trySave())
    );
  }
  async trySave() {
    if (this.saving) return;
    this.saving = true;
    try {
      await this.onSave(this.value);
      this.close();
    } finally {
      this.saving = false;
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var PasscodePromptModal = class extends import_obsidian4.Modal {
  constructor(app, opts) {
    super(app);
    this.opts = opts;
    this.errorEl = null;
    this.inputEl = null;
    this.buttonEl = null;
    this.busy = false;
  }
  onOpen() {
    this.modalEl.addClass("messenger-passcode-modal");
    this.titleEl.setText(this.opts.title);
    const desc = this.opts.desc;
    if (desc) {
      this.contentEl.createDiv(
        { cls: "messenger-confirm-text" },
        (el) => el.setText(desc)
      );
    }
    const placeholder = this.opts.placeholder ?? "Passcode";
    const input = this.contentEl.createEl("input", {
      cls: "messenger-passcode-input",
      type: "password",
      attr: {
        placeholder,
        "aria-label": placeholder,
        name: "messenger-secret",
        autocomplete: "current-password",
        autocapitalize: "off",
        autocorrect: "off",
        spellcheck: "false"
      }
    });
    this.inputEl = input;
    this.errorEl = this.contentEl.createDiv({ cls: "messenger-passcode-error" });
    new import_obsidian4.Setting(this.contentEl).addButton((b) => {
      b.setCta().setButtonText(this.opts.cta ?? "Continue").onClick(() => void this.tryContinue());
      this.buttonEl = b.buttonEl;
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void this.tryContinue();
    });
    window.setTimeout(() => input.focus(), 0);
  }
  async tryContinue() {
    const input = this.inputEl;
    if (!input || this.busy) return;
    const label = this.opts.placeholder ?? "passcode";
    this.busy = true;
    if (this.buttonEl) this.buttonEl.disabled = true;
    let ok = false;
    try {
      ok = await this.opts.verify(input.value);
    } finally {
      this.busy = false;
      if (this.buttonEl) this.buttonEl.disabled = false;
    }
    if (!ok) {
      this.errorEl?.setText(`Wrong ${label.toLowerCase()} \u2014 try again.`);
      input.select();
      return;
    }
    this.close();
    void this.opts.onSuccess(input.value);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var SetPasscodeModal = class extends import_obsidian4.Modal {
  constructor(app, plugin, onSaved) {
    super(app);
    this.plugin = plugin;
    this.onSaved = onSaved;
    this.current = "";
    this.next = "";
    this.confirm = "";
    this.hintEl = null;
    this.ctaEl = null;
    this.saving = false;
  }
  /** The floor for the new passcode: the stronger one when it wraps a key. */
  get strongRequired() {
    return this.plugin.isEncrypted();
  }
  get minChars() {
    return this.strongRequired ? ENCRYPTION_PASSCODE_MIN : PASSCODE_MIN;
  }
  validNext() {
    return this.strongRequired ? isStrongPasscode(this.next) : isValidPasscode(this.next);
  }
  onOpen() {
    this.modalEl.addClass("messenger-passcode-modal");
    const changing = this.plugin.hasPasscode();
    const keyMode = this.plugin.isKeyMode();
    this.titleEl.setText(
      changing ? keyMode ? "Switch to passcode" : "Change passcode" : "Set a passcode"
    );
    this.contentEl.createDiv(
      { cls: "messenger-confirm-text" },
      (el) => el.setText(
        keyMode ? "Replace the generated vault key with a passcode you memorize. It will derive the encryption key \u2014 at least 8 characters, not digits-only; the stronger it is, the more a stolen backup is worth protecting." : this.strongRequired ? `This passcode derives the encryption key \u2014 it is the only thing standing between a stolen backup and your messages. At least ${ENCRYPTION_PASSCODE_MIN} characters, not digits-only; a stored-in-your-password-manager random string is even better.` : `The passcode locks Messenger on startup and guards conversations you lock. At least ${PASSCODE_MIN} characters \u2014 it guards the app, it does not encrypt your mail.`
      )
    );
    if (changing) {
      new import_obsidian4.Setting(this.contentEl).setName(keyMode ? "Current vault key" : "Current passcode").addText((text) => {
        text.inputEl.type = "password";
        text.inputEl.autocomplete = "current-password";
        if (keyMode) text.setPlaceholder("XXXXX-XXXXX-XXXXX-XXXXX-XXXXX");
        text.onChange((v) => this.current = v);
      });
    }
    new import_obsidian4.Setting(this.contentEl).setName("New passcode").addText((text) => {
      text.inputEl.type = "password";
      text.inputEl.autocomplete = "new-password";
      text.onChange((v) => {
        this.next = v;
        this.validate();
      });
    });
    new import_obsidian4.Setting(this.contentEl).setName("Confirm new passcode").addText((text) => {
      text.inputEl.type = "password";
      text.inputEl.autocomplete = "new-password";
      text.onChange((v) => {
        this.confirm = v;
        this.validate();
      });
      text.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") void this.trySave();
      });
    });
    this.hintEl = this.contentEl.createDiv({ cls: "messenger-passcode-error" });
    new import_obsidian4.Setting(this.contentEl).addButton((b) => {
      b.setCta().setButtonText("Save passcode").onClick(() => void this.trySave());
      this.ctaEl = b.buttonEl;
    });
    this.validate();
    window.setTimeout(() => {
      const first = this.contentEl.querySelector(
        "input[type='password']"
      );
      first?.focus();
    }, 0);
  }
  validate() {
    let message = "";
    if (this.next || this.confirm) {
      if (!this.validNext()) {
        message = this.strongRequired ? `At least ${ENCRYPTION_PASSCODE_MIN} characters, not digits-only (max 64).` : `At least ${PASSCODE_MIN} characters (max 64).`;
      } else if (this.confirm && this.confirm !== this.next) {
        message = "Passcodes don't match yet.";
      }
    }
    this.hintEl?.setText(message);
    if (this.ctaEl) {
      this.ctaEl.disabled = !this.validNext() || this.next !== this.confirm;
    }
  }
  async trySave() {
    if (this.saving || !this.validNext() || this.next !== this.confirm) return;
    if (this.plugin.hasPasscode() && !await this.plugin.verifyAuth(this.current)) {
      this.hintEl?.setText("Current passcode is wrong.");
      return;
    }
    this.saving = true;
    try {
      if (this.plugin.hasPasscode()) {
        const ok = await this.plugin.changePasscode(this.current, this.next.trim());
        if (!ok) {
          this.hintEl?.setText(
            this.plugin.isKeyMode() ? "Wrong vault key \u2014 or the new passcode is too weak." : "Current passcode is wrong \u2014 or the new passcode is too weak."
          );
          return;
        }
      } else {
        await this.plugin.setPasscode(this.next.trim());
      }
      new import_obsidian4.Notice("Passcode saved");
      this.close();
      this.onSaved?.();
    } finally {
      this.saving = false;
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var VaultKeyModal = class extends import_obsidian4.Modal {
  constructor(app, key, opts) {
    super(app);
    this.key = key;
    this.opts = opts;
    this.confirm = "";
    this.hintEl = null;
    this.ctaEl = null;
    this.applying = false;
    this.applied = false;
  }
  onOpen() {
    this.modalEl.addClass("messenger-passcode-modal");
    this.titleEl.setText("Your vault key");
    this.contentEl.createDiv(
      { cls: "messenger-confirm-text" },
      (el) => el.setText(
        "This key encrypts your messages \u2014 Messenger cannot show it again. Copy it into your password manager (or print it and lock it away) now: if it is lost, the encrypted mail cannot be recovered by anyone."
      )
    );
    this.contentEl.createDiv(
      { cls: "messenger-vault-key" },
      (el) => el.setText(this.key)
    );
    new import_obsidian4.Setting(this.contentEl).addButton(
      (b) => b.setButtonText("Copy key").onClick(() => {
        void navigator.clipboard?.writeText(this.key).then(() => new import_obsidian4.Notice("Key copied")).catch(() => new import_obsidian4.Notice("Copy failed \u2014 select the key manually"));
      })
    );
    new import_obsidian4.Setting(this.contentEl).setName("Paste the key to confirm you saved it").addText((text) => {
      text.setPlaceholder("XXXXX-XXXXX-XXXXX-XXXXX-XXXXX");
      text.inputEl.type = "password";
      text.inputEl.autocomplete = "new-password";
      text.inputEl.autocapitalize = "off";
      text.inputEl.setAttribute("autocorrect", "off");
      text.inputEl.spellcheck = false;
      text.onChange((v) => {
        this.confirm = v;
        this.validate();
      });
      text.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") void this.finish();
      });
    });
    this.hintEl = this.contentEl.createDiv({ cls: "messenger-passcode-error" });
    new import_obsidian4.Setting(this.contentEl).addButton((b) => {
      b.setCta().setButtonText("Encrypt with this key").onClick(() => void this.finish());
      this.ctaEl = b.buttonEl;
    });
    this.validate();
  }
  matches() {
    return normalizeVaultKey(this.confirm) === this.key;
  }
  validate() {
    const typed = this.confirm.trim();
    this.hintEl?.setText(
      typed && !this.matches() ? "Doesn't match the generated key yet." : ""
    );
    if (this.ctaEl) this.ctaEl.disabled = !this.matches();
  }
  async finish() {
    if (!this.matches() || this.applying) return;
    this.applying = true;
    if (this.ctaEl) this.ctaEl.disabled = true;
    try {
      await this.opts.apply(this.key);
      this.applied = true;
      this.close();
    } catch (err) {
      new import_obsidian4.Notice(`Couldn't switch encryption: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.applying = false;
    }
  }
  onClose() {
    this.contentEl.empty();
    this.opts.onDone();
  }
};
function draftFromPicked(picked, taken) {
  return {
    name: picked.name || picked.email || picked.tel || "",
    address: suggestAddress(picked, taken),
    include: true
  };
}
var AddContactModal = class extends import_obsidian4.Modal {
  constructor(app, plugin, options = {}) {
    super(app);
    this.plugin = plugin;
    this.options = options;
    this.drafts = [];
    this.taken = /* @__PURE__ */ new Set();
    this.rowsEl = null;
    this.hintEl = null;
    this.ctaEl = null;
    this.saving = false;
    this.inviteInputEl = null;
    this.invitePanelEl = null;
  }
  onOpen() {
    this.modalEl.addClass("messenger-add-contact-modal");
    this.titleEl.setText("Add contacts");
    this.contentEl.createDiv(
      { cls: "messenger-confirm-text" },
      (el) => el.setText(
        "Pick people from this device's contacts, import a .vcf file, add one by hand \u2014 or paste an invite code to reach a vault that shares nothing with this one. A new contact starts as an invitation \u2014 it becomes mutual when they reply or you accept their request."
      )
    );
    void this.plugin.knownAddresses().then((rows) => {
      this.taken = new Set(rows.map((r) => r.address));
    });
    const inviteWrap = this.contentEl.createDiv({ cls: "messenger-invite-paste" });
    new import_obsidian4.Setting(inviteWrap).setName("Connect across vaults").setDesc("Paste an invite code (osinv1-\u2026) or a whole invite link / \u201CDM me\u201D text.").addText((t) => {
      t.setPlaceholder("osinv1-\u2026");
      this.inviteInputEl = t.inputEl;
      t.inputEl.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          void this.processInvite(this.inviteInputEl?.value ?? "");
        }
      });
    }).addButton(
      (b) => b.setCta().setButtonText("Connect").onClick(() => void this.processInvite(this.inviteInputEl?.value ?? ""))
    );
    this.invitePanelEl = this.contentEl.createDiv({ cls: "messenger-invite-panel" });
    if (deviceContactsAvailable()) {
      new import_obsidian4.Setting(this.contentEl).addButton(
        (b) => b.setIcon("users").setButtonText("Choose from device contacts").onClick(() => void this.pickFromDevice())
      );
    } else {
      this.contentEl.createDiv(
        { cls: "messenger-onboard-hint" },
        (el) => el.setText(
          "This device's contact picker isn't available here (desktop, or a webview without it) \u2014 import a .vcf file instead."
        )
      );
    }
    const fileInput = this.contentEl.createEl("input", {
      cls: "messenger-vcf-input",
      type: "file",
      attr: { accept: ".vcf,text/vcard", "aria-hidden": "true", tabindex: "-1" }
    });
    fileInput.addEventListener("change", () => void this.importVcf(fileInput));
    new import_obsidian4.Setting(this.contentEl).addButton(
      (b) => b.setIcon("file-up").setButtonText("Import .vcf file").onClick(() => fileInput.click())
    ).addExtraButton(
      (b) => b.setIcon("user-plus").setTooltip("Add by hand").onClick(() => {
        this.drafts.push({ name: "", address: "", include: true });
        this.renderRows();
      })
    );
    this.rowsEl = this.contentEl.createDiv({ cls: "messenger-add-contact-rows" });
    this.hintEl = this.contentEl.createDiv({ cls: "messenger-passcode-error" });
    new import_obsidian4.Setting(this.contentEl).addButton((b) => {
      b.setCta().setButtonText("Add contacts").onClick(() => void this.save());
      this.ctaEl = b.buttonEl;
    });
    this.renderRows();
    if (this.options.inviteCode) {
      if (this.inviteInputEl) this.inviteInputEl.value = this.options.inviteCode;
      void this.processInvite(this.options.inviteCode);
    }
  }
  /** Decode a pasted code and render the cross-vault review panel. */
  async processInvite(raw) {
    const panel = this.invitePanelEl;
    if (!panel || this.saving) return;
    const invite = decodeInvite(raw);
    if (!invite) {
      panel.empty();
      panel.createDiv(
        { cls: "messenger-passcode-error" },
        (el) => el.setText("No invite code found in that text.")
      );
      return;
    }
    if (!this.plugin.om2Ready) {
      panel.empty();
      panel.createDiv(
        { cls: "messenger-passcode-error" },
        (el) => el.setText(
          "Cross-vault mail isn't running \u2014 enable it and set a relay in Settings \u2192 Messenger \u2192 Cross-vault mail."
        )
      );
      return;
    }
    this.renderInviteReview(panel, invite);
  }
  /** Who the invite is, where they receive mail, and the request CTA. */
  renderInviteReview(panel, invite) {
    panel.empty();
    const fp = inviteFingerprint(invite);
    const suggestion = aliasCandidate({ fp, handle: invite.handle }, fromB64u(invite.publicKey));
    let name = invite.handle ? invite.handle.replace(/^@(.+)@.+$/, "$1") : suggestion;
    panel.createDiv(
      { cls: "messenger-confirm-text" },
      (el) => el.setText(
        `Inviter ${fp} \u2014 receives mail on ${invite.relay}. Accepting later proves key continuity, not identity: compare safety numbers out-of-band.`
      )
    );
    new import_obsidian4.Setting(panel).setName("Name in your list").addText((t) => {
      t.setValue(name);
      t.onChange((v) => name = v.trim());
    }).addButton(
      (b) => b.setCta().setButtonText("Send contact request").onClick((evt) => {
        const btn = evt.target;
        void this.sendInvite(invite, name, btn);
      })
    );
  }
  async sendInvite(invite, name, btn) {
    if (this.saving) return;
    this.saving = true;
    if (btn) btn.disabled = true;
    try {
      const { fp } = await this.plugin.sendOm2Request(invite.publicKey, invite.relay);
      const keyBytes = fromB64u(invite.publicKey);
      let address = aliasCandidate({ fp, handle: invite.handle }, keyBytes);
      for (let n = 2; (this.taken.has(address) || isReservedAddress(address)) && n < 100; n++) {
        address = `${address}-${n}`.slice(0, 64);
      }
      await this.plugin.contacts.upsert({
        address,
        name: name || `${fp.slice(0, 11)}\u2026`,
        state: "pending",
        updated: (/* @__PURE__ */ new Date()).toISOString(),
        fp,
        publicKey: invite.publicKey,
        relays: [invite.relay]
      });
      new import_obsidian4.Notice("Request sent \u2014 you'll connect automatically when they accept");
      this.close();
    } catch (err) {
      new import_obsidian4.Notice(`Couldn't send the request: ${err instanceof Error ? err.message : String(err)}`);
      this.saving = false;
      if (btn) btn.disabled = false;
    }
  }
  async pickFromDevice() {
    const picked = await pickDeviceContacts();
    if (picked === null) {
      new import_obsidian4.Notice("Couldn't open this device's contacts picker");
      return;
    }
    if (picked.length > 0) this.addDrafts(picked);
  }
  async importVcf(input) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const picked = parseVcf(await readVcfFile(file));
      if (picked.length === 0) {
        new import_obsidian4.Notice("No contacts found in that file");
        return;
      }
      this.addDrafts(picked);
    } catch (err) {
      new import_obsidian4.Notice(
        `Couldn't read the file: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  addDrafts(picked) {
    for (const contact of picked) {
      const draft = draftFromPicked(contact, this.taken);
      this.drafts.push(draft);
      if (draft.address) this.taken.add(draft.address);
    }
    this.renderRows();
  }
  renderRows() {
    const rowsEl = this.rowsEl;
    if (!rowsEl) return;
    rowsEl.empty();
    this.drafts.forEach((draft, i) => {
      const row = rowsEl.createDiv({ cls: "messenger-add-contact-row" });
      const check = row.createEl("input", {
        cls: "messenger-add-contact-check",
        type: "checkbox"
      });
      check.checked = draft.include;
      check.setAttribute("aria-label", "Include this contact");
      check.addEventListener("change", () => {
        draft.include = check.checked;
        this.paintValidity();
      });
      const name = row.createEl("input", {
        cls: "messenger-add-contact-name",
        type: "text",
        attr: { placeholder: "Name", "aria-label": "Contact name" }
      });
      name.value = draft.name;
      name.addEventListener("input", () => draft.name = name.value.trim());
      const address = row.createEl("input", {
        cls: "messenger-add-contact-address",
        type: "text",
        attr: {
          placeholder: "address",
          "aria-label": "Messenger address",
          autocapitalize: "off",
          autocorrect: "off",
          spellcheck: "false"
        }
      });
      address.value = draft.address;
      address.addEventListener("input", () => {
        draft.address = address.value.trim();
        row.toggleClass("is-invalid", !this.rowOk(draft));
        this.paintValidity();
      });
      row.toggleClass("is-invalid", !this.rowOk(draft));
      const remove = row.createEl("button", {
        cls: "messenger-add-contact-remove clickable-icon"
      });
      (0, import_obsidian4.setIcon)(remove, "x");
      remove.setAttribute("aria-label", "Remove this row");
      remove.addEventListener("click", () => {
        this.drafts.splice(i, 1);
        this.renderRows();
      });
    });
    this.paintValidity();
  }
  /** An included row is ok with a well-formed address; excluded rows always are. */
  rowOk(draft) {
    return !draft.include || ADDRESS_RE.test(draft.address);
  }
  paintValidity() {
    const invalid = this.drafts.filter((d) => d.include && !ADDRESS_RE.test(d.address));
    const valid = this.drafts.filter((d) => d.include && ADDRESS_RE.test(d.address));
    this.hintEl?.setText(
      invalid.length > 0 ? "Addresses use letters, digits, . _ and - (max 64)." : ""
    );
    if (this.ctaEl) this.ctaEl.disabled = valid.length === 0;
  }
  async save() {
    if (this.saving) return;
    const valid = this.drafts.filter((d) => d.include && ADDRESS_RE.test(d.address));
    if (valid.length === 0) return;
    this.saving = true;
    try {
      for (const draft of valid) await this.plugin.addContact(draft.address, draft.name);
      new import_obsidian4.Notice(valid.length === 1 ? "Contact added" : `${valid.length} contacts added`);
      this.close();
    } catch (err) {
      new import_obsidian4.Notice(
        `Couldn't add contact: ${err instanceof Error ? err.message : String(err)}`
      );
      this.saving = false;
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
function lightboxSrc(target) {
  if (!target || typeof target !== "object") return null;
  const el = target;
  if (typeof el.tagName !== "string" || el.tagName.toUpperCase() !== "IMG") {
    return null;
  }
  if (typeof el.closest !== "function") return null;
  if (!el.closest(".messenger-bubble")) return null;
  if (el.closest("a")) return null;
  const live = typeof el.currentSrc === "string" ? el.currentSrc : "";
  return live || (typeof el.src === "string" ? el.src : "") || null;
}
var ImageLightboxModal = class extends import_obsidian4.Modal {
  constructor(app, src) {
    super(app);
    this.src = src;
  }
  onOpen() {
    this.modalEl.addClass("messenger-lightbox");
    const img = this.contentEl.createEl("img", {
      cls: "messenger-lightbox-img",
      attr: { src: this.src, alt: "Attached image" }
    });
    img.addEventListener("click", () => this.close());
  }
  onClose() {
    this.contentEl.empty();
  }
};
var RETENTION_PRESETS = [
  { id: "d1", label: "1 day", days: 1 },
  { id: "d7", label: "7 days", days: 7 },
  { id: "d30", label: "30 days", days: 30 },
  { id: "d365", label: "1 year", days: 365 },
  { id: "never", label: "Never", days: 0 }
];
function retentionChoices(currentDays) {
  if (currentDays === void 0 || RETENTION_PRESETS.some((p) => p.days === currentDays)) {
    return RETENTION_PRESETS;
  }
  return [
    ...RETENTION_PRESETS,
    { id: `d${currentDays}`, label: retentionDaysLabel(currentDays), days: currentDays }
  ];
}
function retentionDaysLabel(days) {
  if (days <= 0) return "Never";
  if (days === 1) return "1 day";
  if (days === 365) return "1 year";
  return `${days} days`;
}
function retentionCapLabel(cap) {
  return cap <= 0 ? "no limit" : `max ${cap.toLocaleString()} messages`;
}
function effectiveRetention(daysOverride, capOverride, defaults) {
  return {
    days: daysOverride ?? defaults.days,
    cap: capOverride ?? defaults.cap
  };
}
function parseRetentionCap(raw) {
  const t = raw.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.min(1e5, Math.max(0, Math.round(n)));
}
var PeerRetentionModal = class extends import_obsidian4.Modal {
  constructor(app, opts) {
    super(app);
    this.opts = opts;
    this.hintEl = null;
    this.statusEl = null;
    this.ctaEl = null;
    this.saving = false;
    this.override = opts.current.days !== void 0 || opts.current.cap !== void 0;
    this.days = opts.current.days ?? opts.defaults.days;
    this.capText = opts.current.cap === void 0 ? "" : String(opts.current.cap);
  }
  get cap() {
    const t = this.capText.trim();
    if (t === "") return void 0;
    return parseRetentionCap(t) ?? -1;
  }
  paintStatus() {
    const eff = this.override ? effectiveRetention(this.days, this.cap === -1 ? void 0 : this.cap, this.opts.defaults) : effectiveRetention(void 0, void 0, this.opts.defaults);
    const whose = this.override ? "This conversation" : "Default policy";
    this.statusEl?.setText(
      `${whose}: ${retentionDaysLabel(eff.days)}, ${retentionCapLabel(eff.cap)}`
    );
    const bad = this.override && this.cap === -1;
    this.hintEl?.setText(
      bad ? "Inbox size limit must be a whole number (0 = no limit)." : ""
    );
    if (this.ctaEl) this.ctaEl.disabled = bad;
  }
  onOpen() {
    this.modalEl.addClass("messenger-retention-modal");
    this.titleEl.setText(`Retention \u2014 ${this.opts.name}`);
    this.contentEl.createDiv(
      { cls: "messenger-confirm-text" },
      (el) => el.setText(
        `How long mail in this conversation is kept. Cleanup runs hourly and applies to ${this.opts.peer}'s inbox, outbox, and receipts \u2014 other conversations keep the default policy.`
      )
    );
    this.statusEl = this.contentEl.createDiv({ cls: "messenger-onboard-hint" });
    this.statusEl.setText("");
    const controls = this.contentEl.createDiv();
    const choices = retentionChoices(this.days);
    const setDisabled = (disabled) => {
      for (const setting of [pickerSetting, capSetting]) {
        setting.settingEl.dataset.disabled = disabled ? "true" : "false";
      }
    };
    new import_obsidian4.Setting(controls).setName("Custom policy for this conversation").setDesc("Off = follow the defaults from Settings \u2192 Messenger.").addToggle(
      (toggle) => toggle.setValue(this.override).onChange((value) => {
        this.override = value;
        setDisabled(!value);
        this.paintStatus();
      })
    );
    const pickerSetting = new import_obsidian4.Setting(controls).setName("Keep messages for").setDesc("Older messages are deleted during cleanup.").addDropdown((drop) => {
      for (const choice of choices) drop.addOption(choice.id, choice.label);
      drop.setValue(choices.find((c) => c.days === this.days)?.id ?? "d30");
      drop.onChange((value) => {
        const choice = choices.find((c) => c.id === value);
        if (choice) this.days = choice.days;
        this.paintStatus();
      });
    });
    const capSetting = new import_obsidian4.Setting(controls).setName("Inbox size limit").setDesc(
      `Beyond this many messages the oldest go during cleanup. Empty = the default limit (${this.opts.defaults.cap === 0 ? "no limit" : this.opts.defaults.cap.toLocaleString()}); 0 = no limit.`
    ).addText((text) => {
      text.setPlaceholder("default");
      text.setValue(this.capText);
      text.inputEl.inputMode = "numeric";
      text.onChange((value) => {
        this.capText = value;
        this.paintStatus();
      });
    });
    if (!this.override) setDisabled(true);
    this.hintEl = this.contentEl.createDiv({ cls: "messenger-passcode-error" });
    new import_obsidian4.Setting(this.contentEl).addButton((b) => {
      b.setCta().setButtonText("Save").onClick(() => void this.save());
      this.ctaEl = b.buttonEl;
    }).addExtraButton(
      (b) => b.setIcon("rotate-ccw").setTooltip("Reset to default").onClick(() => void this.save(true))
    );
    this.paintStatus();
  }
  async save(reset = false) {
    if (this.saving) return;
    if (this.override && !reset && this.cap === -1) return;
    const next = reset || !this.override ? {} : { days: this.days, cap: this.cap === -1 ? void 0 : this.cap };
    this.saving = true;
    try {
      await this.opts.onSave(next);
      if (reset) new import_obsidian4.Notice(`Retention for ${this.opts.name} reset to default`);
      this.close();
    } catch (err) {
      new import_obsidian4.Notice(
        `Couldn't save retention: ${err instanceof Error ? err.message : String(err)}`
      );
      this.saving = false;
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
function renderAttachmentTile(app, container, item, senderLabel) {
  const { file, ts } = item;
  const tile = container.createDiv({ cls: "messenger-att-tile clickable-icon" });
  const when = new Date(ts);
  tile.setAttribute(
    "aria-label",
    `${file.name} \u2014 ${senderLabel}, ${when.toLocaleString()}`
  );
  tile.title = tile.getAttribute("aria-label") ?? file.name;
  if (isImageFile(file.name)) {
    tile.createEl("img", {
      cls: "messenger-att-img",
      attr: { src: app.vault.getResourcePath(file), alt: file.name }
    });
    tile.addEventListener("click", () => {
      new ImageLightboxModal(app, app.vault.getResourcePath(file)).open();
    });
  } else {
    (0, import_obsidian4.setIcon)(
      tile.createDiv({ cls: "messenger-att-file-icon" }),
      file.extension === "md" ? "file-text" : "file"
    );
    tile.createDiv(
      { cls: "messenger-att-file-ext" },
      (el) => el.setText(file.extension || "file")
    );
    tile.addEventListener("click", () => {
      void app.workspace.getLeaf(true).openFile(file);
    });
  }
}
var ConversationAttachmentsModal = class extends import_obsidian4.Modal {
  constructor(app, opts) {
    super(app);
    this.opts = opts;
  }
  onOpen() {
    this.modalEl.addClass("messenger-attachments-modal");
    this.titleEl.setText(`Attachments \u2014 ${this.opts.title}`);
    if (this.opts.items.length === 0) {
      this.contentEl.createDiv(
        { cls: "messenger-confirm-text" },
        (el) => el.setText(
          this.opts.skippedSealed > 0 ? "No readable attachments \u2014 sealed messages in this conversation weren't scanned." : "No attachments in this conversation yet. Drop or paste an image in the composer to send one."
        )
      );
      return;
    }
    const grid = this.contentEl.createDiv({ cls: "messenger-att-grid" });
    for (const item of this.opts.items) {
      renderAttachmentTile(this.app, grid, item, this.opts.senderLabel(item.from));
    }
    if (this.opts.skippedSealed > 0) {
      this.contentEl.createDiv(
        { cls: "messenger-att-note" },
        (el) => el.setText(
          `${this.opts.skippedSealed} sealed message${this.opts.skippedSealed === 1 ? "" : "s"} in this conversation weren't scanned.`
        )
      );
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var AllAttachmentsModal = class extends import_obsidian4.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.groups = [];
    this.orphans = [];
  }
  onOpen() {
    this.modalEl.addClass("messenger-attachments-modal");
    this.titleEl.setText("Attachments");
    this.contentEl.createDiv(
      { cls: "messenger-confirm-text" },
      (el) => el.setText("Loading\u2026")
    );
    void this.gather().then(() => this.render());
  }
  onClose() {
    this.contentEl.empty();
  }
  async gather() {
    const app = this.app;
    const folder = this.plugin.settings.attachmentsFolder;
    const files = app.vault.getFiles();
    const fileByPath = new Map(files.map((f) => [f.path, f]));
    const refs = files.map((f) => ({ path: f.path, name: f.name }));
    const folderFiles = files.filter((f) => f.path.startsWith(`${folder}/`));
    const holders = /* @__PURE__ */ new Set();
    const me = this.plugin.settings.address;
    const [registry, contactStates, addresses] = await Promise.all([
      this.plugin.store.readRegistry(),
      this.plugin.contacts.map(),
      this.plugin.store.listAddresses()
    ]);
    const nameOf = (addr) => addr === me ? "You" : registry.find((r) => r.address === addr)?.name ?? addr;
    for (const addr of addresses) {
      const { items } = conversationAttachments(
        await this.plugin.bus.loadConversation(me, addr),
        refs
      );
      const sheetItems = [];
      for (const item of items) {
        holders.add(item.path);
        const file = fileByPath.get(item.path);
        if (file) sheetItems.push({ file, from: item.from, ts: item.ts });
      }
      const hidden = addr !== me && (contactStates.get(addr)?.state === "blocked" || this.plugin.isPeerLocked(addr));
      if (!hidden && sheetItems.length > 0) {
        this.groups.push({ address: addr, label: nameOf(addr), items: sheetItems });
      }
    }
    this.groups.sort((a, b) => {
      const last = (g) => g.items[0]?.ts ?? "";
      return last(b).localeCompare(last(a)) || a.address.localeCompare(b.address);
    });
    for (const draft of Object.values(this.plugin.settings.drafts)) {
      for (const target of parseEmbedTargets(draft)) {
        const path = resolveEmbedTarget(target, refs);
        if (path) holders.add(path);
      }
    }
    const resolvedLinks = app.metadataCache.resolvedLinks;
    for (const targets of Object.values(resolvedLinks)) {
      for (const target of Object.keys(targets)) holders.add(target);
    }
    for (const sources of Object.values(app.metadataCache.unresolvedLinks)) {
      for (const link of Object.keys(sources)) {
        const path = resolveEmbedTarget(link, refs);
        if (path) holders.add(path);
      }
    }
    this.orphans = findOrphans(folderFiles, holders);
  }
  render() {
    this.contentEl.empty();
    const folder = this.plugin.settings.attachmentsFolder;
    this.contentEl.createDiv(
      { cls: "messenger-confirm-text" },
      (el) => el.setText(
        this.groups.length === 0 && this.orphans.length === 0 ? `No attachments anywhere yet \u2014 files land in ${folder}/ when you paste or drop one into a composer.` : `${this.groups.length} conversation${this.groups.length === 1 ? "" : "s"} \xB7 ${this.orphans.length} unreferenced file${this.orphans.length === 1 ? "" : "s"} in ${folder}/`
      )
    );
    for (const group of this.groups) {
      const head = this.contentEl.createDiv({ cls: "messenger-att-group" });
      head.createDiv(
        { cls: "messenger-att-group-name" },
        (el) => el.setText(group.label)
      );
      head.createDiv(
        { cls: "messenger-att-group-addr" },
        (el) => el.setText(group.address)
      );
      const grid = this.contentEl.createDiv({ cls: "messenger-att-grid" });
      for (const item of group.items) {
        renderAttachmentTile(
          this.app,
          grid,
          item,
          item.from === this.plugin.settings.address ? "You" : group.label
        );
      }
    }
    if (this.orphans.length > 0) {
      const head = this.contentEl.createDiv({ cls: "messenger-att-group" });
      (0, import_obsidian4.setIcon)(head.createDiv({ cls: "messenger-att-group-icon" }), "trash-2");
      head.createDiv(
        { cls: "messenger-att-group-name" },
        (el) => el.setText("Not referenced by any message, draft, or note")
      );
      const list = this.contentEl.createDiv({ cls: "messenger-att-orphans" });
      for (const file of this.orphans) {
        const row = list.createDiv({ cls: "messenger-att-orphan-row" });
        (0, import_obsidian4.setIcon)(row.createDiv({ cls: "messenger-att-orphan-icon" }), "file");
        const label = row.createDiv({ cls: "messenger-att-orphan-label" });
        label.createDiv(
          { cls: "messenger-att-orphan-name" },
          (el) => el.setText(file.name)
        );
        label.createDiv(
          { cls: "messenger-att-orphan-meta" },
          (el) => el.setText(
            `${formatBytes(file.stat.size)} \xB7 ${new Date(file.stat.mtime).toLocaleDateString()}`
          )
        );
      }
      new import_obsidian4.Setting(this.contentEl).setDesc(
        "Unreferenced files are orphans of GC'd or burned messages, or embeds deleted before sending. Trashing them cannot be undone from here."
      ).addButton(
        (b) => b.setButtonText(`Move ${this.orphans.length} to trash`).setDestructive().onClick(() => this.confirmCleanup())
      );
    }
  }
  confirmCleanup() {
    const count = this.orphans.length;
    if (count === 0) return;
    new ConfirmModal(this.app, {
      title: "Delete unreferenced attachments",
      message: `Move ${count} file${count === 1 ? "" : "s"} from the attachments folder to the system trash? Every surviving message, draft, and note was checked \u2014 nothing that links them remains.`,
      cta: "Move to trash",
      onConfirm: async () => {
        let moved = 0;
        for (const file of this.orphans) {
          try {
            await this.app.fileManager.trashFile(file);
            moved++;
          } catch (err) {
            console.warn("[message-bus] attachment cleanup skipped", file.path, err);
          }
        }
        new import_obsidian4.Notice(`Moved ${moved} file${moved === 1 ? "" : "s"} to trash`);
        this.groups = [];
        this.orphans = [];
        this.contentEl.empty();
        this.contentEl.createDiv(
          { cls: "messenger-confirm-text" },
          (el) => el.setText("Loading\u2026")
        );
        void this.gather().then(() => this.render());
      }
    }).open();
  }
};
function formatBytes(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

// src/om2/modals.ts
var import_obsidian5 = require("obsidian");

// src/om2/qrcodegen.ts
var qrcodegen;
((qrcodegen2) => {
  const _QrCode = class _QrCode {
    /*-- Constructor (low level) and fields --*/
    // Creates a new QR Code with the given version number,
    // error correction level, data codeword bytes, and mask number.
    // This is a low-level API that most users should not use directly.
    // A mid-level API is the encodeSegments() function.
    constructor(version, errorCorrectionLevel, dataCodewords, msk) {
      this.version = version;
      this.errorCorrectionLevel = errorCorrectionLevel;
      // The modules of this QR Code (false = light, true = dark).
      // Immutable after constructor finishes. Accessed through getModule().
      this.modules = [];
      // Indicates function modules that are not subjected to masking. Discarded when constructor finishes.
      this.isFunction = [];
      if (version < _QrCode.MIN_VERSION || version > _QrCode.MAX_VERSION)
        throw new RangeError("Version value out of range");
      if (msk < -1 || msk > 7)
        throw new RangeError("Mask value out of range");
      this.size = version * 4 + 17;
      let row = [];
      for (let i = 0; i < this.size; i++)
        row.push(false);
      for (let i = 0; i < this.size; i++) {
        this.modules.push(row.slice());
        this.isFunction.push(row.slice());
      }
      this.drawFunctionPatterns();
      const allCodewords = this.addEccAndInterleave(dataCodewords);
      this.drawCodewords(allCodewords);
      if (msk == -1) {
        let minPenalty = 1e9;
        for (let i = 0; i < 8; i++) {
          this.applyMask(i);
          this.drawFormatBits(i);
          const penalty = this.getPenaltyScore();
          if (penalty < minPenalty) {
            msk = i;
            minPenalty = penalty;
          }
          this.applyMask(i);
        }
      }
      assert(0 <= msk && msk <= 7);
      this.mask = msk;
      this.applyMask(msk);
      this.drawFormatBits(msk);
      this.isFunction = [];
    }
    /*-- Static factory functions (high level) --*/
    // Returns a QR Code representing the given Unicode text string at the given error correction level.
    // As a conservative upper bound, this function is guaranteed to succeed for strings that have 738 or fewer
    // Unicode code points (not UTF-16 code units) if the low error correction level is used. The smallest possible
    // QR Code version is automatically chosen for the output. The ECC level of the result may be higher than the
    // ecl argument if it can be done without increasing the version.
    static encodeText(text, ecl) {
      const segs = qrcodegen2.QrSegment.makeSegments(text);
      return _QrCode.encodeSegments(segs, ecl);
    }
    // Returns a QR Code representing the given binary data at the given error correction level.
    // This function always encodes using the binary segment mode, not any text mode. The maximum number of
    // bytes allowed is 2953. The smallest possible QR Code version is automatically chosen for the output.
    // The ECC level of the result may be higher than the ecl argument if it can be done without increasing the version.
    static encodeBinary(data, ecl) {
      const seg = qrcodegen2.QrSegment.makeBytes(data);
      return _QrCode.encodeSegments([seg], ecl);
    }
    /*-- Static factory functions (mid level) --*/
    // Returns a QR Code representing the given segments with the given encoding parameters.
    // The smallest possible QR Code version within the given range is automatically
    // chosen for the output. Iff boostEcl is true, then the ECC level of the result
    // may be higher than the ecl argument if it can be done without increasing the
    // version. The mask number is either between 0 to 7 (inclusive) to force that
    // mask, or -1 to automatically choose an appropriate mask (which may be slow).
    // This function allows the user to create a custom sequence of segments that switches
    // between modes (such as alphanumeric and byte) to encode text in less space.
    // This is a mid-level API; the high-level API is encodeText() and encodeBinary().
    static encodeSegments(segs, ecl, minVersion = 1, maxVersion = 40, mask = -1, boostEcl = true) {
      if (!(_QrCode.MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= _QrCode.MAX_VERSION) || mask < -1 || mask > 7)
        throw new RangeError("Invalid value");
      let version;
      let dataUsedBits;
      for (version = minVersion; ; version++) {
        const dataCapacityBits2 = _QrCode.getNumDataCodewords(version, ecl) * 8;
        const usedBits = QrSegment2.getTotalBits(segs, version);
        if (usedBits <= dataCapacityBits2) {
          dataUsedBits = usedBits;
          break;
        }
        if (version >= maxVersion)
          throw new RangeError("Data too long");
      }
      for (const newEcl of [_QrCode.Ecc.MEDIUM, _QrCode.Ecc.QUARTILE, _QrCode.Ecc.HIGH]) {
        if (boostEcl && dataUsedBits <= _QrCode.getNumDataCodewords(version, newEcl) * 8)
          ecl = newEcl;
      }
      let bb = [];
      for (const seg of segs) {
        appendBits(seg.mode.modeBits, 4, bb);
        appendBits(seg.numChars, seg.mode.numCharCountBits(version), bb);
        for (const b of seg.getData())
          bb.push(b);
      }
      assert(bb.length == dataUsedBits);
      const dataCapacityBits = _QrCode.getNumDataCodewords(version, ecl) * 8;
      assert(bb.length <= dataCapacityBits);
      appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
      appendBits(0, (8 - bb.length % 8) % 8, bb);
      assert(bb.length % 8 == 0);
      for (let padByte = 236; bb.length < dataCapacityBits; padByte ^= 236 ^ 17)
        appendBits(padByte, 8, bb);
      let dataCodewords = [];
      while (dataCodewords.length * 8 < bb.length)
        dataCodewords.push(0);
      bb.forEach((b, i) => dataCodewords[i >>> 3] |= b << 7 - (i & 7));
      return new _QrCode(version, ecl, dataCodewords, mask);
    }
    /*-- Accessor methods --*/
    // Returns the color of the module (pixel) at the given coordinates, which is false
    // for light or true for dark. The top left corner has the coordinates (x=0, y=0).
    // If the given coordinates are out of bounds, then false (light) is returned.
    getModule(x, y) {
      return 0 <= x && x < this.size && 0 <= y && y < this.size && this.modules[y][x];
    }
    /*-- Private helper methods for constructor: Drawing function modules --*/
    // Reads this object's version field, and draws and marks all function modules.
    drawFunctionPatterns() {
      for (let i = 0; i < this.size; i++) {
        this.setFunctionModule(6, i, i % 2 == 0);
        this.setFunctionModule(i, 6, i % 2 == 0);
      }
      this.drawFinderPattern(3, 3);
      this.drawFinderPattern(this.size - 4, 3);
      this.drawFinderPattern(3, this.size - 4);
      const alignPatPos = this.getAlignmentPatternPositions();
      const numAlign = alignPatPos.length;
      for (let i = 0; i < numAlign; i++) {
        for (let j = 0; j < numAlign; j++) {
          if (!(i == 0 && j == 0 || i == 0 && j == numAlign - 1 || i == numAlign - 1 && j == 0))
            this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
        }
      }
      this.drawFormatBits(0);
      this.drawVersion();
    }
    // Draws two copies of the format bits (with its own error correction code)
    // based on the given mask and this object's error correction level field.
    drawFormatBits(mask) {
      const data = this.errorCorrectionLevel.formatBits << 3 | mask;
      let rem = data;
      for (let i = 0; i < 10; i++)
        rem = rem << 1 ^ (rem >>> 9) * 1335;
      const bits = (data << 10 | rem) ^ 21522;
      assert(bits >>> 15 == 0);
      for (let i = 0; i <= 5; i++)
        this.setFunctionModule(8, i, getBit(bits, i));
      this.setFunctionModule(8, 7, getBit(bits, 6));
      this.setFunctionModule(8, 8, getBit(bits, 7));
      this.setFunctionModule(7, 8, getBit(bits, 8));
      for (let i = 9; i < 15; i++)
        this.setFunctionModule(14 - i, 8, getBit(bits, i));
      for (let i = 0; i < 8; i++)
        this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
      for (let i = 8; i < 15; i++)
        this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
      this.setFunctionModule(8, this.size - 8, true);
    }
    // Draws two copies of the version bits (with its own error correction code),
    // based on this object's version field, iff 7 <= version <= 40.
    drawVersion() {
      if (this.version < 7)
        return;
      let rem = this.version;
      for (let i = 0; i < 12; i++)
        rem = rem << 1 ^ (rem >>> 11) * 7973;
      const bits = this.version << 12 | rem;
      assert(bits >>> 18 == 0);
      for (let i = 0; i < 18; i++) {
        const color = getBit(bits, i);
        const a = this.size - 11 + i % 3;
        const b = Math.floor(i / 3);
        this.setFunctionModule(a, b, color);
        this.setFunctionModule(b, a, color);
      }
    }
    // Draws a 9*9 finder pattern including the border separator,
    // with the center module at (x, y). Modules can be out of bounds.
    drawFinderPattern(x, y) {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const dist = Math.max(Math.abs(dx), Math.abs(dy));
          const xx = x + dx;
          const yy = y + dy;
          if (0 <= xx && xx < this.size && 0 <= yy && yy < this.size)
            this.setFunctionModule(xx, yy, dist != 2 && dist != 4);
        }
      }
    }
    // Draws a 5*5 alignment pattern, with the center module
    // at (x, y). All modules must be in bounds.
    drawAlignmentPattern(x, y) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++)
          this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) != 1);
      }
    }
    // Sets the color of a module and marks it as a function module.
    // Only used by the constructor. Coordinates must be in bounds.
    setFunctionModule(x, y, isDark) {
      this.modules[y][x] = isDark;
      this.isFunction[y][x] = true;
    }
    /*-- Private helper methods for constructor: Codewords and masking --*/
    // Returns a new byte string representing the given data with the appropriate error correction
    // codewords appended to it, based on this object's version and error correction level.
    addEccAndInterleave(data) {
      const ver = this.version;
      const ecl = this.errorCorrectionLevel;
      if (data.length != _QrCode.getNumDataCodewords(ver, ecl))
        throw new RangeError("Invalid argument");
      const numBlocks = _QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
      const blockEccLen = _QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
      const rawCodewords = Math.floor(_QrCode.getNumRawDataModules(ver) / 8);
      const numShortBlocks = numBlocks - rawCodewords % numBlocks;
      const shortBlockLen = Math.floor(rawCodewords / numBlocks);
      let blocks = [];
      const rsDiv = _QrCode.reedSolomonComputeDivisor(blockEccLen);
      for (let i = 0, k = 0; i < numBlocks; i++) {
        let dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
        k += dat.length;
        const ecc = _QrCode.reedSolomonComputeRemainder(dat, rsDiv);
        if (i < numShortBlocks)
          dat.push(0);
        blocks.push(dat.concat(ecc));
      }
      let result = [];
      for (let i = 0; i < blocks[0].length; i++) {
        blocks.forEach((block2, j) => {
          if (i != shortBlockLen - blockEccLen || j >= numShortBlocks)
            result.push(block2[i]);
        });
      }
      assert(result.length == rawCodewords);
      return result;
    }
    // Draws the given sequence of 8-bit codewords (data and error correction) onto the entire
    // data area of this QR Code. Function modules need to be marked off before this is called.
    drawCodewords(data) {
      if (data.length != Math.floor(_QrCode.getNumRawDataModules(this.version) / 8))
        throw new RangeError("Invalid argument");
      let i = 0;
      for (let right = this.size - 1; right >= 1; right -= 2) {
        if (right == 6)
          right = 5;
        for (let vert = 0; vert < this.size; vert++) {
          for (let j = 0; j < 2; j++) {
            const x = right - j;
            const upward = (right + 1 & 2) == 0;
            const y = upward ? this.size - 1 - vert : vert;
            if (!this.isFunction[y][x] && i < data.length * 8) {
              this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
              i++;
            }
          }
        }
      }
      assert(i == data.length * 8);
    }
    // XORs the codeword modules in this QR Code with the given mask pattern.
    // The function modules must be marked and the codeword bits must be drawn
    // before masking. Due to the arithmetic of XOR, calling applyMask() with
    // the same mask value a second time will undo the mask. A final well-formed
    // QR Code needs exactly one (not zero, two, etc.) mask applied.
    applyMask(mask) {
      if (mask < 0 || mask > 7)
        throw new RangeError("Mask value out of range");
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          let invert;
          switch (mask) {
            case 0:
              invert = (x + y) % 2 == 0;
              break;
            case 1:
              invert = y % 2 == 0;
              break;
            case 2:
              invert = x % 3 == 0;
              break;
            case 3:
              invert = (x + y) % 3 == 0;
              break;
            case 4:
              invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0;
              break;
            case 5:
              invert = x * y % 2 + x * y % 3 == 0;
              break;
            case 6:
              invert = (x * y % 2 + x * y % 3) % 2 == 0;
              break;
            case 7:
              invert = ((x + y) % 2 + x * y % 3) % 2 == 0;
              break;
            default:
              throw new Error("Unreachable");
          }
          if (!this.isFunction[y][x] && invert)
            this.modules[y][x] = !this.modules[y][x];
        }
      }
    }
    // Calculates and returns the penalty score based on state of this QR Code's current modules.
    // This is used by the automatic mask choice algorithm to find the mask pattern that yields the lowest score.
    getPenaltyScore() {
      let result = 0;
      for (let y = 0; y < this.size; y++) {
        let runColor = false;
        let runX = 0;
        let runHistory = [0, 0, 0, 0, 0, 0, 0];
        for (let x = 0; x < this.size; x++) {
          if (this.modules[y][x] == runColor) {
            runX++;
            if (runX == 5)
              result += _QrCode.PENALTY_N1;
            else if (runX > 5)
              result++;
          } else {
            this.finderPenaltyAddHistory(runX, runHistory);
            if (!runColor)
              result += this.finderPenaltyCountPatterns(runHistory) * _QrCode.PENALTY_N3;
            runColor = this.modules[y][x];
            runX = 1;
          }
        }
        result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * _QrCode.PENALTY_N3;
      }
      for (let x = 0; x < this.size; x++) {
        let runColor = false;
        let runY = 0;
        let runHistory = [0, 0, 0, 0, 0, 0, 0];
        for (let y = 0; y < this.size; y++) {
          if (this.modules[y][x] == runColor) {
            runY++;
            if (runY == 5)
              result += _QrCode.PENALTY_N1;
            else if (runY > 5)
              result++;
          } else {
            this.finderPenaltyAddHistory(runY, runHistory);
            if (!runColor)
              result += this.finderPenaltyCountPatterns(runHistory) * _QrCode.PENALTY_N3;
            runColor = this.modules[y][x];
            runY = 1;
          }
        }
        result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * _QrCode.PENALTY_N3;
      }
      for (let y = 0; y < this.size - 1; y++) {
        for (let x = 0; x < this.size - 1; x++) {
          const color = this.modules[y][x];
          if (color == this.modules[y][x + 1] && color == this.modules[y + 1][x] && color == this.modules[y + 1][x + 1])
            result += _QrCode.PENALTY_N2;
        }
      }
      let dark = 0;
      for (const row of this.modules)
        dark = row.reduce((sum, color) => sum + (color ? 1 : 0), dark);
      const total = this.size * this.size;
      const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
      assert(0 <= k && k <= 9);
      result += k * _QrCode.PENALTY_N4;
      assert(0 <= result && result <= 2568888);
      return result;
    }
    /*-- Private helper functions --*/
    // Returns an ascending list of positions of alignment patterns for this version number.
    // Each position is in the range [0,177), and are used on both the x and y axes.
    // This could be implemented as lookup table of 40 variable-length lists of integers.
    getAlignmentPatternPositions() {
      if (this.version == 1)
        return [];
      else {
        const numAlign = Math.floor(this.version / 7) + 2;
        const step = Math.floor((this.version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
        let result = [6];
        for (let pos = this.size - 7; result.length < numAlign; pos -= step)
          result.splice(1, 0, pos);
        return result;
      }
    }
    // Returns the number of data bits that can be stored in a QR Code of the given version number, after
    // all function modules are excluded. This includes remainder bits, so it might not be a multiple of 8.
    // The result is in the range [208, 29648]. This could be implemented as a 40-entry lookup table.
    static getNumRawDataModules(ver) {
      if (ver < _QrCode.MIN_VERSION || ver > _QrCode.MAX_VERSION)
        throw new RangeError("Version number out of range");
      let result = (16 * ver + 128) * ver + 64;
      if (ver >= 2) {
        const numAlign = Math.floor(ver / 7) + 2;
        result -= (25 * numAlign - 10) * numAlign - 55;
        if (ver >= 7)
          result -= 36;
      }
      assert(208 <= result && result <= 29648);
      return result;
    }
    // Returns the number of 8-bit data (i.e. not error correction) codewords contained in any
    // QR Code of the given version number and error correction level, with remainder bits discarded.
    // This stateless pure function could be implemented as a (40*4)-cell lookup table.
    static getNumDataCodewords(ver, ecl) {
      return Math.floor(_QrCode.getNumRawDataModules(ver) / 8) - _QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] * _QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
    }
    // Returns a Reed-Solomon ECC generator polynomial for the given degree. This could be
    // implemented as a lookup table over all possible parameter values, instead of as an algorithm.
    static reedSolomonComputeDivisor(degree) {
      if (degree < 1 || degree > 255)
        throw new RangeError("Degree out of range");
      let result = [];
      for (let i = 0; i < degree - 1; i++)
        result.push(0);
      result.push(1);
      let root = 1;
      for (let i = 0; i < degree; i++) {
        for (let j = 0; j < result.length; j++) {
          result[j] = _QrCode.reedSolomonMultiply(result[j], root);
          if (j + 1 < result.length)
            result[j] ^= result[j + 1];
        }
        root = _QrCode.reedSolomonMultiply(root, 2);
      }
      return result;
    }
    // Returns the Reed-Solomon error correction codeword for the given data and divisor polynomials.
    static reedSolomonComputeRemainder(data, divisor) {
      let result = divisor.map((_) => 0);
      for (const b of data) {
        const factor = b ^ result.shift();
        result.push(0);
        divisor.forEach((coef, i) => result[i] ^= _QrCode.reedSolomonMultiply(coef, factor));
      }
      return result;
    }
    // Returns the product of the two given field elements modulo GF(2^8/0x11D). The arguments and result
    // are unsigned 8-bit integers. This could be implemented as a lookup table of 256*256 entries of uint8.
    static reedSolomonMultiply(x, y) {
      if (x >>> 8 != 0 || y >>> 8 != 0)
        throw new RangeError("Byte out of range");
      let z = 0;
      for (let i = 7; i >= 0; i--) {
        z = z << 1 ^ (z >>> 7) * 285;
        z ^= (y >>> i & 1) * x;
      }
      assert(z >>> 8 == 0);
      return z;
    }
    // Can only be called immediately after a light run is added, and
    // returns either 0, 1, or 2. A helper function for getPenaltyScore().
    finderPenaltyCountPatterns(runHistory) {
      const n = runHistory[1];
      assert(n <= this.size * 3);
      const core = n > 0 && runHistory[2] == n && runHistory[3] == n * 3 && runHistory[4] == n && runHistory[5] == n;
      return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
    }
    // Must be called at the end of a line (row or column) of modules. A helper function for getPenaltyScore().
    finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, runHistory) {
      if (currentRunColor) {
        this.finderPenaltyAddHistory(currentRunLength, runHistory);
        currentRunLength = 0;
      }
      currentRunLength += this.size;
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      return this.finderPenaltyCountPatterns(runHistory);
    }
    // Pushes the given value to the front and drops the last value. A helper function for getPenaltyScore().
    finderPenaltyAddHistory(currentRunLength, runHistory) {
      if (runHistory[0] == 0)
        currentRunLength += this.size;
      runHistory.pop();
      runHistory.unshift(currentRunLength);
    }
  };
  /*-- Constants and tables --*/
  // The minimum version number supported in the QR Code Model 2 standard.
  _QrCode.MIN_VERSION = 1;
  // The maximum version number supported in the QR Code Model 2 standard.
  _QrCode.MAX_VERSION = 40;
  // For use in getPenaltyScore(), when evaluating which mask is best.
  _QrCode.PENALTY_N1 = 3;
  _QrCode.PENALTY_N2 = 3;
  _QrCode.PENALTY_N3 = 40;
  _QrCode.PENALTY_N4 = 10;
  _QrCode.ECC_CODEWORDS_PER_BLOCK = [
    // Version: (note that index 0 is for padding, and is set to an illegal value)
    //0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    // Low
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    // Medium
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    // Quartile
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
    // High
  ];
  _QrCode.NUM_ERROR_CORRECTION_BLOCKS = [
    // Version: (note that index 0 is for padding, and is set to an illegal value)
    //0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    // Low
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    // Medium
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    // Quartile
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
    // High
  ];
  let QrCode2 = _QrCode;
  qrcodegen2.QrCode = _QrCode;
  function appendBits(val, len, bb) {
    if (len < 0 || len > 31 || val >>> len != 0)
      throw new RangeError("Value out of range");
    for (let i = len - 1; i >= 0; i--)
      bb.push(val >>> i & 1);
  }
  function getBit(x, i) {
    return (x >>> i & 1) != 0;
  }
  function assert(cond) {
    if (!cond)
      throw new Error("Assertion error");
  }
  const _QrSegment = class _QrSegment {
    /*-- Constructor (low level) and fields --*/
    // Creates a new QR Code segment with the given attributes and data.
    // The character count (numChars) must agree with the mode and the bit buffer length,
    // but the constraint isn't checked. The given bit buffer is cloned and stored.
    constructor(mode, numChars, bitData) {
      this.mode = mode;
      this.numChars = numChars;
      this.bitData = bitData;
      if (numChars < 0)
        throw new RangeError("Invalid argument");
      this.bitData = bitData.slice();
    }
    /*-- Static factory functions (mid level) --*/
    // Returns a segment representing the given binary data encoded in
    // byte mode. All input byte arrays are acceptable. Any text string
    // can be converted to UTF-8 bytes and encoded as a byte mode segment.
    static makeBytes(data) {
      let bb = [];
      for (const b of data)
        appendBits(b, 8, bb);
      return new _QrSegment(_QrSegment.Mode.BYTE, data.length, bb);
    }
    // Returns a segment representing the given string of decimal digits encoded in numeric mode.
    static makeNumeric(digits) {
      if (!_QrSegment.isNumeric(digits))
        throw new RangeError("String contains non-numeric characters");
      let bb = [];
      for (let i = 0; i < digits.length; ) {
        const n = Math.min(digits.length - i, 3);
        appendBits(parseInt(digits.substring(i, i + n), 10), n * 3 + 1, bb);
        i += n;
      }
      return new _QrSegment(_QrSegment.Mode.NUMERIC, digits.length, bb);
    }
    // Returns a segment representing the given text string encoded in alphanumeric mode.
    // The characters allowed are: 0 to 9, A to Z (uppercase only), space,
    // dollar, percent, asterisk, plus, hyphen, period, slash, colon.
    static makeAlphanumeric(text) {
      if (!_QrSegment.isAlphanumeric(text))
        throw new RangeError("String contains unencodable characters in alphanumeric mode");
      let bb = [];
      let i;
      for (i = 0; i + 2 <= text.length; i += 2) {
        let temp = _QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
        temp += _QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
        appendBits(temp, 11, bb);
      }
      if (i < text.length)
        appendBits(_QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
      return new _QrSegment(_QrSegment.Mode.ALPHANUMERIC, text.length, bb);
    }
    // Returns a new mutable list of zero or more segments to represent the given Unicode text string.
    // The result may use various segment modes and switch modes to optimize the length of the bit stream.
    static makeSegments(text) {
      if (text == "")
        return [];
      else if (_QrSegment.isNumeric(text))
        return [_QrSegment.makeNumeric(text)];
      else if (_QrSegment.isAlphanumeric(text))
        return [_QrSegment.makeAlphanumeric(text)];
      else
        return [_QrSegment.makeBytes(_QrSegment.toUtf8ByteArray(text))];
    }
    // Returns a segment representing an Extended Channel Interpretation
    // (ECI) designator with the given assignment value.
    static makeEci(assignVal) {
      let bb = [];
      if (assignVal < 0)
        throw new RangeError("ECI assignment value out of range");
      else if (assignVal < 1 << 7)
        appendBits(assignVal, 8, bb);
      else if (assignVal < 1 << 14) {
        appendBits(2, 2, bb);
        appendBits(assignVal, 14, bb);
      } else if (assignVal < 1e6) {
        appendBits(6, 3, bb);
        appendBits(assignVal, 21, bb);
      } else
        throw new RangeError("ECI assignment value out of range");
      return new _QrSegment(_QrSegment.Mode.ECI, 0, bb);
    }
    // Tests whether the given string can be encoded as a segment in numeric mode.
    // A string is encodable iff each character is in the range 0 to 9.
    static isNumeric(text) {
      return _QrSegment.NUMERIC_REGEX.test(text);
    }
    // Tests whether the given string can be encoded as a segment in alphanumeric mode.
    // A string is encodable iff each character is in the following set: 0 to 9, A to Z
    // (uppercase only), space, dollar, percent, asterisk, plus, hyphen, period, slash, colon.
    static isAlphanumeric(text) {
      return _QrSegment.ALPHANUMERIC_REGEX.test(text);
    }
    /*-- Methods --*/
    // Returns a new copy of the data bits of this segment.
    getData() {
      return this.bitData.slice();
    }
    // (Package-private) Calculates and returns the number of bits needed to encode the given segments at
    // the given version. The result is infinity if a segment has too many characters to fit its length field.
    static getTotalBits(segs, version) {
      let result = 0;
      for (const seg of segs) {
        const ccbits = seg.mode.numCharCountBits(version);
        if (seg.numChars >= 1 << ccbits)
          return Infinity;
        result += 4 + ccbits + seg.bitData.length;
      }
      return result;
    }
    // Returns a new array of bytes representing the given string encoded in UTF-8.
    static toUtf8ByteArray(str) {
      str = encodeURI(str);
      let result = [];
      for (let i = 0; i < str.length; i++) {
        if (str.charAt(i) != "%")
          result.push(str.charCodeAt(i));
        else {
          result.push(parseInt(str.substring(i + 1, i + 3), 16));
          i += 2;
        }
      }
      return result;
    }
  };
  /*-- Constants --*/
  // Describes precisely all strings that are encodable in numeric mode.
  _QrSegment.NUMERIC_REGEX = /^[0-9]*$/;
  // Describes precisely all strings that are encodable in alphanumeric mode.
  _QrSegment.ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
  // The set of all legal characters in alphanumeric mode,
  // where each character value maps to the index in the string.
  _QrSegment.ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
  let QrSegment2 = _QrSegment;
  qrcodegen2.QrSegment = _QrSegment;
})(qrcodegen || (qrcodegen = {}));
((qrcodegen2) => {
  let QrCode2;
  ((QrCode3) => {
    const _Ecc = class _Ecc {
      // The QR Code can tolerate about 30% erroneous codewords
      /*-- Constructor and fields --*/
      constructor(ordinal, formatBits) {
        this.ordinal = ordinal;
        this.formatBits = formatBits;
      }
    };
    /*-- Constants --*/
    _Ecc.LOW = new _Ecc(0, 1);
    // The QR Code can tolerate about  7% erroneous codewords
    _Ecc.MEDIUM = new _Ecc(1, 0);
    // The QR Code can tolerate about 15% erroneous codewords
    _Ecc.QUARTILE = new _Ecc(2, 3);
    // The QR Code can tolerate about 25% erroneous codewords
    _Ecc.HIGH = new _Ecc(3, 2);
    let Ecc = _Ecc;
    QrCode3.Ecc = _Ecc;
  })(QrCode2 = qrcodegen2.QrCode || (qrcodegen2.QrCode = {}));
})(qrcodegen || (qrcodegen = {}));
((qrcodegen2) => {
  let QrSegment2;
  ((QrSegment3) => {
    const _Mode = class _Mode {
      /*-- Constructor and fields --*/
      constructor(modeBits, numBitsCharCount) {
        this.modeBits = modeBits;
        this.numBitsCharCount = numBitsCharCount;
      }
      /*-- Method --*/
      // (Package-private) Returns the bit width of the character count field for a segment in
      // this mode in a QR Code at the given version number. The result is in the range [0, 16].
      numCharCountBits(ver) {
        return this.numBitsCharCount[Math.floor((ver + 7) / 17)];
      }
    };
    /*-- Constants --*/
    _Mode.NUMERIC = new _Mode(1, [10, 12, 14]);
    _Mode.ALPHANUMERIC = new _Mode(2, [9, 11, 13]);
    _Mode.BYTE = new _Mode(4, [8, 16, 16]);
    _Mode.KANJI = new _Mode(8, [8, 10, 12]);
    _Mode.ECI = new _Mode(7, [0, 0, 0]);
    let Mode = _Mode;
    QrSegment3.Mode = _Mode;
  })(QrSegment2 = qrcodegen2.QrSegment || (qrcodegen2.QrSegment = {}));
})(qrcodegen || (qrcodegen = {}));
var { QrCode, QrSegment } = qrcodegen;

// src/om2/qr.ts
function inviteQr(invite) {
  return QrCode.encodeText(inviteLink(invite), QrCode.Ecc.MEDIUM);
}

// src/om2/qr-card.ts
var QUIET_MODULES = 4;
function renderQr(qr, scale) {
  const modules = qr.size + QUIET_MODULES * 2;
  const canvas = document.createElement("canvas");
  canvas.width = modules * scale;
  canvas.height = modules * scale;
  const ctx2 = canvas.getContext("2d");
  if (!ctx2) throw new Error("Canvas 2D context unavailable");
  ctx2.fillStyle = "#ffffff";
  ctx2.fillRect(0, 0, canvas.width, canvas.height);
  ctx2.fillStyle = "#000000";
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y)) {
        ctx2.fillRect(
          (x + QUIET_MODULES) * scale,
          (y + QUIET_MODULES) * scale,
          scale,
          scale
        );
      }
    }
  }
  return canvas;
}
function drawInviteQr(canvas, invite) {
  const qr = inviteQr(invite);
  const drawn = renderQr(qr, Math.max(3, Math.floor(220 / (qr.size + QUIET_MODULES * 2))));
  canvas.width = drawn.width;
  canvas.height = drawn.height;
  canvas.getContext("2d")?.drawImage(drawn, 0, 0);
}
async function inviteQrPng(invite) {
  const canvas = renderQr(inviteQr(invite), 12);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not encode the QR as PNG");
  return blob.arrayBuffer();
}

// src/om2/modals.ts
var IdentitySetupModal = class extends import_obsidian5.Modal {
  constructor(app, plugin, mode) {
    super(app);
    this.plugin = plugin;
    this.mode = mode;
    this.secret = "";
    this.busy = false;
    this.errorEl = null;
  }
  onOpen() {
    this.modalEl.addClass("messenger-identity-setup");
    this.titleEl.setText(this.mode === "create" ? "Enable cross-vault mail" : "Regenerate identity");
    this.contentEl.createDiv(
      { cls: "messenger-confirm-text" },
      (el) => el.setText(
        this.mode === "create" ? "Cross-vault mail needs a signing keypair for this vault. Your unlock secret wraps it at rest \u2014 it never touches disk unwrapped." : "A new keypair replaces the old one. Every cross-vault contact must re-add you from your new invite \u2014 there is no silent re-pin (\xA75.3)."
      )
    );
    new import_obsidian5.Setting(this.contentEl).setName("Unlock secret").setDesc("The passcode (or vault key) that unlocks Messenger").addText((t) => {
      t.inputEl.type = "password";
      t.setPlaceholder("Your unlock secret");
      t.onChange((v) => {
        this.secret = v;
        void this.paint();
      });
    });
    this.errorEl = this.contentEl.createDiv({ cls: "messenger-passcode-error" });
    new import_obsidian5.Setting(this.contentEl).addButton((b) => {
      b.setCta().setButtonText(this.mode === "create" ? "Create identity" : "Regenerate");
      b.buttonEl.disabled = true;
      b.onClick(() => void this.submit(b.buttonEl));
    });
  }
  async paint() {
    const ctas = this.contentEl.querySelectorAll("button");
    ctas.forEach((el) => el.disabled = this.secret.length < 4 || this.busy);
  }
  async submit(btn) {
    if (this.busy || this.secret.length < 4) return;
    this.busy = true;
    btn.disabled = true;
    try {
      if (!await this.plugin.verifyAuth(this.secret)) {
        if (this.errorEl) this.errorEl.setText("Wrong unlock secret.");
        this.busy = false;
        btn.disabled = false;
        return;
      }
      if (this.mode === "create") {
        this.plugin.settings.om2.enabled = true;
        await this.plugin.saveSettings();
        await this.plugin.createOm2Identity(this.secret);
        new import_obsidian5.Notice("Messenger: cross-vault mail is on \u2014 share your invite code", 8e3);
      } else {
        await this.plugin.regenerateOm2Identity(this.secret);
      }
      this.close();
    } catch (err) {
      if (this.errorEl) this.errorEl.setText(err instanceof Error ? err.message : String(err));
      this.busy = false;
      btn.disabled = false;
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var IdentityModal = class extends import_obsidian5.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  onOpen() {
    this.modalEl.addClass("messenger-identity-modal");
    this.titleEl.setText("Cross-vault identity");
    const invite = this.plugin.om2Invite();
    const fp = this.plugin.om2Fp;
    this.contentEl.createDiv(
      { cls: "messenger-confirm-text" },
      (el) => el.setText(
        "This is your cross-vault identity: a keypair whose fingerprint is who you are on relays. Share the invite so people can reach this vault \u2014 trust still anchors in comparing safety numbers out-of-band."
      )
    );
    if (!fp || !invite) {
      this.contentEl.createDiv(
        { cls: "messenger-onboard-hint" },
        (el) => el.setText(
          "No live identity \u2014 enable Cross-vault mail (and set a relay) in Settings \u2192 Messenger first."
        )
      );
      return;
    }
    new import_obsidian5.Setting(this.contentEl).setName("Fingerprint").addText((t) => {
      t.setValue(fp).inputEl.readOnly = true;
    });
    const qrWrap = this.contentEl.createDiv({ cls: "messenger-invite-qr" });
    const canvas = qrWrap.createEl("canvas", { cls: "messenger-invite-qr-canvas" });
    const inviteObj = this.toInvite(invite);
    if (!inviteObj) {
      qrWrap.setText("(QR unavailable)");
      return;
    }
    try {
      drawInviteQr(canvas, inviteObj);
    } catch (err) {
      console.error("[message-bus] qr render failed", err);
      qrWrap.setText("(QR unavailable)");
    }
    const codeArea = this.contentEl.createEl("textarea", { cls: "messenger-invite-code" });
    codeArea.readOnly = true;
    codeArea.rows = 3;
    codeArea.value = invite.code;
    new import_obsidian5.Setting(this.contentEl).addButton(
      (b) => b.setIcon("copy").setButtonText("Copy invite code").onClick(() => {
        void navigator.clipboard.writeText(invite.code);
        new import_obsidian5.Notice("Invite code copied");
      })
    ).addButton(
      (b) => b.setIcon("copy").setButtonText("Copy link").onClick(() => {
        void navigator.clipboard.writeText(invite.link);
        new import_obsidian5.Notice("Invite link copied");
      })
    ).addButton(
      (b) => b.setIcon("copy").setButtonText("Copy QR image").onClick(() => void this.copyQrImage(invite))
    ).addButton(
      (b) => b.setIcon("save").setButtonText("Save QR to vault").onClick(() => void this.saveQrToVault(invite))
    );
  }
  toInvite(invite) {
    return decodeInvite(invite.code);
  }
  async copyQrImage(invite) {
    const parsed = this.toInvite(invite);
    if (!parsed) return;
    try {
      const png = await inviteQrPng(parsed);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": new Blob([png], { type: "image/png" }) })
      ]);
      new import_obsidian5.Notice("QR image copied");
    } catch (err) {
      console.error("[message-bus] qr copy failed", err);
      new import_obsidian5.Notice("Couldn't copy the image here \u2014 use \u201CSave QR to vault\u201D instead");
    }
  }
  async saveQrToVault(invite) {
    const parsed = this.toInvite(invite);
    if (!parsed) return;
    try {
      const png = await inviteQrPng(parsed);
      const path = await uniqueVaultPath(this.plugin, "message-bus-invite-qr.png");
      await this.plugin.app.vault.createBinary(path, png);
      new import_obsidian5.Notice(`Saved to the vault: ${path}`);
    } catch (err) {
      new import_obsidian5.Notice(`Couldn't save: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
async function uniqueVaultPath(plugin, filename) {
  const dot = filename.lastIndexOf(".");
  const base = dot >= 0 ? filename.slice(0, dot) : filename;
  const ext = dot >= 0 ? filename.slice(dot) : "";
  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? filename : `${base}-${n}${ext}`;
    if (!(plugin.app.vault.getAbstractFileByPath(candidate) instanceof import_obsidian5.TFile)) return candidate;
  }
  return `${base}-${Date.now()}${ext}`;
}

// src/settings-tab.ts
var isHexColor = (s) => /^#[0-9a-f]{6}$/i.test(s.trim());
var clampInt2 = (value, min, max, fallback) => {
  const n = value == null ? NaN : typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};
var MessengerSettingTab = class extends import_obsidian6.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    /** Blocked contacts load async; cached so definitions can read it sync. */
    this.blockedContacts = [];
    this.blockedLoaded = false;
    this.plugin = plugin;
  }
  /**
   * One line per conversation carrying a retention override, for the storage
   * section's readout — "curtis: 7 days, max 500 messages". Only dimensions
   * actually overridden are named.
   */
  retentionOverrideLines() {
    const days = this.plugin.settings.retentionDaysByPeer;
    const caps = this.plugin.settings.maxInboxMessagesByPeer;
    const peers = [.../* @__PURE__ */ new Set([...Object.keys(days), ...Object.keys(caps)])].sort();
    return peers.map((peer) => {
      const parts = [];
      if (days[peer] !== void 0) parts.push(retentionDaysLabel(days[peer]));
      if (caps[peer] !== void 0) parts.push(retentionCapLabel(caps[peer]));
      return `${peer}: ${parts.join(", ")}`;
    });
  }
  /**
   * Kick off (once) the async blocked-contact load; `update()` repaints when
   * it lands. The definitions below stay synchronous and read the cache.
   */
  ensureBlockedContacts() {
    if (this.blockedLoaded) return;
    this.blockedLoaded = true;
    void this.plugin.listContacts().then((contacts) => {
      this.blockedContacts = contacts.filter((c) => c.state === "blocked");
      this.update();
    });
  }
  hasBlockedContacts() {
    this.ensureBlockedContacts();
    return this.blockedContacts.length > 0;
  }
  // -- value plumbing -----------------------------------------------------------
  getControlValue(key) {
    return this.plugin.settings[key];
  }
  async setControlValue(key, value) {
    const s = this.plugin.settings;
    switch (key) {
      case "displayName":
        s.displayName = typeof value === "string" ? value.trim().slice(0, 80) : "";
        await this.plugin.saveSettings();
        await this.plugin.store.upsertRegistry({
          address: s.address,
          name: this.plugin.selfRegistryName(),
          updated: (/* @__PURE__ */ new Date()).toISOString()
        });
        return;
      case "root": {
        const t = typeof value === "string" ? value.trim().replace(/^\/+|\/+$/g, "") : "";
        if (!t) return;
        s.root = t;
        if (!s.hiddenStorage) {
          this.plugin.store.setRoot(t);
          await this.plugin.store.ensureRoot();
        }
        break;
      }
      case "attachmentsFolder": {
        const t = typeof value === "string" ? value.trim().replace(/^\/+|\/+$/g, "") : "";
        if (!t) return;
        s.attachmentsFolder = t;
        break;
      }
      case "pollSeconds":
        s.pollSeconds = clampInt2(value, 1, 3600, s.pollSeconds);
        break;
      case "retentionDays":
        s.retentionDays = clampInt2(value, 0, 3650, s.retentionDays);
        break;
      case "maxInboxMessages":
        s.maxInboxMessages = clampInt2(value, 0, 1e5, s.maxInboxMessages);
        break;
      case "lockOnStart":
        s.lockOnStart = value === true;
        break;
      case "notifyPopup":
        s.notifyPopup = value === true;
        break;
      case "notifySound":
        s.notifySound = value === true;
        break;
      case "sendReadReceipts":
        s.sendReadReceipts = value === true;
        break;
      case "keepOutbox":
        s.keepOutbox = value === true;
        this.plugin.bus.keepOutbox = s.keepOutbox;
        break;
      case "stripHtml":
        s.stripHtml = value === true;
        break;
      case "debug":
        s.debug = value === true;
        break;
      case "whoCanReachMe":
        s.whoCanReachMe = value === "contacts" ? "contacts" : "everyone";
        break;
      case "om2RelayUrl": {
        const t = typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
        s.om2.relayUrl = /^https?:\/\//.test(t) ? t : "";
        s.om2.enabled = s.om2.enabled && s.om2.relayUrl !== "";
        await this.plugin.saveSettings();
        await this.plugin.stopOm2();
        await this.plugin.tryStartOm2();
        return;
      }
      case "om2Handle": {
        const t = typeof value === "string" ? value.trim() : "";
        s.om2.handle = /^@[^@\s]+@[^@\s]+$/.test(t) ? t : "";
        break;
      }
      case "wallpaper":
        if (typeof value === "string" && value) s.wallpaper = value;
        break;
      case "wallpaperIntensity":
        s.wallpaperIntensity = clampInt2(value, 0, 100, s.wallpaperIntensity);
        break;
      case "wallpaperTintStrength":
        s.wallpaperTintStrength = clampInt2(value, 0, 100, s.wallpaperTintStrength);
        break;
      case "bubbleAlpha":
        s.bubbleAlpha = clampInt2(value, 30, 100, s.bubbleAlpha);
        break;
      default:
        return;
    }
    await this.plugin.saveSettings();
    if (key === "stripHtml" || key === "wallpaper") {
      this.plugin.refreshChatViews();
    }
    if (key === "wallpaperIntensity" || key === "wallpaperTintStrength" || key === "bubbleAlpha") {
      this.plugin.updateChatAppearance();
    }
    if (key === "wallpaper") this.update();
  }
  // -- definitions ---------------------------------------------------------------
  getSettingDefinitions() {
    const plugin = this.plugin;
    const s = plugin.settings;
    const keyMode = plugin.isKeyMode();
    const hasPasscode = plugin.hasPasscode();
    const encrypted = plugin.isEncrypted();
    const repaint = () => this.update();
    const hintRow = (cls, text) => ({
      name: "",
      searchable: false,
      render: (setting) => {
        setting.settingEl.empty();
        setting.settingEl.createDiv({ cls }, (el) => el.setText(text));
      }
    });
    const statusRow = (line) => ({
      name: line,
      searchable: false,
      render: (setting) => {
        setting.settingEl.empty();
        setting.settingEl.createDiv(
          { cls: "messenger-setting-status" },
          (el) => el.setText(line)
        );
      }
    });
    const identity = {
      type: "group",
      heading: "Identity",
      items: [
        {
          name: "Your address",
          desc: "The address other participants use to reach you. Changing it moves your inbox, read state, and registry entry with you \u2014 press Enter or leave the field to apply.",
          render: (setting) => {
            setting.setName("Your address").setDesc(
              "The address other participants use to reach you. Changing it moves your inbox, read state, and registry entry with you \u2014 press Enter or leave the field to apply."
            ).addText((text) => {
              text.setValue(s.address);
              const commit = async () => {
                const t = text.inputEl.value.trim();
                if (t === s.address) return;
                if (!ADDRESS_RE.test(t)) {
                  new import_obsidian6.Notice("Invalid address \u2014 keep it slug-like, e.g. owner");
                  text.inputEl.value = s.address;
                  return;
                }
                if (isReservedAddress(t)) {
                  new import_obsidian6.Notice(
                    `\u201C${t}\u201D is reserved \u2014 no one can register it or a handle built from it (SPEC \xA72)`
                  );
                  text.inputEl.value = s.address;
                  return;
                }
                try {
                  await plugin.changeAddress(t);
                  new import_obsidian6.Notice(`Now known as ${t}`);
                  repaint();
                } catch (err) {
                  new import_obsidian6.Notice(
                    `Couldn't change address: ${err instanceof Error ? err.message : String(err)}`
                  );
                }
              };
              text.inputEl.addEventListener("blur", () => void commit());
              text.inputEl.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void commit();
                }
              });
            });
          }
        },
        {
          name: "Display name",
          desc: "Shown in conversation lists instead of the raw address. Empty = use the address.",
          control: {
            type: "text",
            key: "displayName"
          }
        }
      ]
    };
    const security = {
      type: "group",
      heading: "Security \u2014 passcode & encryption",
      items: [
        {
          name: "Passcode",
          desc: keyMode ? "Messenger unlocks with a generated vault key kept in your password manager \u2014 no passcode is set." : encrypted ? "Your passcode derives the encryption key \u2014 it is verified by unwrapping that key, and nothing about it is stored on disk." : hasPasscode ? "A passcode is set. It locks Messenger on startup and guards conversations you lock (right-click a conversation \u2192 Lock conversation)." : "No passcode set \u2014 it is the first level of security: it locks Messenger on startup and guards conversations you lock. New vaults are asked for one during setup.",
          render: (setting) => {
            setting.setName("Passcode").setDesc(
              keyMode ? "Messenger unlocks with a generated vault key kept in your password manager \u2014 no passcode is set." : encrypted ? "Your passcode derives the encryption key \u2014 it is verified by unwrapping that key, and nothing about it is stored on disk." : hasPasscode ? "A passcode is set. It locks Messenger on startup and guards conversations you lock (right-click a conversation \u2192 Lock conversation)." : "No passcode set \u2014 it is the first level of security: it locks Messenger on startup and guards conversations you lock. New vaults are asked for one during setup."
            ).addButton(
              (btn) => btn.setButtonText(
                keyMode ? "Switch to passcode\u2026" : hasPasscode ? "Change passcode\u2026" : "Set passcode\u2026"
              ).onClick(() => new SetPasscodeModal(this.app, plugin, repaint).open())
            );
          }
        },
        {
          name: "Encrypt messages at rest",
          desc: encrypted ? "Message bodies are stored as AES-256-GCM ciphertext; the key exists only in memory after you unlock. A stolen copy of the vault (or its backup) is unreadable without your unlock secret. Turning this off decrypts every stored message." : hasPasscode ? "Store message bodies as ciphertext (AES-256-GCM) keyed by your passcode \u2014 readable only inside Messenger after unlocking. Turning it on re-encrypts all existing mail." : "Store message bodies as ciphertext (AES-256-GCM). Unlock with a generated vault key kept in your password manager \u2014 the strongest option, since the key can't be brute-forced or forgotten-guessed.",
          render: (setting) => {
            setting.setName("Encrypt messages at rest").setDesc(
              encrypted ? "Message bodies are stored as AES-256-GCM ciphertext; the key exists only in memory after you unlock. A stolen copy of the vault (or its backup) is unreadable without your unlock secret. Turning this off decrypts every stored message." : hasPasscode ? "Store message bodies as ciphertext (AES-256-GCM) keyed by your passcode \u2014 readable only inside Messenger after unlocking. Turning it on re-encrypts all existing mail." : "Store message bodies as ciphertext (AES-256-GCM). Unlock with a generated vault key kept in your password manager \u2014 the strongest option, since the key can't be brute-forced or forgotten-guessed."
            ).addToggle((toggle) => {
              toggle.setValue(encrypted);
              toggle.onChange(async (value) => {
                if (value === encrypted) return;
                if (value) {
                  if (hasPasscode && !keyMode) {
                    new PasscodePromptModal(this.app, {
                      title: "Turn on encryption",
                      desc: "Enter your passcode to mint the encryption key (at least 8 characters, not digits-only \u2014 change it first if it's weaker). Existing messages are re-written as ciphertext \u2014 this can take a moment on large mailboxes.",
                      cta: "Encrypt",
                      verify: (input) => plugin.verifyAuth(input),
                      onSuccess: async (passcode) => {
                        try {
                          await plugin.enableEncryption(passcode);
                        } catch (err) {
                          new import_obsidian6.Notice(
                            `Encryption failed: ${err instanceof Error ? err.message : String(err)}`
                          );
                        }
                        repaint();
                      }
                    }).open();
                  } else {
                    const key = generateVaultKeyString();
                    new VaultKeyModal(this.app, key, {
                      apply: (k) => plugin.enableKeyEncryption(k),
                      onDone: repaint
                    }).open();
                  }
                } else {
                  new PasscodePromptModal(this.app, {
                    title: "Turn off encryption",
                    desc: keyMode ? "Paste your vault key to decrypt every stored message back to plain markdown. This ends with no passcode set \u2014 add one afterwards if you want the app lock." : "Enter your passcode to decrypt every stored message back to plain markdown.",
                    cta: "Decrypt",
                    placeholder: keyMode ? "Vault key" : void 0,
                    verify: (input) => plugin.verifyAuth(input),
                    onSuccess: async (secret) => {
                      try {
                        await plugin.disableEncryption(secret);
                      } catch (err) {
                        new import_obsidian6.Notice(
                          `Decryption failed: ${err instanceof Error ? err.message : String(err)}`
                        );
                      }
                      repaint();
                    }
                  }).open();
                }
              });
            });
          }
        },
        {
          name: "Unlock method",
          desc: keyMode ? "Vault key \u2014 a 125-bit generated key in your password manager derives the encryption key. Brute-forcing it is out of reach for any attacker holding your files." : "Passcode \u2014 the encryption key is derived from your passcode (Argon2id, memory-hard). Its strength sets the real security of a stolen backup: use a long random passphrase, or switch to a generated vault key.",
          visible: encrypted,
          render: (setting) => {
            setting.setName("Unlock method").setDesc(
              keyMode ? "Vault key \u2014 a 125-bit generated key in your password manager derives the encryption key. Brute-forcing it is out of reach for any attacker holding your files." : "Passcode \u2014 the encryption key is derived from your passcode (Argon2id, memory-hard). Its strength sets the real security of a stolen backup: use a long random passphrase, or switch to a generated vault key."
            ).addButton(
              (btn) => btn.setButtonText(keyMode ? "Switch to passcode\u2026" : "Switch to vault key\u2026").onClick(() => {
                if (keyMode) {
                  new SetPasscodeModal(this.app, plugin, repaint).open();
                  return;
                }
                new PasscodePromptModal(this.app, {
                  title: "Switch to vault key",
                  desc: "Enter your current passcode once. A generated key replaces it as the unlock secret \u2014 store that key in your password manager when it is shown.",
                  cta: "Continue",
                  verify: (input) => plugin.verifyAuth(input),
                  onSuccess: async (current) => {
                    const key = generateVaultKeyString();
                    new VaultKeyModal(this.app, key, {
                      apply: (k) => plugin.switchToKeyMode(current, k),
                      onDone: repaint
                    }).open();
                  }
                }).open();
              })
            );
          }
        },
        {
          name: "Regenerate vault key",
          desc: "Mint a fresh key \u2014 for rotation after a suspected leak, or a lost password-manager entry while still unlocked. No mail is re-encrypted; the old key stops working immediately.",
          visible: encrypted && keyMode,
          render: (setting) => {
            setting.setName("Regenerate vault key").setDesc(
              "Mint a fresh key \u2014 for rotation after a suspected leak, or a lost password-manager entry while still unlocked. No mail is re-encrypted; the old key stops working immediately."
            ).addButton(
              (btn) => btn.setButtonText("Regenerate\u2026").onClick(() => {
                new PasscodePromptModal(this.app, {
                  title: "Regenerate vault key",
                  desc: "Paste your current vault key to mint a replacement.",
                  cta: "Continue",
                  placeholder: "Vault key",
                  verify: (input) => plugin.verifyAuth(input),
                  onSuccess: async (current) => {
                    const key = generateVaultKeyString();
                    new VaultKeyModal(this.app, key, {
                      apply: (k) => plugin.switchToKeyMode(current, k),
                      onDone: repaint
                    }).open();
                  }
                }).open();
              })
            );
          }
        },
        {
          name: "Lock Messenger on startup",
          desc: "Ask for the unlock secret before Messenger opens after Obsidian restarts. Conversations you locked ask for it either way.",
          visible: hasPasscode,
          control: {
            type: "toggle",
            key: "lockOnStart"
          }
        },
        {
          name: "Lock now",
          desc: "Immediately put Messenger behind the lock \u2014 handy when stepping away.",
          visible: hasPasscode,
          render: (setting) => {
            setting.setName("Lock now").setDesc("Immediately put Messenger behind the lock \u2014 handy when stepping away.").addButton(
              (btn) => btn.setButtonText("Lock").onClick(() => {
                plugin.lockMessenger();
                new import_obsidian6.Notice("Messenger locked");
              })
            );
          }
        },
        {
          name: "Remove passcode",
          desc: encrypted ? "Turn off message encryption first \u2014 a passcode cannot be removed while it protects the encryption key." : "Turn the passcode off entirely. Conversation locks are removed with it \u2014 there would be nothing to unlock them with.",
          visible: hasPasscode && !keyMode,
          render: (setting) => {
            setting.setName("Remove passcode").setDesc(
              encrypted ? "Turn off message encryption first \u2014 a passcode cannot be removed while it protects the encryption key." : "Turn the passcode off entirely. Conversation locks are removed with it \u2014 there would be nothing to unlock them with."
            ).addButton(
              (btn) => btn.setDestructive().setButtonText("Remove\u2026").setDisabled(encrypted).onClick(
                () => new PasscodePromptModal(this.app, {
                  title: "Remove passcode",
                  desc: "Enter your current passcode to turn all Messenger locks off.",
                  cta: "Remove passcode",
                  verify: (input) => plugin.verifyAuth(input),
                  onSuccess: async () => {
                    try {
                      await plugin.clearPasscode();
                      new import_obsidian6.Notice("Passcode removed");
                    } catch (err) {
                      new import_obsidian6.Notice(
                        err instanceof Error ? err.message : String(err)
                      );
                    }
                    repaint();
                  }
                }).open()
              )
            );
          }
        },
        hintRow(
          "messenger-onboard-hint",
          encrypted ? "Encryption covers message bodies at rest: a stolen vault or backup shows only ciphertext, and no fast passcode verifier is stored \u2014 every guess an attacker makes costs a full key derivation. Envelope metadata (sender, recipient, time) stays readable so the bus keeps working, and anything running inside Obsidian still reads mail through the API once unlocked. For the outer layer, enable your device's own lock \u2014 Obsidian mobile's app lock / biometrics, or your OS user password on desktop; plugins can't trigger those themselves." : "Level-1 security: the passcode keeps casual snoops out of the Messenger app, but without encryption messages remain plain markdown files in your vault (SPEC \xA78). For the outer layer, enable your device's own lock \u2014 Obsidian mobile's app lock / biometrics, or your OS user password on desktop; plugins can't trigger those themselves."
        )
      ]
    };
    const appearance = {
      type: "group",
      heading: "Appearance",
      items: [
        {
          name: "Chat wallpaper",
          desc: "Background art behind conversations. Each conversation can pick its own from the image button in the chat header.",
          control: {
            type: "dropdown",
            key: "wallpaper",
            options: {
              none: "None",
              ...Object.fromEntries(WALLPAPERS.map((w) => [w.id, w.name])),
              custom: "Custom image\u2026"
            }
          }
        },
        {
          name: "Wallpaper image",
          desc: s.customWallpaperPath || "Not set \u2014 chats show a plain background until an image is chosen.",
          visible: s.wallpaper === "custom",
          render: (setting) => {
            setting.setName("Wallpaper image").setDesc(
              s.customWallpaperPath || "Not set \u2014 chats show a plain background until an image is chosen."
            ).addButton(
              (btn) => btn.setButtonText("Choose image").onClick(async () => {
                const path = await chooseVaultImage(this.app);
                if (path === null) return;
                s.customWallpaperPath = path;
                await plugin.saveSettings();
                plugin.refreshChatViews();
                repaint();
              })
            );
          }
        },
        {
          name: "Wallpaper intensity",
          desc: "How strongly the wallpaper art shows over your theme. 0% is the pure theme.",
          control: {
            type: "slider",
            key: "wallpaperIntensity",
            min: 0,
            max: 100,
            step: 5
          }
        },
        {
          name: "Tint color",
          desc: "A soft color wash over conversations (works without a wallpaper; each chat can pick its own from the header menu).",
          render: (setting) => {
            const tint = s.wallpaperTint;
            setting.setName("Tint color").setDesc(
              "A soft color wash over conversations (works without a wallpaper; each chat can pick its own from the header menu)."
            ).addColorPicker(
              (picker) => picker.setValue(isHexColor(tint) ? tint : "#8a9bb8").onChange(async (value) => {
                s.wallpaperTint = value;
                await plugin.saveSettings();
                plugin.updateChatAppearance();
              })
            ).addExtraButton(
              (btn) => btn.setIcon("rotate-ccw").setTooltip("Clear tint").onClick(async () => {
                s.wallpaperTint = "";
                await plugin.saveSettings();
                plugin.updateChatAppearance();
                repaint();
              })
            );
          }
        },
        {
          name: "Tint strength",
          desc: "How strongly the tint color washes over the chat.",
          control: {
            type: "slider",
            key: "wallpaperTintStrength",
            min: 0,
            max: 100,
            step: 5
          }
        },
        {
          name: "Bubble opacity",
          desc: "How opaque message bubbles sit over wallpaper and tint. Lower shows more of the background.",
          control: {
            type: "slider",
            key: "bubbleAlpha",
            min: 30,
            max: 100,
            step: 1
          }
        },
        {
          name: "Your profile picture",
          desc: (s.avatars[s.address] ? `Current: ${s.avatars[s.address]}. ` : "") + "A vault image shown beside your messages in conversations you're in; without one you get a generated gradient with your initials.",
          render: (setting) => {
            const myAvatar = s.avatars[s.address];
            setting.setName("Your profile picture").setDesc(
              (myAvatar ? `Current: ${myAvatar}. ` : "") + "A vault image shown beside your messages in conversations you're in; without one you get a generated gradient with your initials."
            ).addButton(
              (btn) => btn.setButtonText("Choose image").onClick(async () => {
                const path = await chooseVaultImage(this.app);
                if (path === null) return;
                s.avatars[s.address] = path;
                await plugin.saveSettings();
                plugin.refreshChatViews();
                repaint();
              })
            ).addButton(
              (btn) => btn.setButtonText("Clear").setDisabled(!myAvatar).onClick(async () => {
                delete s.avatars[s.address];
                await plugin.saveSettings();
                plugin.refreshChatViews();
                repaint();
              })
            );
          }
        }
      ]
    };
    const storage = {
      type: "group",
      heading: "Mail storage & delivery",
      items: [
        {
          name: "Hide mail storage",
          desc: `Keep inboxes in a hidden app folder (${this.app.vault.configDir}/plugins/message-bus/mailbox) so the vault stays clean \u2014 users just chat, and the markdown stays out of sight. Turn off to store mail as normal vault notes in the folder below (the visible folder is also what Obsidian Sync carries between devices; iCloud/Dropbox/Syncthing-style folder sync works either way).`,
          render: (setting) => {
            setting.setName("Hide mail storage").setDesc(
              `Keep inboxes in a hidden app folder (${this.app.vault.configDir}/plugins/message-bus/mailbox) so the vault stays clean \u2014 users just chat, and the markdown stays out of sight. Turn off to store mail as normal vault notes in the folder below (the visible folder is also what Obsidian Sync carries between devices; iCloud/Dropbox/Syncthing-style folder sync works either way).`
            ).addToggle(
              (toggle) => toggle.setValue(s.hiddenStorage).onChange(async (value) => {
                toggle.setDisabled(true);
                try {
                  await plugin.applyStorageMode(value);
                } finally {
                  toggle.setDisabled(false);
                }
                repaint();
              })
            );
          }
        },
        hintRow(
          "messenger-onboard-hint is-warn",
          "Obsidian Sync is on, but it doesn't carry hidden folders \u2014 turn off \u201CHide mail storage\u201D so your mail follows you between devices."
        ),
        {
          name: "Mailbox root folder",
          desc: "Folder holding one inbox.md per address (when storage is visible). Created if missing.",
          control: {
            type: "text",
            key: "root",
            validate: (value) => value.trim() ? void 0 : "Name a folder."
          }
        },
        {
          name: "Attachments folder",
          desc: "Visible vault folder for images pasted or dropped into the composer. Created if missing.",
          control: {
            type: "text",
            key: "attachmentsFolder",
            validate: (value) => value.trim() ? void 0 : "Name a folder."
          }
        },
        {
          name: "Poll interval (seconds)",
          desc: "Idle seconds between inbox checks (1\u20133600). Window focus, sending, and landed sync writes all check sooner. Default 5.",
          control: {
            type: "number",
            key: "pollSeconds",
            min: 1,
            max: 3600,
            step: 1
          }
        },
        {
          name: "Retention (days)",
          desc: "Messages older than this are deleted during hourly cleanup. 0 disables. Per-conversation overrides: right-click a conversation \u2192 Retention\u2026",
          control: {
            type: "number",
            key: "retentionDays",
            min: 0,
            max: 3650,
            step: 1
          }
        },
        // compact overview of the per-conversation overrides, when any exist
        ...this.retentionOverrideLines().map(statusRow),
        {
          name: "Inbox size limit",
          desc: "Keep inboxes fast and cheap to sync: beyond this many messages per inbox, the oldest are deleted during hourly cleanup regardless of age. 0 disables.",
          control: {
            type: "number",
            key: "maxInboxMessages",
            min: 0,
            max: 1e5,
            step: 1
          }
        }
      ]
    };
    const notifications = {
      type: "group",
      heading: "Notifications & receipts",
      items: [
        {
          name: "Pop up on new messages",
          desc: "Show a clickable notice when mail arrives for you. Clicking it opens the conversation.",
          control: { type: "toggle", key: "notifyPopup" }
        },
        {
          name: "Sound on new messages",
          desc: "Play a short synthesized chime when mail arrives for you (no audio files needed).",
          control: { type: "toggle", key: "notifySound" }
        },
        {
          name: "Send read receipts",
          desc: "Let senders see \u2713\u2713 when you have read their mail. Delivery receipts (\u2713) are always sent.",
          control: { type: "toggle", key: "sendReadReceipts" }
        },
        {
          name: "Keep a copy of sent mail",
          desc: "Append outgoing messages to your own outbox.md (SPEC \xA713) so sent history survives even if the recipient's folder is deleted. Off by default \u2014 your half of a conversation already lives in the recipient's inbox.",
          control: { type: "toggle", key: "keepOutbox" }
        },
        {
          name: "Escape raw HTML in messages",
          desc: "Best-effort removal of script/iframe/handler markup from rendered message bodies. Off by default \u2014 inbound mail renders like any vault note, and anything on the bus is written by things you already trust.",
          control: { type: "toggle", key: "stripHtml" }
        },
        {
          name: "Debug notifications",
          desc: "Show a notice whenever the loop processes messages.",
          control: { type: "toggle", key: "debug" }
        }
      ]
    };
    const blockedVisible = () => this.hasBlockedContacts();
    const contacts = {
      type: "group",
      heading: "Contacts & privacy",
      items: [
        {
          name: "Who can reach me",
          desc: "Everyone: mail from strangers lands under quiet Contact requests. Contacts only: the conversation list keeps to people you've added. Mail written straight to the vault's files can always land (SPEC \xA78) \u2014 there the gate is quiet, not absent.",
          control: {
            type: "dropdown",
            key: "whoCanReachMe",
            options: { everyone: "Everyone", contacts: "Contacts only" }
          }
        },
        {
          name: "Add contacts",
          desc: "From this device's contacts picker (where the system provides one), a .vcf file, or by hand.",
          render: (setting) => {
            setting.setName("Add contacts").setDesc(
              "From this device's contacts picker (where the system provides one), a .vcf file, or by hand."
            ).addButton(
              (btn) => btn.setButtonText("Add contacts\u2026").onClick(() => new AddContactModal(this.app, plugin).open())
            );
          }
        },
        {
          name: "Blocked addresses",
          desc: "Unblocking returns the conversation as a contact request to review again.",
          searchable: false,
          visible: blockedVisible
        },
        ...this.blockedContacts.map(
          (entry) => ({
            name: entry.address,
            desc: entry.name === entry.address ? "" : entry.name,
            searchable: false,
            visible: blockedVisible,
            render: (setting) => {
              setting.setName(entry.address).setDesc(entry.name === entry.address ? "" : entry.name).addButton(
                (b) => b.setButtonText("Unblock").onClick(
                  () => void plugin.unblockContact(entry.address).then(() => {
                    this.blockedContacts = this.blockedContacts.filter(
                      (c) => c.address !== entry.address
                    );
                    repaint();
                  })
                )
              );
            }
          })
        )
      ]
    };
    const om2 = {
      type: "group",
      heading: "Cross-vault mail",
      items: [
        {
          name: "Enable cross-vault mail",
          desc: "Keypair identity + end-to-end-encrypted delivery through a relay \u2014 talk to vaults that share no folder with this one. Turning it on creates your signing key (wrapped under your unlock secret).",
          render: (setting) => {
            setting.setName("Enable cross-vault mail").setDesc(
              "Keypair identity + end-to-end-encrypted delivery through a relay \u2014 talk to vaults that share no folder with this one. Turning it on creates your signing key (wrapped under your unlock secret)."
            ).addToggle(
              (t) => t.setValue(s.om2.enabled).onChange(
                (value) => void (async () => {
                  if (value) {
                    new IdentitySetupModal(this.app, plugin, "create").open();
                  } else {
                    s.om2.enabled = false;
                    await plugin.saveSettings();
                    await plugin.disableOm2();
                    this.update();
                  }
                })()
              )
            );
          }
        },
        {
          name: "Relay URL",
          desc: "Where your inbound mail waits (a dumb per-fingerprint mailbox for sealed boxes \u2014 it cannot read anything). Self-host one with `npm run relay`.",
          control: { type: "text", key: "om2RelayUrl" }
        },
        {
          name: "Handle (optional)",
          desc: "A name like @alice@example.com that rides along with your mail as from2, so contacts see a name instead of a fingerprint.",
          control: { type: "text", key: "om2Handle" }
        },
        {
          name: "Your identity",
          render: (setting) => {
            setting.setName("Your identity").setDesc(
              plugin.om2Fp ? `Live \u2014 ${plugin.om2Fp}. The invite code / QR is what you share.` : "Not created yet \u2014 enable cross-vault mail above to mint one."
            ).addButton(
              (btn) => btn.setButtonText("Show invite / QR\u2026").onClick(() => new IdentityModal(this.app, plugin).open())
            ).addExtraButton(
              (btn) => btn.setIcon("refresh-cw").setTooltip("Regenerate keypair (every contact must re-add you)").onClick(() => new IdentitySetupModal(this.app, plugin, "regenerate").open())
            );
          }
        }
      ]
    };
    return [identity, security, appearance, storage, notifications, contacts, om2];
  }
};

// src/send-modal.ts
var import_obsidian7 = require("obsidian");
function recipientHint(to, status) {
  if (!to) return { tone: "info", text: "" };
  if (!ADDRESS_RE.test(to)) {
    return {
      tone: "error",
      text: "Addresses are slugs \u2014 letters, digits, dots, dashes, underscores. No spaces or @."
    };
  }
  if (isReservedAddress(to)) {
    return {
      tone: "warn",
      text: `\u201C${to}\u201D is reserved \u2014 nobody can register it, so mail sent here is never read.`
    };
  }
  if (!status) return { tone: "info", text: "" };
  if (status.self) {
    return { tone: "ok", text: "Your own inbox \u2014 the mail stays on this vault." };
  }
  if (status.confirmed) {
    return {
      tone: "ok",
      text: "Reads on this bus \u2014 mail from them has arrived here, or they publish receipts."
    };
  }
  return {
    tone: "warn",
    text: `No confirmed reader for \u201C${to}\u201D on this bus. The message files locally \u2014 it arrives only if both sides share one synced mail folder (Settings \u2192 Messenger \u2192 storage), or you connect by invite code (Settings \u2192 Messenger \u2192 Cross-vault mail).`
  };
}
var SendMessageModal = class extends import_obsidian7.Modal {
  constructor(app, onSend, listAddresses, recipientStatus) {
    super(app);
    this.onSend = onSend;
    this.listAddresses = listAddresses;
    this.recipientStatus = recipientStatus;
    this.to = "";
    this.body = "";
    this.sending = false;
    this.toInputEl = null;
    this.hintEl = null;
    this.sendBtnEl = null;
    /** Last hint tone — error shape blocks Send until fixed. */
    this.toInvalid = false;
    /** Ignores stale async status checks when the address changes mid-flight. */
    this.checkToken = 0;
  }
  onOpen() {
    this.titleEl.setText("New message");
    new import_obsidian7.Setting(this.contentEl).setName("To").setDesc("Address on this vault's bus").addText((text) => {
      text.setPlaceholder("address, e.g. curtis");
      text.onChange((value) => {
        this.to = value.trim();
        void this.refreshHint();
      });
      text.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") void this.trySend();
      });
      this.toInputEl = text.inputEl;
    }).addExtraButton((btn) => {
      if (!this.listAddresses) return;
      btn.setIcon("list").setTooltip("Pick an address").onClick(() => void this.pickAddress());
    });
    this.hintEl = this.contentEl.createDiv({ cls: "messenger-send-hint" });
    const textarea = this.contentEl.createEl("textarea", {
      cls: "messenger-body",
      attr: { placeholder: "Message body (markdown)", rows: "8" }
    });
    textarea.addEventListener("input", () => this.body = textarea.value);
    textarea.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") void this.trySend();
    });
    new import_obsidian7.Setting(this.contentEl).addButton((button) => {
      button.setCta().setButtonText("Send").onClick(() => void this.trySend());
      this.sendBtnEl = button.buttonEl;
    });
    void this.refreshHint();
  }
  /**
   * Registry + existing inboxes, so the main typo-to-nowhere path is gone —
   * and the live hint answers the question the picker can't: does anyone on
   * this bus actually read this address?
   */
  async pickAddress() {
    if (!this.listAddresses) return;
    let entries;
    try {
      entries = await this.listAddresses();
    } catch {
      return;
    }
    if (entries.length === 0) {
      new import_obsidian7.Notice("No addresses on this bus yet");
      return;
    }
    new AddressSuggestModal(this.app, entries, (address) => {
      this.to = address;
      if (this.toInputEl) this.toInputEl.value = address;
      void this.refreshHint();
    }).open();
  }
  async refreshHint() {
    const token = ++this.checkToken;
    const addr = this.to;
    let status = null;
    if (addr && ADDRESS_RE.test(addr) && this.recipientStatus) {
      try {
        status = await this.recipientStatus(addr);
      } catch {
        status = null;
      }
    }
    if (token !== this.checkToken) return;
    const hint = recipientHint(addr, status);
    this.toInvalid = hint.tone === "error";
    this.sendBtnEl?.toggleClass("is-disabled", this.toInvalid);
    if (this.hintEl) {
      this.hintEl.removeClass("is-info", "is-ok", "is-warn", "is-error");
      this.hintEl.setText(hint.text);
      this.hintEl.addClass(`is-${hint.tone}`);
    }
  }
  async trySend() {
    if (this.sending) return;
    if (!this.to || !this.body.trim()) {
      new import_obsidian7.Notice("Need a recipient and a body");
      return;
    }
    if (this.toInvalid) {
      new import_obsidian7.Notice("That's not a valid address \u2014 see the note under the To field");
      return;
    }
    this.sending = true;
    try {
      await this.onSend(this.to, this.body);
      this.close();
    } catch (err) {
      new import_obsidian7.Notice(`Send failed: ${err instanceof Error ? err.message : String(err)}`);
      this.sending = false;
    }
  }
};
var AddressSuggestModal = class extends import_obsidian7.FuzzySuggestModal {
  constructor(app, entries, onPick) {
    super(app);
    this.entries = entries;
    this.onPick = onPick;
    this.setPlaceholder("Pick an address\u2026");
  }
  getItems() {
    return this.entries;
  }
  getItemText(entry) {
    return entry.name === entry.address ? entry.address : `${entry.name} (${entry.address})`;
  }
  renderSuggestion(match, el) {
    el.setText(this.getItemText(match.item));
  }
  onChooseItem(entry) {
    this.onPick(entry.address);
  }
};

// src/search.ts
var import_obsidian8 = require("obsidian");
var MessageSearchModal = class extends import_obsidian8.FuzzySuggestModal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.hits = [];
    this.setPlaceholder("Search messages\u2026");
  }
  async onOpen() {
    await this.collect();
    await super.onOpen();
  }
  async collect() {
    const me = this.plugin.settings.address;
    const [addresses, registry] = await Promise.all([
      this.plugin.store.listAddresses(),
      this.plugin.store.readRegistry()
    ]);
    const names = new Map(registry.map((r) => [r.address, r.name]));
    const perAddress = await Promise.all(
      addresses.map(async (address) => {
        if (this.plugin.isPeerLocked(address)) return [];
        return (await this.plugin.bus.loadConversation(me, address)).filter(
          (m) => !m.encLocked
        );
      })
    );
    this.hits = perAddress.flatMap((messages, i) => {
      const address = addresses[i];
      const name = names.get(address) ?? address;
      return messages.map((envelope) => ({ envelope, peer: address, name }));
    });
  }
  getItems() {
    return this.hits;
  }
  getItemText(hit) {
    return `${hit.name} ${oneLine(hit.envelope.body, 120)}`;
  }
  renderSuggestion(match, el) {
    const hit = match.item;
    el.addClass("messenger-search-hit");
    const top = el.createDiv({ cls: "messenger-search-hit-top" });
    top.createDiv(
      { cls: "messenger-search-hit-name" },
      (n) => n.setText(`${hit.name} \xB7 ${new Date(hit.envelope.ts).toLocaleString()}`)
    );
    const snippet = el.createDiv({ cls: "messenger-search-hit-body" });
    (0, import_obsidian8.setIcon)(snippet.createSpan({ cls: "messenger-search-hit-icon" }), hit.envelope.from === this.plugin.settings.address ? "corner-up-right" : "corner-up-left");
    snippet.createSpan({ text: oneLine(hit.envelope.body, 140) });
  }
  onChooseItem(hit) {
    void this.plugin.openChatToMessage(hit.peer, hit.envelope.id);
  }
};
var oneLine = (body, max) => {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}\u2026` : flat;
};

// src/onboarding-modal.ts
var import_obsidian9 = require("obsidian");
var OnboardingModal = class extends import_obsidian9.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.displayName = "";
    this.passcode = "";
    this.confirm = "";
    this.encrypt = true;
    this.saved = false;
    this.saving = false;
    this.ctaEl = null;
    this.hintEl = null;
    this.passcodeHintEl = null;
    /** Ignores stale async checks when the address changes faster than disk. */
    this.checkToken = 0;
    /** Optional cross-vault mail (OM-2): off until toggled, needs a relay URL. */
    this.om2Enabled = false;
    this.om2Relay = "";
    this.om2RelayEl = null;
    this.address = plugin.settings.address;
  }
  onOpen() {
    this.modalEl.addClass("messenger-onboard");
    this.titleEl.setText("Welcome to Messenger");
    this.contentEl.createDiv(
      { cls: "messenger-onboard-lede" },
      (el) => el.setText(
        "Pick the address this vault knows you by. Messages are markdown notes inside your vault \u2014 nothing leaves it unless you later share the mail folder or turn on cross-vault mail."
      )
    );
    new import_obsidian9.Setting(this.contentEl).setName("Your address").setDesc("Slug-like: letters, digits, dots, dashes, underscores.").addText((text) => {
      text.setValue(this.address).onChange((value) => {
        this.address = value.trim();
        void this.validate();
      });
      text.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") void this.trySave();
      });
    });
    new import_obsidian9.Setting(this.contentEl).setName("Display name").setDesc("Optional \u2014 shown in conversation lists instead of the raw address.").addText(
      (text) => text.setPlaceholder(this.address).setValue(this.plugin.settings.displayName).onChange((value) => this.displayName = value.trim())
    );
    const passcodeDesc = () => this.encrypt ? `Required \u2014 locks Messenger on startup, and with encryption on it also derives the encryption key, so it must hold up to guessing: at least ${ENCRYPTION_PASSCODE_MIN} characters, not digits-only.` : `Required \u2014 locks Messenger on startup and any conversation you lock. At least ${PASSCODE_MIN} characters. It guards the app, not the files: mail stays plain markdown in the vault.`;
    const passcodeSetting = new import_obsidian9.Setting(this.contentEl).setName("Passcode");
    passcodeSetting.descEl.setText(passcodeDesc());
    passcodeSetting.addText((text) => {
      text.inputEl.type = "password";
      text.inputEl.autocomplete = "new-password";
      text.onChange((value) => {
        this.passcode = value;
        void this.validate();
      });
    });
    new import_obsidian9.Setting(this.contentEl).setName("Confirm passcode").addText((text) => {
      text.inputEl.type = "password";
      text.inputEl.autocomplete = "new-password";
      text.onChange((value) => {
        this.confirm = value;
        void this.validate();
      });
      text.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") void this.trySave();
      });
    });
    this.passcodeHintEl = this.contentEl.createDiv({ cls: "messenger-onboard-hint" });
    this.hintEl = this.contentEl.createDiv({ cls: "messenger-onboard-hint" });
    new import_obsidian9.Setting(this.contentEl).setName("Encrypt messages").setDesc(
      "Recommended \u2014 store message bodies as ciphertext keyed by your passcode, readable only in Messenger after unlocking. You can turn this off later in Settings."
    ).addToggle(
      (toggle) => toggle.setValue(this.encrypt).onChange((value) => {
        this.encrypt = value;
        passcodeSetting.descEl.setText(passcodeDesc());
        void this.validate();
      })
    );
    new import_obsidian9.Setting(this.contentEl).setName("Add contacts").setDesc(
      "Optional \u2014 from this device's contacts, a .vcf file, or by hand. Invitations turn mutual when they reply. Skip freely; the people-plus button in the chat does this anytime."
    ).addButton(
      (button) => button.setButtonText("Add contacts\u2026").onClick(() => new AddContactModal(this.app, this.plugin).open())
    );
    new import_obsidian9.Setting(this.contentEl).setName("Cross-vault mail").setDesc(
      "Optional \u2014 end-to-end-encrypted messaging to vaults that share nothing with this one, through a relay (a dumb mailbox for sealed boxes it cannot read). Self-host later with `npm run relay`; skip freely."
    ).addToggle(
      (toggle) => toggle.setValue(this.om2Enabled).onChange((value) => {
        this.om2Enabled = value;
        if (this.om2RelayEl) this.om2RelayEl.style.display = value ? "" : "none";
      })
    );
    const om2Wrap = this.contentEl.createDiv({ cls: "messenger-onboard-om2" });
    if (!this.om2Enabled) om2Wrap.style.display = "none";
    this.om2RelayEl = om2Wrap;
    new import_obsidian9.Setting(om2Wrap).setName("Relay URL").setDesc("Where your sealed mail waits \u2014 e.g. http://127.0.0.1:7788 for a local relay.").addText((text) => {
      text.setPlaceholder("https://relay.example.com");
      text.setValue(this.om2Relay);
      text.onChange((value) => this.om2Relay = value.trim().replace(/\/+$/, ""));
    });
    if (this.plugin.store.hidden && this.plugin.syncEnabled()) {
      this.contentEl.createDiv(
        { cls: "messenger-onboard-hint is-warn" },
        (el) => el.setText(
          "Obsidian Sync doesn't carry hidden folders \u2014 turn off \u201CHide mail storage\u201D in Settings \u2192 Messenger so your mail follows you between devices."
        )
      );
    }
    new import_obsidian9.Setting(this.contentEl).addButton((button) => {
      button.setCta().setButtonText("Start chatting").onClick(() => void this.trySave());
      this.ctaEl = button.buttonEl;
    });
    void this.validate();
  }
  /** Passcode fields are the gate: "" = fine, anything else explains itself. */
  passcodeProblem() {
    if (!this.passcode && !this.confirm) {
      return `Set a passcode \u2014 required to finish sign-up (min ${PASSCODE_MIN} characters).`;
    }
    if (this.encrypt ? !isStrongPasscode(this.passcode) : !isValidPasscode(this.passcode)) {
      return this.encrypt ? `At least ${ENCRYPTION_PASSCODE_MIN} characters, not digits-only \u2014 it derives the encryption key.` : `At least ${PASSCODE_MIN} characters.`;
    }
    if (this.confirm !== this.passcode) {
      return "Passcodes don't match yet.";
    }
    return "";
  }
  async trySave() {
    if (!ADDRESS_RE.test(this.address) || // a pre-existing identity keeps its name even after the list grows —
    // only *changes to* a reserved name refuse (SPEC §2 grandfathering)
    isReservedAddress(this.address) && this.address !== this.plugin.settings.address || this.passcodeProblem() !== "" || this.saving) {
      return;
    }
    if (this.om2Enabled && !/^https?:\/\//.test(this.om2Relay)) {
      this.om2Enabled = false;
    }
    this.saving = true;
    try {
      await this.plugin.completeOnboarding(
        this.address,
        this.displayName,
        this.passcode.trim(),
        this.encrypt,
        this.om2Enabled ? { relayUrl: this.om2Relay } : void 0
      );
      this.saved = true;
      this.close();
    } catch (err) {
      new import_obsidian9.Notice(`Couldn't save: ${err instanceof Error ? err.message : String(err)}`);
      this.saving = false;
    }
  }
  async validate() {
    const token = ++this.checkToken;
    const addr = this.address;
    const valid = ADDRESS_RE.test(addr);
    const reserved = isReservedAddress(addr) && addr !== this.plugin.settings.address;
    const problem = this.passcodeProblem();
    if (this.ctaEl) this.ctaEl.disabled = !valid || reserved || problem !== "";
    if (this.passcodeHintEl) this.passcodeHintEl.setText(problem);
    let message = "";
    let warn = false;
    if (!addr) {
      message = "Pick an address \u2014 it's how this vault reaches you.";
    } else if (!valid) {
      message = "Letters, digits, dots, dashes, underscores \u2014 up to 64 characters.";
    } else if (reserved) {
      message = `\u201C${addr}\u201D is reserved \u2014 no one can register it, so no mail can arrive looking official under it.`;
    } else {
      let count = 0;
      try {
        count = (await this.plugin.store.readInbox(addr)).length;
      } catch {
      }
      if (token !== this.checkToken) return;
      if (count > 0) {
        warn = true;
        message = addr === this.plugin.settings.address ? `You have ${count} message${count === 1 ? "" : "s"} here already.` : `\u201C${addr}\u201D already has ${count} message${count === 1 ? "" : "s"} on this bus \u2014 you'll continue that identity.`;
      }
    }
    if (this.hintEl) {
      this.hintEl.setText(message);
      this.hintEl.toggleClass("is-warn", warn);
    }
  }
  onClose() {
    if (this.saved) return;
    void this.plugin.dismissOnboarding();
  }
};

// src/chat-view.ts
var import_obsidian12 = require("obsidian");

// src/audio.ts
var ctx = null;
function context() {
  try {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}
function blip(c, freq, delaySec, durSec, peak) {
  const t0 = c.currentTime + delaySec;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(1e-4, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(1e-4, t0 + durSec);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + durSec + 0.05);
}
function withContext(fn) {
  const c = context();
  if (!c || c.state !== "running") {
    void c?.resume().then(() => {
      if (c.state === "running") fn(c);
    });
    return;
  }
  fn(c);
}
function playReceiveSound() {
  withContext((c) => {
    blip(c, 880, 0, 0.14, 0.07);
    blip(c, 1244.5, 0.09, 0.18, 0.06);
  });
}
function playSendSound() {
  withContext((c) => {
    blip(c, 660, 0, 0.07, 0.04);
  });
}

// src/appearance/emoji.ts
var import_obsidian10 = require("obsidian");

// src/appearance/emoji-data.ts
var EMOJI_DATA = `
# Smileys & emotion
\u{1F600} grinning grin happy
\u{1F603} smiley happy
\u{1F604} smile happy open_mouth
\u{1F601} beaming grin
\u{1F606} laughing squint laugh
\u{1F605} sweat_laugh nervous relieved
\u{1F923} rofl rolling laugh
\u{1F602} joy tears laugh cry
\u{1F642} slight_smile
\u{1F643} upside_down silly
\u{1F609} wink
\u{1F60A} blush happy pleased
\u{1F60B} yum tasty
\u{1F61B} stuck_out_tongue razz
\u{1F61C} wink_tongue crazy
\u{1F92A} zany goofy wild
\u{1F928} raised_eyebrow suspicious
\u{1F9D0} monocle inspect
\u{1F60E} sunglasses cool
\u{1F913} nerd glasses
\u{1F973} partying celebrate
\u{1F60F} smirk smug
\u{1F612} unamused meh bored
\u{1F61E} disappointed sad
\u{1F614} pensive sad
\u{1F61F} worried
\u{1F615} confused
\u{1F641} frown sad
\u2639\uFE0F frowning sad
\u{1F623} persevere
\u{1F616} confounded
\u{1F62B} weary tired
\u{1F629} anguish
\u{1F622} cry tear sad
\u{1F62D} sob cry sad
\u{1F624} triumph huff steam
\u{1F620} angry mad
\u{1F621} rage angry
\u{1F92C} cursing swearing
\u{1F608} smiling_devil devil mischief
\u{1F47F} imp devil angry
\u{1F480} skull dead
\u2620\uFE0F skull_crossbones danger poison
\u{1F4A9} poop hankey
\u{1F921} clown
\u{1F47B} ghost spooky
\u{1F47D} alien ufo
\u{1F916} robot bot
\u{1F633} flushed embarrassed
\u{1F975} hot heat
\u{1F976} cold freezing
\u{1F628} fearful scared
\u{1F630} anxious nervous
\u{1F631} scream fear shock
\u{1F635} dizzy knocked_out
\u{1F92F} mind_blown exploding
\u{1F974} woozy drunk
\u{1F634} sleeping zzz
\u{1F62A} sleepy tired
\u{1F922} nauseated sick green
\u{1F92E} vomiting sick
\u{1F927} sneeze
\u{1F912} thermometer fever
\u{1F915} hurt injured
\u{1F637} mask medical sick
\u{1F97A} pleading puppy_eyes
\u{1F917} hug comfort
\u{1F914} thinking hmm
\u{1F92D} oops giggle
\u{1F92B} shush quiet secret
\u{1F925} lying pinocchio
\u{1F610} neutral_face
\u{1F636} no_mouth silent
\u{1F607} innocent halo angel
# People & gestures
\u{1F44B} wave hello goodbye
\u{1F91A} raised_back_hand
\u270B raised_hand stop
\u{1F596} vulcan spock
\u{1F44C} ok pinched
\u{1F90C} pinched_fingers italian
\u{1F90F} pinch tiny
\u270C\uFE0F victory peace
\u{1F91E} crossed_fingers luck
\u{1F91F} love_you
\u{1F918} rock_on horns metal
\u{1F919} call_me shaka
\u{1F448} point_left
\u{1F449} point_right
\u{1F446} point_up
\u{1F447} point_down
\u261D\uFE0F index_up
\u{1F44D} +1 thumbs_up yes like
\u{1F44E} -1 thumbs_down no dislike
\u270A fist power
\u{1F44A} punch fist_bump
\u{1F91B} left_fist
\u{1F91C} right_fist
\u{1F44F} clap applause
\u{1F64C} raised_hands celebrate
\u{1F450} open_hands
\u{1F932} palms_up
\u{1F91D} handshake deal
\u{1F64F} pray thanks please
\u270D\uFE0F writing hand_write
\u{1F485} nail_polish manicure
\u{1F933} selfie
\u{1F4AA} muscle flex strong
\u{1F9E0} brain smart mind
\u{1F440} eyes look watch
\u{1F441}\uFE0F eye
\u{1F442} ear
\u{1F443} nose
\u{1F445} tongue
\u{1F444} lips mouth
\u{1F9B7} tooth
\u{1F463} footprints steps
\u{1F5E3}\uFE0F speaking_head announce
\u{1F9D1} person
\u{1F476} baby
\u{1F9D3} older
\u{1F3C3} running run
\u{1F6B6} walking
\u{1F9CE} kneeling
\u{1F483} dancer dance
\u{1F57A} disco dance
\u{1F46F} party_people bunny
\u{1F9D8} meditation yoga zen
\u{1F6C0} bath
\u{1F9D9} mage wizard
\u{1F9DA} fairy
\u{1F9DB} vampire
\u{1F9DF} zombie
\u{1F9DE} genie
\u{1F9DC} merperson
\u{1F977} ninja
\u{1F9B8} superhero
\u{1F9B9} supervillain
# Hearts
\u2764\uFE0F red_heart love
\u{1F9E1} orange_heart
\u{1F49B} yellow_heart
\u{1F49A} green_heart
\u{1F499} blue_heart
\u{1F49C} purple_heart
\u{1F5A4} black_heart
\u{1F90D} white_heart
\u{1F90E} brown_heart
\u{1F494} broken_heart heartbreak
\u2763\uFE0F heart_exclamation
\u{1F495} two_hearts
\u{1F49E} revolving_hearts
\u{1F493} beating_heart
\u{1F497} growing_heart
\u{1F496} sparkling_heart
\u{1F498} heart_arrow cupid
\u{1F49D} heart_ribbon
\u{1F49F} heart_decoration
\u{1F48B} kiss_mark lipstick
# Animals & nature
\u{1F436} dog puppy
\u{1F431} cat kitten
\u{1F42D} mouse
\u{1F439} hamster
\u{1F430} rabbit bunny
\u{1F98A} fox
\u{1F43B} bear
\u{1F43C} panda
\u{1F428} koala
\u{1F42F} tiger
\u{1F981} lion
\u{1F42E} cow
\u{1F437} pig
\u{1F438} frog
\u{1F435} monkey
\u{1F648} see_no_evil
\u{1F649} hear_no_evil
\u{1F64A} speak_no_evil
\u{1F414} chicken
\u{1F427} penguin
\u{1F426} bird
\u{1F986} duck
\u{1F985} eagle
\u{1F989} owl
\u{1F987} bat
\u{1F43A} wolf
\u{1F434} horse
\u{1F984} unicorn
\u{1F41D} bee
\u{1F41B} bug caterpillar
\u{1F98B} butterfly
\u{1F40C} snail
\u{1F41E} ladybug
\u{1F41C} ant
\u{1F577}\uFE0F spider
\u{1F982} scorpion
\u{1F422} turtle
\u{1F40D} snake
\u{1F98E} lizard
\u{1F419} octopus
\u{1F991} squid
\u{1F990} shrimp
\u{1F980} crab
\u{1F421} blowfish
\u{1F420} tropical_fish
\u{1F41F} fish
\u{1F42C} dolphin
\u{1F433} spouting_whale
\u{1F40B} whale
\u{1F988} shark
\u{1F40A} crocodile
\u{1F993} zebra
\u{1F992} giraffe
\u{1F418} elephant
\u{1F98F} rhinoceros
\u{1F42A} camel
\u{1F9A5} sloth
\u{1F994} hedgehog
\u{1F43E} paw_prints
\u{1F335} cactus
\u{1F384} christmas_tree
\u{1F332} evergreen_tree
\u{1F333} tree
\u{1F334} palm_tree
\u{1F331} seedling
\u{1F33F} herb
\u2618\uFE0F shamrock
\u{1F340} four_leaf_clover lucky
\u{1F337} tulip
\u{1F339} rose
\u{1F33B} sunflower
\u{1F33C} blossom
\u{1F338} cherry_blossom
\u{1F33A} hibiscus
\u{1F4AE} white_flower
\u{1F30D} earth_europe
\u{1F30E} earth_americas
\u{1F30F} earth_asia
\u{1F319} crescent_moon
\u{1F315} full_moon
\u{1F31A} new_moon_face
\u{1F31D} full_moon_face
\u2B50 star
\u{1F31F} glowing_star
\u2728 sparkles magic
\u{1F320} shooting_star wish
\u26A1 lightning zap
\u{1F525} fire flame lit
\u{1F4A7} droplet water
\u{1F30A} ocean wave
\u2744\uFE0F snowflake cold
\u26C4 snowman
\u2600\uFE0F sun sunny
\u{1F308} rainbow
\u26C5 partly_cloudy
\u2601\uFE0F cloud
\u{1F32A}\uFE0F tornado
# Food & drink
\u{1F34F} green_apple
\u{1F34E} apple
\u{1F350} pear
\u{1F34A} tangerine orange
\u{1F34B} lemon
\u{1F34C} banana
\u{1F349} watermelon
\u{1F347} grapes
\u{1F353} strawberry
\u{1FAD0} blueberries
\u{1F352} cherries
\u{1F351} peach
\u{1F96D} mango
\u{1F34D} pineapple
\u{1F965} coconut
\u{1F95D} kiwi
\u{1F345} tomato
\u{1F951} avocado
\u{1F346} eggplant
\u{1F955} carrot
\u{1F33D} corn
\u{1F336}\uFE0F hot_pepper spicy
\u{1F954} potato
\u{1F9C4} garlic
\u{1F9C5} onion
\u{1F344} mushroom
\u{1F95C} peanuts
\u{1F330} chestnut
\u{1F35E} bread
\u{1F950} croissant
\u{1F956} baguette
\u{1F968} pretzel
\u{1F9C0} cheese
\u{1F95A} egg
\u{1F373} cooking fried_egg
\u{1F95E} pancakes
\u{1F9C7} waffle
\u{1F953} bacon
\u{1F356} meat_on_bone
\u{1F357} poultry_leg
\u{1F354} hamburger burger
\u{1F35F} fries
\u{1F355} pizza
\u{1F32D} hotdog
\u{1F96A} sandwich
\u{1F32E} taco
\u{1F32F} burrito
\u{1F957} salad
\u{1F35D} spaghetti pasta
\u{1F35C} ramen noodles
\u{1F363} sushi
\u{1F371} bento
\u{1F364} fried_shrimp
\u{1F35A} rice
\u{1F35B} curry
\u{1F372} stew
\u{1F963} bowl_with_spoon
\u{1F366} soft_serve
\u{1F367} shaved_ice
\u{1F368} ice_cream
\u{1F369} doughnut donut
\u{1F36A} cookie
\u{1F382} birthday_cake
\u{1F370} cake shortcake
\u{1F9C1} cupcake
\u{1F967} pie
\u{1F36B} chocolate_bar
\u{1F36C} candy sweet
\u{1F36D} lollipop
\u{1F36F} honey_pot
\u{1F37C} baby_bottle
\u{1F95B} milk
\u2615 coffee
\u{1F375} tea
\u{1F376} sake
\u{1F37E} champagne
\u{1F377} wine
\u{1F378} cocktail martini
\u{1F379} tiki_drink
\u{1F37A} beer
\u{1F37B} beer_clink cheers
\u{1F964} cup_with_straw soda
\u{1F9CB} bubble_tea
\u{1F9CA} ice_cube
# Activity
\u26BD soccer football
\u{1F3C0} basketball
\u{1F3C8} american_football
\u26BE baseball
\u{1F3BE} tennis
\u{1F3D0} volleyball
\u{1F94F} frisbee
\u{1F3B1} pool 8ball
\u{1F3D3} ping_pong
\u{1F3F8} badminton
\u{1F94A} boxing_glove
\u{1F94B} martial_arts
\u{1F3C6} trophy win champion
\u{1F947} gold_medal first
\u{1F948} silver_medal second
\u{1F949} bronze_medal third
\u{1F3AF} dart bullseye target
\u{1F3B3} bowling
\u{1F3AE} video_game controller gaming
\u{1F579}\uFE0F joystick arcade
\u{1F3B2} dice game
\u{1F9E9} puzzle
\u{1F3A8} art palette painting
\u{1F3AD} theater masks
\u{1F3AA} circus
\u{1F3A4} microphone karaoke
\u{1F3A7} headphones music
\u{1F3B5} musical_note
\u{1F3B6} musical_notes
\u{1F3B8} guitar
\u{1F3B9} piano keyboard
\u{1F3BA} trumpet
\u{1F3BB} violin
\u{1F941} drum
\u{1F3AC} clapper movie film
\u{1F3F9} bow_and_arrow archery
\u{1F3BF} skis
\u{1F3C2} snowboard
\u{1F6B4} cycling bike
\u{1F3CA} swimming
\u{1F6F9} skateboard
\u{1F380} ribbon bow
\u{1F381} gift present birthday
\u{1F388} balloon party
\u{1F389} tada celebrate congrats
\u{1F38A} confetti_ball celebrate
\u{1F387} sparkler
\u{1F386} fireworks
# Travel & places
\u{1F697} car
\u{1F695} taxi
\u{1F68C} bus
\u{1F3CE}\uFE0F race_car
\u{1F693} police_car
\u{1F691} ambulance
\u{1F692} fire_engine
\u{1F69A} truck
\u{1F69C} tractor
\u{1F6B2} bicycle bike
\u{1F6F5} scooter
\u{1F3CD}\uFE0F motorcycle
\u2708\uFE0F airplane plane flight
\u{1F680} rocket launch
\u{1F6F8} ufo flying_saucer
\u{1F681} helicopter
\u{1F682} locomotive train
\u{1F686} train
\u{1F68A} tram
\u26F5 sailboat
\u{1F6A4} speedboat
\u2693 anchor
\u{1F5FA}\uFE0F world_map
\u{1F9ED} compass
\u{1F3D4}\uFE0F mountain_snow
\u26F0\uFE0F mountain
\u{1F30B} volcano
\u{1F3D5}\uFE0F camping
\u{1F3D6}\uFE0F beach
\u{1F3DC}\uFE0F desert
\u{1F3DD}\uFE0F island
\u{1F3A1} ferris_wheel
\u{1F3A2} roller_coaster
\u{1F3A0} carousel
\u26F2 fountain
\u{1F3DB}\uFE0F classical_building
\u{1F3D7}\uFE0F construction
\u{1F3E0} house home
\u{1F3E1} house_garden
\u{1F3E2} office_building
\u{1F3E5} hospital
\u{1F3E6} bank
\u{1F3E8} hotel
\u{1F3EB} school
\u{1F303} night_stars
\u{1F306} city_dusk
\u{1F307} city_sunset
\u{1F309} night_bridge
\u{1F6A6} traffic_light
\u{1F6D1} stop_sign
# Objects
\u231A watch time
\u{1F4F1} phone mobile smartphone
\u{1F4BB} laptop
\u2328\uFE0F keyboard
\u{1F5A5}\uFE0F computer desktop
\u{1F5A8}\uFE0F printer
\u{1F5B1}\uFE0F computer_mouse
\u{1F4BE} floppy_disk save
\u{1F4BF} cd
\u{1F4C0} dvd
\u{1F3A5} movie_camera
\u{1F4F7} camera photo
\u{1F4F8} camera_flash
\u{1F4F9} video_camera
\u{1F50D} mag search
\u{1F56F}\uFE0F candle
\u{1F4A1} bulb idea
\u{1F526} flashlight torch
\u{1F3EE} lantern
\u{1F4D6} open_book read
\u{1F4DA} books library
\u{1F4D3} notebook
\u{1F4DC} scroll
\u{1F4F0} newspaper news
\u{1F4CE} paperclip attachment
\u2702\uFE0F scissors cut
\u{1F4D0} triangular_ruler
\u{1F4CF} ruler
\u{1F512} lock locked secure
\u{1F513} unlock
\u{1F511} key
\u{1F5DD}\uFE0F old_key
\u{1F528} hammer
\u{1FA93} axe
\u26CF\uFE0F pick
\u{1F527} wrench fix
\u{1F529} bolt nut
\u2699\uFE0F gear settings
\u{1F9F0} toolbox
\u{1F9F2} magnet
\u{1F9EA} test_tube science
\u{1F9EC} dna
\u{1F52C} microscope science
\u{1F52D} telescope space
\u{1F489} syringe vaccine shot
\u{1F48A} pill medicine
\u{1FA79} bandaid
\u{1F6AA} door
\u{1F6CF}\uFE0F bed sleep
\u{1F6CB}\uFE0F couch sofa
\u{1F6BD} toilet
\u{1F6BF} shower
\u{1F6C1} bathtub
\u{1F9F9} broom sweep
\u{1F9FA} basket
\u{1F6D2} shopping_cart
\u{1F4B0} money_bag
\u{1F4B5} dollar money
\u{1F4B3} credit_card payment
\u{1F4C8} chart_up
\u{1F4C9} chart_down
\u{1F4CA} bar_chart
\u{1F4C5} calendar
\u23F0 alarm_clock morning
\u23F3 hourglass time
\u{1F4E1} satellite signal
\u{1F50B} battery
\u{1F50C} plug
\u{1F4FA} tv television
\u{1F4FB} radio
\u{1F399}\uFE0F studio_mic podcast
\u{1F514} bell notification
\u{1F515} bell_mute
\u{1F4E2} loudspeaker announcement
\u{1F4E3} megaphone cheer
\u{1F4EE} postbox
\u{1F4ED} mailbox_empty
\u2709\uFE0F envelope mail letter
\u{1F4E6} package parcel
\u{1F58A}\uFE0F pen
\u{1F58C}\uFE0F paintbrush
\u{1F4DD} memo note write
# Symbols
\u267B\uFE0F recycle
\u{1F531} trident
\u{1F4DB} name_badge
\u2B55 circle
\u2705 white_check_mark yes done
\u2611\uFE0F checkbox_with_check
\u2714\uFE0F check_mark
\u274C cross no wrong
\u274E x_button
\u2795 plus
\u2796 minus
\u2797 divide
\u2716\uFE0F multiply
\u{1F4AF} hundred perfect score
\u2660\uFE0F spades cards
\u2665\uFE0F heart_suit cards
\u2666\uFE0F diamonds cards
\u2663\uFE0F clubs cards
\u2B05\uFE0F arrow_left
\u27A1\uFE0F arrow_right
\u2B06\uFE0F arrow_up
\u2B07\uFE0F arrow_down
\u2197\uFE0F arrow_upper_right
\u2198\uFE0F arrow_lower_right
\u21A9\uFE0F arrow_left_hook reply
\u21AA\uFE0F arrow_right_hook forward
\u{1F501} repeat loop
\u{1F504} refresh sync
\u23E9 fast_forward
\u23EA rewind
\u25B6\uFE0F play
\u23F8\uFE0F pause
\u23F9\uFE0F stop
\u{1F500} shuffle random
\u{1F50A} speaker volume
\u{1F507} mute sound_off
\u{1F4F6} signal bars
\u26A0\uFE0F warning caution
\u{1F6AB} prohibited blocked
\u26D4 no_entry
\u2753 question
\u2757 exclamation
\u2049\uFE0F interrobang
\u{1F197} ok_button
\u{1F195} new
\u{1F51D} top
\u{1F51C} soon
\u27B0 curly_loop
\u3030\uFE0F wavy_dash
\xA9\uFE0F copyright
\xAE\uFE0F registered
\u2122\uFE0F tm trademark
\u{1F534} red_circle
\u{1F7E2} green_circle
\u{1F535} blue_circle
\u{1F7E1} yellow_circle
\u{1F7E3} purple_circle
\u{1F7E5} red_square
\u{1F7E9} green_square
\u{1F7E6} blue_square
\u{1F7E8} yellow_square
\u{1F7EA} purple_square
\u{1F4A4} zzz sleep
`;
var EMOJI_CATEGORIES = [
  { id: "smileys", name: "Smileys & emotion" },
  { id: "people", name: "People & gestures" },
  { id: "hearts", name: "Hearts" },
  { id: "nature", name: "Animals & nature" },
  { id: "food", name: "Food & drink" },
  { id: "activity", name: "Activity" },
  { id: "travel", name: "Travel & places" },
  { id: "objects", name: "Objects" },
  { id: "symbols", name: "Symbols" }
];

// src/appearance/emoji.ts
var SHORTCODE_QUERY = /:([a-zA-Z0-9_+-]{2,})$/;
var AC_MAX = 8;
var RECENTS_MAX = 16;
var SEARCH_MAX = 80;
function parseEmojiData() {
  const ids = new Map(EMOJI_CATEGORIES.map((c) => [c.name, c.id]));
  const out = [];
  let category = EMOJI_CATEGORIES[0]?.id ?? "";
  for (const raw of EMOJI_DATA.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      category = ids.get(line.slice(1).trim()) ?? category;
      continue;
    }
    const parts = line.split(/\s+/);
    if (parts.length < 2 || !parts[0] || !parts[1]) continue;
    out.push({
      emoji: parts[0],
      name: parts[1],
      keywords: parts.slice(2),
      category
    });
  }
  return out;
}
var EMOJIS = parseEmojiData();
var SHORTCODES = new Map(
  EMOJIS.map((e) => [e.name, e.emoji])
);
var BY_CHAR = new Map(EMOJIS.map((e) => [e.emoji, e]));
var BY_CATEGORY = /* @__PURE__ */ new Map();
for (const e of EMOJIS) {
  const list = BY_CATEGORY.get(e.category);
  if (list) list.push(e);
  else BY_CATEGORY.set(e.category, [e]);
}
function searchEmoji(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const exact = [];
  const prefix = [];
  const rest = [];
  for (const e of EMOJIS) {
    if (e.name === q) exact.push(e);
    else if (e.name.startsWith(q)) prefix.push(e);
    else if (e.name.includes(q) || e.keywords.some((k) => k.startsWith(q) || k.includes(q))) {
      rest.push(e);
    }
  }
  return [...exact, ...prefix, ...rest];
}
function attachEmojiComposer(row, textarea, hooks) {
  if (row.querySelector(":scope > .messenger-emoji-toggle")) return;
  const commit = (from, to, emoji) => {
    textarea.value = textarea.value.slice(0, from) + emoji + textarea.value.slice(to);
    const caret = from + emoji.length;
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    hooks.setRecents(emoji);
  };
  const toggle = row.createEl("button", {
    cls: "messenger-emoji-toggle clickable-icon",
    attr: {
      type: "button",
      "aria-label": "Emoji picker",
      "aria-expanded": "false"
    }
  });
  (0, import_obsidian10.setIcon)(toggle, "smile");
  row.insertBefore(toggle, row.firstChild);
  let acEl = null;
  let acItems = [];
  let acIndex = 0;
  const closeAc = () => {
    acEl?.remove();
    acEl = null;
    acItems = [];
    acIndex = 0;
  };
  const acceptAc = () => {
    const item = acItems[acIndex];
    const caret = textarea.selectionStart ?? textarea.value.length;
    const typed = item ? textarea.value.slice(0, caret).match(SHORTCODE_QUERY) : null;
    closeAc();
    if (!item || !typed) return;
    commit(caret - typed[0].length, caret, item.emoji);
  };
  const paintAcSelection = () => {
    acEl?.querySelectorAll(".messenger-emoji-ac-item").forEach((el, i) => {
      el.classList.toggle("is-active", i === acIndex);
    });
  };
  const renderAc = (items) => {
    if (items.length === 0) {
      closeAc();
      return;
    }
    if (!acEl) {
      acEl = row.createDiv({
        cls: "messenger-emoji-ac",
        attr: { role: "listbox" }
      });
      acEl.addEventListener("mousedown", (e) => e.preventDefault());
      acEl.addEventListener("click", (e) => {
        const hit = e.target.closest(
          ".messenger-emoji-ac-item"
        );
        const i = Number(hit?.dataset.i ?? "-1");
        if (!(i >= 0)) return;
        acIndex = i;
        acceptAc();
      });
    }
    const host = acEl;
    host.replaceChildren();
    items.forEach((item, i) => {
      const el = host.createDiv({
        cls: "messenger-emoji-ac-item",
        attr: { role: "option" }
      });
      el.dataset.i = String(i);
      el.createSpan({ cls: "messenger-emoji-ac-emoji", text: item.emoji });
      el.createSpan({
        cls: "messenger-emoji-ac-name",
        text: `:${item.name}:`
      });
    });
    acItems = items;
    acIndex = 0;
    paintAcSelection();
  };
  const onKeydownCapture = (e) => {
    if (!acEl?.isConnected || acItems.length === 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      acIndex = (acIndex + delta + acItems.length) % acItems.length;
      paintAcSelection();
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      acceptAc();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeAc();
    }
  };
  textarea.addEventListener("keydown", onKeydownCapture, true);
  textarea.addEventListener("input", () => {
    const caret = textarea.selectionStart ?? textarea.value.length;
    const typed = textarea.value.slice(0, caret).match(SHORTCODE_QUERY);
    if (typed) renderAc(searchEmoji(typed[1]).slice(0, AC_MAX));
    else closeAc();
  });
  textarea.addEventListener("blur", closeAc);
  let pop = null;
  let activeCat = EMOJI_CATEGORIES[0]?.id ?? "";
  let searchInput = null;
  let recentsEl = null;
  let bodyEl = null;
  const pick = (emoji) => {
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    commit(start, end, emoji);
    closePopover();
  };
  const renderGrid = (entries) => {
    if (!bodyEl) return;
    bodyEl.replaceChildren();
    if (entries.length === 0) {
      bodyEl.createDiv({
        cls: "messenger-emoji-empty",
        text: "No emoji match"
      });
      return;
    }
    const grid = bodyEl.createDiv({ cls: "messenger-emoji-grid" });
    for (const entry of entries) {
      const cell = grid.createEl("button", {
        cls: "messenger-emoji-cell",
        text: entry.emoji,
        attr: {
          type: "button",
          title: `:${entry.name}:`,
          "aria-label": entry.name
        }
      });
      cell.addEventListener("click", () => pick(entry.emoji));
    }
  };
  const renderRecents = () => {
    if (!recentsEl) return;
    recentsEl.replaceChildren();
    const seen = /* @__PURE__ */ new Set();
    const recents = hooks.getRecents().filter((code) => typeof code === "string").filter((code) => {
      if (seen.has(code) || !BY_CHAR.has(code)) return false;
      seen.add(code);
      return true;
    }).slice(0, RECENTS_MAX);
    recentsEl.classList.toggle("is-empty", recents.length === 0);
    recentsEl.createSpan({
      cls: "messenger-emoji-recents-label",
      text: "Recent"
    });
    for (const code of recents) {
      const cell = recentsEl.createEl("button", {
        cls: "messenger-emoji-cell",
        text: code,
        attr: {
          type: "button",
          "aria-label": BY_CHAR.get(code)?.name ?? "emoji"
        }
      });
      cell.addEventListener("click", () => pick(code));
    }
  };
  const paintTabs = () => {
    pop?.querySelectorAll(".messenger-emoji-tab").forEach((el) => {
      el.classList.toggle("is-active", el.getAttribute("data-cat") === activeCat);
    });
  };
  const showCategory = (id) => {
    activeCat = id;
    if (searchInput) searchInput.value = "";
    paintTabs();
    renderGrid(BY_CATEGORY.get(id) ?? []);
  };
  const buildPopover = () => {
    const el = createDiv({
      cls: "messenger-emoji-popover",
      attr: { role: "dialog", "aria-label": "Emoji picker" }
    });
    const search = el.createEl("input", {
      cls: "messenger-emoji-search messenger-search-input",
      type: "search",
      placeholder: "Search emoji\u2026",
      attr: { "aria-label": "Search emoji" }
    });
    search.addEventListener("input", () => {
      const q = search.value.trim();
      renderGrid(
        q ? searchEmoji(q).slice(0, SEARCH_MAX) : BY_CATEGORY.get(activeCat) ?? []
      );
    });
    searchInput = search;
    const tabs = el.createDiv({ cls: "messenger-emoji-tabs" });
    for (const cat of EMOJI_CATEGORIES) {
      const tab = tabs.createEl("button", {
        cls: "messenger-emoji-tab",
        // the tab glyph is the section's first emoji, so it can never drift
        text: BY_CATEGORY.get(cat.id)?.[0]?.emoji ?? "\u2022",
        attr: {
          type: "button",
          title: cat.name,
          "aria-label": cat.name
        }
      });
      tab.dataset.cat = cat.id;
      tab.addEventListener("click", () => showCategory(cat.id));
    }
    recentsEl = el.createDiv({ cls: "messenger-emoji-recents is-empty" });
    bodyEl = el.createDiv({ cls: "messenger-emoji-body" });
    el.addEventListener("mousedown", (e) => {
      if (e.target !== searchInput) e.preventDefault();
    });
    renderGrid(BY_CATEGORY.get(activeCat) ?? []);
    return el;
  };
  const onDocMouseDown = (e) => {
    const t = e.target;
    if (pop?.isConnected && t && !pop.contains(t) && !toggle.contains(t)) {
      closePopover();
    }
  };
  const onDocKeydown = (e) => {
    if (e.key !== "Escape" || !pop?.isConnected) return;
    e.preventDefault();
    e.stopPropagation();
    closePopover();
  };
  const clampPopover = () => {
    if (!pop?.isConnected) return;
    const rect = pop.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    let shift = 0;
    if (rect.left < 8) shift = 8 - rect.left;
    else if (rect.right > vw - 8) shift = vw - 8 - rect.right;
    pop.setCssStyles({
      transform: shift ? `translateX(${shift}px)` : ""
    });
  };
  const openPopover = () => {
    if (!pop) pop = buildPopover();
    row.appendChild(pop);
    renderRecents();
    showCategory(activeCat);
    clampPopover();
    document.addEventListener("mousedown", onDocMouseDown, true);
    document.addEventListener("keydown", onDocKeydown, true);
    window.addEventListener("resize", clampPopover);
    toggle.setAttribute("aria-expanded", "true");
    closeAc();
  };
  const closePopover = () => {
    if (!pop?.isConnected) return;
    pop.remove();
    document.removeEventListener("mousedown", onDocMouseDown, true);
    document.removeEventListener("keydown", onDocKeydown, true);
    window.removeEventListener("resize", clampPopover);
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    if (pop?.isConnected) closePopover();
    else openPopover();
  });
}
var EMOJIFY_SKIP = "pre, code, a, img";
function emojify(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      return parent && parent.closest(EMOJIFY_SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });
  const targets = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) targets.push(n);
  for (const node of targets) {
    const text = node.nodeValue ?? "";
    if (!text.includes(":")) continue;
    const out = text.replace(
      /:([a-zA-Z0-9_+-]{2,}):/g,
      (whole, name) => SHORTCODES.get(name) ?? whole
    );
    if (out !== text) node.nodeValue = out;
  }
}
var EMOJI_CLUSTER = /^(?:\p{Extended_Pictographic}|[\u{FE00}-\u{FE0F}]|\u200D|\u20E3|[\u{1F3FB}-\u{1F3FF}]|[\u{1F1E6}-\u{1F1FF}])+$/u;
function isEmojiCluster(token) {
  if (!EMOJI_CLUSTER.test(token)) return false;
  if (/\p{Extended_Pictographic}/u.test(token)) return true;
  return /^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(token);
}
function clusterBases(token) {
  let bases = 0;
  let riRun = 0;
  let prev = "";
  const flushRi = () => {
    bases += Math.ceil(riRun / 2);
    riRun = 0;
  };
  for (const cp of token) {
    if (/^[\u{1F1E6}-\u{1F1FF}]$/u.test(cp)) {
      riRun += 1;
      prev = cp;
      continue;
    }
    flushRi();
    if (/\p{Extended_Pictographic}/u.test(cp) && prev !== "\u200D") {
      bases += 1;
    }
    prev = cp;
  }
  flushRi();
  return bases;
}
function isEmojiOnly(text) {
  const tokens = text.trim().split(/\s+/);
  if (tokens.length === 0 || tokens.length > 3) return false;
  let total = 0;
  for (const token of tokens) {
    if (!isEmojiCluster(token)) return false;
    total += clusterBases(token);
  }
  return total >= 1 && total <= 3;
}

// src/mobile.ts
var import_obsidian11 = require("obsidian");
function isTouchPrimary() {
  try {
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  } catch {
    return import_obsidian11.Platform.isMobile;
  }
}
function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {
  }
}
var SWIPE_SLOP_PX = 10;
function attachSwipe(el, gesture) {
  const dir = gesture.direction === "left" ? -1 : 1;
  let touchId = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let locked = null;
  let offset = 0;
  const touchOf = (e) => {
    if (touchId === null) return e.touches[0] ?? null;
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === touchId) return t;
    }
    return null;
  };
  const finish = (e) => {
    if (touchId === null) return;
    const mine = Array.from(e.changedTouches).some(
      (t) => t.identifier === touchId
    );
    if (!mine) return;
    touchId = null;
    el.removeClass("is-swiping");
    if (locked !== true) {
      locked = null;
      return;
    }
    const flick = Math.abs(velocity) > 0.5 && Math.sign(velocity) === dir && offset > gesture.max * 0.2;
    const settled = offset;
    offset = 0;
    locked = null;
    gesture.onRelease(settled, flick);
  };
  el.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      if (!t || touchId !== null) return;
      touchId = t.identifier;
      startX = lastX = t.clientX;
      startY = t.clientY;
      lastT = e.timeStamp;
      velocity = 0;
      locked = null;
      el.addClass("is-swiping");
    },
    { passive: true }
  );
  el.addEventListener(
    "touchmove",
    (e) => {
      const t = touchOf(e);
      if (!t || locked === false) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (locked === null) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_SLOP_PX) return;
        locked = Math.abs(dx) > Math.abs(dy) * 1.2;
        if (!locked) {
          el.removeClass("is-swiping");
          return;
        }
      }
      e.preventDefault();
      const dt = Math.max(1, e.timeStamp - lastT);
      velocity = (t.clientX - lastX) / dt;
      lastX = t.clientX;
      lastT = e.timeStamp;
      let next = dx * dir;
      if (next < 0) next = 0;
      if (next > gesture.max) next = gesture.max + (next - gesture.max) * 0.25;
      offset = next;
      gesture.onProgress?.(offset);
    },
    { passive: false }
  );
  el.addEventListener("touchend", finish, { passive: true });
  el.addEventListener("touchcancel", finish, { passive: true });
}
var SWIPE_BUTTON_W = 74;
function attachRowSwipeActions(row, actions, opts = {}) {
  if (!isTouchPrimary() || actions.length === 0) return;
  const total = actions.length * SWIPE_BUTTON_W;
  const underlay = row.createDiv({ cls: "messenger-swipe-underlay" });
  underlay.setCssStyles({ width: `${total}px` });
  for (const action of [...actions].reverse()) {
    const btn = underlay.createDiv({ cls: `messenger-swipe-btn ${action.cls}` });
    (0, import_obsidian11.setIcon)(btn.createDiv({ cls: "messenger-swipe-btn-icon" }), action.icon);
    btn.createDiv(
      { cls: "messenger-swipe-btn-label" },
      (el) => el.setText(action.label)
    );
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      close();
      action.run();
    });
  }
  const content = row.createDiv({ cls: "messenger-swipe-content" });
  for (const child of Array.from(row.children)) {
    if (child === underlay || child === content) continue;
    content.appendChild(child);
  }
  let open = false;
  const close = () => {
    open = false;
    content.setCssStyles({ transform: "" });
    row.removeClass("is-swipe-open");
  };
  const openFull = () => {
    open = true;
    content.setCssStyles({ transform: `translateX(-${total}px)` });
    row.addClass("is-swipe-open");
  };
  row.addEventListener("click", (e) => {
    if (!open) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    close();
  });
  row.addEventListener(
    "touchstart",
    () => {
      if (open) close();
    },
    { passive: true }
  );
  attachSwipe(row, {
    direction: "left",
    max: total,
    onProgress: (px) => {
      content.setCssStyles({
        transform: px > 0 ? `translateX(${-px}px)` : ""
      });
    },
    onRelease: (px, flick) => {
      if (flick) {
        const quick = actions.find((a) => a.id === opts.fullAction);
        if (quick) {
          close();
          haptic(10);
          quick.run();
          return;
        }
      }
      if (px >= total * 0.55) openFull();
      else close();
    }
  });
}
function attachSwipeReply(row, onReply) {
  if (!isTouchPrimary()) return;
  const MAX = 72;
  const arrow = row.createDiv({ cls: "messenger-swipe-reply" });
  (0, import_obsidian11.setIcon)(arrow.createDiv({ cls: "messenger-swipe-reply-icon" }), "reply");
  const bubble = row.querySelector(".messenger-bubble") ?? row;
  const settle = () => {
    bubble.setCssStyles({ transform: "" });
    arrow.setCssStyles({ opacity: "0", transform: "scale(0.6)" });
  };
  attachSwipe(row, {
    direction: "right",
    max: MAX,
    onProgress: (px) => {
      bubble.setCssStyles({
        transform: px > 0 ? `translateX(${px}px)` : ""
      });
      const t = Math.min(1, px / (MAX * 0.5));
      arrow.setCssStyles({
        opacity: String(t),
        transform: `scale(${0.6 + Math.min(1, px / MAX) * 0.4})`
      });
    },
    onRelease: (px, flick) => {
      settle();
      if (px >= MAX * 0.85 || flick && px > 24) {
        haptic(8);
        onReply();
      }
    }
  });
}
function watchKeyboard(root, onShift) {
  const vv = window.visualViewport;
  if (!vv) return () => {
  };
  let lastInset = 0;
  const update = () => {
    const inset = Math.max(0, Math.round(window.innerHeight - vv.height));
    root.style.setProperty("--messenger-kb-inset", `${inset}px`);
    if (Math.abs(inset - lastInset) > 60) onShift(inset > lastInset);
    lastInset = inset;
  };
  vv.addEventListener("resize", update);
  update();
  return () => {
    vv.removeEventListener("resize", update);
    root.style.removeProperty("--messenger-kb-inset");
  };
}

// src/chat-view.ts
var VIEW_TYPE_MESSENGER_CHAT = "messenger-chat";
var GROUP_GAP_MS = 5 * 60 * 1e3;
var PAGE_SIZE = 60;
var PINNED_PX = 48;
var SAVE_READ_DEBOUNCE_MS = 1500;
var FRESH_ROW_MS = 1800;
function composerMaxPx(el) {
  const px = parseFloat(getComputedStyle(el).maxHeight);
  return Number.isFinite(px) && px > 0 ? px : 160;
}
var BURN_CHOICES = [
  { label: "1 hour", afterMs: 36e5 },
  { label: "1 day", afterMs: 864e5 },
  { label: "1 week", afterMs: 7 * 864e5 },
  { label: "1 hour after reading", onReadSec: 3600 },
  { label: "1 day after reading", onReadSec: 86400 }
];
function burnLabel(msg) {
  if (msg.bar) {
    const mins = Math.round(msg.bar / 60);
    const window2 = mins >= 1440 ? `${Math.round(mins / 1440)} day(s)` : mins >= 60 ? `${Math.round(mins / 60)} hour(s)` : `${mins} minute(s)`;
    return `Disappears ${window2} after being read`;
  }
  if (msg.exp) {
    const at = new Date(msg.exp);
    const sameDay2 = (/* @__PURE__ */ new Date()).toDateString() === at.toDateString();
    return `Disappears ${sameDay2 ? at.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" }) : at.toLocaleString()}`;
  }
  return "";
}
var MessengerChatView = class extends import_obsidian12.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.peer = null;
    this.threadEl = null;
    this.threadWrapEl = null;
    this.scrollDownBtn = null;
    this.textarea = null;
    this.replyChipEl = null;
    this.replyTextEl = null;
    this.replyTo = null;
    this.draftTimer = null;
    this.listFilter = "";
    /** Whether the Contact requests section is expanded in the list. */
    this.requestsOpen = false;
    this.cachedRows = [];
    this.visibleCount = PAGE_SIZE;
    this.sending = false;
    /** Peers already warned this session that nobody on the bus reads them. */
    this.voidWarned = /* @__PURE__ */ new Set();
    this.refreshTimer = null;
    this.saveTimer = null;
    this.searchEl = null;
    this.threadFingerprint = "";
    // in-thread message search
    this.searchOpen = false;
    this.searchQuery = "";
    this.threadSearchBtn = null;
    this.threadSearchRow = null;
    this.threadSearchInput = null;
    this.threadSearchCount = null;
    // touch experience state
    this.unwatchKeyboard = null;
    /** The thread's bottom edge is in view — keyboard shifts re-pin to it. */
    this.pinned = true;
    /** Conversation that should still show its "New messages" divider. */
    this.unreadDividerPeer = null;
    /** Registry display name for the open peer — feeds the leaf title. */
    this.peerName = "";
    /** Disappearing-message choice for the composer (SPEC §16), null = keep. */
    this.burnChoice = null;
    /**
     * Rendered-bubble cache: message id → the markdown render's child nodes
     * (cloned). Thread rebuilds clone instead of re-running the markdown
     * renderer — the single most expensive step per refresh. Keys carry the
     * sealed flag so unlocking swaps renders, and the epoch (stripHtml) clears
     * everything when rendering itself would change.
     */
    this.bodyCache = /* @__PURE__ */ new Map();
    this.bodyCacheEpoch = "";
    /** lastTs per address at the previous list paint — drives the fresh flash. */
    this.rowLastTs = /* @__PURE__ */ new Map();
    this.freshUntil = /* @__PURE__ */ new Map();
    /** List scroll to restore after a background refresh rebuilds the list. */
    this.listScrollRestore = null;
    /** New messages that landed below the viewport — the jump button's count. */
    this.newBelow = 0;
    this.newBelowEl = null;
    this.navigation = false;
  }
  getViewType() {
    return VIEW_TYPE_MESSENGER_CHAT;
  }
  getDisplayText() {
    return this.peerName || "Messenger";
  }
  getIcon() {
    return "mail";
  }
  /** The conversation currently open, for notification suppression upstream. */
  get activePeer() {
    return this.peer;
  }
  getState() {
    return { peer: this.peer ?? void 0 };
  }
  async setState(state, result) {
    await super.setState(state, result);
    const raw = state?.peer;
    const peer = typeof raw === "string" && ADDRESS_RE.test(raw) ? raw : null;
    if (peer !== this.peer) {
      this.peer = peer;
      if (this.contentEl.hasChildNodes()) await this.render();
    }
  }
  async onOpen() {
    this.registerEvent(
      this.plugin.app.vault.on("modify", (file) => {
        if (file instanceof import_obsidian12.TFile) this.onFileModified(file);
      })
    );
    this.registerEvent(
      this.app.workspace.on(
        "messenger:message",
        () => this.queueRefresh()
      )
    );
    this.registerEvent(
      this.app.workspace.on("messenger:tick", () => {
        if (this.peer) this.queueRefresh();
      })
    );
    this.registerDomEvent(this.contentEl, "keydown", (e) => {
      if (e.key !== "Escape") return;
      if (this.peer) {
        if (this.replyTo) {
          this.clearReply();
        } else if (this.searchOpen) {
          this.searchOpen = false;
          this.searchQuery = "";
          this.threadFingerprint = "";
          void this.render().then(() => {
            if (!import_obsidian12.Platform.isMobile) this.textarea?.focus();
          });
        } else {
          this.showList();
        }
      } else if (this.listFilter) {
        this.listFilter = "";
        void this.render();
      }
    });
    await this.render();
  }
  async onClose() {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    if (this.draftTimer !== null) window.clearTimeout(this.draftTimer);
    this.unwatchKeyboard?.();
    this.unwatchKeyboard = null;
    await this.persistReadNow();
  }
  /** Re-read getDisplayText into the leaf's tab/header (internal, best effort). */
  updateLeafTitle() {
    try {
      this.leaf.updateHeader?.();
    } catch {
    }
  }
  /** Switch the view to one conversation. Called from the list and from main. */
  async openConversation(peer, messageId) {
    this.peer = peer;
    this.visibleCount = PAGE_SIZE;
    this.replyTo = null;
    this.searchOpen = false;
    this.searchQuery = "";
    this.pinned = true;
    this.unreadDividerPeer = peer;
    this.burnChoice = null;
    this.newBelow = 0;
    await this.render();
    if (messageId) await this.revealMessage(peer, messageId);
    if (!import_obsidian12.Platform.isMobile) this.textarea?.focus();
  }
  /**
   * Land on one message inside the open thread: expand pages until it exists
   * in the DOM, then scroll + flash. Notices instead of failing silently when
   * the message has been GC'd out from under a search hit.
   */
  async revealMessage(peer, messageId) {
    const thread = this.threadEl;
    if (!thread) return;
    const selector = `[data-mid="${CSS.escape(messageId)}"]`;
    let guard = 0;
    while (!thread.querySelector(selector) && guard++ < 25) {
      this.visibleCount += PAGE_SIZE * 4;
      await this.fillThread(thread, peer);
    }
    if (thread.querySelector(selector)) this.jumpToMessage(thread, messageId);
    else new import_obsidian12.Notice("That message is no longer in this conversation");
  }
  showList() {
    this.peer = null;
    this.replyTo = null;
    this.searchOpen = false;
    this.searchQuery = "";
    this.peerName = "";
    this.unreadDividerPeer = null;
    this.burnChoice = null;
    void this.render();
  }
  // -- refresh ---------------------------------------------------------------
  /** Full re-render — the plugin calls this after appearance settings change. */
  async refresh() {
    await this.render();
  }
  /**
   * Blend-control repaint: wallpaper/tint vars only, no thread rebuild —
   * cheap enough to run on every slider tick in the settings tab.
   */
  refreshAppearance() {
    const wrap = this.threadWrapEl;
    if (wrap && wrap.isConnected) applyWallpaper(wrap, this.peer, this.plugin);
  }
  onFileModified(file) {
    if (!file.path.startsWith(`${this.plugin.store.rootPath}/`)) return;
    if (!this.peer) {
      this.queueRefresh();
      return;
    }
    const interesting = /* @__PURE__ */ new Set([
      this.plugin.store.inboxPath(this.plugin.settings.address),
      this.plugin.store.inboxPath(this.peer),
      // the peer's acknowledgments drive ✓ / ✓✓ on my outgoing bubbles
      this.plugin.store.receiptsPath(this.peer)
    ]);
    if (interesting.has(file.path)) this.queueRefresh();
  }
  /** Coalesce bursts of file writes into one re-render. */
  queueRefresh() {
    if (!this.peer && this.searchEl && this.searchEl === document.activeElement) {
      return;
    }
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      if (this.peer) void this.refreshThreadOnly();
      else void this.render();
    }, 100);
  }
  /** Re-render only the thread so a half-typed draft in the composer survives. */
  async refreshThreadOnly() {
    const peer = this.peer;
    const thread = this.threadEl;
    if (!peer || !thread || !thread.isConnected) return;
    const mine = await this.plugin.store.readInbox(this.plugin.settings.address);
    const theirs = await this.plugin.store.readInbox(peer);
    const receipts = await this.plugin.store.readReceiptsRaw(peer);
    const all = [...mine, ...theirs];
    const last = all[all.length - 1];
    const fingerprint3 = `${mine.length}:${theirs.length}:${last?.id ?? ""}:${receipts.length}:${receipts.slice(-200)}:${this.plugin.settings.readAt[peer] ?? ""}`;
    if (fingerprint3 === this.threadFingerprint && thread.querySelector(".messenger-msg")) {
      return;
    }
    this.threadFingerprint = fingerprint3;
    const pinned = thread.scrollHeight - thread.scrollTop - thread.clientHeight < PINNED_PX;
    const before = thread.querySelectorAll(".messenger-msg").length;
    await this.fillThread(thread, peer);
    const after = thread.querySelectorAll(".messenger-msg").length;
    if (pinned) {
      thread.scrollTop = thread.scrollHeight;
    } else if (after > before) {
      this.newBelow += after - before;
      this.paintNewBelow();
      this.scrollDownBtn?.addClass("has-new");
    }
  }
  // -- data --------------------------------------------------------------------
  /**
   * The conversation is the pair {me, peer}: mail they sent me (my inbox)
   * plus mail I sent them (their inbox — the sender keeps no copy), and my
   * outbox copies when that setting is on. The merge lives on the bus so
   * export, the API, and search all see the exact same thread.
   */
  conversationWith(peer) {
    return this.plugin.bus.loadConversation(this.plugin.settings.address, peer);
  }
  async conversationRows() {
    const me = this.plugin.settings.address;
    const readAt = this.plugin.settings.readAt;
    const [addresses, registry, mine, contacts] = await Promise.all([
      this.plugin.store.listAddresses(),
      this.plugin.store.readRegistry(),
      this.plugin.store.readInbox(me),
      this.plugin.contacts.map()
    ]);
    const names = new Map(registry.map((r) => [r.address, r.name]));
    const unreadBySender = /* @__PURE__ */ new Map();
    for (const m of mine) {
      if (m.from === me || m.ts <= (readAt[m.from] ?? "")) continue;
      unreadBySender.set(m.from, (unreadBySender.get(m.from) ?? 0) + 1);
    }
    const rows = await Promise.all(
      // every conversation loads concurrently — serialized, N inboxes cost
      // N sequential stat round-trips on every list paint
      addresses.map(async (address) => {
        const messages = await this.conversationWith(address);
        const last = messages[messages.length - 1] ?? null;
        return {
          address,
          name: names.get(address) ?? address,
          preview: last ? last.encLocked ? "\u{1F512} Encrypted message" : oneLine2(last.body, 90) : "No messages yet",
          lastTs: last?.ts ?? null,
          unread: address === me ? 0 : unreadBySender.get(address) ?? 0,
          locked: this.plugin.isPeerLocked(address),
          contact: contacts.get(address)?.state ?? null,
          contactUpdated: contacts.get(address)?.updated ?? null
        };
      })
    );
    const visible = rows.filter((r) => r.contact !== "blocked");
    visible.sort(
      (a, b) => (b.lastTs ?? "").localeCompare(a.lastTs ?? "") || a.address.localeCompare(b.address)
    );
    return visible;
  }
  /** Record that the user has seen this conversation up to now, and let the
   *  senders know (✓✓) by appending read receipts to my receipts file. */
  markRead(peer, unreadIds) {
    const me = this.plugin.settings.address;
    const next = (/* @__PURE__ */ new Date()).toISOString();
    if ((this.plugin.settings.readAt[peer] ?? "") >= next) return;
    this.plugin.settings.readAt[peer] = next;
    this.threadFingerprint = "";
    void this.plugin.updateBadge();
    this.plugin.requestBurnSweep();
    if (unreadIds.length > 0 && peer !== me && this.plugin.settings.sendReadReceipts) {
      void this.plugin.store.appendReceiptBlock(
        me,
        encodeReceiptBlock(me, "read", next, unreadIds)
      ).catch(
        (err) => console.error("[message-bus] read receipt failed", err)
      );
    }
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      void this.plugin.saveSettings();
    }, SAVE_READ_DEBOUNCE_MS);
  }
  async persistReadNow() {
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
      await this.plugin.saveSettings();
    }
    if (this.draftTimer !== null) {
      window.clearTimeout(this.draftTimer);
      this.draftTimer = null;
      await this.plugin.saveSettings();
    }
  }
  // -- rendering ---------------------------------------------------------------
  async render() {
    this.contentEl.dataset.view = this.plugin.isMessengerLocked() ? "lock" : this.peer ? "conversation" : "list";
    if (this.plugin.isMessengerLocked() && this.contentEl.querySelector(":scope > .messenger-lock")) {
      return;
    }
    if (!this.peer && this.contentEl.dataset.view === "list") {
      this.listScrollRestore = this.contentEl.querySelector(".messenger-list-body")?.scrollTop ?? null;
    }
    this.contentEl.empty();
    this.contentEl.addClass("messenger-chat");
    this.threadEl = null;
    this.threadWrapEl = null;
    this.scrollDownBtn = null;
    this.newBelowEl = null;
    this.textarea = null;
    this.searchEl = null;
    if (this.plugin.isMessengerLocked()) {
      this.renderAppLock();
      this.updateLeafTitle();
      return;
    }
    if (this.peer) await this.renderConversation(this.peer);
    else await this.renderList();
    this.updateLeafTitle();
  }
  // -- locks (level-1 security) --------------------------------------------------
  /**
   * The shared lock card: icon, explanation, one input. Wrong entries shake
   * and clear; a correct one calls back to re-render whatever it was
   * guarding. tryUnlock may derive the vault key, so it can be async.
   */
  buildLockCard(parent, opts) {
    const card = parent.createDiv({ cls: "messenger-lock" });
    (0, import_obsidian12.setIcon)(card.createDiv({ cls: "messenger-lock-icon" }), "lock");
    card.createDiv({ cls: "messenger-lock-title" }, (el) => el.setText(opts.title));
    card.createDiv({ cls: "messenger-lock-desc" }, (el) => el.setText(opts.desc));
    const errorEl = card.createDiv({ cls: "messenger-lock-error" });
    const row = card.createDiv({ cls: "messenger-lock-row" });
    const input = row.createEl("input", {
      cls: "messenger-lock-input",
      type: "password",
      attr: {
        placeholder: opts.secretLabel,
        "aria-label": opts.secretLabel,
        name: "messenger-secret",
        // standard credential tokens: password managers (1Password,
        // Bitwarden, iCloud Keychain, Android autofill) offer the saved
        // credential on current-password fields — "off" hides us from them
        autocomplete: "current-password",
        autocapitalize: "off",
        autocorrect: "off",
        spellcheck: "false",
        enterkeyhint: "go"
      }
    });
    const button = row.createEl("button", {
      cls: "messenger-lock-btn",
      text: "Unlock"
    });
    let busy = false;
    const attempt = () => {
      if (busy) return;
      busy = true;
      void Promise.resolve(opts.tryUnlock(input.value)).then((ok) => {
        busy = false;
        if (ok) {
          opts.onUnlocked();
          return;
        }
        errorEl.setText(`Wrong ${opts.secretLabel.toLowerCase()} \u2014 try again.`);
        card.addClass("is-error");
        window.setTimeout(() => card.removeClass("is-error"), 500);
        input.select();
      }).catch(() => {
        busy = false;
        errorEl.setText("Unlock failed \u2014 try again.");
      });
    };
    button.addEventListener("click", attempt);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") attempt();
    });
    window.setTimeout(() => input.focus(), 0);
  }
  /** App lock: the whole view — list included — behind the unlock secret. */
  renderAppLock() {
    this.peerName = "";
    const keyMode = this.plugin.isKeyMode();
    this.buildLockCard(this.contentEl, {
      title: "Messenger is locked",
      desc: keyMode ? "Paste the vault key from your password manager to open Messenger." : "Enter your passcode to open Messenger.",
      secretLabel: keyMode ? "Vault key" : "Passcode",
      tryUnlock: (input) => this.plugin.tryUnlockMessenger(input),
      onUnlocked: () => void this.render()
    });
  }
  /**
   * One conversation behind its lock: the usual header (so back still works)
   * with a lock card where the thread would be. Nothing renders, marks read,
   * or receipts until the passcode is entered.
   */
  renderPeerLock(peer, name) {
    const me = this.plugin.settings.address;
    const shown = peer === me ? `${name} (you)` : name;
    const wrap = this.contentEl.createDiv({ cls: "messenger-conversation is-locked" });
    const head = wrap.createDiv({ cls: "messenger-chat-head" });
    const back = head.createDiv({ cls: "messenger-back clickable-icon" });
    (0, import_obsidian12.setIcon)(back, isTouchPrimary() ? "chevron-left" : "arrow-left");
    back.setAttribute("aria-label", "All conversations");
    back.addEventListener("click", () => this.showList());
    head.createDiv({ cls: "messenger-chat-head-name" }, (el) => el.setText(shown));
    (0, import_obsidian12.setIcon)(head.createDiv({ cls: "messenger-lock-badge" }), "lock");
    this.buildLockCard(wrap, {
      title: "This conversation is locked",
      desc: this.plugin.isKeyMode() ? `Paste the vault key from your password manager to read your conversation with ${shown}.` : `Enter your passcode to read your conversation with ${shown}.`,
      secretLabel: this.plugin.isKeyMode() ? "Vault key" : "Passcode",
      tryUnlock: (input) => this.plugin.tryUnlockPeer(peer, input),
      onUnlocked: () => void this.openConversation(peer)
    });
  }
  async renderList() {
    const me = this.plugin.settings.address;
    const wrap = this.contentEl.createDiv({ cls: "messenger-list" });
    const head = wrap.createDiv({ cls: "messenger-list-head" });
    head.createDiv(
      { cls: "messenger-list-title" },
      (el) => el.setText("Messenger")
    );
    const headActions = head.createDiv({ cls: "messenger-list-head-actions" });
    const addContacts = headActions.createEl("button", {
      cls: "messenger-new-msg clickable-icon"
    });
    (0, import_obsidian12.setIcon)(addContacts, "user-plus");
    addContacts.setAttribute("aria-label", "Add contacts");
    addContacts.addEventListener(
      "click",
      () => new AddContactModal(this.app, this.plugin).open()
    );
    const compose = headActions.createEl("button", {
      cls: "messenger-new-msg clickable-icon"
    });
    (0, import_obsidian12.setIcon)(compose, "plus");
    compose.setAttribute("aria-label", "New message");
    compose.addEventListener("click", () => {
      new SendMessageModal(
        this.app,
        async (to, body) => {
          await this.plugin.bus.send(this.plugin.settings.address, to, body);
          new import_obsidian12.Notice(`Delivered to inbox of ${to}`);
          if (!this.peer) void this.render();
        },
        () => this.plugin.knownAddresses(),
        async (to) => ({
          self: to === this.plugin.settings.address,
          confirmed: await this.plugin.isConfirmedRecipient(to)
        })
      ).open();
    });
    const searchMessages = headActions.createEl("button", {
      cls: "messenger-new-msg clickable-icon"
    });
    (0, import_obsidian12.setIcon)(searchMessages, "search");
    searchMessages.setAttribute("aria-label", "Search messages");
    searchMessages.addEventListener(
      "click",
      () => new MessageSearchModal(this.app, this.plugin).open()
    );
    const searchWrap = wrap.createDiv({ cls: "messenger-list-search" });
    const search = searchWrap.createEl("input", {
      cls: "messenger-search-input",
      type: "search",
      attr: { placeholder: "Search conversations\u2026", "aria-label": "Search conversations" }
    });
    search.value = this.listFilter;
    this.searchEl = search;
    search.addEventListener("blur", () => {
      if (!this.peer && this.searchEl === search) this.queueRefresh();
    });
    const bodyEl = wrap.createDiv({ cls: "messenger-list-body" });
    this.cachedRows = await this.conversationRows();
    search.addEventListener("input", () => {
      this.listFilter = search.value;
      this.renderConvRows(bodyEl, me);
    });
    this.renderConvRows(bodyEl, me);
    if (this.listScrollRestore !== null) {
      bodyEl.scrollTop = this.listScrollRestore;
      this.listScrollRestore = null;
    }
  }
  renderConvRows(bodyEl, me) {
    bodyEl.empty();
    const isRequest = (r) => r.address !== me && r.contact === "request";
    const requests = this.cachedRows.filter(isRequest);
    const shown = this.cachedRows.filter((r) => !isRequest(r));
    if (this.cachedRows.length === 0) {
      const empty = bodyEl.createDiv({ cls: "messenger-empty" });
      (0, import_obsidian12.setIcon)(empty.createDiv({ cls: "messenger-empty-icon" }), "inbox");
      empty.createDiv(
        { cls: "messenger-empty-text" },
        (el) => el.setText("No inboxes yet \u2014 send a message or add a contact to create one.")
      );
      const actions = empty.createDiv({ cls: "messenger-empty-actions" });
      const addContacts = actions.createEl("button", {
        cls: "mod-cta",
        text: "Add contacts"
      });
      addContacts.addEventListener(
        "click",
        () => new AddContactModal(this.app, this.plugin).open()
      );
      const send = actions.createEl("button", { text: "Send a message" });
      send.addEventListener("click", () => {
        new SendMessageModal(
          this.app,
          async (to, body) => {
            await this.plugin.bus.send(this.plugin.settings.address, to, body);
            new import_obsidian12.Notice(`Delivered to inbox of ${to}`);
            if (!this.peer) void this.render();
          },
          () => this.plugin.knownAddresses(),
          async (to) => ({
            self: to === this.plugin.settings.address,
            confirmed: await this.plugin.isConfirmedRecipient(to)
          })
        ).open();
      });
      return;
    }
    const q = this.listFilter.trim().toLowerCase();
    const filterRows = (rows2) => q ? rows2.filter((r) => {
      const hay = r.locked ? `${r.address} ${r.name}`.toLowerCase() : `${r.address} ${r.name} ${r.preview}`.toLowerCase();
      return hay.includes(q);
    }) : rows2;
    const rows = filterRows(shown);
    const requestRows = filterRows(requests);
    if (rows.length === 0 && requestRows.length === 0) {
      bodyEl.createDiv(
        { cls: "messenger-empty" },
        (el) => el.setText(`No conversations match \u201C${this.listFilter.trim()}\u201D`)
      );
      return;
    }
    for (const row of rows) {
      const item = bodyEl.createDiv({ cls: "messenger-conv" });
      item.dataset.addr = row.address;
      const prevTs = this.rowLastTs.get(row.address);
      if (row.lastTs && prevTs !== void 0 && row.lastTs > prevTs) {
        this.freshUntil.set(row.address, Date.now() + FRESH_ROW_MS);
      }
      if (row.lastTs !== null) this.rowLastTs.set(row.address, row.lastTs);
      if ((this.freshUntil.get(row.address) ?? 0) > Date.now()) {
        item.addClass("is-fresh");
      }
      item.createDiv({ cls: "messenger-avatar" }, (el) => {
        paintAvatar(el, row.address, this.plugin);
      });
      const main = item.createDiv({ cls: "messenger-conv-main" });
      const top = main.createDiv({ cls: "messenger-conv-top" });
      top.createDiv(
        { cls: "messenger-conv-name" },
        (el) => el.setText(row.address === me ? `${row.name} (you)` : row.name)
      );
      if (row.locked) {
        const lockedIcon = top.createDiv({ cls: "messenger-conv-locked" });
        (0, import_obsidian12.setIcon)(lockedIcon, "lock");
        lockedIcon.setAttribute("aria-label", "Locked conversation");
      }
      if (this.plugin.settings.mutedPeers[row.address]) {
        const muted = top.createDiv({ cls: "messenger-conv-muted" });
        (0, import_obsidian12.setIcon)(muted, "bell-off");
        muted.setAttribute("aria-label", "Notifications muted");
      }
      if (row.contact === "pending") {
        const pending = top.createDiv({ cls: "messenger-conv-pending" });
        (0, import_obsidian12.setIcon)(pending, "clock");
        const age = invitationAgeDays(row.contactUpdated);
        pending.setAttribute(
          "aria-label",
          age !== null && age >= 1 ? `Invitation sent ${age}d ago \u2014 mutual once they reply` : "Invitation sent \u2014 mutual once they reply"
        );
      }
      top.createDiv(
        { cls: "messenger-conv-time" },
        (el) => el.setText(row.lastTs ? fmtListTime(row.lastTs) : "")
      );
      const bottom = main.createDiv({ cls: "messenger-conv-bottom" });
      bottom.createDiv(
        { cls: "messenger-conv-preview" },
        (el) => el.setText(row.locked ? "Locked conversation" : row.preview)
      );
      if (row.unread > 0 && !row.locked) {
        bottom.createDiv(
          { cls: "messenger-unread" },
          (el) => el.setText(String(row.unread > 99 ? "99+" : row.unread))
        );
      }
      this.attachRowActions(item, row, me);
      item.addEventListener("click", () => void this.openConversation(row.address));
      item.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
        this.openConversationMenu(row.address, evt);
      });
    }
    if (requestRows.length > 0) this.renderRequestRows(bodyEl, me, requestRows);
  }
  /**
   * The Contact requests section: a divider carrying the count, then the
   * awaiting rows with inline accept/decline. Collapsed by default — the
   * whole point is that strangers stay quiet until you look.
   */
  renderRequestRows(bodyEl, me, requests) {
    const divider = bodyEl.createDiv({ cls: "messenger-requests-divider" });
    divider.setAttribute("role", "button");
    divider.setAttribute(
      "aria-label",
      this.requestsOpen ? "Collapse contact requests" : "Expand contact requests"
    );
    divider.createDiv(
      { cls: "messenger-requests-label" },
      (el) => el.setText("Contact requests")
    );
    divider.createDiv(
      { cls: "messenger-unread messenger-requests-count" },
      (el) => el.setText(String(requests.length))
    );
    (0, import_obsidian12.setIcon)(
      divider.createDiv({ cls: "messenger-requests-chevron" }),
      this.requestsOpen ? "chevron-down" : "chevron-right"
    );
    divider.addEventListener("click", () => {
      this.requestsOpen = !this.requestsOpen;
      this.renderConvRows(bodyEl, me);
    });
    if (!this.requestsOpen) return;
    for (const row of requests) {
      const item = bodyEl.createDiv({ cls: "messenger-conv is-request" });
      item.dataset.addr = row.address;
      item.createDiv({ cls: "messenger-avatar" }, (el) => {
        paintAvatar(el, row.address, this.plugin);
      });
      const main = item.createDiv({ cls: "messenger-conv-main" });
      const top = main.createDiv({ cls: "messenger-conv-top" });
      top.createDiv({ cls: "messenger-conv-name" }, (el) => el.setText(row.name));
      if (isReservedAddress(row.address)) {
        top.createDiv(
          { cls: "messenger-reserved-flag" },
          (el) => el.setText("reserved name")
        );
      }
      top.createDiv(
        { cls: "messenger-conv-time" },
        (el) => el.setText(row.lastTs ? fmtListTime(row.lastTs) : "")
      );
      main.createDiv(
        { cls: "messenger-conv-bottom" },
        (el) => el.createDiv(
          { cls: "messenger-conv-preview" },
          (p) => p.setText(row.locked ? "Locked conversation" : row.preview)
        )
      );
      const actions = top.createDiv({ cls: "messenger-request-actions" });
      const accept = actions.createEl("button", {
        cls: "messenger-request-accept",
        attr: { "aria-label": `Accept ${row.name}` }
      });
      (0, import_obsidian12.setIcon)(accept, "check");
      accept.addEventListener("click", (evt) => {
        evt.stopPropagation();
        void this.plugin.acceptContact(row.address);
      });
      const decline = actions.createEl("button", {
        cls: "messenger-request-decline",
        attr: { "aria-label": `Decline ${row.name}` }
      });
      (0, import_obsidian12.setIcon)(decline, "x");
      decline.addEventListener("click", (evt) => {
        evt.stopPropagation();
        void this.plugin.blockContact(row.address);
      });
      attachRowSwipeActions(item, [
        {
          id: "accept",
          label: "Accept",
          icon: "check",
          cls: "is-read",
          run: () => void this.plugin.acceptContact(row.address)
        },
        {
          id: "decline",
          label: "Decline",
          icon: "x",
          cls: "is-delete",
          run: () => void this.plugin.blockContact(row.address)
        }
      ]);
      item.addEventListener("click", () => void this.openConversation(row.address));
      item.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
        this.openConversationMenu(row.address, evt);
      });
    }
  }
  /** Swipe-left actions on a list row: mark read when unread, plus delete. */
  attachRowActions(item, row, me) {
    const actions = [];
    if (row.unread > 0 && row.address !== me && !row.locked) {
      actions.push({
        id: "read",
        label: "Read",
        icon: "check-check",
        cls: "is-read",
        run: () => void this.plugin.markPeerRead(row.address)
      });
    }
    actions.push({
      id: "delete",
      label: "Delete",
      icon: "trash-2",
      cls: "is-delete",
      run: () => this.confirmDeleteConversation(row.address, row.name)
    });
    attachRowSwipeActions(item, actions, {
      // a full-width flick only ever commits the safe action
      fullAction: actions.length > 1 ? "read" : void 0
    });
  }
  /** The destructive gate shared by the context menu and the swipe action. */
  confirmDeleteConversation(address, name) {
    new ConfirmModal(this.app, {
      title: `Delete conversation with ${name}?`,
      message: "The inbox, receipts, and read state for this address are moved to the system trash. Mail you sent that lives in their inbox goes with it.",
      cta: "Delete",
      onConfirm: async () => {
        await this.plugin.deleteConversation(address);
        if (this.peer === address) this.showList();
        else void this.render();
      }
    }).open();
  }
  /**
   * Per-chat retention override (global retention/inbox-cap settings, scoped
   * to one address). An empty save deletes both keys — absent = default.
   */
  openRetentionModal(address, name) {
    const s = this.plugin.settings;
    new PeerRetentionModal(this.app, {
      peer: address,
      name,
      current: {
        days: s.retentionDaysByPeer[address],
        cap: s.maxInboxMessagesByPeer[address]
      },
      defaults: { days: s.retentionDays, cap: s.maxInboxMessages },
      onSave: async (next) => {
        if (next.days === void 0) delete s.retentionDaysByPeer[address];
        else s.retentionDaysByPeer[address] = next.days;
        if (next.cap === void 0) delete s.maxInboxMessagesByPeer[address];
        else s.maxInboxMessagesByPeer[address] = next.cap;
        await this.plugin.saveSettings();
      }
    }).open();
  }
  /**
   * Right-click / long-press on a conversation row: the per-conversation
   * actions that have nowhere else to live — mute, rename, reveal the source
   * file, export, delete.
   */
  openConversationMenu(address, evt) {
    const me = this.plugin.settings.address;
    const muted = this.plugin.settings.mutedPeers[address] === true;
    const registryName = () => {
      const rows = this.cachedRows.find((r) => r.address === address);
      return rows?.name ?? address;
    };
    const menu = new import_obsidian12.Menu();
    menu.addItem(
      (item) => item.setTitle("Open").onClick(() => void this.openConversation(address))
    );
    if (!this.plugin.isPeerLocked(address)) {
      menu.addItem(
        (item) => item.setTitle("Mark read").setIcon("check-check").onClick(() => void this.plugin.markPeerRead(address))
      );
    }
    const contact = this.cachedRows.find((r) => r.address === address)?.contact ?? null;
    if (address !== me && contact === "request") {
      menu.addItem(
        (item) => item.setTitle("Accept contact").setIcon("user-check").onClick(() => void this.plugin.acceptContact(address))
      );
      menu.addItem(
        (item) => item.setTitle("Decline contact\u2026").setIcon("x").onClick(
          () => new ConfirmModal(this.app, {
            title: `Decline ${registryName()}?`,
            message: "The conversation disappears from Messenger and their mail stays silent \u2014 file-bus mail can still land (SPEC \xA78) but shows nothing. Undo from Settings \u2192 Messenger \u2192 Blocked addresses.",
            cta: "Decline",
            onConfirm: () => void this.plugin.blockContact(address)
          }).open()
        )
      );
    } else if (address !== me) {
      if (contact === "mutual" || contact === "pending") {
        menu.addItem(
          (item) => item.setTitle("Remove contact").setIcon("user-minus").onClick(() => void this.plugin.removeContact(address))
        );
      }
      menu.addItem(
        (item) => item.setTitle("Block contact\u2026").setIcon("shield-x").onClick(
          () => new ConfirmModal(this.app, {
            title: `Block ${registryName()}?`,
            message: "The conversation disappears from Messenger and their mail stays silent \u2014 file-bus mail can still land (SPEC \xA78) but shows nothing. Undo from Settings \u2192 Messenger \u2192 Blocked addresses.",
            cta: "Block",
            onConfirm: () => void this.plugin.blockContact(address)
          }).open()
        )
      );
    }
    menu.addItem(
      (item) => item.setTitle(muted ? "Unmute notifications" : "Mute notifications").setIcon(muted ? "bell" : "bell-off").onClick(async () => {
        if (muted) delete this.plugin.settings.mutedPeers[address];
        else this.plugin.settings.mutedPeers[address] = true;
        await this.plugin.saveSettings();
        void this.render();
      })
    );
    if (this.plugin.hasPasscode()) {
      if (this.plugin.settings.lockedPeers[address] === true) {
        menu.addItem(
          (item) => item.setTitle("Remove conversation lock\u2026").setIcon("lock-open").onClick(
            () => new PasscodePromptModal(this.app, {
              title: "Remove conversation lock",
              desc: `Enter your unlock secret to unlock ${registryName()} for good \u2014 anyone using this vault will be able to open it freely.`,
              cta: "Remove lock",
              verify: (input) => this.plugin.verifyAuth(input),
              onSuccess: () => void this.plugin.setPeerLocked(address, false)
            }).open()
          )
        );
      } else {
        menu.addItem(
          (item) => item.setTitle("Lock conversation").setIcon("lock").onClick(() => void this.plugin.setPeerLocked(address, true))
        );
      }
    }
    if (address !== me) {
      menu.addItem(
        (item) => item.setTitle("Rename\u2026").setIcon("pencil").onClick(
          () => new RenameAddressModal(this.app, address, registryName(), async (name) => {
            await this.plugin.store.upsertRegistry({
              address,
              name: name || address,
              updated: (/* @__PURE__ */ new Date()).toISOString()
            });
            await this.plugin.saveSettings();
            this.plugin.refreshChatViews();
          }).open()
        )
      );
    }
    menu.addItem(
      (item) => item.setTitle("Retention\u2026").setIcon("calendar-clock").onClick(() => this.openRetentionModal(address, registryName()))
    );
    menu.addSeparator();
    menu.addItem(
      (item) => item.setTitle("Export conversation\u2026").setIcon("download").onClick(async () => {
        const file = await this.plugin.exportConversation(address);
        if (file) await this.app.workspace.getLeaf(true).openFile(file);
      })
    );
    menu.addItem(
      (item) => item.setTitle("Reveal source file").setIcon("file-text").onClick(() => {
        if (this.plugin.store.hidden) {
          this.plugin.revealFile(this.plugin.store.inboxPath(address));
          return;
        }
        const file = this.app.vault.getAbstractFileByPath(
          this.plugin.store.inboxPath(address)
        );
        if (file instanceof import_obsidian12.TFile) void this.app.workspace.getLeaf(true).openFile(file);
        else new import_obsidian12.Notice("No inbox file yet \u2014 nothing sent to this address");
      })
    );
    menu.addSeparator();
    menu.addItem(
      (item) => item.setTitle("Delete conversation\u2026").setIcon("trash-2").onClick(() => this.confirmDeleteConversation(address, registryName()))
    );
    menu.showAtMouseEvent(evt);
  }
  async renderConversation(peer) {
    const me = this.plugin.settings.address;
    const [registry, contacts] = await Promise.all([
      this.plugin.store.readRegistry(),
      this.plugin.contacts.map()
    ]);
    const name = registry.find((r) => r.address === peer)?.name ?? peer;
    const contactState = peer === me ? null : contacts.get(peer)?.state ?? null;
    const contactUpdated = peer === me ? null : contacts.get(peer)?.updated ?? null;
    this.peerName = peer === me ? `${name} (you)` : name;
    if (this.plugin.isPeerLocked(peer)) {
      this.renderPeerLock(peer, name);
      return;
    }
    const wrap = this.contentEl.createDiv({ cls: "messenger-conversation" });
    const head = wrap.createDiv({ cls: "messenger-chat-head" });
    const back = head.createDiv({ cls: "messenger-back clickable-icon" });
    (0, import_obsidian12.setIcon)(back, isTouchPrimary() ? "chevron-left" : "arrow-left");
    back.setAttribute("aria-label", "All conversations");
    back.addEventListener("click", () => this.showList());
    const headAvatar = head.createDiv({
      cls: "messenger-avatar messenger-avatar-sm messenger-avatar-clickable"
    });
    paintAvatar(headAvatar, peer, this.plugin);
    headAvatar.removeAttribute("aria-hidden");
    headAvatar.setAttribute("aria-label", "Set profile picture");
    headAvatar.title = "Set profile picture";
    headAvatar.addEventListener(
      "click",
      () => void this.pickPeerAvatar(peer, headAvatar)
    );
    const headText = head.createDiv();
    headText.createDiv(
      { cls: "messenger-chat-head-name" },
      (el) => el.setText(peer === me ? `${name} (you)` : name)
    );
    headText.createDiv(
      { cls: "messenger-chat-head-addr" },
      (el) => el.setText(peer)
    );
    if (contactState && contactState !== "blocked") {
      const badge = headText.createDiv({
        cls: `messenger-contact-badge is-${contactState}`
      });
      (0, import_obsidian12.setIcon)(
        badge.createDiv({ cls: "messenger-contact-badge-icon" }),
        contactState === "mutual" ? "user-check" : contactState === "pending" ? "clock" : "user-plus"
      );
      badge.createDiv({ cls: "messenger-contact-badge-text" }, (el) => {
        const age = contactState === "pending" ? invitationAgeDays(contactUpdated) : null;
        el.setText(
          contactState === "mutual" ? "Mutual contact" : contactState === "pending" ? age !== null && age >= 1 ? `Invitation sent ${age}d ago \u2014 mutual when they reply` : "Invitation sent \u2014 mutual when they reply" : "Contact request"
        );
      });
    }
    const attBtn = head.createDiv({
      cls: "messenger-att-button clickable-icon"
    });
    (0, import_obsidian12.setIcon)(attBtn, "paperclip");
    attBtn.setAttribute("aria-label", "Conversation attachments");
    attBtn.title = "Conversation attachments";
    attBtn.addEventListener(
      "click",
      () => void this.openAttachmentSheet(peer, name)
    );
    if (peer !== me && peer !== BUS_ADDRESS && isReservedAddress(peer)) {
      const banner = wrap.createDiv({ cls: "messenger-spoof-banner" });
      (0, import_obsidian12.setIcon)(banner.createDiv({ cls: "messenger-spoof-banner-icon" }), "shield-alert");
      banner.createDiv(
        { cls: "messenger-spoof-banner-text" },
        (el) => el.setText(
          `\u201C${peer}\u201D is a reserved name \u2014 real Messenger mail never comes from it. Treat this as untrusted (SPEC \xA78).`
        )
      );
    }
    const threadWrap = wrap.createDiv({ cls: "messenger-thread-wrap" });
    if (this.searchOpen) {
      this.threadSearchRow = wrap.createDiv({ cls: "messenger-thread-search" });
      const input = this.threadSearchRow.createEl("input", {
        cls: "messenger-thread-search-input",
        type: "search",
        attr: { placeholder: "Search in this conversation\u2026", "aria-label": "Search in conversation" }
      });
      input.value = this.searchQuery;
      this.threadSearchInput = input;
      this.threadSearchCount = this.threadSearchRow.createDiv({
        cls: "messenger-thread-search-count"
      });
      const close = this.threadSearchRow.createDiv({
        cls: "messenger-thread-search-close clickable-icon"
      });
      (0, import_obsidian12.setIcon)(close, "x");
      close.setAttribute("aria-label", "Close search");
      close.addEventListener("click", () => {
        this.searchOpen = false;
        this.searchQuery = "";
        this.threadFingerprint = "";
        void this.render();
      });
      let searchTimer = null;
      this.registerDomEvent(input, "input", () => {
        this.searchQuery = input.value;
        this.threadFingerprint = "";
        if (searchTimer !== null) window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => {
          searchTimer = null;
          void this.fillThread(this.threadEl ?? thread, peer);
        }, 100);
      });
      window.setTimeout(() => input.focus(), 0);
    } else {
      this.threadSearchRow = null;
      this.threadSearchInput = null;
      this.threadSearchCount = null;
    }
    applyWallpaper(threadWrap, peer, this.plugin);
    this.threadWrapEl = threadWrap;
    this.threadSearchBtn = head.createDiv({
      cls: "messenger-thread-search-btn clickable-icon"
    });
    (0, import_obsidian12.setIcon)(this.threadSearchBtn, "search");
    this.threadSearchBtn.setAttribute("aria-label", "Search in conversation");
    this.threadSearchBtn.toggleClass("is-active", this.searchOpen);
    this.threadSearchBtn.addEventListener("click", () => {
      this.searchOpen = !this.searchOpen;
      if (!this.searchOpen) {
        this.searchQuery = "";
        this.threadFingerprint = "";
      }
      void this.render();
    });
    const wallpaperBtn = head.createDiv({
      cls: "messenger-wallpaper-btn clickable-icon"
    });
    (0, import_obsidian12.setIcon)(wallpaperBtn, "image");
    wallpaperBtn.setAttribute("aria-label", "Conversation wallpaper");
    wallpaperBtn.addEventListener(
      "click",
      (evt) => this.openWallpaperMenu(peer, evt, threadWrap)
    );
    const thread = threadWrap.createDiv({ cls: "messenger-thread" });
    this.threadEl = thread;
    thread.setAttr("role", "log");
    thread.setAttr("aria-label", "Messages");
    this.scrollDownBtn = threadWrap.createDiv({
      cls: "messenger-scroll-down clickable-icon"
    });
    (0, import_obsidian12.setIcon)(this.scrollDownBtn, "arrow-down");
    this.scrollDownBtn.setAttribute("aria-label", "Jump to latest");
    this.newBelowEl = this.scrollDownBtn.createDiv({
      cls: "messenger-scroll-down-count"
    });
    this.paintNewBelow();
    this.scrollDownBtn.addEventListener("click", () => {
      this.clearNewBelow();
      thread.scrollTo({
        top: thread.scrollHeight,
        behavior: prefersReducedMotion() ? "auto" : "smooth"
      });
    });
    this.registerDomEvent(
      thread,
      "scroll",
      () => {
        const near = thread.scrollHeight - thread.scrollTop - thread.clientHeight < PINNED_PX;
        this.pinned = near;
        this.scrollDownBtn?.toggleClass("is-visible", !near);
        if (near) {
          this.scrollDownBtn?.removeClass("has-new");
          this.clearNewBelow();
        }
      },
      { passive: true }
    );
    this.registerDomEvent(thread, "click", (e) => {
      const src = lightboxSrc(e.target);
      if (src) {
        e.preventDefault();
        new ImageLightboxModal(this.app, src).open();
      }
    });
    const composerWrap = wrap.createDiv();
    await this.fillThread(thread, peer);
    thread.scrollTop = thread.scrollHeight;
    this.pinned = true;
    this.renderComposer(composerWrap, peer, name);
    this.unwatchKeyboard?.();
    this.unwatchKeyboard = watchKeyboard(this.contentEl, (opening) => {
      if (opening && this.pinned && this.threadEl) {
        this.threadEl.scrollTop = this.threadEl.scrollHeight;
      }
    });
  }
  async fillThread(thread, peer) {
    const me = this.plugin.settings.address;
    const messages = await this.conversationWith(peer);
    const registry = await this.plugin.store.readRegistry();
    const names = new Map(registry.map((r) => [r.address, r.name]));
    const receipts = parseReceipts(await this.plugin.store.readReceiptsRaw(peer));
    const byId = new Map(messages.map((m) => [m.id, m]));
    const keepScroll = thread.scrollTop > 0 ? thread.scrollTop : null;
    const keepPinned = thread.scrollHeight - thread.scrollTop - thread.clientHeight < PINNED_PX;
    const q = this.searchQuery.trim().toLowerCase();
    const filtered = q && this.searchOpen ? messages.filter(
      (m) => m.body.toLowerCase().includes(q) || m.from.toLowerCase().includes(q)
    ) : messages;
    if (this.threadSearchCount && this.threadSearchCount.isConnected) {
      this.threadSearchCount.setText(
        q ? `${filtered.length} of ${messages.length}` : ""
      );
    }
    thread.empty();
    if (messages.length === 0) {
      const empty = thread.createDiv({ cls: "messenger-empty" });
      (0, import_obsidian12.setIcon)(empty.createDiv({ cls: "messenger-empty-icon" }), "message-circle");
      empty.createDiv(
        { cls: "messenger-empty-text" },
        (el) => el.setText("No messages yet \u2014 say hi.")
      );
      return;
    }
    if (filtered.length === 0) {
      const empty = thread.createDiv({ cls: "messenger-empty" });
      (0, import_obsidian12.setIcon)(empty.createDiv({ cls: "messenger-empty-icon" }), "search-x");
      empty.createDiv(
        { cls: "messenger-empty-text" },
        (el) => el.setText(`No messages match \u201C${this.searchQuery.trim()}\u201D`)
      );
      return;
    }
    const fromIdx = Math.max(0, filtered.length - this.visibleCount);
    const shown = filtered.slice(fromIdx);
    const since = this.plugin.settings.readAt[peer] ?? "";
    const unreadIds = messages.filter((m) => m.from === peer && m.ts > since).map((m) => m.id);
    const unreadSet = new Set(unreadIds);
    const showDivider = unreadSet.size > 0 && this.unreadDividerPeer === peer && !q && // a narrowed search view has no meaningful "new" position
    this.searchOpen === false;
    if (fromIdx > 0) {
      const earlier = thread.createDiv({
        cls: "messenger-load-earlier clickable-icon"
      });
      earlier.setText(`Load ${fromIdx} earlier messages`);
      earlier.addEventListener(
        "click",
        () => void this.expandEarlier(thread, peer)
      );
    }
    const groupedWithNext = (i, msg) => {
      const next = shown[i + 1];
      return next !== void 0 && next.from === msg.from && sameDay(msg.ts, next.ts) && Date.parse(next.ts) - Date.parse(msg.ts) < GROUP_GAP_MS;
    };
    const epoch = this.plugin.settings.stripHtml ? "1" : "0";
    if (epoch !== this.bodyCacheEpoch) {
      this.bodyCacheEpoch = epoch;
      this.bodyCache.clear();
    }
    let prev = null;
    let dividerDone = false;
    const pending = [];
    for (let i = 0; i < shown.length; i++) {
      const msg = shown[i];
      if (!prev || !sameDay(prev.ts, msg.ts)) {
        thread.createDiv(
          { cls: "messenger-day" },
          (el) => el.setText(dayLabel(msg.ts))
        );
        prev = null;
      }
      const mine = msg.from === me;
      const grouped = prev !== null && prev.from === msg.from && Date.parse(msg.ts) - Date.parse(prev.ts) < GROUP_GAP_MS;
      const groupLast = !groupedWithNext(i, msg);
      if (showDivider && !dividerDone && unreadSet.has(msg.id)) {
        const divider = thread.createDiv(
          { cls: "messenger-unread-divider" },
          (el) => el.createSpan({ text: "New messages" })
        );
        divider.setAttribute("role", "button");
        divider.setAttribute("tabindex", "0");
        divider.addEventListener(
          "click",
          () => this.jumpToMessage(thread, msg.id)
        );
        dividerDone = true;
      }
      const row = thread.createDiv({
        cls: `messenger-msg ${mine ? "mine" : "theirs"}`
      });
      row.dataset.mid = msg.id;
      if (grouped) row.addClass("is-grouped");
      if (groupLast) row.addClass("is-group-last");
      const actions = row.createDiv({ cls: "messenger-msg-actions" });
      const replyBtn = actions.createDiv({
        cls: "messenger-msg-action clickable-icon"
      });
      (0, import_obsidian12.setIcon)(replyBtn, "reply");
      replyBtn.setAttribute("aria-label", "Reply");
      replyBtn.addEventListener("click", () => this.setReply(msg));
      if (!msg.encLocked) {
        const copyBtn = actions.createDiv({
          cls: "messenger-msg-action clickable-icon"
        });
        (0, import_obsidian12.setIcon)(copyBtn, "copy");
        copyBtn.setAttribute("aria-label", "Copy text");
        copyBtn.addEventListener("click", () => {
          void navigator.clipboard?.writeText(msg.body).then(() => new import_obsidian12.Notice("Copied message text")).catch(() => new import_obsidian12.Notice("Copy failed \u2014 select the text manually"));
        });
      }
      if (msg.exp || msg.bar) {
        const burn = actions.createDiv({ cls: "messenger-msg-burn" });
        (0, import_obsidian12.setIcon)(burn, "timer");
        burn.setAttribute("aria-label", burnLabel(msg));
        burn.title = burnLabel(msg);
      }
      if (!mine) {
        row.createDiv({ cls: "messenger-avatar messenger-avatar-sm" }, (el) => {
          paintAvatar(el, msg.from, this.plugin);
          el.addEventListener("click", () => void this.openConversation(msg.from));
        });
      }
      const col = row.createDiv({ cls: "messenger-msg-col" });
      if (!grouped) {
        const who = mine ? "You" : names.get(msg.from) ?? msg.from;
        const meta = col.createDiv({ cls: "messenger-msg-meta" });
        meta.createSpan({ text: `${who} \xB7 ${fmtTime(msg.ts)}` });
        if (!mine && msg.om2) {
          const slot = meta.createSpan({ cls: "messenger-om2-badge is-pending" });
          (0, import_obsidian12.setIcon)(slot, "shield");
          slot.setAttribute("aria-label", "Checking signature\u2026");
          void this.plugin.verifyMessage(msg).then((badge) => {
            if (!badge || !slot.isConnected) return;
            paintBadge(slot, badge);
          });
        } else if (!mine) {
          const badge = socialBadgeFor(msg);
          if (badge) paintBadge(meta.createSpan(), badge);
        }
      }
      const bubble = col.createDiv({ cls: "messenger-bubble" });
      if (msg.replyTo) {
        const original = byId.get(msg.replyTo);
        const quote = bubble.createDiv({ cls: "messenger-quote" });
        if (original) {
          quote.dataset.mid = original.id;
          const who = original.from === me ? "You" : names.get(original.from) ?? original.from;
          quote.setText(
            original.encLocked ? `\u21A9 ${who}: \u{1F512} encrypted message` : `\u21A9 ${who}: ${oneLine2(original.body, 60)}`
          );
          quote.addEventListener(
            "click",
            () => void this.revealMessage(peer, original.id)
          );
        } else {
          quote.setText("\u21A9 quoting an earlier message");
        }
      }
      if (msg.encLocked) {
        bubble.addClass("is-sealed");
        bubble.createDiv(
          { cls: "messenger-sealed" },
          (el) => el.setText("\u{1F512} Encrypted message \u2014 unlock Messenger to read it")
        );
      } else {
        const key = msg.id;
        const cached = this.bodyCache.get(key);
        if (cached) {
          bubble.append(...cached.map((n) => n.cloneNode(true)));
          if (q) this.highlightMatches(bubble, q);
        } else {
          pending.push({ msg, bubble, key, start: bubble.childNodes.length });
        }
        bubble.toggleClass("messenger-emoji-only", isEmojiOnly(expandShortcodes(msg.body)));
      }
      if (mine) this.renderStatus(col, receipts.get(msg.id));
      attachSwipeReply(row, () => this.setReply(msg));
      prev = msg;
    }
    if (pending.length > 0) {
      const sourcePath = this.plugin.store.inboxPath(peer);
      await Promise.all(
        pending.map(
          ({ msg, bubble, key, start }) => import_obsidian12.MarkdownRenderer.render(
            this.app,
            this.plugin.settings.stripHtml ? stripRawHtml(msg.body) : msg.body,
            bubble,
            sourcePath,
            this
          ).then(() => {
            emojify(bubble);
            this.rememberBody(key, bubble, start);
            if (q) this.highlightMatches(bubble, q);
          })
        )
      );
    }
    if (peer === this.peer) this.markRead(peer, unreadIds);
    if (keepScroll !== null && !keepPinned) thread.scrollTop = keepScroll;
  }
  /** Reveal one more page of history, holding the scroll anchor steady. */
  async expandEarlier(thread, peer) {
    const prevTop = thread.scrollTop;
    const prevHeight = thread.scrollHeight;
    this.visibleCount += PAGE_SIZE;
    await this.fillThread(thread, peer);
    thread.scrollTop = thread.scrollHeight - prevHeight + prevTop;
  }
  /**
   * Stash a clone of a fresh render, from `start` on so the quote chip (a
   * sibling added before the markdown) stays out of the cache. The live DOM
   * keeps getting mutated by search highlighting; the cache copy never is.
   */
  rememberBody(key, bubble, start) {
    if (this.bodyCache.size > 800) {
      let drop = 300;
      for (const k of this.bodyCache.keys()) {
        if (drop-- <= 0) break;
        this.bodyCache.delete(k);
      }
    }
    this.bodyCache.set(
      key,
      Array.from(bubble.childNodes).slice(start).map((n) => n.cloneNode(true))
    );
  }
  /** ✓ delivered / ✓✓ read, iMessage-style, under my outgoing bubbles. */
  renderStatus(col, entry) {
    if (!entry) return;
    const row = col.createDiv({
      cls: `messenger-status ${entry.state === "read" ? "is-read" : ""}`
    });
    const checks = entry.state === "read" ? 2 : 1;
    for (let i = 0; i < checks; i++) {
      (0, import_obsidian12.setIcon)(row.createSpan({ cls: "messenger-status-check" }), "check");
    }
    row.title = entry.state === "read" ? `Read ${fmtTime(entry.ts)}` : `Delivered ${fmtTime(entry.ts)}`;
  }
  /** Paint the jump button's "N new" pill from this.newBelow. */
  paintNewBelow() {
    this.newBelowEl?.setText(unreadBadgeLabel(this.newBelow));
    this.newBelowEl?.toggleClass("is-visible", this.newBelow > 0);
  }
  clearNewBelow() {
    if (this.newBelow === 0) return;
    this.newBelow = 0;
    this.paintNewBelow();
  }
  jumpToMessage(thread, mid) {
    const target = thread.querySelector(
      `[data-mid="${CSS.escape(mid)}"]`
    );
    if (!target) return;
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "center"
    });
    target.addClass("flash");
    window.setTimeout(() => target.removeClass("flash"), 1400);
  }
  /** Wrap case-insensitive query matches in rendered text with <mark>. */
  highlightMatches(el, q) {
    const needle = q.toLowerCase();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const targets = [];
    let node;
    while (node = walker.nextNode()) {
      const text = node;
      if (text.parentElement?.closest("code, pre, a, .messenger-quote")) continue;
      if (text.textContent && text.textContent.toLowerCase().includes(needle)) {
        targets.push(text);
      }
    }
    for (const text of targets) {
      const frag = createFragment();
      let rest = text.textContent ?? "";
      let lower = rest.toLowerCase();
      let idx = lower.indexOf(needle);
      while (idx >= 0) {
        frag.append(rest.slice(0, idx));
        frag.createEl("mark", {
          cls: "messenger-hl",
          text: rest.slice(idx, idx + q.length)
        });
        rest = rest.slice(idx + q.length);
        lower = rest.toLowerCase();
        idx = lower.indexOf(needle);
      }
      frag.append(rest);
      text.replaceWith(frag);
    }
  }
  // -- composer ----------------------------------------------------------------
  renderComposer(parent, peer, name) {
    const composer = parent.createDiv({ cls: "messenger-composer" });
    this.replyChipEl = composer.createDiv({ cls: "messenger-reply-chip" });
    this.replyChipEl.addClass("is-hidden");
    (0, import_obsidian12.setIcon)(this.replyChipEl.createDiv({ cls: "messenger-reply-icon" }), "reply");
    this.replyTextEl = this.replyChipEl.createDiv({ cls: "messenger-reply-text" });
    const cancel = this.replyChipEl.createDiv({
      cls: "messenger-reply-cancel clickable-icon"
    });
    (0, import_obsidian12.setIcon)(cancel, "x");
    cancel.setAttribute("aria-label", "Cancel reply");
    cancel.addEventListener("click", () => this.clearReply());
    const row = composer.createDiv({ cls: "messenger-composer-row" });
    const textarea = row.createEl("textarea", {
      cls: "messenger-composer-input",
      attr: {
        rows: "1",
        // soft keyboards have no Enter-to-send hint to offer
        placeholder: import_obsidian12.Platform.isMobile ? `Message ${name}\u2026` : `Message ${name}\u2026 (Enter to send)`,
        enterkeyhint: "send",
        autocapitalize: "sentences"
      }
    });
    this.textarea = textarea;
    textarea.value = this.plugin.settings.drafts[peer] ?? "";
    this.registerDomEvent(textarea, "paste", (e) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(
        (i) => i.kind === "file" && i.type.startsWith("image/")
      );
      const file = item?.getAsFile();
      if (!file) return;
      e.preventDefault();
      void this.saveAttachment(file, textarea);
    });
    this.registerDomEvent(composer, "dragover", (e) => {
      if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
    });
    this.registerDomEvent(composer, "drop", (e) => {
      const file = Array.from(e.dataTransfer?.files ?? []).find(
        (f) => f.type.startsWith("image/")
      );
      if (!file) return;
      e.preventDefault();
      void this.saveAttachment(file, textarea);
    });
    attachEmojiComposer(row, textarea, {
      getRecents: () => this.plugin.settings.recentEmoji,
      setRecents: (code) => this.saveRecentEmoji(code)
    });
    const burnBtn = row.createEl("button", {
      cls: "messenger-burn-btn clickable-icon",
      attr: { "aria-label": "Disappearing messages" }
    });
    (0, import_obsidian12.setIcon)(burnBtn, "timer");
    const paintBurnBtn = () => {
      burnBtn.toggleClass("is-active", this.burnChoice !== null);
      burnBtn.title = this.burnChoice ? `Disappearing: ${this.burnChoice.label}` : "Disappearing messages";
    };
    paintBurnBtn();
    burnBtn.addEventListener("click", (evt) => {
      const menu = new import_obsidian12.Menu();
      menu.addItem(
        (item) => item.setTitle("Keep messages").setChecked(this.burnChoice === null).onClick(() => {
          this.burnChoice = null;
          paintBurnBtn();
        })
      );
      menu.addSeparator();
      for (const choice of BURN_CHOICES) {
        menu.addItem(
          (item) => item.setTitle(choice.label).setChecked(
            this.burnChoice?.label === choice.label && this.burnChoice?.afterMs === choice.afterMs && this.burnChoice?.onReadSec === choice.onReadSec
          ).onClick(() => {
            this.burnChoice = choice;
            paintBurnBtn();
          })
        );
      }
      menu.showAtMouseEvent(evt);
    });
    const send = row.createEl("button", { cls: "messenger-send clickable-icon" });
    (0, import_obsidian12.setIcon)(send, isTouchPrimary() ? "arrow-up" : "send");
    send.setAttribute("aria-label", "Send");
    const refreshSendState = () => send.toggleClass("is-disabled", !textarea.value.trim());
    refreshSendState();
    const doSend = () => void this.sendCurrent(peer, textarea, send);
    send.addEventListener("click", doSend);
    this.registerDomEvent(textarea, "keydown", (e) => {
      if (e.defaultPrevented) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        doSend();
      }
    });
    this.registerDomEvent(textarea, "input", () => {
      this.plugin.settings.drafts[peer] = textarea.value;
      this.scheduleDraftSave();
      refreshSendState();
      textarea.setCssStyles({ height: "auto" });
      textarea.setCssStyles({
        height: `${Math.min(textarea.scrollHeight, composerMaxPx(textarea))}px`
      });
    });
  }
  /** Drafts persist like read state — debounced, flushed on close. */
  scheduleDraftSave() {
    if (this.draftTimer !== null) window.clearTimeout(this.draftTimer);
    this.draftTimer = window.setTimeout(() => {
      this.draftTimer = null;
      void this.plugin.saveSettings();
    }, SAVE_READ_DEBOUNCE_MS);
  }
  /**
   * Store a dropped/pasted image in the attachments folder and splice an
   * embed into the draft at the caret, the same way the emoji picker
   * commits a character.
   */
  async saveAttachment(file, textarea) {
    try {
      const folder = this.plugin.settings.attachmentsFolder;
      await this.plugin.ensureFolder(folder);
      const ext = (file.name.includes(".") ? file.name.split(".").pop() : "png")?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      const path = `${folder}/messenger-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      await this.plugin.app.vault.createBinary(path, await file.arrayBuffer());
      const embed = `![[${path}]]`;
      const from = textarea.selectionStart ?? textarea.value.length;
      const to = textarea.selectionEnd ?? from;
      textarea.value = textarea.value.slice(0, from) + embed + textarea.value.slice(to);
      const caret = from + embed.length;
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    } catch (err) {
      new import_obsidian12.Notice(
        `Couldn't attach image: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  setReply(msg) {
    this.replyTo = msg;
    if (!this.replyChipEl || !this.replyTextEl) return;
    const who = msg.from === this.plugin.settings.address ? "You" : msg.from;
    this.replyTextEl.setText(replyPreviewText(msg, who));
    this.replyChipEl.removeClass("is-hidden");
    if (!import_obsidian12.Platform.isMobile) this.textarea?.focus();
  }
  clearReply() {
    this.replyTo = null;
    this.replyChipEl?.addClass("is-hidden");
  }
  async sendCurrent(peer, textarea, send) {
    const body = textarea.value;
    if (this.sending || !body.trim()) return;
    this.sending = true;
    try {
      const burn = this.burnChoice;
      await this.plugin.bus.send(this.plugin.settings.address, peer, body, {
        replyTo: this.replyTo?.id ?? null,
        burnAfterMs: burn?.afterMs,
        burnOnReadSec: burn?.onReadSec
      });
      playSendSound();
      if (isTouchPrimary()) haptic(6);
      delete this.plugin.settings.drafts[peer];
      this.scheduleDraftSave();
      textarea.value = "";
      textarea.setCssStyles({ height: "" });
      send.toggleClass("is-disabled", true);
      this.clearReply();
      await this.refreshThreadOnly();
      await this.warnIfUnread(peer);
    } catch (err) {
      new import_obsidian12.Notice(`Send failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.sending = false;
      if (!import_obsidian12.Platform.isMobile) textarea.focus();
    }
  }
  /**
   * The append always "succeeds" — the trap is that on a device whose mail
   * folder isn't shared/synced, nothing anywhere will ever read it. Once per
   * peer per session, say so right after the first send, while the silence
   * is still explicable.
   */
  async warnIfUnread(peer) {
    if (this.voidWarned.has(peer)) return;
    this.voidWarned.add(peer);
    try {
      if (await this.plugin.isConfirmedRecipient(peer)) return;
      new import_obsidian12.Notice(
        `Sent \u2014 but nobody on this bus reads \u201C${peer}\u201D yet. Replies arrive only if both sides share one synced mail folder (Settings \u2192 Messenger \u2192 storage) \u2014 or connect by invite code (Settings \u2192 Messenger \u2192 Cross-vault mail).`,
        1e4
      );
    } catch {
    }
  }
  // -- appearance --------------------------------------------------------------
  /** Per-conversation wallpaper override, from the chat header. */
  openWallpaperMenu(peer, evt, threadWrap) {
    const menu = new import_obsidian12.Menu();
    const override = this.plugin.settings.wallpaperByPeer[peer];
    const choose = (id) => {
      const byPeer = this.plugin.settings.wallpaperByPeer;
      if (id === null) delete byPeer[peer];
      else byPeer[peer] = id;
      void this.plugin.saveSettings();
      applyWallpaper(threadWrap, peer, this.plugin);
    };
    menu.addItem(
      (item) => item.setTitle("Default").setChecked(override === void 0).onClick(() => choose(null))
    );
    menu.addItem(
      (item) => item.setTitle("None").setChecked(override === "none").onClick(() => choose("none"))
    );
    menu.addSeparator();
    for (const w of WALLPAPERS) {
      menu.addItem(
        (item) => item.setTitle(w.name).setChecked(override === w.id).onClick(() => choose(w.id))
      );
    }
    menu.addSeparator();
    const tintOverride = this.plugin.settings.wallpaperTintByPeer[peer];
    menu.addItem(
      (item) => item.setTitle("Tint color\u2026").setChecked(typeof tintOverride === "string" && tintOverride !== "").onClick(
        () => new ConversationTintModal(this.app, peer, this.plugin, threadWrap).open()
      )
    );
    if (tintOverride !== void 0) {
      menu.addItem(
        (item) => item.setTitle("Tint: use default").onClick(() => {
          delete this.plugin.settings.wallpaperTintByPeer[peer];
          void this.plugin.saveSettings();
          applyWallpaper(threadWrap, peer, this.plugin);
        })
      );
    }
    menu.showAtMouseEvent(evt);
  }
  /** Header avatar → set this peer's picture from a vault image. */
  async pickPeerAvatar(peer, el) {
    const path = await chooseVaultImage(this.app);
    if (path === null) return;
    this.plugin.settings.avatars[peer] = path;
    await this.plugin.saveSettings();
    paintAvatar(el, peer, this.plugin);
  }
  /**
   * The iMessage-style media sheet for this conversation: embeds from both
   * halves of the thread (bus.loadConversation merges them), resolved to
   * vault files, newest first. Sealed-and-locked bodies are skipped and
   * counted, never guessed at.
   */
  async openAttachmentSheet(peer, name) {
    const me = this.plugin.settings.address;
    const files = this.plugin.app.vault.getFiles();
    const messages = await this.plugin.bus.loadConversation(me, peer);
    const { items, skippedSealed } = conversationAttachments(
      messages,
      files.map((f) => ({ path: f.path, name: f.name }))
    );
    const byPath = new Map(files.map((f) => [f.path, f]));
    new ConversationAttachmentsModal(this.app, {
      title: peer === me ? `${name} (you)` : name,
      items: items.flatMap((item) => {
        const file = byPath.get(item.path);
        return file ? [{ file, from: item.from, ts: item.ts }] : [];
      }),
      skippedSealed,
      senderLabel: (addr) => addr === me ? "You" : peer === me ? "You" : name
    }).open();
  }
  /** Most recent first, deduped, capped — feeds the picker's "Recent" row. */
  saveRecentEmoji(code) {
    this.plugin.settings.recentEmoji = [
      code,
      ...this.plugin.settings.recentEmoji.filter((c) => c !== code)
    ].slice(0, 24);
    void this.plugin.saveSettings();
  }
};
function rememberedWindowInit(rect, screen) {
  const span = screen.extended ? Math.max(screen.width, screen.height) * 4 : screen.width;
  const spanY = screen.extended ? Math.max(screen.width, screen.height) * 4 : screen.height;
  const clamp2 = (n, min, max) => Math.min(max, Math.max(min, Math.round(n)));
  const width = typeof rect.width === "number" && Number.isFinite(rect.width) ? clamp2(rect.width, 320, Math.max(320, screen.width)) : void 0;
  const height = typeof rect.height === "number" && Number.isFinite(rect.height) ? clamp2(rect.height, 400, Math.max(400, screen.height)) : void 0;
  const out = {};
  if (width !== void 0 && height !== void 0) {
    out.size = { width, height };
  }
  const usableX = (x) => Number.isFinite(x) && x < span - 40 && x + (width ?? 440) > 40;
  const usableY = (y) => Number.isFinite(y) && y < spanY - 40 && y + (height ?? 720) > 40;
  if (typeof rect.x === "number" && usableX(rect.x)) out.x = Math.round(rect.x);
  if (typeof rect.y === "number" && usableY(rect.y)) out.y = Math.round(rect.y);
  return out;
}
function replyPreviewText(msg, who, max = 70) {
  return msg.encLocked ? `\u21A9 ${who}: \u{1F512} encrypted message` : `\u21A9 ${who}: ${oneLine2(msg.body, max)}`;
}
function unreadBadgeLabel(count) {
  if (count <= 0) return "";
  return count > 99 ? "99+" : String(count);
}
var ConversationTintModal = class extends import_obsidian12.Modal {
  constructor(app, peer, plugin, threadWrap) {
    super(app);
    this.peer = peer;
    this.plugin = plugin;
    this.threadWrap = threadWrap;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("messenger-tint-modal");
    contentEl.createEl("h3", { text: "Conversation tint" });
    contentEl.createDiv(
      { cls: "messenger-tint-note" },
      (el) => el.setText(
        "A soft color wash for this conversation only \u2014 it shows even with no wallpaper. Strength follows the Tint strength setting."
      )
    );
    const current = this.plugin.settings.wallpaperTintByPeer[this.peer] ?? (isHexColor2(this.plugin.settings.wallpaperTint) ? this.plugin.settings.wallpaperTint : "#8a9bb8");
    const input = contentEl.createEl("input", {
      cls: "messenger-tint-input",
      type: "color",
      attr: { "aria-label": "Tint color" }
    });
    input.value = current;
    const commit = async (value) => {
      if (value === null) delete this.plugin.settings.wallpaperTintByPeer[this.peer];
      else this.plugin.settings.wallpaperTintByPeer[this.peer] = value;
      await this.plugin.saveSettings();
      applyWallpaper(this.threadWrap, this.peer, this.plugin);
      this.close();
    };
    const row = contentEl.createDiv({ cls: "messenger-tint-row" });
    row.createEl("button", { text: "No tint here" }).addEventListener(
      "click",
      () => void commit("")
    );
    row.createEl("button", { text: "Use default tint" }).addEventListener(
      "click",
      () => void commit(null)
    );
    row.createEl("button", { text: "Apply", cls: "mod-cta" }).addEventListener("click", () => void commit(input.value));
  }
  onClose() {
    this.contentEl.empty();
  }
};
var isHexColor2 = (s) => /^#[0-9a-f]{6}$/i.test(s.trim());
function socialBadgeFor(msg) {
  try {
    const api = window.obsidianSocial;
    return api ? api.verify(msg) : null;
  } catch {
    return null;
  }
}
function paintBadge(icon, badge) {
  icon.className = `messenger-om2-badge is-${badge.state}`;
  (0, import_obsidian12.setIcon)(icon, badge.state === "invalid" ? "shield-alert" : "shield-check");
  if (badge.state === "verified") {
    icon.setAttribute("aria-label", `Signed & verified \u2014 ${badge.name}`);
  } else if (badge.state === "signed-unknown") {
    icon.setAttribute("aria-label", `Signed by an unpinned key (${badge.fp?.slice(0, 11)}\u2026)`);
  } else {
    icon.setAttribute("aria-label", `Signature check failed: ${badge.reason}`);
  }
}
var oneLine2 = (body, max) => {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}\u2026` : flat;
};
var startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
function sameDay(a, b) {
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}
function dayLabel(ts) {
  const d = new Date(ts);
  const diffDays = Math.round((startOfDay(/* @__PURE__ */ new Date()) - startOfDay(d)) / 864e5);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString(void 0, {
    hour: "numeric",
    minute: "2-digit"
  });
}
function invitationAgeDays(updated) {
  if (!updated) return null;
  const t = Date.parse(updated);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 864e5);
}
function fmtListTime(ts) {
  const d = new Date(ts);
  const days = Math.round((startOfDay(/* @__PURE__ */ new Date()) - startOfDay(d)) / 864e5);
  if (days <= 0) {
    return d.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString(void 0, { weekday: "long" });
  return d.toLocaleDateString(void 0, { month: "short", day: "numeric" });
}
var expandShortcodes = (body) => body.replace(/:([a-zA-Z0-9_+-]+):/g, (whole, key) => SHORTCODES.get(key) ?? whole);
var stripRawHtml = (body) => body.replace(
  /<\s*(script|iframe|object|embed|form|style)\b[\s\S]*?(?:<\/\s*\1\s*>|$)/gi,
  ""
).replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, "");

// src/om2/adapters.ts
var import_obsidian13 = require("obsidian");
function adapterKv(adapter, baseDir) {
  const base = (0, import_obsidian13.normalizePath)(baseDir);
  return {
    async read(path) {
      try {
        return await adapter.read((0, import_obsidian13.normalizePath)(`${base}/${path}`));
      } catch {
        return null;
      }
    },
    async write(path, data) {
      const full = (0, import_obsidian13.normalizePath)(`${base}/${path}`);
      try {
        await adapter.mkdir(base);
      } catch {
      }
      await adapter.write(full, data);
    }
  };
}
function mailboxMailStore(store) {
  return {
    async ensureInbox(address) {
      await store.ensureAddress(address);
    },
    async appendMessage(address, message) {
      await store.append(address, message);
    },
    async readInbox(address) {
      return store.readInbox(address);
    },
    async upsertRegistry(entry) {
      await store.upsertRegistry(entry);
    }
  };
}
function toOm2Contact(e) {
  if (!e.fp || !e.publicKey) return null;
  return {
    fp: e.fp,
    publicKey: e.publicKey,
    alias: e.address,
    displayName: e.name,
    relays: e.relays ? [...e.relays] : []
  };
}
var shortFp = (fp) => `${fp.slice(0, 11)}\u2026`;
function contactsBook(contacts, store) {
  const persist = async (entry) => {
    await contacts.upsert(entry);
    const fresh = await contacts.get(entry.address);
    const mapped = fresh ? toOm2Contact(fresh) : null;
    if (!mapped) throw new Error(`pin failed: could not persist contact ${entry.address}`);
    return mapped;
  };
  return {
    async all() {
      const list = await contacts.list();
      return list.map(toOm2Contact).filter((c) => c !== null);
    },
    async byFpGet(fp) {
      const list = await contacts.list();
      const hit = list.find((e) => e.fp === fp);
      return hit ? toOm2Contact(hit) ?? void 0 : void 0;
    },
    async pin(input) {
      const fp = fingerprint(input.publicKey);
      const publicKey = toB64u(input.publicKey);
      const existing = (await contacts.list()).find((e) => e.fp === fp);
      if (existing) {
        const relays = new Set(existing.relays ?? []);
        for (const r of input.relays) relays.add(r);
        const name = existing.name && existing.name !== existing.address ? existing.name : input.displayName ?? input.handle ?? existing.name;
        await persist({
          ...existing,
          name,
          publicKey,
          relays: [...relays],
          updated: (/* @__PURE__ */ new Date()).toISOString()
        });
        if (existing.state === "request" || existing.state === "pending") {
          await contacts.setState(existing.address, "mutual");
        }
        const fresh = await contacts.get(existing.address);
        const mapped = fresh ? toOm2Contact(fresh) : null;
        if (mapped) return mapped;
        throw new Error(`pin failed: could not persist contact ${existing.address}`);
      }
      const taken = /* @__PURE__ */ new Set([
        ...await store.listAddresses(),
        ...(await contacts.list()).map((e) => e.address)
      ]);
      let alias = aliasCandidate({ fp, handle: input.handle }, input.publicKey);
      if (taken.has(alias) || isReservedAddress(alias)) {
        alias = `${alias}-${collisionSuffix(input.publicKey)}`.slice(0, 64);
      }
      if (!ADDRESS_RE.test(alias) || isReservedAddress(alias) || taken.has(alias)) {
        alias = `fp-${collisionSuffix(input.publicKey)}`;
      }
      const entry = {
        address: alias,
        name: input.displayName ?? input.handle ?? shortFp(fp),
        state: "mutual",
        updated: (/* @__PURE__ */ new Date()).toISOString(),
        fp,
        publicKey,
        relays: [...new Set(input.relays)]
      };
      return persist(entry);
    }
  };
}

// src/om2/crypto/canon.ts
function sha256Hex2(input) {
  const bytes2 = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return bytesToHex(sha256(bytes2));
}
function sha256Bytes(input) {
  const bytes2 = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return sha256(bytes2);
}
function canonicalMessage(parts) {
  return [
    "om2.v1",
    parts.id,
    parts.from2,
    parts.to2,
    parts.ts,
    parts.replyTo ?? "",
    sha256Hex2(parts.body)
  ].join("|");
}
function canonicalAuth(parts) {
  return `om2.auth|v1|${parts.method}|${parts.resource}|${parts.ts}|${parts.nonce}`;
}

// src/om2/crypto/seal.ts
var import_tweetnacl3 = __toESM(require_nacl_fast());

// src/om2/crypto/ed2curve.ts
var import_tweetnacl2 = __toESM(require_nacl_fast());
var P2 = 2n ** 255n - 19n;
function bytesToBigIntLE(bytes2) {
  let x = 0n;
  for (let i = bytes2.length - 1; i >= 0; i--) x = x << 8n | BigInt(bytes2[i]);
  return x;
}
function bigIntToBytesLE(x, len) {
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = Number(x & 255n);
    x >>= 8n;
  }
  return out;
}
function modPow(base, exp, mod) {
  let result = 1n;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = result * b % mod;
    b = b * b % mod;
    e >>= 1n;
  }
  return result;
}
function convertSecretKey(edSecretKey) {
  const seed = edSecretKey.length === 64 ? edSecretKey.subarray(0, 32) : edSecretKey;
  const h = import_tweetnacl2.default.hash(seed);
  const scalar = h.slice(0, 32);
  scalar[0] &= 248;
  scalar[31] &= 127;
  scalar[31] |= 64;
  return scalar;
}
function convertPublicKey(edPublicKey) {
  const y = bytesToBigIntLE(edPublicKey) & (1n << 255n) - 1n;
  const num = (1n + y) % P2;
  const den = (1n - y + P2) % P2;
  const denInv = modPow(den, P2 - 2n, P2);
  return bigIntToBytesLE(num * denInv % P2, 32);
}

// src/om2/crypto/seal.ts
function sealTo(publicKeyEd, plaintext) {
  const ephemeral = import_tweetnacl3.default.box.keyPair();
  const shared = import_tweetnacl3.default.box.before(convertPublicKey(publicKeyEd), ephemeral.secretKey);
  const nonce = import_tweetnacl3.default.randomBytes(import_tweetnacl3.default.box.nonceLength);
  const ciphertext = import_tweetnacl3.default.box.after(new TextEncoder().encode(plaintext), nonce, shared);
  const blob = new Uint8Array(nonce.length + ephemeral.publicKey.length + ciphertext.length);
  blob.set(nonce, 0);
  blob.set(ephemeral.publicKey, nonce.length);
  blob.set(ciphertext, nonce.length + ephemeral.publicKey.length);
  return { box: toB642(blob) };
}
function openSealed(secretKeyEd, sealed) {
  try {
    const blob = fromB642(sealed.box);
    const head = import_tweetnacl3.default.box.nonceLength + import_tweetnacl3.default.box.publicKeyLength;
    if (blob.length < head + import_tweetnacl3.default.box.overheadLength) return null;
    const nonce = blob.subarray(0, import_tweetnacl3.default.box.nonceLength);
    const ephemeralPub = blob.subarray(import_tweetnacl3.default.box.nonceLength, head);
    const ciphertext = blob.subarray(head);
    const shared = import_tweetnacl3.default.box.before(ephemeralPub, convertSecretKey(secretKeyEd));
    const plaintext = import_tweetnacl3.default.box.open.after(ciphertext, nonce, shared);
    if (!plaintext) return null;
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}
function sealJson(publicKeyEd, value) {
  return sealTo(publicKeyEd, JSON.stringify(value));
}
function openJson(secretKeyEd, sealed) {
  const s = openSealed(secretKeyEd, sealed);
  if (s === null) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// src/om2/auth.ts
var import_tweetnacl4 = __toESM(require_nacl_fast());
function buildAuthHeader(identity, method, resource, ts = Date.now(), nonce = toB64u(import_tweetnacl4.default.randomBytes(12))) {
  const canonical = canonicalAuth({ method, resource, ts, nonce });
  const sig = import_tweetnacl4.default.sign.detached(new TextEncoder().encode(canonical), identity.secretKey);
  return `v1 pk=${toB64u(identity.publicKey)} ts=${ts} nonce=${nonce} sig=${toB642(sig)}`;
}

// src/om2/state.ts
var MAX_IDS = 4e3;
var QUARANTINE_CAP = 20;
var MAX_HELD_IDS = 200;
var STATE_VERSION = 2;
var BridgeState = class _BridgeState {
  constructor(kv, key, debounceMs = 500) {
    this.kv = kv;
    this.key = key;
    this.debounceMs = debounceMs;
    this.sent = /* @__PURE__ */ new Map();
    this.seen = /* @__PURE__ */ new Map();
    this.attempts = /* @__PURE__ */ new Map();
    this.outgoing = /* @__PURE__ */ new Map();
    this.quarantine = /* @__PURE__ */ new Map();
    this.blocked = /* @__PURE__ */ new Map();
    this.dirty = false;
    this.timer = null;
    this.unloading = false;
  }
  static async load(kv, key) {
    const state = new _BridgeState(kv, key);
    if (!kv) return state;
    try {
      const raw = await kv.read(key);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed) {
        for (const [k, v] of Object.entries(parsed.sent ?? {})) state.sent.set(k, v);
        for (const [k, v] of Object.entries(parsed.seen ?? {})) state.seen.set(k, v);
        for (const [k, v] of Object.entries(parsed.attempts ?? {})) state.attempts.set(k, v);
        for (const [k, v] of Object.entries(parsed.outgoing ?? {})) state.outgoing.set(k, v);
        for (const [k, v] of Object.entries(parsed.quarantine ?? {})) state.quarantine.set(k, v);
        for (const [k, v] of Object.entries(parsed.blocked ?? {})) state.blocked.set(k, v);
      }
    } catch {
    }
    return state;
  }
  /** Stop the debounced writer (plugin unload); a final flush may still be forced. */
  setUnloading() {
    this.unloading = true;
  }
  isSent(id) {
    return this.sent.has(id);
  }
  markSent(id) {
    this.trim(this.sent, id, Date.now());
  }
  isSeen(id) {
    return this.seen.has(id);
  }
  markSeen(id) {
    this.trim(this.seen, id, Date.now());
  }
  attemptFailed(id, err) {
    const prev = this.attempts.get(id);
    const n = (prev?.n ?? 0) + 1;
    this.attempts.set(id, { n, lastErr: err.slice(0, 300), ts: Date.now() });
    this.scheduleSave();
    return n;
  }
  attemptsOf(id) {
    return this.attempts.get(id)?.n ?? 0;
  }
  clearAttempt(id) {
    this.attempts.delete(id);
  }
  // ── first contact (docs/first-contact.md §2, §4) ────────────────────────
  outgoingHas(fp) {
    return this.outgoing.has(fp);
  }
  outgoingOf(fp) {
    return this.outgoing.get(fp);
  }
  markOutgoing(fp) {
    if (!this.outgoing.has(fp)) this.outgoing.set(fp, { ts: Date.now() });
    this.scheduleSave();
  }
  clearOutgoing(fp) {
    if (this.outgoing.delete(fp)) this.scheduleSave();
  }
  outgoingAll() {
    return [...this.outgoing.entries()];
  }
  quarantineGet(fp) {
    return this.quarantine.get(fp);
  }
  quarantineAll() {
    return [...this.quarantine.entries()];
  }
  /**
   * Record a verified knock. Over the cap the OLDEST-ts record is swept —
   * the sender whose request waited longest loses their slot (the relay's
   * 7-day retention is the outer bound; they can knock again).
   */
  quarantinePut(fp, rec) {
    if (!this.quarantine.has(fp) && this.quarantine.size >= QUARANTINE_CAP) {
      const oldest = [...this.quarantine.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
      if (oldest) this.quarantine.delete(oldest[0]);
    }
    this.quarantine.set(fp, rec);
    this.scheduleSave();
  }
  quarantineDelete(fp) {
    if (this.quarantine.delete(fp)) this.scheduleSave();
  }
  /**
   * Remember another relay entry to keep alive for this fp (the §4 hold
   * rule). Idempotent per entry — held boxes are re-polled every tick — and
   * bounded so a flood cannot grow the state file without limit.
   */
  quarantineAddHeld(fp, entryId) {
    const rec = this.quarantine.get(fp);
    if (!rec || rec.heldIds.includes(entryId)) return false;
    rec.heldIds.push(entryId);
    if (rec.heldIds.length > MAX_HELD_IDS) rec.heldIds.splice(0, rec.heldIds.length - MAX_HELD_IDS);
    this.scheduleSave();
    return true;
  }
  isBlocked(fp) {
    return this.blocked.has(fp);
  }
  markBlocked(fp) {
    this.trim(this.blocked, fp, Date.now());
  }
  trim(map, key, value) {
    if (map.size >= MAX_IDS) {
      const oldest = [...map.entries()].sort((a, b) => a[1] - b[1]).slice(0, MAX_IDS / 4);
      for (const [k] of oldest) map.delete(k);
    }
    map.set(key, value);
    this.scheduleSave();
  }
  scheduleSave() {
    this.dirty = true;
    if (this.timer || this.unloading) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.debounceMs);
  }
  async flush() {
    if (!this.kv || !this.dirty) return;
    this.dirty = false;
    const file = {
      version: STATE_VERSION,
      sent: Object.fromEntries(this.sent),
      seen: Object.fromEntries(this.seen),
      attempts: Object.fromEntries(this.attempts),
      outgoing: Object.fromEntries(this.outgoing),
      quarantine: Object.fromEntries(this.quarantine),
      blocked: Object.fromEntries(this.blocked)
    };
    await this.kv.write(this.key, JSON.stringify(file));
  }
};

// src/om2/bridge.ts
var BOUNCE_FROM = "bridge";
var DEFAULT_REQUEST_NOTE = "Hi \u2014 I'd like to add you as a contact on Obsidian Messenger.";
var ACCEPT_REPLY_NOTE = "Contact request accepted \u2014 this conversation is now mutual.";
var OUTGOING_TTL_MS = 14 * 24 * 60 * 60 * 1e3;
var Bridge = class {
  constructor(opts) {
    this.opts = opts;
    this.state = null;
    this.inboundTimer = null;
    this.outboundTimer = null;
    this.stopped = false;
    this.inFlightInbound = false;
    this.inFlightOutbound = false;
    this.localAddress = opts.localAddress ?? "owner";
    this.stateKey = opts.stateKey ?? "bridge-state.json";
    this.inboundPollMs = opts.inboundPollMs ?? 6e4;
    this.outboundPollMs = opts.outboundPollMs ?? 5e3;
    this.maxSendAttempts = opts.maxSendAttempts ?? 3;
    this.requestAttempts = Math.max(1, opts.requestAttempts ?? 3);
    this.requestRetryDelayMs = Math.max(0, opts.requestRetryDelayMs ?? 500);
    this.log = opts.log ?? (() => {
    });
    this.onEvent = opts.onEvent ?? (() => {
    });
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.myFp = fingerprint(opts.identity.publicKey);
  }
  async start() {
    this.stopped = false;
    this.state = await BridgeState.load(this.opts.kv, this.stateKey);
    await this.opts.mail.ensureInbox(this.localAddress);
    await this.ensureContactFolders();
    this.scheduleInbound(jitter(this.inboundPollMs));
    this.outboundTimer = setTimeout(() => void this.outboundTick(), 200);
  }
  async stop() {
    this.stopped = true;
    if (this.inboundTimer) clearTimeout(this.inboundTimer);
    if (this.outboundTimer) clearTimeout(this.outboundTimer);
    this.inboundTimer = this.outboundTimer = null;
    this.state?.setUnloading();
    await this.state?.flush();
  }
  /** Create the drop-box inbox for each pinned contact so users can find it. */
  async ensureContactFolders() {
    for (const contact of await this.opts.contacts.all()) {
      await this.opts.mail.ensureInbox(contact.alias);
      await this.opts.mail.upsertRegistry({
        address: contact.alias,
        name: contact.displayName ?? contact.handle ?? `${contact.fp.slice(0, 11)}\u2026 (remote)`,
        updated: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  // ── first contact: request / accept / decline (docs/first-contact.md §4) ─
  /**
   * Send a sealed, self-signed introduction to a bare public key — the
   * REQUESTED state (§2). Needs no pinned contact and creates no alias
   * folder: pinning happens only when THEY reply and the reply passes the
   * ladder (the only auto-pin in the system). The post is retried a few
   * times inline (a briefly-down relay must not eat the knock); on total
   * failure it throws — there is no local bounce, because the request
   * exists nowhere but here.
   *
   * Returns the derived fingerprint (the key you'll wait for) and the intro
   * message id. The intro carries our own relay as the return address (§9).
   */
  async sendRequest(publicKey, relay, note) {
    if (!this.state) throw new Error("bridge not started");
    const fp = fingerprint(publicKey);
    if (fp === this.myFp) throw new Error("cannot send a contact request to yourself");
    const wire = {
      id: newMessageId(),
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      replyTo: null,
      from: {
        fp: this.myFp,
        handle: this.opts.handle,
        pk: toB64u(this.opts.identity.publicKey),
        relay: this.opts.relayUrl
      },
      to: fp,
      body: note ?? DEFAULT_REQUEST_NOTE,
      sig: ""
    };
    wire.sig = toB642(
      signDetached(
        this.opts.identity,
        canonicalMessage({
          id: wire.id,
          from2: wire.from.handle ?? wire.from.fp,
          to2: wire.to,
          ts: wire.ts,
          replyTo: wire.replyTo,
          body: wire.body
        })
      )
    );
    const box = sealJson(publicKey, wire).box;
    let ok = false;
    let lastErr = "unknown error";
    for (let n = 1; n <= this.requestAttempts; n++) {
      try {
        if (await this.postOutbox(relay, fp, box)) {
          ok = true;
          break;
        }
        lastErr = `relay ${relay} rejected the contact request`;
      } catch (err) {
        lastErr = String(err instanceof Error ? err.message : err);
      }
      if (n < this.requestAttempts && this.requestRetryDelayMs > 0) {
        await new Promise((r) => setTimeout(r, this.requestRetryDelayMs));
      }
    }
    if (!ok) {
      throw new Error(`contact request failed after ${this.requestAttempts} attempts: ${lastErr}`);
    }
    this.state.markOutgoing(fp);
    this.log(`contact request sent to ${fp} via ${relay}`);
    return { fp, id: wire.id };
  }
  /**
   * Accept a quarantined request: pin the key that arrived verified inside
   * the sealed intro (OM-2 §4 "first successful exchange pins the key"),
   * drop the quarantine, and let the held relay entries flow — the hold rule
   * keys off quarantine membership, so the next inbound tick flushes them
   * through the normal deliver() path with no extra machinery.
   *
   * The requester is pinned with the return address their intro carried
   * (§9): a sealed box from a pinned sender is still opaque, so the relay
   * they posted through is the only hint where their inbox lives — but it is
   * the hint THEY chose, and only they could have sealed it in.
   */
  async accept(fp) {
    if (!this.state) throw new Error("bridge not started");
    const rec = this.state.quarantineGet(fp);
    if (!rec) throw new Error(`no pending contact request from ${fp}`);
    const contact = await this.opts.contacts.pin({
      publicKey: fromB64u(rec.publicKey),
      handle: rec.handle,
      relays: rec.relay ? [rec.relay] : []
    });
    this.state.clearOutgoing(fp);
    this.state.quarantineDelete(fp);
    await this.ensureContactFolders();
    await this.sendAcceptReply(contact, rec);
  }
  /**
   * The accepter's half of the handshake (§2): one signed sealed system line
   * through the normal sendBlock path, so the requester's bridge sees a
   * verified reply against a pending `outgoing[fp]` and auto-pins.
   */
  async sendAcceptReply(contact, rec) {
    const env = {
      id: newMessageId(),
      from: this.localAddress,
      to: contact.alias,
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      replyTo: rec.firstId,
      body: ACCEPT_REPLY_NOTE
    };
    await this.opts.mail.appendMessage(contact.alias, env);
    await this.sendBlock(contact, env);
    this.log(`accepted contact request \u2014 auto-reply sent to ${contact.alias}`);
  }
  /**
   * Decline a quarantined request: DELETE every held relay entry for the fp
   * (heldIds is the only way to identify them — entries are opaque sealed
   * boxes), then block the fp so later boxes are ignored silently forever
   * (§3.3 behavior restored).
   */
  async decline(fp) {
    if (!this.state) throw new Error("bridge not started");
    const rec = this.state.quarantineGet(fp);
    if (!rec) throw new Error(`no pending contact request from ${fp}`);
    for (const id of rec.heldIds) {
      await this.deleteEntry(id).catch(() => {
      });
    }
    this.state.clearOutgoing(fp);
    this.state.quarantineDelete(fp);
    this.state.markBlocked(fp);
    this.log(`declined contact request from ${fp}`);
  }
  /** Quarantined requests, for the contact-requests UI and tests. */
  quarantineList() {
    return (this.state?.quarantineAll() ?? []).map(([fp, rec]) => ({ fp, ...rec }));
  }
  /** Fps we've sent a request to and still await a reply from. */
  outgoingList() {
    return (this.state?.outgoingAll() ?? []).map(([fp]) => fp);
  }
  isBlocked(fp) {
    return this.state?.isBlocked(fp) ?? false;
  }
  // ── outbound ────────────────────────────────────────────────────────────
  async outboundTick() {
    if (this.stopped) return;
    if (!this.inFlightOutbound) {
      this.inFlightOutbound = true;
      try {
        await this.scanOutbound();
      } catch (err) {
        this.log(`outbound scan error: ${String(err)}`);
      } finally {
        this.inFlightOutbound = false;
      }
    }
    this.outboundTimer = setTimeout(() => void this.outboundTick(), jitter(this.outboundPollMs));
  }
  async scanOutbound() {
    if (!this.state) return;
    for (const contact of await this.opts.contacts.all()) {
      const blocks = await this.opts.mail.readInbox(contact.alias);
      for (const block2 of blocks) {
        if (this.state.isSent(block2.id)) continue;
        if (block2.from === BOUNCE_FROM) continue;
        if (block2.enc) continue;
        await this.sendBlock(contact, block2);
      }
    }
  }
  async sendBlock(contact, block2) {
    if (!this.state) return;
    const wire = {
      id: block2.id,
      ts: block2.ts,
      replyTo: block2.replyTo,
      from: {
        fp: this.myFp,
        handle: this.opts.handle,
        // Always carried (docs/first-contact.md §3): lets an unpinned
        // recipient quarantine us as a request, and lets a recipient with a
        // pending outgoing request auto-pin us on this reply. Our relay rides
        // along (§9) so a first-contact reply knows where to come back to.
        pk: toB64u(this.opts.identity.publicKey),
        relay: this.opts.relayUrl
      },
      to: contact.fp,
      body: block2.body,
      sig: ""
    };
    wire.sig = toB642(
      signDetached(
        this.opts.identity,
        canonicalMessage({
          id: wire.id,
          from2: wire.from.handle ?? wire.from.fp,
          to2: wire.to,
          ts: wire.ts,
          replyTo: wire.replyTo,
          body: wire.body
        })
      )
    );
    const payload = sealJson(fromB64u(contact.publicKey), wire);
    let lastErr = "unknown error";
    let delivered = false;
    const noRelayOnFile = contact.relays.length === 0;
    for (const relay of noRelayOnFile ? [this.opts.relayUrl] : contact.relays) {
      try {
        const ok = await this.postOutbox(relay, contact.fp, payload.box);
        if (ok) {
          delivered = true;
          break;
        }
        lastErr = "relay rejected the message";
      } catch (err) {
        lastErr = String(err instanceof Error ? err.message : err);
      }
    }
    if (delivered) {
      this.state.markSent(block2.id);
      this.state.clearAttempt(block2.id);
      this.log(`sent ${block2.id} \u2192 ${contact.alias}`);
      return;
    }
    const attempts = this.state.attemptFailed(block2.id, lastErr);
    this.log(`send failed for ${block2.id} (attempt ${attempts}): ${lastErr}`);
    if (attempts >= this.maxSendAttempts) {
      const reason = noRelayOnFile ? "no relay on file for this contact (an older client may have omitted it) \u2014 your own relay was tried as a fallback, but they never poll it. Ask them to re-share their invite code." : lastErr;
      await this.bounce(block2, contact, reason);
      this.state.markSent(block2.id);
      this.state.clearAttempt(block2.id);
      this.onEvent({ type: "bounce", id: block2.id, alias: contact.alias, reason });
    }
  }
  async postOutbox(relayUrl, toFp, box) {
    const url = `${relayUrl.replace(/\/$/, "")}/outbox`;
    const auth = buildAuthHeader(this.opts.identity, "POST", "outbox");
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-om2-auth": auth },
      body: JSON.stringify({ to: toFp, box })
    });
    return res.status === 201;
  }
  async bounce(block2, contact, reason) {
    await this.opts.mail.appendMessage(block2.from, {
      id: newMessageId(),
      from: BOUNCE_FROM,
      to: block2.from,
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      replyTo: block2.id,
      body: `Delivery failed: your message \`${block2.id}\` to \`${contact.alias}\` could not be delivered after ${this.maxSendAttempts} attempts.

Reason: ${reason}

The message block is still in \`${contact.alias}/inbox.md\`.`
    });
  }
  // ── inbound ─────────────────────────────────────────────────────────────
  scheduleInbound(delay) {
    if (this.stopped) return;
    this.inboundTimer = setTimeout(() => {
      void this.inboundTick().finally(() => this.scheduleInbound(jitter(this.inboundPollMs)));
    }, delay);
  }
  async inboundTick() {
    if (this.stopped || !this.state || this.inFlightInbound) return;
    this.inFlightInbound = true;
    try {
      const list = await this.relayList();
      for (const entry of list) {
        await this.processEntry(entry.id);
      }
    } catch (err) {
      this.log(`inbound poll error: ${String(err)}`);
    } finally {
      this.inFlightInbound = false;
    }
  }
  async relayList() {
    const url = `${this.opts.relayUrl.replace(/\/$/, "")}/inbox/${this.myFp}`;
    const auth = buildAuthHeader(this.opts.identity, "GET", `inbox/${this.myFp}`);
    const res = await this.fetchImpl(url, { headers: { "x-om2-auth": auth } });
    if (res.status !== 200) throw new Error(`relay list failed: ${res.status}`);
    const body = await res.json();
    return body.entries ?? [];
  }
  async processEntry(entryId) {
    if (!this.state) return;
    const resource = `inbox/${this.myFp}/${entryId}`;
    const base = `${this.opts.relayUrl.replace(/\/$/, "")}/inbox/${this.myFp}/${entryId}`;
    const getAuth = buildAuthHeader(this.opts.identity, "GET", resource);
    const getRes = await this.fetchImpl(base, { headers: { "x-om2-auth": getAuth } });
    if (getRes.status === 404) {
      return;
    }
    if (getRes.status !== 200) throw new Error(`relay fetch failed: ${getRes.status}`);
    const sealed = await getRes.json();
    const outcome = await this.deliver(sealed.box, entryId);
    if (outcome.status === "appended" && outcome.innerId) this.state.markSeen(outcome.innerId);
    switch (outcome.status) {
      case "appended":
        await this.deleteEntry(entryId);
        this.log(`received ${outcome.innerId} from ${outcome.alias}`);
        break;
      case "duplicate":
        await this.deleteEntry(entryId);
        this.log(`duplicate inbound ${outcome.innerId} \u2014 skipped`);
        break;
      case "rejected":
        await this.deleteEntry(entryId);
        this.log(`rejected inbound ${entryId}: ${outcome.reason}`);
        break;
      case "poison":
        await this.deleteEntry(entryId);
        break;
      case "keychange":
        await this.deleteEntry(entryId);
        this.log(
          `KEY CHANGE: pinned contact ${outcome.fp} announced a new key \u2014 quarantined for review, nothing re-pinned silently`
        );
        this.onEvent({ type: "keychange", fp: outcome.fp ?? "", publicKey: outcome.pk ?? "" });
        break;
      case "quarantined":
        this.log(`contact request from ${outcome.fp} quarantined \u2014 awaiting your decision`);
        this.onEvent({
          type: "quarantined",
          fp: outcome.fp ?? "",
          publicKey: outcome.pk ?? "",
          innerId: outcome.innerId
        });
        break;
      case "held":
      case "blocked":
        break;
    }
  }
  async deleteEntry(entryId) {
    const resource = `inbox/${this.myFp}/${entryId}`;
    await this.fetchImpl(`${this.opts.relayUrl.replace(/\/$/, "")}/inbox/${this.myFp}/${entryId}`, {
      method: "DELETE",
      headers: { "x-om2-auth": buildAuthHeader(this.opts.identity, "DELETE", resource) }
    });
  }
  async deliver(box, entryId) {
    if (!this.state) return { status: "poison", innerId: "" };
    const wire = openJson(this.opts.identity.secretKey, { box });
    if (!wire || !this.wireWellFormed(wire)) {
      return { status: "poison", innerId: "" };
    }
    const canonical = canonicalMessage({
      id: wire.id,
      from2: wire.from.handle ?? wire.from.fp,
      to2: wire.to,
      ts: wire.ts,
      replyTo: wire.replyTo,
      body: wire.body
    });
    const sig = safeSigBytes(wire.sig);
    const contact = await this.opts.contacts.byFpGet(wire.from.fp);
    if (contact) {
      if (!sig || !verifyDetached(fromB64u(contact.publicKey), sig, canonical)) {
        return {
          status: "rejected",
          innerId: wire.id,
          reason: "signature verification failed"
        };
      }
      if (wire.from.pk && wire.from.pk !== contact.publicKey) {
        this.state.quarantinePut(wire.from.fp, {
          publicKey: wire.from.pk,
          handle: wire.from.handle,
          firstId: wire.id,
          ts: Date.now(),
          heldIds: [],
          relay: wire.from.relay
        });
        return { status: "keychange", innerId: wire.id, fp: wire.from.fp, pk: wire.from.pk };
      }
      if (this.state.isSeen(wire.id)) return { status: "duplicate", innerId: wire.id };
      await this.appendInbound(contact, wire);
      return { status: "appended", innerId: wire.id, alias: contact.alias };
    }
    if (this.state.isBlocked(wire.from.fp)) {
      return { status: "blocked", innerId: wire.id, fp: wire.from.fp };
    }
    if (this.state.quarantineGet(wire.from.fp)) {
      this.state.quarantineAddHeld(wire.from.fp, entryId);
      return { status: "held", innerId: wire.id };
    }
    const pkStr = typeof wire.from.pk === "string" ? wire.from.pk : null;
    const pkBytes = pkStr ? safePkBytes(pkStr) : null;
    const verified = pkStr !== null && pkBytes !== null && fingerprint(pkBytes) === wire.from.fp && sig !== null && verifyDetached(pkBytes, sig, canonical);
    if (pkStr && pkBytes && verified) {
      const pending = this.state.outgoingOf(wire.from.fp);
      if (pending && Date.now() - pending.ts > OUTGOING_TTL_MS) {
        this.state.clearOutgoing(wire.from.fp);
      }
      if (this.state.outgoingHas(wire.from.fp)) {
        const pinned = await this.opts.contacts.pin({
          publicKey: pkBytes,
          handle: wire.from.handle,
          relays: wire.from.relay ? [wire.from.relay] : []
        });
        this.state.clearOutgoing(wire.from.fp);
        await this.ensureContactFolders();
        this.log(`auto-pinned ${wire.from.fp} \u2014 first valid reply to our request`);
        this.onEvent({ type: "autopinned", fp: wire.from.fp, alias: pinned.alias });
        if (this.state.isSeen(wire.id)) return { status: "duplicate", innerId: wire.id };
        await this.appendInbound(pinned, wire);
        return { status: "appended", innerId: wire.id, alias: pinned.alias };
      }
      this.state.quarantinePut(wire.from.fp, {
        publicKey: pkStr,
        handle: wire.from.handle,
        firstId: wire.id,
        ts: Date.now(),
        heldIds: [entryId],
        relay: wire.from.relay
      });
      return { status: "quarantined", innerId: wire.id, fp: wire.from.fp, pk: pkStr };
    }
    const reason = !wire.from.pk ? "unsigned (no from.pk carried)" : !pkBytes ? "carried from.pk is not a valid Ed25519 key" : "fingerprint does not match the carried key, or signature verification failed";
    return { status: "rejected", innerId: wire.id, reason };
  }
  /** Append a verified wire as an ordinary OM-1 block for the local owner (§3.3 inbound). */
  async appendInbound(contact, wire) {
    const env = {
      id: wire.id,
      from: contact.alias,
      to: this.localAddress,
      ts: wire.ts,
      replyTo: wire.replyTo,
      body: wire.body,
      om2: {
        v: 2,
        from2: wire.from.handle ?? wire.from.fp,
        to2: wire.to,
        sender: contact.publicKey,
        sig: wire.sig
      }
    };
    await this.opts.mail.appendMessage(this.localAddress, env);
  }
  wireWellFormed(wire) {
    return typeof wire.id === "string" && wire.id.length > 0 && typeof wire.ts === "string" && !Number.isNaN(Date.parse(wire.ts)) && typeof wire.to === "string" && wire.to === this.myFp && typeof wire.from?.fp === "string" && (wire.from.handle === void 0 || typeof wire.from.handle === "string") && (wire.from.pk === void 0 || typeof wire.from.pk === "string") && (wire.from.relay === void 0 || typeof wire.from.relay === "string") && typeof wire.body === "string" && typeof wire.sig === "string" && !`${wire.id}${wire.from.fp}${wire.to}${wire.ts}`.includes("|") && !wire.body.includes("<!-- /messenger -->");
  }
};
function safePkBytes(pk) {
  try {
    const bytes2 = fromB64u(pk);
    return bytes2.length === 32 ? bytes2 : null;
  } catch {
    return null;
  }
}
function safeSigBytes(sig) {
  try {
    return fromB642(sig);
  } catch {
    return null;
  }
}
function jitter(ms) {
  return Math.max(50, Math.round(ms * (0.9 + Math.random() * 0.2)));
}

// src/om2/identity-store.ts
var import_tweetnacl5 = __toESM(require_nacl_fast());
var IDENTITY_KEY = "identity.json";
async function createIdentityRecord(passcode, iterations = PBKDF2_ITERATIONS, kdf = DEFAULT_KDF) {
  const seed = import_tweetnacl5.default.randomBytes(32);
  const identity = identityFromSeed(seed);
  zeroKeyMaterial(seed);
  const bundle = await rewrapRawVaultKey(identity.secretKey.slice(0, 32), passcode, iterations, kdf);
  return {
    record: { version: 1, keySalt: bundle.keySalt, wrappedKey: bundle.wrappedKey, publicKey: toB64u(identity.publicKey), kdf },
    identity
  };
}
async function openIdentityRecord(record, passcode, iterations = PBKDF2_ITERATIONS, kdf = record.kdf ?? LEGACY_KDF) {
  const seed = await unwrapRawVaultKey(passcode, record.keySalt, record.wrappedKey, iterations, kdf);
  const identity = identityFromSeed(seed);
  zeroKeyMaterial(seed);
  if (!identityValid(identity)) {
    identity.secretKey.fill(0);
    throw new Error("identity record is corrupt (public key does not match the seed)");
  }
  return identity;
}
async function regenerateIdentityRecord(passcode, iterations = PBKDF2_ITERATIONS) {
  return createIdentityRecord(passcode, iterations);
}
function wipeIdentity(identity) {
  if (!identity) return;
  identity.secretKey.fill(0);
  identity.publicKey.fill(0);
}
async function saveIdentityRecord(kv, record) {
  await kv.write(IDENTITY_KEY, JSON.stringify(record));
}
async function loadIdentityRecord(kv) {
  const raw = await kv.read(IDENTITY_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || typeof parsed.keySalt !== "string" || typeof parsed.wrappedKey !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
async function clearIdentityRecord(kv) {
  await kv.write(IDENTITY_KEY, "null");
}

// src/om2/runtime.ts
async function verifyEnvelope(msg, contacts) {
  if (!msg.om2) return null;
  const { om2 } = msg;
  let publicKey;
  try {
    publicKey = fromB64u(om2.sender);
  } catch {
    return { state: "invalid", reason: "sender key is not valid base64url" };
  }
  const canonical = canonicalMessage({
    id: msg.id,
    from2: om2.from2,
    to2: om2.to2,
    ts: msg.ts,
    replyTo: msg.replyTo,
    body: msg.body
  });
  let sig;
  try {
    sig = fromB642(om2.sig);
  } catch {
    return { state: "invalid", reason: "signature is not valid base64" };
  }
  if (!verifyDetached(publicKey, sig, canonical)) {
    return { state: "invalid", reason: "signature does not verify" };
  }
  if (contacts) {
    const all = await contacts.all();
    const contact = all.find((c) => c.publicKey === om2.sender || c.fp === om2.from2);
    if (contact) return { state: "verified", name: contact.displayName ?? contact.alias };
  }
  return { state: "signed-unknown", fp: fingerprint(publicKey) };
}
function safetyNumber(myPub, theirPub) {
  const a = myPub.slice().sort();
  const b = theirPub.slice().sort();
  const first = compare(a, b) <= 0 ? a : b;
  const second = compare(a, b) <= 0 ? b : a;
  const digest = sha256Bytes(new Uint8Array([...first, ...second]));
  let digits = "";
  for (let i = 0; i < 15 && digits.length < 30; i++) {
    digits += String(digest[i * 2] << 8 | digest[i * 2 + 1]).padStart(5, "0");
  }
  return digits.slice(0, 30).replace(/(\d{3})(?=\d)/g, "$1 ");
}
function compare(x, y) {
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    if (x[i] !== y[i]) return x[i] - y[i];
  }
  return x.length - y.length;
}

// src/main.ts
var GC_EVERY_MS = 60 * 60 * 1e3;
var SEND_BURST_EVERY_MS = 1e3;
var SEND_BURST_FOR_MS = 3e4;
var MAINTAIN_EVERY_MS = 12e4;
var BURN_SWEEP_DEBOUNCE_MS = 2e3;
var SEEN_IDS_MAX = 1e3;
var ObsidianMessengerPlugin = class extends import_obsidian14.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.lastPump = 0;
    this.lastGc = 0;
    this.lastAdopt = 0;
    /** Set by focus/resume/modify events — the next heartbeat passes the gate. */
    this.pumpRequested = false;
    /** Deadline while polling runs fast because this bus just sent mail. */
    this.burstUntil = 0;
    /** Recently dispatched ids — retransmitted mail must not re-announce. */
    this.seenIds = /* @__PURE__ */ new Set();
    this.ribbonIcon = null;
    this.pendingDelivered = /* @__PURE__ */ new Set();
    this.receiptTimer = null;
    this.burnSweepTimer = null;
    /** One burn sweep at a time — see burnSweep for why overlap is refused. */
    this.burnSweepBusy = false;
    this.burnSweepQueued = false;
    /**
     * Level-1 security: whether the Messenger UI is behind the passcode right
     * now. Session state only — lockOnStart re-engages it on every load.
     */
    this.locked = false;
    /** Peers whose conversation lock was satisfied this session (in-memory). */
    this.unlockedPeers = /* @__PURE__ */ new Set();
    /**
     * The vault key for at-rest sealing (SPEC §15), held only between unlock
     * and lock/unload. Null means sealed bodies read back locked.
     */
    this.cipher = null;
    /** The signing identity, in memory only between unlock and lock/unload. */
    this.om2Identity = null;
    /** The relay bridge, while cross-vault mail is enabled and unlocked. */
    this.om2Bridge = null;
    /** Why the last openPopoutLeaf fell back to an in-app leaf, for diagnostics. */
    this.lastPopoutError = null;
    /** The detached chat window, while one is open — geometry capture target. */
    this.chatWin = null;
    this.chatWinSaveTimer = null;
    // ── cross-vault mail (OM-2) ──────────────────────────────────────────────
    /** The contact-book view the bridge and the badge verifier read. */
    this.om2Book = null;
  }
  async onload() {
    await this.loadSettings();
    if (this.settings.encryptMail && !webcryptoAvailable()) {
      this.settings.encryptMail = false;
      await this.saveSettings();
      new import_obsidian14.Notice("Messenger: message encryption needs WebCrypto \u2014 disabled here");
    }
    if (this.settings.encryptMail && this.settings.passcodeHash) {
      this.settings.passcodeHash = "";
      this.settings.passcodeSalt = "";
      await this.saveSettings();
    }
    this.locked = this.hasPasscode() && (this.settings.lockOnStart || this.settings.encryptMail);
    const root = await this.settleStorageRoot();
    this.store = new MailboxStore(this.app.vault.adapter, root);
    this.contacts = new ContactsStore(this.app.vault.adapter, root);
    this.bus = new MailBus(this.store, {
      onError: (err, address) => {
        console.error(`[message-bus] handler error (${address})`, err);
        if (this.settings.debug) {
          new import_obsidian14.Notice(`Messenger: handler error in ${address} \u2014 see console`);
        }
      },
      onDispatch: (message) => {
        if (this.seenIds.has(message.id)) return;
        this.rememberId(message.id);
        void this.applyContactGate(message);
        this.app.workspace.trigger("messenger:message", message);
        this.onDelivered(message);
        void this.maybeNotify(message);
      },
      onSend: (message) => {
        this.burstUntil = Date.now() + SEND_BURST_FOR_MS;
        this.pumpRequested = true;
        this.settings.unacked[message.id] = {
          message,
          sentAt: (/* @__PURE__ */ new Date()).toISOString(),
          attempts: 0
        };
        const ids = Object.keys(this.settings.unacked);
        if (ids.length > 50) {
          ids.sort(
            (a, b) => (this.settings.unacked[a]?.sentAt ?? "").localeCompare(
              this.settings.unacked[b]?.sentAt ?? ""
            )
          ).slice(0, ids.length - 50).forEach((id) => delete this.settings.unacked[id]);
        }
        void this.saveSettings();
        if (message.to !== this.settings.address && message.to !== BUS_ADDRESS) {
          void this.applyContactSendGate(message.to);
        }
      }
    });
    this.bus.setCursors(this.settings.cursors);
    this.bus.keepOutbox = this.settings.keepOutbox;
    this.bus.readAtSource = () => this.settings.readAt;
    this.bus.gcPolicySource = (address) => {
      const days = this.settings.retentionDaysByPeer[address];
      const cap = this.settings.maxInboxMessagesByPeer[address];
      if (days === void 0 && cap === void 0) return null;
      return {
        maxAgeMs: (days ?? this.settings.retentionDays) * 864e5,
        maxMessages: cap ?? this.settings.maxInboxMessages
      };
    };
    this.api = createApi(this.bus, this.store, {
      address: () => this.settings.address,
      readAt: () => this.settings.readAt,
      mutedPeers: () => this.settings.mutedPeers,
      markPeerRead: (peer) => this.markPeerRead(peer),
      contacts: () => this.contacts.list(),
      addContact: (address, name) => this.addContact(address, name)
    });
    window.obsidianMessenger = this.api;
    await this.store.ensureRoot();
    await this.contacts.seed(
      (await this.store.listAddresses()).filter(
        (a) => a !== this.settings.address && a !== BUS_ADDRESS
      )
    );
    await this.store.upsertRegistry({
      address: BUS_ADDRESS,
      name: "Message Bus (bus)",
      updated: (/* @__PURE__ */ new Date()).toISOString()
    });
    await this.store.upsertRegistry({
      address: this.settings.address,
      name: this.selfRegistryName(),
      updated: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.registerView(VIEW_TYPE_MESSENGER_CHAT, (leaf) => new MessengerChatView(leaf, this));
    this.om2Kv = adapterKv(this.app.vault.adapter, `${this.manifest.dir}/om2`);
    this.registerObsidianProtocolHandler("message-bus-invite", (params) => {
      void this.handleInviteCode(String(params.code ?? ""));
    });
    this.registerEvent(
      this.app.workspace.on("window-close", (_win, popout) => {
        if (popout !== this.chatWin) return;
        const closing = this.chatWin;
        this.chatWin = null;
        this.saveChatWindowRect(closing);
      })
    );
    this.app.workspace.onLayoutReady(() => {
      if (!this.settings.onboarded) {
        new OnboardingModal(this.app, this).open();
      }
      if (this.settings.om2.enabled && window.obsidianSocial) {
        new import_obsidian14.Notice(
          "Messenger: both Cross-vault mail and the Obsidian Social bridge are on. Disable one (Settings \u2192 Messenger \u2192 Cross-vault mail, or Social's settings) to avoid double-delivery.",
          1e4
        );
      }
      void this.tryStartOm2();
    });
    this.ribbonIcon = this.addRibbonIcon(
      "mail",
      "Open Messenger chat",
      () => void (import_obsidian14.Platform.isMobile ? this.openChat() : this.openChatWindow())
    );
    void this.updateBadge();
    this.addCommand({
      id: "chat",
      name: "Open chat",
      callback: () => void this.openChat()
    });
    this.addCommand({
      id: "chat-window",
      name: "Open chat in new window",
      callback: () => void this.openChatWindow(),
      checkCallback: (checking) => {
        if (checking) return !import_obsidian14.Platform.isMobile;
        return true;
      }
    });
    this.addCommand({
      id: "send",
      name: "Send message",
      callback: () => new SendMessageModal(
        this.app,
        async (to, body) => {
          await this.bus.send(this.settings.address, to, body);
          new import_obsidian14.Notice(`Delivered to inbox of ${to}`);
        },
        () => this.knownAddresses(),
        async (to) => ({
          self: to === this.settings.address,
          confirmed: await this.isConfirmedRecipient(to)
        })
      ).open()
    });
    this.addCommand({
      id: "add-contacts",
      name: "Add contacts",
      callback: () => new AddContactModal(this.app, this).open()
    });
    this.addCommand({
      id: "search-messages",
      name: "Search messages",
      checkCallback: (checking) => {
        if (checking) return !this.isMessengerLocked();
        if (this.isMessengerLocked()) {
          new import_obsidian14.Notice("Messenger is locked \u2014 unlock it to search messages");
          void this.openChat();
          return true;
        }
        new MessageSearchModal(this.app, this).open();
        return true;
      }
    });
    this.addCommand({
      id: "browse-attachments",
      name: "Browse attachments",
      checkCallback: (checking) => {
        if (checking) return !this.isMessengerLocked();
        if (this.isMessengerLocked()) {
          new import_obsidian14.Notice("Messenger is locked \u2014 unlock it to browse attachments");
          void this.openChat();
          return true;
        }
        new AllAttachmentsModal(this.app, this).open();
        return true;
      }
    });
    this.addCommand({
      id: "lock",
      name: "Lock Messenger",
      checkCallback: (checking) => {
        if (checking) return this.hasPasscode() && !this.locked;
        this.lockMessenger();
        return true;
      }
    });
    this.addCommand({
      id: "check",
      name: "Check inboxes now",
      callback: () => void this.checkNow()
    });
    this.addCommand({
      id: "demo",
      name: "Run loopback demo",
      callback: () => void this.runDemo()
    });
    this.addCommand({
      id: "open-registry",
      name: "Open registry",
      callback: () => void this.openRegistry()
    });
    this.addCommand({
      id: "gc",
      name: "Delete old messages now",
      callback: () => void this.gcNow()
    });
    this.registerInterval(window.setInterval(() => this.pumpGate(), 1e3));
    this.registerDomEvent(window, "focus", () => {
      this.pumpRequested = true;
    });
    this.registerDomEvent(document, "visibilitychange", () => {
      if (document.visibilityState === "visible") this.pumpRequested = true;
    });
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof import_obsidian14.TFile && file.path.startsWith(`${this.store.rootPath}/`)) {
          this.pumpRequested = true;
        }
      })
    );
    this.addSettingTab(new MessengerSettingTab(this.app, this));
  }
  onunload() {
    delete window.obsidianMessenger;
    this.applyCipher(null);
    void this.stopOm2();
    if (this.chatWinSaveTimer !== null) window.clearTimeout(this.chatWinSaveTimer);
    if (this.burnSweepTimer !== null) window.clearTimeout(this.burnSweepTimer);
    void this.flushDeliveredReceipts();
  }
  pumpGate() {
    const intervalMs = Date.now() < this.burstUntil ? SEND_BURST_EVERY_MS : Math.max(1, this.settings.pollSeconds) * 1e3;
    if (Date.now() - this.lastPump < intervalMs && !this.pumpRequested) return;
    this.pumpRequested = false;
    this.lastPump = Date.now();
    void this.pump();
  }
  async pump() {
    try {
      if (Date.now() - this.lastAdopt > MAINTAIN_EVERY_MS) {
        this.lastAdopt = Date.now();
        await this.adoptConflicts();
        await this.retransmitUnacked();
        await this.burnSweep();
      }
      const processed = await this.bus.tick();
      this.app.workspace.trigger("messenger:tick");
      if (processed > 0) {
        await this.persistCursors();
        if (this.settings.debug) {
          new import_obsidian14.Notice(
            `Messenger: processed ${processed} message${processed === 1 ? "" : "s"}`
          );
        }
      }
      if (this.gcConfigured() && Date.now() - this.lastGc > GC_EVERY_MS) {
        this.lastGc = Date.now();
        await this.bus.gc(
          this.settings.retentionDays * 864e5,
          this.settings.maxInboxMessages
        );
      }
    } catch (err) {
      console.error("[message-bus] pump failed", err);
    }
  }
  async persistCursors() {
    this.settings.cursors = this.bus.getCursors();
    await this.saveData(this.settings);
  }
  /** Whether any retention policy exists at all — global or per-address. */
  gcConfigured() {
    return this.settings.retentionDays > 0 || this.settings.maxInboxMessages > 0 || Object.keys(this.settings.retentionDaysByPeer).length > 0 || Object.keys(this.settings.maxInboxMessagesByPeer).length > 0;
  }
  /**
   * Merge sync-conflict siblings back into the canonical inboxes (SPEC §7).
   * Best-effort: a failure here never blocks the poll pass that follows.
   */
  async adoptConflicts() {
    try {
      for (const address of await this.store.listAddresses()) {
        await this.store.adoptConflicts(address);
      }
    } catch (err) {
      console.error("[message-bus] conflict adoption failed", err);
    }
  }
  rememberId(id) {
    this.seenIds.add(id);
    if (this.seenIds.size > SEEN_IDS_MAX) {
      const oldest = this.seenIds.values().next().value;
      if (oldest !== void 0) this.seenIds.delete(oldest);
    }
  }
  /**
   * SPEC §16: delete burned mail (past `exp`, or past its burn-after-read
   * window) from disk. Reads already hide burned messages; this keeps the
   * files honest. Runs with the maintenance pass and after a conversation is
   * marked read — burning on read shouldn't wait two minutes on disk. Needs
   * no vault key (§16 rule 2): sealed burned blocks die with their envelope,
   * kept ciphertext is re-encoded byte-for-byte — sweeps are safe while the
   * vault is locked.
   */
  async burnSweep() {
    if (this.burnSweepBusy) {
      this.burnSweepQueued = true;
      return;
    }
    this.burnSweepBusy = true;
    try {
      do {
        this.burnSweepQueued = false;
        try {
          const dropped = await this.bus.burnSweep(
            this.settings.address,
            this.settings.readAt
          );
          if (dropped > 0) {
            this.app.workspace.trigger("messenger:tick");
            void this.updateBadge();
          }
        } catch (err) {
          console.error("[message-bus] burn sweep failed", err);
          break;
        }
      } while (this.burnSweepQueued);
    } finally {
      this.burnSweepBusy = false;
    }
  }
  /**
   * Debounced public door to burnSweep for views that write read cursors
   * themselves (the chat view's in-thread markRead): burn-after-read mail
   * owes its disk copy to the read, not to the next maintenance pass. The
   * trailing edge coalesces read bursts; if a sweep is already running when
   * the timer fires, burnSweep queues it behind the one in flight.
   */
  requestBurnSweep() {
    if (this.burnSweepTimer !== null) window.clearTimeout(this.burnSweepTimer);
    this.burnSweepTimer = window.setTimeout(() => {
      this.burnSweepTimer = null;
      void this.burnSweep();
    }, BURN_SWEEP_DEBOUNCE_MS);
  }
  /**
   * SPEC §14: if a sent message's ✓ never arrives on a shared bus, its
   * append was probably lost to a sync merge — re-append it unchanged (same
   * id, so receivers dedupe and GC collapses the duplicate). Only peers that
   * publish a receipts file (§11) play: no receipts file means no ACK
   * channel (remote OM-2 peers, scripts), and re-sending to them would
   * duplicate everything they receive.
   */
  async retransmitUnacked() {
    const ids = Object.keys(this.settings.unacked);
    if (ids.length === 0) return;
    const now = Date.now();
    let changed = false;
    for (const id of ids) {
      const entry = this.settings.unacked[id];
      if (!entry) {
        delete this.settings.unacked[id];
        changed = true;
        continue;
      }
      if (this.isSendBurned(entry.message, now)) {
        delete this.settings.unacked[id];
        changed = true;
        continue;
      }
      let hasReceiptsFile = false;
      let receipts = null;
      try {
        hasReceiptsFile = await this.store.hasReceipts(entry.message.to);
        if (hasReceiptsFile) {
          receipts = parseReceipts(await this.store.readReceiptsRaw(entry.message.to));
        }
      } catch (err) {
        console.error("[message-bus] receipt check failed", err);
        continue;
      }
      switch (planRetransmit(entry, hasReceiptsFile, receipts, now)) {
        case "wait":
          break;
        case "clear":
        case "drop":
          delete this.settings.unacked[id];
          changed = true;
          break;
        case "retransmit":
          try {
            await this.store.append(entry.message.to, entry.message);
          } catch (err) {
            console.error("[message-bus] retransmit failed", err);
            continue;
          }
          entry.attempts += 1;
          entry.sentAt = (/* @__PURE__ */ new Date()).toISOString();
          changed = true;
          break;
      }
    }
    if (changed) await this.saveSettings();
  }
  /** Whether a remembered send has burned (§16): past exp, or past its burn-after-read window on this vault. */
  isSendBurned(message, now) {
    if (isExpired(message, now)) return true;
    if (!message.bar) return false;
    const peer = message.from === this.settings.address ? message.to : message.from;
    const read = this.settings.readAt[peer];
    return !!read && now >= Date.parse(read) + message.bar * 1e3;
  }
  async openChat(peer, messageId) {
    const { workspace } = this.app;
    const mainWin = workspace.containerEl.win;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_MESSENGER_CHAT).filter((l) => l.view?.containerEl?.isConnected);
    let leaf = leaves.find((l) => l.view.containerEl.win !== mainWin) ?? leaves[0] ?? null;
    if (!leaf) {
      leaf = import_obsidian14.Platform.isMobile ? workspace.getLeaf(true) : workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_MESSENGER_CHAT, active: true });
    }
    await workspace.revealLeaf(leaf);
    if (peer) {
      const view = leaf.view;
      if (view instanceof MessengerChatView) {
        await view.openConversation(peer, messageId);
      }
    }
  }
  /** Open a conversation and land on one message — the search modal's exit. */
  async openChatToMessage(peer, messageId) {
    await this.openChat(peer, messageId);
  }
  /** Open the messenger in its own window — the standalone, app-like way. */
  async openChatWindow(peer) {
    const { workspace } = this.app;
    const mainWin = workspace.containerEl.win;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_MESSENGER_CHAT).filter(
      (l) => l.view?.containerEl?.isConnected && l.view.containerEl.win !== mainWin
    );
    if (existing.length > 0) {
      const leaf2 = existing[0];
      try {
        leaf2.view.containerEl.win.focus();
      } catch {
      }
      await workspace.revealLeaf(leaf2);
      if (peer) {
        const view = leaf2.view;
        if (view instanceof MessengerChatView) await view.openConversation(peer);
      }
      return;
    }
    const screen = window.screen;
    const remembered = rememberedWindowInit(
      {
        x: this.settings.chatWinX,
        y: this.settings.chatWinY,
        width: this.settings.chatWinWidth,
        height: this.settings.chatWinHeight
      },
      {
        width: screen.width,
        height: screen.height,
        extended: screen.isExtended === true
      }
    );
    let leaf;
    try {
      leaf = workspace.openPopoutLeaf({
        x: remembered.x,
        y: remembered.y,
        size: remembered.size ?? { width: 440, height: 720 }
      });
    } catch (err) {
      this.lastPopoutError = String(err?.message ?? err);
      console.warn(
        "[message-bus] popout failed, opening in-app:",
        this.lastPopoutError
      );
      return this.openChat(peer);
    }
    this.lastPopoutError = null;
    await leaf.setViewState({ type: VIEW_TYPE_MESSENGER_CHAT, active: true });
    this.watchChatWindow(leaf);
    if (peer) {
      const view = leaf.view;
      if (view instanceof MessengerChatView) await view.openConversation(peer);
    }
  }
  /** Track a freshly opened chat window so its geometry gets remembered. */
  watchChatWindow(leaf) {
    const win = leaf.view?.containerEl?.win;
    if (!win || win === window) return;
    this.chatWin = win;
    this.registerDomEvent(win, "resize", () => this.scheduleChatWinSave());
  }
  /** Debounced capture — a drag across the screen fires resize constantly. */
  scheduleChatWinSave() {
    if (this.chatWinSaveTimer !== null) window.clearTimeout(this.chatWinSaveTimer);
    this.chatWinSaveTimer = window.setTimeout(() => {
      this.chatWinSaveTimer = null;
      const win = this.chatWin;
      if (win && !win.closed) this.saveChatWindowRect(win);
    }, 600);
  }
  saveChatWindowRect(win) {
    try {
      this.settings.chatWinX = Math.round(win.screenX);
      this.settings.chatWinY = Math.round(win.screenY);
      this.settings.chatWinWidth = Math.round(win.outerWidth);
      this.settings.chatWinHeight = Math.round(win.outerHeight);
      void this.saveSettings();
    } catch {
    }
  }
  /**
   * Pop up + sound for mail addressed to me, unless some open chat view —
   * sidebar or popped-out window — is showing that conversation already.
   * Unaccepted senders (the social gate) never announce: their mail waits
   * under Contact requests, and the requests header carries the count.
   */
  async maybeNotify(message) {
    if (message.to !== this.settings.address) return;
    if (message.from === this.settings.address) return;
    void this.updateBadge();
    const sender = await this.contacts.get(message.from);
    if (sender && (sender.state === "request" || sender.state === "blocked")) return;
    if (this.isMessengerLocked()) return;
    const peerLocked = this.isPeerLocked(message.from);
    const watching = !peerLocked && this.app.workspace.getLeavesOfType(VIEW_TYPE_MESSENGER_CHAT).some(
      (leaf) => leaf.view?.containerEl?.isConnected && leaf.view instanceof MessengerChatView && leaf.view.activePeer === message.from
    );
    if (watching) return;
    if (this.settings.mutedPeers[message.from]) return;
    if (this.settings.notifySound) playReceiveSound();
    if (this.settings.notifyPopup)
      void this.showNotifyPopup(message, peerLocked || message.encLocked === true);
  }
  /** Mail delivered to my inbox: buffer a ✓ for the senders' benefit. */
  onDelivered(message) {
    if (message.to !== this.settings.address) return;
    if (message.from === this.settings.address) return;
    this.pendingDelivered.add(message.id);
    if (this.receiptTimer !== null) return;
    this.receiptTimer = window.setTimeout(() => {
      this.receiptTimer = null;
      void this.flushDeliveredReceipts();
    }, 2e3);
  }
  async flushDeliveredReceipts() {
    if (this.pendingDelivered.size === 0) return;
    const ids = [...this.pendingDelivered];
    this.pendingDelivered.clear();
    try {
      await this.store.appendReceiptBlock(
        this.settings.address,
        encodeReceiptBlock(
          this.settings.address,
          "delivered",
          (/* @__PURE__ */ new Date()).toISOString(),
          ids
        )
      );
    } catch (err) {
      console.error("[message-bus] delivery receipt failed", err);
      for (const id of ids) this.pendingDelivered.add(id);
      if (this.receiptTimer === null) {
        this.receiptTimer = window.setTimeout(() => {
          this.receiptTimer = null;
          void this.flushDeliveredReceipts();
        }, 3e4);
      }
    }
  }
  async showNotifyPopup(message, hideBody = false) {
    const registry = await this.store.readRegistry();
    const name = registry.find((r) => r.address === message.from)?.name ?? message.from;
    const title = name === message.from ? name : `${name} (${message.from})`;
    const preview = hideBody ? "New message \u2014 open Messenger to read it" : message.body.replace(/\s+/g, " ").trim().slice(0, 90);
    const notice = new import_obsidian14.Notice("", 8e3);
    notice.messageEl.addClass("messenger-notice");
    notice.messageEl.empty();
    notice.messageEl.createDiv(
      { cls: "messenger-notice-title" },
      (el) => el.setText(title)
    );
    notice.messageEl.createDiv(
      { cls: "messenger-notice-preview" },
      (el) => el.setText(preview || "(empty message)")
    );
    notice.messageEl.addEventListener("click", () => {
      notice.hide();
      void this.openChat(message.from);
    });
  }
  /** Rebuild every open chat view — appearance changes from the settings tab. */
  refreshChatViews() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MessengerChatView) void leaf.view.refresh();
    });
  }
  /**
   * Blend-control updates (intensity/tint/bubble sliders): repaint the
   * wallpaper layers only, no thread rebuild — cheap enough to run on every
   * slider tick while dragging.
   */
  updateChatAppearance() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MessengerChatView) leaf.view.refreshAppearance();
    });
  }
  /**
   * Unread dot on the ribbon icon: mail for me newer than my read state.
   * Mail waiting under Contact requests (or from blocked senders) doesn't
   * count — quiet means quiet.
   */
  async updateBadge() {
    try {
      const [mine, contacts] = await Promise.all([
        this.store.readInbox(this.settings.address),
        this.contacts.list()
      ]);
      const quiet = new Set(
        contacts.filter((c) => c.state === "request" || c.state === "blocked").map((c) => c.address)
      );
      const readAt = this.settings.readAt;
      const unread = mine.filter(
        (m) => m.from !== this.settings.address && !quiet.has(m.from) && m.ts > (readAt[m.from] ?? "")
      ).length;
      this.ribbonIcon?.toggleClass("messenger-ribbon-dot", unread > 0);
    } catch {
    }
  }
  async checkNow() {
    const processed = await this.bus.tick();
    this.app.workspace.trigger("messenger:tick");
    await this.persistCursors();
    new import_obsidian14.Notice(
      processed === 0 ? "No new messages" : `Processed ${processed} message${processed === 1 ? "" : "s"}`
    );
  }
  async runDemo() {
    const message = await this.bus.send(
      BUS_ADDRESS,
      this.settings.address,
      `Loopback demo at ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}`
    );
    let delivered = false;
    const off = this.bus.subscribe((m) => {
      if (m.id === message.id) {
        delivered = true;
        new import_obsidian14.Notice(`Messenger loop works: \u201C${m.body}\u201D`);
      }
    }, this.settings.address);
    try {
      await this.bus.tick();
    } finally {
      off();
    }
    await this.persistCursors();
    if (!delivered) {
      new import_obsidian14.Notice(
        "Demo message appended but not delivered \u2014 check the inbox file and console"
      );
    }
  }
  // -- contacts: the social gate (SPEC §17) --------------------------------------
  /**
   * The gate's inbound half, on every first-sighting delivery: a stranger's
   * mail files them under Contact requests; a pending contact's reply makes
   * the link mutual. Self and bus mail never touch contacts. Mail delivered
   * by the OM-2 bridge (§12) is exempt — it arrives signed and already
   * accepted at that edge, so it lands mutual; a block still wins.
   */
  async applyContactGate(message) {
    if (message.to !== this.settings.address) return;
    const kind = classifyInbound(
      message.from,
      await this.contacts.map(),
      this.settings.address,
      BUS_ADDRESS,
      // om2 present (§12): signed and accepted at the OM-2 bridge edge, so
      // the social gate must not re-ask what the user already answered
      // there — a blocked alias still wins (§17, §8)
      message.om2 !== void 0
    );
    if (kind === "request") {
      if (await this.contacts.get(message.from)) return;
      const registry = await this.store.readRegistry();
      const name = registry.find((r) => r.address === message.from)?.name ?? message.from;
      await this.contacts.upsert({
        address: message.from,
        name,
        state: "request",
        updated: (/* @__PURE__ */ new Date()).toISOString()
      });
    } else if (kind === "upgrade") {
      if (await this.contacts.get(message.from)) {
        await this.contacts.setState(message.from, "mutual");
      } else {
        const registry = await this.store.readRegistry();
        const name = registry.find((r) => r.address === message.from)?.name ?? message.from;
        await this.contacts.upsert({
          address: message.from,
          name,
          state: "mutual",
          updated: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } else {
      return;
    }
    this.refreshChatViews();
  }
  /**
   * The gate's outbound half: first mail to an address opens a pending
   * contact; answering a request accepts it. Never downgrades an existing
   * mutual or blocked entry.
   */
  async applyContactSendGate(to) {
    const entry = await this.contacts.get(to);
    if (!entry) {
      await this.contacts.upsert({
        address: to,
        name: to,
        state: "pending",
        updated: (/* @__PURE__ */ new Date()).toISOString()
      });
    } else if (entry.state === "request") {
      await this.contacts.setState(to, "mutual");
    } else {
      return;
    }
    this.refreshChatViews();
  }
  /** All contacts, address-sorted — settings tab and the API read this. */
  listContacts() {
    return this.contacts.list();
  }
  /**
   * Add (or re-register) a contact: imported, hand-entered, via the API, or
   * an API client's registration. An existing entry keeps its state — adding
   * never downgrades a mutual contact or quietly un-blocks someone. Your own
   * address only gets its registry row.
   */
  async addContact(address, name) {
    if (!ADDRESS_RE.test(address)) {
      throw new Error(`Invalid messenger address: ${address}`);
    }
    const self2 = address === this.settings.address;
    if (!self2 && isReservedAddress(address)) {
      throw new Error(
        `Reserved messenger address: ${address} \u2014 no one can hold a name with that weight (SPEC \xA72)`
      );
    }
    const existing = await this.contacts.get(address);
    if (!self2) {
      await this.contacts.upsert({
        address,
        name: name || address,
        state: existing?.state ?? "pending",
        updated: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    await this.store.upsertRegistry({
      address,
      name: name || address,
      updated: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (!existing && !self2) await this.store.ensureAddress(address);
    this.refreshChatViews();
  }
  /** Accept a contact request: mutual from here on, announcements resume. */
  async acceptContact(address) {
    const entry = await this.contacts.get(address);
    if (entry?.fp && this.om2Bridge) {
      try {
        await this.om2Bridge.accept(entry.fp);
      } catch (err) {
        console.error("[message-bus] om2 accept failed", err);
        new import_obsidian14.Notice(`Messenger: accept failed \u2014 ${err instanceof Error ? err.message : "unknown error"}`);
        return;
      }
    }
    await this.contacts.setState(address, "mutual");
    this.refreshChatViews();
    void this.updateBadge();
  }
  /**
   * Decline a request, or block a live contact: quiet, and hidden from the
   * list.
   */
  async blockContact(address) {
    const entry = await this.contacts.get(address);
    if (entry?.fp && this.om2Bridge) {
      try {
        await this.om2Bridge.decline(entry.fp);
      } catch (err) {
        console.error("[message-bus] om2 decline failed", err);
      }
    }
    if (entry) await this.contacts.setState(address, "blocked");
    else {
      await this.contacts.upsert({
        address,
        name: address,
        state: "blocked",
        updated: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    this.refreshChatViews();
    void this.updateBadge();
  }
  /** Unblock: the conversation returns as a request to review again. */
  async unblockContact(address) {
    await this.contacts.setState(address, "request");
    this.refreshChatViews();
  }
  /** Remove the contact record; the conversation's files stay untouched. */
  async removeContact(address) {
    await this.contacts.remove(address);
    this.refreshChatViews();
  }
  async openRegistry() {
    await this.store.ensureRoot();
    if (this.store.hidden) {
      this.revealFile(this.store.registryPath);
      return;
    }
    if (!(this.app.vault.getAbstractFileByPath(this.store.registryPath) instanceof import_obsidian14.TFile)) {
      await this.store.upsertRegistry({
        address: this.settings.address,
        name: this.selfRegistryName(),
        updated: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const file = this.app.vault.getAbstractFileByPath(this.store.registryPath);
    if (file instanceof import_obsidian14.TFile) {
      await this.app.workspace.getLeaf(true).openFile(file);
    }
  }
  /** Point tech users at a mailbox file Obsidian refuses to index. */
  revealFile(path) {
    new import_obsidian14.Notice(`${path} (hidden from Obsidian)`);
    if (import_obsidian14.Platform.isMobile) return;
    try {
      const req = window.require;
      if (typeof req !== "function") return;
      const electron = req("electron");
      const adapter = this.app.vault.adapter;
      electron.remote?.shell.showItemInFolder(adapter.getFullPath(path));
    } catch {
    }
  }
  async gcNow() {
    if (!this.gcConfigured()) {
      new import_obsidian14.Notice("Nothing to clean up \u2014 retention and the inbox limit are both disabled");
      return;
    }
    const dropped = await this.bus.gc(
      this.settings.retentionDays * 864e5,
      this.settings.maxInboxMessages
    );
    this.app.workspace.trigger("messenger:tick");
    new import_obsidian14.Notice(dropped === 0 ? "Nothing to delete" : `Deleted ${dropped} old message(s)`);
  }
  async loadSettings() {
    this.settings = sanitizeSettings(
      Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
    );
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  /** Display name for the registry: the configured one, else the raw address. */
  selfRegistryName() {
    return this.settings.displayName || this.settings.address;
  }
  // -- passcode & locks (level-1 security) ------------------------------------
  /** Whether a wrapped vault-key bundle exists (SPEC §15 sealing material). */
  hasKeyBundle() {
    return this.settings.encryptMail && this.settings.keySalt !== "" && this.settings.wrappedKey !== "";
  }
  /**
   * Key mode: the unlock secret is a generated vault key kept in a password
   * manager, not a memorized passcode.
   */
  isKeyMode() {
    return this.hasKeyBundle() && this.settings.authMode === "key";
  }
  /**
   * Whether an unlock secret exists. With sealing on, the wrapped bundle
   * itself is the credential — no separate passcode is required.
   */
  hasPasscode() {
    return this.hasKeyBundle() || this.settings.passcodeHash !== "" && this.settings.passcodeSalt !== "";
  }
  /**
   * Fast-hash check — only meaningful while no key bundle exists. When
   * sealing is on there is deliberately no stored hash: a fast verifier next
   * to the wrapped key would hand an offline attacker a cheap oracle, so
   * verifyAuth derives the key instead.
   */
  verifyPasscodeHash(candidate) {
    if (!this.settings.passcodeHash || !this.settings.passcodeSalt) return false;
    return verifyPasscode(candidate, this.settings.passcodeSalt, this.settings.passcodeHash);
  }
  /** Key-mode input is normalized (case, separators, lookalikes) before use. */
  unlockSecret(candidate) {
    return this.isKeyMode() ? normalizeVaultKey(candidate) ?? candidate : candidate;
  }
  /** Unwrap the vault key with a candidate secret. Null when it didn't open. */
  async openVaultWith(candidate) {
    if (!this.hasKeyBundle()) return null;
    try {
      return await openWrappedVaultKey(
        this.unlockSecret(candidate),
        this.settings.keySalt,
        this.settings.wrappedKey,
        this.settings.kdfIterations,
        this.settings.kdf
      );
    } catch {
      return null;
    }
  }
  /**
   * Verify the unlock secret — the one gate for every sensitive action.
   * With sealing on, verification IS the unwrap (full KDF run per attempt);
   * without it, the UI-gate hash answers.
   */
  async verifyAuth(candidate) {
    if (this.hasKeyBundle()) return await this.openVaultWith(candidate) !== null;
    return this.verifyPasscodeHash(candidate);
  }
  /** Install or drop the session's vault key (SPEC §15). */
  applyCipher(cipher) {
    this.cipher = cipher;
    this.store.setCipher(cipher);
  }
  /**
   * Store a new passcode (fresh salt — old hashes never survive a change).
   * With `withEncryption`, also mints the wrapped vault key and turns on
   * at-rest sealing; no hash is stored in that mode — the unwrap verifies.
   * Used at sign-up, where there is no mail to migrate.
   */
  async setPasscode(passcode, withEncryption = false) {
    if (withEncryption && webcryptoAvailable()) {
      if (!isStrongPasscode(passcode)) {
        throw new Error(
          `Encryption needs a stronger passcode \u2014 at least 8 characters, not digits-only`
        );
      }
      const bundle = await createWrappedVaultKey(passcode);
      this.settings.passcodeHash = "";
      this.settings.passcodeSalt = "";
      this.settings.keySalt = bundle.keySalt;
      this.settings.wrappedKey = bundle.wrappedKey;
      this.settings.kdfIterations = PBKDF2_ITERATIONS;
      this.settings.kdf = DEFAULT_KDF;
      this.settings.authMode = "passcode";
      this.settings.encryptMail = true;
      this.applyCipher(bundle.cipher);
    } else {
      const salt = makeSalt();
      this.settings.passcodeSalt = salt;
      this.settings.passcodeHash = hashPasscode(passcode, salt);
    }
    await this.saveSettings();
  }
  /**
   * Change the unlock secret. With encryption on, the vault key is unwrapped
   * with the current secret and re-wrapped under the new one — O(1), no mail
   * is re-encrypted — and any legacy fast hash is dropped. This is also the
   * key-mode → passcode switch. Returns false on a wrong current secret.
   */
  async changePasscode(current, next) {
    if (this.hasKeyBundle()) {
      if (!isStrongPasscode(next)) return false;
      try {
        const raw = await unwrapRawVaultKey(
          this.unlockSecret(current),
          this.settings.keySalt,
          this.settings.wrappedKey,
          this.settings.kdfIterations,
          this.settings.kdf
        );
        const bundle = await rewrapRawVaultKey(raw, next);
        zeroKeyMaterial(raw);
        this.settings.keySalt = bundle.keySalt;
        this.settings.wrappedKey = bundle.wrappedKey;
        this.settings.kdfIterations = PBKDF2_ITERATIONS;
        this.settings.kdf = DEFAULT_KDF;
        this.settings.authMode = "passcode";
        this.settings.passcodeHash = "";
        this.settings.passcodeSalt = "";
      } catch (err) {
        console.error("[message-bus] key re-wrap failed", err);
        return false;
      }
      await this.saveSettings();
      return true;
    }
    if (!this.verifyPasscodeHash(current)) return false;
    const salt = makeSalt();
    this.settings.passcodeSalt = salt;
    this.settings.passcodeHash = hashPasscode(next, salt);
    const om2Record = await loadIdentityRecord(this.om2Kv);
    if (om2Record) {
      try {
        const identity = await openIdentityRecord(om2Record, this.unlockSecret(current));
        const rebundled = await rewrapRawVaultKey(identity.secretKey.slice(0, 32), next);
        await saveIdentityRecord(this.om2Kv, {
          ...om2Record,
          keySalt: rebundled.keySalt,
          wrappedKey: rebundled.wrappedKey,
          kdf: DEFAULT_KDF
        });
      } catch (err) {
        console.error("[message-bus] om2 identity re-wrap failed", err);
      }
    }
    await this.saveSettings();
    return true;
  }
  /**
   * Turn on at-rest sealing from a passcode: mint a wrapped vault key from
   * the (verified) passcode and rewrite every existing body as ciphertext.
   * The fast hash is dropped — from here on the unwrap is the verifier, so a
   * stolen data.json offers no cheap offline oracle.
   */
  async enableEncryption(passcode) {
    if (!this.verifyPasscodeHash(passcode)) throw new Error("Wrong passcode");
    if (!isStrongPasscode(passcode)) {
      throw new Error(
        `Encryption needs a stronger passcode \u2014 at least 8 characters, not digits-only. Change it first.`
      );
    }
    if (!webcryptoAvailable()) throw new Error("WebCrypto unavailable here");
    const bundle = await createWrappedVaultKey(passcode);
    this.applyCipher(bundle.cipher);
    const { messages } = await this.store.rewriteAll(true);
    this.settings.keySalt = bundle.keySalt;
    this.settings.wrappedKey = bundle.wrappedKey;
    this.settings.kdfIterations = PBKDF2_ITERATIONS;
    this.settings.kdf = DEFAULT_KDF;
    this.settings.authMode = "passcode";
    this.settings.passcodeHash = "";
    this.settings.passcodeSalt = "";
    this.settings.encryptMail = true;
    await this.saveSettings();
    new import_obsidian14.Notice(`Messenger: ${messages} message(s) now encrypted at rest`);
    this.refreshChatViews();
  }
  /**
   * Turn on at-rest sealing with a generated vault key instead of a passcode:
   * the key (125 random bits, generated by the caller and revealed once in
   * VaultKeyModal before this is called) derives the KEK. Any existing UI
   * passcode is dropped — the key becomes the unlock secret.
   */
  async enableKeyEncryption(key) {
    if (!webcryptoAvailable()) throw new Error("WebCrypto unavailable here");
    if (this.hasKeyBundle()) throw new Error("Encryption is already on");
    if (!normalizeVaultKey(key)) throw new Error("Malformed vault key");
    const bundle = await createWrappedVaultKey(key);
    this.applyCipher(bundle.cipher);
    const { messages } = await this.store.rewriteAll(true);
    this.settings.keySalt = bundle.keySalt;
    this.settings.wrappedKey = bundle.wrappedKey;
    this.settings.kdfIterations = PBKDF2_ITERATIONS;
    this.settings.kdf = DEFAULT_KDF;
    this.settings.authMode = "key";
    this.settings.passcodeHash = "";
    this.settings.passcodeSalt = "";
    this.settings.encryptMail = true;
    await this.saveSettings();
    new import_obsidian14.Notice(`Messenger: ${messages} message(s) now encrypted at rest`);
    this.refreshChatViews();
  }
  /**
   * Re-wrap the existing vault key under a freshly generated key (switch from
   * passcode mode, or rotate a possibly-leaked key). No mail is re-encrypted.
   * The key comes from VaultKeyModal, already revealed and paste-confirmed.
   */
  async switchToKeyMode(currentSecret, key) {
    if (!normalizeVaultKey(key)) throw new Error("Malformed vault key");
    let raw;
    try {
      raw = await unwrapRawVaultKey(
        this.unlockSecret(currentSecret),
        this.settings.keySalt,
        this.settings.wrappedKey,
        this.settings.kdfIterations,
        this.settings.kdf
      );
    } catch {
      throw new Error("Wrong passcode or key");
    }
    const bundle = await rewrapRawVaultKey(raw, key);
    zeroKeyMaterial(raw);
    this.settings.keySalt = bundle.keySalt;
    this.settings.wrappedKey = bundle.wrappedKey;
    this.settings.kdfIterations = PBKDF2_ITERATIONS;
    this.settings.kdf = DEFAULT_KDF;
    this.settings.authMode = "key";
    this.settings.passcodeHash = "";
    this.settings.passcodeSalt = "";
    await this.saveSettings();
  }
  /**
   * Turn sealing off: unseal every stored body (needs the vault key, so the
   * unlock secret is verified and the key unwrapped first), then drop the
   * bundle. A passcode-mode vault regains its UI-gate hash from the secret
   * this call just proved; key mode ends with no lock — the notice says so.
   */
  async disableEncryption(secret) {
    const cipher = await this.openVaultWith(secret);
    if (!cipher) throw new Error("Wrong passcode or key");
    this.applyCipher(cipher);
    const { messages } = await this.store.rewriteAll(false);
    this.settings.encryptMail = false;
    this.settings.keySalt = "";
    this.settings.wrappedKey = "";
    this.settings.kdfIterations = LEGACY_PBKDF2_ITERATIONS;
    this.settings.kdf = LEGACY_KDF;
    const wasKeyMode = this.settings.authMode === "key";
    this.settings.authMode = "passcode";
    if (!wasKeyMode && !this.settings.passcodeHash) {
      const salt = makeSalt();
      this.settings.passcodeSalt = salt;
      this.settings.passcodeHash = hashPasscode(secret, salt);
    }
    this.applyCipher(null);
    await this.saveSettings();
    new import_obsidian14.Notice(
      wasKeyMode ? `Messenger: ${messages} message(s) decrypted \u2014 no passcode is set; add one in Settings if you want the app lock` : `Messenger: ${messages} message(s) decrypted`
    );
    this.refreshChatViews();
  }
  /** Whether stored bodies are sealed (SPEC §15) — independent of lock state. */
  isEncrypted() {
    return this.settings.encryptMail;
  }
  /**
   * Remove the passcode entirely (requires a correct entry first — the
   * settings tab gates this). Refused while encryption is on: sealed mail
   * would become unreadable forever.
   */
  async clearPasscode() {
    if (this.settings.encryptMail) {
      throw new Error("Turn off message encryption before removing the passcode");
    }
    this.settings.passcodeHash = "";
    this.settings.passcodeSalt = "";
    this.settings.lockedPeers = {};
    this.unlockedPeers.clear();
    this.locked = false;
    this.applyCipher(null);
    await this.saveSettings();
    this.refreshChatViews();
  }
  /** Whether the whole Messenger UI is behind the passcode right now. */
  isMessengerLocked() {
    return this.hasPasscode() && this.locked;
  }
  /**
   * Try the unlock secret against the app lock. With encryption on, this is
   * also where the vault key comes back into existence: the wrapped bundle
   * IS the verifier — a wrong secret fails the GCM tag. True when it opened.
   */
  async tryUnlockMessenger(candidate) {
    if (this.hasKeyBundle()) {
      const cipher = await this.openVaultWith(candidate);
      if (!cipher) return false;
      this.applyCipher(cipher);
      if (this.settings.passcodeHash) {
        this.settings.passcodeHash = "";
        this.settings.passcodeSalt = "";
        await this.saveSettings();
      }
    } else if (!this.verifyPasscodeHash(candidate)) {
      return false;
    }
    this.locked = false;
    try {
      await this.unlockOm2(candidate);
    } catch (err) {
      console.error("[message-bus] om2 identity unlock failed", err);
    }
    this.refreshChatViews();
    return true;
  }
  /** Re-engage the app lock now (manual, or the "Lock now" setting). */
  lockMessenger() {
    if (!this.hasPasscode()) return;
    this.locked = true;
    this.unlockedPeers.clear();
    this.applyCipher(null);
    void this.stopOm2();
    this.refreshChatViews();
  }
  /**
   * Whether one conversation is behind its lock. Locks only bite when a
   * passcode exists; unlocking lasts for the session, then re-arms.
   */
  isPeerLocked(peer) {
    return this.hasPasscode() && this.settings.lockedPeers[peer] === true && !this.unlockedPeers.has(peer);
  }
  /** Flag (or unflag) a conversation as locked. */
  async setPeerLocked(peer, locked) {
    if (!ADDRESS_RE.test(peer)) return;
    if (locked) {
      this.settings.lockedPeers[peer] = true;
      this.unlockedPeers.delete(peer);
    } else {
      delete this.settings.lockedPeers[peer];
      this.unlockedPeers.delete(peer);
    }
    await this.saveSettings();
    this.refreshChatViews();
  }
  /**
   * Try the unlock secret against one conversation's lock. True when it
   * opened. Async: with sealing on, each attempt is a full KDF unwrap.
   */
  async tryUnlockPeer(peer, candidate) {
    if (!await this.verifyAuth(candidate)) return false;
    this.unlockedPeers.add(peer);
    this.refreshChatViews();
    return true;
  }
  /** True when the bridge is running (enabled, relay set, unlocked identity). */
  get om2Ready() {
    return this.om2Bridge !== null;
  }
  /** This vault's fingerprint, when the bridge is up. */
  get om2Fp() {
    return this.om2Bridge?.myFp ?? null;
  }
  /**
   * Start the bridge if it can run: enabled, a relay set, and the identity in
   * session memory (which only an unlock provides). Safe to call repeatedly.
   */
  async tryStartOm2() {
    if (!this.settings.om2.enabled || this.settings.om2.relayUrl === "") return;
    if (this.om2Bridge || !this.om2Identity) return;
    this.om2Book = contactsBook(this.contacts, this.store);
    const bridge = new Bridge({
      mail: mailboxMailStore(this.store),
      kv: this.om2Kv,
      localAddress: this.settings.address,
      handle: this.settings.om2.handle || void 0,
      identity: this.om2Identity,
      contacts: this.om2Book,
      relayUrl: this.settings.om2.relayUrl,
      log: (msg) => {
        if (this.settings.debug) console.info(`[message-bus/om2] ${msg}`);
      },
      onEvent: (ev) => this.onOm2Event(ev)
    });
    await bridge.start();
    this.om2Bridge = bridge;
    this.app.workspace.trigger("messenger:tick");
  }
  /** Unwrap the identity with the unlock secret; starts the bridge when it lands. */
  async unlockOm2(secret) {
    if (!this.settings.om2.enabled || this.om2Bridge || this.om2Identity) return;
    const record = await loadIdentityRecord(this.om2Kv);
    if (!record) return;
    try {
      this.om2Identity = await openIdentityRecord(record, secret);
    } catch (err) {
      console.error("[message-bus] om2 identity unwrapping failed", err);
      new import_obsidian14.Notice("Messenger: the cross-vault identity is unreadable \u2014 regenerate it in settings", 1e4);
      return;
    }
    await this.tryStartOm2();
  }
  /** Stop the bridge and scrub the signing key (lock / unload / disable). */
  async stopOm2() {
    const bridge = this.om2Bridge;
    this.om2Bridge = null;
    if (bridge) await bridge.stop().catch((err) => console.error("[message-bus] om2 stop failed", err));
    wipeIdentity(this.om2Identity);
    this.om2Identity = null;
  }
  /**
   * Mint the identity (seed wrapped under the unlock secret) and start the
   * bridge. The secret is re-verified by the caller (a modal that already
   * checked it), so any GCM failure here is a bug, not a wrong password.
   */
  async createOm2Identity(secret) {
    const { record, identity } = await createIdentityRecord(secret);
    await saveIdentityRecord(this.om2Kv, record);
    this.om2Identity = identity;
    await this.tryStartOm2();
  }
  /** A fresh keypair; every contact must re-pin — §5.3 makes that loud. */
  async regenerateOm2Identity(secret) {
    await this.stopOm2();
    const { record, identity } = await regenerateIdentityRecord(secret);
    await saveIdentityRecord(this.om2Kv, record);
    this.om2Identity = identity;
    await this.tryStartOm2();
    new import_obsidian14.Notice(
      "Messenger: new keypair generated. Every cross-vault contact must re-add you \u2014 send them your new invite code.",
      12e3
    );
  }
  /** Turn cross-vault mail off and forget the identity record entirely. */
  async disableOm2() {
    await this.stopOm2();
    await clearIdentityRecord(this.om2Kv);
  }
  /** The pasteable reach-me artifact, when the bridge can advertise one. */
  om2Invite() {
    if (!this.om2Identity || this.settings.om2.relayUrl === "") return null;
    const invite = {
      publicKey: toB64u(this.om2Identity.publicKey),
      relay: this.settings.om2.relayUrl,
      handle: this.settings.om2.handle || void 0
    };
    return { code: encodeInvite(invite), link: inviteLink(invite) };
  }
  /** Send the sealed self-signed introduction to a bare invite's key. */
  async sendOm2Request(publicKeyB64u, relay, note) {
    if (!this.om2Bridge) throw new Error("Cross-vault mail is not running");
    return this.om2Bridge.sendRequest(fromB64u(publicKeyB64u), relay, note);
  }
  /** The 30-digit safety number against a contact's carried key. */
  om2SafetyNumber(contactPublicKeyB64u) {
    if (!this.om2Identity) return null;
    try {
      return safetyNumber(this.om2Identity.publicKey, fromB64u(contactPublicKeyB64u));
    } catch {
      return null;
    }
  }
  /** The chat view's shield badge: verified in-process, Social as legacy fallback. */
  async verifyMessage(msg) {
    const native = await verifyEnvelope(msg, this.om2Book);
    if (native) return native;
    const legacy = window.obsidianSocial;
    try {
      return legacy?.verify?.(msg) ?? null;
    } catch {
      return null;
    }
  }
  /** A pasted or scanned invite code: decode, then let the modal finish. */
  async handleInviteCode(raw) {
    const invite = decodeInvite(raw);
    if (!invite) {
      new import_obsidian14.Notice("Messenger: no invite code found in that text");
      return;
    }
    if (this.om2Fp && inviteFingerprint(invite) === this.om2Fp) {
      new import_obsidian14.Notice("Messenger: that's your own invite \u2014 you can't add yourself");
      return;
    }
    new AddContactModal(this.app, this, { inviteCode: raw }).open();
  }
  /** Bridge transitions → contact rows, notices, and a view refresh. */
  onOm2Event(ev) {
    if (ev.type === "quarantined" || ev.type === "keychange") {
      const fp = ev.type === "keychange" ? fingerprint(fromB64u(ev.publicKey || "x")) : ev.fp;
      const alias = aliasCandidate({ fp, handle: ev.type === "quarantined" ? ev.handle : void 0 }, new Uint8Array(32));
      void this.contacts.upsert({
        address: alias,
        name: ev.type === "keychange" ? "Key change \u2014 review" : ev.handle ? ev.handle.replace(/^@(.+)@.+$/, "$1") : `${ev.fp.slice(0, 11)}\u2026`,
        state: "request",
        updated: (/* @__PURE__ */ new Date()).toISOString(),
        fp,
        publicKey: ev.publicKey || void 0
      }).then(() => {
        this.refreshChatViews();
        this.app.workspace.trigger("messenger:tick");
      });
      new import_obsidian14.Notice(
        ev.type === "keychange" ? `Messenger: KEY CHANGE from a pinned contact \u2014 review under Contact requests` : `Messenger: contact request \u2014 see Contact requests`,
        8e3
      );
      return;
    }
    if (ev.type === "autopinned") {
      this.refreshChatViews();
      this.app.workspace.trigger("messenger:tick");
      return;
    }
    if (ev.type === "bounce") {
      new import_obsidian14.Notice(`Messenger: delivery failed \u2014 the message bounced back to your inbox`, 8e3);
    }
  }
  /**
   * The welcome modal was closed without saving. Signup is only complete
   * once a passcode exists — without one, onboarding stays open and the
   * modal returns next launch (it can't be dismissed away).
   */
  async dismissOnboarding() {
    if (this.settings.onboarded) return;
    if (!this.hasPasscode()) return;
    this.settings.onboarded = true;
    await this.saveSettings();
  }
  /**
   * Adopt the identity chosen in the welcome modal: set the mandatory
   * passcode (optionally minting the encryption key), move any mail from the
   * old address, register the new one, and deliver a first real message so
   * the bus proves itself. Runs after the modal has closed.
   */
  async completeOnboarding(address, displayName, passcode, encrypt = false, om2) {
    if (!ADDRESS_RE.test(address)) return;
    await this.setPasscode(passcode, encrypt);
    this.settings.displayName = displayName;
    if (om2 && /^https?:\/\//.test(om2.relayUrl)) {
      this.settings.om2.enabled = true;
      this.settings.om2.relayUrl = om2.relayUrl.replace(/\/+$/, "");
      try {
        await this.createOm2Identity(passcode);
        new import_obsidian14.Notice("Messenger: cross-vault mail is on \u2014 your invite lives in settings", 8e3);
      } catch (err) {
        console.error("[message-bus] om2 onboarding setup failed", err);
        new import_obsidian14.Notice("Messenger: cross-vault mail setup failed \u2014 enable it later in settings");
        this.settings.om2.enabled = false;
      }
    }
    await this.changeAddress(address);
    this.settings.onboarded = true;
    await this.saveSettings();
    await this.store.upsertRegistry({
      address: this.settings.address,
      name: this.selfRegistryName(),
      updated: (/* @__PURE__ */ new Date()).toISOString()
    });
    try {
      const otherReaders = (await this.store.listAddresses()).filter(
        (a) => a !== address && a !== BUS_ADDRESS
      );
      const paragraphs = [
        "Welcome aboard \u2014 this note is real mail, delivered the same way every message here travels: a markdown block appended to your inbox.",
        "",
        `Your address on this vault's bus is **${address}**. Anything in the vault can write to it \u2014 plugins, agents, scripts, you.`,
        "",
        "Your passcode now guards Messenger: it locks the app on startup, and any conversation you lock (right-click \u2192 *Lock conversation*) asks for it too. Change it anytime in Settings \u2192 Messenger.",
        ""
      ];
      if (otherReaders.length === 0) {
        paragraphs.push(
          "Right now this bus has one reader: you. To chat across devices, either point every vault at the same synced mail folder \u2014 Settings \u2192 Messenger \u2192 storage (Obsidian Sync skips hidden folders, so turn off \u201CHide mail storage\u201D) \u2014 or turn on **Cross-vault mail** in settings and connect by invite code: relay-carried, end-to-end encrypted, nothing shared.",
          ""
        );
      }
      paragraphs.push("Try *Send message* from the command palette, or just type below.");
      await this.bus.send(BUS_ADDRESS, address, paragraphs.join("\n"));
    } catch (err) {
      console.warn("[message-bus] welcome message failed", err);
    }
    await this.openChat(BUS_ADDRESS);
  }
  /**
   * Switch this participant to a new address: move the mailbox files (only
   * when the destination is empty — never clobber live mail), carry the read
   * cursor so history doesn't re-dispatch as "new", and fix the registry.
   * Both identity paths — the welcome modal and the settings tab — go through
   * here so they can't diverge again. No-op on an unchanged/invalid address.
   */
  async changeAddress(address) {
    if (!ADDRESS_RE.test(address) || address === this.settings.address) return;
    if (isReservedAddress(address)) {
      throw new Error("that name is reserved (SPEC \xA72) \u2014 pick another");
    }
    const old = this.settings.address;
    this.settings.address = address;
    const moved = await this.migrateMailbox(old, address);
    if (moved) {
      if (this.settings.cursors[old] && !this.settings.cursors[address]) {
        this.settings.cursors[address] = this.settings.cursors[old];
      }
      delete this.settings.cursors[old];
      if (this.settings.readAt[old] && !this.settings.readAt[address]) {
        this.settings.readAt[address] = this.settings.readAt[old];
      }
      delete this.settings.readAt[old];
    }
    if (this.settings.avatars[old] && !this.settings.avatars[address]) {
      this.settings.avatars[address] = this.settings.avatars[old];
      delete this.settings.avatars[old];
    }
    this.bus.setCursors(this.settings.cursors);
    await this.saveSettings();
    await this.store.upsertRegistry({
      address,
      name: this.selfRegistryName(),
      updated: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (old !== address) await this.store.removeRegistry(old);
    this.refreshChatViews();
  }
  /** Every address reachable on this bus, for send-to pickers: registry rows plus any folder with an inbox. */
  async knownAddresses() {
    const [registry, addresses] = await Promise.all([
      this.store.readRegistry(),
      this.store.listAddresses()
    ]);
    const names = new Map(registry.map((r) => [r.address, r.name]));
    return [.../* @__PURE__ */ new Set([...addresses, ...registry.map((r) => r.address)])].sort().map((address) => ({ address, name: names.get(address) ?? address }));
  }
  /**
   * Has this address proven it reads mail on this bus — by sending here, or
   * by publishing receipts (SPEC §11)? A contact you added or a folder your
   * own sends created proves nothing: the append succeeds whether or not a
   * human ever sees the message, so the UIs use this to warn before a silent
   * send-into-the-void (the isolated-device trap — a vault whose mail folder
   * isn't shared/synced with anyone is a bus of one).
   */
  async isConfirmedRecipient(address) {
    if (address === this.settings.address || address === BUS_ADDRESS) return true;
    const mine = await this.store.readInbox(this.settings.address);
    if (mine.some((m) => m.from === address)) return true;
    return this.store.hasReceipts(address);
  }
  /**
   * Mark a conversation read without opening it (context menu, API). Sets
   * the read cursor and, when enabled, emits read receipts for what was
   * actually unread.
   */
  async markPeerRead(peer) {
    if (!ADDRESS_RE.test(peer)) return;
    const me = this.settings.address;
    const since = this.settings.readAt[peer] ?? "";
    const unreadIds = (await this.store.readInbox(me)).filter((m) => m.from === peer && m.ts > since).map((m) => m.id);
    const next = (/* @__PURE__ */ new Date()).toISOString();
    if ((this.settings.readAt[peer] ?? "") >= next) return;
    this.settings.readAt[peer] = next;
    if (unreadIds.length > 0 && peer !== me && this.settings.sendReadReceipts) {
      try {
        await this.store.appendReceiptBlock(
          me,
          encodeReceiptBlock(me, "read", next, unreadIds)
        );
      } catch (err) {
        console.error("[message-bus] read receipt failed", err);
      }
    }
    await this.saveSettings();
    void this.updateBadge();
    this.refreshChatViews();
    this.requestBurnSweep();
  }
  /** Drop a peer's folder and every local trace of the conversation. */
  async deleteConversation(peer) {
    if (!ADDRESS_RE.test(peer)) return;
    await this.store.deleteAddress(peer);
    delete this.settings.cursors[peer];
    delete this.settings.readAt[peer];
    delete this.settings.drafts[peer];
    delete this.settings.mutedPeers[peer];
    delete this.settings.lockedPeers[peer];
    this.unlockedPeers.delete(peer);
    delete this.settings.wallpaperByPeer[peer];
    delete this.settings.wallpaperTintByPeer[peer];
    delete this.settings.retentionDaysByPeer[peer];
    delete this.settings.maxInboxMessagesByPeer[peer];
    await this.store.removeRegistry(peer);
    await this.saveSettings();
    void this.updateBadge();
    this.refreshChatViews();
  }
  /**
   * Write the full thread with `peer` into the vault as a normal note —
   * the human-readable archive for users whose mail lives in the hidden
   * storage folder. Returns the created file, or null when there was
   * nothing to write.
   */
  async exportConversation(peer) {
    if (!ADDRESS_RE.test(peer)) return null;
    const me = this.settings.address;
    const messages = await this.bus.loadConversation(me, peer);
    if (messages.length === 0) {
      new import_obsidian14.Notice("Nothing to export \u2014 no messages in this conversation");
      return null;
    }
    const registry = await this.store.readRegistry();
    const nameOf = (addr) => addr === me ? "You" : registry.find((r) => r.address === addr)?.name ?? addr;
    const lines = [
      `# Conversation \u2014 ${nameOf(peer)} (${peer})`,
      "",
      `Exported from Message Bus on ${(/* @__PURE__ */ new Date()).toLocaleString()}.`,
      ""
    ];
    let prevDay = "";
    for (const m of messages) {
      const d = new Date(m.ts);
      const day = d.toLocaleDateString();
      if (day !== prevDay) {
        lines.push(`## ${day}`, "");
        prevDay = day;
      }
      lines.push(
        `**${nameOf(m.from)}** \xB7 ${d.toLocaleTimeString(void 0, {
          hour: "numeric",
          minute: "2-digit"
        })}`,
        ""
      );
      for (const line of m.body.split("\n")) lines.push(`> ${line}`);
      lines.push("");
    }
    const folder = "Messenger Exports";
    try {
      await this.app.vault.createFolder(folder);
    } catch {
    }
    const stamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace(/[:T]/g, "-");
    let path = (0, import_obsidian14.normalizePath)(`${folder}/${peer} \u2014 ${stamp}.md`);
    let n = 2;
    while (this.app.vault.getAbstractFileByPath(path) instanceof import_obsidian14.TFile) {
      path = (0, import_obsidian14.normalizePath)(`${folder}/${peer} \u2014 ${stamp} (${n++}).md`);
    }
    const file = await this.app.vault.create(path, lines.join("\n"));
    new import_obsidian14.Notice(`Conversation exported to ${file.path}`);
    return file;
  }
  /**
   * Move a participant's inbox and receipts to a new address, when the
   * destination is empty (never clobber live mail). The old folder goes away
   * if the move empties it. Returns whether the inbox actually moved.
   */
  async migrateMailbox(oldAddr, newAddr) {
    if (oldAddr === newAddr) return false;
    if (!ADDRESS_RE.test(oldAddr) || !ADDRESS_RE.test(newAddr)) return false;
    const adapter = this.app.vault.adapter;
    const folderOf = (addr) => (0, import_obsidian14.normalizePath)(`${this.store.rootPath}/${addr}`);
    await this.store.ensureAddress(newAddr);
    let movedInbox = false;
    const moves = [
      [this.store.inboxPath(oldAddr), this.store.inboxPath(newAddr), true],
      [this.store.receiptsPath(oldAddr), this.store.receiptsPath(newAddr), false]
    ];
    for (const [from, to, isInbox] of moves) {
      if (!await adapter.exists(from)) continue;
      if (await adapter.exists(to)) continue;
      await adapter.write(to, await adapter.read(from));
      await adapter.remove(from);
      if (isInbox) movedInbox = true;
    }
    try {
      const listing = await adapter.list(folderOf(oldAddr));
      if (listing.files.length === 0 && listing.folders.length === 0) {
        await adapter.rmdir(folderOf(oldAddr), false);
      }
    } catch {
    }
    return movedInbox;
  }
  /** Create a vault folder (and parents) if missing — used for attachments. */
  async ensureFolder(path) {
    const adapter = this.app.vault.adapter;
    const parts = (0, import_obsidian14.normalizePath)(path).split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (await adapter.exists(current)) continue;
      try {
        await adapter.mkdir(current);
      } catch {
      }
    }
  }
  /** Where mail lives for a given storage mode. */
  storageTarget(hidden) {
    return hidden ? `.obsidian/plugins/${this.manifest.id}/mailbox` : this.settings.root;
  }
  /**
   * Whether Obsidian Sync (a core plugin) is enabled in this vault. Sync
   * deliberately skips dot-folders, so hidden mail storage never roams —
   * the UIs nudge users to a visible root when this and hiddenStorage
   * are both true.
   */
  syncEnabled() {
    try {
      const internal = this.app.internalPlugins;
      if (!internal) return false;
      if (typeof internal.getEnabledPluginById === "function") {
        if (internal.getEnabledPluginById("sync")) return true;
      }
      return internal.plugins?.sync?.enabled === true;
    } catch {
      return false;
    }
  }
  /**
   * First order of business on load: make sure mail sits where the current
   * mode wants it. Upgrades from visible `Messenger/` land here with a fresh
   * default of hidden storage — their mail moves into the dot-folder once,
   * and the emptied folder goes to the system trash.
   */
  async settleStorageRoot() {
    const target = this.storageTarget(this.settings.hiddenStorage);
    const previous = this.settings.lastRoot ?? (this.settings.hiddenStorage ? this.settings.root : void 0);
    await this.moveStorage(previous, target);
    return target;
  }
  /** Settings toggle: migrate live, then re-root the store. */
  async applyStorageMode(hidden) {
    const target = this.storageTarget(hidden);
    const previous = this.settings.lastRoot ?? this.store.rootPath;
    this.settings.hiddenStorage = hidden;
    await this.moveStorage(previous, target);
    this.store.setRoot(target);
    this.contacts.setRoot(target);
    await this.store.ensureRoot();
    await this.store.upsertRegistry({
      address: this.settings.address,
      name: this.selfRegistryName(),
      updated: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  async moveStorage(previous, target) {
    if (previous && previous !== target) {
      const adapter = this.app.vault.adapter;
      if (await adapter.exists((0, import_obsidian14.normalizePath)(previous))) {
        const result = await migrateRoot(adapter, previous, target);
        if (result.copied > 0 || result.skipped > 0) {
          new import_obsidian14.Notice(
            result.skipped > 0 ? `Messenger: ${previous} holds other files, so it stayed put \u2014 mail now lives in ${target}` : `Messenger: moved ${result.copied} mail file(s) to ${target}`
          );
        }
      }
    }
    if (this.settings.lastRoot !== target) {
      this.settings.lastRoot = target;
      await this.saveSettings();
    }
  }
};
/*! Bundled license information:

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
