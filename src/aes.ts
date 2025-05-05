import { AddRoundKey } from './AddRoundKey';
import { SubBytes } from './SubBytes';
import { ShiftRows } from './ShiftRows';
import { MixColumns } from './MixColumns';
import { InvSubBytes } from './InvSubBytes';
import { InvShiftRows } from './InvShiftRows';
import { InvMixColumns } from './InvMixColumns';
import { keyExpansion } from './KeyExpansion';
import { log } from './utils';

/**
 * Konwertuje string hex na tablicę bajtów
 * @param hex - String w formacie hex (np. "1a2b3c")
 * @returns Tablica bajtów
 */
export function hexToBytes(hex: string): number[] {
    const bytes = [];
    // Przetwarzaj string po 2 znaki (1 bajt)
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
}

/**
 * Transponuje blok danych (zamienia wiersze z kolumnami)
 * @param bytes - Blok danych do transpozycji (16 bajtów)
 * @returns Przetransponowany blok
 */
export function transposeBlock(bytes: Uint8Array): Uint8Array {
    // Zamienia miejscami elementy symetryczne względem przekątnej
    for (let row = 0; row < 3; row++) {
        for (let col = row+1; col < 4; col++) {
            const tmp = bytes[row * 4 + col];
            bytes[row * 4 + col] = bytes[col * 4 + row];
            bytes[col * 4 + row] = tmp;
        }
    }
    return bytes;
}

/**
 * Dodaje padding PKCS#7 do danych
 * @param data - Dane do paddingu
 * @returns Dopełnione dane
 */
export function addPKCS7Padding(data: Uint8Array): Uint8Array {
    log('Dane wejściowe przed paddingiem:', data);
    log('Długość danych przed paddingiem:', data.length);
    
    const blockSize = 16;
    // Oblicz długość paddingu
    const paddingLength = blockSize - (data.length % blockSize);
    
    log("Obliczona długość paddingu:", paddingLength);
    
    const paddedData = new Uint8Array(data.length + paddingLength);
    paddedData.fill(paddingLength); // Wypełnij paddingiem
    paddedData.set(data); // Skopiuj oryginalne dane
    
    log('Dane po dodaniu paddingu:', paddedData);
    log('Długość danych po paddingu:', paddedData.length);
    log('Ostatni bajt (wartość paddingu):', paddedData[paddedData.length - 1]);
    
    // Walidacja paddingu
    const isValid = paddedData.slice(-paddingLength).every(b => b === paddingLength);
    log('Padding poprawny:', isValid);
    
    return paddedData;
}

/**
 * Usuwa padding PKCS#7 z danych
 * @param data - Dopełnione dane
 * @returns Dane bez paddingu
 * @throws Error jeśli padding jest nieprawidłowy
 */
export function removePKCS7Padding(data: Uint8Array): Uint8Array {
    log('Dane przed usunięciem paddingu:', data);
    log('Długość danych przed usunięciem paddingu:', data.length);
    
    // Walidacja długości danych
    if (data.length === 0 || data.length % 16 !== 0) {
        console.error('Nieprawidłowa długość danych:', data.length);
        throw new Error('Invalid data length');
    }
    
    // Ostatni bajt określa długość paddingu
    const paddingLength = data[data.length - 1];
    log('Wykryta długość paddingu:', paddingLength);
    
    // Walidacja wartości paddingu
    if (paddingLength > 16 || paddingLength < 1) {
        console.error('Nieprawidłowa wartość paddingu:', paddingLength);
        throw new Error('Invalid padding value');
    }
    
    // Sprawdź poprawność wszystkich bajtów paddingu
    let isValid = true;
    for (let i = data.length - paddingLength; i < data.length; i++) {
        if (data[i] !== paddingLength) {
            console.error(`Nieprawidłowy padding na pozycji ${i}: ${data[i]} !== ${paddingLength}`);
            isValid = false;
        }
    }
    
    if (!isValid) {
        throw new Error('Invalid padding');
    }

    // Zwróć dane bez paddingu
    const unpaddedData = data.subarray(0, data.length-paddingLength);
    log('Dane po usunięciu paddingu:', unpaddedData);
    log('Długość danych po usunięciu paddingu:', unpaddedData.length);
    
    return unpaddedData;
}

/**
 * Szyfruje pojedynczy blok AES
 * @param state - Blok do zaszyfrowania (16 bajtów)
 * @param w - Rozszerzony klucz
 * @param Nr - Liczba rund
 * @returns Zaszyfrowany blok
 */
