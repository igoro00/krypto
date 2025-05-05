/**
 * Generuje losowy klucz kryptograficzny o podanej długości w bitach
 * @param n - Długość klucza w bitach (np. 256 dla klucza 256-bitowego)
 * @returns Klucz w postaci binarnej (Uint8Array)
 */
export function generateKey(n: number): Uint8Array {
    // Oblicz liczbę bajtów
    // Utwórz tablicę typu Uint8Array o odpowiednim rozmiarze
    const key = new Uint8Array(n / 8);
    // Wypełnij tablicę kryptograficznie bezpiecznymi losowymi wartościami
    crypto.getRandomValues(key);
    return key;  
}

/**
 * Konwertuje klucz w postaci binarnej na reprezentację szesnastkową (hex)
 * @param key - Klucz w postaci binarnej (Uint8Array)
 * @returns Klucz jako string w formacie heksadecymalnym
 */
export function bytesToHex(key: Uint8Array): string {
    return Array.from(key) // Konwertuj Uint8Array na zwykłą tablicę
        .map(byte => byte.toString(16) // Konwertuj bajt na string szesnastkowy
        .padStart(2, '0')) // Upewnij się, że zawsze są 2 znaki (dodaj 0 z przodu jeśli potrzeba)
        .join(''); // Połącz wszystkie bajty w jeden ciąg znaków
}