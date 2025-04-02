import { SubWord } from './SubWord';
import { RotWord } from './RotWord';
import { Rcon } from './Rcon';

export function keyExpansion(key: number[], keySize: number): number[][] {
  const Nk = keySize / 32; // liczba 32-bitowych słów w kluczu
  const Nr = Nk + 6;       // liczba rund
  const Nb = 4;            // stała dla AES
  
  // Tablica na rozszerzony klucz
  const w: number[][] = new Array(Nb * (Nr + 1));
  
  // Konwersja klucza na słowa
  for (let i = 0; i < Nk; i++) {
      w[i] = [
          key[4 * i],
          key[4 * i + 1],
          key[4 * i + 2],
          key[4 * i + 3]
      ];
  }
  
  for (let i = Nk; i < Nb * (Nr + 1); i++) {
      let temp = [...w[i - 1]];
      
      if (i % Nk === 0) {
          temp = RotWord(temp);
          temp = SubWord(temp);
          temp[0] ^= Rcon(Math.floor(i / Nk))[0];
      } else if (Nk > 6 && i % Nk === 4) {
          temp = SubWord(temp);
      }
      
      w[i] = new Array(4);
      for (let j = 0; j < 4; j++) {
          w[i][j] = w[i - Nk][j] ^ temp[j];
      }
  }
  
  return w;
}