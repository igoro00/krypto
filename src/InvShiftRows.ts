import { shiftLeft, shiftRight, switchHalves } from "./utils";

export function InvShiftRows(input: Uint8Array) {
  
    // Pierwszy wiersz pozostaje bez zmian
    
    // Drugi wiersz - przesunięcie o 1 w prawo (ROR 1)
    shiftRight(input.subarray(4,8))

    // Trzeci wiersz - przesunięcie o 2 w prawo (ROR 2)
    switchHalves(input.subarray(8,12));

    // Czwarty wiersz - przesunięcie o 3 w prawo (ROR 3)
    shiftLeft(input.subarray(12,16));
    
    return input;
}