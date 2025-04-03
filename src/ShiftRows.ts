import { shiftLeft, shiftRight, switchHalves } from "./utils";

export function ShiftRows(input: Uint8Array): Uint8Array { 
    // Pierwszy wiersz pozostaje bez zmian
    
    // Drugi wiersz - przesunięcie o 1 w lewo (ROL 1)
    shiftLeft(input.subarray(4,8)); // shift left
    
    // Trzeci wiersz - przesunięcie o 2 w lewo (ROL 2)
    switchHalves(input.subarray(8,12)); //zamien polowki
    
    // Czwarty wiersz - przesunięcie o 3 w lewo (ROL 3)
    shiftRight(input.subarray(12,16)); // shift right
    
    return input;
}