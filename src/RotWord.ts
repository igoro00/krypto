export function RotWord(input: number[]) {
    let out = [...input];
    let first = out.shift();
    
    if (first === undefined) {
        throw new Error("First undefined");
    }

    out.push(first);

    return out;
}