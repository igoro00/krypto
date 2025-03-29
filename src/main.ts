import { dragAndDrop } from './dragAndDrop';
import { bytesToHex, generateKey } from './generateKey';
import { encrypt, decrypt } from './aes';
import './style.css';

dragAndDrop();

function validateInput(data: number[]): boolean {
  return data && Array.isArray(data) && data.every(byte => 
      Number.isInteger(byte) && byte >= 0 && byte <= 255
  );
}

// Funkcje pomocnicze do logowania
function logOperationStart(operation: string, details: any) {
    console.log(`=== Rozpoczęcie operacji: ${operation} ===`);
    console.log('Szczegóły:', details);
    console.log('Czas rozpoczęcia:', new Date().toLocaleString());
}

function logOperationEnd(operation: string, details: any) {
    console.log(`=== Zakończenie operacji: ${operation} ===`);
    console.log('Szczegóły:', details);
    console.log('Czas zakończenia:', new Date().toLocaleString());
}

function logError(operation: string, error: any) {
    console.error(`!!! Błąd podczas operacji: ${operation} !!!`);
    console.error('Szczegóły błędu:', error);
    console.error('Czas wystąpienia błędu:', new Date().toLocaleString());
}

// Funkcja pomocnicza do sprawdzania poprawności nagłówka
function validateHeader(data: number[]): boolean {
    if (data.length < 6) { // Minimalna długość nagłówka
        return false;
    }
    const extensionLength = data[0];
    if (extensionLength <= 0 || extensionLength > 10) {
        return false;
    }
    if (data.length < (1 + extensionLength + 4)) {
        return false;
    }
    return true;
}

