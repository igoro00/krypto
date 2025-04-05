import { decrypt, encrypt } from "./aes";

onmessage = (e) => {
    if (e.data.action === 'encrypt') {
        postMessage({
            type: 'result',
            data: encrypt(e.data.data, e.data.key, (i:number, total:number) => {
                postMessage({
                    type: 'progress',
                    data: `${((i/total)*100).toFixed(2)}%`
                })
            }),
        });
    } 

    if (e.data.action === 'decrypt') {
        postMessage({
            type: 'result',
            data: decrypt(e.data.data, e.data.key, (i:number, total:number) => {
                postMessage({
                    type: 'progress',
                    data: `${((i/total)*100).toFixed(2)}%`
                })
            }),
        });
    } 
};