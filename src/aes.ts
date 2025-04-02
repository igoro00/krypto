// aes.ts
import { AddRoundKey } from './AddRoundKey';
import { SubBytes } from './SubBytes';
import { ShiftRows } from './ShiftRows';
import { MixColumns } from './MixColumns';
import { InvSubBytes } from './InvSubBytes';
import { InvShiftRows } from './InvShiftRows';
import { InvMixColumns } from './InvMixColumns';
import { keyExpansion } from './KeyExpansion';

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
export function addPKCS7Padding(data: number[]): number[] {
    console.log('Dane wejściowe przed paddingiem:', data);
    console.log('Długość danych przed paddingiem:', data.length);
    
    const blockSize = 16;
    const paddingLength = blockSize - (data.length % blockSize);
    
    console.log("Obliczona długość paddingu:", paddingLength);
    
    const paddedData = [...data, ...Array(paddingLength).fill(paddingLength)];
    
    console.log('Dane po dodaniu paddingu:', paddedData);
    console.log('Długość danych po paddingu:', paddedData.length);
    console.log('Ostatni bajt (wartość paddingu):', paddedData[paddedData.length - 1]);
    
    // Sprawdź czy padding jest poprawny
    const isValid = paddedData.slice(-paddingLength).every(b => b === paddingLength);
    console.log('Padding poprawny:', isValid);
    
    return paddedData;
}

