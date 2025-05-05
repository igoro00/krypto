import { dragAndDrop } from './dragAndDrop';
import { bytesToHex, generateKey } from './generateKey';
import { encrypt, decrypt, hexToBytes } from './aes';
import './style.css';
import { base64ToBuffer, bufferToBase64, log } from './utils';

let selectedRadioAction:HTMLInputElement|null;
let currentFileName = '';
const loadingText = document.querySelector('#loadingText');
const generatedKey = document.getElementById('key');

// Resetowanie wyświetlanego klucza przy zmianie długości
if (generatedKey) {
    document.querySelectorAll('input[name="keyLength"]').forEach(elem=>elem.addEventListener("change", ()=>generatedKey.textContent=''));
}

// Sprawdzenie wsparcia dla Web Workers
if (!window.Worker) {
    alert("To nie zadziała- worker!");    
    throw new Error("Worker nie działa");
}

// Inicjalizacja Web Worker do cięższych operacji
const myWorker = new Worker(new URL("worker.js", import.meta.url), { type: "module" });

// Obsługa wiadomości od Worker'a
myWorker.onmessage = (e) => {
    if (e.data.type === 'progress') {
        // Aktualizacja postępu operacji
        if (loadingText) {
            loadingText.innerHTML = e.data.data;
        }

    } else {
        // Zakończenie operacji - przygotowanie pliku do pobrania
        const encrypted = e.data.data; 
        let resultBlob = new Blob([encrypted], { type: 'application/octet-stream' });
        
        // Tworzenie linku do pobrania
        const a = document.createElement('a');
        const url = window.URL.createObjectURL(resultBlob);
        a.href = url;
    
        // Ustalenie nazwy pliku wynikowego
        selectedRadioAction = document.querySelector<HTMLInputElement>('input[name="operation"]:checked');
        if (selectedRadioAction?.value === 'encrypt') {
            a.download = currentFileName + '_enc'; // Dodanie suffixu dla zaszyfrowanego pliku
        } else {
            a.download = currentFileName.replace('_enc', ''); // Usunięcie suffixu przy deszyfrowaniu
        }
    
        // Automatyczne pobranie pliku
        document.body.appendChild(a); 
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    
        setLoading(false); // Ukrycie animacji ładowania
    }
};

/**
 * Pokazuje/ukrywa animację ładowania
 * @param value - true = pokaż, false = ukryj
 */
function setLoading(value: boolean) {
    const loading = document.querySelector('.loading');
    if (value) {
        loading?.classList.remove('hidden');
    } else {
        loading?.classList.add('hidden');
    }
}

dragAndDrop();