// Funkcja pomocnicza do debugowania
function logFileDetails(data: Uint8Array, message: string) {
    console.log(message, {
        dataLength: data.length,
        firstBytes: Array.from(data.slice(0, 10)),
        lastBytes: Array.from(data.slice(-10))
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const generateButton = document.getElementById('generate-key');
  const mainKey = document.getElementById('key');
  const manualKeyInput = document.getElementById('manualKey') as HTMLInputElement;
  const encryptTextButton = document.getElementById('encrypt-text');
  const decryptTextButton = document.getElementById('decrypt-text');
  const encryptFileButton = document.getElementById('encrypt-file');
  const decryptFileButton = document.getElementById('decrypt-file');
  const textInput = document.getElementById('textInput') as HTMLInputElement;
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;

  // Funkcja pomocnicza do konwersji tekstu na tablicę bajtów
  function stringToBytes(str: string): number[] {
      return Array.from(new TextEncoder().encode(str));
  }

  // Funkcja pomocnicza do konwersji tablicy bajtów na tekst
  function bytesToString(bytes: number[]): string {
      try {
          return new TextDecoder().decode(new Uint8Array(bytes));
      } catch (error) {
          console.error('Błąd podczas konwersji bajtów na tekst:', error);
          throw new Error('Nieprawidłowe dane wejściowe');
      }
  }

  // Funkcja pomocnicza do konwersji hex string na tablicę bajtów
  function hexToBytes(hex: string): number[] {
      if (hex.length % 2 !== 0) {
          throw new Error('Nieprawidłowa długość ciągu hex');
      }
      const bytes = new Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
          const byte = parseInt(hex.substr(i, 2), 16);
          if (isNaN(byte)) {
              throw new Error('Nieprawidłowy format hex');
          }
          bytes[i / 2] = byte;
      }
      return bytes;
  }

  // Obsługa generowania klucza
  generateButton?.addEventListener('click', () => {
      logOperationStart('Generowanie klucza', {
          typ: 'generowanie/ustawienie klucza'
      });

      const selectedRadio = document.querySelector<HTMLInputElement>('input[name="keyLength"]:checked');

      if (!selectedRadio) {
          alert('Wybierz długość klucza!');
          return;
      }

      const selectedLength = parseInt(selectedRadio.value);
      let keyHex = '';

      try {
          const hasManualKey = manualKeyInput && manualKeyInput.value.trim() !== '';
          if (hasManualKey) {
              keyHex = manualKeyInput.value.trim();
              // Sprawdzenie poprawności klucza
              hexToBytes(keyHex);
          } else {
              const key = generateKey(selectedLength);
              keyHex = bytesToHex(key);
          }

          if (mainKey) {
              mainKey.textContent = keyHex;
          }

          logOperationEnd('Generowanie klucza', {
              długośćKlucza: selectedLength,
              kluczRęczny: hasManualKey,
              pierwszeBajtyKlucza: keyHex.substring(0, 10) + '...'
          });
      } catch (error) {
          logError('Generowanie klucza', error);
          console.error('Błąd podczas generowania klucza:', error);
          alert('Nieprawidłowy format klucza!');
      }
  });

  // Obsługa szyfrowania tekstu
  encryptTextButton?.addEventListener('click', () => {
    const keyHex = (mainKey?.textContent || '').trim();
    const text = textInput?.value || '';
    const selectedLength = parseInt(document.querySelector<HTMLInputElement>('input[name="keyLength"]:checked')?.value || '128');

    logOperationStart('Szyfrowanie tekstu', {
        długośćTekstu: text.length,
        długośćKlucza: selectedLength,
        przykładowyTekst: text.substring(0, 20) + (text.length > 20 ? '...' : '')
    });

    if (!keyHex) {
        alert('Najpierw wygeneruj lub wprowadź klucz!');
        return;
    }

    if (!text) {
        alert('Wprowadź tekst do zaszyfrowania!');
        return;
    }

    try {
        const keyBytes = hexToBytes(keyHex);
        const inputBytes = stringToBytes(text);
        const encrypted = encrypt(inputBytes, keyBytes, selectedLength);
        textInput.value = bytesToHex(new Uint8Array(encrypted));

        logOperationEnd('Szyfrowanie tekstu', {
            długośćWejściowa: text.length,
            długośćWyjściowa: encrypted.length
        });
    } catch (error) {
        logError('Szyfrowanie tekstu', error);
        console.error('Błąd podczas szyfrowania:', error);
        alert('Wystąpił błąd podczas szyfrowania!');
    }
});

// Obsługa deszyfrowania tekstu
decryptTextButton?.addEventListener('click', () => {
    const keyHex = (mainKey?.textContent || '').trim();
    const encryptedHex = textInput?.value || '';
    const selectedLength = parseInt(document.querySelector<HTMLInputElement>('input[name="keyLength"]:checked')?.value || '128');

    logOperationStart('Deszyfrowanie tekstu', {
        długośćZaszyfrowanegoDanych: encryptedHex.length,
        długośćKlucza: selectedLength
    });

    if (!keyHex) {
        alert('Najpierw wygeneruj lub wprowadź klucz!');
        return;
    }

    if (!encryptedHex) {
        alert('Wprowadź zaszyfrowany tekst w formacie hex!');
        return;
    }

    try {
        const keyBytes = hexToBytes(keyHex);
        const encryptedBytes = hexToBytes(encryptedHex);
        const decrypted = decrypt(encryptedBytes, keyBytes, selectedLength);
        const decryptedText = bytesToString(decrypted);
        textInput.value = decryptedText;

        logOperationEnd('Deszyfrowanie tekstu', {
            długośćWejściowa: encryptedHex.length,
            długośćWyjściowa: decryptedText.length,
            przykładowyTekst: decryptedText.substring(0, 20) + (decryptedText.length > 20 ? '...' : '')
        });
    } catch (error) {
        logError('Deszyfrowanie tekstu', error);
        console.error('Błąd podczas deszyfrowania:', error);
        alert('Wystąpił błąd podczas deszyfrowania!');
    }
});

// Obsługa szyfrowania plików
encryptFileButton?.addEventListener('click', async () => {
  const file = fileInput.files?.[0];
  if (!file) {
      alert('Wybierz plik do zaszyfrowania!');
      return;
  }

  const keyHex = (mainKey?.textContent || '').trim();
  if (!keyHex) {
      alert('Najpierw wygeneruj lub wprowadź klucz!');
      return;
  }

  logOperationStart('Szyfrowanie pliku', {
      nazwaPliku: file.name,
      rozmiar: file.size,
      typ: file.type,
      ostatniaModyfikacja: file.lastModified
  });

  try {
      const keyBytes = hexToBytes(keyHex);
      const selectedLength = parseInt(document.querySelector<HTMLInputElement>('input[name="keyLength"]:checked')?.value || '128');

      const reader = new FileReader();
      reader.onload = async () => {
          try {
              const fileData = new Uint8Array(reader.result as ArrayBuffer);
              logFileDetails(fileData, 'Dane przed szyfrowaniem:');

              // Przygotowanie nagłówka
              const fileName = file.name;
              const extension = fileName.split('.').pop() || '';
              const extensionBytes = new TextEncoder().encode(extension);

              if (extensionBytes.length > 10) {
                  throw new Error('Rozszerzenie pliku jest zbyt długie');
              }

              // Tworzenie nagłówka
              const header = new Uint8Array([
                  extensionBytes.length,
                  ...extensionBytes,
                  (fileData.length >> 24) & 0xFF,
                  (fileData.length >> 16) & 0xFF,
                  (fileData.length >> 8) & 0xFF,
                  fileData.length & 0xFF
              ]);

              // Połączenie nagłówka z danymi
              const dataToEncrypt = new Uint8Array([...header, ...fileData]);
              
              // Szyfrowanie całości
              const encryptedData = encrypt(Array.from(dataToEncrypt), keyBytes, selectedLength);
              logFileDetails(new Uint8Array(encryptedData), 'Dane po zaszyfrowaniu:');

              // Zapisywanie zaszyfrowanego pliku
              const blob = new Blob([new Uint8Array(encryptedData)], { type: 'application/octet-stream' });
              const encryptedFileName = `${fileName}.zaszyfrowane_AES_${selectedLength}`;
              
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = encryptedFileName;
              link.click();
              URL.revokeObjectURL(link.href);

              logOperationEnd('Szyfrowanie pliku', {
                  oryginalnyPlik: fileName,
                  zaszyfrowanyPlik: encryptedFileName,
                  rozmiarWejściowy: fileData.length,
                  rozmiarWyjściowy: encryptedData.length,
                  rozszerzenie: extension,
                  długośćKlucza: selectedLength
              });
          } catch (error) {
              logError('Szyfrowanie pliku - przetwarzanie', error);
              console.error('Błąd podczas szyfrowania pliku:', error);
              alert('Wystąpił błąd podczas szyfrowania pliku!');
          }
      };

      reader.readAsArrayBuffer(file);
  } catch (error) {
      logError('Szyfrowanie pliku - przygotowanie', error);
      console.error('Błąd podczas przygotowania szyfrowania:', error);
      alert('Wystąpił błąd podczas przygotowania szyfrowania!');
  }
});

// Obsługa deszyfrowania plików
decryptFileButton?.addEventListener('click', async () => {
  const file = fileInput.files?.[0];
  if (!file) {
      alert('Wybierz plik do deszyfrowania!');
      return;
  }

  const keyHex = (mainKey?.textContent || '').trim();
  if (!keyHex) {
      alert('Najpierw wygeneruj lub wprowadź klucz!');
      return;
  }

  logOperationStart('Deszyfrowanie pliku', {
      nazwaPliku: file.name,
      rozmiar: file.size,
      ostatniaModyfikacja: file.lastModified
  });

  try {
      const keyBytes = hexToBytes(keyHex);
      const selectedLength = parseInt(document.querySelector<HTMLInputElement>('input[name="keyLength"]:checked')?.value || '128');

      const reader = new FileReader();
      reader.onload = async () => {
          try {
              const encryptedData = new Uint8Array(reader.result as ArrayBuffer);
              logFileDetails(encryptedData, 'Dane przed deszyfrowaniem:');

              // Deszyfrowanie danych
              const decryptedData = decrypt(Array.from(encryptedData), keyBytes, selectedLength);
              logFileDetails(new Uint8Array(decryptedData), 'Dane po deszyfrowaniu:');

              if (!validateHeader(decryptedData)) {
                  throw new Error('Nieprawidłowy format nagłówka');
              }

              // Odczytywanie nagłówka
              const extensionLength = decryptedData[0];
              const extensionBytes = decryptedData.slice(1, 1 + extensionLength);
              const extension = new TextDecoder().decode(new Uint8Array(extensionBytes));

              // Odczytywanie rozmiaru pliku
              const headerOffset = 1 + extensionLength;
              const fileSize = 
                  (decryptedData[headerOffset] << 24) |
                  (decryptedData[headerOffset + 1] << 16) |
                  (decryptedData[headerOffset + 2] << 8) |
                  decryptedData[headerOffset + 3];

              // Odczytywanie właściwych danych pliku
              const dataOffset = headerOffset + 4;
              const fileData = decryptedData.slice(dataOffset, dataOffset + fileSize);

              // Tworzenie nazwy pliku
              const baseName = file.name.replace(/\.zaszyfrowane_AES_\d+$/, '');
              const decryptedFileName = `${baseName}.${extension}`;

              // Zapisywanie odszyfrowanego pliku
              const blob = new Blob([new Uint8Array(fileData)], { type: 'application/octet-stream' });
              
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = decryptedFileName;
              link.click();
              URL.revokeObjectURL(link.href);

              logOperationEnd('Deszyfrowanie pliku', {
                  zaszyfrowanyPlik: file.name,
                  odszyfrowanyPlik: decryptedFileName,
                  rozmiarWejściowy: encryptedData.length,
                  rozmiarWyjściowy: fileData.length,
                  rozszerzenie: extension,
                  długośćKlucza: selectedLength,
                  rozmiarNagłówka: dataOffset
              });

              console.log('Szczegóły deszyfrowania:', {
                  długośćRozszerzenia: extensionLength,
                  rozszerzenie: extension,
                  rozmiarPlikuZNagłówka: fileSize,
                  rzeczywistyRozmiar: fileData.length,
                  zgodnośćRozmiaru: fileSize === fileData.length
              });

          } catch (error) {
              logError('Deszyfrowanie pliku - przetwarzanie', {
                  błąd: error,
                  nazwaPliku: file.name,
                  długośćKlucza: selectedLength
              });
              console.error('Błąd podczas deszyfrowania pliku:', error);
              alert('Wystąpił błąd podczas deszyfrowania pliku! Sprawdź, czy używasz właściwego klucza.');
          }
      };

      reader.readAsArrayBuffer(file);
  } catch (error) {
      logError('Deszyfrowanie pliku - przygotowanie', {
          błąd: error,
          nazwaPliku: file.name
      });
      console.error('Błąd podczas przygotowania deszyfrowania:', error);
      alert('Wystąpił błąd podczas przygotowania deszyfrowania!');
  }
});
});