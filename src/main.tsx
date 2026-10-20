import React from "react";
import { createRoot } from "react-dom/client";
import { LanguageProvider } from "./ui/locale";
import { Shell } from "./ui/Shell";
import "./ui/styles.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LanguageProvider>
      <Shell />
    </LanguageProvider>
  </React.StrictMode>,
);

if (
  import.meta.env.PROD &&
  "serviceWorker" in navigator &&
  window.isSecureContext
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(new URL("sw.js", document.baseURI))
      .catch(() => {
        // Offline caching is optional; the game remains usable online.
      });
  });
}
