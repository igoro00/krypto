import { addPKCS7Padding, removePKCS7Padding } from "../aes";

// Dodaj ten kod na końcu funkcji DOMContentLoaded
console.log("=== TEST PADDINGU ===");
const testText = "kotek"; // 5 bajtów
console.log("Tekst testowy:", testText);

// Konwersja na bajty
const encoder = new TextEncoder();
const testBytes = encoder.encode(testText);
console.log("Bajty:", testBytes);
console.log("Długość:", testBytes.length);

// Dodanie paddingu
const paddedBytes = addPKCS7Padding(testBytes);
console.log("Po paddingu:", paddedBytes);
console.log("Długość po paddingu:", paddedBytes.length);

// Symulacja szyfrowania i deszyfrowania (pomijamy faktyczne szyfrowanie)
// Usunięcie paddingu
try {
    const unpaddedBytes = removePKCS7Padding(paddedBytes);
    console.log("Po usunięciu paddingu:", unpaddedBytes);
    console.log("Długość po usunięciu paddingu:", unpaddedBytes.length);
    
    // Konwersja z powrotem na tekst
    const decoder = new TextDecoder();
    const resultText = decoder.decode(new Uint8Array(unpaddedBytes));
    console.log("Tekst po deszyfracji:", resultText);
    
    if (resultText === testText) {
        console.log("TEST PADDINGU: SUKCES");
    } else {
        console.log("TEST PADDINGU: BŁĄD - tekst nie zgadza się");
    }
} catch (e) {
    console.error("TEST PADDINGU: BŁĄD podczas usuwania paddingu:", e);
}

// Dodaj ten kod na końcu funkcji DOMContentLoaded
console.log("=== TESTY PADDINGU ===");

// Test 1: Pusty tekst (0 bajtów)
testPadding("", "Pusty tekst");

// Test 2: Dokładnie 16 bajtów
testPadding("1234567890123456", "Dokładnie 16 bajtów");

// Test 3: Bardzo krótki tekst
testPadding("a", "Jeden znak");

// Test 4: Tekst z polskimi znakami
testPadding("zażółć gęślą jaźń", "Polskie znaki");

function testPadding(text: string | undefined, testName: string) {
    console.log(`\n--- Test: ${testName} ---`);
    console.log("Tekst testowy:", text);
    
    // Konwersja na bajty
    const encoder = new TextEncoder();
    const testBytes = encoder.encode(text);
    console.log("Bajty:", testBytes);
    console.log("Długość:", testBytes.length);
    
    // Dodanie paddingu
    const paddedBytes = addPKCS7Padding(testBytes);
    console.log("Po paddingu:", paddedBytes);
    console.log("Długość po paddingu:", paddedBytes.length);
    console.log("Ostatni bajt (wartość paddingu):", paddedBytes[paddedBytes.length - 1]);
    
    // Usunięcie paddingu
    try {
        const unpaddedBytes = removePKCS7Padding(paddedBytes);
        console.log("Po usunięciu paddingu:", unpaddedBytes);
        console.log("Długość po usunięciu paddingu:", unpaddedBytes.length);
        
        // Konwersja z powrotem na tekst
        const decoder = new TextDecoder();
        const resultText = decoder.decode(new Uint8Array(unpaddedBytes));
        console.log("Tekst po deszyfracji:", resultText);
        
        if (resultText === text) {
            console.log("✅ TEST SUKCES");
        } else {
            console.log("❌ TEST BŁĄD - tekst nie zgadza się");
        }
    } catch (e) {
        console.error("❌ TEST BŁĄD podczas usuwania paddingu:", e);
    }
}