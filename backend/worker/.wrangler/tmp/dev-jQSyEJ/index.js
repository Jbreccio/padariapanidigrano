var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// node-built-in-modules:crypto
import libDefault from "crypto";
var require_crypto = __commonJS({
  "node-built-in-modules:crypto"(exports, module) {
    init_modules_watch_stub();
    module.exports = libDefault;
  }
});

// ../node_modules/bcryptjs/dist/bcrypt.js
var require_bcrypt = __commonJS({
  "../node_modules/bcryptjs/dist/bcrypt.js"(exports, module) {
    init_modules_watch_stub();
    (function(global2, factory) {
      if (typeof define === "function" && define["amd"])
        define([], factory);
      else if (typeof __require === "function" && typeof module === "object" && module && module["exports"])
        module["exports"] = factory();
      else
        (global2["dcodeIO"] = global2["dcodeIO"] || {})["bcrypt"] = factory();
    })(exports, function() {
      "use strict";
      var bcrypt = {};
      var randomFallback = null;
      function random(len) {
        if (typeof module !== "undefined" && module && module["exports"])
          try {
            return require_crypto()["randomBytes"](len);
          } catch (e) {
          }
        try {
          var a;
          (self["crypto"] || self["msCrypto"])["getRandomValues"](a = new Uint32Array(len));
          return Array.prototype.slice.call(a);
        } catch (e) {
        }
        if (!randomFallback)
          throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
        return randomFallback(len);
      }
      __name(random, "random");
      var randomAvailable = false;
      try {
        random(1);
        randomAvailable = true;
      } catch (e) {
      }
      randomFallback = null;
      bcrypt.setRandomFallback = function(random2) {
        randomFallback = random2;
      };
      bcrypt.genSaltSync = function(rounds, seed_length) {
        rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof rounds !== "number")
          throw Error("Illegal arguments: " + typeof rounds + ", " + typeof seed_length);
        if (rounds < 4)
          rounds = 4;
        else if (rounds > 31)
          rounds = 31;
        var salt = [];
        salt.push("$2a$");
        if (rounds < 10)
          salt.push("0");
        salt.push(rounds.toString());
        salt.push("$");
        salt.push(base64_encode(random(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
        return salt.join("");
      };
      bcrypt.genSalt = function(rounds, seed_length, callback) {
        if (typeof seed_length === "function")
          callback = seed_length, seed_length = void 0;
        if (typeof rounds === "function")
          callback = rounds, rounds = void 0;
        if (typeof rounds === "undefined")
          rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
        else if (typeof rounds !== "number")
          throw Error("illegal arguments: " + typeof rounds);
        function _async(callback2) {
          nextTick(function() {
            try {
              callback2(null, bcrypt.genSaltSync(rounds));
            } catch (err) {
              callback2(err);
            }
          });
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt.hashSync = function(s, salt) {
        if (typeof salt === "undefined")
          salt = GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof salt === "number")
          salt = bcrypt.genSaltSync(salt);
        if (typeof s !== "string" || typeof salt !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof salt);
        return _hash(s, salt);
      };
      bcrypt.hash = function(s, salt, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s === "string" && typeof salt === "number")
            bcrypt.genSalt(salt, function(err, salt2) {
              _hash(s, salt2, callback2, progressCallback);
            });
          else if (typeof s === "string" && typeof salt === "string")
            _hash(s, salt, callback2, progressCallback);
          else
            nextTick(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof salt)));
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      function safeStringCompare(known, unknown) {
        var right = 0, wrong = 0;
        for (var i = 0, k = known.length; i < k; ++i) {
          if (known.charCodeAt(i) === unknown.charCodeAt(i))
            ++right;
          else
            ++wrong;
        }
        if (right < 0)
          return false;
        return wrong === 0;
      }
      __name(safeStringCompare, "safeStringCompare");
      bcrypt.compareSync = function(s, hash) {
        if (typeof s !== "string" || typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof hash);
        if (hash.length !== 60)
          return false;
        return safeStringCompare(bcrypt.hashSync(s, hash.substr(0, hash.length - 31)), hash);
      };
      bcrypt.compare = function(s, hash, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s !== "string" || typeof hash !== "string") {
            nextTick(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof hash)));
            return;
          }
          if (hash.length !== 60) {
            nextTick(callback2.bind(this, null, false));
            return;
          }
          bcrypt.hash(s, hash.substr(0, 29), function(err, comp) {
            if (err)
              callback2(err);
            else
              callback2(null, safeStringCompare(comp, hash));
          }, progressCallback);
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt.getRounds = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        return parseInt(hash.split("$")[2], 10);
      };
      bcrypt.getSalt = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        if (hash.length !== 60)
          throw Error("Illegal hash length: " + hash.length + " != 60");
        return hash.substring(0, 29);
      };
      var nextTick = typeof process !== "undefined" && process && typeof process.nextTick === "function" ? typeof setImmediate === "function" ? setImmediate : process.nextTick : setTimeout;
      function stringToBytes(str) {
        var out = [], i = 0;
        utfx.encodeUTF16toUTF8(function() {
          if (i >= str.length) return null;
          return str.charCodeAt(i++);
        }, function(b) {
          out.push(b);
        });
        return out;
      }
      __name(stringToBytes, "stringToBytes");
      var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
      var BASE64_INDEX = [
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        0,
        1,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
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
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        -1,
        -1,
        -1,
        -1,
        -1
      ];
      var stringFromCharCode = String.fromCharCode;
      function base64_encode(b, len) {
        var off = 0, rs = [], c1, c2;
        if (len <= 0 || len > b.length)
          throw Error("Illegal len: " + len);
        while (off < len) {
          c1 = b[off++] & 255;
          rs.push(BASE64_CODE[c1 >> 2 & 63]);
          c1 = (c1 & 3) << 4;
          if (off >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off++] & 255;
          c1 |= c2 >> 4 & 15;
          rs.push(BASE64_CODE[c1 & 63]);
          c1 = (c2 & 15) << 2;
          if (off >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off++] & 255;
          c1 |= c2 >> 6 & 3;
          rs.push(BASE64_CODE[c1 & 63]);
          rs.push(BASE64_CODE[c2 & 63]);
        }
        return rs.join("");
      }
      __name(base64_encode, "base64_encode");
      function base64_decode(s, len) {
        var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
        if (len <= 0)
          throw Error("Illegal len: " + len);
        while (off < slen - 1 && olen < len) {
          code = s.charCodeAt(off++);
          c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          code = s.charCodeAt(off++);
          c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c1 == -1 || c2 == -1)
            break;
          o = c1 << 2 >>> 0;
          o |= (c2 & 48) >> 4;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off >= slen)
            break;
          code = s.charCodeAt(off++);
          c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c3 == -1)
            break;
          o = (c2 & 15) << 4 >>> 0;
          o |= (c3 & 60) >> 2;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off >= slen)
            break;
          code = s.charCodeAt(off++);
          c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          o = (c3 & 3) << 6 >>> 0;
          o |= c4;
          rs.push(stringFromCharCode(o));
          ++olen;
        }
        var res = [];
        for (off = 0; off < olen; off++)
          res.push(rs[off].charCodeAt(0));
        return res;
      }
      __name(base64_decode, "base64_decode");
      var utfx = (function() {
        "use strict";
        var utfx2 = {};
        utfx2.MAX_CODEPOINT = 1114111;
        utfx2.encodeUTF8 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = /* @__PURE__ */ __name(function() {
              return null;
            }, "src");
          while (cp !== null || (cp = src()) !== null) {
            if (cp < 128)
              dst(cp & 127);
            else if (cp < 2048)
              dst(cp >> 6 & 31 | 192), dst(cp & 63 | 128);
            else if (cp < 65536)
              dst(cp >> 12 & 15 | 224), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            else
              dst(cp >> 18 & 7 | 240), dst(cp >> 12 & 63 | 128), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            cp = null;
          }
        };
        utfx2.decodeUTF8 = function(src, dst) {
          var a, b, c, d, fail = /* @__PURE__ */ __name(function(b2) {
            b2 = b2.slice(0, b2.indexOf(null));
            var err = Error(b2.toString());
            err.name = "TruncatedError";
            err["bytes"] = b2;
            throw err;
          }, "fail");
          while ((a = src()) !== null) {
            if ((a & 128) === 0)
              dst(a);
            else if ((a & 224) === 192)
              (b = src()) === null && fail([a, b]), dst((a & 31) << 6 | b & 63);
            else if ((a & 240) === 224)
              ((b = src()) === null || (c = src()) === null) && fail([a, b, c]), dst((a & 15) << 12 | (b & 63) << 6 | c & 63);
            else if ((a & 248) === 240)
              ((b = src()) === null || (c = src()) === null || (d = src()) === null) && fail([a, b, c, d]), dst((a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63);
            else throw RangeError("Illegal starting byte: " + a);
          }
        };
        utfx2.UTF16toUTF8 = function(src, dst) {
          var c1, c2 = null;
          while (true) {
            if ((c1 = c2 !== null ? c2 : src()) === null)
              break;
            if (c1 >= 55296 && c1 <= 57343) {
              if ((c2 = src()) !== null) {
                if (c2 >= 56320 && c2 <= 57343) {
                  dst((c1 - 55296) * 1024 + c2 - 56320 + 65536);
                  c2 = null;
                  continue;
                }
              }
            }
            dst(c1);
          }
          if (c2 !== null) dst(c2);
        };
        utfx2.UTF8toUTF16 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = /* @__PURE__ */ __name(function() {
              return null;
            }, "src");
          while (cp !== null || (cp = src()) !== null) {
            if (cp <= 65535)
              dst(cp);
            else
              cp -= 65536, dst((cp >> 10) + 55296), dst(cp % 1024 + 56320);
            cp = null;
          }
        };
        utfx2.encodeUTF16toUTF8 = function(src, dst) {
          utfx2.UTF16toUTF8(src, function(cp) {
            utfx2.encodeUTF8(cp, dst);
          });
        };
        utfx2.decodeUTF8toUTF16 = function(src, dst) {
          utfx2.decodeUTF8(src, function(cp) {
            utfx2.UTF8toUTF16(cp, dst);
          });
        };
        utfx2.calculateCodePoint = function(cp) {
          return cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
        };
        utfx2.calculateUTF8 = function(src) {
          var cp, l = 0;
          while ((cp = src()) !== null)
            l += utfx2.calculateCodePoint(cp);
          return l;
        };
        utfx2.calculateUTF16asUTF8 = function(src) {
          var n = 0, l = 0;
          utfx2.UTF16toUTF8(src, function(cp) {
            ++n;
            l += utfx2.calculateCodePoint(cp);
          });
          return [n, l];
        };
        return utfx2;
      })();
      Date.now = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      var BCRYPT_SALT_LEN = 16;
      var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
      var BLOWFISH_NUM_ROUNDS = 16;
      var MAX_EXECUTION_TIME = 100;
      var P_ORIG = [
        608135816,
        2242054355,
        320440878,
        57701188,
        2752067618,
        698298832,
        137296536,
        3964562569,
        1160258022,
        953160567,
        3193202383,
        887688300,
        3232508343,
        3380367581,
        1065670069,
        3041331479,
        2450970073,
        2306472731
      ];
      var S_ORIG = [
        3509652390,
        2564797868,
        805139163,
        3491422135,
        3101798381,
        1780907670,
        3128725573,
        4046225305,
        614570311,
        3012652279,
        134345442,
        2240740374,
        1667834072,
        1901547113,
        2757295779,
        4103290238,
        227898511,
        1921955416,
        1904987480,
        2182433518,
        2069144605,
        3260701109,
        2620446009,
        720527379,
        3318853667,
        677414384,
        3393288472,
        3101374703,
        2390351024,
        1614419982,
        1822297739,
        2954791486,
        3608508353,
        3174124327,
        2024746970,
        1432378464,
        3864339955,
        2857741204,
        1464375394,
        1676153920,
        1439316330,
        715854006,
        3033291828,
        289532110,
        2706671279,
        2087905683,
        3018724369,
        1668267050,
        732546397,
        1947742710,
        3462151702,
        2609353502,
        2950085171,
        1814351708,
        2050118529,
        680887927,
        999245976,
        1800124847,
        3300911131,
        1713906067,
        1641548236,
        4213287313,
        1216130144,
        1575780402,
        4018429277,
        3917837745,
        3693486850,
        3949271944,
        596196993,
        3549867205,
        258830323,
        2213823033,
        772490370,
        2760122372,
        1774776394,
        2652871518,
        566650946,
        4142492826,
        1728879713,
        2882767088,
        1783734482,
        3629395816,
        2517608232,
        2874225571,
        1861159788,
        326777828,
        3124490320,
        2130389656,
        2716951837,
        967770486,
        1724537150,
        2185432712,
        2364442137,
        1164943284,
        2105845187,
        998989502,
        3765401048,
        2244026483,
        1075463327,
        1455516326,
        1322494562,
        910128902,
        469688178,
        1117454909,
        936433444,
        3490320968,
        3675253459,
        1240580251,
        122909385,
        2157517691,
        634681816,
        4142456567,
        3825094682,
        3061402683,
        2540495037,
        79693498,
        3249098678,
        1084186820,
        1583128258,
        426386531,
        1761308591,
        1047286709,
        322548459,
        995290223,
        1845252383,
        2603652396,
        3431023940,
        2942221577,
        3202600964,
        3727903485,
        1712269319,
        422464435,
        3234572375,
        1170764815,
        3523960633,
        3117677531,
        1434042557,
        442511882,
        3600875718,
        1076654713,
        1738483198,
        4213154764,
        2393238008,
        3677496056,
        1014306527,
        4251020053,
        793779912,
        2902807211,
        842905082,
        4246964064,
        1395751752,
        1040244610,
        2656851899,
        3396308128,
        445077038,
        3742853595,
        3577915638,
        679411651,
        2892444358,
        2354009459,
        1767581616,
        3150600392,
        3791627101,
        3102740896,
        284835224,
        4246832056,
        1258075500,
        768725851,
        2589189241,
        3069724005,
        3532540348,
        1274779536,
        3789419226,
        2764799539,
        1660621633,
        3471099624,
        4011903706,
        913787905,
        3497959166,
        737222580,
        2514213453,
        2928710040,
        3937242737,
        1804850592,
        3499020752,
        2949064160,
        2386320175,
        2390070455,
        2415321851,
        4061277028,
        2290661394,
        2416832540,
        1336762016,
        1754252060,
        3520065937,
        3014181293,
        791618072,
        3188594551,
        3933548030,
        2332172193,
        3852520463,
        3043980520,
        413987798,
        3465142937,
        3030929376,
        4245938359,
        2093235073,
        3534596313,
        375366246,
        2157278981,
        2479649556,
        555357303,
        3870105701,
        2008414854,
        3344188149,
        4221384143,
        3956125452,
        2067696032,
        3594591187,
        2921233993,
        2428461,
        544322398,
        577241275,
        1471733935,
        610547355,
        4027169054,
        1432588573,
        1507829418,
        2025931657,
        3646575487,
        545086370,
        48609733,
        2200306550,
        1653985193,
        298326376,
        1316178497,
        3007786442,
        2064951626,
        458293330,
        2589141269,
        3591329599,
        3164325604,
        727753846,
        2179363840,
        146436021,
        1461446943,
        4069977195,
        705550613,
        3059967265,
        3887724982,
        4281599278,
        3313849956,
        1404054877,
        2845806497,
        146425753,
        1854211946,
        1266315497,
        3048417604,
        3681880366,
        3289982499,
        290971e4,
        1235738493,
        2632868024,
        2414719590,
        3970600049,
        1771706367,
        1449415276,
        3266420449,
        422970021,
        1963543593,
        2690192192,
        3826793022,
        1062508698,
        1531092325,
        1804592342,
        2583117782,
        2714934279,
        4024971509,
        1294809318,
        4028980673,
        1289560198,
        2221992742,
        1669523910,
        35572830,
        157838143,
        1052438473,
        1016535060,
        1802137761,
        1753167236,
        1386275462,
        3080475397,
        2857371447,
        1040679964,
        2145300060,
        2390574316,
        1461121720,
        2956646967,
        4031777805,
        4028374788,
        33600511,
        2920084762,
        1018524850,
        629373528,
        3691585981,
        3515945977,
        2091462646,
        2486323059,
        586499841,
        988145025,
        935516892,
        3367335476,
        2599673255,
        2839830854,
        265290510,
        3972581182,
        2759138881,
        3795373465,
        1005194799,
        847297441,
        406762289,
        1314163512,
        1332590856,
        1866599683,
        4127851711,
        750260880,
        613907577,
        1450815602,
        3165620655,
        3734664991,
        3650291728,
        3012275730,
        3704569646,
        1427272223,
        778793252,
        1343938022,
        2676280711,
        2052605720,
        1946737175,
        3164576444,
        3914038668,
        3967478842,
        3682934266,
        1661551462,
        3294938066,
        4011595847,
        840292616,
        3712170807,
        616741398,
        312560963,
        711312465,
        1351876610,
        322626781,
        1910503582,
        271666773,
        2175563734,
        1594956187,
        70604529,
        3617834859,
        1007753275,
        1495573769,
        4069517037,
        2549218298,
        2663038764,
        504708206,
        2263041392,
        3941167025,
        2249088522,
        1514023603,
        1998579484,
        1312622330,
        694541497,
        2582060303,
        2151582166,
        1382467621,
        776784248,
        2618340202,
        3323268794,
        2497899128,
        2784771155,
        503983604,
        4076293799,
        907881277,
        423175695,
        432175456,
        1378068232,
        4145222326,
        3954048622,
        3938656102,
        3820766613,
        2793130115,
        2977904593,
        26017576,
        3274890735,
        3194772133,
        1700274565,
        1756076034,
        4006520079,
        3677328699,
        720338349,
        1533947780,
        354530856,
        688349552,
        3973924725,
        1637815568,
        332179504,
        3949051286,
        53804574,
        2852348879,
        3044236432,
        1282449977,
        3583942155,
        3416972820,
        4006381244,
        1617046695,
        2628476075,
        3002303598,
        1686838959,
        431878346,
        2686675385,
        1700445008,
        1080580658,
        1009431731,
        832498133,
        3223435511,
        2605976345,
        2271191193,
        2516031870,
        1648197032,
        4164389018,
        2548247927,
        300782431,
        375919233,
        238389289,
        3353747414,
        2531188641,
        2019080857,
        1475708069,
        455242339,
        2609103871,
        448939670,
        3451063019,
        1395535956,
        2413381860,
        1841049896,
        1491858159,
        885456874,
        4264095073,
        4001119347,
        1565136089,
        3898914787,
        1108368660,
        540939232,
        1173283510,
        2745871338,
        3681308437,
        4207628240,
        3343053890,
        4016749493,
        1699691293,
        1103962373,
        3625875870,
        2256883143,
        3830138730,
        1031889488,
        3479347698,
        1535977030,
        4236805024,
        3251091107,
        2132092099,
        1774941330,
        1199868427,
        1452454533,
        157007616,
        2904115357,
        342012276,
        595725824,
        1480756522,
        206960106,
        497939518,
        591360097,
        863170706,
        2375253569,
        3596610801,
        1814182875,
        2094937945,
        3421402208,
        1082520231,
        3463918190,
        2785509508,
        435703966,
        3908032597,
        1641649973,
        2842273706,
        3305899714,
        1510255612,
        2148256476,
        2655287854,
        3276092548,
        4258621189,
        236887753,
        3681803219,
        274041037,
        1734335097,
        3815195456,
        3317970021,
        1899903192,
        1026095262,
        4050517792,
        356393447,
        2410691914,
        3873677099,
        3682840055,
        3913112168,
        2491498743,
        4132185628,
        2489919796,
        1091903735,
        1979897079,
        3170134830,
        3567386728,
        3557303409,
        857797738,
        1136121015,
        1342202287,
        507115054,
        2535736646,
        337727348,
        3213592640,
        1301675037,
        2528481711,
        1895095763,
        1721773893,
        3216771564,
        62756741,
        2142006736,
        835421444,
        2531993523,
        1442658625,
        3659876326,
        2882144922,
        676362277,
        1392781812,
        170690266,
        3921047035,
        1759253602,
        3611846912,
        1745797284,
        664899054,
        1329594018,
        3901205900,
        3045908486,
        2062866102,
        2865634940,
        3543621612,
        3464012697,
        1080764994,
        553557557,
        3656615353,
        3996768171,
        991055499,
        499776247,
        1265440854,
        648242737,
        3940784050,
        980351604,
        3713745714,
        1749149687,
        3396870395,
        4211799374,
        3640570775,
        1161844396,
        3125318951,
        1431517754,
        545492359,
        4268468663,
        3499529547,
        1437099964,
        2702547544,
        3433638243,
        2581715763,
        2787789398,
        1060185593,
        1593081372,
        2418618748,
        4260947970,
        69676912,
        2159744348,
        86519011,
        2512459080,
        3838209314,
        1220612927,
        3339683548,
        133810670,
        1090789135,
        1078426020,
        1569222167,
        845107691,
        3583754449,
        4072456591,
        1091646820,
        628848692,
        1613405280,
        3757631651,
        526609435,
        236106946,
        48312990,
        2942717905,
        3402727701,
        1797494240,
        859738849,
        992217954,
        4005476642,
        2243076622,
        3870952857,
        3732016268,
        765654824,
        3490871365,
        2511836413,
        1685915746,
        3888969200,
        1414112111,
        2273134842,
        3281911079,
        4080962846,
        172450625,
        2569994100,
        980381355,
        4109958455,
        2819808352,
        2716589560,
        2568741196,
        3681446669,
        3329971472,
        1835478071,
        660984891,
        3704678404,
        4045999559,
        3422617507,
        3040415634,
        1762651403,
        1719377915,
        3470491036,
        2693910283,
        3642056355,
        3138596744,
        1364962596,
        2073328063,
        1983633131,
        926494387,
        3423689081,
        2150032023,
        4096667949,
        1749200295,
        3328846651,
        309677260,
        2016342300,
        1779581495,
        3079819751,
        111262694,
        1274766160,
        443224088,
        298511866,
        1025883608,
        3806446537,
        1145181785,
        168956806,
        3641502830,
        3584813610,
        1689216846,
        3666258015,
        3200248200,
        1692713982,
        2646376535,
        4042768518,
        1618508792,
        1610833997,
        3523052358,
        4130873264,
        2001055236,
        3610705100,
        2202168115,
        4028541809,
        2961195399,
        1006657119,
        2006996926,
        3186142756,
        1430667929,
        3210227297,
        1314452623,
        4074634658,
        4101304120,
        2273951170,
        1399257539,
        3367210612,
        3027628629,
        1190975929,
        2062231137,
        2333990788,
        2221543033,
        2438960610,
        1181637006,
        548689776,
        2362791313,
        3372408396,
        3104550113,
        3145860560,
        296247880,
        1970579870,
        3078560182,
        3769228297,
        1714227617,
        3291629107,
        3898220290,
        166772364,
        1251581989,
        493813264,
        448347421,
        195405023,
        2709975567,
        677966185,
        3703036547,
        1463355134,
        2715995803,
        1338867538,
        1343315457,
        2802222074,
        2684532164,
        233230375,
        2599980071,
        2000651841,
        3277868038,
        1638401717,
        4028070440,
        3237316320,
        6314154,
        819756386,
        300326615,
        590932579,
        1405279636,
        3267499572,
        3150704214,
        2428286686,
        3959192993,
        3461946742,
        1862657033,
        1266418056,
        963775037,
        2089974820,
        2263052895,
        1917689273,
        448879540,
        3550394620,
        3981727096,
        150775221,
        3627908307,
        1303187396,
        508620638,
        2975983352,
        2726630617,
        1817252668,
        1876281319,
        1457606340,
        908771278,
        3720792119,
        3617206836,
        2455994898,
        1729034894,
        1080033504,
        976866871,
        3556439503,
        2881648439,
        1522871579,
        1555064734,
        1336096578,
        3548522304,
        2579274686,
        3574697629,
        3205460757,
        3593280638,
        3338716283,
        3079412587,
        564236357,
        2993598910,
        1781952180,
        1464380207,
        3163844217,
        3332601554,
        1699332808,
        1393555694,
        1183702653,
        3581086237,
        1288719814,
        691649499,
        2847557200,
        2895455976,
        3193889540,
        2717570544,
        1781354906,
        1676643554,
        2592534050,
        3230253752,
        1126444790,
        2770207658,
        2633158820,
        2210423226,
        2615765581,
        2414155088,
        3127139286,
        673620729,
        2805611233,
        1269405062,
        4015350505,
        3341807571,
        4149409754,
        1057255273,
        2012875353,
        2162469141,
        2276492801,
        2601117357,
        993977747,
        3918593370,
        2654263191,
        753973209,
        36408145,
        2530585658,
        25011837,
        3520020182,
        2088578344,
        530523599,
        2918365339,
        1524020338,
        1518925132,
        3760827505,
        3759777254,
        1202760957,
        3985898139,
        3906192525,
        674977740,
        4174734889,
        2031300136,
        2019492241,
        3983892565,
        4153806404,
        3822280332,
        352677332,
        2297720250,
        60907813,
        90501309,
        3286998549,
        1016092578,
        2535922412,
        2839152426,
        457141659,
        509813237,
        4120667899,
        652014361,
        1966332200,
        2975202805,
        55981186,
        2327461051,
        676427537,
        3255491064,
        2882294119,
        3433927263,
        1307055953,
        942726286,
        933058658,
        2468411793,
        3933900994,
        4215176142,
        1361170020,
        2001714738,
        2830558078,
        3274259782,
        1222529897,
        1679025792,
        2729314320,
        3714953764,
        1770335741,
        151462246,
        3013232138,
        1682292957,
        1483529935,
        471910574,
        1539241949,
        458788160,
        3436315007,
        1807016891,
        3718408830,
        978976581,
        1043663428,
        3165965781,
        1927990952,
        4200891579,
        2372276910,
        3208408903,
        3533431907,
        1412390302,
        2931980059,
        4132332400,
        1947078029,
        3881505623,
        4168226417,
        2941484381,
        1077988104,
        1320477388,
        886195818,
        18198404,
        3786409e3,
        2509781533,
        112762804,
        3463356488,
        1866414978,
        891333506,
        18488651,
        661792760,
        1628790961,
        3885187036,
        3141171499,
        876946877,
        2693282273,
        1372485963,
        791857591,
        2686433993,
        3759982718,
        3167212022,
        3472953795,
        2716379847,
        445679433,
        3561995674,
        3504004811,
        3574258232,
        54117162,
        3331405415,
        2381918588,
        3769707343,
        4154350007,
        1140177722,
        4074052095,
        668550556,
        3214352940,
        367459370,
        261225585,
        2610173221,
        4209349473,
        3468074219,
        3265815641,
        314222801,
        3066103646,
        3808782860,
        282218597,
        3406013506,
        3773591054,
        379116347,
        1285071038,
        846784868,
        2669647154,
        3771962079,
        3550491691,
        2305946142,
        453669953,
        1268987020,
        3317592352,
        3279303384,
        3744833421,
        2610507566,
        3859509063,
        266596637,
        3847019092,
        517658769,
        3462560207,
        3443424879,
        370717030,
        4247526661,
        2224018117,
        4143653529,
        4112773975,
        2788324899,
        2477274417,
        1456262402,
        2901442914,
        1517677493,
        1846949527,
        2295493580,
        3734397586,
        2176403920,
        1280348187,
        1908823572,
        3871786941,
        846861322,
        1172426758,
        3287448474,
        3383383037,
        1655181056,
        3139813346,
        901632758,
        1897031941,
        2986607138,
        3066810236,
        3447102507,
        1393639104,
        373351379,
        950779232,
        625454576,
        3124240540,
        4148612726,
        2007998917,
        544563296,
        2244738638,
        2330496472,
        2058025392,
        1291430526,
        424198748,
        50039436,
        29584100,
        3605783033,
        2429876329,
        2791104160,
        1057563949,
        3255363231,
        3075367218,
        3463963227,
        1469046755,
        985887462
      ];
      var C_ORIG = [
        1332899944,
        1700884034,
        1701343084,
        1684370003,
        1668446532,
        1869963892
      ];
      function _encipher(lr, off, P, S) {
        var n, l = lr[off], r = lr[off + 1];
        l ^= P[0];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[1];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[2];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[3];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[4];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[5];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[6];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[7];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[8];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[9];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[10];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[11];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[12];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[13];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[14];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[15];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[16];
        lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
        lr[off + 1] = l;
        return lr;
      }
      __name(_encipher, "_encipher");
      function _streamtoword(data, offp) {
        for (var i = 0, word = 0; i < 4; ++i)
          word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
        return { key: word, offp };
      }
      __name(_streamtoword, "_streamtoword");
      function _key(key, P, S) {
        var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
        for (i = 0; i < plen; i += 2)
          lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_key, "_key");
      function _ekskey(data, key, P, S) {
        var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
        offp = 0;
        for (i = 0; i < plen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_ekskey, "_ekskey");
      function _crypt(b, salt, rounds, callback, progressCallback) {
        var cdata = C_ORIG.slice(), clen = cdata.length, err;
        if (rounds < 4 || rounds > 31) {
          err = Error("Illegal number of rounds (4-31): " + rounds);
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.length !== BCRYPT_SALT_LEN) {
          err = Error("Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN);
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        rounds = 1 << rounds >>> 0;
        var P, S, i = 0, j;
        if (Int32Array) {
          P = new Int32Array(P_ORIG);
          S = new Int32Array(S_ORIG);
        } else {
          P = P_ORIG.slice();
          S = S_ORIG.slice();
        }
        _ekskey(salt, b, P, S);
        function next() {
          if (progressCallback)
            progressCallback(i / rounds);
          if (i < rounds) {
            var start = Date.now();
            for (; i < rounds; ) {
              i = i + 1;
              _key(b, P, S);
              _key(salt, P, S);
              if (Date.now() - start > MAX_EXECUTION_TIME)
                break;
            }
          } else {
            for (i = 0; i < 64; i++)
              for (j = 0; j < clen >> 1; j++)
                _encipher(cdata, j << 1, P, S);
            var ret = [];
            for (i = 0; i < clen; i++)
              ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
            if (callback) {
              callback(null, ret);
              return;
            } else
              return ret;
          }
          if (callback)
            nextTick(next);
        }
        __name(next, "next");
        if (typeof callback !== "undefined") {
          next();
        } else {
          var res;
          while (true)
            if (typeof (res = next()) !== "undefined")
              return res || [];
        }
      }
      __name(_crypt, "_crypt");
      function _hash(s, salt, callback, progressCallback) {
        var err;
        if (typeof s !== "string" || typeof salt !== "string") {
          err = Error("Invalid string / salt: Not a string");
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var minor, offset;
        if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
          err = Error("Invalid salt version: " + salt.substring(0, 2));
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.charAt(2) === "$")
          minor = String.fromCharCode(0), offset = 3;
        else {
          minor = salt.charAt(2);
          if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
            err = Error("Invalid salt revision: " + salt.substring(2, 4));
            if (callback) {
              nextTick(callback.bind(this, err));
              return;
            } else
              throw err;
          }
          offset = 4;
        }
        if (salt.charAt(offset + 2) > "$") {
          err = Error("Missing salt rounds");
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
        s += minor >= "a" ? "\0" : "";
        var passwordb = stringToBytes(s), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
        function finish(bytes) {
          var res = [];
          res.push("$2");
          if (minor >= "a")
            res.push(minor);
          res.push("$");
          if (rounds < 10)
            res.push("0");
          res.push(rounds.toString());
          res.push("$");
          res.push(base64_encode(saltb, saltb.length));
          res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
          return res.join("");
        }
        __name(finish, "finish");
        if (typeof callback == "undefined")
          return finish(_crypt(passwordb, saltb, rounds));
        else {
          _crypt(passwordb, saltb, rounds, function(err2, bytes) {
            if (err2)
              callback(err2, null);
            else
              callback(null, finish(bytes));
          }, progressCallback);
        }
      }
      __name(_hash, "_hash");
      bcrypt.encodeBase64 = base64_encode;
      bcrypt.decodeBase64 = base64_decode;
      return bcrypt;
    });
  }
});

