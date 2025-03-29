import { dragAndDrop } from './dragAndDrop';
import { bytesToHex, generateKey } from './generateKey';
import { encrypt, decrypt } from './aes';
import './style.css';

dragAndDrop();

document.addEventListener('DOMContentLoaded', () => {
    console.log("Site Loaded");
    
    const action = document.getElementById('action');
    const generatedKeyButton = document.getElementById('generate-key');
    const generatedKey = document.getElementById('key');
    const manualKey = document.getElementById('manualKey') as HTMLInputElement;
    const textInput = document.getElementById('textInput') as HTMLInputElement;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;

    // Elementy do ukrywania/pokazywania
    const dropZone = document.querySelector('.drop-zone');
    const textInputContainer = document.querySelector('.text');

    // Funkcja aktualizująca widoczność elementów na podstawie wybranego typu danych
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

    // Obsługa generowania klucza
    if (!generatedKeyButton || !generatedKey || !manualKey || !textInput || !fileInput) {
        console.error("Nie znaleziono wszystkich wymaganych elementów DOM");
        return;
    }

    generatedKeyButton?.addEventListener('click', () => {
        console.log("Generating key...")
        const selectedRadio = document.querySelector<HTMLInputElement>('input[name="keyLength"]:checked');
        if (selectedRadio) {
            const keyLength = parseInt(selectedRadio.value);
            const generatedKeyValue = generateKey(keyLength);
            generatedKey.textContent = bytesToHex(generatedKeyValue);
            console.log("Wygenerowano klucz:", generatedKey.textContent + "\ndługość klucza: " + keyLength);
        }
    });

    action?.addEventListener('click', () => {
        const selectedRadioAction = document.querySelector<HTMLInputElement>('input[name="operation"]:checked');
        const dataType = document.querySelector<HTMLInputElement>('input[name="dataType"]:checked');

        const manualKeyValue = manualKey.value.trim();
        const generatedKeyValue = generatedKey.textContent?.trim();

        let currentKey: string | null = null;
        if (manualKeyValue) {
            // Jeśli klucz ręczny jest wprowadzony, użyj go
            currentKey = manualKeyValue;
            console.log("Używany klucz ręczny:", currentKey);
        } else if (generatedKeyValue && generatedKeyValue !== "brak") {
            // Jeśli klucz ręczny nie jest wprowadzony, ale istnieje wygenerowany klucz, użyj go
            currentKey = generatedKeyValue;
            console.log("Używany wygenerowany klucz:", currentKey);
        } else {
            // Jeśli żaden klucz nie jest dostępny, wyświetl komunikat
            alert("Brak klucza! Wprowadź klucz ręcznie lub wygeneruj nowy.");
            console.error("Brak klucza!");
            return; // Zatrzymaj dalsze przetwarzanie
        }

        if (dataType) {
            console.log("Data type: " + dataType?.value);
        }

        if (selectedRadioAction) {
            console.log("Action: " + selectedRadioAction.value);
        }


    });
});