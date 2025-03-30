import { dragAndDrop } from './dragAndDrop';
import { bytesToHex, generateKey } from './generateKey';
import { encrypt, decrypt } from './aes';
import './style.css';

dragAndDrop();

document.addEventListener('DOMContentLoaded', () => {
    console.log("Site Loaded");
    
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

    // Funkcja do konwersji danych binarnych na hex string
    function binaryToHex(data: Uint8Array): string {
        return Array.from(data)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    // Funkcja do konwersji hex string na dane binarne
    function hexToBinary(hex: string): Uint8Array {
        const matches = hex.match(/.{1,2}/g) || [];
        return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
    }

    // Funkcja do szyfrowania pliku
    async function encryptFile(file: File, key: string, keySize: number): Promise<Blob> {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const inputBytes = new Uint8Array(arrayBuffer);
        const hexData = binaryToHex(inputBytes);
        const encryptedHex = encrypt(hexData, key, keySize);
        const encryptedBytes = hexToBinary(encryptedHex);
        return new Blob([encryptedBytes], { type: 'application/octet-stream' });
    }

    // Funkcja do deszyfrowania pliku
    async function decryptFile(file: File, key: string, keySize: number): Promise<Blob> {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const inputBytes = new Uint8Array(arrayBuffer);
        const hexData = binaryToHex(inputBytes);
        const decryptedHex = decrypt(hexData, key, keySize);
        const decryptedBytes = hexToBinary(decryptedHex);
        return new Blob([decryptedBytes], { type: file.type || 'application/octet-stream' });
    }

    // Obsługa generowania klucza
    if (!generatedKeyButton || !generatedKey || !manualKey || !textInput || !fileInput) {
        console.error("Nie znaleziono wszystkich wymaganych elementów DOM");
        return;
    }

    generatedKeyButton.addEventListener('click', () => {
        console.log("Generating key...");
        const selectedRadio = document.querySelector<HTMLInputElement>('input[name="keyLength"]:checked');
        if (selectedRadio) {
            const keyLength = parseInt(selectedRadio.value);
            const generatedKeyValue = generateKey(keyLength);
            generatedKey.textContent = bytesToHex(generatedKeyValue);
            console.log("Wygenerowano klucz:", generatedKey.textContent + "\ndługość klucza: " + keyLength);
        }
    });

    action?.addEventListener('click', async () => {
        const selectedRadioAction = document.querySelector<HTMLInputElement>('input[name="operation"]:checked');
        const dataType = document.querySelector<HTMLInputElement>('input[name="dataType"]:checked');
        const selectedKeyLength = document.querySelector<HTMLInputElement>('input[name="keyLength"]:checked');

        const manualKeyValue = manualKey.value.trim();
        const generatedKeyValue = generatedKey.textContent?.trim();

        let currentKey: string | null = null;
        if (manualKeyValue) {
            currentKey = manualKeyValue;
            console.log("Używany klucz ręczny:", currentKey);
        } else if (generatedKeyValue && generatedKeyValue !== "brak") {
            currentKey = generatedKeyValue;
            console.log("Używany wygenerowany klucz:", currentKey);
        } else {
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
                    alert("Wprowadź tekst do przetworzenia!");
                    return;
                }

                let result: string;
                if (selectedRadioAction?.value === 'encrypt') {
                    result = encrypt(inputData, currentKey, keyLength);
                    console.log("Zaszyfrowano tekst");
                } else {
                    result = decrypt(inputData, currentKey, keyLength);
                    console.log("Odszyfrowano tekst");
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
                    console.log("Zaszyfrowano plik");
                } else {
                    resultBlob = await decryptFile(file, currentKey, keyLength);
                    console.log("Odszyfrowano plik");
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
                alert("Wybierz plik lub wprowadź tekst!");
                return;
            }

        } catch (error) {
            console.error("Błąd podczas operacji:", error);
            alert("Wystąpił błąd podczas operacji szyfrowania/deszyfrowania!");
        }
    });
});