// .wrangler/tmp/bundle-v3A51o/middleware-loader.entry.ts
init_modules_watch_stub();

// .wrangler/tmp/bundle-v3A51o/middleware-insertion-facade.js
init_modules_watch_stub();

// index.js
init_modules_watch_stub();

// src/utils/helpers.js
init_modules_watch_stub();

// src/utils/cors.js
init_modules_watch_stub();
var allowedOrigins = [
  // DEV
  "http://localhost:5173",
  "http://localhost:4173",
  // DOMÍNIO REAL
  "https://www.santuariodefatima.com.br",
  "https://santuariodefatima.com.br",
  // Workers (fallback)
  "https://santuariodefatima.oibreccio.workers.dev",
  "https://santuariofatima-frontend.oibreccio.workers.dev"
];
var baseHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
var corsHeaders2 = {
  ...baseHeaders,
  "Access-Control-Allow-Origin": "*"
};
function getCorsHeaders(origin) {
  if (!origin) {
    return {
      ...baseHeaders,
      "Access-Control-Allow-Origin": "*"
    };
  }
  if (allowedOrigins.includes(origin)) {
    console.log(`\u2705 CORS liberado para: ${origin}`);
    return {
      ...baseHeaders,
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true"
    };
  }
  console.log(`\u274C CORS bloqueado para: ${origin}`);
  return {
    ...baseHeaders,
    "Access-Control-Allow-Origin": "null"
  };
}
__name(getCorsHeaders, "getCorsHeaders");
function handleCorsOptions(request) {
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("Origin");
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin)
    });
  }
  return null;
}
__name(handleCorsOptions, "handleCorsOptions");
function addCorsHeaders(response, request) {
  const origin = request.headers.get("Origin");
  const headers = getCorsHeaders(origin);
  const newResponse = new Response(response.body, response);
  Object.entries(headers).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  return newResponse;
}
__name(addCorsHeaders, "addCorsHeaders");

// src/utils/helpers.js
function cleanText(text) {
  if (!text) return text;
  return text.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}
__name(cleanText, "cleanText");
function cleanYouTubeTitle(title) {
  if (!title) return title;
  return title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&aacute;/g, "a").replace(/&eacute;/g, "e").replace(/&iacute;/g, "i").replace(/&oacute;/g, "o").replace(/&uacute;/g, "u").replace(/&atilde;/g, "a").replace(/&otilde;/g, "o").replace(/&ccedil;/g, "c").replace(/&acirc;/g, "a").replace(/&ecirc;/g, "e").replace(/&ocirc;/g, "o").trim();
}
__name(cleanYouTubeTitle, "cleanYouTubeTitle");
function cleanVideoId(id) {
  if (!id) return id;
  return id.split("&")[0].trim();
}
__name(cleanVideoId, "cleanVideoId");
function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders2,
      // ← objeto, sem parênteses
      ...additionalHeaders
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}
__name(errorResponse, "errorResponse");

// src/core/dataManager.js
init_modules_watch_stub();

// src/middleware/auth.js
init_modules_watch_stub();

// src/security/hash.js
init_modules_watch_stub();
var encoder = new TextEncoder();
async function sha256(input) {
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");

// src/middleware/auth.js
async function getSession(request, env) {
  try {
    if (!request || !request.headers) return null;
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return null;
    const hash = await sha256(token);
    const session = await env.KV_SESSION.get(`sess:${hash}`, "json");
    if (!session) return null;
    if (Date.now() > session.expires) return null;
    return session;
  } catch (err) {
    console.error("Erro getSession:", err);
    return null;
  }
}
__name(getSession, "getSession");
async function requireAuth({ request, env }) {
  const session = await getSession(request, env);
  if (!session) {
    return {
      error: true,
      response: new Response("N\xE3o autorizado", { status: 401 })
    };
  }
  return {
    error: false,
    user: session.user,
    session
  };
}
__name(requireAuth, "requireAuth");
function requireRole(user, roles = []) {
  if (!user) return { allowed: false };
  if (!roles.includes(user.role)) {
    return { allowed: false };
  }
  return { allowed: true };
}
__name(requireRole, "requireRole");

// src/middleware/firewall.js
init_modules_watch_stub();
async function firewall(contextOrRequest) {
  try {
    const request = contextOrRequest?.request ?? contextOrRequest ?? null;
    if (!request || typeof request.headers?.get !== "function") {
      console.error("\u{1F525} Firewall: request inv\xE1lido");
      return null;
    }
    const ua = request.headers.get("User-Agent") || "";
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const uaLower = ua.toLowerCase();
    if (!ua || ua.length < 8) {
      return new Response(JSON.stringify({
        success: false,
        error: "User-Agent inv\xE1lido"
      }), { status: 403 });
    }
    const blockedAgents = [
      "curl",
      "wget",
      "python",
      "scrapy",
      "httpclient",
      "insomnia",
      "postman-runtime"
    ];
    if (blockedAgents.some((b) => uaLower.includes(b))) {
      return new Response(JSON.stringify({
        success: false,
        error: "Bot bloqueado"
      }), { status: 403 });
    }
    if (uaLower.includes("bot") && !uaLower.includes("google") && !uaLower.includes("bing")) {
      return new Response(JSON.stringify({
        success: false,
        error: "Bot suspeito"
      }), { status: 403 });
    }
    if (!ip || ip === "0.0.0.0") {
      return new Response(JSON.stringify({
        success: false,
        error: "IP inv\xE1lido"
      }), { status: 403 });
    }
    return null;
  } catch (err) {
    console.error("\u{1F525} firewall error:", err);
    return null;
  }
}
__name(firewall, "firewall");

// src/middleware/bot-detector.js
init_modules_watch_stub();
function detectBot(request) {
  try {
    if (!request || !request.headers) return false;
    const ua = request.headers.get("User-Agent") || "";
    if (!ua) return true;
    const patterns = [
      "bot",
      "crawler",
      "spider",
      "scraper"
    ];
    return patterns.some((p) => ua.toLowerCase().includes(p));
  } catch (err) {
    console.error("bot detector error:", err);
    return false;
  }
}
__name(detectBot, "detectBot");

// src/middleware/rate-limit.js
init_modules_watch_stub();
async function rateLimit(identifier, env, limit = 60, windowSeconds = 60) {
  if (!identifier) return { allowed: true };
  const now = Math.floor(Date.now() / 1e3);
  const windowKey = Math.floor(now / windowSeconds);
  const safeIdentifier = identifier || "unknown";
  const key = `rate:${safeIdentifier}:${windowKey}`;
  try {
    let count = 0;
    if (env.RATE_LIMIT_KV) {
      const current = await env.RATE_LIMIT_KV.get(key);
      count = current ? Number(current) : 0;
      if (isNaN(count)) count = 0;
      if (count >= limit) {
        const penalty = Math.min(windowSeconds * 5, count * 2);
        return {
          allowed: false,
          remaining: 0,
          reset: penalty
        };
      }
      await env.RATE_LIMIT_KV.put(key, String(count + 1), {
        expirationTtl: windowSeconds
      });
    } else {
      if (!global.rateLimitCache) {
        global.rateLimitCache = /* @__PURE__ */ new Map();
      }
      count = global.rateLimitCache.get(key) || 0;
      if (isNaN(count)) count = 0;
      if (count >= limit) {
        const penalty = Math.min(windowSeconds * 5, count * 2);
        return {
          allowed: false,
          remaining: 0,
          reset: penalty
        };
      }
      global.rateLimitCache.set(key, count + 1);
      setTimeout(() => {
        global.rateLimitCache.delete(key);
      }, windowSeconds * 1e3);
    }
    return {
      allowed: true,
      remaining: Math.max(0, limit - (count + 1)),
      reset: windowSeconds
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    return { allowed: true };
  }
}
__name(rateLimit, "rateLimit");
var RATE_LIMITS = {
  login: { limit: 5, window: 60 },
  verifyPin: { limit: 10, window: 120 },
  verify2fa: { limit: 5, window: 60 },
  forgotPassword: { limit: 3, window: 300 },
  resetPassword: { limit: 3, window: 300 },
  default: { limit: 100, window: 60 }
};
function getRateLimitConfig(pathname) {
  if (pathname.includes("/login")) return RATE_LIMITS.login;
  if (pathname.includes("/verify-pin")) return RATE_LIMITS.verifyPin;
  if (pathname.includes("/verify-2fa")) return RATE_LIMITS.verify2fa;
  if (pathname.includes("/esqueci-senha")) return RATE_LIMITS.forgotPassword;
  if (pathname.includes("/confirmar-reset-senha")) return RATE_LIMITS.resetPassword;
  return RATE_LIMITS.default;
}
__name(getRateLimitConfig, "getRateLimitConfig");
async function applyRateLimit(request, env, extraKey = "") {
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const url = new URL(request.url);
  const config = getRateLimitConfig(url.pathname);
  const safeExtraKey = extraKey || "";
  const identifier = `${ip}:${url.pathname}:${safeExtraKey}`;
  const result = await rateLimit(identifier, env, config.limit, config.window);
  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Muitas tentativas. Tente novamente em instantes."
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.reset)
        }
      }
    );
  }
  return null;
}
__name(applyRateLimit, "applyRateLimit");

// src/middleware/waf.js
init_modules_watch_stub();
async function waf(context) {
  const { request, pathname } = context;
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /document\.cookie/i,
    /localStorage\./i,
    /sessionStorage\./i,
    /\.\.\/\.\.\//,
    /\/etc\/passwd/,
    /\%00/,
    /\bUNION\b.*\bSELECT\b/i,
    /\bSELECT\b.*\bFROM\b/i,
    /\bINSERT\b.*\bINTO\b/i,
    /\bDELETE\b.*\bFROM\b/i,
    /\bDROP\b.*\bTABLE\b/i,
    /\bEXEC\b.*\bXP_/i
  ];
  for (const pattern of maliciousPatterns) {
    if (pattern.test(pathname)) {
      return new Response("Forbidden", { status: 403 });
    }
  }
  const userAgent = request.headers.get("User-Agent") || "";
  const suspiciousUA = /(sqlmap|nikto|nmap|masscan|zgrab|httpx)/i;
  if (suspiciousUA.test(userAgent)) {
    return new Response("Forbidden", { status: 403 });
  }
  const allowedMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
  if (!allowedMethods.includes(request.method)) {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = request.url;
  if (url.length > 2e3) {
    return new Response("URI Too Long", { status: 414 });
  }
  return null;
}
__name(waf, "waf");

// src/security/ip-reputation.js
init_modules_watch_stub();
var BLOCKED_IPS = /* @__PURE__ */ new Set([
  "127.0.0.2"
  // exemplo
]);
async function checkIPReputation(ip, env) {
  try {
    if (!ip || ip === "unknown") {
      return { blocked: false };
    }
    if (BLOCKED_IPS.has(ip)) {
      return { blocked: true, reason: "blacklist" };
    }
    if (env.SECURITY_KV) {
      const flagged = await env.SECURITY_KV.get(`blocked_ip:${ip}`);
      if (flagged) {
        return { blocked: true, reason: "kv_blacklist" };
      }
    }
    if (ip.startsWith("0.") || ip.startsWith("255.")) {
      return { blocked: true, reason: "invalid_range" };
    }
    return { blocked: false };
  } catch (error) {
    console.error("IP Reputation error:", error);
    return { blocked: false };
  }
}
__name(checkIPReputation, "checkIPReputation");

// src/middleware/attack-logger.js
init_modules_watch_stub();
async function logAttack(env, data) {
  try {
    const logEntry = {
      ...data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.warn("\u{1F6A8} ATTACK DETECTED:", JSON.stringify(logEntry));
    if (env.SECURITY_KV) {
      const key = `attack:${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await env.SECURITY_KV.put(key, JSON.stringify(logEntry), {
        expirationTtl: 60 * 60 * 24 * 7
        // 7 dias
      });
    }
  } catch (error) {
    console.error("Error logging attack:", error);
  }
}
__name(logAttack, "logAttack");

// src/middleware/fingerprint.js
init_modules_watch_stub();
async function fingerprint(context) {
  const { request, ip } = context;
  const userAgent = request.headers.get("User-Agent") || "";
  const acceptLanguage = request.headers.get("Accept-Language") || "";
  const acceptEncoding = request.headers.get("Accept-Encoding") || "";
  const fingerprintData = `${ip}|${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(fingerprintData);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const fingerprint2 = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
  return fingerprint2;
}
__name(fingerprint, "fingerprint");

// src/middleware/risk-engine.js
init_modules_watch_stub();
async function riskEngine(context) {
  const { request, env, ip, fingerprint: fingerprint2 } = context;
  let score = 0;
  const reasons = [];
  const isTor = await checkTorIP(ip, env);
  if (isTor) {
    score += 30;
    reasons.push("tor_ip");
  }
  if (fingerprint2) {
    const failCount = await getFailCountByFingerprint(fingerprint2, env);
    if (failCount > 5) {
      score += Math.min(failCount * 5, 40);
      reasons.push(`multiple_failures:${failCount}`);
    }
  }
  const requestRate = await getRequestRate(ip, env);
  if (requestRate > 20) {
    score += Math.min(requestRate, 50);
    reasons.push(`high_request_rate:${requestRate}`);
  }
  const userAgent = request.headers.get("User-Agent") || "";
  if (isSuspiciousUserAgent(userAgent)) {
    score += 20;
    reasons.push("suspicious_ua");
  }
  if (!request.headers.get("Accept-Language") || !request.headers.get("Accept")) {
    score += 15;
    reasons.push("missing_headers");
  }
  const requiresCaptcha = score > 50;
  return {
    score: Math.min(score, 100),
    reasons,
    requiresCaptcha,
    level: score > 70 ? "high" : score > 40 ? "medium" : "low"
  };
}
__name(riskEngine, "riskEngine");
async function checkTorIP(ip, env) {
  return false;
}
__name(checkTorIP, "checkTorIP");
async function getFailCountByFingerprint(fingerprint2, env) {
  if (!env.FAILURE_TRACKING) return 0;
  const key = `fail:${fingerprint2}`;
  const count = await env.FAILURE_TRACKING.get(key);
  return count ? parseInt(count) : 0;
}
__name(getFailCountByFingerprint, "getFailCountByFingerprint");
async function getRequestRate(ip, env) {
  return 0;
}
__name(getRequestRate, "getRequestRate");
function isSuspiciousUserAgent(ua) {
  const suspicious = [
    "curl",
    "wget",
    "python",
    "java",
    "go-http",
    "nikto",
    "sqlmap",
    "nmap",
    "masscan",
    "zgrab",
    "httpx",
    "hydra"
  ];
  const uaLower = ua.toLowerCase();
  return suspicious.some((s) => uaLower.includes(s));
}
__name(isSuspiciousUserAgent, "isSuspiciousUserAgent");

// src/middleware/captcha.js
init_modules_watch_stub();
async function verifyCaptcha(context) {
  const { request, env } = context;
  let token = null;
  try {
    const body = await request.clone().json().catch(() => ({}));
    token = body.captchaToken || body["g-recaptcha-response"] || null;
  } catch (e) {
  }
  if (!token) {
    if (env.ENVIRONMENT === "development") {
      return true;
    }
    return false;
  }
  const secretKey = env.RECAPTCHA_SECRET_KEY || env.HCAPTCHA_SECRET_KEY;
  const verifyUrl = env.RECAPTCHA_SECRET_KEY ? `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}` : `https://hcaptcha.com/siteverify?secret=${secretKey}&response=${token}`;
  try {
    const response = await fetch(verifyUrl, { method: "POST" });
    const data = await response.json();
    if (data.success && data.score >= 0.5) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Erro ao verificar CAPTCHA:", error);
    return env.ENVIRONMENT === "development";
  }
}
__name(verifyCaptcha, "verifyCaptcha");

// src/utils/sanitize.js
init_modules_watch_stub();
function isSafeUrl(value) {
  if (typeof value !== "string") return false;
  const safePatterns = [
    /^https?:\/\//,
    // URLs HTTP/HTTPS
    /^\/r2\//,
    // R2 paths
    /^\/images\//,
    // Imagens locais
    /^\/docs\//,
    // Documentos locais
    /^\/assets\//,
    // Assets locais
    /^data:image\/[a-z]+;base64,/,
    // Base64 images
    /^https:\/\/pub-[a-f0-9]+\.r2\.dev\//,
    // R2 Cloudflare
    /^https:\/\/santuariodefatima\.oibreccio\.workers\.dev\//,
    // Worker
    /^https:\/\/img\.youtube\.com\//
    // YouTube thumbnails
  ];
  return safePatterns.some((pattern) => pattern.test(value));
}
__name(isSafeUrl, "isSafeUrl");
function decodeHtmlEntities(str) {
  if (typeof str !== "string") return str;
  let result = str;
  let previous = "";
  let maxLoops = 10;
  while (result !== previous && maxLoops-- > 0) {
    previous = result;
    result = result.replace(/&amp;#x2F;/gi, "/").replace(/&#x2F;/gi, "/").replace(/&amp;#x2f;/gi, "/").replace(/&#x2f;/gi, "/").replace(/&amp;#47;/gi, "/").replace(/&#47;/gi, "/").replace(/&amp;#58;/gi, ":").replace(/&#58;/gi, ":").replace(/&amp;#x3A;/gi, ":").replace(/&#x3A;/gi, ":").replace(/&amp;#x2F;/gi, "/").replace(/&amp;quot;/gi, '"').replace(/&quot;/gi, '"').replace(/&amp;amp;/gi, "&").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
  }
  return result;
}
__name(decodeHtmlEntities, "decodeHtmlEntities");
function sanitizeInput(input, depth = 0) {
  if (depth > 10) return input;
  if (input === null || input === void 0) {
    return null;
  }
  if (typeof input === "string") {
    let decoded = decodeHtmlEntities(input);
    if (isSafeUrl(decoded)) {
      if (/[<>]/g.test(decoded)) {
        return decoded.replace(/[<>]/g, "");
      }
      return decoded;
    }
    let cleaned = decoded.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "").replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "").replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "").replace(/javascript:/gi, "").replace(/onload=/gi, "").replace(/onerror=/gi, "").replace(/onclick=/gi, "");
    cleaned = cleaned.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
    return cleaned.slice(0, 5e3);
  }
  if (typeof input === "object" && !Array.isArray(input)) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      const safeKey = typeof key === "string" ? key.slice(0, 100) : String(key);
      const isUrlField = /^(imagem|url|imagens|avatar|thumbnail|googleDriveLink|youtubeLink|link|photo|image|src|href|poster|cover)$/i.test(safeKey);
      const isArrayOfUrls = isUrlField && Array.isArray(value);
      if (isUrlField) {
        if (Array.isArray(value)) {
          sanitized[safeKey] = value.map((v) => {
            if (typeof v === "string") {
              let decoded = decodeHtmlEntities(v);
              return isSafeUrl(decoded) ? decoded : sanitizeInput(decoded, depth + 1);
            }
            return v;
          });
        } else if (typeof value === "string") {
          let decoded = decodeHtmlEntities(value);
          sanitized[safeKey] = isSafeUrl(decoded) ? decoded : sanitizeInput(decoded, depth + 1);
        } else {
          sanitized[safeKey] = sanitizeInput(value, depth + 1);
        }
      } else {
        sanitized[safeKey] = sanitizeInput(value, depth + 1);
      }
    }
    return sanitized;
  }
  if (Array.isArray(input)) {
    return input.slice(0, 100).map((item) => sanitizeInput(item, depth + 1));
  }
  if (typeof input === "number") {
    return Math.min(Math.max(input, -999999999), 999999999);
  }
  if (typeof input === "boolean") {
    return input;
  }
  return sanitizeInput(String(input), depth + 1);
}
__name(sanitizeInput, "sanitizeInput");
async function hashToken(token) {
  if (!token || typeof token !== "string") return "";
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashToken, "hashToken");
function validatePayloadSize(request, maxSize = 10485760) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > maxSize) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Payload muito grande. M\xE1ximo: ${Math.round(maxSize / 1024 / 1024)}MB`
      }),
      { status: 413, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}
__name(validatePayloadSize, "validatePayloadSize");
async function fetchWithTimeout(url, options = {}, timeout = 15e3) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}
__name(fetchWithTimeout, "fetchWithTimeout");
function createRequestId() {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
__name(createRequestId, "createRequestId");

// src/utils/headers.js
init_modules_watch_stub();
function addSecurityHeaders(response) {
  if (!response) {
    return new Response("Erro interno", { status: 500 });
  }
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https:; media-src 'self' https:; style-src 'self' 'unsafe-inline'; script-src 'self'"
  );
  return new Response(response.body, {
    status: response.status,
    headers
  });
}
__name(addSecurityHeaders, "addSecurityHeaders");

// src/utils/emails.js
init_modules_watch_stub();
var CONFIG = {
  // 📧 SECRETARIA (2 emails)
  SECRETARIAT_EMAILS: [
    "pascom.santuario@outlook.com.br",
    "santuarionsradefatima@santoamaro.org.br"
  ],
  // 📧 CONTATO GERAL (2 emails)
  CONTACT_EMAILS: [
    "pascom.santuario@outlook.com.br",
    "santuarionsradefatima@santoamaro.org.br"
  ],
  // 📧 PEDIDOS DE ORAÇÃO (apenas 1 email)
  PRAYER_EMAILS: [
    "pascom.santuario@outlook.com.br"
  ]
};
var IMAGEM_NOSSA_SENHORA = "https://santuariodefatima.com.br/images/nossa-senhora-fatima.jpg";
function getHorarioSecretariaAviso() {
  const now = /* @__PURE__ */ new Date();
  const hora = now.getHours();
  const diaSemana = now.getDay();
  const isDiaUtil = diaSemana >= 2 && diaSemana <= 6;
  const isHorarioComercial = hora >= 9 && hora < 17;
  if (!isDiaUtil || !isHorarioComercial) {
    return {
      ativo: true,
      mensagem: "\u26A0\uFE0F Nossa secretaria funciona de ter\xE7a a s\xE1bado, das 9h \xE0s 17h. Responderemos em breve."
    };
  }
  return { ativo: false, mensagem: "" };
}
__name(getHorarioSecretariaAviso, "getHorarioSecretariaAviso");
function getEmailHeader(titulo) {
  return `
