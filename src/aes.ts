// aes.ts
import { AddRoundKey } from './AddRoundKey';
import { SubBytes } from './SubBytes';
import { ShiftRows } from './ShiftRows';
import { MixColumns } from './MixColumns';
import { InvSubBytes } from './InvSubBytes';
import { InvShiftRows } from './InvShiftRows';
import { InvMixColumns } from './InvMixColumns';
import { keyExpansion } from './KeyExpansion';
import { log } from './utils';

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
    const state:number[][] = [[], [], [], []];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            state[j][i] = bytes[i * 4 + j];
        }
    }
    return state;
}

// Dodanie paddingu PKCS7
export function addPKCS7Padding(data: Uint8Array): Uint8Array {
    log('Dane wejściowe przed paddingiem:', data);
    log('Długość danych przed paddingiem:', data.length);
    
    const blockSize = 16;
    const paddingLength = blockSize - (data.length % blockSize);
    
    log("Obliczona długość paddingu:", paddingLength);
    
    const paddedData = new Uint8Array(data.length + paddingLength);
    paddedData.fill(paddingLength) // wypełnij całość paddingLength
    paddedData.set(data); // nadpisz pierwsze data.length bajtów
    
    log('Dane po dodaniu paddingu:', paddedData);
    log('Długość danych po paddingu:', paddedData.length);
    log('Ostatni bajt (wartość paddingu):', paddedData[paddedData.length - 1]);
    
    // Sprawdź czy padding jest poprawny
    const isValid = paddedData.slice(-paddingLength).every(b => b === paddingLength);
    log('Padding poprawny:', isValid);
    
    return paddedData;
}

// Usunięcie paddingu PKCS7
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
    
    // Sprawdzenie czy padding jest poprawny
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
    
    const unpaddedData = data.slice(0, -paddingLength);
    log('Dane po usunięciu paddingu:', unpaddedData);
    log('Długość danych po usunięciu paddingu:', unpaddedData.length);
    
    return unpaddedData;
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
// Główna funkcja szyfrująca - dodaj logi
export async function encrypt(input: Uint8Array, key: string, keySize: number): Promise<Uint8Array> {
   
    // Konwersja klucza z hex na bajty
    const keyBytes = hexToBytes(key);
    log('Klucz (bajty):', keyBytes);


    //TODO: @Fellapp Sprawdzić czy to jest dobrze
    const Nr = (keySize / 32) + 6;
    
    // Rozszerzenie klucza
    const w = keyExpansion(keyBytes, keySize);
    
    // Dodanie paddingu PKCS7
    const paddedInput = addPKCS7Padding(input);
    
    // Szyfrowanie bloków
    log('Liczba bloków do zaszyfrowania:', paddedInput.length / 16);
    const encrypted = [];
    for (let i = 0; i < paddedInput.length; i += 16) {
        log(`Szyfrowanie bloku ${i/16 + 1}/${paddedInput.length/16}`);
        const block = paddedInput.slice(i, i + 16);
        log('Blok przed szyfrowaniem:', block);
        
        const state = bytesToState(Array.from(block));
        const encryptedState = encryptBlock(state, w, Nr);
        const encryptedBlock = stateToBytes(encryptedState);
        
        log('Blok po zaszyfrowaniu:', encryptedBlock);
        encrypted.push(...encryptedBlock);
    }
    
    log('Całkowita długość zaszyfrowanych danych:', encrypted.length);
    
    return new Uint8Array(encrypted);;
}


// Główna funkcja deszyfrująca - dodaj logi
export function decrypt(input: Uint8Array, key: string, keySize: number): Uint8Array {
    log('=== DESZYFROWANIE ===');
    log('Dane wejściowe (hex):', input);
    
    const Nk = keySize / 32;
    const Nr = Nk + 6;
    
    // Konwersja klucza z hex na bajty
    const keyBytes = hexToBytes(key);
    log('Klucz (bajty):', keyBytes);
    
    // Rozszerzenie klucza
    const w = keyExpansion(keyBytes, keySize);
    
    // Konwersja wejścia z hex na bajty
    const inputBytes = Array.from(input);
    log('Dane po konwersji z hex na bajty:', inputBytes);
    log('Długość danych w bajtach:', inputBytes.length);
    
    if (inputBytes.length % 16 !== 0) {
        console.error('Nieprawidłowa długość danych wejściowych:', inputBytes.length);
        throw new Error('Input length must be multiple of 16 bytes');
    }
    
    // Deszyfrowanie bloków
    log('Liczba bloków do odszyfrowania:', inputBytes.length / 16);
    const decrypted = [];
    for (let i = 0; i < inputBytes.length; i += 16) {
        log(`Deszyfrowanie bloku ${i/16 + 1}/${inputBytes.length/16}`);
        const block = inputBytes.slice(i, i + 16);
        log('Blok przed deszyfrowaniem:', block);
        
        const state = bytesToState(block);
        const decryptedState = decryptBlock(state, w, Nr);
        const decryptedBlock = stateToBytes(decryptedState);
        
        log('Blok po odszyfrowaniu:', decryptedBlock);
        decrypted.push(...decryptedBlock);
    }
    
    log('Całkowita długość odszyfrowanych danych (z paddingiem):', decrypted.length);
    log('Ostatni bajt (potencjalna wartość paddingu):', decrypted[decrypted.length - 1]);
    
    try {
        // Usuń padding
        log('Próba usunięcia paddingu PKCS7...');
        const result = removePKCS7Padding(new Uint8Array(decrypted));
        log('Wynik deszyfrowania:', result);
        return result;
    } catch (e) {
        console.error('Błąd podczas przetwarzania odszyfrowanych danych:', e);
        return new Uint8Array(decrypted);
    }
}