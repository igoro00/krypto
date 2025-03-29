export function AddRoundKey(state: number[][], roundKey: number[][]): number[][] {
  // Wykonujemy operację XOR między każdym bajtem stanu i odpowiadającym bajtem klucza rundowego
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      state[i][j] ^= roundKey[i][j];
    }
  }
  
  return state;
}