<div class="header">
  <img src="${IMAGEM_NOSSA_SENHORA}" alt="Nossa Senhora de Fatima" class="header-image">
  <div class="header-title">
    <h1>${titulo}</h1>
    <p>Santuario Nossa Senhora de Fatima - Santo Amaro</p>
  </div>
</div>`;
}
__name(getEmailHeader, "getEmailHeader");
function getEmailFooter() {
  return `
<div class="footer">
  <p><strong>Santuario Nossa Senhora de Fatima</strong></p>
  <p>Rua Darwin, 651 - Santo Amaro, Sao Paulo - SP</p>
  <p>santuariodefatima.com.br | (11) 5521-0312</p>
  <p style="margin-top: 10px;">\u{1F64F} Nossa Senhora de Fatima, rogai por n\xF3s!</p>
</div>`;
}
__name(getEmailFooter, "getEmailFooter");
async function sendPrayerConfirmationEmail(env, data) {
  try {
    if (!env.RESEND_API_KEY) {
      return;
    }
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const aviso = getHorarioSecretariaAviso();
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>\u{1F64F} Pedido de Oracao - Santuario de Fatima</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:28px;margin:0;font-weight:400;}
.header-title p{font-size:16px;margin:10px 0 0;opacity:0.9;font-style:italic;}
.content{padding:40px 35px;color:#2c3e50;}
.greeting{font-size:22px;color:#0b3b5c;margin-bottom:25px;font-weight:500;border-left:4px solid #b8860b;padding-left:20px;}
.message{font-size:16px;line-height:1.8;margin-bottom:25px;color:#34495e;}
.prayer-box{background:#f9f9f9;border:1px solid #e0e0e0;border-radius:12px;padding:25px;margin:30px 0;}
.prayer-box h3{color:#0b3b5c;font-size:18px;margin:0 0 15px;font-weight:500;border-bottom:2px solid #b8860b;padding-bottom:10px;}
.prayer-text{font-size:18px;font-style:italic;color:#2c3e50;line-height:1.8;margin:0;}
.aviso-discreto{background:#fff5f5;border-left:4px solid #c53030;padding:15px;margin:25px 0;font-size:14px;color:#742a2a;border-radius:4px;}
.fatima-quote{background:#f0f7ff;padding:25px;border-radius:12px;margin:30px 0;text-align:center;font-style:italic;color:#0b3b5c;border:1px solid #b8860b;}
.signature{margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;text-align:center;font-size:16px;color:#0b3b5c;font-style:italic;}
.footer{background:#f8f9fa;padding:25px;text-align:center;color:#7f8c8d;font-size:13px;border-top:1px solid #e0e0e0;}
.footer p{margin:4px 0;}
.footer strong{color:#0b3b5c;}
.date-info{text-align:center;color:#95a5a6;font-size:13px;margin-top:20px;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader("\u{1F64F} Pedido de Oracao")}
  <div class="content">
    <div class="greeting">Paz e Bem, <strong>${data.name}</strong>!</div>
    <p class="message">Recebemos com carinho o seu pedido de oracao e agradecemos a confianca em partilhar conosco essa intencao.</p>
    <p class="message">Saiba que sua suplica sera apresentada a Deus em nossas oracoes, confiando tudo a Sua infinita misericordia, em Cristo e sob a intercessao de Nossa Senhora de Fatima.</p>
    ${aviso.ativo ? `<div class="aviso-discreto">${aviso.mensagem}</div>` : ""}
    <div class="prayer-box">
      <h3>Sua intencao</h3>
      <p class="prayer-text">"${data.prayerRequest}"</p>
      ${data.cidade ? `<div style="margin-top:10px;font-size:14px;"><strong>Local:</strong> ${data.cidade}</div>` : ""}
    </div>
    <div class="fatima-quote">"Rezai o terco todos os dias para alcancar a paz para o mundo e o fim da guerra"<div style="margin-top:10px;font-size:14px;">- Nossa Senhora de Fatima</div></div>
    <div class="signature">Em Cristo e Nossa Senhora de Fatima,<br><strong>Santuario Nossa Senhora de Fatima - Santo Amaro</strong></div>
    <div class="date-info">${currentDate}</div>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [data.email], subject: "\u{1F64F} Pedido de Oracao Recebido - Santuario de Fatima", html })
    });
  } catch (error) {
    console.error("Erro ao enviar email de oracao:", error);
  }
}
__name(sendPrayerConfirmationEmail, "sendPrayerConfirmationEmail");
async function sendPrayerNotificationToSecretariat(env, data) {
  try {
    if (!env.RESEND_API_KEY) {
      return;
    }
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
    const currentTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR");
    const aviso = getHorarioSecretariaAviso();
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Novo Pedido de Oracao</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:24px;margin:0;font-weight:400;}
.header-title p{font-size:15px;margin:8px 0 0;opacity:0.9;font-style:italic;}
.content{padding:30px 25px;}
.prayer-box{background:#f9f9f9;border-left:4px solid #0b3b5c;padding:20px;margin:20px 0;border-radius:4px;}
.info-table{width:100%;border-collapse:collapse;margin:15px 0;}
.info-table td{padding:10px;border-bottom:1px solid #e0e0e0;font-size:15px;}
.info-table td:first-child{font-weight:bold;width:30%;color:#0b3b5c;}
.aviso{background:#fff5f5;border-left:4px solid #c53030;padding:15px;margin:20px 0;font-size:14px;color:#742a2a;border-radius:4px;}
.footer{background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#7f8c8d;border-top:1px solid #e0e0e0;}
.footer strong{color:#0b3b5c;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader("\u{1F64F} Novo Pedido de Oracao")}
  <div class="content">
    <table class="info-table">
      <tr><td>Nome:</td><td><strong>${data.name}</strong></td></tr>
      <tr><td>Email:</td><td>${data.email}</td></tr>
      ${data.cidade ? `<tr><td>Cidade:</td><td>${data.cidade}${data.cidade}</span></td></td>` : ""}
      <tr><td>Data/Hora:</td><td>${currentDate} \xE0s ${currentTime}NonNullable</td>
    </table>
    <div class="prayer-box"><h3>\u271D\uFE0F Intencao:</h3><p style="margin:0;font-style:italic;color:#2c3e50;">"${data.prayerRequest}"</p></div>
    ${aviso.ativo ? `<div class="aviso">\u26A0\uFE0F ${aviso.mensagem}</div>` : ""}
    <p style="color:#c53030;font-weight:500;text-align:center;font-size:15px;">Favor incluir nas intencoes das proximas missas.</p>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    for (const adminEmail of CONFIG.PRAYER_EMAILS) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [adminEmail], subject: `\u{1F64F} Novo Pedido de Oracao - ${data.name}`, html, reply_to: data.email })
      });
      console.log(`\u{1F4E7} Notifica\xE7\xE3o de ora\xE7\xE3o enviada para: ${adminEmail}`);
    }
  } catch (error) {
    console.error("Erro ao enviar notificacao:", error);
  }
}
__name(sendPrayerNotificationToSecretariat, "sendPrayerNotificationToSecretariat");
async function sendCandleEmail(env, data) {
  try {
    if (!env.RESEND_API_KEY) return;
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Vela Acesa - Santuario de Fatima</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#ff8a5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#ff8a5c;}
.header-title h1{font-size:28px;margin:0;font-weight:400;}
.header-title p{font-size:16px;margin:10px 0 0;opacity:0.9;font-style:italic;}
.content{padding:40px 35px;color:#2c3e50;}
.greeting{font-size:22px;color:#ff8a5c;margin-bottom:25px;font-weight:500;border-left:4px solid #b8860b;padding-left:20px;}
.message{font-size:16px;line-height:1.8;margin-bottom:25px;color:#34495e;}
.candle-box{background:#f9f9f9;border:1px solid #e0e0e0;border-radius:12px;padding:25px;margin:30px 0;text-align:center;}
.candle-box h3{color:#ff8a5c;font-size:18px;margin:0 0 15px;font-weight:500;border-bottom:2px solid #b8860b;padding-bottom:10px;}
.fatima-quote{background:#f0f7ff;padding:25px;border-radius:12px;margin:30px 0;text-align:center;font-style:italic;color:#0b3b5c;border:1px solid #b8860b;}
.signature{margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;text-align:center;font-size:16px;color:#ff8a5c;font-style:italic;}
.footer{background:#f8f9fa;padding:25px;text-align:center;color:#7f8c8d;font-size:13px;border-top:1px solid #e0e0e0;}
.footer p{margin:4px 0;}
.footer strong{color:#ff8a5c;}
.date-info{text-align:center;color:#95a5a6;font-size:13px;margin-top:20px;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader("Vela Acesa")}
  <div class="content">
    <div class="greeting">\u{1F56F}\uFE0F <strong>Paz e Bem, ${data.name}!</strong></div>
    <p class="message">Sua vela foi acesa no Santuario de Fatima e permanecera por 7 dias.</p>
    <div class="candle-box">
      <h3>\u{1F56F}\uFE0F SUA INTENCAO</h3>
      <p class="message" style="font-style:italic;margin:10px 0;">"${data.intention}"</p>
      ${data.cidade ? `<p style="color:#666;margin-top:10px;"><strong>Local:</strong> ${data.cidade}</p>` : ""}
    </div>
    <div class="fatima-quote">"Rezai o terco todos os dias para alcancar a paz para o mundo e o fim da guerra"<div style="margin-top:10px;font-size:14px;">\u2014 Nossa Senhora de Fatima</div></div>
    <div class="signature">Que sua intencao seja atendida,<br><strong>Santuario Nossa Senhora de Fatima - Santo Amaro</strong></div>
    <div class="date-info">\u{1F4C5} ${currentDate}</div>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [data.email], subject: "\u{1F56F}\uFE0F Sua Vela foi Acesa - Santuario de Fatima", html })
    });
    console.log(`\u2705 Email de vela enviado para ${data.email}`);
  } catch (error) {
    console.error("Erro ao enviar email de vela:", error);
  }
}
__name(sendCandleEmail, "sendCandleEmail");
async function sendContactConfirmationEmail(env, data) {
  try {
    if (!env.RESEND_API_KEY) return;
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const assuntoMap = { informacoes: "Informacoes Gerais", sacramentos: "Sacramentos", pastorais: "Pastorais", eventos: "Eventos", doacoes: "Doacoes", certidoes: "Certidoes", outro: "Outro" };
    const assuntoLabel = assuntoMap[data.assunto] || data.assunto || "Nao informado";
    const aviso = getHorarioSecretariaAviso();
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mensagem Recebida - Santuario de Fatima</title>
  <style>
    body { font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { background: #0b3b5c; color: white; padding: 0; text-align: center; }
    .header-image { width: 100%; height: auto; max-height: 260px; object-fit: cover; display: block; border-bottom: 3px solid #b8860b; }
    .header-title { padding: 20px; background: #0b3b5c; }
    .header-title h1 { font-size: 26px; margin: 0; font-weight: 400; }
    .header-title p { font-size: 15px; margin: 8px 0 0; opacity: 0.9; font-style: italic; }
    .content { padding: 40px 35px; color: #2c3e50; }
    .greeting { font-size: 21px; color: #0b3b5c; margin-bottom: 22px; font-weight: 500; border-left: 4px solid #b8860b; padding-left: 20px; }
    .message { font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #34495e; }
    .info-box { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 12px; padding: 22px; margin: 28px 0; }
    .info-box h3 { color: #0b3b5c; font-size: 17px; margin: 0 0 14px; font-weight: 500; border-bottom: 2px solid #b8860b; padding-bottom: 8px; }
    .info-row { margin-bottom: 10px; font-size: 15px; color: #2c3e50; }
    .info-row strong { color: #0b3b5c; }
    .mensagem-box { background: #f0f7ff; border-left: 4px solid #0b3b5c; padding: 16px 20px; border-radius: 6px; margin-top: 14px; font-size: 15px; color: #2c3e50; font-style: italic; line-height: 1.7; }
    .aviso-discreto { background: #fff5f5; border-left: 4px solid #c53030; padding: 14px; margin: 22px 0; font-size: 13px; color: #742a2a; border-radius: 4px; }
    .fatima-quote { background: #f0f7ff; padding: 22px; border-radius: 12px; margin: 28px 0; text-align: center; font-style: italic; color: #0b3b5c; border: 1px solid #b8860b; font-size: 16px; line-height: 1.7; }
    .signature { margin-top: 28px; padding-top: 18px; border-top: 2px solid #e0e0e0; text-align: center; font-size: 15px; color: #0b3b5c; font-style: italic; }
    .footer { background: #f8f9fa; padding: 22px; text-align: center; color: #7f8c8d; font-size: 13px; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 4px 0; }
    .footer strong { color: #0b3b5c; }
    .date-info { text-align: center; color: #95a5a6; font-size: 13px; margin-top: 18px; }
  </style>
</head>
<body>
  <div class="container">
    ${getEmailHeader("Mensagem Recebida")}
    <div class="content">
      <div class="greeting">Paz e Bem, <strong>${data.nome}</strong>!</div>
      <p class="message">Recebemos sua mensagem com carinho e agradecemos por entrar em contato conosco. Em breve um de nossos agentes pastorais retornara o contato.</p>
      <div class="info-box">
        <h3>\u{1F4E8} Sua Mensagem</h3>
        <div class="info-row"><strong>Assunto:</strong> ${assuntoLabel}</div>
        ${data.telefone ? `<div class="info-row"><strong>Telefone:</strong> ${data.telefone}</div>` : ""}
        <div class="mensagem-box">"${data.mensagem}"</div>
      </div>
      ${aviso.ativo ? `<div class="aviso-discreto">\u26A0\uFE0F ${aviso.mensagem}</div>` : ""}
      <div class="fatima-quote">"Rezai o terco todos os dias para alcancar a paz para o mundo e o fim da guerra"<div style="margin-top: 10px; font-size: 13px; color: #5a7fa0;">\u2014 Nossa Senhora de Fatima</div></div>
      <div class="signature">Em Cristo e Nossa Senhora de Fatima,<br><strong>Secretaria Pastoral \u2013 Santuario Nossa Senhora de Fatima</strong></div>
      <div class="date-info">\u{1F4C5} ${currentDate}</div>
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [data.email], subject: "\u2709\uFE0F Mensagem Recebida \u2013 Santuario de Fatima", html })
    });
    console.log(`\u2705 Email de confirma\xE7\xE3o de contato enviado para ${data.email}`);
  } catch (error) {
    console.error("Erro ao enviar email de contato:", error);
  }
}
__name(sendContactConfirmationEmail, "sendContactConfirmationEmail");
async function sendContactNotificationToSecretariat(env, data) {
  try {
    if (!env.RESEND_API_KEY) {
      return;
    }
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
    const currentTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR");
    const aviso = getHorarioSecretariaAviso();
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Novo Contato - Secretaria</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:24px;margin:0;font-weight:400;}
.header-title p{font-size:15px;margin:8px 0 0;opacity:0.9;font-style:italic;}
.content{padding:30px 25px;}
.message-box{background:#f9f9f9;border-left:4px solid #0b3b5c;padding:20px;margin:20px 0;border-radius:4px;}
.aviso{background:#fff5f5;border-left:4px solid #c53030;padding:15px;margin:20px 0;font-size:14px;color:#742a2a;border-radius:4px;}
.footer{background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#7f8c8d;border-top:1px solid #e0e0e0;}
.footer strong{color:#0b3b5c;}
p{font-size:15px;margin:8px 0;color:#2c3e50;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader("\u2709\uFE0F Novo Contato")}
  <div class="content">
    <p><strong>Nome:</strong> ${data.nome}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Telefone:</strong> ${data.telefone || "Nao informado"}</p>
    <p><strong>Assunto:</strong> ${data.assunto}</p>
    <p><strong>Data/Hora:</strong> ${currentDate} as ${currentTime}</p>
    <div class="message-box"><h3 style="margin:0 0 10px;color:#0b3b5c;">Mensagem:</h3><p style="margin:0;white-space:pre-wrap;font-style:italic;">${data.mensagem}</p></div>
    ${aviso.ativo ? `<div class="aviso">\u26A0\uFE0F ${aviso.mensagem}</div>` : ""}
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    for (const adminEmail of CONFIG.CONTACT_EMAILS) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [adminEmail], subject: `\u{1F4EC} Novo Contato: ${data.assunto} - ${data.nome}`, html, reply_to: data.email })
      });
      console.log(`\u{1F4E7} Notifica\xE7\xE3o de contato enviada para: ${adminEmail}`);
    }
  } catch (error) {
    console.error("Erro ao enviar notificacao de contato:", error);
  }
}
__name(sendContactNotificationToSecretariat, "sendContactNotificationToSecretariat");

// src/routes/public/liturgia.js
init_modules_watch_stub();
var _cache = /* @__PURE__ */ new Map();
var CACHE_DURATION = 60 * 60 * 1e3;
function getCache(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_DURATION) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}
__name(getCache, "getCache");
function setCache(key, data) {
  _cache.set(key, { data, time: Date.now() });
}
__name(setCache, "setCache");
function normalizarData(dataParam) {
  if (!dataParam) return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataParam)) return dataParam;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataParam)) {
    const [d, m, y] = dataParam.split("/");
    return `${y}-${m}-${d}`;
  }
  return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
}
__name(normalizarData, "normalizarData");
function formatarParaRailway(dataISO) {
  const [y, m, d] = dataISO.split("-");
  return `${d}/${m}/${y}`;
}
__name(formatarParaRailway, "formatarParaRailway");
function stripHtml(s = "") {
  return s.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#8220;|&#8221;/g, '"').replace(/&#8216;|&#8217;/g, "'").replace(/&#8211;/g, "\u2013").replace(/&#8212;/g, "\u2014").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
__name(stripHtml, "stripHtml");
function extrairCorDoTexto(texto = "") {
  if (!texto) return null;
  const t = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t.includes("branco") || t.includes("dourado") || t.includes("bco")) return "Branco";
  if (t.includes("roxo") || t.includes("violeta") || t.includes("lilas")) return "Roxo";
  if (t.includes("vermelho") || t.includes("rubro")) return "Vermelho";
  if (t.includes("rosa")) return "Rosa";
  if (t.includes("verde")) return "Verde";
  return null;
}
__name(extrairCorDoTexto, "extrairCorDoTexto");
function inferirCorPorPeriodo(texto = "") {
  const t = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/pasc|oitava|natal|epifania|ressurreic|corpus|ascensao|batismo|transfig|todos os santos/.test(t)) return "Branco";
  if (/quaresma|advento/.test(t)) return "Roxo";
  if (/pentecostes|martir|apostol|sao pedro|sao paulo|sao joao/.test(t)) return "Vermelho";
  if (/rosa/.test(t)) return "Rosa";
  return null;
}
__name(inferirCorPorPeriodo, "inferirCorPorPeriodo");
function normalizarCampoLeitura(campo) {
  if (!campo) return "";
  if (typeof campo === "string") {
    if (campo === "N\xE3o h\xE1 segunda leitura hoje!" || campo === "null") return "";
    return campo.trim();
  }
  if (typeof campo === "object") {
    const partes = [];
    if (campo.referencia) partes.push(campo.referencia.trim());
    if (campo.titulo) partes.push(campo.titulo.trim());
    if (campo.texto) partes.push(campo.texto.trim());
    return partes.join("\n\n");
  }
  return "";
}
__name(normalizarCampoLeitura, "normalizarCampoLeitura");
function normalizarSalmo(campo) {
  if (!campo) return "";
  if (typeof campo === "string") return campo.trim();
  if (typeof campo === "object") {
    const partes = [];
    if (campo.referencia) partes.push(campo.referencia.trim());
    if (campo.refrao) partes.push(campo.refrao.trim());
    if (campo.texto) partes.push(campo.texto.trim());
    return partes.join("\n\n");
  }
  return "";
}
__name(normalizarSalmo, "normalizarSalmo");
function parsearHtmlPaulus(html) {
  const blocoMatch = html.match(/(<strong>.*?OITAVA|<strong>[A-ZÁÉÍÓÚ\s]+<\/strong>[\s\S]*?)(?:Liturgia Diária\s*<\/h|<div[^>]+class="[^"]*sidebar)/i);
  const bloco = blocoMatch ? blocoMatch[0] : html;
  const tituloMatch = bloco.match(/<strong>([A-ZÁÉÍÓÚÀÃÕÂÊÎÔÛÇ\s\d°ºª–\-]+)<\/strong>/i);
  const tituloLiturgico = tituloMatch ? stripHtml(tituloMatch[1]).trim() : "";
  const corMatch = html.match(/\((branco|roxo|vermelho|rosa|verde|dourado|violeta|lilas)/i);
  let cor = corMatch ? extrairCorDoTexto(corMatch[1]) : null;
  if (!cor) cor = inferirCorPorPeriodo(tituloLiturgico + " " + html.substring(0, 2e3));
  cor = cor || "Verde";
  const notaMatch = html.match(/\(([^)]{10,200})\)/);
  const nota = notaMatch ? notaMatch[1].trim() : "";
  let antifona = "";
  const antifonaMatch = html.match(/\([^)]+\)\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
  if (antifonaMatch) antifona = stripHtml(antifonaMatch[1]).trim();
  let introducao = "";
  const introMatch = html.match(/<(?:em|i)[^>]*>([\s\S]{20,600}?)<\/(?:em|i)>/i);
  if (introMatch) introducao = stripHtml(introMatch[1]).trim();
  const primeiraRef = extrairRef(html, "Primeira Leitura");
  const primeiraTexto = extrairBlocoLeitura(html, "Primeira Leitura", ["Salmo Responsorial", "Segunda Leitura", "Evangelho"]);
  const segundaRef = extrairRef(html, "Segunda Leitura");
  const segundaTexto = extrairBlocoLeitura(html, "Segunda Leitura", ["Salmo Responsorial", "Evangelho"]);
  const salmoRef = extrairRef(html, "Salmo Responsorial");
  const salmoTexto = extrairBlocoLeitura(html, "Salmo Responsorial", ["Segunda Leitura", "Evangelho"]);
  const evangelhoRef = extrairRef(html, "Evangelho");
  const evangelhoTexto = extrairBlocoLeitura(html, "Evangelho", ["Reflex\xE3o", "Reflexao"]);
  const reflexaoTexto = extrairBlocoLeitura(html, "Reflex", ["Dia a dia", "navigation", "post-navigation", "[9 \u2013", "[10 \u2013", "[11 \u2013"]);
  return {
    cor,
    tituloLiturgico,
    nota,
    antifona,
    introducao,
    primeiraLeitura: montarLeitura(primeiraRef, primeiraTexto),
    segundaLeitura: montarLeitura(segundaRef, segundaTexto),
    salmo: montarLeitura(salmoRef, salmoTexto),
    evangelho: montarLeitura(evangelhoRef, evangelhoTexto),
    reflexao: reflexaoTexto
  };
}
__name(parsearHtmlPaulus, "parsearHtmlPaulus");
function extrairRef(html, secao) {
  const re = new RegExp(secao + "[:\\s]*<strong>([^<]+)<\\/strong>", "i");
  const m = html.match(re);
  return m ? stripHtml(m[1]).trim() : "";
}
__name(extrairRef, "extrairRef");
function extrairBlocoLeitura(html, inicio, fins) {
  const reInicio = new RegExp(inicio + "[^<]*(?:<[^>]+>)*[^<]*<\\/(?:strong|p|h[1-6])>", "i");
  const mInicio = html.match(reInicio);
  if (!mInicio || mInicio.index === void 0) return "";
  let sub = html.substring(mInicio.index + mInicio[0].length);
  let fimIdx = sub.length;
  for (const fim of fins) {
    const reFim = new RegExp(fim, "i");
    const mFim = sub.match(reFim);
    if (mFim && mFim.index !== void 0 && mFim.index < fimIdx) {
      fimIdx = mFim.index;
    }
  }
  const bloco = sub.substring(0, fimIdx);
  return stripHtml(bloco).replace(/^\s*\n/, "").trim();
}
__name(extrairBlocoLeitura, "extrairBlocoLeitura");
function montarLeitura(ref, texto) {
  if (!texto && !ref) return "";
  if (!texto) return ref;
  if (ref && !texto.includes(ref)) return `${ref}