document.addEventListener('DOMContentLoaded', () => {
    const action = document.getElementById('action');
    const generatedKeyButton = document.getElementById('generate-key');
    const manualKey = document.getElementById('manualKey') as HTMLInputElement;
    const textInput = document.getElementById('textInput') as HTMLTextAreaElement;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    const resultDiv = document.createElement('div');
    resultDiv.id = 'result';
    document.body.appendChild(resultDiv);

    const dropZone = document.querySelector('.drop-zone');
    const textInputContainer = document.querySelector('.text');

     /**
     * Aktualizuje widoczność elementów w zależności od wybranego typu danych
     */
    function updateVisibility() {
        const dataType = document.querySelector<HTMLInputElement>('input[name="dataType"]:checked');

        if (dropZone && textInputContainer) {
            if (dataType?.value === 'file') {
                dropZone.classList.remove('hidden');
                textInputContainer.classList.add('hidden');
            } else {
                dropZone.classList.add('hidden');
                textInputContainer.classList.remove('hidden');
            }
        }
    }

    document.querySelectorAll('input[name="dataType"]').forEach(radio => {
        radio.addEventListener('change', updateVisibility);
    });

    updateVisibility();

     /**
     * Czyta plik jako ArrayBuffer
     * @param file - Plik do odczytu
     * @returns Promise z ArrayBuffer
     */
    function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.result instanceof ArrayBuffer) {
                    resolve(reader.result);
                } else {
                    reject(new Error('Failed to read file as ArrayBuffer'));
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

      /**
     * Szyfruje plik przy użyciu Worker'a
     * @param file - Plik do zaszyfrowania
     * @param key - Klucz szyfrowania
     */
    async function encryptFile(file: File, key: Uint8Array){
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const inputBytes = new Uint8Array(arrayBuffer);
        myWorker.postMessage({
            action: 'encrypt',
            data: inputBytes,
            key: key
        });

        return;
    }

    /**
     * Deszyfruje plik przy użyciu Worker'a
     * @param file - Plik do odszyfrowania
     * @param key - Klucz deszyfrowania
     */

    async function decryptFile(file: File, key: Uint8Array) {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const inputBytes = new Uint8Array(arrayBuffer);
        myWorker.postMessage({
            action: 'decrypt',
            data: inputBytes,
            key: key
        });

        return;
    }

    if (!generatedKeyButton || !generatedKey || !manualKey || !textInput || !fileInput) {
        console.error("Nie znaleziono wszystkich wymaganych elementów DOM");
        return;
    }

    generatedKeyButton.addEventListener('click', () => {
        log("Generating key...");
        
        const selectedRadio = document.querySelector<HTMLInputElement>('input[name="keyLength"]:checked');
        if (selectedRadio) {
            const keyLength = parseInt(selectedRadio.value);
            const generatedKeyValue = generateKey(keyLength);
            generatedKey.textContent = bytesToHex(generatedKeyValue);
            log("Wygenerowano klucz:", generatedKey.textContent + "\ndługość klucza: " + keyLength);
        }
    });

    action?.addEventListener('click', async () => {
        if (loadingText) {
            loadingText.innerHTML = 'Proszę czekać...';
        }
        setLoading(true)

        const dataType = document.querySelector<HTMLInputElement>('input[name="dataType"]:checked');

        const manualKeyValue = manualKey.value.trim();
        const generatedKeyValue = generatedKey.textContent?.trim();

        let currentKey: string | null = null;
        if (manualKeyValue) {
            currentKey = manualKeyValue;
            log("Używany klucz ręczny:", currentKey);
        } else if (generatedKeyValue && generatedKeyValue !== "brak") {
            currentKey = generatedKeyValue;
            log("Używany wygenerowany klucz:", currentKey);
        } else {
            setLoading(false)

            alert("Brak klucza! Wprowadź klucz ręcznie lub wygeneruj nowy.");
            console.error("Brak klucza!");
            return;
        }
        const keyBytes = new Uint8Array(hexToBytes(currentKey));
        try {
            selectedRadioAction = document.querySelector<HTMLInputElement>('input[name="operation"]:checked');
            // Obsługa operacji na tekście
            if (dataType?.value === 'text') {
                const inputData = textInput.value;
                if (!inputData) {
                    setLoading(false)

                    alert("Wprowadź tekst do przetworzenia!");
                    return;
                }
            
                let result: string;
                if (selectedRadioAction?.value === 'encrypt') {
                    // Szyfrowanie tekstu
                    const encoder = new TextEncoder();
                    const uint8Array = encoder.encode(inputData);
                    const encrypted = await encrypt(uint8Array, keyBytes);
                    result = await bufferToBase64(encrypted);
                    log("Zaszyfrowano tekst");
                } else {
                    // Deszyfrowanie tekstu
                    const bytes = decrypt(await base64ToBuffer(inputData), keyBytes);
                    const decoder = new TextDecoder('utf-8');
                    result = decoder.decode(bytes);
                    log("Odszyfrowano tekst");
                }
 
                resultDiv.textContent = result;
                resultDiv.style.cssText = `
                    margin: 20px;
                    padding: 15px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    background-color: #f9f9f9;
                    word-wrap: break-word;
                    color: black;
                `;
                setLoading(false);

                // Obsługa operacji na plikach
            } else if (dataType?.value === 'file' && fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                currentFileName = file.name;
                
                if (selectedRadioAction?.value === 'encrypt') {
                    await encryptFile(file, keyBytes);
                    log("Zaszyfrowano plik");
                } else {
                    await decryptFile(file, keyBytes);
                    log("Odszyfrowano plik");
                }

            } else {
                setLoading(false)

                alert("Wybierz plik lub wprowadź tekst!");
                return;
            }

        } catch (error) {
            setLoading(false);
            console.error("Błąd podczas operacji:", error);
            alert("Niepoprawny format pliku");
        }
    });
});