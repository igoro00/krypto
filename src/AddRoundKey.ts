



export function AddRoundKey(state: Uint8Array, roundKey: Uint8Array): Uint8Array {
  // wykonujemy operację XOR między każdym bajtem stanu i odpowiadającym bajtem klucza rundowego
  for (let i = 0; i < 16; i++) {
    state[i] ^= roundKey[i];
  }
  return state;
}