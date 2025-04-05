import { shiftLeft, shiftRight, switchHalves } from "./utils";

export function InvShiftRows(input: Uint8Array) {
    // pierwszy wiersz pozostaje bez zmian
    
    // drugi wiersz - przesunięcie o 1 w prawo
    shiftRight(input.subarray(4,8))

    // trzeci wiersz - przesunięcie o 2 w prawo
    switchHalves(input.subarray(8,12));

    // czwarty wiersz - przesunięcie o 3 w prawo
    shiftLeft(input.subarray(12,16));
    
    return input;
}