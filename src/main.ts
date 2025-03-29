import { dragAndDrop } from './dragAndDrop';
import { bytesToHex, generateKey } from './generateKey';
import { encrypt, decrypt } from './aes';
import './style.css';

dragAndDrop();

document.addEventListener('DOMContentLoaded', () => {
    console.log("Site Loaded");
    
    const action = document.getElementById('action');
    const generatedKeyButton = document.getElementById('generate-key');
    const generatedKeySpan = document.getElementById('key');
    const manualKey = document.getElementById('manualKey') as HTMLInputElement;
    const textInput = document.getElementById('textInput') as HTMLInputElement;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;

    // Elementy do ukrywania/pokazywania
    const dropZone = document.querySelector('.drop-zone');
    const textInputContainer = document.querySelector('.text');

    // Funkcja aktualizująca widoczność elementów na podstawie wybranego typu danych
    function updateVisibility() {
        const dataType = document.querySelector<HTMLInputElement>('input[name="dataType"]:checked')?.value;
        
        if (dropZone && textInputContainer) {
            if (dataType === 'file') {
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
    if (!generatedKeyButton || !generatedKeySpan || !manualKey || !textInput || !fileInput) {
        console.error("Nie znaleziono wszystkich wymaganych elementów DOM");
        return;
    }

    generatedKeyButton?.addEventListener('click', () => {
        console.log("Generating key...")
        const selectedRadio = document.querySelector<HTMLInputElement>('input[name="keyLength"]:checked');
        if (selectedRadio) {
            const keyLength = parseInt(selectedRadio.value);
            const generatedKeyValue = generateKey(keyLength);
            generatedKeySpan.textContent = bytesToHex(generatedKeyValue);
            console.log("Wygenerowano klucz:", generatedKeySpan.textContent + "\ndługość klucza: " + keyLength);
        }
    });

    action?.addEventListener('click', () => {
        console.log("Action button")
    });
});