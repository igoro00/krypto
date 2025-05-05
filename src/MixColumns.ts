import { galoisMul } from "./utils";

/**
 * Wykonuje operację mieszania kolumn (MixColumns) w algorytmie AES
 * @param state - 16-bajtowy stan AES (4x4 macierz w Uint8Array)
 * @returns Przetworzony stan po mieszaniu kolumn
 * 
 * Operacja MixColumns:
 * - Każda kolumna w macierzy stanu jest traktowana jako wielomian w ciele Galois GF(2^8)
 * - Mnożenie macierzowe z użyciem stałej macierzy mieszania
 * - Współczynniki macierzy: 2, 3, 1 (1 jest pomijane w implementacji)
 * - Mnożenie realizowane przez funkcję galoisMul
 */
export function MixColumns(state: Uint8Array): Uint8Array {
    const result = new Uint8Array(16);
    
    // Przetwarzamy każdą kolumnę (4 kolumny)
    for (let c = 0; c < 4; c++) {
        // Obliczanie nowej wartości dla każdego bajta w kolumnie:
        // Każdy bajt jest kombinacją 4 bajtów z tej samej kolumny
        // Mnożenie odbywa się w polu Galois (GF(2^8)) przy użyciu stałych z AES
        
        // Pierwszy bajt w kolumnie (wiersz 0)
        result[0*4+c] = 
        galoisMul(2, state[0*4+c]) ^ // Mnożenie przez 2
        galoisMul(3, state[1*4+c]) ^ // Mnożenie przez 3
        state[2*4+c] ^  // Bajt pomnożony przez 1 (bez zmian)
        state[3*4+c];   // Bajt pomnożony przez 1 (bez zmian)

        // Drugi bajt w kolumnie (wiersz 1)
        result[1*4+c] =
         state[0*4+c] ^ // Bajt pomnożony przez 1
         galoisMul(2, state[1*4+c]) ^  // Mnożenie przez 2
         galoisMul(3, state[2*4+c]) ^  // Mnożenie przez 3
         state[3*4+c];  // Bajt pomnożony przez 1

        result[2*4+c] = 
        state[0*4+c] ^ // Bajt pomnożony przez 1
        state[1*4+c] ^ // Bajt pomnożony przez 1
        galoisMul(2, state[2*4+c]) ^   // Mnożenie przez 2
        galoisMul(3, state[3*4+c]);     // Mnożenie przez 3

        result[3*4+c] = 
        galoisMul(3, state[0*4+c]) ^ // Mnożenie przez 3
        state[1*4+c] ^  // Bajt pomnożony przez 1
        state[2*4+c] ^  // Bajt pomnożony przez 1
        galoisMul(2, state[3*4+c]); // Mnożenie przez 2
    }
    
    // Zastępujemy oryginalny stan obliczonym wynikiem
    state.set(result);
    
    return state;
}