function galoisMul(a: number, b: number): number {
    let result = 0;
    
    // Dla wartości 1, 2, 3 możemy użyć poprzedniej implementacji
    if (a === 1) return b;
    if (a === 2) {
      let temp = b << 1;
      if ((b & 0x80) !== 0) temp ^= 0x1b;
      return temp & 0xff;
    }
    if (a === 3) return galoisMul(2, b) ^ b;
    
    // Dla większych wartości (0x09, 0x0b, 0x0d, 0x0e) używamy rozkładu na potęgi 2
    let temp = b;
    // Mnożymy przez 2 odpowiednią liczbę razy i sumujemy wyniki
    for (let i = 0; i < 8; i++) {
      if ((a & (1 << i)) !== 0) {
        result ^= temp;
      }
      
      // Przygotowujemy następną potęgę 2 * temp
      const highBit = (temp & 0x80);
      temp <<= 1;
      if (highBit !== 0) {
        temp ^= 0x1b;
      }
      temp &= 0xff;
    }
    
    return result;
}

export function InvMixColumns(state: number[][]): number[][] {
    const result = Array(4).fill(0).map(() => Array(4).fill(0));
    
    for (let c = 0; c < 4; c++) {
      result[0][c] = galoisMul(0x0e, state[0][c]) ^ galoisMul(0x0b, state[1][c]) ^ 
                     galoisMul(0x0d, state[2][c]) ^ galoisMul(0x09, state[3][c]);
      result[1][c] = galoisMul(0x09, state[0][c]) ^ galoisMul(0x0e, state[1][c]) ^ 
                     galoisMul(0x0b, state[2][c]) ^ galoisMul(0x0d, state[3][c]);
      result[2][c] = galoisMul(0x0d, state[0][c]) ^ galoisMul(0x09, state[1][c]) ^ 
                     galoisMul(0x0e, state[2][c]) ^ galoisMul(0x0b, state[3][c]);
      result[3][c] = galoisMul(0x0b, state[0][c]) ^ galoisMul(0x0d, state[1][c]) ^ 
                     galoisMul(0x09, state[2][c]) ^ galoisMul(0x0e, state[3][c]);
    }
    
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        state[r][c] = result[r][c];
      }
    }
    
    return state;
}