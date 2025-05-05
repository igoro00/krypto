/**
 * Wykonuje cykliczne przesunięcie bajtów w słowie (RotWord) dla algorytmu AES
 * @param input - Tablica 4 bajtów (32-bitowe słowo)
 * @returns Przesunięta tablica bajtów
 * 
 * Operacja RotWord:
 * - Przesuwa bajty w słowie cyklicznie w lewo
 * - Np. dla [a0, a1, a2, a3] wynikiem będzie [a1, a2, a3, a0]
 * - Używana podczas rozszerzania klucza (Key Expansion)
 * - Wymagana dokładnie 4-elementowa tablica wejściowa
 */
export function RotWord(input: number[]) {
    let out = [...input];
    // Usuwamy i pobieramy pierwszy element tablicy
    let first = out.shift();
    
    if (first === undefined) {
        throw new Error("First undefined");
    }

    // Dodajemy pierwszy element na koniec tablicy
    out.push(first);

    return out;
}