import "./style.css";

import {
  generateKeys,
  sign,
  verify,
  ElGamalKeys, // typ opisujący strukturę kluczy
  ElGamalSignature, // typ opisujący strukturę podpisu
} from "./elgamal";

// aktualny zestaw kluczy
let currentKeys: ElGamalKeys = generateKeys(32);

// aktualny podpis (na początku brak podpisu)
let currentSignature: ElGamalSignature | null = null;

let fileName = "";

// binarna zawartość pliku (na początku null)
let fileContent: ArrayBuffer | null = null;

// funkcja do pobierania elementów HTML po id
function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

// separator- oddzielenie danych od podpisu
const SIGNATURE_SEPARATOR = new Uint8Array([
  0xff, 0xfe, 0xfd, 0xfc, 0xfb, 0xfa, 0xf9, 0xf8,
]);

// wybór pliku
$("file").addEventListener("change", (e) => {
  const input = <HTMLInputElement>e.target; // rzutowanie na input typu file
  if (input.files && input.files[0]) {
    // czy plik został wybrany
    fileName = input.files[0].name;
    const reader = new FileReader();
    reader.onload = function (ev) {
      fileContent = ev.target?.result as ArrayBuffer;
      $("message").textContent = `Załadowano plik: ${fileName}`;
      $("message").className = "";
      $("download-signedfile").style.display = "none";
      $("download-publickey").style.display = "none";
    };
    reader.readAsArrayBuffer(input.files[0]); // czytanie pliku jako ArrayBuffer
  }
});

// podpisanie pliku
$("sign").addEventListener("click", async () => {
  if (!fileContent) {
    $("message").textContent = "Wybierz plik!";
    $("message").className = "err";
    return;
  }
  try {
    // podpisanie pliku aktualnym kluczem prywatnym
    currentSignature = await sign(fileContent, currentKeys);
    $("message").textContent = "Plik został podpisany! Możesz go pobrać.";
    $("message").className = "ok";
    $("download-signedfile").style.display = "inline-block";
    $("download-publickey").style.display = "inline-block";
  } catch (error) {
    $("message").textContent = "Błąd podczas podpisywania!";
    $("message").className = "err";
  }
});

// pobieranie pliku z podpisem
$("download-signedfile").addEventListener("click", () => {
  if (!fileContent || !currentSignature) return;

  // tekst podpisu: r i s w systemie szesnastkowym, oddzielone nową linią
  const signatureText = `${currentSignature.r.toString(
    16
  )}\n${currentSignature.s.toString(16)}`;
  // podpis na tablicę bajtów
  const signatureBuffer = new TextEncoder().encode(signatureText);

  // całkowita długość nowego pliku (dane + separator + podpis)
  const totalLength =
    fileContent.byteLength +
    SIGNATURE_SEPARATOR.length +
    signatureBuffer.length;
  // nowy bufor na całość
  const combinedBuffer = new ArrayBuffer(totalLength);
  const view = new Uint8Array(combinedBuffer);

  // dane pliku na początek
  view.set(new Uint8Array(fileContent), 0);
  // separator po danych
  view.set(SIGNATURE_SEPARATOR, fileContent.byteLength);
  // podpis po separatorze
  view.set(
    signatureBuffer,
    fileContent.byteLength + SIGNATURE_SEPARATOR.length
  );

  // obiekt Blob z całości (do pobrania)
  const blob = new Blob([combinedBuffer], { type: "application/octet-stream" });
  // tymczasowy link do pobrania
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  // nazwa pliku (dodajemy _signed przed rozszerzeniem)
  a.download = fileName.replace(/(\.[^.]+)?$/, "_signed$1");
  a.click();
  URL.revokeObjectURL(a.href); // zwolnienie zasobów

  $("message").textContent = "Plik z podpisem został pobrany.";
  $("message").className = "ok";
});

// pobieranie klucza publicznego
$("download-publickey").addEventListener("click", () => {
  // tekst z parametrami klucza publicznego (p, g, y) w systemie szesnastkowym, każda wartość w osobnej linii
  const publicKeyText = [
    currentKeys.p.toString(16),
    currentKeys.g.toString(16),
    currentKeys.y.toString(16),
  ].join("\n");
  // Blob z tekstem klucza
  const blob = new Blob([publicKeyText], { type: "text/plain" });
  //  tymczasowy link do pobrania
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "publickey.txt";
  a.click();
  URL.revokeObjectURL(a.href);

  $("message").textContent = "Klucz publiczny został pobrany.";
  $("message").className = "ok";
});

// weryfikacja podpisu
let verifyFileContent: ArrayBuffer | null = null; // plik do weryfikacji
let verifyPublicKey = ""; // klucz publiczny do weryfikacji

// plik z podpisem do weryfikacji
$("verify-signedfile").addEventListener("change", (e) => {
  const input = <HTMLInputElement>e.target;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      verifyFileContent = ev.target?.result as ArrayBuffer;
    };
    reader.readAsArrayBuffer(input.files[0]); // plik jako ArrayBuffer
  }
});

// plik z kluczem publicznym do weryfikacji
$("verify-publickey").addEventListener("change", (e) => {
  const input = <HTMLInputElement>e.target;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      verifyPublicKey = ev.target?.result as string;
    };
    reader.readAsText(input.files[0]); // plik jako tekst
  }
});

// weryfikacja podpisu
$("verify").addEventListener("click", async () => {
  try {
    if (!verifyFileContent || !verifyPublicKey) {
      throw new Error("Brak pliku i/lub klucza publicznego!");
    }

    // zawartość pliku na tablicę bajtów
    const view = new Uint8Array(verifyFileContent);
    let separatorIndex = -1;
    // separator, który oddziela dane od podpisu
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

    // wyodrębnienie oryginalnego pliku (do podpisu)
    const originalFile = verifyFileContent.slice(0, separatorIndex);
    // wyodrębnienie podpisu (tekst po separatorze)
    const signatureText = new TextDecoder().decode(
      verifyFileContent.slice(separatorIndex + SIGNATURE_SEPARATOR.length)
    );
    // rozdzielenie- podpis na r i s (każdy w osobnej linii)
    const [rHex, sHex] = signatureText.trim().split("\n");
    const r = BigInt("0x" + rHex.trim()); // zamiana na bigint
    const s = BigInt("0x" + sHex.trim());

    // rozdzielenie- klucz publiczny na p, g, y
    const [pHex, gHex, yHex] = verifyPublicKey.trim().split("\n");
    const p = BigInt("0x" + pHex.trim());
    const g = BigInt("0x" + gHex.trim());
    const y = BigInt("0x" + yHex.trim());

    // weryfikacja podpisu (funkcja verify nie używa klucza prywatnego, więc x może być dowolny)
    const ok = await verify(originalFile, { r, s }, { p, g, y, x: 0n });

    $("verify-result").textContent = ok
      ? "✓ Podpis poprawny!"
      : "✗ Podpis niepoprawny!";
    $("verify-result").className = ok ? "ok" : "err";
  } catch (err) {
    $("verify-result").textContent =
      err instanceof Error ? err.message : "Błąd pliku!";
    $("verify-result").className = "err";
  }
});
