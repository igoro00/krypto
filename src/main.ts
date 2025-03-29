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

    // Funkcja do odczytu pliku
    function readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error('Failed to read file as text'));
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
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
            let inputData: string;
            
            // Pobieranie danych wejściowych w zależności od wybranego typu
            if (dataType?.value === 'text') {
                inputData = textInput.value;
                if (!inputData) {
                    alert("Wprowadź tekst do przetworzenia!");
                    return;
                }
            } else if (dataType?.value === 'file' && fileInput.files && fileInput.files[0]) {
                try {
                    inputData = await readFile(fileInput.files[0]);
                } catch (error) {
                    console.error("Błąd podczas odczytu pliku:", error);
                    alert("Wystąpił błąd podczas odczytu pliku!");
                    return;
                }
            } else {
                alert("Wybierz plik lub wprowadź tekst!");
                return;
            }

            const keyLength = parseInt(selectedKeyLength?.value || "128");
            let result: string;

            if (selectedRadioAction?.value === 'encrypt') {
                result = encrypt(inputData, currentKey, keyLength);
                console.log("Zaszyfrowano:", result);
            } else {
                result = decrypt(inputData, currentKey, keyLength);
                console.log("Odszyfrowano:", result);
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

        } catch (error) {
            console.error("Błąd podczas operacji:", error);
            alert("Wystąpił błąd podczas operacji szyfrowania/deszyfrowania!");
        }
    });
});