import { dragAndDrop } from './dragAndDrop';
import { bytesToHex, generateKey } from './generateKey';
import { encrypt, decrypt, hexToBytes } from './aes';
import './style.css';
import { base64ToBuffer, bufferToBase64, log } from './utils';

let selectedRadioAction:HTMLInputElement|null;
let currentFileName = '';
const loadingText = document.querySelector('#loadingText');
const generatedKey = document.getElementById('key');
if (generatedKey) {
    document.querySelectorAll('input[name="keyLength"]').forEach(elem=>elem.addEventListener("change", ()=>generatedKey.textContent=''));
}

if (!window.Worker) {
    alert("To nie zadziała- worker!");    
    throw new Error("Worker nie działa");
}

const myWorker = new Worker(new URL("worker.js", import.meta.url), { type: "module" });
myWorker.onmessage = (e) => {
    if (e.data.type === 'progress') {
        if (loadingText) {
            loadingText.innerHTML = e.data.data;
        }

    } else {
        const encrypted = e.data.data; 
        let resultBlob = new Blob([encrypted], { type: 'application/octet-stream' });
        
        const a = document.createElement('a');
        const url = window.URL.createObjectURL(resultBlob);
        a.href = url;
    
        selectedRadioAction = document.querySelector<HTMLInputElement>('input[name="operation"]:checked');
        if (selectedRadioAction?.value === 'encrypt') {
            a.download = currentFileName + '_enc';
        } else {
            a.download = currentFileName.replace('_enc', '');
        }
    
        document.body.appendChild(a); 
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    
        setLoading(false);
    }
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
            if (dataType?.value === 'text') {
                // obsługa tekstu
                const inputData = textInput.value;
                if (!inputData) {
                    setLoading(false)

                    alert("Wprowadź tekst do przetworzenia!");
                    return;
                }
            
                let result: string;
                if (selectedRadioAction?.value === 'encrypt') {
                    // dla szyfrowania tekstu
                    const encoder = new TextEncoder();
                    const uint8Array = encoder.encode(inputData);
                    const encrypted = await encrypt(uint8Array, keyBytes);
                    result = await bufferToBase64(encrypted);
                    log("Zaszyfrowano tekst");
                } else {
                    // dla deszyfrowania tekstu
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