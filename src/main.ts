import "./style.css";
import {
  generateKeys,
  sign,
  verify,
  ElGamalKeys,
  ElGamalSignature,
} from "./elgamal";

let currentKeys: ElGamalKeys = generateKeys(32);
let currentSignature: ElGamalSignature | null = null;
let fileName = "";
let fileContent = "";

function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

// Wczytaj plik do podpisania
$("file").addEventListener("change", (e) => {
  const input = <HTMLInputElement>e.target;
  if (input.files && input.files[0]) {
    fileName = input.files[0].name;
    const reader = new FileReader();
    reader.onload = function (ev) {
      fileContent = ev.target?.result as string;
      $("message").textContent = `Załadowano plik: ${fileName}`;
    };
    reader.readAsText(input.files[0]);
  }
});

// Podpisz plik i dołącz podpis na końcu
$("sign").addEventListener("click", async () => {
  if (!fileContent) {
    $("message").textContent = "Najpierw wybierz plik!";
    $("message").className = "err";
    return;
  }
  currentSignature = await sign(fileContent, currentKeys);
  $("message").textContent = "Plik został podpisany!";
  $("message").className = "ok";
  $("download-signedfile").style.display = "inline-block";
  $("download-publickey").style.display = "inline-block";
});

// Pobierz plik z dołączonym podpisem (to samo rozszerzenie, dopisek _podpisany)
$("download-signedfile").addEventListener("click", () => {
  if (!currentSignature) return;
  const signatureText = `---SIGNATURE---\nr: ${currentSignature.r.toString(
    16
  )}\ns: ${currentSignature.s.toString(16)}`;
  const signedFileContent =
    fileContent.replace(/\s*$/, "") + "\n\n" + signatureText + "\n";
  const dotIdx = fileName.lastIndexOf(".");
  const signedFileName =
    dotIdx !== -1
      ? fileName.slice(0, dotIdx) + "_podpisany" + fileName.slice(dotIdx)
      : fileName + "_podpisany";
  const blob = new Blob([signedFileContent], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = signedFileName;
  a.click();
  URL.revokeObjectURL(a.href);
});

// Pobierz klucz publiczny jako plik tekstowy (hex, każda wartość w nowej linii)
$("download-publickey").addEventListener("click", () => {
  if (!currentKeys) return;
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

// --- Weryfikacja podpisu z pliku z danymi+podpisem ---

let verifySignedFile = "";
let verifyPublicKey = "";

$("verify-signedfile").addEventListener("change", (e) => {
  const input = <HTMLInputElement>e.target;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      verifySignedFile = ev.target?.result as string;
    };
    reader.readAsText(input.files[0]);
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
    // Rozdziel dane i podpis po markerze
    const [dataPart, signaturePart] = verifySignedFile.split("---SIGNATURE---");
    if (!signaturePart) throw new Error("Brak podpisu w pliku!");
    const [rLine, sLine] = signaturePart.trim().split("\n");
    const r = BigInt("0x" + rLine.split(":")[1].trim());
    const s = BigInt("0x" + sLine.split(":")[1].trim());
    // Parsowanie klucza publicznego
    const [pHex, gHex, yHex] = verifyPublicKey.trim().split("\n");
    const p = BigInt("0x" + pHex.trim());
    const g = BigInt("0x" + gHex.trim());
    const y = BigInt("0x" + yHex.trim());
    const ok = await verify(
      dataPart.replace(/\s*$/, ""), // usuwamy końcowe entery
      { r, s },
      { p, g, y, x: 0n }
    );
    $("verify-result").textContent = ok
      ? "Podpis poprawny!"
      : "Podpis niepoprawny!";
    $("verify-result").className = ok ? "ok" : "err";
  } catch (err) {
    $("verify-result").textContent = "Błąd pliku!";
    $("verify-result").className = "err";
  }
});
