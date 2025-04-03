export async function bufferToBase64(buffer: Uint8Array): Promise<string> {
    // use a FileReader to generate a base64 data URI:
    const base64url = await new Promise<string>(r => {
      const reader = new FileReader()
      reader.onload = () => r(reader.result as string)
      reader.readAsDataURL(new Blob([buffer]))
    });
    // remove the `data:...;base64,` part from the start
    return base64url.slice(base64url.indexOf(',') + 1);
}

export async function base64ToBuffer(b64:string): Promise<Uint8Array> {
    var dataUrl = "data:application/octet-binary;base64," + b64;

    const res = await fetch(dataUrl)
    const arrayBuffer = await res.arrayBuffer();
    return new Uint8Array(arrayBuffer);        
}

export function shiftLeft(input: Uint8Array): Uint8Array {
    const temp = input[0];
    input[0] = input[1];
    input[1] = input[2];
    input[2] = input[3];
    input[3] = temp;

    return input;
}

export function shiftRight(input: Uint8Array): Uint8Array {
    const temp = input[3];
    input[3] = input[2];
    input[2] = input[1];
    input[1] = input[0];
    input[0] = temp;
    return input;
}

export function switchHalves(input: Uint8Array): Uint8Array {
    const a = input[0];
    const b = input[1];
    input[0] = input[2];
    input[1] = input[3];
    input[2] = a;
    input[3] = b;
    return input;
}

export function log(...args: any[]) {
    const VERBOSE = false;
    if(VERBOSE){
        console.log(...args);
    }
}

export function galoisMul(a: number, b: number): number {
    let result = 0;
    
    // Dla wartości 1, 2, 3 możemy użyć poprzedniej implementacji
    if (a === 1) return b;
    if (a === 2) {
      let temp = b << 1;
      if ((b & 0x80) !== 0) temp ^= 0x1b;
      return temp & 0xff;
    }
    if (a === 3) return galoisMul(2, b) ^ b;
    
    // Dla większych wartości (0x09, 0x0b, 0x0d, 0x0e) używamy rozkładu na potęgi 2
    let temp = b;
    // Mnożymy przez 2 odpowiednią liczbę razy i sumujemy wyniki
    for (let i = 0; i < 8; i++) {
      if ((a & (1 << i)) !== 0) {
        result ^= temp;
      }
      
      // Przygotowujemy następną potęgę 2 * temp
      const highBit = (temp & 0x80);
      temp <<= 1;
      if (highBit !== 0) {
        temp ^= 0x1b;
      }
      temp &= 0xff;
    }
    
    return result;
}