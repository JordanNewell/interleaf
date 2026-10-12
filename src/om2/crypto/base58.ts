/** Base58 (Bitcoin alphabet). Used for fingerprint encoding; no `0OIl` in addresses. */

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  // log(256)/log(58) rounded up, plus the leading-zero room — integer math:
  // a float here becomes a non-integer typed-array index, which silently no-ops
  const size = Math.floor(((bytes.length - zeros) * 138) / 100) + 1;
  const buf = new Uint8Array(size);
  let len = 0;
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i] as number;
    let j = 0;
    for (let k = size - 1; (carry !== 0 || j < len) && k >= 0; k--, j++) {
      carry += 256 * (buf[k] as number);
      buf[k] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    len = j;
  }
  let out = "";
  for (let i = size - len; i < size; i++) out += ALPHABET[buf[i] as number];
  return "1".repeat(zeros) + out;
}

export function base58Decode(str: string): Uint8Array {
  if (str.length === 0) return new Uint8Array(0);
  let zeros = 0;
  while (zeros < str.length && str[zeros] === "1") zeros++;
  const size = Math.floor(((str.length - zeros) * 733) / 1000) + 1; // log(58)/log(256) rounded up, integer math
  const buf = new Uint8Array(size);
  let len = 0;
  for (let i = zeros; i < str.length; i++) {
    const val = ALPHABET.indexOf(str[i] as string);
    if (val < 0) throw new Error(`invalid base58 character: ${str[i]}`);
    let carry = val;
    let j = 0;
    for (let k = size - 1; (carry !== 0 || j < len) && k >= 0; k--, j++) {
      carry += 58 * (buf[k] as number);
      buf[k] = carry % 256;
      carry = Math.floor(carry / 256);
    }
    len = j;
  }
  const out = new Uint8Array(zeros + len);
  for (let i = 0; i < len; i++) out[zeros + i] = buf[size - len + i] as number;
  return out;
}
