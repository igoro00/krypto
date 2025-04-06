/**
 * Wykonuje operację AddRoundKey w algorytmie AES - dodanie klucza rundowego poprzez XOR
 * @param state - Aktualny stan (16 bajtów) poddawany transformacji
 * @param roundKey - Klucz rundowy (16 bajtów)
 * @returns Zmodyfikowany stan po operacji XOR z kluczem rundowym
 */
export function AddRoundKey(state: Uint8Array, roundKey: Uint8Array): Uint8Array {
  // wykonujemy operację XOR między każdym bajtem stanu i odpowiadającym bajtem klucza rundowego
  for (let i = 0; i < 16; i++) {
    // XOR na każdym bajcie (state[i] = state[i] XOR roundKey[i])
    state[i] ^= roundKey[i];
  }
  return state;
}