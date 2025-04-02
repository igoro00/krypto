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

//@ts-ignore
export async function base64ToBuffer(b64:string): Promise<ArrayBuffer> {
    var dataUrl = "data:application/octet-binary;base64," + b64;

    const res = await fetch(dataUrl)
    return await res.arrayBuffer();        
}

export function log(...args: any[]) {
    const VERBOSE = true;
    if(VERBOSE){
        log(...args);
    }
}