/**
 * Konwertuje Uint8Array na string Base64
 * @param buffer - Tablica bajtów do konwersji
 * @returns Promise z zakodowanym stringiem Base64
 * 
 * Uwagi:
 * - Wykorzystuje FileReader do konwersji przez DataURL
 * - Usuwa prefix 'data:' z wyniku
 */
export async function bufferToBase64(buffer: Uint8Array): Promise<string> {
    const base64url = await new Promise<string>(r => {
      const reader = new FileReader()
      reader.onload = () => r(reader.result as string)
      reader.readAsDataURL(new Blob([buffer]))
    });
    // Obcinamy część 'data:application/octet-stream;base64,'  
    return base64url.slice(base64url.indexOf(',') + 1);
}

/**
 * Konwertuje string Base64 na Uint8Array
 * @param b64 - Zakodowany string Base64
 * @returns Promise z tablicą bajtów
 * 
 * Uwagi:
 * - Wykorzystuje fetch i DataURL do konwersji
 * - Dodaje prefix 'application/octet-binary' dla poprawności MIME
 */
export async function base64ToBuffer(b64:string): Promise<Uint8Array> {
    var dataUrl = "data:application/octet-binary;base64," + b64;

    const res = await fetch(dataUrl)
    const arrayBuffer = await res.arrayBuffer();
    return new Uint8Array(arrayBuffer);        
}

/**
 * Przesuwa bajty w tablicy w lewo (cyklicznie)
 * @param input - Tablica 4 bajtów
 * @returns Przesunięta tablica (modyfikuje oryginał)
 * 
 * Przykład:
 * [1,2,3,4] -> [2,3,4,1]
 */
export function shiftLeft(input: Uint8Array): Uint8Array {
    const temp = input[0]; // Zapamiętaj pierwszy element
    input[0] = input[1]; // Przesuń elementy w lewo
    input[1] = input[2];
    input[2] = input[3];
    input[3] = temp;  // Ostatni element staje się pierwszym

    return input;
}

/**
 * Przesuwa bajty w tablicy w prawo (cyklicznie)
 * @param input - Tablica 4 bajtów
 * @returns Przesunięta tablica (modyfikuje oryginał)
 * 
 * Przykład:
 * [1,2,3,4] -> [4,1,2,3]
 */
export function shiftRight(input: Uint8Array): Uint8Array {
    const temp = input[3]; // Zapamiętaj ostatni element
    input[3] = input[2];  // Przesuń elementy w prawo
    input[2] = input[1];
    input[1] = input[0];
    input[0] = temp; // Pierwszy element staje się ostatnim
    return input;
}

/**
 * Zamienia miejscami połowy tablicy (pierwsze 2 bajty z ostatnimi 2)
 * @param input - Tablica 4 bajtów
 * @returns Przetworzona tablica (modyfikuje oryginał)
 * 
 * Przykład:
 * [1,2,3,4] -> [3,4,1,2]
 */
export function switchHalves(input: Uint8Array): Uint8Array {
    // Zapamiętaj pierwszą połowę
    const a = input[0];
    const b = input[1];

    input[0] = input[2]; // Zamień połowy
    input[1] = input[3];
    input[2] = a;
    input[3] = b;
    return input;
}

export function log(...args: any[]) {
    const VERBOSE = false;
    if(VERBOSE){
        console.log(...args);
    }
}

/**
 * Mnożenie w ciele Galois (GF(2^8)) dla algorytmu AES
 * @param a - Mnożnik (2, 3, 9, 11, 13, 14)
 * @param b - Mnożna (bajt 0-255)
 * @returns Wynik mnożenia modulo nierozkładalny wielomian x^8 + x^4 + x^3 + x + 1
 * 
 * Specjalne przypadki zoptymalizowane dla AES:
 * - Mnożenie przez 1, 2 i 3 są zoptymalizowane
 * - Dla innych wartości używa rozkładu na potęgi 2
 */
export function galoisMul(a: number, b: number): number {
    let result = 0;
    
    // Optymalizacja częstych przypadków w AES
    if (a === 1) return b;
    if (a === 2) {
      let temp = b << 1; // Przesunięcie bitowe w lewo (mnożenie przez 2)
      if ((b & 0x80) !== 0) // Jeśli najstarszy bit = 1 (przekroczenie GF(2⁸)?)
        temp ^= 0x1b; // Modulo x^8 + x^4 + x^3 + x + 1
      return temp & 0xff; // Maskowanie do bajta (AND),  obcina wszystko poza ostatnimi 8 bitami
    }
    if (a === 3) return galoisMul(2, b) ^ b;  // 3*b = (2*b) XOR b
    
    // dla większych wartości (0x09, 0x0b, 0x0d, 0x0e) używamy rozkładu na potęgi 2
     // Ogólny przypadek - rozkład na potęgi 2
    let temp = b;
    for (let i = 0; i < 8; i++) {
      if ((a & (1 << i)) !== 0) { // Jeśli bit jest ustawiony
        result ^= temp; // Dodaj odpowiednią potęgę 2*b
      }
      
       // Oblicz 2 * temp dla następnej iteracji
      const highBit = (temp & 0x80);
      temp <<= 1;
      if (highBit !== 0) {
        temp ^= 0x1b; // Redukcja modulo
      }
      temp &= 0xff; // Maskowanie do bajta
    }
    
    return result;
}