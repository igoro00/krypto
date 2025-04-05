import { AddRoundKey } from './AddRoundKey';
import { SubBytes } from './SubBytes';
import { ShiftRows } from './ShiftRows';
import { MixColumns } from './MixColumns';
import { InvSubBytes } from './InvSubBytes';
import { InvShiftRows } from './InvShiftRows';
import { InvMixColumns } from './InvMixColumns';
import { keyExpansion } from './KeyExpansion';
import { log } from './utils';

// konwersja tekstu na tablicę bajtów
export function stringToBytes(str: string): number[] {
    if (str.match(/^[0-9a-fA-F]+$/)) {
        // jeśli to hex string, konwertuj bezpośrednio
        return hexToBytes(str);
    } else {
        // dla zwykłego tekstu użyj TextEncoder dla obsługi polskich znaków
        const encoder = new TextEncoder();
        return Array.from(encoder.encode(str));
    }
}

// konwersja tablicy bajtów na tekst
export function bytesToString(bytes: number[]): string {
    try {
        // najpierw próbujemy zdekodować jako UTF-8
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(new Uint8Array(bytes));
        // sprawdź czy tekst zawiera czytelne znaki
        if (text.match(/^[\x20-\x7E\u00A0-\uFFFF]+$/)) {
            return text;
        }
        throw new Error('Not a valid text');
    } catch (e) {
        // jeśli nie udało się zdekodować jako tekst, zwróć hex
        return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}
// konwersja hex stringa na tablicę bajtów
export function hexToBytes(hex: string): number[] {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
}

// konwersja tablicy bajtów na hex string
export function bytesToHex(bytes: number[]): string {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

// konwersja State na tablicę bajtów
export function stateToBytes(state: number[][]): number[] {
    const result = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result.push(state[j][i]);
        }
    }
    return result;
}

// konwersja tablicy bajtów na State
export function transposeBlock(bytes: Uint8Array): Uint8Array {
    for (let row = 0; row < 3; row++) {
        for (let col = row+1; col < 4; col++) {
            const tmp = bytes[row * 4 + col];
            bytes[row * 4 + col] = bytes[col * 4 + row];
            bytes[col * 4 + row] = tmp;
        }
    }
    return bytes;
}

export function addPKCS7Padding(data: Uint8Array): Uint8Array {
    log('Dane wejściowe przed paddingiem:', data);
    log('Długość danych przed paddingiem:', data.length);
    
    const blockSize = 16;
    const paddingLength = blockSize - (data.length % blockSize);
    
    log("Obliczona długość paddingu:", paddingLength);
    
    const paddedData = new Uint8Array(data.length + paddingLength);
    paddedData.fill(paddingLength); // wypełnij całość paddingLength
    paddedData.set(data); // nadpisz pierwsze data.length bajtów
    
    log('Dane po dodaniu paddingu:', paddedData);
    log('Długość danych po paddingu:', paddedData.length);
    log('Ostatni bajt (wartość paddingu):', paddedData[paddedData.length - 1]);
    
    const isValid = paddedData.slice(-paddingLength).every(b => b === paddingLength);
    log('Padding poprawny:', isValid);
    
    return paddedData;
}

export function removePKCS7Padding(data: Uint8Array): Uint8Array {
    log('Dane przed usunięciem paddingu:', data);
    log('Długość danych przed usunięciem paddingu:', data.length);
    
    if (data.length === 0 || data.length % 16 !== 0) {
        console.error('Nieprawidłowa długość danych:', data.length);
        throw new Error('Invalid data length');
    }
    
    const paddingLength = data[data.length - 1];
    log('Wykryta długość paddingu:', paddingLength);
    
    if (paddingLength > 16 || paddingLength < 1) {
        console.error('Nieprawidłowa wartość paddingu:', paddingLength);
        throw new Error('Invalid padding value');
    }
    
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
    
    const unpaddedData = data.subarray(0, data.length-paddingLength);
    log('Dane po usunięciu paddingu:', unpaddedData);
    log('Długość danych po usunięciu paddingu:', unpaddedData.length);
    
    return unpaddedData;
}

export function encryptBlock(state: Uint8Array, w: Uint8Array, Nr: number): Uint8Array {
    state = AddRoundKey(state, w.subarray(0*4, 4*4));

    for (let round = 1; round < Nr; round++) {
        state = SubBytes(state);
        state = ShiftRows(state);
        state = MixColumns(state);
        state = AddRoundKey(state, w.subarray(round * 4 * 4, (round + 1) * 4 * 4));
    }

    state = SubBytes(state);
    state = ShiftRows(state);
    state = AddRoundKey(state, w.subarray(Nr * 4 * 4, (Nr + 1) * 4 * 4));

    return state;
}

export function decryptBlock(state: Uint8Array, w: Uint8Array, Nr: number): Uint8Array {
    state = AddRoundKey(state, w.subarray(Nr * 4*4, (Nr + 1) * 4*4));

    for (let round = Nr - 1; round > 0; round--) {
        state = InvShiftRows(state);
        state = InvSubBytes(state);
        state = AddRoundKey(state, w.subarray(round * 4*4, (round + 1) * 4*4));
        state = InvMixColumns(state);
    }

    state = InvShiftRows(state);
    state = InvSubBytes(state);
    state = AddRoundKey(state, w.slice(0, 16));

    return state;
}
export function encrypt(input: Uint8Array, keyBytes: Uint8Array, progressCB?:(i:number, total:number)=>void): Uint8Array {
    const start = performance.now()

    const Nr = (keyBytes.length / 4) + 6;
    
    // rozszerzenie klucza
    const w = keyExpansion(keyBytes);
    
    const paddedInput = addPKCS7Padding(input);
    
    for (let i = 0; i < paddedInput.length; i += 16) {
        const block = paddedInput.subarray(i, i + 16);
        
        transposeBlock(block);
        encryptBlock(block, w, Nr);
        transposeBlock(block);
        
        if (progressCB && (i % 2048 == 0)) {
            progressCB(i, paddedInput.length);
        }
    }
    
    const end = performance.now()
    console.log("<h1>Czas szyfrowania: </h1>", end-start)
    return paddedInput;
}


export function decrypt(inputBytes: Uint8Array, keyBytes: Uint8Array, progressCB?:(i:number, total:number)=>void): Uint8Array {
    const Nk = keyBytes.length/4;
    const Nr = Nk + 6;
    
    // Rozszerzenie klucza
    const w = keyExpansion(keyBytes);
    
    if (inputBytes.length % 16 !== 0) {
        console.error('Nieprawidłowa długość danych wejściowych:', inputBytes.length);
        throw new Error('Input length must be multiple of 16 bytes');
    }
    
    // Deszyfrowanie bloków
    for (let i = 0; i < inputBytes.length; i += 16) {
        const block = inputBytes.subarray(i, i + 16);
        
        transposeBlock(block);
        decryptBlock(block, w, Nr);
        transposeBlock(block);

        if (progressCB && (i % 2048 == 0)) {
            progressCB(i, inputBytes.length);
        }
        
    }
    
    try {
        log('Próba usunięcia paddingu PKCS7...');
        const result = removePKCS7Padding(inputBytes);
        log('Wynik deszyfrowania:', result);
        return result;
    } catch (e) {
        console.error('Błąd podczas przetwarzania odszyfrowanych danych:', e);
        return inputBytes;
    }
}