export function generateKey(n: number): Uint8Array {
    const key = new Uint8Array(n / 8);
    crypto.getRandomValues(key);
    return key;  
}

export function bytesToHex(key: Uint8Array): string {
    return Array.from(key)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}