export function ShiftRows(input: number[][]) {
    const result = Array(4).fill(0).map(() => Array(4).fill(0));
  
    // Pierwszy wiersz pozostaje bez zmian
    for (let i = 0; i < 4; i++) {
        result[0][i] = input[0][i];
    }
    
    // Drugi wiersz - przesunięcie o 1 w lewo (ROL 1)
    for (let i = 0; i < 4; i++) {
        result[1][i] = input[1][(i + 1) % 4];
    }
    
    // Trzeci wiersz - przesunięcie o 2 w lewo (ROL 2)
    for (let i = 0; i < 4; i++) {
        result[2][i] = input[2][(i + 2) % 4];
    }
    
    // Czwarty wiersz - przesunięcie o 3 w lewo (ROL 3)
    for (let i = 0; i < 4; i++) {
        result[3][i] = input[3][(i + 3) % 4];
    }

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            input[i][j] = result[i][j];
        }
    }
    
    return input;
}