document.addEventListener("DOMContentLoaded", () => {
  const shortcutDisplay = document.getElementById("shortcutDisplay");
  const updateInstructionsElem = document.getElementById("updateInstructions");
  const backgroundColorInput = document.getElementById("backgroundColor");
  const textColorInput = document.getElementById("textColor");
  const fontSizeInput = document.getElementById("fontSize");
  const paddingSelect = document.getElementById("padding");
  const saveAppearanceButton = document.getElementById("saveAppearance");
  const status = document.getElementById("status");
  const preview = document.getElementById("preview");
  const previewText = document.getElementById("previewText");

  function loadCurrentShortcut() {
    chrome.runtime.sendMessage({ action: "getShortcut" }, (response) => {
      if (response && response.shortcut && shortcutDisplay) {
        shortcutDisplay.textContent = response.shortcut;
      } else if (shortcutDisplay) {
        shortcutDisplay.textContent = "Not set";
      }
    });
  }

  loadCurrentShortcut();

  if (updateInstructionsElem) {
    updateInstructionsElem.innerHTML = `
      To update the shortcut:
      <ol>
        <li>Go to <a href="chrome://extensions/shortcuts" target="_blank">chrome://extensions/shortcuts</a></li>
        <li>Find "Ninja Surfing" in the list</li>
        <li>Click on the input field next to "Toggle link shortcuts"</li>
        <li>Press your desired key combination</li>
        <li>Close and reopen this options page to see the updated shortcut</li>
      </ol>
    `;
  }

  function loadSettings() {
    chrome.storage.sync.get(
      ["backgroundColor", "textColor", "fontSize", "padding"],
      (settings) => {
        backgroundColorInput.value = settings.backgroundColor || "#ffffff";
        textColorInput.value = settings.textColor || "#000000";
        fontSizeInput.value = settings.fontSize || "1rem";
        paddingSelect.value = settings.padding || "2px";
        updatePreview(); // Update preview after loading settings
      }
    );
  }

  function updatePreview() {
    // Update the preview element based on current input values
    preview.style.backgroundColor = backgroundColorInput.value;
    previewText.style.color = textColorInput.value;
    previewText.style.fontSize = fontSizeInput.value + "rem"; // Assuming fontSize is in rem
    preview.style.padding = utils.getPaddingValue(paddingSelect.value); // Use the utils function to get padding
  }

  loadSettings();

  [backgroundColorInput, textColorInput, fontSizeInput, paddingSelect].forEach(
    (input) => {
      if (input) input.addEventListener("input", updatePreview);
    }
  );

  if (saveAppearanceButton) {
    saveAppearanceButton.addEventListener("click", () => {
      const newSettings = {
        action: "updateOverlayAppearance",
        backgroundColor: backgroundColorInput.value,
        textColor: textColorInput.value,
        fontSize: fontSizeInput.value,
        padding: paddingSelect.value,
      };

      // Send message to content script
      chrome.runtime.sendMessage(newSettings, (response) => {
        if (response && response.success) {
          status.textContent = "Appearance settings saved!";
        } else {
          status.textContent = "Error saving settings";
        }
        status.style.display = "block";
        setTimeout(() => {
          status.style.display = "none";
        }, 3000);
      });
    });
  }

  // Define the applyCurrentStyles function
  function applyCurrentStyles() {
    // Logic to apply current styles based on saved settings
    loadSettings(); // Call loadSettings to ensure the latest settings are applied
  }

  // Call the function to apply styles on page load
  document.addEventListener("DOMContentLoaded", applyCurrentStyles);
});
