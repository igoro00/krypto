import { SubBytes } from './SubBytes';
import { ShiftRows } from './ShiftRows';
import { MixColumns } from './MixColumns';
import { AddRoundKey } from './AddRoundKey';
import { InvSubBytes } from './InvSubBytes';
import { InvShiftRows } from './InvShiftRows';
import { InvMixColumns } from './InvMixColumns';
import { KeyExpansion } from './KeyExpansion';

// Dodawanie paddingu PKCS#7
function addPadding(data: number[]): number[] {
  const blockSize = 16;
  const paddingLength = blockSize - (data.length % blockSize);
  const paddedData = new Array(data.length + paddingLength);
  
  // Kopiowanie oryginalnych danych
  for (let i = 0; i < data.length; i++) {
      paddedData[i] = data[i];
  }
  
  // Dodawanie paddingu
  for (let i = data.length; i < paddedData.length; i++) {
      paddedData[i] = paddingLength;
  }
  
  return paddedData;
}

// Usuwanie paddingu PKCS#7
function removePadding(data: number[]): number[] {
  if (data.length === 0 || data.length % 16 !== 0) {
      throw new Error('Invalid data length');
  }

  const paddingLength = data[data.length - 1];
  
  if (paddingLength < 1 || paddingLength > 16) {
      throw new Error('Invalid padding length');
  }

  // Sprawdzanie poprawności paddingu
  for (let i = data.length - paddingLength; i < data.length; i++) {
      if (data[i] !== paddingLength) {
          throw new Error('Invalid padding values');
      }
  }

  return data.slice(0, data.length - paddingLength);
}

export function encrypt(input: number[], key: number[], keySize: number): number[] {
  if (!input || !key || !keySize) {
    throw new Error('Invalid input parameters');
}

  const paddedInput = addPadding(input);
  const blocks = [];
  const expandedKey = KeyExpansion(key, keySize);
  const Nr = keySize === 128 ? 10 : (keySize === 192 ? 12 : 14);

  if (![128, 192, 256].includes(keySize)) {
    throw new Error('Invalid key size');
  } 

  for (let i = 0; i < paddedInput.length; i += 16) {
    let state = Array(4).fill(0).map(() => Array(4).fill(0));
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        state[r][c] = paddedInput[i + r + 4 * c];
      }
    }

    state = AddRoundKey(state, expandedKey.slice(0, 4));

    for (let round = 1; round < Nr; round++) {
      state = SubBytes(state);
      state = ShiftRows(state);
      state = MixColumns(state);
      state = AddRoundKey(state, expandedKey.slice(round * 4, (round + 1) * 4));
    }

    state = SubBytes(state);
    state = ShiftRows(state);
    state = AddRoundKey(state, expandedKey.slice(Nr * 4, (Nr + 1) * 4));

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        blocks.push(state[r][c]);
      }
    }
  }

  console.log('Zaszyfrowane dane:', blocks);
  return blocks;
}

export function decrypt(input: number[], key: number[], keySize: number): number[] {
  // Weryfikacja danych wejściowych
  if (!input || !key || !keySize) {
      throw new Error('Invalid input parameters');
  }

  if (input.length % 16 !== 0) {
      throw new Error('Invalid input length');
  }

  // Weryfikacja rozmiaru klucza
  if (![128, 192, 256].includes(keySize)) {
      throw new Error('Invalid key size');
  }

  try {
      const blocks: number[] = [];
      const expandedKey = KeyExpansion(key, keySize);
      const Nr = keySize === 128 ? 10 : (keySize === 192 ? 12 : 14);

      // Przetwarzanie bloków danych
      for (let i = 0; i < input.length; i += 16) {
          // Inicjalizacja stanu
          let state = Array(4).fill(0).map(() => Array(4).fill(0));
          
          // Konwersja wejścia na macierz stanu
          for (let r = 0; r < 4; r++) {
              for (let c = 0; c < 4; c++) {
                  state[r][c] = input[i + r + 4 * c];
              }
          }

          // Początkowa runda - AddRoundKey
          state = AddRoundKey(state, expandedKey.slice(Nr * 4, (Nr + 1) * 4));

          // Główne rundy deszyfrowania
          for (let round = Nr - 1; round > 0; round--) {
              state = InvShiftRows(state);
              state = InvSubBytes(state);
              state = AddRoundKey(state, expandedKey.slice(round * 4, (round + 1) * 4));
              state = InvMixColumns(state);
          }

          // Ostatnia runda
          state = InvShiftRows(state);
          state = InvSubBytes(state);
          state = AddRoundKey(state, expandedKey.slice(0, 4));

          // Konwersja stanu z powrotem na tablicę
          for (let r = 0; r < 4; r++) {
              for (let c = 0; c < 4; c++) {
                  blocks.push(state[r][c]);
              }
          }
      }

      // Usuwanie paddingu i zwracanie wyniku
      try {
          const result = removePadding(blocks);
          
          // Dodatkowa weryfikacja wyniku
          if (!result || result.length === 0) {
              throw new Error('Invalid decryption result');
          }

          // Sprawdzenie czy wszystkie bajty są w prawidłowym zakresie
          if (!result.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255)) {
              throw new Error('Invalid byte values in decrypted data');
          }

          return result;
      } catch (paddingError) {
          throw new Error(`Padding removal failed: ${paddingError}`);
      }

  } catch (error) {
      // Szczegółowy komunikat błędu
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during decryption';
      throw new Error(`Decryption failed: ${errorMessage}`);
  }
}