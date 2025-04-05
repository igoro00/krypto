import { decrypt, encrypt } from "./aes";

onmessage = (e) => {
    if (e.data.action === 'encrypt') {
        postMessage(encrypt(e.data.data, e.data.key));
    } 
    if (e.data.action === 'decrypt') {
        postMessage(decrypt(e.data.data, e.data.key));
    }
};
  