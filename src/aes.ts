// aes.ts
import { AddRoundKey } from './AddRoundKey';
import { SubBytes } from './SubBytes';
import { ShiftRows } from './ShiftRows';
import { MixColumns } from './MixColumns';
import { InvSubBytes } from './InvSubBytes';
import { InvShiftRows } from './InvShiftRows';
import { InvMixColumns } from './InvMixColumns';
import { KeyExpansion } from './KeyExpansion';

// Konwersja tekstu na tablicę bajtów
export function stringToBytes(str: string): number[] {
    if (str.match(/^[0-9a-fA-F]+$/)) {
        // Jeśli to hex string, konwertuj bezpośrednio
        return hexToBytes(str);
    } else {
        // Dla zwykłego tekstu użyj TextEncoder dla obsługi polskich znaków
        const encoder = new TextEncoder();
        return Array.from(encoder.encode(str));
    }
}

// Konwersja tablicy bajtów na tekst
export function bytesToString(bytes: number[]): string {
    try {
        // Najpierw próbujemy zdekodować jako UTF-8
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(new Uint8Array(bytes));
        // Sprawdź czy tekst zawiera czytelne znaki
        if (text.match(/^[\x20-\x7E\u00A0-\uFFFF]+$/)) {
            return text;
        }
        throw new Error('Not a valid text');
    } catch (e) {
        // Jeśli nie udało się zdekodować jako tekst, zwróć hex
        return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}
// Konwersja hex stringa na tablicę bajtów
export function hexToBytes(hex: string): number[] {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
}

// Konwersja tablicy bajtów na hex string
export function bytesToHex(bytes: number[]): string {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Konwersja State na tablicę bajtów
export function stateToBytes(state: number[][]): number[] {
    const result = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result.push(state[j][i]);
        }
    }
    return result;
}

// Konwersja tablicy bajtów na State
export function bytesToState(bytes: number[]): number[][] {
    const state = Array(4).fill(0).map(() => Array(4).fill(0));
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            state[j][i] = bytes[i * 4 + j];
        }
    }
    return state;
}

// Dodanie paddingu PKCS7
function addPKCS7Padding(data: number[]): number[] {
    const blockSize = 16;
    const paddingLength = blockSize - (data.length % blockSize);
    return [...data, ...Array(paddingLength).fill(paddingLength)];
}

// Usunięcie paddingu PKCS7
function removePKCS7Padding(data: number[]): number[] {
    const paddingLength = data[data.length - 1];
    if (paddingLength > 16 || paddingLength < 1) {
        throw new Error('Invalid padding');
    }
    // Sprawdzenie czy padding jest poprawny
    for (let i = data.length - paddingLength; i < data.length; i++) {
        if (data[i] !== paddingLength) {
            throw new Error('Invalid padding');
        }
    }
    return data.slice(0, -paddingLength);
}

// Szyfrowanie bloku
export function encryptBlock(state: number[][], w: number[][], Nr: number): number[][] {
    state = AddRoundKey(state, w.slice(0, 4));

    for (let round = 1; round < Nr; round++) {
        state = SubBytes(state);
        state = ShiftRows(state);
        state = MixColumns(state);
        state = AddRoundKey(state, w.slice(round * 4, (round + 1) * 4));
    }

    state = SubBytes(state);
    state = ShiftRows(state);
    state = AddRoundKey(state, w.slice(Nr * 4, (Nr + 1) * 4));

    return state;
}

// Deszyfrowanie bloku
export function decryptBlock(state: number[][], w: number[][], Nr: number): number[][] {
    state = AddRoundKey(state, w.slice(Nr * 4, (Nr + 1) * 4));

    for (let round = Nr - 1; round > 0; round--) {
        state = InvShiftRows(state);
        state = InvSubBytes(state);
        state = AddRoundKey(state, w.slice(round * 4, (round + 1) * 4));
        state = InvMixColumns(state);
    }

    state = InvShiftRows(state);
    state = InvSubBytes(state);
    state = AddRoundKey(state, w.slice(0, 4));

    return state;
}

// Główna funkcja szyfrująca
export function encrypt(input: string, key: string, keySize: number): string {
    const Nk = keySize / 32;
    const Nr = Nk + 6;
    
    // Konwersja klucza z hex na bajty
    const keyBytes = hexToBytes(key);
    
    // Rozszerzenie klucza
    const w = KeyExpansion(keyBytes, keySize);

    // Konwersja wejścia na bajty
    let inputBytes: number[];
    if (input.match(/^[0-9a-fA-F]+$/)) {
        // Jeśli input jest już w formacie hex
        inputBytes = hexToBytes(input);
    } else {
        // Jeśli input jest zwykłym tekstem
        inputBytes = stringToBytes(input);
    }

    // Dodanie paddingu PKCS7
    const paddedInput = addPKCS7Padding(inputBytes);

    // Szyfrowanie bloków
    const encrypted = [];
    for (let i = 0; i < paddedInput.length; i += 16) {
        const block = paddedInput.slice(i, i + 16);
        const state = bytesToState(block);
        const encryptedState = encryptBlock(state, w, Nr);
        encrypted.push(...stateToBytes(encryptedState));
    }

    // Zwróć zaszyfrowane dane jako hex string
    return bytesToHex(encrypted);
}

// Główna funkcja deszyfrująca
export function decrypt(input: string, key: string, keySize: number): string {
    const Nk = keySize / 32;
    const Nr = Nk + 6;
    
    // Konwersja klucza z hex na bajty
    const keyBytes = hexToBytes(key);
    
    // Rozszerzenie klucza
    const w = KeyExpansion(keyBytes, keySize);

    // Konwersja wejścia z hex na bajty
    const inputBytes = hexToBytes(input);

    // Deszyfrowanie bloków
    const decrypted = [];
    for (let i = 0; i < inputBytes.length; i += 16) {
        const block = inputBytes.slice(i, i + 16);
        const state = bytesToState(block);
        const decryptedState = decryptBlock(state, w, Nr);
        decrypted.push(...stateToBytes(decryptedState));
    }

    try {
        // Usuń padding
        const unpaddedDecrypted = removePKCS7Padding(decrypted);

        // Spróbuj przekonwertować na tekst
        return bytesToString(unpaddedDecrypted);
    } catch (e) {
        // Jeśli nie można przekonwertować na tekst lub padding jest niepoprawny,
        // zwróć hex string
        return bytesToHex(decrypted);
    }
}