import { dragAndDrop } from './dragAndDrop';
import { bytesToHex, generateKey } from './generateKey';
import { encrypt, decrypt, hexToBytes } from './aes';
import './style.css';
import { base64ToBuffer, bufferToBase64, log } from './utils';

const selectedRadioAction = document.querySelector<HTMLInputElement>('input[name="operation"]:checked');
let currentFileName = '';

if (!window.Worker) {
    alert("To nie zadziała- worker!");    
    throw new Error("Worker nie działa");
}

const myWorker = new Worker(new URL("worker.js", import.meta.url), { type: "module" });
myWorker.onmessage = (e) => {
    const encrypted = e.data; 
    let resultBlob = new Blob([encrypted], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(resultBlob);
    a.href = url;

    if (selectedRadioAction?.value === 'encrypt') {
        a.download = currentFileName + '.enc';
    } else {
        a.download = currentFileName.replace('.enc', '');
    }

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setLoading(false);
};

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
    document.body.addEventListener('click', ()=> {
        console.log("BODY");
        
    })
    log("Site Loaded");
    
    // Pobieranie elementów DOM
    const action = document.getElementById('action');
    const generatedKeyButton = document.getElementById('generate-key');
    const generatedKey = document.getElementById('key');
    const manualKey = document.getElementById('manualKey') as HTMLInputElement;
    const textInput = document.getElementById('textInput') as HTMLTextAreaElement;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    const resultDiv = document.createElement('div');
    resultDiv.id = 'result';
    document.body.appendChild(resultDiv);

    // Elementy do ukrywania/pokazywania
    const dropZone = document.querySelector('.drop-zone');
    const textInputContainer = document.querySelector('.text');

    // Funkcja aktualizująca widoczność elementów
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

    // Nasłuchiwanie zmian w wyborze typu danych
    document.querySelectorAll('input[name="dataType"]').forEach(radio => {
        radio.addEventListener('change', updateVisibility);
    });

    // Inicjalna aktualizacja widoczności
    updateVisibility();

    // Funkcja do odczytu pliku jako ArrayBuffer
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

    // Funkcja do szyfrowania pliku
    async function encryptFile(file: File, key: Uint8Array){
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const inputBytes = new Uint8Array(arrayBuffer);
        // const encrypted = await encrypt(inputBytes, key);
        myWorker.postMessage({
            action: 'encrypt',
            data: inputBytes,
            key: key
        });

        return;
    }

    // Funkcja do deszyfrowania pliku
    async function decryptFile(file: File, key: Uint8Array) {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const inputBytes = new Uint8Array(arrayBuffer);
        // const decrypted = decrypt(inputBytes, key);
        myWorker.postMessage({
            action: 'decrypt',
            data: inputBytes,
            key: key
        });

        return;
    }

    // Obsługa generowania klucza
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
            if (dataType?.value === 'text') {
                // Obsługa tekstu
                const inputData = textInput.value;
                if (!inputData) {
                    setLoading(false)

                    alert("Wprowadź tekst do przetworzenia!");
                    return;
                }
            
                let result: string;
                if (selectedRadioAction?.value === 'encrypt') {
                    // Dla szyfrowania tekstu
                    const encoder = new TextEncoder();
                    const uint8Array = encoder.encode(inputData);
                    const encrypted = await encrypt(uint8Array, keyBytes);
                    result = await bufferToBase64(encrypted);
                    log("Zaszyfrowano tekst");
                } else {
                    // Dla deszyfrowania tekstu
                    const bytes = decrypt(await base64ToBuffer(inputData), keyBytes);
                    const decoder = new TextDecoder('utf-8');
                    result = decoder.decode(bytes);
                    log("Odszyfrowano tekst");
                }
            
                // Wyświetl wynik
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
            } else if (dataType?.value === 'file' && fileInput.files && fileInput.files[0]) {
                // Obsługa pliku
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
            console.error("Błąd podczas operacji:", error);
            alert("Niepoprawny format pliku");
        }
    });
});