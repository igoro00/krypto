import { galoisMul } from "./utils";

export function InvMixColumns(state: Uint8Array): Uint8Array {
    const result = new Uint8Array(16);

    for (let c = 0; c < 4; c++) {
        result[0 * 4 + c] =
            galoisMul(0x0e, state[0 * 4 + c]) ^
            galoisMul(0x0b, state[1 * 4 + c]) ^
            galoisMul(0x0d, state[2 * 4 + c]) ^
            galoisMul(0x09, state[3 * 4 + c]);
        result[1 * 4 + c] =
            galoisMul(0x09, state[0 * 4 + c]) ^
            galoisMul(0x0e, state[1 * 4 + c]) ^
            galoisMul(0x0b, state[2 * 4 + c]) ^
            galoisMul(0x0d, state[3 * 4 + c]);
        result[2 * 4 + c] =
            galoisMul(0x0d, state[0 * 4 + c]) ^
            galoisMul(0x09, state[1 * 4 + c]) ^
            galoisMul(0x0e, state[2 * 4 + c]) ^
            galoisMul(0x0b, state[3 * 4 + c]);
        result[3 * 4 + c] =
            galoisMul(0x0b, state[0 * 4 + c]) ^
            galoisMul(0x0d, state[1 * 4 + c]) ^
            galoisMul(0x09, state[2 * 4 + c]) ^
            galoisMul(0x0e, state[3 * 4 + c]);
    }

    state.set(result);

    return state;
}
