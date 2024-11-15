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
  const labelOptionSelect = document.getElementById("labelOption");

  // Check if elements are found
  if (
    !backgroundColorInput ||
    !textColorInput ||
    !fontSizeInput ||
    !paddingSelect ||
    !saveAppearanceButton ||
    !openFullOptionsButton ||
    !status ||
    !preview ||
    !previewText ||
    !labelOptionSelect
  ) {
    console.error("One or more elements are missing in the popup HTML.");
    return; // Exit if elements are not found
  }

  function loadSettings() {
    utils.loadAppearanceSettings((settings) => {
      backgroundColorInput.value = settings.backgroundColor;
      textColorInput.value = settings.textColor;
      fontSizeInput.value = settings.fontSize;
      paddingSelect.value = settings.padding;
      updatePreview();
    });
  }

  function updatePreview() {
    utils.updatePreview(
      preview,
      previewText,
      backgroundColorInput.value,
      textColorInput.value,
      fontSizeInput.value,
      paddingSelect.value
    );
  }

  loadSettings();

  [backgroundColorInput, textColorInput, fontSizeInput, paddingSelect].forEach(
    (input) => {
      input.addEventListener("input", updatePreview);
    }
  );

  saveAppearanceButton.addEventListener("click", () => {
    const newSettings = {
      overlayBackgroundColor: backgroundColorInput.value,
      overlayTextColor: textColorInput.value,
      overlayFontSize: fontSizeInput.value,
      overlayPadding: paddingSelect.value,
    };

    utils.saveAppearanceSettings(newSettings, (success) => {
      status.textContent = success
        ? "Appearance settings saved!"
        : "Error saving settings";
      status.style.display = "block";
      setTimeout(() => {
        status.style.display = "none";
      }, 3000);
    });
  });

  openFullOptionsButton.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === "K") {
      chrome.runtime.sendMessage({ action: "closePopup" });
      window.close();
    }
  });

  function sendMessageToContent(color) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "updateSpanStyle", color: color },
        (response) => {
          if (!response || !response.status === "success")
            console.error("Failed to update span styles:", response); // Debug log
        }
      );
    });
  }

  // Load the saved preferred option
  loadPreferredOption();

  labelOptionSelect.addEventListener("change", (event) => {
    const selectedOption = event.target.value;
    savePreferredOption(selectedOption); // Implement this function to save the option
  });

  function loadPreferredOption() {
    // Retrieve the preferred option from storage
    chrome.storage.sync.get("preferredOption", (data) => {
      if (data.preferredOption) {
        labelOptionSelect.value = data.preferredOption;
      }
    });
  }

  function savePreferredOption(option) {
    // Save the preferred option to storage
    chrome.storage.sync.set({ preferredOption: option }, () => {});
  }
});