export function encryptBlock(state: Uint8Array, w: Uint8Array, Nr: number): Uint8Array {
    // Początkowe dodanie klucza
    state = AddRoundKey(state, w.subarray(0*4, 4*4));

    // Główne rundy
    for (let round = 1; round < Nr; round++) {
        state = SubBytes(state);
        state = ShiftRows(state);
        state = MixColumns(state);
        state = AddRoundKey(state, w.subarray(round * 4 * 4, (round + 1) * 4 * 4));
    }

    // Ostatnia runda (bez MixColumns)
    state = SubBytes(state);
    state = ShiftRows(state);
    state = AddRoundKey(state, w.subarray(Nr * 4 * 4, (Nr + 1) * 4 * 4));

    return state;
}

/**
 * Deszyfruje pojedynczy blok AES
 * @param state - Blok do odszyfrowania (16 bajtów)
 * @param w - Rozszerzony klucz
 * @param Nr - Liczba rund
 * @returns Odszyfrowany blok
 */
export function decryptBlock(state: Uint8Array, w: Uint8Array, Nr: number): Uint8Array {
    // Początkowe dodanie klucza
    state = AddRoundKey(state, w.subarray(Nr * 4*4, (Nr + 1) * 4*4));

    // Główne rundy
    for (let round = Nr - 1; round > 0; round--) {
        state = InvShiftRows(state);
        state = InvSubBytes(state);
        state = AddRoundKey(state, w.subarray(round * 4*4, (round + 1) * 4*4));
        state = InvMixColumns(state);
    }

    // Ostatnia runda (bez InvMixColumns)
    state = InvShiftRows(state);
    state = InvSubBytes(state);
    state = AddRoundKey(state, w.slice(0, 16));

    return state;
}

/**
 * Szyfruje dane algorytmem AES
 * @param input - Dane do zaszyfrowania
 * @param keyBytes - Klucz szyfrowania
 * @param progressCB - Callback informujący o postępie
 * @returns Zaszyfrowane dane
 */
export function encrypt(input: Uint8Array, keyBytes: Uint8Array, progressCB?:(i:number, total:number)=>void): Uint8Array {
    const start = performance.now()

    // Oblicz liczbę rund na podstawie długości klucza
    const Nr = (keyBytes.length / 4) + 6;
    
    // Rozszerz klucz
    const w = keyExpansion(keyBytes);
    
    // Dodaj padding do danych
    const paddedInput = addPKCS7Padding(input);
    
    // Przetwarzaj dane blokami po 16 bajtów
    for (let i = 0; i < paddedInput.length; i += 16) {
        const block = paddedInput.subarray(i, i + 16);
        
        // Transpozycja, szyfrowanie i ponowna transpozycja
        transposeBlock(block);
        encryptBlock(block, w, Nr);
        transposeBlock(block);
        
        // Raportuj postęp
        if (progressCB && (i % 2048 == 0)) {
            progressCB(i, paddedInput.length);
        }
    }
    
    const end = performance.now()
    console.log("<h1>Czas szyfrowania: </h1>", end-start)
    return paddedInput;
}

/**
 * Deszyfruje dane algorytmem AES
 * @param inputBytes - Dane do odszyfrowania
 * @param keyBytes - Klucz szyfrowania
 * @param progressCB - Callback informujący o postępie
 * @returns Odszyfrowane dane
 */
export function decrypt(inputBytes: Uint8Array, keyBytes: Uint8Array, progressCB?:(i:number, total:number)=>void): Uint8Array {
    const Nk = keyBytes.length/4;
    const Nr = Nk + 6;
    
    // Rozszerz klucz
    const w = keyExpansion(keyBytes);
    
    // Walidacja długości danych wejściowych
    if (inputBytes.length % 16 !== 0) {
        console.error('Nieprawidłowa długość danych wejściowych:', inputBytes.length);
        throw new Error('Input length must be multiple of 16 bytes');
    }
    
    // Przetwarzaj dane blokami po 16 bajtów
    for (let i = 0; i < inputBytes.length; i += 16) {
        const block = inputBytes.subarray(i, i + 16);
        
        // Transpozycja, deszyfrowanie i ponowna transpozycja
        transposeBlock(block);
        decryptBlock(block, w, Nr);
        transposeBlock(block);

        // Raportuj postęp
        if (progressCB && (i % 2048 == 0)) {
            progressCB(i, inputBytes.length);
        }   
    }
    
    try {
        // Spróbuj usunąć padding
        log('Próba usunięcia paddingu PKCS7...');
        const result = removePKCS7Padding(inputBytes);
        log('Wynik deszyfrowania:', result);
        return result;
    } catch (e) {
        console.error('Błąd podczas przetwarzania odszyfrowanych danych:', e);
        return inputBytes;
    }
}