${texto}`;
  return texto;
}
__name(montarLeitura, "montarLeitura");
async function buscarNaPaulus(dataISO) {
  try {
    console.log("\u{1F33F} Buscando na Paulus para data:", dataISO);
    const paulusUrl = "https://www.paulus.com.br/portal/liturgia-diaria/";
    const res = await fetch(paulusUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9"
      },
      signal: AbortSignal.timeout(8e3)
    });
    if (!res.ok) {
      console.warn("\u{1F33F} Paulus retornou status:", res.status);
      return null;
    }
    const html = await res.text();
    console.log("\u{1F33F} HTML da Paulus recebido, tamanho:", html.length);
    const dados = parsearHtmlPaulus(html);
    console.log("\u{1F33F} Dados extra\xEDdos da Paulus:", {
      cor: dados.cor,
      tituloLiturgico: dados.tituloLiturgico,
      temPrimeira: !!dados.primeiraLeitura,
      temSalmo: !!dados.salmo,
      temEvangelho: !!dados.evangelho
    });
    return dados;
  } catch (err) {
    console.error("\u{1F33F} Erro ao buscar na Paulus:", err.message);
    return null;
  }
}
__name(buscarNaPaulus, "buscarNaPaulus");
async function buscarNoRailway(dataISO) {
  try {
    const dataRailway = formatarParaRailway(dataISO);
    const url = `https://liturgia.up.railway.app/?data=${dataRailway}`;
    console.log("\u{1F682} Buscando no Railway:", url);
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
      signal: AbortSignal.timeout(8e3)
    });
    if (!response.ok) {
      console.warn("\u{1F682} Railway status:", response.status);
      return null;
    }
    const json = await response.json();
    console.log("\u{1F682} Railway respondeu:", JSON.stringify(json).substring(0, 300));
    return json;
  } catch (err) {
    console.error("\u{1F682} Erro Railway:", err.message);
    return null;
  }
}
__name(buscarNoRailway, "buscarNoRailway");
function montarResultadoRailway(dataISO, json) {
  let cor = json.cor && typeof json.cor === "string" && json.cor.trim() || extrairCorDoTexto(json.liturgia) || inferirCorPorPeriodo([json.liturgia, json.semana, json.dia].filter(Boolean).join(" ")) || "Verde";
  const antifona = json.antifonas?.entrada || json.antifona || "";
  const segundaLeituraRaw = normalizarCampoLeitura(json.segundaLeitura);
  const temSegunda = segundaLeituraRaw.length > 10;
  return {
    success: true,
    data: dataISO,
    liturgia: {
      titulo: json.liturgia || `Liturgia do Dia - ${dataISO}`,
      cor,
      semana: json.semana || json.liturgia || "",
      tituloLiturgico: json.liturgia || "",
      antifona,
      introducao: json.introducao || "",
      primeiraLeitura: normalizarCampoLeitura(json.primeiraLeitura),
      segundaLeitura: temSegunda ? segundaLeituraRaw : "",
      salmo: normalizarSalmo(json.salmo),
      evangelho: normalizarCampoLeitura(json.evangelho),
      reflexao: json.reflexao || json.meditacao || ""
    },
    fonte: "railway"
  };
}
__name(montarResultadoRailway, "montarResultadoRailway");
function montarResultadoPaulus(dataISO, dados) {
  return {
    success: true,
    data: dataISO,
    liturgia: {
      titulo: dados.tituloLiturgico || `Liturgia do Dia - ${dataISO}`,
      cor: dados.cor,
      semana: dados.tituloLiturgico || "",
      tituloLiturgico: dados.tituloLiturgico || "",
      antifona: dados.antifona || "",
      introducao: dados.introducao || "",
      primeiraLeitura: dados.primeiraLeitura || "",
      segundaLeitura: dados.segundaLeitura || "",
      salmo: dados.salmo || "",
      evangelho: dados.evangelho || "",
      reflexao: dados.reflexao || ""
    },
    fonte: "paulus"
  };
}
__name(montarResultadoPaulus, "montarResultadoPaulus");
async function buscarLiturgia(dataParam = null) {
  const dataISO = normalizarData(dataParam);
  console.log("\u{1F4C5} buscarLiturgia:", dataISO);
  const cached = getCache(dataISO);
  if (cached) {
    console.log("\u2705 Cache hit:", dataISO);
    return cached;
  }
  let result = null;
  console.log("\u{1F682} Tentando Railway primeiro...");
  const jsonRailway = await buscarNoRailway(dataISO);
  if (jsonRailway && (jsonRailway.evangelho || jsonRailway.primeiraLeitura)) {
    result = montarResultadoRailway(dataISO, jsonRailway);
    console.log("\u2705 Resultado montado do Railway, cor:", result.liturgia.cor);
    if (result.liturgia.cor === "Verde") {
      console.log("\u{1F3A8} Cor incerta \u2014 tentando complementar com Paulus...");
      const dadosPaulus = await buscarNaPaulus(dataISO);
      if (dadosPaulus?.cor && dadosPaulus.cor !== "Verde") {
        result.liturgia.cor = dadosPaulus.cor;
        console.log("\u{1F3A8} Cor complementada pela Paulus:", dadosPaulus.cor);
      }
    }
  }
  if (!result) {
    console.log("\u{1F33F} Railway falhou \u2014 tentando Paulus como fallback...");
    const dadosPaulus = await buscarNaPaulus(dataISO);
    if (dadosPaulus?.evangelho) {
      result = montarResultadoPaulus(dataISO, dadosPaulus);
      console.log("\u2705 Resultado montado da Paulus");
    }
  }
  if (!result) {
    console.warn("\u26A0\uFE0F Todas as fontes falharam \u2014 usando mock");
    result = getMockLiturgia(dataISO);
  }
  setCache(dataISO, result);
  return result;
}
__name(buscarLiturgia, "buscarLiturgia");
function getMockLiturgia(dataISO) {
  const hoje = /* @__PURE__ */ new Date(dataISO + "T12:00:00");
  const diaSemana = hoje.toLocaleDateString("pt-BR", { weekday: "long" });
  const dataFormatada = hoje.toLocaleDateString("pt-BR");
  return {
    success: true,
    data: dataISO,
    liturgia: {
      titulo: `Liturgia do ${diaSemana} - ${dataFormatada}`,
      cor: "Verde",
      semana: "Tempo Comum",
      tituloLiturgico: "",
      antifona: "",
      introducao: "",
      primeiraLeitura: "Leitura n\xE3o dispon\xEDvel no momento.",
      segundaLeitura: "",
      salmo: "Salmo n\xE3o dispon\xEDvel.",
      evangelho: "Evangelho n\xE3o dispon\xEDvel.",
      reflexao: ""
    },
    fonte: "mock"
  };
}
__name(getMockLiturgia, "getMockLiturgia");

// src/routes/public/terco.js
init_modules_watch_stub();

// src/utils/responses.js
init_modules_watch_stub();
function jsonResponse2(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders2,
      ...additionalHeaders
    }
  });
}
__name(jsonResponse2, "jsonResponse");