// Usunięcie paddingu PKCS7
export function removePKCS7Padding(data: number[]): number[] {
    console.log('Dane przed usunięciem paddingu:', data);
    console.log('Długość danych przed usunięciem paddingu:', data.length);
    
    if (data.length === 0 || data.length % 16 !== 0) {
        console.error('Nieprawidłowa długość danych:', data.length);
        throw new Error('Invalid data length');
    }
    
    const paddingLength = data[data.length - 1];
    console.log('Wykryta długość paddingu:', paddingLength);
    
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
    console.log('Dane po usunięciu paddingu:', unpaddedData);
    console.log('Długość danych po usunięciu paddingu:', unpaddedData.length);
    
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

export async function bufferToBase64(buffer: Uint8Array): Promise<string> {
    // use a FileReader to generate a base64 data URI:
    const base64url = await new Promise<string>(r => {
      const reader = new FileReader()
      reader.onload = () => r(reader.result as string)
      reader.readAsDataURL(new Blob([buffer]))
    });
    // remove the `data:...;base64,` part from the start
    return base64url.slice(base64url.indexOf(',') + 1);
}

export async function base64ToBuffer(b64:string): Promise<ArrayBuffer> {
    var dataUrl = "data:application/octet-binary;base64," + b64;

    const res = await fetch(dataUrl)
    return await res.arrayBuffer();        
}

// Główna funkcja szyfrująca - dodaj logi
export async function encrypt(input: Uint8Array, key: string, keySize: number): Promise<Uint8Array> {
    const inputBytes:number[] = Array.from(input)
    
    // Konwersja klucza z hex na bajty
    const keyBytes = hexToBytes(key);
    console.log('Klucz (bajty):', keyBytes);
    
    // Rozszerzenie klucza
    const w = keyExpansion(keyBytes, keySize);
        
    console.log('Dane po konwersji na bajty:', inputBytes);
    console.log('Długość danych w bajtach:', inputBytes.length);
    
    // Dodanie paddingu PKCS7
    const paddedInput = addPKCS7Padding(inputBytes);
    
    // Szyfrowanie bloków
    console.log('Liczba bloków do zaszyfrowania:', paddedInput.length / 16);
    const encrypted = [];
    for (let i = 0; i < paddedInput.length; i += 16) {
        console.log(`Szyfrowanie bloku ${i/16 + 1}/${paddedInput.length/16}`);
        const block = paddedInput.slice(i, i + 16);
        console.log('Blok przed szyfrowaniem:', block);
        
        const state = bytesToState(block);
        const encryptedState = encryptBlock(state, w, Nr);
        const encryptedBlock = stateToBytes(encryptedState);
        
        console.log('Blok po zaszyfrowaniu:', encryptedBlock);
        encrypted.push(...encryptedBlock);
    }
    
    console.log('Całkowita długość zaszyfrowanych danych:', encrypted.length);
    
    return new Uint8Array(encrypted);;
}


// Główna funkcja deszyfrująca - dodaj logi
export function decrypt(input: string, key: string, keySize: number): string {
    console.log('=== DESZYFROWANIE ===');
    console.log('Dane wejściowe (hex):', input.substring(0, 50) + (input.length > 50 ? '...' : ''));
    console.log('Długość danych wejściowych:', input.length);
    
    const Nk = keySize / 32;
    const Nr = Nk + 6;
    
    // Konwersja klucza z hex na bajty
    const keyBytes = hexToBytes(key);
    console.log('Klucz (bajty):', keyBytes);
    
    // Rozszerzenie klucza
    const w = keyExpansion(keyBytes, keySize);
    
    // Konwersja wejścia z hex na bajty
    const inputBytes = hexToBytes(input);
    console.log('Dane po konwersji z hex na bajty:', inputBytes);
    console.log('Długość danych w bajtach:', inputBytes.length);
    
    if (inputBytes.length % 16 !== 0) {
        console.error('Nieprawidłowa długość danych wejściowych:', inputBytes.length);
        throw new Error('Input length must be multiple of 16 bytes');
    }
    
    // Deszyfrowanie bloków
    console.log('Liczba bloków do odszyfrowania:', inputBytes.length / 16);
    const decrypted = [];
    for (let i = 0; i < inputBytes.length; i += 16) {
        console.log(`Deszyfrowanie bloku ${i/16 + 1}/${inputBytes.length/16}`);
        const block = inputBytes.slice(i, i + 16);
        console.log('Blok przed deszyfrowaniem:', block);
        
        const state = bytesToState(block);
        const decryptedState = decryptBlock(state, w, Nr);
        const decryptedBlock = stateToBytes(decryptedState);
        
        console.log('Blok po odszyfrowaniu:', decryptedBlock);
        decrypted.push(...decryptedBlock);
    }
    
    console.log('Całkowita długość odszyfrowanych danych (z paddingiem):', decrypted.length);
    console.log('Ostatni bajt (potencjalna wartość paddingu):', decrypted[decrypted.length - 1]);
    
    try {
        // Usuń padding
        console.log('Próba usunięcia paddingu PKCS7...');
        const unpaddedDecrypted = removePKCS7Padding(decrypted);
        
        // Spróbuj przekonwertować na tekst
        console.log('Próba konwersji na tekst...');
        const result = bytesToString(unpaddedDecrypted);
        console.log('Wynik deszyfrowania:', result.substring(0, 50) + (result.length > 50 ? '...' : ''));
        return result;
    } catch (e) {
        console.error('Błąd podczas przetwarzania odszyfrowanych danych:', e);
        // Jeśli nie można przekonwertować na tekst lub padding jest niepoprawny,
        // zwróć hex string
        const result = bytesToHex(decrypted);
        console.log('Wynik deszyfrowania (hex):', result.substring(0, 50) + (result.length > 50 ? '...' : ''));
        return result;
    }
}

// Dodaj ten kod na końcu funkcji DOMContentLoaded
console.log("=== TEST PADDINGU ===");
const testText = "kotek"; // 5 bajtów
console.log("Tekst testowy:", testText);

// Konwersja na bajty
const encoder = new TextEncoder();
const testBytes = Array.from(encoder.encode(testText));
console.log("Bajty:", testBytes);
console.log("Długość:", testBytes.length);

// Dodanie paddingu
const paddedBytes = addPKCS7Padding(testBytes);
console.log("Po paddingu:", paddedBytes);
console.log("Długość po paddingu:", paddedBytes.length);

// Symulacja szyfrowania i deszyfrowania (pomijamy faktyczne szyfrowanie)
// Usunięcie paddingu
try {
    const unpaddedBytes = removePKCS7Padding(paddedBytes);
    console.log("Po usunięciu paddingu:", unpaddedBytes);
    console.log("Długość po usunięciu paddingu:", unpaddedBytes.length);
    
    // Konwersja z powrotem na tekst
    const decoder = new TextDecoder();
    const resultText = decoder.decode(new Uint8Array(unpaddedBytes));
    console.log("Tekst po deszyfracji:", resultText);
    
    if (resultText === testText) {
        console.log("TEST PADDINGU: SUKCES");
    } else {
        console.log("TEST PADDINGU: BŁĄD - tekst nie zgadza się");
    }
} catch (e) {
    console.error("TEST PADDINGU: BŁĄD podczas usuwania paddingu:", e);
}

// Dodaj ten kod na końcu funkcji DOMContentLoaded
console.log("=== TESTY PADDINGU ===");

// Test 1: Pusty tekst (0 bajtów)
testPadding("", "Pusty tekst");

// Test 2: Dokładnie 16 bajtów
testPadding("1234567890123456", "Dokładnie 16 bajtów");

// Test 3: Bardzo krótki tekst
testPadding("a", "Jeden znak");

// Test 4: Tekst z polskimi znakami
testPadding("zażółć gęślą jaźń", "Polskie znaki");

function testPadding(text: string | undefined, testName: string) {
    console.log(`\n--- Test: ${testName} ---`);
    console.log("Tekst testowy:", text);
    
    // Konwersja na bajty
    const encoder = new TextEncoder();
    const testBytes = Array.from(encoder.encode(text));
    console.log("Bajty:", testBytes);
    console.log("Długość:", testBytes.length);
    
    // Dodanie paddingu
    const paddedBytes = addPKCS7Padding(testBytes);
    console.log("Po paddingu:", paddedBytes);
    console.log("Długość po paddingu:", paddedBytes.length);
    console.log("Ostatni bajt (wartość paddingu):", paddedBytes[paddedBytes.length - 1]);
    
    // Usunięcie paddingu
    try {
        const unpaddedBytes = removePKCS7Padding(paddedBytes);
        console.log("Po usunięciu paddingu:", unpaddedBytes);
        console.log("Długość po usunięciu paddingu:", unpaddedBytes.length);
        
        // Konwersja z powrotem na tekst
        const decoder = new TextDecoder();
        const resultText = decoder.decode(new Uint8Array(unpaddedBytes));
        console.log("Tekst po deszyfracji:", resultText);
        
        if (resultText === text) {
            console.log("✅ TEST SUKCES");
        } else {
            console.log("❌ TEST BŁĄD - tekst nie zgadza się");
        }
    } catch (e) {
        console.error("❌ TEST BŁĄD podczas usuwania paddingu:", e);
    }
}