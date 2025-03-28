import { dragAndDrop } from './dragAndDrop'
import { bytesToHex, generateKey } from './generateKey';
import './style.css'

dragAndDrop()
generateKey()

document.addEventListener('DOMContentLoaded', () => {
  const generateButton = document.getElementById('generate-key');
  const mainKey = document.getElementById('key');
  const manualKeyInput = document.getElementById('manualKey') as HTMLInputElement;
  
  generateButton?.addEventListener('click', () => {
    const selectedRadio = document.querySelector<HTMLInputElement>('input[name="keyLength"]:checked');
    
    if (!selectedRadio) {
      console.error('Nie wybrano długości klucza');
      return;
    }
    
    const selectedLength = selectedRadio.value;
    let keyHex = '';

    const hasManualKey = manualKeyInput && manualKeyInput.value.trim() !== '';
    if (hasManualKey) {
        keyHex = manualKeyInput.value.trim();
        console.log('Ręcznie wprowadzony klucz: ' + keyHex);
        return
    } else {
        let key, roundsNumber = 10;
        switch (selectedLength) {
          case "128":
            key = generateKey(128);
            break;
          case "192":
            key = generateKey(192);
            roundsNumber = 12;
            break;
          case "256":
            key = generateKey(256);
            roundsNumber = 14;
            break;
          default:
            key = generateKey(128);
        }
        
        console.log('Wybrana długość klucza: ' + selectedLength);
        console.log('Ilość rund: ' + roundsNumber)
        
        keyHex = bytesToHex(key);
        console.log('Klucz z generatora: ' + keyHex);
    }

    if (mainKey) {
        mainKey.textContent = keyHex;
        console.log('Zaktualizowano element span z kluczem: ' + keyHex);
      } else {
        console.error('Nie znaleziono elementu o id "key"');
      }
  });
});