// src/routes/public/terco.js
function getMisterioTerco() {
  try {
    const day = (/* @__PURE__ */ new Date()).getDay();
    const mapa = {
      0: { tipo: "gloriosos", titulo: "Mist\xE9rios Gloriosos", descricao: "A Ressurrei\xE7\xE3o de Jesus", cor: "branco" },
      1: { tipo: "gozosos", titulo: "Mist\xE9rios Gozosos", descricao: "A Anuncia\xE7\xE3o do Anjo", cor: "azul" },
      2: { tipo: "dolorosos", titulo: "Mist\xE9rios Dolorosos", descricao: "A Agonia de Jesus", cor: "roxo" },
      3: { tipo: "gloriosos", titulo: "Mist\xE9rios Gloriosos", descricao: "A Ascens\xE3o de Jesus", cor: "branco" },
      4: { tipo: "luminosos", titulo: "Mist\xE9rios Luminosos", descricao: "O Batismo de Jesus", cor: "branco" },
      5: { tipo: "dolorosos", titulo: "Mist\xE9rios Dolorosos", descricao: "A Crucifica\xE7\xE3o", cor: "roxo" },
      6: { tipo: "gozosos", titulo: "Mist\xE9rios Gozosos", descricao: "A Visita\xE7\xE3o", cor: "azul" }
    };
    const misterio = mapa[day] || mapa[2];
    const audioUrls = {
      gloriosos: "https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-gloriosos.mp3",
      gozosos: "https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-gozosos.mp3",
      dolorosos: "https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-dolorosos.mp3",
      luminosos: "https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-luminosos.mp3"
    };
    const diasSemana = ["Domingo", "Segunda-feira", "Ter\xE7a-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "S\xE1bado"];
    const horarios = [
      { hora: 7, nome: "Manh\xE3", descricao: "Ter\xE7o da Aurora" },
      { hora: 15, nome: "Miseric\xF3rdia", descricao: "Hora da Miseric\xF3rdia" },
      { hora: 21, nome: "Noite", descricao: "Ter\xE7o do Descanso" },
      { hora: 3, nome: "Madrugada", descricao: "Ter\xE7o da Vig\xEDlia" }
    ];
    const horaAtual = (/* @__PURE__ */ new Date()).getHours();
    const proximoHorario = horarios.find((h) => h.hora > horaAtual) || horarios[0];
    return {
      success: true,
      dia: day,
      diaSemana: diasSemana[day],
      misterio: misterio.tipo,
      titulo: misterio.titulo,
      descricao: misterio.descricao,
      corLiturgica: misterio.cor,
      audioUrl: audioUrls[misterio.tipo],
      estrutura: { paiNosso: 6, aveMaria: 50, gloria: 5, totalContas: 56, tempoMedio: "25 minutos" },
      horarios,
      proximoHorario,
      dataReferencia: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch {
    return {
      success: true,
      dia: 2,
      diaSemana: "Ter\xE7a-feira",
      misterio: "dolorosos",
      titulo: "Mist\xE9rios Dolorosos",
      descricao: "A Agonia de Jesus",
      corLiturgica: "roxo",
      audioUrl: "https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-dolorosos.mp3",
      estrutura: { paiNosso: 6, aveMaria: 50, gloria: 5, totalContas: 56, tempoMedio: "25 minutos" },
      horarios: [],
      proximoHorario: { hora: 15, nome: "Miseric\xF3rdia", descricao: "Hora da Miseric\xF3rdia" },
      dataReferencia: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
}
__name(getMisterioTerco, "getMisterioTerco");
async function handleTerco(request, env) {
  return jsonResponse2(getMisterioTerco());
}
__name(handleTerco, "handleTerco");

// src/routes/public/youtube.js
init_modules_watch_stub();

// src/config/constants.js
init_modules_watch_stub();
var CONFIG2 = {
  YOUTUBE_CHANNEL_ID: "UCwTM4qaQO3fsRpKAAZUZ8Ng",
  VIDEO_PRIORITARIO: "k6sbFio_qDI",
  SECRETARIAT_EMAILS: ["santuariodefatima@santuariodefatima.com.br", "pascom.santuario@outlook.com.br"],
  MAX_USERS: 5,
  FALLBACK_VIDEOS: [
    { id: "k6sbFio_qDI", title: "Santa Missa - Santuario de Fatima", thumbnail: "https://img.youtube.com/vi/k6sbFio_qDI/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=k6sbFio_qDI", isLiveNow: false },
    { id: "W3kFS0PQEc8", title: "Santa Missa - 1 Domingo da Quaresma - 22 de Fevereiro de 2026", thumbnail: "https://img.youtube.com/vi/W3kFS0PQEc8/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=W3kFS0PQEc8", isLiveNow: false },
    { id: "MkxD4-pTviM", title: "Santa Missa - Quarta-feira de Cinzas - 18 de Fevereiro de 2026", thumbnail: "https://img.youtube.com/vi/MkxD4-pTviM/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=MkxD4-pTviM", isLiveNow: false },
    { id: "uxpvBXYXm6s", title: "Santa Missa - Santuario de Fatima", thumbnail: "https://img.youtube.com/vi/uxpvBXYXm6s/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=uxpvBXYXm6s", isLiveNow: false },
    { id: "LoRx8F-wRf0", title: "Santa Missa - Santuario de Fatima", thumbnail: "https://img.youtube.com/vi/LoRx8F-wRf0/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=LoRx8F-wRf0", isLiveNow: false },
    { id: "DQLtlDp9r5c", title: "Santa Missa - Domingo da Quaresma", thumbnail: "https://img.youtube.com/vi/DQLtlDp9r5c/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=DQLtlDp9r5c", isLiveNow: false },
    { id: "L6fHBk0YC5Q", title: "Santa Missa - Santuario de Fatima", thumbnail: "https://img.youtube.com/vi/L6fHBk0YC5Q/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=L6fHBk0YC5Q", isLiveNow: false }
  ]
};

// src/routes/public/youtube.js
async function getYouTubeMainVideo(env) {
  try {
    const API_KEY = env.YOUTUBE_CHANNEL_API_KEY;
    const CHANNEL_ID = "UCwTM4qaQO3fsRpKAAZUZ8Ng";
    const liveManual = await env.KV_YOUTUBE_STORAGE?.get("live_manual", "json");
    if (liveManual && liveManual.ativo === true) {
      console.log("\u{1F4FA} Usando live manual:", liveManual.videoId);
      let recordedVideos2 = [];
      if (API_KEY) {
        try {
          const videosUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet&order=date&maxResults=10&type=video`;
          const videosRes = await fetch(videosUrl);
          if (videosRes.ok) {
            const videosData = await videosRes.json();
            if (videosData.items) {
              recordedVideos2 = videosData.items.map((item) => ({
                id: cleanVideoId(item.id.videoId),
                title: cleanYouTubeTitle(item.snippet.title),
                thumbnail: item.snippet.thumbnails.high?.url || `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
                publishedAt: item.snippet.publishedAt,
                channelTitle: item.snippet.channelTitle,
                videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                isLiveNow: false
              }));
            }
          }
        } catch (e) {
          console.error("Erro ao buscar v\xEDdeos gravados:", e);
        }
      }
      const mainVideo2 = {
        id: liveManual.videoId,
        title: liveManual.title || "Transmiss\xE3o ao Vivo \u2014 Santu\xE1rio de F\xE1tima",
        thumbnail: liveManual.thumbnail || `https://img.youtube.com/vi/${liveManual.videoId}/maxresdefault.jpg`,
        publishedAt: liveManual.atualizadoEm || (/* @__PURE__ */ new Date()).toISOString(),
        channelTitle: "Santu\xE1rio de F\xE1tima",
        videoUrl: liveManual.link,
        link: liveManual.link,
        isLiveNow: true
      };
      const cardVideos2 = recordedVideos2.filter((v) => v.id !== liveManual.videoId).slice(0, 5);
      return {
        mainVideo: mainVideo2,
        allVideos: [mainVideo2, ...recordedVideos2],
        cardVideos: cardVideos2,
        liveStatus: "live"
      };
    }
    if (!API_KEY) {
      console.log("\u26A0\uFE0F Sem API_KEY, usando fallback");
      const cleanFallback = CONFIG2.FALLBACK_VIDEOS.map((v) => ({
        ...v,
        id: cleanVideoId(v.id),
        isLiveNow: false
      }));
      return {
        mainVideo: cleanFallback[0],
        allVideos: cleanFallback,
        cardVideos: cleanFallback.slice(1),
        liveStatus: "none"
      };
    }
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet&order=date&maxResults=20&type=video`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      console.error("Erro na busca do YouTube:", searchRes.status);
      const cleanFallback = CONFIG2.FALLBACK_VIDEOS.map((v) => ({
        ...v,
        id: cleanVideoId(v.id),
        isLiveNow: false
      }));
      return {
        mainVideo: cleanFallback[0],
        allVideos: cleanFallback,
        cardVideos: cleanFallback.slice(1),
        liveStatus: "none"
      };
    }
    const searchData = await searchRes.json();
    if (!searchData.items || searchData.items.length === 0) {
      const cleanFallback = CONFIG2.FALLBACK_VIDEOS.map((v) => ({
        ...v,
        id: cleanVideoId(v.id),
        isLiveNow: false
      }));
      return {
        mainVideo: cleanFallback[0],
        allVideos: cleanFallback,
        cardVideos: cleanFallback.slice(1),
        liveStatus: "none"
      };
    }
    const allVideos = [];
    const videoIds = [];
    for (const item of searchData.items) {
      const videoId = cleanVideoId(item.id.videoId);
      if (videoId) videoIds.push(videoId);
    }
    let liveVideos = /* @__PURE__ */ new Set();
    if (videoIds.length > 0) {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoIds.join(",")}&part=liveStreamingDetails,snippet,status`;
      try {
        const detailsRes = await fetch(detailsUrl);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          if (detailsData.items) {
            detailsData.items.forEach((item) => {
              const hasLiveDetails = item.liveStreamingDetails !== void 0;
              const isActuallyLive = hasLiveDetails && !item.liveStreamingDetails?.actualEndTime;
              const isLiveStatus = item.snippet?.liveBroadcastContent === "live";
              if (isActuallyLive || isLiveStatus) {
                liveVideos.add(item.id);
              }
            });
          }
        }
      } catch (e) {
        console.error("Erro ao verificar status de live:", e);
      }
    }
    for (const item of searchData.items) {
      const videoId = cleanVideoId(item.id.videoId);
      const title = cleanYouTubeTitle(item.snippet.title);
      const isLiveNow = liveVideos.has(videoId);
      allVideos.push({
        id: videoId,
        title,
        thumbnail: item.snippet.thumbnails.high?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        link: `https://www.youtube.com/watch?v=${videoId}`,
        isLiveNow
      });
    }
    const liveVideosList = allVideos.filter((v) => v.isLiveNow === true);
    const recordedVideos = allVideos.filter((v) => v.isLiveNow === false);
    const liveStatus = liveVideosList.length > 0 ? "live" : "none";
    let mainVideo, cardVideos;
    if (liveVideosList.length > 0) {
      mainVideo = liveVideosList[0];
      const otherLives = liveVideosList.slice(1);
      const allCards = [...otherLives, ...recordedVideos].slice(0, 5);
      cardVideos = allCards.length > 0 ? allCards : CONFIG2.FALLBACK_VIDEOS.slice(1, 6).map((v) => ({
        ...v,
        id: cleanVideoId(v.id),
        isLiveNow: false
      }));
    } else {
      mainVideo = recordedVideos[0] || {
        ...CONFIG2.FALLBACK_VIDEOS[0],
        id: cleanVideoId(CONFIG2.FALLBACK_VIDEOS[0].id),
        isLiveNow: false
      };
      cardVideos = recordedVideos.length > 1 ? recordedVideos.filter((v) => v.id !== mainVideo.id).slice(0, 5) : CONFIG2.FALLBACK_VIDEOS.slice(1, 6).map((v) => ({
        ...v,
        id: cleanVideoId(v.id),
        isLiveNow: false
      }));
    }
    return { mainVideo, allVideos, cardVideos, liveStatus };
  } catch (error) {
    console.error("\u274C Erro em getYouTubeMainVideo:", error);
    const cleanFallback = CONFIG2.FALLBACK_VIDEOS.map((v) => ({
      ...v,
      id: cleanVideoId(v.id),
      isLiveNow: false
    }));
    return {
      mainVideo: cleanFallback[0],
      allVideos: cleanFallback,
      cardVideos: cleanFallback.slice(1),
      liveStatus: "none"
    };
  }
}
__name(getYouTubeMainVideo, "getYouTubeMainVideo");
async function handleYouTube(request, env) {
  const result = await getYouTubeMainVideo(env);
  return jsonResponse2({
    videos: result.allVideos,
    mainVideo: result.mainVideo,
    cardVideos: result.cardVideos,
    liveStatus: result.liveStatus,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}
__name(handleYouTube, "handleYouTube");
async function handleAdminYoutubeLivePost(request, env) {
  console.log("\u{1F4FA} handleAdminYoutubeLivePost chamado");
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse2({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  const body = await request.json();
  const { liveUrl } = body;
  if (!liveUrl) {
    return jsonResponse2({ success: false, error: "URL da live \xE9 obrigat\xF3ria" }, 400);
  }
  console.log("\u{1F4FA} URL recebida:", liveUrl);
  let videoId = null;
  const url = liveUrl.trim();
  if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1]?.split("&")[0]?.trim();
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0]?.trim();
  } else if (url.includes("youtube.com/live/")) {
    videoId = url.split("youtube.com/live/")[1]?.split("?")[0]?.trim();
  }
  if (videoId) {
    videoId = videoId.split("&")[0].split("?")[0].trim();
  }
  if (!videoId) {
    return jsonResponse2({ success: false, error: "N\xE3o foi poss\xEDvel extrair o ID do v\xEDdeo." }, 400);
  }
  console.log("\u{1F4FA} Video ID extra\xEDdo:", videoId);
  const liveData = {
    id: videoId,
    videoId,
    title: "Transmiss\xE3o ao Vivo \u2014 Santu\xE1rio de F\xE1tima",
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    link: `https://www.youtube.com/watch?v=${videoId}`,
    isLiveNow: true,
    ativo: true,
    atualizadoEm: (/* @__PURE__ */ new Date()).toISOString()
  };
  await env.KV_YOUTUBE_STORAGE.put("live_manual", JSON.stringify(liveData));
  console.log("\u2705 Live salva com sucesso:", liveData);
  return jsonResponse2({ success: true, live: liveData });
}
__name(handleAdminYoutubeLivePost, "handleAdminYoutubeLivePost");
async function handleAdminYoutubeLiveDelete(request, env) {
  console.log("\u{1F4FA} handleAdminYoutubeLiveDelete chamado");
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse2({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  await env.KV_YOUTUBE_STORAGE.delete("live_manual");
  console.log("\u2705 Live removida do KV_YOUTUBE_STORAGE");
  return jsonResponse2({ success: true, message: "Live removida com sucesso!" });
}
__name(handleAdminYoutubeLiveDelete, "handleAdminYoutubeLiveDelete");
async function handleAdminYoutubeLiveGet(request, env) {
  console.log("\u{1F4FA} handleAdminYoutubeLiveGet chamado");
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse2({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  const liveManual = await env.KV_YOUTUBE_STORAGE?.get("live_manual", "json");
  console.log("\u{1F4FA} Live encontrada:", liveManual ? "Sim" : "N\xE3o");
  return jsonResponse2({ success: true, live: liveManual || null });
}
__name(handleAdminYoutubeLiveGet, "handleAdminYoutubeLiveGet");

// src/routes/public/vatican.js
init_modules_watch_stub();
function parseRSS(xml) {
  const items = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  for (const match of itemMatches) {
    if (items.length >= 12) break;
    const itemXml = match[1];
    const getTag = /* @__PURE__ */ __name((tagName) => {
      const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`);
      const m = itemXml.match(regex);
      return m ? cleanText(m[1]) : "";
    }, "getTag");
    const title = getTag("title");
    const link = getTag("link");
    const description = getTag("description");
    const pubDate = getTag("pubDate") || (/* @__PURE__ */ new Date()).toISOString();
    if (title && link) {
      items.push({
        id: `vatican_${Date.now()}_${items.length}`,
        title,
        link: link.trim(),
        description: description.substring(0, 180) + "...",
        pubDate,
        author: "Vatican News",
        category: "Noticias"
      });
    }
  }
  return items;
}
__name(parseRSS, "parseRSS");
function categorizeNews(items) {
  return items.map((item) => {
    let category = "Noticias";
    const lowerTitle = item.title.toLowerCase();
    const lowerLink = item.link.toLowerCase();
    if (lowerLink.includes("/papa/") || lowerTitle.includes("papa")) category = "Papa Francisco";
    else if (lowerLink.includes("/cultura/") || lowerTitle.includes("cultura")) category = "Cultura";
    else if (lowerLink.includes("/formacao/") || lowerTitle.includes("formacao")) category = "Forma\xE7\xE3o";
    else if (lowerLink.includes("/igreja/")) category = "Igreja";
    else if (lowerTitle.includes("jovens")) category = "Juventude";
    else if (lowerTitle.includes("familia")) category = "Fam\xEDlia";
    return { ...item, category };
  });
}
__name(categorizeNews, "categorizeNews");
function getFallbackNewsArray() {
  return [{
    id: "fallback_1",
    title: "Vatican News - \xDAltimas Not\xEDcias",
    link: "https://www.vaticannews.va/pt.html",
    description: "Acesse o site oficial do Vatican News.",
    pubDate: (/* @__PURE__ */ new Date()).toISOString(),
    author: "Vatican News",
    category: "Noticias"
  }];
}
__name(getFallbackNewsArray, "getFallbackNewsArray");
async function getVaticanNews(env) {
  const cacheKey = "vatican_news:latest";
  try {
    const cached = await env.VATICANNEWS_CACHE?.get(cacheKey, "json");
    if (cached) {
      if (Array.isArray(cached)) return cached;
      if (cached.items && Array.isArray(cached.items)) return cached.items;
    }
    const res = await fetch("https://www.vaticannews.va/pt.rss.xml");
    const xml = await res.text();
    const items = parseRSS(xml);
    const finalItems = categorizeNews(items).slice(0, 6);
    if (env.VATICANNEWS_CACHE) {
      await env.VATICANNEWS_CACHE.put(cacheKey, JSON.stringify(finalItems), { expirationTtl: 3600 });
    }
    return finalItems;
  } catch (error) {
    console.error("Erro no Vatican News:", error);
    return getFallbackNewsArray();
  }
}
__name(getVaticanNews, "getVaticanNews");

// src/routes/public/diocese.js
init_modules_watch_stub();
function extractNewsFromHTML(html) {
  const news = [];
  try {
    const newsPatterns = [
      { pattern: /Posse Canônica 2026/g, category: "Acontecimentos Eclesiais" },
      { pattern: /Crisma/g, category: "Sacramentos" },
      { pattern: /Igreja Diocesana/g, category: "Igreja" },
      { pattern: /Acontece na Igreja/g, category: "Not\xEDcias" },
      { pattern: /Retiro do Clero 2025/g, category: "Clero" },
      { pattern: /Centro Pastoral em ação/g, category: "Pastoral" },
      { pattern: /Visita Pastoral/g, category: "Pastoral" }
    ];
    newsPatterns.forEach(({ pattern, category }) => {
      if (pattern.test(html)) {
        news.push(createNewsItem(pattern.source, category));
      }
    });
    const titleRegex = /<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi;
    const titles = [...html.matchAll(titleRegex)];
    titles.slice(0, 5).forEach((match, index) => {
      const title = match[1].replace(/<[^>]*>/g, "").trim();
      if (title.length > 10 && !news.some((n) => n.title === title)) {
        news.push(createNewsItem(title, "\xDAltimas Not\xEDcias", index));
      }
    });
  } catch (e) {
    console.error("Erro ao extrair not\xEDcias:", e);
  }
  return news.filter(
    (item, index, self2) => index === self2.findIndex((n) => n.title === item.title)
  ).slice(0, 6);
}
__name(extractNewsFromHTML, "extractNewsFromHTML");
function createNewsItem(title, category, index = 0) {
  const descriptions = [
    "A Diocese de Santo Amaro convida todos os fi\xE9is para este importante momento de f\xE9 e comunh\xE3o.",
    "Participe deste evento especial que reunir\xE1 a comunidade diocesana em ora\xE7\xE3o e reflex\xE3o.",
    "Momento de gra\xE7a e renova\xE7\xE3o espiritual para toda a fam\xEDlia diocesana.",
    "Venha vivenciar esta experi\xEAncia \xFAnica de f\xE9 e partilha conosco."
  ];
  const authors = [
    "Pascom Diocese",
    "Equipe de Comunica\xE7\xE3o",
    "Diocese de Santo Amaro"
  ];
  return {
    id: `diocese-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    description: descriptions[index % descriptions.length],
    link: "https://diocesedesantoamaro.org.br",
    pubDate: new Date(Date.now() - index * 864e5).toISOString(),
    author: authors[index % authors.length],
    category
  };
}
__name(createNewsItem, "createNewsItem");
function getSimulatedNews() {
  return [
    {
      id: "1",
      title: "Posse Can\xF4nica 2026",
      description: "A Diocese de Santo Amaro se prepara para a celebra\xE7\xE3o da Posse Can\xF4nica que acontecer\xE1 em 2026.",
      link: "https://diocesedesantoamaro.org.br",
      pubDate: (/* @__PURE__ */ new Date()).toISOString(),
      author: "Pascom Diocese",
      category: "Acontecimentos Eclesiais"
    },
    {
      id: "2",
      title: "Celebra\xE7\xE3o do Crisma",
      description: "Jovens e adultos se preparam para receber o Sacramento do Crisma em nossas par\xF3quias.",
      link: "https://diocesedesantoamaro.org.br",
      pubDate: new Date(Date.now() - 864e5).toISOString(),
      author: "Equipe de Catequese",
      category: "Sacramentos"
    },
    {
      id: "3",
      title: "Igreja Diocesana em Movimento",
      description: "Acompanhe as principais atividades e acontecimentos da Igreja Diocesana de Santo Amaro.",
      link: "https://diocesedesantoamaro.org.br",
      pubDate: new Date(Date.now() - 1728e5).toISOString(),
      author: "Comunica\xE7\xE3o Diocesana",
      category: "Igreja Diocesana"
    },
    {
      id: "4",
      title: "Acontece na Igreja",
      description: "Fique por dentro dos principais eventos e celebra\xE7\xF5es que acontecem em nossa diocese.",
      link: "https://diocesedesantoamaro.org.br",
      pubDate: new Date(Date.now() - 2592e5).toISOString(),
      author: "Pascom",
      category: "Acontece na Igreja"
    },
    {
      id: "5",
      title: "Retiro do Clero 2025",
      description: "Sacerdotes da diocese participam do Retiro do Clero 2025, momento de espiritualidade.",
      link: "https://diocesedesantoamaro.org.br",
      pubDate: new Date(Date.now() - 3456e5).toISOString(),
      author: "Equipe Diocesana",
      category: "Clero"
    },
    {
      id: "6",
      title: "Centro Pastoral em A\xE7\xE3o",
      description: "Centro Pastoral Diocesano promove encontros e forma\xE7\xF5es para agentes de pastoral.",
      link: "https://diocesedesantoamaro.org.br",
      pubDate: new Date(Date.now() - 432e6).toISOString(),
      author: "Centro Pastoral",
      category: "Pastoral"
    }
  ];
}
__name(getSimulatedNews, "getSimulatedNews");
async function handleDioceseNews(request, env) {
  if (request.method !== "GET") {
    return jsonResponse2({ success: false, error: "M\xE9todo n\xE3o permitido" }, 405);
  }
  try {
    console.log("\u{1F310} Buscando not\xEDcias da Diocese de Santo Amaro...");
    const response = await fetch("https://diocesedesantoamaro.org.br", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SantuarioBot/1.0)",
        "Accept": "text/html,application/xhtml+xml"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const newsItems = extractNewsFromHTML(html);
    const finalNews = newsItems.length > 0 ? newsItems : getSimulatedNews();
    return jsonResponse2({
      success: true,
      items: finalNews,
      total: finalNews.length,
      source: "diocesedesantoamaro.org.br",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("\u274C Erro no worker da Diocese:", error);
    return jsonResponse2({
      success: false,
      error: error.message,
      items: getSimulatedNews(),
      source: "simulated",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
}
__name(handleDioceseNews, "handleDioceseNews");

// src/utils/limpeza.js
init_modules_watch_stub();
async function cleanupOldCandles(env) {
  try {
    if (!env.DB) return;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
    await env.DB.prepare(`UPDATE velas SET status = 0 WHERE data < ? AND status = 1`).bind(sevenDaysAgo).run();
  } catch (error) {
    console.error("Erro na limpeza de velas:", error);
  }
}
__name(cleanupOldCandles, "cleanupOldCandles");
async function backupOldPrayers(env) {
  try {
    if (!env.DB) return;
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1e3).toISOString();
    await env.DB.prepare(`DELETE FROM prayer WHERE created_at < ?`).bind(sixtyDaysAgo).run();
  } catch (error) {
    console.error("Erro ao limpar pedidos:", error);
  }
}
__name(backupOldPrayers, "backupOldPrayers");

// src/routes/admin/index.js
init_modules_watch_stub();

// src/controllers/auth_shared.js
init_modules_watch_stub();
async function sha2562(text) {
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha2562, "sha256");
async function verificarSenha(senha, hash) {
  const hashed = await sha2562(senha);
  return hashed === hash;
}
__name(verificarSenha, "verificarSenha");

// src/routes/admin/index.js
function inicializarHorariosPadrao() {
  return [
    { id: "segunda", dia: "Segunda-Feira", missas: [], ativo: true },
    {
      id: "terca",
      dia: "Ter\xE7a-Feira",
      missas: [
        { id: "terca-1", hora: "07h30" },
        { id: "terca-2", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }
      ],
      ativo: true
    },
    {
      id: "quarta",
      dia: "Quarta-Feira",
      missas: [
        { id: "quarta-1", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }
      ],
      ativo: true
    },
    {
      id: "quinta",
      dia: "Quinta-Feira",
      missas: [
        { id: "quinta-1", hora: "07h30" },
        { id: "quinta-2", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }
      ],
      ativo: true
    },
    {
      id: "sexta",
      dia: "Sexta-Feira",
      missas: [
        { id: "sexta-1", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }
      ],
      ativo: true
    },
    {
      id: "sabado",
      dia: "S\xE1bado",
      missas: [
        { id: "sabado-1", hora: "16h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }
      ],
      ativo: true
    },
    {
      id: "domingo",
      dia: "Domingo",
      missas: [
        { id: "domingo-1", hora: "08h00" },
        {
          id: "domingo-2",
          hora: "10h00",
          tipo: "Transmitida AO VIVO",
          youtube: true,
          youtubeLink: "https://youtube.com/@santuariodefatimanews"
        },
        { id: "domingo-3", hora: "18h30" }
      ],
      ativo: true
    }
  ];
}
__name(inicializarHorariosPadrao, "inicializarHorariosPadrao");
async function handleAdminDados(request, env, user) {
  console.log("\u{1F535} handleAdminDados chamado - user:", user?.email);
  if (!user) {
    return jsonResponse({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  try {
    let carrossel = await env.KV_FILES?.get("santuario_carrossel", "json") || [];
    let popups = await env.KV_FILES?.get("santuario_popups", "json") || [];
    let recados = await env.KV_FILES?.get("santuario_recados", "json") || [];
    let horariosMissas = await env.KV_MISSAS?.get("horariosMissas", "json");
    let momentosLiturgicos = await env.KV_LITURGIA?.get("momentos", "json") || [];
    if (!Array.isArray(horariosMissas)) {
      horariosMissas = inicializarHorariosPadrao();
    }
    return jsonResponse({
      success: true,
      dados: { carrossel, momentosLiturgicos, popups, recados, horariosMissas }
    });
  } catch (error) {
    console.error("\u274C Erro ao carregar dados:", error);
    return jsonResponse({ success: false, error: "Erro ao carregar dados" }, 500);
  }
}
__name(handleAdminDados, "handleAdminDados");
async function handleAdminSalvarDados(request, env, user, body) {
  console.log("\u{1F7E2} handleAdminSalvarDados chamado - user:", user?.email);
  if (!user) {
    return jsonResponse({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  if (!body) {
    return jsonResponse({ success: false, error: "Dados n\xE3o recebidos" }, 400);
  }
  try {
    if (body.carrossel !== void 0) {
      await env.KV_FILES.put("santuario_carrossel", JSON.stringify(body.carrossel));
    }
    if (body.popups !== void 0) {
      await env.KV_FILES.put("santuario_popups", JSON.stringify(body.popups));
    }
    if (body.recados !== void 0) {
      await env.KV_FILES.put("santuario_recados", JSON.stringify(body.recados));
    }
    if (Array.isArray(body.horariosMissas)) {
      await env.KV_MISSAS.put("horariosMissas", JSON.stringify(body.horariosMissas));
    }
    if (body.momentosLiturgicos !== void 0) {
      await env.KV_LITURGIA.put("momentos", JSON.stringify(body.momentosLiturgicos));
    }
    if (body.arquivosDownload !== void 0) {
      await env.KV_FILES.put("santuario_arquivos", JSON.stringify(body.arquivosDownload));
    }
    console.log("\u2705 Dados salvos com sucesso por:", user.email);
    return jsonResponse({ success: true, message: "Dados salvos com sucesso!" });
  } catch (error) {
    console.error("\u274C Erro ao salvar:", error);
    return jsonResponse({ success: false, error: "Erro ao salvar dados" }, 500);
  }
}
__name(handleAdminSalvarDados, "handleAdminSalvarDados");
async function handleAdminPerfil(request, env, user) {
  if (!user) {
    return jsonResponse({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  return jsonResponse({
    success: true,
    perfil: {
      nome: user.nome,
      email: user.email,
      role: user.role
    }
  });
}
__name(handleAdminPerfil, "handleAdminPerfil");
async function handleAdminAtualizarPerfil(request, env, user, body) {
  if (!user) {
    return jsonResponse({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  if (!body) {
    return jsonResponse({ success: false, error: "Dados n\xE3o recebidos" }, 400);
  }
  try {
    const { nome, email } = body;
    await env.DB.prepare(`
      UPDATE users SET nome = ?, email = ? WHERE id = ?
    `).bind(
      nome || user.nome,
      email || user.email,
      user.id
    ).run();
    return jsonResponse({ success: true, message: "Perfil atualizado!" });
  } catch (error) {
    console.error("\u274C Erro ao atualizar perfil:", error);
    return jsonResponse({ success: false, error: "Erro ao atualizar perfil" }, 500);
  }
}
__name(handleAdminAtualizarPerfil, "handleAdminAtualizarPerfil");
async function handleAdminAlterarSenha(request, env, user, body) {
  if (!user) {
    return jsonResponse({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  if (!body) {
    return jsonResponse({ success: false, error: "Dados n\xE3o recebidos" }, 400);
  }
  try {
    const { senha_atual, nova_senha } = body;
    const dbUser = await env.DB.prepare(`
      SELECT senha_hash FROM users WHERE id = ?
    `).bind(user.id).first();
    if (!dbUser) {
      return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" }, 404);
    }
    const senhaOk = await verificarSenha(senha_atual, dbUser.senha_hash);
    if (!senhaOk) {
      return jsonResponse({ success: false, error: "Senha atual incorreta" }, 400);
    }
    if (!nova_senha || nova_senha.length < 6) {
      return jsonResponse({ success: false, error: "Nova senha fraca" }, 400);
    }
    const novaHash = await sha2562(nova_senha);
    await env.DB.prepare(`
      UPDATE users SET senha_hash = ? WHERE id = ?
    `).bind(novaHash, user.id).run();
    return jsonResponse({ success: true, message: "Senha alterada com sucesso!" });
  } catch (error) {
    console.error("\u274C Erro ao alterar senha:", error);
    return jsonResponse({ success: false, error: "Erro ao alterar senha" }, 500);
  }
}
__name(handleAdminAlterarSenha, "handleAdminAlterarSenha");

// src/routes/fiel/index.js
init_modules_watch_stub();

// src/routes/fiel/dados.js
init_modules_watch_stub();
async function getDados(request, env) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    if (!email) {
      return jsonResponse({ success: false, error: "Email \xE9 obrigat\xF3rio" }, 400);
    }
    const key = `fiel:dados:${email}`;
    const dados = await env.KV_FIEL?.get(key, "json") || {};
    return jsonResponse({
      success: true,
      musicas: dados.musicas || [],
      versiculos: dados.versiculos || [],
      oracoes: dados.oracoes || [],
      fotos: dados.fotos || [],
      // ✅ perfil vem da MESMA chave, nunca de chave separada
      perfil: {
        nome: dados.perfil?.nome || "",
        email: dados.perfil?.email || email,
        tema: dados.perfil?.tema || "escuro",
        corFundo: dados.perfil?.corFundo || "#1a237e",
        imagemFundo: dados.perfil?.imagemFundo || "",
        avatar: dados.perfil?.avatar || ""
      }
    });
  } catch (error) {
    console.error("Erro em getDados:", error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}
__name(getDados, "getDados");

// src/routes/fiel/salvar.js
init_modules_watch_stub();
async function salvarDados(request, env) {
  try {
    const body = await request.json();
    const { email, musicas, versiculos, oracoes, fotos, perfil } = body;
    if (!email) {
      return jsonResponse({ success: false, error: "Email \xE9 obrigat\xF3rio" }, 400);
    }
    const key = `fiel:dados:${email}`;
    const dadosAtuais = await env.KV_FIEL?.get(key, "json") || {};
    const payload = {
      musicas: musicas ?? dadosAtuais.musicas ?? [],
      versiculos: versiculos ?? dadosAtuais.versiculos ?? [],
      oracoes: oracoes ?? dadosAtuais.oracoes ?? [],
      fotos: fotos ?? dadosAtuais.fotos ?? [],
      // ✅ Perfil sempre mesclado — nunca apaga campos não enviados
      perfil: {
        ...dadosAtuais.perfil,
        ...perfil || {}
      },
      ultimaAtualizacao: (/* @__PURE__ */ new Date()).toISOString()
    };
    await env.KV_FIEL?.put(key, JSON.stringify(payload));
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Erro em salvarDados:", error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}
__name(salvarDados, "salvarDados");

// src/routes/fiel/perfil.js
init_modules_watch_stub();
async function atualizarPerfil(request, env) {
  try {
    const body = await request.json();
    const { email, nome, telefone, avatar } = body;
    if (!email) return errorResponse("E-mail \xE9 obrigat\xF3rio", 400);
    const db = env.DB;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = await db.prepare(
      "SELECT email FROM fiel_dados WHERE email = ?"
    ).bind(email).first();
    if (existing) {
      await db.prepare(`
        UPDATE fiel_dados
        SET nome = ?, telefone = ?, avatar = ?, updated_at = ?
        WHERE email = ?
      `).bind(nome ?? null, telefone ?? null, avatar ?? null, now, email).run();
    } else {
      await db.prepare(`
        INSERT INTO fiel_dados (email, nome, telefone, avatar, musicas, versiculos, oracoes, fotos, termo_aceito, created_at, updated_at)
        VALUES (?, ?, ?, ?, '[]', '[]', '[]', '[]', 0, ?, ?)
      `).bind(email, nome ?? null, telefone ?? null, avatar ?? null, now, now).run();
    }
    return jsonResponse({ success: true, message: "Perfil atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return errorResponse("Erro ao atualizar perfil", 500);
  }
}
__name(atualizarPerfil, "atualizarPerfil");

// src/routes/fiel/pastorais.js
init_modules_watch_stub();
async function listarPastorais(request, env) {
  try {
    const db = env.DB;
    const { results } = await db.prepare(`
      SELECT id, nome, descricao, responsavel, contato, ativo
      FROM pastorais
      WHERE ativo = 1
      ORDER BY nome ASC
    `).all();
    return jsonResponse({ success: true, pastorais: results ?? [] });
  } catch (error) {
    console.error("Erro ao listar pastorais:", error);
    return jsonResponse({ success: true, pastorais: [] });
  }
}
__name(listarPastorais, "listarPastorais");

// src/routes/fiel/termo-publico.js
init_modules_watch_stub();
function gerarHTMLTermo(data) {
  const dataFormatada = new Date(data.dataAceite).toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const horaFormatada = new Date(data.dataAceite).toLocaleTimeString("pt-BR");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Termo de Autoriza\xE7\xE3o de Uso de \xC1udio</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      margin: 0;
      padding: 40px;
      background: white;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 30px;
      border: 1px solid #ccc;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #0b3b5c;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #0b3b5c;
      font-size: 24px;
      margin: 0 0 10px 0;
    }
    .header p {
      color: #666;
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .termo-texto {
      background: #f9f9f9;
      padding: 20px;
      border-left: 4px solid #0b3b5c;
      margin: 20px 0;
      font-style: italic;
    }
    .dados {
      background: #f0f7ff;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .dados p {
      margin: 8px 0;
    }
    .assinatura {
      margin-top: 40px;
      text-align: center;
      border-top: 1px solid #ccc;
      padding-top: 20px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SANTU\xC1RIO NOSSA SENHORA DE F\xC1TIMA</h1>
      <p>Rua Darwin, 651 - Santo Amaro, S\xE3o Paulo - SP</p>
      <p>santuariodefatima.com.br | (11) 5521-0312</p>
    </div>
    
    <div class="content">
      <h2 style="text-align: center; color: #0b3b5c;">TERMO DE AUTORIZA\xC7\xC3O DE USO DE \xC1UDIO</h2>
      
      <div class="dados">
        <p><strong>NOME COMPLETO:</strong> ${data.nome}</p>
        <p><strong>CPF:</strong> ${data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</p>
        <p><strong>E-MAIL:</strong> ${data.email}</p>
        ${data.responsavelLegal ? `<p><strong>RESPONS\xC1VEL LEGAL:</strong> ${data.responsavelLegal}</p>` : ""}
        ${data.cpfResponsavel ? `<p><strong>CPF DO RESPONS\xC1VEL:</strong> ${data.cpfResponsavel.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</p>` : ""}
        <p><strong>DATA DO ACEITE:</strong> ${dataFormatada} \xE0s ${horaFormatada}</p>
        <p><strong>IP DE ORIGEM:</strong> ${data.ip || "N\xE3o dispon\xEDvel"}</p>
      </div>
      
      <div class="termo-texto">
        <p>Eu, <strong>${data.nome}</strong>, portador(a) do CPF <strong>${data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</strong>,</p>
        <p>AUTORIZO a grava\xE7\xE3o em \xE1udio da minha voz, para que possa ser personalizada a B\xEDblia Online do Site - Santu\xE1rio Nossa Senhora de F\xE1tima - Santo Amaro - S\xE3o Paulo-SP, para que no entendimento desta possa eu fiel, ouvir a B\xEDblia com a minha pr\xF3pria locu\xE7\xE3o interativa, ficando ainda facultativo o uso de outras vozes - locutoras no menu da p\xE1gina.</p>
        <p>Fica ainda autorizada, de livre e espont\xE2nea vontade, para os mesmos fins, a cess\xE3o de direitos da veicula\xE7\xE3o das vozes, n\xE3o recebendo para tanto qualquer tipo de remunera\xE7\xE3o.</p>
      </div>
    </div>
    
    <div class="assinatura">
      <p>_________________________________________</p>
      <p><strong>${data.nome}</strong></p>
      <p>Assinatura (digitalmente aceito)</p>
    </div>
    
    <div class="footer">
      <p>Documento assinado eletronicamente no site do Santu\xE1rio de F\xE1tima</p>
      <p>Protocolo: ${data.id} | ${dataFormatada}</p>
    </div>
  </div>
</body>
</html>`;
}
__name(gerarHTMLTermo, "gerarHTMLTermo");
async function registrarTermoPublico(request, env, ctx) {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders2() });
    }
    if (request.method !== "POST") {
      return jsonResponse({ success: false, error: "M\xE9todo n\xE3o permitido" }, 405);
    }
    const body = await request.json();
    const { nome, cpf, email, responsavelLegal, cpfResponsavel, dataAceite } = body;
    if (!nome || !cpf || !email) {
      return jsonResponse({
        success: false,
        error: "Campos obrigat\xF3rios: nome, cpf, email"
      }, 400);
    }
    const validarCPF = /* @__PURE__ */ __name((cpfNum) => {
      const numeros = cpfNum.replace(/\D/g, "");
      if (numeros.length !== 11) return false;
      let soma = 0;
      let resto;
      for (let i = 1; i <= 9; i++) {
        soma += parseInt(numeros.substring(i - 1, i)) * (11 - i);
      }
      resto = soma * 10 % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(numeros.substring(9, 10))) return false;
      soma = 0;
      for (let i = 1; i <= 10; i++) {
        soma += parseInt(numeros.substring(i - 1, i)) * (12 - i);
      }
      resto = soma * 10 % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(numeros.substring(10, 11))) return false;
      return true;
    }, "validarCPF");
    if (!validarCPF(cpf)) {
      return jsonResponse({ success: false, error: "CPF inv\xE1lido" }, 400);
    }
    const validarEmail = /* @__PURE__ */ __name((emailStr) => {
      const regex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
      return regex.test(emailStr);
    }, "validarEmail");
    if (!validarEmail(email)) {
      return jsonResponse({ success: false, error: "E-mail inv\xE1lido" }, 400);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || request.headers.get("x-real-ip") || "desconhecido";
    const userAgent = request.headers.get("User-Agent") || "";
    const termoData = {
      id,
      nome,
      cpf,
      email,
      responsavelLegal,
      cpfResponsavel,
      ip,
      userAgent,
      dataAceite: now
    };
    if (env.DB) {
      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS termos_voz (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            cpf TEXT NOT NULL,
            email TEXT NOT NULL,
            responsavel_legal TEXT,
            cpf_responsavel TEXT,
            ip TEXT,
            user_agent TEXT,
            data_aceite TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        await env.DB.prepare(`
          INSERT INTO termos_voz (id, nome, cpf, email, responsavel_legal, cpf_responsavel, ip, user_agent, data_aceite)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, nome, cpf, email, responsavelLegal || null, cpfResponsavel || null, ip, userAgent, now).run();
        console.log(`\u2705 Termo de voz REGISTRADO: ${id} - ${nome} (${email})`);
      } catch (dbError) {
        console.error("Erro ao salvar no D1:", dbError);
      }
    }
    const htmlTermo = gerarHTMLTermo(termoData);
    if (env.RESEND_API_KEY) {
      try {
        await sendTermoEmailToFiel(env, termoData, htmlTermo);
        await sendTermoEmailToSecretariat(env, termoData, htmlTermo);
        console.log(`\u2705 Emails enviados para: ${email} e secretaria`);
      } catch (emailError) {
        console.error("Erro ao enviar emails:", emailError);
      }
    }
    return jsonResponse({
      success: true,
      message: "Termo de autoriza\xE7\xE3o registrado com sucesso! Voc\xEA receber\xE1 um email com o PDF do termo assinado.",
      data: { id, nome, email, dataAceite: now }
    });
  } catch (error) {
    console.error("Erro em registrarTermoPublico:", error);
    return jsonResponse({
      success: false,
      error: "Erro interno no servidor: " + error.message
    }, 500);
  }
}
__name(registrarTermoPublico, "registrarTermoPublico");
async function sendTermoEmailToFiel(env, data, htmlTermo) {
  try {
    const dataFormatada = new Date(data.dataAceite).toLocaleDateString("pt-BR");
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Termo de Autoriza\xE7\xE3o de Voz - Santu\xE1rio de F\xE1tima</title>
        <style>
          body { font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .header { background: #0b3b5c; color: white; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .aviso { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .btn-pdf { background: #0b3b5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>\u2705 Termo de Autoriza\xE7\xE3o de Voz</h1>
            <p>Santu\xE1rio Nossa Senhora de F\xE1tima</p>
          </div>
          <div class="content">
            <p>Ol\xE1 <strong>${data.nome}</strong>,</p>
            <p>Recebemos e registramos seu Termo de Autoriza\xE7\xE3o de Uso de \xC1udio.</p>
            
            <div class="aviso">
              <strong>\u{1F3A4} Seu termo foi registrado com sucesso!</strong><br>
              Data do registro: ${dataFormatada}<br>
              Protocolo: ${data.id}
            </div>
            
            <p>Em anexo a este email, voc\xEA encontrar\xE1 o PDF do termo assinado digitalmente para seus registros.</p>
            <p>Agora voc\xEA j\xE1 pode gravar sua voz na B\xEDblia Online! Clique no bot\xE3o "Contribuir" ao lado de qualquer vers\xEDculo e comece a gravar.</p>
            
            <p style="margin-top: 30px; text-align: center;">
              <strong>Que Nossa Senhora de F\xE1tima aben\xE7oe sua contribui\xE7\xE3o!</strong>
            </p>
          </div>
          <div class="footer">
            <p><strong>Santuario Nossa Senhora de Fatima</strong></p>
            <p>Rua Darwin, 651 - Santo Amaro, S\xE3o Paulo - SP</p>
            <p>santuariodefatima.com.br | (11) 5521-0312</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const emailCompleto = `
      <div style="max-width: 600px; margin: 0 auto;">
        ${emailHtml}
        <hr style="margin: 30px 0;">
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h3 style="color: #0b3b5c;">\u{1F4C4} Termo de Autoriza\xE7\xE3o</h3>
          ${htmlTermo}
        </div>
      </div>
    `;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>",
        to: [data.email],
        subject: "\u2705 Termo de Autoriza\xE7\xE3o de Voz - Santu\xE1rio de F\xE1tima",
        html: emailCompleto
      })
    });
    console.log(`\u2705 Email do termo enviado para ${data.email}`);
  } catch (error) {
    console.error("Erro ao enviar email para o fiel:", error);
    throw error;
  }
}
__name(sendTermoEmailToFiel, "sendTermoEmailToFiel");
async function sendTermoEmailToSecretariat(env, data, htmlTermo) {
  try {
    const dataFormatada = new Date(data.dataAceite).toLocaleDateString("pt-BR");
    const horaFormatada = new Date(data.dataAceite).toLocaleTimeString("pt-BR");
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Novo Termo de Voz - Santu\xE1rio de F\xE1tima</title>
        <style>
          body { font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .header { background: #0b3b5c; color: white; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
          .info-table td:first-child { font-weight: bold; width: 40%; background: #f5f5f5; }
          .aviso { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>\u{1F3A4} NOVO TERMO DE VOZ</h1>
            <p>Autoriza\xE7\xE3o de Uso de \xC1udio - B\xEDblia Online</p>
          </div>
          <div class="content">
            <h3>\u{1F4CB} Dados do Fiel</h3>
            <table class="info-table">
              <tr><td>Nome Completo:</td><td><strong>${data.nome}</strong></td></tr>
              <tr><td>CPF:</td><td>${data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</td></tr>
              <tr><td>E-mail:</td><td>${data.email}</td></tr>
              ${data.responsavelLegal ? `<tr><td>Respons\xE1vel Legal:</td><td>${data.responsavelLegal}</td></tr>` : ""}
              ${data.cpfResponsavel ? `<tr><td>CPF do Respons\xE1vel:</td><td>${data.cpfResponsavel.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</td></tr>` : ""}
              <tr><td>Data do Aceite:</td><td>${dataFormatada} \xE0s ${horaFormatada}</td></tr>
              <tr><td>IP de Origem:</td><td>${data.ip || "N\xE3o dispon\xEDvel"}</td></tr>
              <tr><td>Protocolo:</td><td>${data.id}</td></tr>
            </table>
            
            <div class="aviso">
              <strong>\u26A0\uFE0F ATEN\xC7\xC3O SECRETARIA</strong><br>
              Este fiel autorizou o uso da sua voz para personaliza\xE7\xE3o da B\xEDblia Online.
              O termo assinado est\xE1 anexado abaixo para arquivamento.
            </div>
            
            <hr style="margin: 30px 0;">
            
            <h3>\u{1F4C4} Termo de Autoriza\xE7\xE3o</h3>
            ${htmlTermo}
          </div>
          <div class="footer">
            <p><strong>Santuario Nossa Senhora de Fatima</strong></p>
            <p>Rua Darwin, 651 - Santo Amaro, S\xE3o Paulo - SP</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const emailsSecretaria = [
      "santuariodefatima@santuariodefatima.com.br",
      "pascom.santuario@outlook.com.br",
      "pascon@santuariodefatima.com.br"
    ];
    for (const email of emailsSecretaria) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>",
          to: [email],
          subject: `\u{1F3A4} Novo Termo de Voz - ${data.nome}`,
          html: emailHtml,
          reply_to: data.email
        })
      });
      console.log(`\u2705 Email do termo enviado para ${email}`);
    }
  } catch (error) {
    console.error("Erro ao enviar email para a secretaria:", error);
    throw error;
  }
}
__name(sendTermoEmailToSecretariat, "sendTermoEmailToSecretariat");

// src/routes/fiel/voz.js
init_modules_watch_stub();
async function contribuirVoz(request, env) {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== "POST") {
      return jsonResponse({ success: false, error: "M\xE9todo n\xE3o permitido" }, 405);
    }
    const body = await request.json();
    const { audio, mimeType, livro, capitulo, versiculo, texto, apelido } = body;
    if (!audio || !livro || !capitulo || !versiculo || !texto) {
      return jsonResponse({
        success: false,
        error: "Campos obrigat\xF3rios: audio, livro, capitulo, versiculo, texto"
      }, 400);
    }
    let audioBuffer;
    try {
      const binaryString = atob(audio);
      const audioBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        audioBytes[i] = binaryString.charCodeAt(i);
      }
      audioBuffer = audioBytes.buffer;
    } catch (e) {
      console.error("Erro ao decodificar base64:", e);
      return jsonResponse({
        success: false,
        error: "Erro ao processar arquivo de \xE1udio"
      }, 400);
    }
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const dataAtual = (/* @__PURE__ */ new Date()).toISOString();
    const nomeContribuinte = apelido?.trim() || "An\xF4nimo";
    const extension = mimeType?.split("/")[1] || "webm";
    const r2Key = `contribuicoes/${livro}/${capitulo}/${versiculo}/${id}.${extension}`;
    if (!env.R2_AUDIO) {
      console.error("\u274C R2_AUDIO n\xE3o configurado");
      return jsonResponse({
        success: false,
        error: "Servidor de \xE1udio n\xE3o configurado"
      }, 500);
    }
    try {
      await env.R2_AUDIO.put(r2Key, audioBuffer, {
        httpMetadata: {
          contentType: mimeType || "audio/webm",
          contentDisposition: `inline; filename="contribuicao_${livro}_${capitulo}_${versiculo}_${id}.${extension}"`
        },
        customMetadata: {
          livro,
          capitulo: capitulo.toString(),
          versiculo: versiculo.toString(),
          texto: texto.substring(0, 500),
          contribuinte: nomeContribuinte,
          data: dataAtual,
          id
        }
      });
      console.log(`\u{1F4BE} Grava\xE7\xE3o salva no R2: ${r2Key} (${Math.round(audioBuffer.byteLength / 1024)} KB)`);
    } catch (r2Error) {
      console.error("Erro ao salvar no R2:", r2Error);
      return jsonResponse({
        success: false,
        error: "Erro ao salvar grava\xE7\xE3o no servidor"
      }, 500);
    }
    return jsonResponse({
      success: true,
      message: "Grava\xE7\xE3o enviada com sucesso! Obrigado por contribuir.",
      id,
      data: dataAtual
    });
  } catch (error) {
    console.error("Erro em contribuirVoz:", error);
    return jsonResponse({
      success: false,
      error: "Erro interno no servidor: " + error.message
    }, 500);
  }
}
__name(contribuirVoz, "contribuirVoz");

// src/routes/fiel/versiculos.js
init_modules_watch_stub();
async function salvarVersiculo(request, env) {
  try {
    const body = await request.json();
    const { email, versiculo } = body;
    if (!email) return errorResponse("E-mail \xE9 obrigat\xF3rio", 400);
    if (!versiculo) return errorResponse("Vers\xEDculo \xE9 obrigat\xF3rio", 400);
    const db = env.DB;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const row = await db.prepare("SELECT versiculos FROM fiel_dados WHERE email = ?").bind(email).first();
    let lista = [];
    if (row?.versiculos) {
      try {
        lista = JSON.parse(row.versiculos);
      } catch {
        lista = [];
      }
    }
    const jaExiste = lista.some(
      (v) => v.id === versiculo.id || v.referencia === versiculo.referencia
    );
    if (!jaExiste) {
      lista.push({ ...versiculo, salvoEm: now });
    }
    if (row) {
      await db.prepare("UPDATE fiel_dados SET versiculos = ?, updated_at = ? WHERE email = ?").bind(JSON.stringify(lista), now, email).run();
    } else {
      await db.prepare(`
          INSERT INTO fiel_dados
            (email, musicas, versiculos, oracoes, fotos, termo_aceito, created_at, updated_at)
          VALUES (?, '[]', ?, '[]', '[]', 0, ?, ?)
        `).bind(email, JSON.stringify(lista), now, now).run();
    }
    return jsonResponse({ success: true, versiculos: lista });
  } catch (error) {
    console.error("Erro ao salvar vers\xEDculo:", error);
    return errorResponse("Erro ao salvar vers\xEDculo", 500);
  }
}
__name(salvarVersiculo, "salvarVersiculo");
async function buscarVersiculos(request, env) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    if (!email) return errorResponse("E-mail \xE9 obrigat\xF3rio", 400);
    const row = await env.DB.prepare("SELECT versiculos FROM fiel_dados WHERE email = ?").bind(email).first();
    let lista = [];
    if (row?.versiculos) {
      try {
        lista = JSON.parse(row.versiculos);
      } catch {
        lista = [];
      }
    }
    return jsonResponse({ success: true, versiculos: lista });
  } catch (error) {
    console.error("Erro ao buscar vers\xEDculos:", error);
    return errorResponse("Erro ao buscar vers\xEDculos", 500);
  }
}
__name(buscarVersiculos, "buscarVersiculos");

// src/routes/fiel/musicas.js
init_modules_watch_stub();
async function buscarMusicas(request, env) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    if (!query) {
      return jsonResponse({ success: false, error: "Par\xE2metro q \xE9 obrigat\xF3rio" }, 400);
    }
    const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      return jsonResponse({ success: false, error: "YouTube API n\xE3o configurada" }, 500);
    }
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=15&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(youtubeUrl);
    const data = await response.json();
    if (data.error) {
      console.error("YouTube API Error:", data.error);
      return jsonResponse({ success: false, error: data.error.message }, 500);
    }
    const tracks = (data.items || []).map((item) => ({
      id: item.id.videoId,
      nome: item.snippet.title,
      artista: item.snippet.channelTitle,
      imagemUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      previewUrl: null
    }));
    return jsonResponse({ success: true, tracks });
  } catch (error) {
    console.error("Erro em buscarMusicas:", error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}
__name(buscarMusicas, "buscarMusicas");

// src/routes/fiel/fiel-utils.js
init_modules_watch_stub();
async function uploadImagemFiel(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const email = formData.get("email");
    const tipo = formData.get("tipo");
    if (!file || !email || !tipo) {
      return jsonResponse({ success: false, error: "Par\xE2metros incompletos: file, email, tipo s\xE3o obrigat\xF3rios" }, 400);
    }
    if (file.size > 5 * 1024 * 1024) {
      return jsonResponse({ success: false, error: "Arquivo muito grande (m\xE1x 5MB)" }, 400);
    }
    const emailLower = email.toLowerCase();
    const timestamp = Date.now();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const key = `${emailLower}/${tipo}/${timestamp}.${extension}`;
    await env.FIEL.put(key, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
    const url = `https://fiel.santuariodefatima.com/${key}`;
    return jsonResponse({ success: true, url });
  } catch (error) {
    console.error("Erro em uploadImagemFiel:", error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}
__name(uploadImagemFiel, "uploadImagemFiel");
async function alterarSenhaFiel(request, env) {
  try {
    const { email, currentPassword, newPassword } = await request.json();
    if (!email || !currentPassword || !newPassword) {
      return jsonResponse({ success: false, error: "Par\xE2metros incompletos" }, 400);
    }
    if (newPassword.length < 6) {
      return jsonResponse({ success: false, error: "Nova senha deve ter pelo menos 6 caracteres" }, 400);
    }
    const user = await env.DB.prepare(
      "SELECT id, senha_hash FROM users WHERE email = ? AND role = ? LIMIT 1"
    ).bind(email, "fiel").first();
    if (!user) {
      return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" }, 404);
    }
    const bcrypt = await Promise.resolve().then(() => __toESM(require_bcrypt(), 1));
    const senhaValida = await bcrypt.compare(currentPassword, user.senha_hash);
    if (!senhaValida) {
      return jsonResponse({ success: false, error: "Senha atual incorreta" }, 401);
    }
    const novaSenhaHash = await bcrypt.hash(newPassword, 10);
    await env.DB.prepare(
      "UPDATE users SET senha_hash = ?, updated_at = ? WHERE id = ?"
    ).bind(novaSenhaHash, (/* @__PURE__ */ new Date()).toISOString(), user.id).run();
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Erro em alterarSenhaFiel:", error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}
__name(alterarSenhaFiel, "alterarSenhaFiel");

// src/routes/public/biblia.js
init_modules_watch_stub();
var BIBLIA_BASE_URL = "https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/";
var BIBLIA_ARQUIVOS = {
  "gn": "01_genesis.json",
  "ex": "02_exodo.json",
  "lv": "03_levitico.json",
  "nm": "04_numeros.json",
  "dt": "05_deuteronomio.json",
  "js": "06_josue.json",
  "jz": "07_juizes.json",
  "rt": "08_rute.json",
  "1sm": "09_1_samuel.json",
  "2sm": "10_2_samuel.json",
  "1rs": "11_1_reis.json",
  "2rs": "12_2_reis.json",
  "1cr": "13_1_cronicas.json",
  "2cr": "14_2_cronicas.json",
  "ed": "15_esdras.json",
  "ne": "16_neemias.json",
  "et": "17_ester.json",
  "j\xF3": "18_jo.json",
  "sl": "19_salmos.json",
  "pv": "20_proverbios.json",
  "ec": "21_eclesiastes.json",
  "ct": "22_canticos.json",
  "is": "23_isaias.json",
  "jr": "24_jeremias.json",
  "lm": "25_lamentacoes.json",
  "ez": "26_ezequiel.json",
  "dn": "27_daniel.json",
  "os": "28_oseias.json",
  "jl": "29_joel.json",
  "am": "30_amos.json",
  "ob": "31_abdias.json",
  "jn": "32_jonas.json",
  "mq": "33_miqueias.json",
  "na": "34_naum.json",
  "hc": "35_habacuque.json",
  "sf": "36_sofonias.json",
  "ag": "37_ageu.json",
  "zc": "38_zacarias.json",
  "ml": "39_malaquias.json",
  "mt": "40_mateus.json",
  "mc": "41_marcos.json",
  "lc": "42_lucas.json",
  "jo": "43_joao.json",
  "at": "44_atos.json",
  "rm": "45_romanos.json",
  "1co": "46_1_corintios.json",
  "2co": "47_2_corintios.json",
  "gl": "48_galatas.json",
  "ef": "49_efesios.json",
  "fp": "50_filipenses.json",
  "cl": "51_colossenses.json",
  "1ts": "52_1_tessalonicenses.json",
  "2ts": "53_2_tessalonicenses.json",
  "1tm": "54_1_timoteo.json",
  "2tm": "55_2_timoteo.json",
  "tt": "56_tito.json",
  "fm": "57_filemon.json",
  "hb": "58_hebreus.json",
  "tg": "59_tiago.json",
  "1pe": "60_1_pedro.json",
  "2pe": "61_2_pedro.json",
  "1jo": "62_1_joao.json",
  "2jo": "63_2_joao.json",
  "3jo": "64_3_joao.json",
  "jd": "65_judas.json",
  "ap": "66_apocalipse.json"
};
async function handleBiblia(request, env) {
  const url = new URL(request.url);
  const abbrev = url.searchParams.get("livro")?.toLowerCase();
  const cap = parseInt(url.searchParams.get("capitulo") || "1");
  if (!abbrev) return jsonResponse2({ success: false, error: "Parametro livro obrigatorio" }, 400);
  const arquivo = BIBLIA_ARQUIVOS[abbrev];
  if (!arquivo) return jsonResponse2({ success: false, error: `Livro nao encontrado: ${abbrev}` }, 404);
  try {
    const cacheKey = `biblia:${abbrev}:${cap}`;
    if (env.KV_FILES) {
      const cached = await env.KV_FILES.get(cacheKey, "json");
      if (cached) return jsonResponse2({ ...cached, cached: true });
    }
    const res = await fetch(`${BIBLIA_BASE_URL}${arquivo}`, { headers: { "User-Agent": "SantuarioFatima/1.0" } });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const livro = await res.json();
    const chapters = livro.chapters || [];
    const capIdx = cap - 1;
    if (capIdx < 0 || capIdx >= chapters.length) return jsonResponse2({ success: false, error: `Capitulo ${cap} inexistente. Total: ${chapters.length}` }, 404);
    const verses = chapters[capIdx].map((t, i) => ({ number: i + 1, text: t }));
    const result = { success: true, livro: livro.name || abbrev, abbrev, capitulo: cap, totalCapitulos: chapters.length, verses };
    if (env.KV_FILES) await env.KV_FILES.put(cacheKey, JSON.stringify(result), { expirationTtl: 604800 });
    return jsonResponse2(result);
  } catch (e) {
    console.error("Erro biblia:", e);
    return jsonResponse2({ success: false, error: "Erro ao carregar capitulo. Tente novamente." }, 500);
  }
}
__name(handleBiblia, "handleBiblia");

// src/routes/auth/fiel_auth.js
init_modules_watch_stub();

// src/utils/totp.js
init_modules_watch_stub();
function base32Decode(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const output = [];
  for (const char of clean) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = value << 5 | idx;
    bits += 5;
    if (bits >= 8) {
      output.push(value >>> bits - 8 & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}
__name(base32Decode, "base32Decode");
async function generateTOTP(secret, timestamp = Date.now()) {
  try {
    const timeStep = Math.floor(timestamp / 1e3 / 30);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(4, timeStep >>> 0);
    const keyBytes = base32Decode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, buffer);
    const hmac = new Uint8Array(signature);
    const offset = hmac[hmac.length - 1] & 15;
    const binary = (hmac[offset] & 127) << 24 | (hmac[offset + 1] & 255) << 16 | (hmac[offset + 2] & 255) << 8 | hmac[offset + 3] & 255;
    const otp = binary % 1e6;
    return otp.toString().padStart(6, "0");
  } catch (err) {
    console.error("Erro ao gerar TOTP:", err);
    return null;
  }
}
__name(generateTOTP, "generateTOTP");
async function validateTOTP(secret, codigo) {
  try {
    if (!secret || !codigo) return false;
    if (!/^\d{6}$/.test(codigo)) return false;
    const now = Date.now();
    const windows = [-1, 0, 1];
    for (const delta of windows) {
      const expected = await generateTOTP(secret, now + delta * 3e4);
      if (expected === codigo) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error("Erro ao validar TOTP:", err);
    return false;
  }
}
__name(validateTOTP, "validateTOTP");

// src/routes/auth/fiel_auth.js
async function createSession(env, user) {
  const rawToken = crypto.randomUUID();
  const tokenHash = await hashToken(rawToken);
  const expiresAt = Date.now() + 1e3 * 60 * 60 * 24 * 7;
  await env.KV_SESSION.put(`sess:${tokenHash}`, JSON.stringify({
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role
    },
    expires: expiresAt
  }), { expirationTtl: 60 * 60 * 24 * 7 });
  return { token: rawToken, expiresAt };
}
__name(createSession, "createSession");
async function verificarSenha2(senhaDigitada, senhaArmazenada) {
  if (!senhaArmazenada) return false;
  const hash = await sha256(senhaDigitada);
  return hash === senhaArmazenada;
}
__name(verificarSenha2, "verificarSenha");
function generatePIN() {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
__name(generatePIN, "generatePIN");
function generateBackupCodes() {
  return Array.from(
    { length: 8 },
    () => crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()
  );
}
__name(generateBackupCodes, "generateBackupCodes");
function generateBase32Secret(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
__name(generateBase32Secret, "generateBase32Secret");
async function sendEmail(env, to, subject, html) {
  if (!env.RESEND_API_KEY) {
    console.warn("\u26A0\uFE0F RESEND_API_KEY n\xE3o configurada");
    return;
  }
  if (!to) {
    console.error("\u274C sendEmail: destinat\xE1rio vazio");
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    console.error(`\u274C sendEmail: formato inv\xE1lido \u2014 "${to}"`);
    return;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Santu\xE1rio de F\xE1tima <noreply@mail.santuariodefatima.com.br>",
        to: [to],
        subject,
        html
      })
    });
    const result = await response.json();
    if (response.ok) {
      console.log(`\u2705 Email enviado para: ${to}`);
    } else {
      console.error(`\u274C Resend erro: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    console.error("\u274C sendEmail exception:", e.message);
  }
}
__name(sendEmail, "sendEmail");
function getFrontendUrl(env) {
  return (env.FRONTEND_URL || "https://santuariodefatima.com.br").replace(/\/$/, "");
}
__name(getFrontendUrl, "getFrontendUrl");
function validarCelular(celular) {
  const digits = celular?.replace(/\D/g, "") || "";
  return digits.length >= 10 && digits.length <= 11;
}
__name(validarCelular, "validarCelular");
function validarSenha(senha) {
  const checks = {
    length: senha.length >= 8,
    uppercase: /[A-Z]/.test(senha),
    lowercase: /[a-z]/.test(senha),
    number: /[0-9]/.test(senha),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(senha)
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { isValid: score >= 4, checks, score };
}
__name(validarSenha, "validarSenha");
async function fielLoginRoute(request, env) {
  if (!firewall(request)) return new Response("Blocked", { status: 403 });
  try {
    const body = await request.json();
    const { email, senha } = body;
    if (!email || !senha) {
      return jsonResponse({ success: false, error: "Preencha todos os campos" });
    }
    const emailNorm = email.toLowerCase().trim();
    const rateLimitResponse = await applyRateLimit(request, env, emailNorm);
    if (rateLimitResponse) return rateLimitResponse;
    const user = await env.DB.prepare(
      `SELECT id, nome, email, senha_hash, role, twofa_enabled, twofa_secret,
              backup_codes, celular, failed_attempts, locked_until
       FROM users WHERE LOWER(email) = ?`
    ).bind(emailNorm).first();
    if (!user) return jsonResponse({ success: false, error: "E-mail ou senha inv\xE1lidos" });
    if (user.locked_until && user.locked_until > Date.now()) {
      const waitMinutes = Math.ceil((user.locked_until - Date.now()) / 6e4);
      return jsonResponse({ success: false, error: `Conta bloqueada. Tente novamente em ${waitMinutes} minutos.` });
    }
    const senhaOk = await verificarSenha2(senha, user.senha_hash);
    if (!senhaOk) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      const lockUntil = newAttempts >= 5 ? Date.now() + 15 * 60 * 1e3 : 0;
      await env.DB.prepare(
        `UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?`
      ).bind(newAttempts, lockUntil, user.id).run();
      return jsonResponse({ success: false, error: "E-mail ou senha inv\xE1lidos" });
    }
    await env.DB.prepare(
      `UPDATE users SET failed_attempts = 0, locked_until = 0 WHERE id = ?`
    ).bind(user.id).run();
    const pin = generatePIN();
    const pinHash = await sha256(pin);
    const pinExpiry = Date.now() + 10 * 60 * 1e3;
    await env.DB.prepare(
      `UPDATE users SET login_pin = ?, login_pin_expires = ?, last_login_at = ? WHERE id = ?`
    ).bind(pinHash, pinExpiry, Date.now(), user.id).run();
    const nome = user.nome || "Usu\xE1rio";
    await sendEmail(env, user.email, "Seu c\xF3digo de acesso - Santu\xE1rio de F\xE1tima", `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u{1F510} C\xF3digo de Acesso</h2>
        </div>
        <div style="padding:24px;">
          <p>Ol\xE1 <strong>${nome}</strong>,</p>
          <p>Seu c\xF3digo de verifica\xE7\xE3o \xE9:</p>
          <p style="font-size:32px;font-weight:bold;text-align:center;letter-spacing:8px;">${pin}</p>
          <p>V\xE1lido por <strong>10 minutos</strong>.</p>
        </div>
      </div>
    `);
    return jsonResponse({
      success: true,
      nextStep: "pin",
      userId: user.id,
      email: user.email,
      nome,
      role: user.role,
      isAdmin: user.role === "admin",
      has2FA: user.twofa_enabled === 1
    });
  } catch (err) {
    console.error("\u274C fielLoginRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielLoginRoute, "fielLoginRoute");
async function fielVerificarRoute(request, env) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return jsonResponse({ success: false, error: "Token n\xE3o fornecido" }, 401);
    const hash = await hashToken(token);
    const sessionData = await env.KV_SESSION.get(`sess:${hash}`, "json");
    if (!sessionData || sessionData.expires < Date.now()) {
      return jsonResponse({ success: false, error: "Token inv\xE1lido ou expirado" }, 401);
    }
    return jsonResponse({ success: true, user: sessionData.user });
  } catch (err) {
    console.error("\u274C fielVerificarRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielVerificarRoute, "fielVerificarRoute");
async function fielVerifyPinRoute(request, env) {
  try {
    const body = await request.json();
    const { userId, pin, celular } = body;
    if (!userId || !pin) return jsonResponse({ success: false, error: "Dados incompletos" });
    const rateLimitResponse = await applyRateLimit(request, env, String(userId));
    if (rateLimitResponse) return rateLimitResponse;
    const user = await env.DB.prepare(
      `SELECT id, nome, email, login_pin, login_pin_expires, twofa_enabled, twofa_secret, role,
              failed_2fa_attempts, twofa_locked_until
       FROM users WHERE id = ?`
    ).bind(userId).first();
    if (!user) return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    if (user.twofa_locked_until && user.twofa_locked_until > Date.now()) {
      const wait = Math.ceil((user.twofa_locked_until - Date.now()) / 6e4);
      return jsonResponse({ success: false, error: `Muitas tentativas. Tente novamente em ${wait} minutos.` });
    }
    if (!user.login_pin) return jsonResponse({ success: false, error: "Nenhum PIN ativo. Solicite um novo." });
    if (Date.now() > user.login_pin_expires) return jsonResponse({ success: false, error: "PIN expirado. Solicite um novo." });
    const pinHash = await sha256(pin);
    if (user.login_pin !== pinHash) {
      const attempts = (user.failed_2fa_attempts || 0) + 1;
      const lockTime = attempts >= 8 ? Date.now() + 15 * 60 * 1e3 : attempts >= 5 ? Date.now() + 5 * 60 * 1e3 : 0;
      await env.DB.prepare(
        `UPDATE users SET failed_2fa_attempts = ?, twofa_locked_until = ? WHERE id = ?`
      ).bind(attempts, lockTime, user.id).run();
      return jsonResponse({ success: false, error: "PIN inv\xE1lido" });
    }
    await env.DB.prepare(
      `UPDATE users SET failed_2fa_attempts = 0, twofa_locked_until = 0,
                        login_pin = NULL, login_pin_expires = NULL WHERE id = ?`
    ).bind(user.id).run();
    if (celular && validarCelular(celular)) {
      await env.DB.prepare(
        `UPDATE users SET celular = ? WHERE id = ? AND (celular IS NULL OR celular = '')`
      ).bind(celular.replace(/\D/g, ""), user.id).run();
    }
    if (user.twofa_secret && user.twofa_enabled === 1) {
      return jsonResponse({
        success: true,
        nextStep: "2fa-verify",
        userId: user.id,
        role: user.role,
        isAdmin: user.role === "admin"
      });
    }
    const secretKey = generateBase32Secret();
    const issuer = "SantuarioFatima";
    const label = `${issuer}:${user.email}`;
    const otpauth = `otpauth://totp/${encodeURIComponent(label)}?secret=${secretKey}&issuer=${issuer}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await Promise.all(backupCodes.map((c) => sha256(c)));
    await env.DB.prepare(
      `UPDATE users SET twofa_secret = ?, twofa_enabled = 0, backup_codes = ? WHERE id = ?`
    ).bind(secretKey, JSON.stringify(hashedBackupCodes), user.id).run();
    return jsonResponse({
      success: true,
      nextStep: "2fa-setup",
      userId: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "admin",
      qrCodeUrl,
      secretKey,
      backupCodes
    });
  } catch (err) {
    console.error("\u274C fielVerifyPinRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielVerifyPinRoute, "fielVerifyPinRoute");
async function fielReenviarPinRoute(request, env) {
  try {
    const body = await request.json();
    const { userId } = body;
    const user = await env.DB.prepare(
      `SELECT id, nome, email FROM users WHERE id = ?`
    ).bind(userId).first();
    if (!user) return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    const pin = generatePIN();
    const pinHash = await sha256(pin);
    const expiry = Date.now() + 10 * 60 * 1e3;
    await env.DB.prepare(
      `UPDATE users SET login_pin = ?, login_pin_expires = ? WHERE id = ?`
    ).bind(pinHash, expiry, userId).run();
    await sendEmail(env, user.email, "Novo c\xF3digo de acesso - Santu\xE1rio de F\xE1tima", `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u{1F504} Novo C\xF3digo de Acesso</h2>
        </div>
        <div style="padding:24px;">
          <p>Ol\xE1 <strong>${user.nome}</strong>,</p>
          <p>Seu novo c\xF3digo \xE9:</p>
          <p style="font-size:32px;font-weight:bold;text-align:center;letter-spacing:8px;">${pin}</p>
          <p>V\xE1lido por <strong>10 minutos</strong>.</p>
        </div>
      </div>
    `);
    return jsonResponse({ success: true, message: "Novo PIN enviado!" });
  } catch (err) {
    console.error("\u274C fielReenviarPinRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielReenviarPinRoute, "fielReenviarPinRoute");
async function fielVerify2faRoute(request, env) {
  try {
    const body = await request.json();
    const { userId, codigo2FA } = body;
    if (!codigo2FA || !/^\d{6}$/.test(codigo2FA)) {
      return jsonResponse({ success: false, error: "C\xF3digo de 6 d\xEDgitos obrigat\xF3rio" });
    }
    const rateLimitResponse = await applyRateLimit(request, env, String(userId));
    if (rateLimitResponse) return rateLimitResponse;
    const user = await env.DB.prepare(
      `SELECT id, nome, email, twofa_secret, twofa_enabled, role,
              failed_2fa_attempts, twofa_locked_until
       FROM users WHERE id = ?`
    ).bind(userId).first();
    if (!user) return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    if (!user.twofa_secret) return jsonResponse({ success: false, error: "2FA n\xE3o configurado" });
    if (user.twofa_locked_until && user.twofa_locked_until > Date.now()) {
      const wait = Math.ceil((user.twofa_locked_until - Date.now()) / 6e4);
      return jsonResponse({ success: false, error: `Muitas tentativas. Tente novamente em ${wait} minutos.` });
    }
    const valid = await validateTOTP(user.twofa_secret, codigo2FA);
    if (!valid) {
      const attempts = (user.failed_2fa_attempts || 0) + 1;
      const lockTime = attempts >= 8 ? Date.now() + 15 * 60 * 1e3 : attempts >= 5 ? Date.now() + 5 * 60 * 1e3 : 0;
      await env.DB.prepare(
        `UPDATE users SET failed_2fa_attempts = ?, twofa_locked_until = ? WHERE id = ?`
      ).bind(attempts, lockTime, user.id).run();
      return jsonResponse({ success: false, error: "C\xF3digo 2FA inv\xE1lido" });
    }
    await env.DB.prepare(
      `UPDATE users SET failed_2fa_attempts = 0, twofa_locked_until = 0,
                        twofa_enabled = 1 WHERE id = ?`
    ).bind(user.id).run();
    const role = user.role || "fiel";
    const { token, expiresAt } = await createSession(env, user);
    return jsonResponse({
      success: true,
      token,
      expiresAt,
      user: { id: user.id, nome: user.nome, email: user.email, role },
      redirectTo: role === "admin" ? "/paineladmin" : "/paineldofiel",
      isAdmin: role === "admin"
    });
  } catch (err) {
    console.error("\u274C fielVerify2faRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielVerify2faRoute, "fielVerify2faRoute");
async function fielEsqueciSenhaRoute(request, env) {
  try {
    const body = await request.json();
    const { email } = body;
    if (!email) return jsonResponse({ success: false, error: "E-mail obrigat\xF3rio" });
    const emailNorm = email.toLowerCase().trim();
    const rateLimitResponse = await applyRateLimit(request, env, emailNorm);
    if (rateLimitResponse) return rateLimitResponse;
    const user = await env.DB.prepare(
      "SELECT id, nome, email FROM users WHERE LOWER(email) = ?"
    ).bind(emailNorm).first();
    if (!user) {
      return jsonResponse({ success: true, message: "Se o e-mail estiver cadastrado, voc\xEA receber\xE1 o link." });
    }
    const rawToken = crypto.randomUUID();
    const tokenHash = await sha256(rawToken);
    const expiresAt = Date.now() + 60 * 60 * 1e3;
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    await env.DB.prepare("DELETE FROM reset_tokens WHERE user_id = ?").bind(user.id).run();
    await env.DB.prepare(
      "INSERT INTO reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
    ).bind(user.id, tokenHash, expiresAt).run();
    const frontendUrl = getFrontendUrl(env);
    const link = `${frontendUrl}/sanctum?reset_token=${rawToken}&userId=${user.id}`;
    console.log(`\u{1F4E7} Enviando reset senha para: ${user.email}`);
    console.log(`\u{1F517} Link: ${link}`);
    await sendEmail(env, user.email, "\u{1F511} Recupera\xE7\xE3o de Senha - Santu\xE1rio de F\xE1tima", `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u{1F511} Redefini\xE7\xE3o de Senha</h2>
        </div>
        <div style="padding:24px;">
          <p>Ol\xE1 <strong>${user.nome}</strong>,</p>
          <p>Clique no bot\xE3o abaixo para criar uma nova senha:</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${link}"
               style="background:#0d2a5c;color:white;padding:14px 28px;
                      text-decoration:none;border-radius:8px;font-size:16px;">
              \u{1F511} Redefinir minha senha
            </a>
          </div>
          <p>\u23F1\uFE0F V\xE1lido por <strong>1 hora</strong>.</p>
          <p style="color:#999;font-size:12px;word-break:break-all;">Link direto: ${link}</p>
        </div>
      </div>
    `);
    return jsonResponse({ success: true, message: "Link enviado para seu e-mail!" });
  } catch (err) {
    console.error("\u274C fielEsqueciSenhaRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielEsqueciSenhaRoute, "fielEsqueciSenhaRoute");
async function fielConfirmarResetSenhaRoute(request, env) {
  try {
    const body = await request.json();
    const { token, novaSenha, userId } = body;
    if (!token || !novaSenha || !userId) {
      return jsonResponse({ success: false, error: "Dados incompletos" });
    }
    const rateLimitResponse = await applyRateLimit(request, env, String(userId));
    if (rateLimitResponse) return rateLimitResponse;
    const tokenHash = await sha256(token);
    const record = await env.DB.prepare(
      "SELECT * FROM reset_tokens WHERE token = ? AND used = 0"
    ).bind(tokenHash).first();
    if (!record) return jsonResponse({ success: false, error: "Token inv\xE1lido ou j\xE1 utilizado" });
    if (String(record.user_id) !== String(userId)) return jsonResponse({ success: false, error: "Token inv\xE1lido" });
    if (Date.now() > record.expires_at) {
      await env.DB.prepare("DELETE FROM reset_tokens WHERE token = ?").bind(tokenHash).run();
      return jsonResponse({ success: false, error: "Token expirado" });
    }
    const senhaValidation = validarSenha(novaSenha);
    if (!senhaValidation.isValid) {
      return jsonResponse({ success: false, error: "Senha fraca. Use mai\xFAsculas, min\xFAsculas, n\xFAmeros e caracteres especiais." });
    }
    const senha_hash = await sha256(novaSenha);
    await env.DB.prepare(
      `UPDATE users SET senha_hash = ?, updated_at = ? WHERE id = ?`
    ).bind(senha_hash, Date.now(), userId).run();
    await env.DB.prepare("UPDATE reset_tokens SET used = 1 WHERE token = ?").bind(tokenHash).run();
    await env.DB.prepare("DELETE FROM reset_tokens WHERE token = ?").bind(tokenHash).run();
    return jsonResponse({ success: true, message: "Senha redefinida com sucesso!" });
  } catch (err) {
    console.error("\u274C fielConfirmarResetSenhaRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielConfirmarResetSenhaRoute, "fielConfirmarResetSenhaRoute");
async function fielReset2faBackupRoute(request, env) {
  try {
    const body = await request.json();
    const { email, backupCode } = body;
    const emailNorm = email.toLowerCase().trim();
    const user = await env.DB.prepare(
      "SELECT id, backup_codes FROM users WHERE LOWER(email) = ?"
    ).bind(emailNorm).first();
    if (!user) return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    const hashed = await sha256(backupCode.toUpperCase());
    const stored = JSON.parse(user.backup_codes || "[]");
    if (!stored.includes(hashed)) {
      return jsonResponse({ success: false, error: "C\xF3digo de backup inv\xE1lido" });
    }
    const updated = stored.filter((c) => c !== hashed);
    await env.DB.prepare(
      `UPDATE users SET twofa_enabled = 0, twofa_secret = NULL, backup_codes = ? WHERE id = ?`
    ).bind(JSON.stringify(updated), user.id).run();
    return jsonResponse({ success: true, message: "2FA removido! Configure novamente no pr\xF3ximo login." });
  } catch (err) {
    console.error("\u274C fielReset2faBackupRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielReset2faBackupRoute, "fielReset2faBackupRoute");
async function fielSolicitarReset2faRoute(request, env) {
  try {
    const body = await request.json();
    const { email } = body;
    if (!email) return jsonResponse({ success: false, error: "E-mail obrigat\xF3rio" });
    const emailNorm = email.toLowerCase().trim();
    const rateLimitResponse = await applyRateLimit(request, env, emailNorm);
    if (rateLimitResponse) return rateLimitResponse;
    const user = await env.DB.prepare(
      "SELECT id, nome, email FROM users WHERE LOWER(email) = ?"
    ).bind(emailNorm).first();
    if (!user) return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    const rawToken = crypto.randomUUID();
    const tokenHash = await sha256(rawToken);
    const expiresAt = Date.now() + 10 * 60 * 1e3;
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS two_factor_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    await env.DB.prepare("DELETE FROM two_factor_reset_tokens WHERE user_id = ?").bind(user.id).run();
    await env.DB.prepare(
      "INSERT INTO two_factor_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
    ).bind(user.id, tokenHash, expiresAt).run();
    const frontendUrl = getFrontendUrl(env);
    const link = `${frontendUrl}/sanctum?reset2fa=${rawToken}`;
    console.log(`\u{1F4E7} Enviando reset 2FA para: ${user.email}`);
    console.log(`\u{1F517} Link: ${link}`);
    await sendEmail(env, user.email, "\u{1F510} Recupera\xE7\xE3o de 2FA - Santu\xE1rio de F\xE1tima", `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u{1F510} Recupera\xE7\xE3o de 2FA</h2>
        </div>
        <div style="padding:24px;">
          <p>Ol\xE1 <strong>${user.nome}</strong>,</p>
          <p>Clique abaixo para remover o 2FA da sua conta:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${link}"
               style="background:#7c3aed;color:white;padding:14px 28px;
                      text-decoration:none;border-radius:8px;font-size:16px;">
              \u{1F513} Remover 2FA
            </a>
          </div>
          <p>\u23F1\uFE0F V\xE1lido por <strong>10 minutos</strong>.</p>
          <p style="color:#ef4444;font-size:13px;">\u26A0\uFE0F Se n\xE3o foi voc\xEA, troque sua senha imediatamente!</p>
          <p style="color:#999;font-size:12px;word-break:break-all;">Link direto: ${link}</p>
        </div>
      </div>
    `);
    return jsonResponse({ success: true, message: "Link enviado para seu e-mail!" });
  } catch (err) {
    console.error("\u274C fielSolicitarReset2faRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielSolicitarReset2faRoute, "fielSolicitarReset2faRoute");
async function fielConfirmarReset2faRoute(request, env) {
  try {
    const body = await request.json();
    const { token } = body;
    if (!token) return jsonResponse({ success: false, error: "Token obrigat\xF3rio" });
    const rateLimitResponse = await applyRateLimit(request, env, token.slice(0, 16));
    if (rateLimitResponse) return rateLimitResponse;
    const tokenHash = await sha256(token);
    const record = await env.DB.prepare(
      "SELECT * FROM two_factor_reset_tokens WHERE token = ?"
    ).bind(tokenHash).first();
    if (!record) return jsonResponse({ success: false, error: "Token inv\xE1lido" });
    if (Date.now() > record.expires_at) {
      await env.DB.prepare("DELETE FROM two_factor_reset_tokens WHERE token = ?").bind(tokenHash).run();
      return jsonResponse({ success: false, error: "Token expirado" });
    }
    await env.DB.prepare(
      `UPDATE users SET twofa_enabled = 0, twofa_secret = NULL, backup_codes = NULL WHERE id = ?`
    ).bind(record.user_id).run();
    await env.DB.prepare("DELETE FROM two_factor_reset_tokens WHERE token = ?").bind(tokenHash).run();
    return jsonResponse({ success: true, message: "2FA removido! Configure novamente no pr\xF3ximo login." });
  } catch (err) {
    console.error("\u274C fielConfirmarReset2faRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielConfirmarReset2faRoute, "fielConfirmarReset2faRoute");

// src/routes/r2.js
init_modules_watch_stub();
var MIME_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml"
};
function sanitizeFileName(name = "file") {
  return name.toLowerCase().replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
}
__name(sanitizeFileName, "sanitizeFileName");
async function handleUploadImagem(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get("imagem");
    const tipo = formData.get("tipo") || "geral";
    const subpasta = formData.get("subpasta") || "";
    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: "Nenhuma imagem enviada"
      }), { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({
        success: false,
        error: "Arquivo muito grande (m\xE1x 10MB)"
      }), { status: 400 });
    }
    const extensao = file.name?.split(".").pop()?.toLowerCase() || "jpg";
    const contentType = file.type || MIME_TYPES[extensao] || "image/jpeg";
    const safeName = sanitizeFileName(file.name);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const nomeArquivo = `${timestamp}-${randomId}-${safeName}`;
    let path = tipo;
    if (subpasta) path += `/${sanitizeFileName(subpasta)}`;
    if (tipo === "momentos") {
      path += `/${(/* @__PURE__ */ new Date()).getFullYear()}`;
    }
    path += `/${nomeArquivo}`;
    console.log("\u{1F4E4} Upload R2:", path);
    await env.R2_IMAGENS.put(path, file.stream(), {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
        contentDisposition: "inline"
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        tipo
      }
    });
    const R2_PUBLIC_URL = "https://pub-e635cafdb9524e428a62de6c21c04781.r2.dev";
    const url = `${R2_PUBLIC_URL}/${path}`;
    console.log("\u2705 Upload conclu\xEDdo:", url);
    return new Response(JSON.stringify({
      success: true,
      url,
      path,
      size: file.size,
      contentType
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("\u274C Erro upload R2:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}
__name(handleUploadImagem, "handleUploadImagem");
async function handleGetImagem(request, env, pathname) {
  try {
    const imagePath = pathname.replace("/r2/", "");
    const object = await env.R2_IMAGENS.get(imagePath);
    if (!object) {
      return new Response("Imagem n\xE3o encontrada", { status: 404 });
    }
    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.httpMetadata?.contentType || "image/jpeg"
    );
    headers.set("Cache-Control", "public, max-age=86400");
    if (object.etag) {
      headers.set("ETag", object.etag);
    }
    return new Response(object.body, { headers });
  } catch (error) {
    console.error("\u274C Erro GET imagem:", error);
    return new Response("Erro ao carregar imagem", { status: 500 });
  }
}
__name(handleGetImagem, "handleGetImagem");
async function handleListImagens(request, env) {
  try {
    const url = new URL(request.url);
    const prefix = url.searchParams.get("prefix") || "";
    const objects = await env.R2_IMAGENS.list({ prefix });
    const R2_PUBLIC_URL = "https://pub-e635cafdb9524e428a62de6c21c04781.r2.dev";
    const imagens = objects.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      url: `${R2_PUBLIC_URL}/${obj.key}`
    }));
    return new Response(JSON.stringify({
      success: true,
      images: imagens
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("\u274C Erro listagem:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}
__name(handleListImagens, "handleListImagens");
async function handleDeleteImagem(request, env) {
  try {
    const { path } = await request.json();
    if (!path) {
      return new Response(JSON.stringify({
        success: false,
        error: "Path \xE9 obrigat\xF3rio"
      }), { status: 400 });
    }
    await env.R2_IMAGENS.delete(path);
    return new Response(JSON.stringify({
      success: true,
      message: "Imagem deletada com sucesso"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("\u274C Erro delete:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}
__name(handleDeleteImagem, "handleDeleteImagem");

// index.js
function formatTimeAgo(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 6e4);
  if (m < 1) return "agora";
  if (m < 60) return `h\xE1 ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `h\xE1 ${h}h`;
  return `h\xE1 ${Math.floor(h / 24)}d`;
}
__name(formatTimeAgo, "formatTimeAgo");
function getClientIP(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0] || request.headers.get("X-Real-IP") || "unknown";
}
__name(getClientIP, "getClientIP");
function logStructured(level, message, data = {}) {
  const logEntry = {
    level,
    message,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    requestId: data.requestId || "unknown",
    ...data
  };
  if (level === "error") {
    console.error(JSON.stringify(logEntry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}
__name(logStructured, "logStructured");
async function getInstagramToken(env) {
  let token = await env.KV_INSTAGRAM?.get("current_token");
  if (!token) {
    token = env.INSTAGRAM_ACCESS_TOKEN;
    if (token && env.KV_INSTAGRAM) {
      await env.KV_INSTAGRAM.put("current_token", token);
      logStructured("info", "Token salvo no KV_INSTAGRAM", { motivo: "manual_initial" });
      await registrarHistoricoToken(env, token, "manual_initial");
    }
  }
  return token;
}
__name(getInstagramToken, "getInstagramToken");
async function registrarHistoricoToken(env, token, motivo) {
  if (!env.KV_INSTAGRAM_TOKEN) return;
  const tokenPreview = token ? token.substring(0, 8) + "..." : "NO_TOKEN";
  const historico = { token: tokenPreview, motivo, data: (/* @__PURE__ */ new Date()).toISOString() };
  const id = `token_${Date.now()}`;
  await env.KV_INSTAGRAM_TOKEN.put(id, JSON.stringify(historico));
  const listaTokens = await env.KV_INSTAGRAM_TOKEN.get("token_history_list", "json") || [];
  listaTokens.unshift({ id, data: historico.data, motivo, tokenPreview });
  await env.KV_INSTAGRAM_TOKEN.put("token_history_list", JSON.stringify(listaTokens.slice(0, 20)));
  logStructured("info", "Hist\xF3rico registrado", { motivo, data: historico.data });
}
__name(registrarHistoricoToken, "registrarHistoricoToken");
async function refreshInstagramToken(env, motivo = "auto_refresh") {
  const tokenAtual = await getInstagramToken(env);
  if (!tokenAtual) {
    logStructured("error", "Nenhum token encontrado para renovar");
    return null;
  }
  const refreshUrl = `https://graph.facebook.com/v22.0/refresh_access_token?grant_type=ig_refresh_token&access_token=${tokenAtual}`;
  try {
    logStructured("info", "Renovando token do Instagram");
    const response = await fetchWithTimeout(refreshUrl, {}, 1e4);
    const data = await response.json();
    if (data.access_token) {
      await env.KV_INSTAGRAM.put("current_token", data.access_token);
      const expiresInDays = Math.round(data.expires_in / 86400);
      await env.KV_INSTAGRAM.put("token_expires_at", String(Date.now() + data.expires_in * 1e3));
      await env.KV_INSTAGRAM.put("last_refresh", (/* @__PURE__ */ new Date()).toISOString());
      await registrarHistoricoToken(env, data.access_token, motivo);
      logStructured("info", "Token renovado com sucesso", { expiresInDays });
      return data.access_token;
    } else {
      logStructured("error", "Falha na renova\xE7\xE3o", { error: data });
      await registrarHistoricoToken(env, "FAILED", `${motivo}_failed`);
      return null;
    }
  } catch (error) {
    logStructured("error", "Erro na renova\xE7\xE3o", { error: error.message });
    return null;
  }
}
__name(refreshInstagramToken, "refreshInstagramToken");
async function getInstagramFeed(env, retry = false) {
  const IG_ID = env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const TOKEN = await getInstagramToken(env);
  if (!IG_ID || !TOKEN) {
    logStructured("error", "Instagram: ID ou Token n\xE3o configurado");
    return [];
  }
  const url = `https://graph.facebook.com/v22.0/${IG_ID}/media?fields=id,caption,media_url,permalink,timestamp&access_token=${TOKEN}`;
  try {
    logStructured("info", "Buscando feed do Instagram");
    const res = await fetchWithTimeout(url, {}, 8e3);
    const json = await res.json();
    if (json.error) {
      logStructured("error", "Erro na API do Instagram", { error: json.error });
      if (!retry && json.error.code === 190 && json.error.error_subcode === 463) {
        logStructured("warn", "Token expirado, tentando renovar");
        const novoToken = await refreshInstagramToken(env, "expired_renew");
        if (novoToken) return getInstagramFeed(env, true);
      }
      return [];
    }
    let data = json.data || [];
    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const unique = [];
    const seen = /* @__PURE__ */ new Set();
    for (const post of data) {
      if (!seen.has(post.id)) {
        seen.add(post.id);
        unique.push(post);
      }
    }
    const finalPosts = unique.slice(0, 6);
    logStructured("info", "Instagram feed obtido", { count: finalPosts.length });
    return finalPosts;
  } catch (err) {
    logStructured("error", "Erro Instagram", { error: err.message });
    return [];
  }
}
__name(getInstagramFeed, "getInstagramFeed");
var PUBLIC_ROUTES = /* @__PURE__ */ new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/esqueci-senha",
  "/api/auth/confirmar-reset-senha",
  "/api/auth/solicitar-reset-2fa",
  "/api/auth/confirmar-reset-2fa",
  "/api/liturgia",
  "/api/terco/hoje",
  "/api/vatican-news",
  "/api/youtube",
  "/api/instagram",
  "/api/diocese-news",
  "/api/horarios",
  "/api/candle-lighting",
  "/api/prayer",
  "/api/contato/enviar",
  "/api/contato/pascom/enviar",
  "/api/dados",
  "/api/biblia",
  "/api/health",
  "/",
  "/api"
]);
var AUTH_ROUTES_SET = /* @__PURE__ */ new Set([
  "/api/auth/verificar",
  "/api/auth/verify-pin",
  "/api/auth/reenviar-pin",
  "/api/auth/setup-2fa",
  "/api/auth/verify-2fa",
  "/api/auth/reset-2fa-backup",
  "/api/fiel/dados",
  "/api/fiel/salvar",
  "/api/fiel/perfil",
  "/api/fiel/pastorais",
  "/api/fiel/termo-voz",
  "/api/fiel/contribuir-voz",
  "/api/fiel/versiculos",
  "/api/fiel/buscar-musicas",
  "/api/fiel/health",
  "/api/fiel/alterar-senha",
  "/api/fiel/upload-imagem",
  "/api/fiel/salvar-dados"
]);
var ADMIN_ROUTES_SET = /* @__PURE__ */ new Set([
  "/api/admin/verificar",
  "/api/admin/dados",
  "/api/admin/perfil",
  "/api/admin/alterar-senha",
  "/api/admin/youtube-live",
  "/api/admin/backup",
  "/api/admin/refresh-instagram-token",
  "/api/admin/instagram-token-status",
  "/api/admin/instagram-token-history",
  "/api/admin/reset-instagram-token"
]);
var index_default = {
  async fetch(request, env, ctx) {
    const requestId = createRequestId();
    const url = new URL(request.url);
    const pathname = url.pathname.trim();
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get("User-Agent") || "unknown";
    logStructured("info", "Request recebida", { requestId, method: request.method, pathname, ip: clientIP });
    const corsResponse = handleCorsOptions(request);
    if (corsResponse) return corsResponse;
    const payloadError = validatePayloadSize(request);
    if (payloadError) return addCorsHeaders(payloadError, request);
    const rateConfig = getRateLimitConfig(pathname);
    const identifier = clientIP;
    const rateAllowed = await rateLimit(identifier, env, rateConfig.limit, rateConfig.window);
    if (!rateAllowed) {
      await logAttack(env, { type: "rate_limit_early", ip: clientIP, path: pathname, requestId });
      return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "Muitas requisi\xE7\xF5es. Aguarde um momento." }, 429)), request);
    }
    let context = { request, env, ip: clientIP, url, pathname, body: null, requestId };
    try {
      const wafBlock = await waf(context);
      if (wafBlock) {
        await logAttack(env, { type: "waf", ip: clientIP, path: pathname, userAgent, requestId });
        return addCorsHeaders(addSecurityHeaders(wafBlock), request);
      }
      const ipRep = await checkIPReputation(clientIP, env);
      if (ipRep?.blocked) {
        await logAttack(env, { type: "ip_reputation", ip: clientIP, path: pathname, userAgent, requestId });
        return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "IP bloqueado" }, 403)), request);
      }
      const firewallAllowed = firewall(request || {});
      if (!firewallAllowed) {
        await logAttack(env, { type: "firewall", ip: clientIP, path: pathname, userAgent, requestId });
        return addCorsHeaders(addSecurityHeaders(new Response("Blocked by firewall", { status: 403 })), request);
      }
      const isBot = detectBot(request);
      if (isBot) {
        await logAttack(env, { type: "bot", ip: clientIP, path: pathname, userAgent, requestId });
        return addCorsHeaders(addSecurityHeaders(new Response("Bot detectado", { status: 403 })), request);
      }
      const fp = await fingerprint(context);
      context.fingerprint = fp;
      const risk = await riskEngine(context);
      context.risk = risk;
      if (risk?.score > 50 || risk?.requiresCaptcha) {
        const captchaOk = await verifyCaptcha(context);
        if (!captchaOk) {
          await logAttack(env, { type: "captcha_failed", ip: clientIP, path: pathname, fingerprint: fp, risk: risk?.score, requestId });
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "Captcha obrigat\xF3rio" }, 403)), request);
        }
      }
      let user = null;
      const isPublicRoute = PUBLIC_ROUTES.has(pathname);
      const isAuthRoute = AUTH_ROUTES_SET.has(pathname);
      const isAdminRoute = ADMIN_ROUTES_SET.has(pathname);
      const needsBody = ["POST", "PUT", "PATCH"].includes(request.method) && !pathname.startsWith("/api/r2/") && !pathname.includes("upload");
      if (needsBody) {
        try {
          const clonedRequest = request.clone();
          const rawBody = await clonedRequest.json().catch(() => ({}));
          context.body = sanitizeInput(rawBody);
        } catch (e) {
        }
      }
      if (!isPublicRoute && !isAuthRoute) {
        const authResult = await requireAuth({ request, env });
        if (authResult?.error) {
          await logAttack(env, { type: "auth_fail", ip: clientIP, path: pathname, userAgent, requestId });
          return addCorsHeaders(addSecurityHeaders(authResult.response), request);
        }
        user = authResult.user;
      }
      if (isAdminRoute && !isPublicRoute) {
        const roleCheck = await requireRole(user, ["admin", "fiel"]);
        if (!roleCheck.allowed) {
          await logAttack(env, { type: "forbidden", ip: clientIP, path: pathname, user: user?.email, requestId });
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "Acesso negado. Permiss\xE3o de administrador necess\xE1ria." }, 403)), request);
        }
      }
      const finalIdentifier = user?.id || context.fingerprint || clientIP;
      if (finalIdentifier !== identifier) {
        const refinedAllowed = await rateLimit(finalIdentifier, env, rateConfig.limit, rateConfig.window);
        if (!refinedAllowed) {
          await logAttack(env, { type: "rate_limit_refined", ip: clientIP, path: pathname, identifier: finalIdentifier, requestId });
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "Muitas requisi\xE7\xF5es. Aguarde um momento." }, 429)), request);
        }
      }
      if (pathname === "/api/admin/reset-instagram-token" && request.method === "POST") {
        if (!user || user.role !== "admin" && user.role !== "fiel") {
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "Acesso negado" }, 403)), request);
        }
        try {
          const novoToken = await refreshInstagramToken(env, "manual_reset");
          if (novoToken) {
            const expiresAt = await env.KV_INSTAGRAM?.get("token_expires_at");
            let expiraEm = "30 dias";
            if (expiresAt) {
              const diasRestantes = Math.ceil((parseInt(expiresAt) - Date.now()) / 864e5);
              expiraEm = `${diasRestantes} dias`;
            }
            return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, message: "Token do Instagram resetado com sucesso!", expiraEm })), request);
          } else {
            return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "N\xE3o foi poss\xEDvel resetar o token. Tente novamente." }, 400)), request);
          }
        } catch (error) {
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: error.message }, 500)), request);
        }
      }
      if (pathname === "/api/admin/refresh-instagram-token" && request.method === "POST") {
        try {
          const novoToken = await refreshInstagramToken(env, "manual_admin");
          if (novoToken) {
            const expiresAt = await env.KV_INSTAGRAM?.get("token_expires_at");
            let expiraEm = "60 dias";
            if (expiresAt) {
              const diasRestantes = Math.ceil((parseInt(expiresAt) - Date.now()) / 864e5);
              expiraEm = `${diasRestantes} dias`;
            }
            return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, message: "Token renovado com sucesso!", expiraEm, tokenPreview: novoToken.substring(0, 6) + "..." })), request);
          } else {
            return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "N\xE3o foi poss\xEDvel renovar o token. Gere um novo manualmente no Business Manager." }, 400)), request);
          }
        } catch (error) {
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: error.message }, 500)), request);
        }
      }
      if (pathname === "/api/admin/instagram-token-status" && request.method === "GET") {
        try {
          const token = await getInstagramToken(env);
          const expiresAt = await env.KV_INSTAGRAM?.get("token_expires_at");
          const lastRefresh = await env.KV_INSTAGRAM?.get("last_refresh");
          const status = {
            hasToken: !!token,
            expiresAt: expiresAt ? new Date(parseInt(expiresAt)).toISOString() : null,
            lastRefresh: lastRefresh || null,
            diasRestantes: null,
            tokenPreview: token ? token.substring(0, 6) + "..." : null
          };
          if (expiresAt) {
            const diasRestantes = Math.ceil((parseInt(expiresAt) - Date.now()) / 864e5);
            status.diasRestantes = diasRestantes;
            status.isValid = diasRestantes > 0;
          }
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, status })), request);
        } catch (error) {
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: error.message }, 500)), request);
        }
      }
      if (pathname === "/api/admin/instagram-token-history" && request.method === "GET") {
        try {
          const historico = await env.KV_INSTAGRAM_TOKEN?.get("token_history_list", "json") || [];
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, historico })), request);
        } catch (error) {
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: error.message }, 500)), request);
        }
      }
      if (pathname === "/api/r2/upload" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await handleUploadImagem(request, env)), request);
      }
      if (pathname === "/api/r2/audio-upload" && request.method === "POST") {
        try {
          const formData = await request.formData();
          const file = formData.get("imagem");
          if (!file || file.size > 5 * 1024 * 1024) {
            return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "Arquivo inv\xE1lido ou muito grande (m\xE1x 5MB)" }, 400)), request);
          }
          const tipo = formData.get("tipo") || "geral";
          const nomeArquivo = `${tipo}/${Date.now()}-${file.name}`;
          await env.R2_AUDIO.put(nomeArquivo, file.stream(), { httpMetadata: { contentType: file.type } });
          const url2 = `https://pub-a7cc8a4d3af3406aac2a13dacc039fb5.r2.dev/${nomeArquivo}`;
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, url: url2 })), request);
        } catch (error) {
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: error.message }, 500)), request);
        }
      }
      if (pathname.startsWith("/r2/")) {
        return addCorsHeaders(addSecurityHeaders(await handleGetImagem(request, env, pathname)), request);
      }
      if (pathname === "/api/r2/list" && request.method === "GET") {
        return addCorsHeaders(addSecurityHeaders(await handleListImagens(request, env)), request);
      }
      if (pathname === "/api/r2/delete" && request.method === "DELETE") {
        return addCorsHeaders(addSecurityHeaders(await handleDeleteImagem(request, env)), request);
      }
      if (pathname === "/api/admin/backup" && request.method === "POST") {
        if (!user || !["admin", "fiel"].includes(user.role)) {
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ error: "Acesso negado" }, 403)), request);
        }
        const dados = context.body;
        const chave = `backup_admin_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}_${Date.now()}`;
        await env.SANTUARIO_KV.put(chave, JSON.stringify({ dados, timestamp: (/* @__PURE__ */ new Date()).toISOString(), email: user.email }));
        const backups = await env.SANTUARIO_KV.list({ prefix: "backup_admin_" });
        if (backups.keys.length > 30) {
          const toDelete = backups.keys.slice(30);
          for (const key of toDelete) await env.SANTUARIO_KV.delete(key.name);
        }
        await env.SANTUARIO_KV.put("admin_dados_atual", JSON.stringify(dados));
        return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, chave })), request);
      }
      if (pathname === "/api/admin/verificar" && request.method === "GET") {
        if (!user) return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false }, 401)), request);
        return addCorsHeaders(addSecurityHeaders(jsonResponse({
          success: true,
          user: { id: user.id, nome: user.nome, email: user.email, role: user.role, twofa_enabled: user.twofa_enabled }
        })), request);
      }
      if (pathname === "/api/auth/login" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await fielLoginRoute(request, env)), request);
      }
      if (pathname === "/api/auth/verificar" && request.method === "GET") {
        return addCorsHeaders(addSecurityHeaders(await fielVerificarRoute(request, env)), request);
      }
      if (pathname === "/api/auth/verify-pin" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await fielVerifyPinRoute(request, env)), request);
      }
      if (pathname === "/api/auth/reenviar-pin" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await fielReenviarPinRoute(request, env)), request);
      }
      if (pathname === "/api/auth/verify-2fa" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await fielVerify2faRoute(request, env)), request);
      }
      if (pathname === "/api/auth/reset-2fa-backup" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await fielReset2faBackupRoute(request, env)), request);
      }
      if (pathname === "/api/auth/solicitar-reset-2fa" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await fielSolicitarReset2faRoute(request, env)), request);
      }
      if (pathname === "/api/auth/confirmar-reset-2fa" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await fielConfirmarReset2faRoute(request, env)), request);
      }
      if (pathname === "/api/auth/esqueci-senha" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await fielEsqueciSenhaRoute(request, env)), request);
      }
      if (pathname === "/api/auth/confirmar-reset-senha" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await fielConfirmarResetSenhaRoute(request, env)), request);
      }
      if (pathname === "/api/biblia" && request.method === "GET") {
        return addCorsHeaders(addSecurityHeaders(await handleBiblia(request, env)), request);
      }
      if (pathname === "/api/fiel/dados" && request.method === "GET") {
        return addCorsHeaders(addSecurityHeaders(await getDados(request, env)), request);
      }
      if (pathname === "/api/fiel/salvar-dados" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await salvarDados(request, env)), request);
      }
      if (pathname === "/api/fiel/upload-imagem" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await uploadImagemFiel(request, env)), request);
      }
      if (pathname === "/api/fiel/perfil" && request.method === "PUT") {
        return addCorsHeaders(addSecurityHeaders(await atualizarPerfil(request, env)), request);
      }
      if (pathname === "/api/fiel/alterar-senha" && request.method === "PUT") {
        return addCorsHeaders(addSecurityHeaders(await alterarSenhaFiel(request, env)), request);
      }
      if (pathname === "/api/fiel/pastorais" && request.method === "GET") {
        return addCorsHeaders(addSecurityHeaders(await listarPastorais(request, env)), request);
      }
      if (pathname === "/api/fiel/termo-voz" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await registrarTermoPublico(request, env, ctx)), request);
      }
      if (pathname === "/api/fiel/contribuir-voz" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await contribuirVoz(request, env)), request);
      }
      if (pathname === "/api/fiel/versiculos" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await salvarVersiculo(request, env)), request);
      }
      if (pathname === "/api/fiel/versiculos" && request.method === "GET") {
        return addCorsHeaders(addSecurityHeaders(await buscarVersiculos(request, env)), request);
      }
      if (pathname === "/api/fiel/buscar-musicas" && request.method === "GET") {
        return addCorsHeaders(addSecurityHeaders(await buscarMusicas(request, env)), request);
      }
      if (pathname === "/api/fiel/health" && request.method === "GET") {
        return addCorsHeaders(addSecurityHeaders(jsonResponse({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() })), request);
      }
      if (pathname === "/api/admin/dados" && request.method === "GET") {
        console.log("\u{1F4E5} [ADMIN] GET /api/admin/dados - user:", user?.email);
        return addCorsHeaders(addSecurityHeaders(await handleAdminDados(request, env, user)), request);
      }
      if (pathname === "/api/admin/dados" && request.method === "POST") {
        console.log("\u{1F4E4} [ADMIN] POST /api/admin/dados - user:", user?.email);
        console.log("\u{1F4E6} Body parseado:", context.body ? "\u2705" : "\u274C VAZIO");
        const response = await handleAdminSalvarDados(request, env, user, context.body);
        console.log("\u{1F4E4} [ADMIN] Resposta status:", response.status);
        return addCorsHeaders(addSecurityHeaders(response), request);
      }
      if (pathname === "/api/admin/perfil" && request.method === "GET") {
        console.log("\u{1F464} [ADMIN] GET /api/admin/perfil - user:", user?.email);
        return addCorsHeaders(addSecurityHeaders(await handleAdminPerfil(request, env, user)), request);
      }
      if (pathname === "/api/admin/perfil" && request.method === "PUT") {
        console.log("\u270F\uFE0F [ADMIN] PUT /api/admin/perfil - user:", user?.email);
        return addCorsHeaders(addSecurityHeaders(await handleAdminAtualizarPerfil(request, env, user, context.body)), request);
      }
      if (pathname === "/api/admin/alterar-senha" && request.method === "PUT") {
        console.log("\u{1F512} [ADMIN] PUT /api/admin/alterar-senha - user:", user?.email);
        return addCorsHeaders(addSecurityHeaders(await handleAdminAlterarSenha(request, env, user, context.body)), request);
      }
      if (pathname === "/api/admin/youtube-live" && request.method === "POST") {
        return addCorsHeaders(addSecurityHeaders(await handleAdminYoutubeLivePost(request, env)), request);
      }
      if (pathname === "/api/admin/youtube-live" && request.method === "DELETE") {
        return addCorsHeaders(addSecurityHeaders(await handleAdminYoutubeLiveDelete(request, env)), request);
      }
      if (pathname === "/api/admin/youtube-live" && request.method === "GET") {
        return addCorsHeaders(addSecurityHeaders(await handleAdminYoutubeLiveGet(request, env)), request);
      }
      if (pathname === "/api/terco/hoje") {
        return addCorsHeaders(addSecurityHeaders(await handleTerco(request, env)), request);
      }
      if (pathname === "/api/liturgia") {
        try {
          const data = await buscarLiturgia(url.searchParams.get("data"));
          const responseData = {
            success: true,
            leituras: {
              cor: data.liturgia?.cor || "",
              tempoLiturgico: data.liturgia?.titulo || "",
              semana: data.liturgia?.semana || "",
              tituloLiturgico: data.liturgia?.tituloLiturgico || "",
              antifona: data.liturgia?.antifona || "",
              introducao: data.liturgia?.introducao || "",
              primeiraLeitura: data.liturgia?.primeiraLeitura || "",
              segundaLeitura: data.liturgia?.segundaLeitura || "",
              salmo: data.liturgia?.salmo || "",
              evangelho: data.liturgia?.evangelho || "",
              reflexao: data.liturgia?.reflexao || ""
            }
          };
          const response = jsonResponse(responseData);
          response.headers.set("Cache-Control", "no-store");
          return addCorsHeaders(addSecurityHeaders(response), request);
        } catch (error) {
          logStructured("error", "Erro ao buscar liturgia", { error: error.message, requestId });
          const response = jsonResponse({
            success: true,
            leituras: {
              cor: "",
              tempoLiturgico: "",
              semana: "Tempo Comum",
              primeiraLeitura: "Leitura n\xE3o dispon\xEDvel no momento.",
              salmo: "Salmo n\xE3o dispon\xEDvel.",
              evangelho: "Evangelho n\xE3o dispon\xEDvel."
            }
          });
          return addCorsHeaders(addSecurityHeaders(response), request);
        }
      }
      if (pathname === "/api/horarios" && request.method === "GET") {
        try {
          const horariosPadrao = [
            { id: "segunda", dia: "Segunda-Feira", missas: [], ativo: true },
            { id: "terca", dia: "Ter\xE7a-Feira", missas: [{ id: "terca-1", hora: "07h30" }, { id: "terca-2", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }], ativo: true },
            { id: "quarta", dia: "Quarta-Feira", missas: [{ id: "quarta-1", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }], ativo: true },
            { id: "quinta", dia: "Quinta-Feira", missas: [{ id: "quinta-1", hora: "07h30" }, { id: "quinta-2", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }], ativo: true },
            { id: "sexta", dia: "Sexta-Feira", missas: [{ id: "sexta-1", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }], ativo: true },
            { id: "sabado", dia: "S\xE1bado", missas: [{ id: "sabado-1", hora: "16h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }], ativo: true },
            { id: "domingo", dia: "Domingo", missas: [{ id: "domingo-1", hora: "08h00" }, { id: "domingo-2", hora: "10h00", tipo: "Transmitida AO VIVO", youtube: true, youtubeLink: "https://youtube.com/@santuariodefatimanews" }, { id: "domingo-3", hora: "18h30" }], ativo: true }
          ];
          let horarios = await env.KV_MISSAS?.get("horariosMissas", "json");
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, horarios: horarios || horariosPadrao })), request);
        } catch (error) {
          logStructured("error", "Erro ao buscar hor\xE1rios", { error: error.message, requestId });
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "Erro ao carregar hor\xE1rios" }, 500)), request);
        }
      }
      if (pathname === "/api/vatican-news") {
        try {
          const data = await getVaticanNews(env);
          return addCorsHeaders(addSecurityHeaders(jsonResponse(data)), request);
        } catch (error) {
          return addCorsHeaders(addSecurityHeaders(jsonResponse([], 200)), request);
        }
      }
      if (pathname === "/api/youtube") {
        return addCorsHeaders(addSecurityHeaders(await handleYouTube(request, env)), request);
      }
      if (pathname === "/api/instagram") {
        try {
          const posts = await getInstagramFeed(env);
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, posts })), request);
        } catch (error) {
          logStructured("error", "Erro na rota /api/instagram", { error: error.message, requestId });
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, posts: [], error: error.message }, 500)), request);
        }
      }
      if (pathname === "/api/diocese-news") {
        return addCorsHeaders(addSecurityHeaders(await handleDioceseNews(request, env)), request);
      }
      if (pathname === "/api/candle-lighting" && request.method === "POST") {
        try {
          const body = context.body;
          const candleData = {
            id: Date.now().toString(),
            nome: body.name || body.nome || "Anonimo",
            familia: body.intention || "Familia",
            cidade: body.city || body.cidade || "",
            estado: body.state || body.estado || "",
            data: (/* @__PURE__ */ new Date()).toISOString(),
            duracao: 86400,
            status: 1
          };
          if (env.DB) {
            await env.DB.prepare(`CREATE TABLE IF NOT EXISTS velas (id TEXT PRIMARY KEY, nome TEXT NOT NULL, familia TEXT, cidade TEXT, estado TEXT, data TEXT, duracao INTEGER, status INTEGER DEFAULT 1)`).run();
            await env.DB.prepare(`INSERT INTO velas (id, nome, familia, cidade, estado, data, duracao, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(candleData.id, candleData.nome, candleData.familia, candleData.cidade, candleData.estado, candleData.data, candleData.duracao, candleData.status).run();
          }
          if (body.email) {
            ctx.waitUntil(sendCandleEmail(env, { name: candleData.nome, email: body.email, intention: candleData.familia, cidade: candleData.cidade, estado: candleData.estado }));
          }
          ctx.waitUntil(cleanupOldCandles(env));
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, message: "Vela acesa com sucesso!", candle: candleData })), request);
        } catch (error) {
          logStructured("error", "Erro ao processar vela", { error: error.message, requestId });
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "Erro interno ao processar vela" }, 500)), request);
        }
      }
      if (pathname === "/api/candle-lighting" && request.method === "GET") {
        try {
          if (!env.DB) return addCorsHeaders(addSecurityHeaders(jsonResponse([])), request);
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
          const result = await env.DB.prepare(`SELECT id, nome, familia, cidade, estado, data FROM velas WHERE data > ? AND status = 1 ORDER BY data DESC LIMIT 100`).bind(sevenDaysAgo).all();
          const candles = (result.results || []).map((c) => ({
            id: c.id,
            name: c.nome,
            intention: c.familia,
            city: c.cidade || "",
            state: c.estado || "",
            createdAt: c.data,
            timestamp: formatTimeAgo(c.data)
          }));
          return addCorsHeaders(addSecurityHeaders(jsonResponse(candles)), request);
        } catch (error) {
          return addCorsHeaders(addSecurityHeaders(jsonResponse([])), request);
        }
      }
      if (pathname === "/api/prayer" && request.method === "POST") {
        try {
          const body = context.body;
          if (env.DB) {
            await env.DB.prepare(`CREATE TABLE IF NOT EXISTS prayer (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, email TEXT, pedido TEXT NOT NULL, cidade TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
            await env.DB.prepare(`INSERT INTO prayer (nome, email, pedido, cidade, created_at) VALUES (?, ?, ?, ?, ?)`).bind(body.name || body.nome || "Anonimo", body.email || "", body.prayerRequest || body.pedido || "", body.cidade || body.city || "", (/* @__PURE__ */ new Date()).toISOString()).run();
          }
          if (body.email && env.RESEND_API_KEY) {
            const prayerData = { name: body.name || body.nome || "Anonimo", email: body.email, prayerRequest: body.prayerRequest || body.pedido || "", cidade: body.cidade || body.city || "" };
            ctx.waitUntil(sendPrayerConfirmationEmail(env, prayerData));
            ctx.waitUntil(sendPrayerNotificationToSecretariat(env, prayerData));
          }
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, message: "Pedido de ora\xE7\xE3o recebido com sucesso!" })), request);
        } catch (error) {
          logStructured("error", "Erro ao processar pedido de ora\xE7\xE3o", { error: error.message, requestId });
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, message: "Erro ao processar seu pedido" }, 500)), request);
        }
      }
      if (pathname === "/api/prayer" && request.method === "GET") {
        try {
          if (!env.DB) return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, count: 0, prayers: [] })), request);
          const result = await env.DB.prepare(`SELECT id, nome, email, pedido, cidade, created_at FROM prayer ORDER BY created_at DESC LIMIT 50`).all();
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, count: result.results?.length || 0, prayers: result.results || [] })), request);
        } catch (error) {
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "Erro ao buscar pedidos" }, 500)), request);
        }
      }
      if (pathname === "/api/contato/enviar" && request.method === "POST") {
        try {
          const body = context.body;
          if (!env.RESEND_API_KEY) return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "RESEND_API_KEY n\xE3o configurada" }, 500)), request);
          ctx.waitUntil(sendContactConfirmationEmail(env, body));
          ctx.waitUntil(sendContactNotificationToSecretariat(env, body));
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, message: "Mensagem enviada com sucesso!" })), request);
        } catch (error) {
          logStructured("error", "Erro ao enviar contato", { error: error.message, requestId });
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, message: "Erro ao enviar mensagem" }, 500)), request);
        }
      }
      if (pathname === "/api/contato/pascom/enviar" && request.method === "POST") {
        try {
          const body = context.body;
          if (!env.RESEND_API_KEY) return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "RESEND_API_KEY n\xE3o configurada" }, 500)), request);
          logStructured("info", "Enviando mensagem da Pascom", { requestId });
          ctx.waitUntil(sendContactConfirmationEmail(env, body));
          ctx.waitUntil(sendContactNotificationToSecretariat(env, body));
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, message: "Mensagem enviada com sucesso para a Pascom!" })), request);
        } catch (error) {
          logStructured("error", "Erro ao enviar mensagem para Pascom", { error: error.message, requestId });
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, message: "Erro ao enviar mensagem" }, 500)), request);
        }
      }
      if (pathname === "/api/dados" && request.method === "GET") {
        try {
          const carrossel = await env.KV_FILES?.get("santuario_carrossel", "json") || [];
          const popups = await env.KV_FILES?.get("santuario_popups", "json") || [];
          const recados = await env.KV_FILES?.get("santuario_recados", "json") || [];
          const horariosMissas = await env.KV_MISSAS?.get("horariosMissas", "json") || [];
          const momentosLiturgicos = await env.KV_LITURGIA?.get("momentos", "json") || [];
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, dados: { carrossel, momentosLiturgicos, popups, recados, horariosMissas } })), request);
        } catch (error) {
          logStructured("error", "Erro ao buscar dados p\xFAblicos", { error: error.message, requestId });
          return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, dados: { carrossel: [], momentosLiturgicos: [], popups: [], recados: [], horariosMissas: [] } })), request);
        }
      }
      if (pathname === "/api/health") {
        return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() })), request);
      }
      if (pathname === "/" || pathname === "/api") {
        return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: true, service: "Santu\xE1rio de F\xE1tima API", version: "5.0.0", status: "online", timestamp: (/* @__PURE__ */ new Date()).toISOString() })), request);
      }
      return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "Endpoint n\xE3o encontrado", path: pathname }, 404)), request);
    } catch (err) {
      logStructured("error", "Erro interno no servidor", { error: err.message, stack: err.stack, requestId });
      return addCorsHeaders(addSecurityHeaders(jsonResponse({ success: false, error: "Erro interno do servidor" }, 500)), request);
    }
  },
  // ============================================
  // ⏰ TAREFA AGENDADA
  // ============================================
  async scheduled(event, env, ctx) {
    logStructured("info", "Executando tarefas agendadas");
    await cleanupOldCandles(env);
    await backupOldPrayers(env);
    logStructured("info", "Verificando token do Instagram para renova\xE7\xE3o");
    const tokenAtual = await getInstagramToken(env);
    const expiresAt = await env.KV_INSTAGRAM?.get("token_expires_at");
    let precisaRenovar = true;
    if (expiresAt) {
      const diasRestantes = Math.ceil((parseInt(expiresAt) - Date.now()) / 864e5);
      logStructured("info", "Status do token", { diasRestantes });
      precisaRenovar = diasRestantes < 40;
      if (precisaRenovar) {
        logStructured("warn", "Token expira em breve, renovando", { diasRestantes });
      } else {
        logStructured("info", "Token ainda tem dias suficientes", { diasRestantes });
      }
    }
    if (precisaRenovar && tokenAtual) {
      const novoToken = await refreshInstagramToken(env, "auto_refresh");
      if (novoToken) {
        logStructured("info", "Token renovado automaticamente com sucesso");
      } else {
        logStructured("error", "Falha na renova\xE7\xE3o autom\xE1tica do token");
      }
    } else if (!tokenAtual) {
      logStructured("error", "Nenhum token encontrado no KV. Configure manualmente primeiro.");
    }
  }
};

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-v3A51o/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = index_default;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-v3A51o/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default,
  getInstagramFeed,
  getInstagramToken,
  refreshInstagramToken,
  registrarHistoricoToken
};
/*! Bundled license information:

bcryptjs/dist/bcrypt.js:
  (**
   * @license bcrypt.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
   * Released under the Apache License, Version 2.0
   * see: https://github.com/dcodeIO/bcrypt.js for details
   *)
*/
//# sourceMappingURL=index.js.map
