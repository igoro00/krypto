import { SubWord } from './SubWord';
import { RotWord } from './RotWord';
import { Rcon } from './Rcon';

/**
 * Rozszerza klucz AES zgodnie z algorytmem Key Expansion
 * @param key - Klucz wejściowy (128, 192 lub 256 bitów)
 * @returns Rozszerzony klucz jako Uint8Array
 * 
 * Proces rozszerzania klucza:
 * 1. Dzieli klucz na 32-bitowe słowa (4 bajty)
 * 2. Generuje dodatkowe słowa dla każdej rundy
 * 3. Stosuje transformacje RotWord, SubWord i Rcon dla określonych słów
 * 4. Łączy słowa w rozszerzony klucz
 */
export function keyExpansion(key: Uint8Array): Uint8Array {
    // Nk - liczba 32-bitowych słów w kluczu (4 dla AES-128, 6 dla AES-192, 8 dla AES-256)
  const Nk = key.length / 4;
  // Nr - liczba rund (10 dla AES-128, 12 dla AES-192, 14 dla AES-256)
  const Nr = Nk + 6; 
  // Nb - stała określająca liczbę słów w bloku (dla AES zawsze 4)
  const Nb = 4;

  // Inicjalizacja tablicy na rozszerzony klucz
  // Rozmiar: Nb * (Nr + 1) słów (4 bajty każde)
  const w: number[][] = new Array(Nb * (Nr + 1));
  
  // Faza 1: Konwersja klucza wejściowego na słowa
  for (let i = 0; i < Nk; i++) {
      w[i] = [
          key[4 * i],       // Pierwszy bajt słowa
          key[4 * i + 1],   // Drugi bajt słowa
          key[4 * i + 2],   // Trzeci bajt słowa
          key[4 * i + 3]    // Czwarty bajt słowa
      ];
  }
  
  // Faza 2: Generacja dodatkowych słów klucza
  for (let i = Nk; i < Nb * (Nr + 1); i++) {
      let temp = [...w[i - 1]]; // Kopiowanie poprzedniego słowa
      
       // Specjalne transformacje dla co Nk-tego słowa
      if (i % Nk === 0) {
        // 1. RotWord - cykliczne przesunięcie bajtów
          temp = RotWord(temp);

           // 2. SubWord - podstawienie bajtów z S-Box
          temp = SubWord(temp);

          // 3. XOR z odpowiednią stałą rundy Rcon
          temp[0] ^= Rcon(Math.floor(i / Nk))[0];

          // Dodatkowa transformacja dla kluczy 256-bitowych
      } else if (Nk > 6 && i % Nk === 4) {
          temp = SubWord(temp);
      }

       // Generacja nowego słowa jako XOR odpowiednich słów
      w[i] = new Array(4);
      for (let j = 0; j < 4; j++) {
          w[i][j] = w[i - Nk][j] ^ temp[j];
      }
  }
  
   // Konwersja tablicy słów na płaską tablicę bajtów
  return new Uint8Array(w.flat());
}