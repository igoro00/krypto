import { SubBytes } from './SubBytes';
import { ShiftRows } from './ShiftRows';
import { MixColumns } from './MixColumns';
import { AddRoundKey } from './AddRoundKey';
import { InvSubBytes } from './InvSubBytes';
import { InvShiftRows } from './InvShiftRows';
import { InvMixColumns } from './InvMixColumns';
import { KeyExpansion } from './KeyExpansion';

export function encrypt(input: number[], key: number[], keySize: number): number[] {
  // Liczba rund zależy od rozmiaru klucza
  const Nr = keySize === 128 ? 10 : (keySize === 192 ? 12 : 14);
  
  // Konwersja wejścia na macierz stanu (kolumnami)
  const state = Array(4).fill(0).map(() => Array(4).fill(0));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      state[r][c] = input[r + 4 * c];
    }
  }
  
  // Rozszerzenie klucza
  const expandedKey = KeyExpansion(key, keySize);
  
  // Przygotowanie klucza rundowego dla pierwszej rundy
  const roundKey0 = Array(4).fill(0).map(() => Array(4).fill(0));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      roundKey0[r][c] = expandedKey[c][r];
    }
  }
  
  // Początkowe dodanie klucza rundy
  AddRoundKey(state, roundKey0);
  
  // Rundy
  for (let round = 1; round < Nr; round++) {
    SubBytes(state);
    ShiftRows(state);
    MixColumns(state);
    
    // Przygotowanie klucza rundowego
    const roundKey = Array(4).fill(0).map(() => Array(4).fill(0));
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        roundKey[r][c] = expandedKey[round * 4 + c][r];
      }
    }
    
    AddRoundKey(state, roundKey);
  }
  
  // Ostatnia runda (bez MixColumns)
  SubBytes(state);
  ShiftRows(state);
  
  // Przygotowanie ostatniego klucza rundowego
  const roundKeyLast = Array(4).fill(0).map(() => Array(4).fill(0));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      roundKeyLast[r][c] = expandedKey[Nr * 4 + c][r];
    }
  }
  
  AddRoundKey(state, roundKeyLast);
  
  // Konwersja stanu na wyjście
  const output = new Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      output[r + 4 * c] = state[r][c];
    }
  }
  
  return output;
}

export function decrypt(input: number[], key: number[], keySize: number): number[] {
  // Liczba rund zależy od rozmiaru klucza
  const Nr = keySize === 128 ? 10 : (keySize === 192 ? 12 : 14);
  
  // Konwersja wejścia na macierz stanu (kolumnami)
  const state = Array(4).fill(0).map(() => Array(4).fill(0));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      state[r][c] = input[r + 4 * c];
    }
  }
  
  // Rozszerzenie klucza
  const expandedKey = KeyExpansion(key, keySize);
  
  // Przygotowanie ostatniego klucza rundowego
  const roundKeyLast = Array(4).fill(0).map(() => Array(4).fill(0));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      roundKeyLast[r][c] = expandedKey[Nr * 4 + c][r];
    }
  }
  
  // Początkowe dodanie klucza rundy (ostatni klucz rundowy)
  AddRoundKey(state, roundKeyLast);
  
  // Rundy w odwrotnej kolejności
  for (let round = Nr - 1; round > 0; round--) {
    InvShiftRows(state);
    InvSubBytes(state);
    
    // Przygotowanie klucza rundowego
    const roundKey = Array(4).fill(0).map(() => Array(4).fill(0));
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        roundKey[r][c] = expandedKey[round * 4 + c][r];
      }
    }
    
    AddRoundKey(state, roundKey);
    InvMixColumns(state);
  }
  
  // Ostatnia runda
  InvShiftRows(state);
  InvSubBytes(state);
  
  // Przygotowanie pierwszego klucza rundowego
  const roundKey0 = Array(4).fill(0).map(() => Array(4).fill(0));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      roundKey0[r][c] = expandedKey[c][r];
    }
  }
  
  AddRoundKey(state, roundKey0);
  
  // Konwersja stanu na wyjście
  const output = new Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      output[r + 4 * c] = state[r][c];
    }
  }
  
  return output;
}