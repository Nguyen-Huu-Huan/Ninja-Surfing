document.addEventListener("DOMContentLoaded", () => {
  const backgroundColorInput = document.getElementById("backgroundColor");
  const textColorInput = document.getElementById("textColor");
  const fontSizeInput = document.getElementById("fontSize");
  const paddingSelect = document.getElementById("padding");
  const saveAppearanceButton = document.getElementById("saveAppearance");
  const openFullOptionsButton = document.getElementById("openFullOptions");
  const status = document.getElementById("status");
  const preview = document.getElementById("preview");
  const previewText = document.getElementById("previewText");
  const toggleButton = document.getElementById("toggleLinkShortcuts");

  function loadSettings() {
    utils.loadAppearanceSettings((settings) => {
      if (backgroundColorInput) backgroundColorInput.value = settings.backgroundColor;
      if (textColorInput) textColorInput.value = settings.textColor;
      if (fontSizeInput) fontSizeInput.value = settings.fontSize;
      if (paddingSelect) paddingSelect.value = settings.padding;
      updatePreview();
    });
  }

  function updatePreview() {
    utils.updatePreview(
      preview,
      previewText,
      backgroundColorInput ? backgroundColorInput.value : null,
      textColorInput ? textColorInput.value : null,
      fontSizeInput ? fontSizeInput.value : null,
      paddingSelect ? paddingSelect.value : null
    );
  }

  loadSettings();

  [backgroundColorInput, textColorInput, fontSizeInput, paddingSelect].forEach(input => {
    if (input) input.addEventListener("input", updatePreview);
  });

  if (saveAppearanceButton) {
    saveAppearanceButton.addEventListener("click", () => {
      const newSettings = {
        overlayBackgroundColor: backgroundColorInput ? backgroundColorInput.value : null,
        overlayTextColor: textColorInput ? textColorInput.value : null,
        overlayFontSize: fontSizeInput ? fontSizeInput.value : null,
        overlayPadding: paddingSelect ? paddingSelect.value : null
      };

      utils.saveAppearanceSettings(newSettings, (success) => {
        if (status) {
          status.textContent = success ? "Appearance settings saved!" : "Error saving settings";
          status.style.display = "block";
          setTimeout(() => {
            status.style.display = "none";
          }, 3000);
        }
      });
    });
  }

  if (openFullOptionsButton) {
    openFullOptionsButton.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'K') {
      chrome.runtime.sendMessage({ action: "closePopup" });
      window.close();
    }
  });

  toggleButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "toggle_link_shortcuts" }, (response) => {
      if (response.success) {
        console.log("Toggled link shortcuts successfully");
      } else {
        console.error("Failed to toggle link shortcuts");
      }
    });
  });
});
