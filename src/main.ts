import { dragAndDrop } from './dragAndDrop';
import { bytesToHex, generateKey } from './generateKey';
import { encrypt, decrypt } from './aes';
import './style.css';
import { base64ToBuffer, bufferToBase64, log } from './utils';

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;

    const loadingImg = document.createElement('img');
    loadingImg.src = 'loading.gif';
    loadingImg.alt = 'Loading...';
    loadingImg.style.cssText = `
        width: 100px;
        height: 100px;
    `;

    const loadingText = document.createElement('div');
    loadingText.textContent = 'Proszę czekać...';
    loadingText.style.cssText = `
        color: white;
        font-size: 18px;
        margin-top: 10px;
        text-align: center;
    `;

    const container = document.createElement('div');
    container.style.textAlign = 'center';
    container.appendChild(loadingImg);
    container.appendChild(loadingText);
    loadingDiv.appendChild(container);

    document.body.appendChild(loadingDiv);
}

function hideLoading() {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        document.body.removeChild(loadingDiv);
    }
}

dragAndDrop();

document.addEventListener('DOMContentLoaded', () => {
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
    async function encryptFile(file: File, key: string, keySize: number): Promise<Blob> {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const inputBytes = new Uint8Array(arrayBuffer);
        const encrypted = await encrypt(inputBytes, key, keySize);
        return new Blob([encrypted], { type: 'application/octet-stream' });
    }

    // Funkcja do deszyfrowania pliku
    async function decryptFile(file: File, key: string, keySize: number): Promise<Blob> {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const inputBytes = new Uint8Array(arrayBuffer);
        const decrypted = decrypt(inputBytes, key, keySize);
        return new Blob([decrypted], { type: file.type || 'application/octet-stream' });
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
        showLoading();

        const selectedRadioAction = document.querySelector<HTMLInputElement>('input[name="operation"]:checked');
        const dataType = document.querySelector<HTMLInputElement>('input[name="dataType"]:checked');
        const selectedKeyLength = document.querySelector<HTMLInputElement>('input[name="keyLength"]:checked');

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
            hideLoading();
            alert("Brak klucza! Wprowadź klucz ręcznie lub wygeneruj nowy.");
            console.error("Brak klucza!");
            return;
        }

        try {
            const keyLength = parseInt(selectedKeyLength?.value || "128");

            if (dataType?.value === 'text') {
                // Obsługa tekstu
                const inputData = textInput.value;
                if (!inputData) {
                    hideLoading();
                    alert("Wprowadź tekst do przetworzenia!");
                    return;
                }
            
                let result: string;
                if (selectedRadioAction?.value === 'encrypt') {
                    // Dla szyfrowania tekstu
                    const encoder = new TextEncoder();
                    const uint8Array = encoder.encode(inputData);
                    const encrypted = await encrypt(uint8Array, currentKey, keyLength);
                    result = await bufferToBase64(encrypted);
                    log("Zaszyfrowano tekst");
                } else {
                    // Dla deszyfrowania tekstu
                    const bytes = decrypt(await base64ToBuffer(inputData), currentKey, keyLength);
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
                let resultBlob: Blob;

                if (selectedRadioAction?.value === 'encrypt') {
                    resultBlob = await encryptFile(file, currentKey, keyLength);
                    log("Zaszyfrowano plik");
                } else {
                    resultBlob = await decryptFile(file, currentKey, keyLength);
                    log("Odszyfrowano plik");
                }

                // Pobierz plik
                const a = document.createElement('a');
                const url = window.URL.createObjectURL(resultBlob);
                a.href = url;
                a.download = file.name + (selectedRadioAction?.value === 'encrypt' ? '.enc' : '.dec');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

            } else {
                hideLoading();
                alert("Wybierz plik lub wprowadź tekst!");
                return;
            }

        } catch (error) {
            console.error("Błąd podczas operacji:", error);
            alert("Wystąpił błąd podczas operacji szyfrowania/deszyfrowania!");
        } finally {
            hideLoading();
        }
    });

    // Testowanie paddingu dla krótkiego bloku
    // const shortData = stringToBytes("test"); // 4 bajty
    // log("Oryginalne dane:", shortData);
    // const paddedData = addPKCS7Padding(shortData);
    // log("Po dodaniu paddingu:", paddedData);
    // log("Długość po paddingu:", paddedData.length);

    // // Sprawdź czy padding jest poprawnie usuwany
    // try {
    //     const unpaddedData = removePKCS7Padding(paddedData);
    //     log("Po usunięciu paddingu:", unpaddedData);
    //     log("Długość po usunięciu paddingu:", unpaddedData.length);
    // } catch (e) {
    //     console.error("Błąd podczas usuwania paddingu:", e);
    // }
});