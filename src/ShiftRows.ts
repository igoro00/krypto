import { shiftLeft, shiftRight, switchHalves } from "./utils";

export function ShiftRows(input: Uint8Array): Uint8Array { 
    // pierwszy wiersz pozostaje bez zmian
    
    // drugi wiersz - przesunięcie o 1 w lewo 
    shiftLeft(input.subarray(4,8)); // shift left
    
    // trzeci wiersz - przesunięcie o 2 w lewo 
    switchHalves(input.subarray(8,12)); //zamien polowki
    
    // czwarty wiersz - przesunięcie o 3 w lewo 
    shiftRight(input.subarray(12,16)); // shift right
    
    return input;
}