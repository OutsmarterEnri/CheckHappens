import { THEME_KEY, validTheme } from "./ui/themes";
import { readPreference } from "./ui/preferences";
import React from "react";
import { createRoot } from "react-dom/client";
import { LanguageProvider } from "./ui/locale";
import { Shell } from "./ui/Shell";
import "./ui/styles.css";
import "./ui/menus.css";
document.documentElement.dataset.theme = validTheme(
  readPreference(THEME_KEY, "candy"),
);
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
