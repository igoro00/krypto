export type ElGamalKeys = {
  p: bigint; // duża liczba pierwsza (moduł)
  g: bigint; // generator grupy (podstawa)
  x: bigint; // klucz prywatny (wykładnik)
  y: bigint; // klucz publiczny (y = (g^x)mod(p))
};
// klucz prywatny to x, a klucz publiczny to (p, g, y).

// definicja typu dla podpisu cyfrowego
export type ElGamalSignature = {
  r: bigint; // 1. część podpisu (r = g^k mod p)
  s: bigint; // 2. część podpisu (s = (h - xr)k^(-1) mod (p-1))
};

// potęgowanie modularnego (a^b mod n)
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = base % mod; // redukcja podstawy modulo mod

  // algorytm potęgowania przez kolejne kwadraty
  while (exp > 0) {
    // jeśli bit wykładnika wynosi 1 (czyli, gdy nieparzysta), mnożymy wynik przez podstawę
    if (exp % 2n === 1n) result = (result * base) % mod;
    // przesuwamy się do następnego bitu wykładnika
    exp = exp / 2n;
    // podnosimy podstawę do kwadratu
    base = (base * base) % mod;
  }
  return result;
}

// rozszerzony algorytm euklidesa - znajduje NWD i współczynniki bezouta
// czyli liczby x, y takie, że ax + by = NWD(a,b)

function egcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (a === 0n) return [b, 0n, 1n]; // przypadek bazowy
  // rekurencyjne wywołanie dla mniejszych liczb
  const [g, y, x] = egcd(b % a, a);
  // obliczenie współczynników dla aktualnego kroku
  return [g, x - (b / a) * y, y];
}

// funkcja znajdująca odwrotność modularną (a^(-1) mod m)
// czyli liczbę b taką, że ab ≡ 1 mod(m)
function modInv(a: bigint, m: bigint): bigint {
  const [g, x] = egcd(a, m); // znajdujemy NWD i współczynniki
  // jeśli NWD != 1, odwrotność nie istnieje
  if (g !== 1n) throw new Error("Brak odwrotności modulo");
  // normalizacja wyniku do przedziału [0, m)
  return ((x % m) + m) % m;
  // wynik normalizujemy do zakresu [0, m-1] (bo x może być ujemne)
}

// test pierwszości millera-rabina
function isPrime(n: bigint): boolean {
  // obsługa małych liczb
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;

  // rozkład n-1 na postać d * 2^s
  let d = n - 1n;
  let s = 0n; // licznik potęgi dwójki
  while (d % 2n === 0n) {
    // dopóki d jest parzyste
    d /= 2n;
    s += 1n; // zwiększenie wykładnika
  }

  // test dla kilku podstaw
  for (let a of [2n, 3n, 5n, 7n, 11n]) {
    if (a >= n - 1n) continue;

    // obliczenie a^d mod n
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;

    // kolejne potęgowanie przez 2
    let continueOuter = false;
    for (let r = 0n; r < s - 1n; r++) {
      x = modPow(x, 2n, n);
      if (x === n - 1n) {
        continueOuter = true;
        break;
      }
    }
    if (continueOuter) continue;

    // jeśli dojdzie tutaj, liczba jest złożona
    return false;
  }
  // jeśli przejdzie wszystkie testy, prawdopodobnie jest pierwsza
  return true;
}

// funkcja generująca losową dużą liczbę pierwszą o zadanej liczbie bitów
export function generatePrime(bits: number): bigint {
  while (true) {
    // losujemy liczbę z odpowiednim zakresem bitów
    let n =
      2n ** BigInt(bits - 1) + // najmniejsza liczba o zadanej liczbie bitów
      BigInt(Math.floor(Math.random() * Number(2n ** BigInt(bits - 1))));
    if (n % 2n === 0n) n += 1n; // jeśli liczba jest parzysta, zwiększamy o 1 (, bo szukamy nieparzystej)
    while (!isPrime(n)) n += 2n; // szukamy najbliższej liczby pierwszej (co 2, bo tylko nieparzyste mogą być pierwsze)
    return n;
  }
}

// klucze elgamala
export function generateKeys(bits = 32): ElGamalKeys {
  const p = generatePrime(bits); // generacja dużej liczby pierwszej- p
  let g = 2n; // zaczynamy od najmniejszego możliwego generatora
  // szukamy generatora g, który spełnia warunki grupy
  while (modPow(g, (p - 1n) / 2n, p) === 1n) g += 1n;
  // losujemy klucz prywatny x z przedziału [2, p-2]
  const x = 2n + BigInt(Math.floor(Math.random() * Number(p - 3n)));
  // obliczamy klucz publiczny y = g^x mod p
  const y = modPow(g, x, p);
  // otrzymujemy wszystkie parametry
  return { p, g, x, y };
}

// funkcja haszująca dane SHA-256 i zamieniająca hash na bigint
export async function hashMessage(data: ArrayBuffer): Promise<bigint> {
  // funkcja do haszowania
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  // wynik tablica bajtów na liczbę w systemie szesnastkowym, a potem na bigint
  return BigInt(
    "0x" +
      Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
  );
}

// funkcja podpisująca dane kluczem prywatnym elgamala
export async function sign(
  data: ArrayBuffer,
  keys: ElGamalKeys
): Promise<ElGamalSignature> {
  const { p, g, x } = keys; // wyciągamy parametry klucza
  const h = await hashMessage(data); // haszowanie danych
  let k: bigint;
  // szukamy losowego k, które jest względnie pierwsze z p-1
  do {
    k = 2n + BigInt(Math.floor(Math.random() * Number(p - 3n)));
  } while (egcd(k, p - 1n)[0] !== 1n); // , bo chcemy żeby k miało odwrotność modularną
  // obliczamy r = g^k mod p
  const r = modPow(g, k, p);
  // obliczamy odwrotność modularną k modulo (p-1)
  const kInv = modInv(k, p - 1n);
  // obliczamy s = (h - x*r) * k^(-1) mod (p-1)
  const s = ((h - x * r) * kInv) % (p - 1n);
  // podpis (r, s), dbając o dodatniość s
  return { r, s: (s + (p - 1n)) % (p - 1n) };
}
// k ma odwrotność modulo p-1

export async function verify(
  data: ArrayBuffer,
  sig: ElGamalSignature,
  keys: ElGamalKeys
): Promise<boolean> {
  const { p, g, y } = keys; // wyciągamy parametry klucza publicznego
  const { r, s } = sig; // wyciągamy podpis
  if (r <= 0n || r >= p) return false; // sprawdzamy poprawność r
  const h = await hashMessage(data); // Haszujemy dane
  // obliczamy lewą stronę równania: y^r * r^s mod p
  const v1 = (modPow(y, r, p) * modPow(r, s, p)) % p;
  // obliczamy prawą stronę równania: g^h mod p
  const v2 = modPow(g, h, p);
  // jeśli obie strony są równe podpis jest poprawny
  return v1 === v2;
}
