(() => {
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  let preference;
  try {
    preference = localStorage.getItem("reading-theme");
  } catch {
    // Reading remains available when browser storage is blocked.
  }
  if (preference === "light" || preference === "dark") root.dataset.theme = preference;
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("theme-toggle");
    const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : system.matches;
    const update = () => button.setAttribute("aria-pressed", String(isDark()));
    update();
    button.hidden = false;
    button.addEventListener("click", () => {
      root.dataset.theme = isDark() ? "light" : "dark";
      update();
      try {
        localStorage.setItem("reading-theme", root.dataset.theme);
      } catch {
        // The selected theme still applies to this page without storage.
      }
    });
    system.addEventListener("change", update);
  });
})();
