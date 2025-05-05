export type ElGamalKeys = {
  p: bigint;
  g: bigint;
  x: bigint; // klucz prywatny
  y: bigint; // klucz publiczny
};

export type ElGamalSignature = {
  r: bigint;
  s: bigint;
};

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}

function egcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (a === 0n) return [b, 0n, 1n];
  const [g, y, x] = egcd(b % a, a);
  return [g, x - (b / a) * y, y];
}

function modInv(a: bigint, m: bigint): bigint {
  const [g, x] = egcd(a, m);
  if (g !== 1n) throw new Error("Brak odwrotności modulo");
  return ((x % m) + m) % m;
}

function isPrime(n: bigint): boolean {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;
  let d = n - 1n;
  let s = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    s += 1n;
  }
  for (let a of [2n, 3n, 5n, 7n, 11n]) {
    if (a >= n - 1n) continue;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let continueOuter = false;
    for (let r = 0n; r < s - 1n; r++) {
      x = modPow(x, 2n, n);
      if (x === n - 1n) {
        continueOuter = true;
        break;
      }
    }
    if (continueOuter) continue;
    return false;
  }
  return true;
}

export function generatePrime(bits: number): bigint {
  while (true) {
    let n =
      2n ** BigInt(bits - 1) +
      BigInt(Math.floor(Math.random() * Number(2n ** BigInt(bits - 1))));
    if (n % 2n === 0n) n += 1n;
    while (!isPrime(n)) n += 2n;
    return n;
  }
}

export function generateKeys(bits = 32): ElGamalKeys {
  const p = generatePrime(bits);
  let g = 2n;
  while (modPow(g, (p - 1n) / 2n, p) === 1n) g += 1n;
  const x = 2n + BigInt(Math.floor(Math.random() * Number(p - 3n)));
  const y = modPow(g, x, p);
  return { p, g, x, y };
}

// SHA-256 hash, zwraca BigInt
export async function hashMessage(msg: string): Promise<bigint> {
  const encoder = new TextEncoder();
  const data = encoder.encode(msg);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return BigInt(
    "0x" +
      Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
  );
}

// Asynchroniczne podpisywanie
export async function sign(
  msg: string,
  keys: ElGamalKeys
): Promise<ElGamalSignature> {
  const { p, g, x } = keys;
  const h = await hashMessage(msg);
  let k: bigint;
  do {
    k = 2n + BigInt(Math.floor(Math.random() * Number(p - 3n)));
  } while (egcd(k, p - 1n)[0] !== 1n);
  const r = modPow(g, k, p);
  const kInv = modInv(k, p - 1n);
  const s = ((h - x * r) * kInv) % (p - 1n);
  return { r, s: (s + (p - 1n)) % (p - 1n) };
}

// Asynchroniczna weryfikacja
export async function verify(
  msg: string,
  sig: ElGamalSignature,
  keys: ElGamalKeys
): Promise<boolean> {
  const { p, g, y } = keys;
  const { r, s } = sig;
  if (r <= 0n || r >= p) return false;
  const h = await hashMessage(msg);
  const v1 = (modPow(y, r, p) * modPow(r, s, p)) % p;
  const v2 = modPow(g, h, p);
  return v1 === v2;
}
