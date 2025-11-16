import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to dist/index.html
const indexPath: string = path.join(__dirname, "..", "dist", "index.html");
let html: string = fs.readFileSync(indexPath, "utf8");

// Find the script tag
const scriptRegex: RegExp =
  /<script\s+type="module"\s+crossorigin\s+src="([^"]+)"\s*><\/script>/;
const match: RegExpMatchArray | null = html.match(scriptRegex);
if (!match) throw new Error("Script tag not found");

const jsSrc: string = match[1]; // e.g., /assets/index-BJvvF0mC.js
const jsPath: string = path.join(__dirname, "..", "dist", jsSrc);
const jsContent: string = fs.readFileSync(jsPath, "utf8");
const base64: string = Buffer.from(jsContent, "utf8").toString("base64");
const base64Path: string = path.join(
  __dirname,
  "..",
  "dist",
  "assets",
  "fallback.js.base64"
);
fs.writeFileSync(base64Path, base64);

// Inline script to add
const inlineScript: string = `
    <!-- Inline script for fallback logic (runs before DOM loads) -->
    <script>
      function loadFallback() {
        console.log("SCRIPT LOADING FAILED, FALLING BACK TO BASE64 SCRIPT");

        // Function to decode Base64 to UTF-8 string
        function base64ToUTF8(base64) {
          // Decode Base64 to binary string
          const binaryString = atob(base64.trim());
          // Convert binary string to UTF-8
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return new TextDecoder("utf-8").decode(bytes);
        }

        // Avoid duplicate loads if already loading fallback
        if (window.loadingFallback) return;
        window.loadingFallback = true;

        // Fetch the base64-encoded script file
        fetch("/assets/fallback.js.base64")
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to load base64 fallback");
            }
            return response.text();
          })
          .then((base64) => {
            const decodedScript = base64ToUTF8(base64);

            // Create a new script element with the decoded content
            const fallbackScript = document.createElement("script");
            fallbackScript.type = "module";
            fallbackScript.crossOrigin = "anonymous";
            fallbackScript.textContent = decodedScript;

            // Append to head
            document.head.appendChild(fallbackScript);

            // Optional: Clean up the flag after successful load
            fallbackScript.addEventListener("load", () => {
              window.loadingFallback = false;
            });
          });
      }
    </script>`;

// Replace the script tag with inline + modified script
html = html.replace(
  scriptRegex,
  inlineScript +
    '<script type="module" crossorigin src="' +
    jsSrc +
    '" onerror="loadFallback()"></script>'
);

// Write back
fs.writeFileSync(indexPath, html);
