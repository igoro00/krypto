import { galoisMul } from "./utils";

/**
 * Wykonuje odwrotną operację mieszania kolumn (InvMixColumns) w algorytmie AES
 * Odwraca efekt operacji MixColumns z procesu szyfrowania
 * @param state - 16-bajtowy stan AES (4x4 macierz w Uint8Array)
 * @returns Przetworzony stan po odwróconym mieszaniu kolumn
 */
export function InvMixColumns(state: Uint8Array): Uint8Array {
    // Tworzymy nową tablicę na wynik (aby uniknąć modyfikacji podczas obliczeń)
    const result = new Uint8Array(16);

    // Przetwarzamy każdą kolumnę (4 kolumny)
    for (let c = 0; c < 4; c++) {
        // Obliczanie nowej wartości dla każdego bajta w kolumnie:
        // Każdy bajt jest kombinacją 4 bajtów z tej samej kolumny
        // Mnożenie odbywa się w polu Galois (GF(2^8)) przy użyciu stałych z AES
        
        // Pierwszy bajt w kolumnie (wiersz 0)
        result[0 * 4 + c] =
            galoisMul(0x0e, state[0 * 4 + c]) ^  // Mnożenie przez 0x0e
            galoisMul(0x0b, state[1 * 4 + c]) ^  // Mnożenie przez 0x0b
            galoisMul(0x0d, state[2 * 4 + c]) ^  // Mnożenie przez 0x0d
            galoisMul(0x09, state[3 * 4 + c]);   // Mnożenie przez 0x09

        // Drugi bajt w kolumnie (wiersz 1)
        result[1 * 4 + c] =
            galoisMul(0x09, state[0 * 4 + c]) ^
            galoisMul(0x0e, state[1 * 4 + c]) ^
            galoisMul(0x0b, state[2 * 4 + c]) ^
            galoisMul(0x0d, state[3 * 4 + c]);

        // Trzeci bajt w kolumnie (wiersz 2)
        result[2 * 4 + c] =
            galoisMul(0x0d, state[0 * 4 + c]) ^
            galoisMul(0x09, state[1 * 4 + c]) ^
            galoisMul(0x0e, state[2 * 4 + c]) ^
            galoisMul(0x0b, state[3 * 4 + c]);
        
        // Czwarty bajt w kolumnie (wiersz 3)
        result[3 * 4 + c] =
            galoisMul(0x0b, state[0 * 4 + c]) ^
            galoisMul(0x0d, state[1 * 4 + c]) ^
            galoisMul(0x09, state[2 * 4 + c]) ^
            galoisMul(0x0e, state[3 * 4 + c]);
    }

    // Zastępujemy oryginalny stan obliczonym wynikiem
    state.set(result);

    return state;
}
