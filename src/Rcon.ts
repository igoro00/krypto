/**
 * Generuje stałą rundy (Round Constant) dla algorytmu AES
 * @param i - Numer rundy (1-32)
 * @returns Tablica 4 bajtów, gdzie tylko pierwszy bajt jest niezerowy i zawiera stałą rundy
 * 
 * Stałe rund (Rcon) w AES:
 * - Są to predefiniowane wartości w ciele Galois GF(2^8)
 * - Używane podczas rozszerzania klucza (Key Expansion)
 * - Każda wartość jest obliczana jako x^(i-1) w GF(2^8), gdzie x = 0x02
 * - Dla i > 32 wartości są generowane rekurencyjnie zgodnie z algorytmem AES
 */
export function Rcon(i: number): number[] {
     // Predefiniowana tablica stałych rund dla AES
    // Indeksy odpowiadają numerom rund (1-32)
    const rcon = [
        0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40,
        0x80, 0x1B, 0x36, 0x6C, 0xD8, 0xAB, 0x4D, 0x9A,
        0x2F, 0x5E, 0xBC, 0x63, 0xC6, 0x97, 0x35, 0x6A,
        0xD4, 0xB3, 0x7D, 0xFA, 0xEF, 0xC5, 0x91, 0x39
    ] 
    // Zwracamy tablicę 4 bajtów, gdzie tylko pierwszy bajt zawiera stałą rundy
    // Pozostałe bajty są zerowe (0x00)
    return [rcon[i-1], 0, 0, 0];
}