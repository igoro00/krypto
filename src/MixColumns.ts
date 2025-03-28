function galoisMul(a: number, b: number): number {
    if (a === 1) {
      return b; // 1 * b = b
    } else if (a === 2) {
      // Mnożenie przez 2 to przesunięcie w lewo o 1
      let result = b << 1;
      // Jeśli najstarszy bit był 1, wykonujemy XOR z 0x1b
      if ((b & 0x80) !== 0) {
        result ^= 0x1b;
      }
      return result & 0xff; // Zapewniamy, że wynik jest 8-bitowy
    } else if (a === 3) {
      // 3 * b = (2 * b) ^ b
      return galoisMul(2, b) ^ b;
    }
    
    return 0;
  }

export function MixColumns(state: number[][]): number[][] {
    const result = Array(4).fill(0).map(() => Array(4).fill(0));
    
    for (let c = 0; c < 4; c++) {
      result[0][c] = galoisMul(2, state[0][c]) ^ galoisMul(3, state[1][c]) ^ state[2][c] ^ state[3][c];
      result[1][c] = state[0][c] ^ galoisMul(2, state[1][c]) ^ galoisMul(3, state[2][c]) ^ state[3][c];
      result[2][c] = state[0][c] ^ state[1][c] ^ galoisMul(2, state[2][c]) ^ galoisMul(3, state[3][c]);
      result[3][c] = galoisMul(3, state[0][c]) ^ state[1][c] ^ state[2][c] ^ galoisMul(2, state[3][c]);
    }
    
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        state[r][c] = result[r][c];
      }
    }
    
    return state;
  }