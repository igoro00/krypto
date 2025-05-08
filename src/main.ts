import "./style.css";
import {
  generateKeys,
  sign,
  verify,
  ElGamalKeys,
  ElGamalSignature,
} from "./elgamal";

// po FF FE FD FC FB FA F9 F8 (separatorze) jest podpis, może go zmienić np. w HxD

let currentKeys: ElGamalKeys = generateKeys(32);
let currentSignature: ElGamalSignature | null = null;
let fileName = "";
let fileContent: ArrayBuffer | null = null;

function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

// Stałe dla separatora podpisu
const SIGNATURE_SEPARATOR = new Uint8Array([
  0xff, 0xfe, 0xfd, 0xfc, 0xfb, 0xfa, 0xf9, 0xf8,
]);

$("file").addEventListener("change", (e) => {
  const input = <HTMLInputElement>e.target;
  if (input.files && input.files[0]) {
    fileName = input.files[0].name;
    const reader = new FileReader();
    reader.onload = function (ev) {
      fileContent = ev.target?.result as ArrayBuffer;
      $("message").textContent = `Załadowano plik: ${fileName}`;
      $("message").className = "";
    };
    reader.readAsArrayBuffer(input.files[0]);
  }
});

$("sign").addEventListener("click", async () => {
  if (!fileContent) {
    $("message").textContent = "Najpierw wybierz plik!";
    $("message").className = "err";
    return;
  }
  try {
    currentSignature = await sign(fileContent, currentKeys);
    $("message").textContent = "Plik został podpisany!";
    $("message").className = "ok";
    $("download-signedfile").style.display = "inline-block";
    $("download-publickey").style.display = "inline-block";
  } catch (error) {
    $("message").textContent = "Błąd podczas podpisywania!";
    $("message").className = "err";
  }
});

$("download-signedfile").addEventListener("click", () => {
  if (!fileContent || !currentSignature) return;

  // Konwersja podpisu na tekst
  const signatureText = `${currentSignature.r.toString(
    16
  )}\n${currentSignature.s.toString(16)}`;
  const signatureBuffer = new TextEncoder().encode(signatureText);

  // Tworzenie nowego bufora z miejscem na wszystkie komponenty
  const totalLength =
    fileContent.byteLength +
    SIGNATURE_SEPARATOR.length +
    signatureBuffer.length;
  const combinedBuffer = new ArrayBuffer(totalLength);
  const view = new Uint8Array(combinedBuffer);

  // Kopiowanie oryginalnego pliku
  view.set(new Uint8Array(fileContent), 0);
  // Dodawanie separatora
  view.set(SIGNATURE_SEPARATOR, fileContent.byteLength);
  // Dodawanie podpisu
  view.set(
    signatureBuffer,
    fileContent.byteLength + SIGNATURE_SEPARATOR.length
  );

  // Pobieranie pliku
  const blob = new Blob([combinedBuffer], { type: "application/octet-stream" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName.replace(/(\.[^.]+)?$/, "_signed$1");
  a.click();
  URL.revokeObjectURL(a.href);
});

$("download-publickey").addEventListener("click", () => {
  const publicKeyText = [
    currentKeys.p.toString(16),
    currentKeys.g.toString(16),
    currentKeys.y.toString(16),
  ].join("\n");
  const blob = new Blob([publicKeyText], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "publickey.txt";
  a.click();
  URL.revokeObjectURL(a.href);
});

let verifyFileContent: ArrayBuffer | null = null;
let verifyPublicKey = "";

$("verify-signedfile").addEventListener("change", (e) => {
  const input = <HTMLInputElement>e.target;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      verifyFileContent = ev.target?.result as ArrayBuffer;
    };
    reader.readAsArrayBuffer(input.files[0]);
  }
});

$("verify-publickey").addEventListener("change", (e) => {
  const input = <HTMLInputElement>e.target;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      verifyPublicKey = ev.target?.result as string;
    };
    reader.readAsText(input.files[0]);
  }
});

$("verify").addEventListener("click", async () => {
  try {
    if (!verifyFileContent || !verifyPublicKey) {
      throw new Error("Brak pliku lub klucza publicznego!");
    }

    // Szukanie separatora w pliku
    const view = new Uint8Array(verifyFileContent);
    let separatorIndex = -1;
    for (let i = 0; i <= view.length - SIGNATURE_SEPARATOR.length; i++) {
      let found = true;
      for (let j = 0; j < SIGNATURE_SEPARATOR.length; j++) {
        if (view[i + j] !== SIGNATURE_SEPARATOR[j]) {
          found = false;
          break;
        }
      }
      if (found) {
        separatorIndex = i;
        break;
      }
    }

    if (separatorIndex === -1) {
      throw new Error("Nieprawidłowy format pliku!");
    }

    // Wyodrębnienie oryginalnego pliku i podpisu
    const originalFile = verifyFileContent.slice(0, separatorIndex);
    const signatureText = new TextDecoder().decode(
      verifyFileContent.slice(separatorIndex + SIGNATURE_SEPARATOR.length)
    );
    const [rHex, sHex] = signatureText.trim().split("\n");
    const r = BigInt("0x" + rHex.trim());
    const s = BigInt("0x" + sHex.trim());

    // Parsowanie klucza publicznego
    const [pHex, gHex, yHex] = verifyPublicKey.trim().split("\n");
    const p = BigInt("0x" + pHex.trim());
    const g = BigInt("0x" + gHex.trim());
    const y = BigInt("0x" + yHex.trim());

    const ok = await verify(originalFile, { r, s }, { p, g, y, x: 0n });

    $("verify-result").textContent = ok
      ? "Podpis poprawny!"
      : "Podpis niepoprawny!";
    $("verify-result").className = ok ? "ok" : "err";
  } catch (err) {
    $("verify-result").textContent =
      err instanceof Error ? err.message : "Błąd pliku!";
    $("verify-result").className = "err";
  }
});
