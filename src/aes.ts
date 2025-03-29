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
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return Array.from(bytes);
}

// Konwersja tablicy bajtów na tekst
export function bytesToString(bytes: number[]): string {
    return String.fromCharCode(...bytes);
}

// Konwersja hex stringa na tablicę bajtów
export function hexToBytes(hex: string): number[] {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
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

// Szyfrowanie bloku
export function encryptBlock(state: number[][], w: number[][], Nr: number): number[][] {
    // Początkowe dodanie klucza rundowego
    state = AddRoundKey(state, w.slice(0, 4));

    // Nr-1 standardowych rund
    for (let round = 1; round < Nr; round++) {
        state = SubBytes(state);
        state = ShiftRows(state);
        state = MixColumns(state);
        state = AddRoundKey(state, w.slice(round * 4, (round + 1) * 4));
    }

    // Ostatnia runda (bez MixColumns)
    state = SubBytes(state);
    state = ShiftRows(state);
    state = AddRoundKey(state, w.slice(Nr * 4, (Nr + 1) * 4));

    return state;
}

// Deszyfrowanie bloku
export function decryptBlock(state: number[][], w: number[][], Nr: number): number[][] {
    // Początkowe dodanie ostatniego klucza rundowego
    state = AddRoundKey(state, w.slice(Nr * 4, (Nr + 1) * 4));

    // Nr-1 standardowych rund
    for (let round = Nr - 1; round > 0; round--) {
        state = InvShiftRows(state);
        state = InvSubBytes(state);
        state = AddRoundKey(state, w.slice(round * 4, (round + 1) * 4));
        state = InvMixColumns(state);
    }

    // Ostatnia runda
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
    const inputBytes = stringToBytes(input);

    // Dodanie paddingu PKCS7
    const paddingLength = 16 - (inputBytes.length % 16);
    const paddedInput = [...inputBytes, ...Array(paddingLength).fill(paddingLength)];

    // Szyfrowanie bloków
    const encrypted = [];
    for (let i = 0; i < paddedInput.length; i += 16) {
        const block = paddedInput.slice(i, i + 16);
        const state = bytesToState(block);
        const encryptedState = encryptBlock(state, w, Nr);
        encrypted.push(...stateToBytes(encryptedState));
    }

    // Konwersja zaszyfrowanych bajtów na hex string
    return encrypted.map(b => b.toString(16).padStart(2, '0')).join('');
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

    // Usunięcie paddingu PKCS7
    const paddingLength = decrypted[decrypted.length - 1];
    const unpaddedDecrypted = decrypted.slice(0, -paddingLength);

    // Konwersja odszyfrowanych bajtów na string
    return bytesToString(unpaddedDecrypted);
}