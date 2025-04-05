import { galoisMul } from "./utils";

export function MixColumns(state: Uint8Array): Uint8Array {
    const result = new Uint8Array(16);
    
    for (let c = 0; c < 4; c++) {
        result[0*4+c] = galoisMul(2, state[0*4+c]) ^ galoisMul(3, state[1*4+c]) ^ state[2*4+c] ^ state[3*4+c];
        result[1*4+c] = state[0*4+c] ^ galoisMul(2, state[1*4+c]) ^ galoisMul(3, state[2*4+c]) ^ state[3*4+c];
        result[2*4+c] = state[0*4+c] ^ state[1*4+c] ^ galoisMul(2, state[2*4+c]) ^ galoisMul(3, state[3*4+c]);
        result[3*4+c] = galoisMul(3, state[0*4+c]) ^ state[1*4+c] ^ state[2*4+c] ^ galoisMul(2, state[3*4+c]);
    }
    
    state.set(result);
    
    return state;
}