import { SubWord } from './SubWord';
import { RotWord } from './RotWord';
import { Rcon } from './RCON';

export function KeyExpansion(key: number[], keySize: number): number[][] {
    // Nk - liczba 32-bitowych słów w kluczu
    // Nr - liczba rund
    // Nb - liczba kolumn w stanie (zawsze 4 dla AES)
    const Nk = keySize / 32;
    const Nr = Nk + 6;
    const Nb = 4;
    
    // Tablica na rozszerzony klucz - każdy element to 4-bajtowe słowo
    const w: number[][] = new Array(Nb * (Nr + 1));
    
    // Kopiowanie początkowego klucza do pierwszych Nk słów
    for (let i = 0; i < Nk; i++) {
      w[i] = [
        key[4 * i],
        key[4 * i + 1],
        key[4 * i + 2],
        key[4 * i + 3]
      ];
    }
    
    // Generowanie pozostałych słów rozszerzonego klucza
    for (let i = Nk; i < Nb * (Nr + 1); i++) {
      // Kopiujemy poprzednie słowo jako punkt wyjścia
      let temp = [...w[i - 1]];
      
      if (i % Nk === 0) {
        // Dla słów, których indeks jest wielokrotnością Nk:
        // 1. Wykonujemy RotWord (cykliczne przesunięcie w lewo)
        // 2. Wykonujemy SubWord (substytucja bajtów przez S-box)
        // 3. XORujemy z stałą rundową Rcon
        temp = SubWord(RotWord(temp));
        
        // XOR z Rcon
        const roundConstant = Rcon(i / Nk);
        for (let j = 0; j < 4; j++) {
          temp[j] ^= roundConstant[j];
        }
      } else if (Nk > 6 && i % Nk === 4) {
        // Dla AES-256 (Nk=8), co czwarte słowo przechodzi przez SubWord
        temp = SubWord(temp);
      }
      
      // Każde nowe słowo to XOR poprzedniego słowa i słowa oddalonego o Nk pozycji
      w[i] = new Array(4);
      for (let j = 0; j < 4; j++) {
        w[i][j] = w[i - Nk][j] ^ temp[j];
      }
    }
    
    return w;
  }