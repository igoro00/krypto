// src/main.ts

import "./style.css";
import {
  generateKeys,
  sign,
  verify,
  ElGamalKeys,
  ElGamalSignature,
} from "./elgamal";

let currentKeys: ElGamalKeys | null = null;
let currentSignature: ElGamalSignature | null = null;

function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function showKeys(keys: ElGamalKeys) {
  $("p").textContent = keys.p.toString();
  $("g").textContent = keys.g.toString();
  $("x").textContent = keys.x.toString();
  $("y").textContent = keys.y.toString();
}

function showSignature(sig: ElGamalSignature) {
  $("r").textContent = sig.r.toString();
  $("s").textContent = sig.s.toString();
}

function clearSignature() {
  $("r").textContent = "";
  $("s").textContent = "";
}

function showMessage(msg: string, ok = true) {
  const el = $("message");
  el.textContent = msg;
  el.className = ok ? "ok" : "err";
}

$("gen-keys").addEventListener("click", () => {
  currentKeys = generateKeys(32);
  showKeys(currentKeys);
  showMessage("Wygenerowano nowe klucze!", true);
  clearSignature();
});

$("sign").addEventListener("click", () => {
  if (!currentKeys) {
    showMessage("Najpierw wygeneruj klucze!", false);
    return;
  }
  const msg = (<HTMLTextAreaElement>$("msg")).value;
  if (!msg) {
    showMessage("Wprowadź dane do podpisania!", false);
    return;
  }
  currentSignature = sign(msg, currentKeys);
  showSignature(currentSignature);
  showMessage("Podpis wygenerowany!", true);
});

$("verify").addEventListener("click", () => {
  if (!currentKeys || !currentSignature) {
    showMessage("Brak kluczy lub podpisu!", false);
    return;
  }
  const msg = (<HTMLTextAreaElement>$("msg")).value;
  if (!msg) {
    showMessage("Wprowadź dane do weryfikacji!", false);
    return;
  }
  const ok = verify(msg, currentSignature, currentKeys);
  showMessage(ok ? "Podpis poprawny!" : "Podpis niepoprawny!", ok);
});

$("file").addEventListener("change", (e) => {
  const input = <HTMLInputElement>e.target;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      (<HTMLTextAreaElement>$("msg")).value = ev.target?.result as string;
    };
    reader.readAsText(input.files[0]);
  }
});
