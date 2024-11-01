const utils = {
  getPaddingValue(paddingOption) {
    switch (paddingOption) {
      case "none": return "0px";
      case "small": return "2px";
      case "medium": return "4px";
      case "large": return "6px";
      default: return "2px";
    }
  },

  updatePreview(preview, previewText, backgroundColor, textColor, fontSize, padding) {
    if (preview && previewText) {
      preview.style.backgroundColor = backgroundColor || '';
      previewText.style.color = textColor || '';
      previewText.style.fontSize = fontSize || '';
      preview.style.padding = this.getPaddingValue(padding);
    }
  },

  loadAppearanceSettings(callback) {
    chrome.storage.sync.get(["overlayBackgroundColor", "overlayTextColor", "overlayFontSize", "overlayPadding"], (result) => {
      const settings = {
        backgroundColor: result.overlayBackgroundColor || "#FFFF00",
        textColor: result.overlayTextColor || "#000000",
        fontSize: result.overlayFontSize || "1rem",
        padding: result.overlayPadding || "small"
      };
      callback(settings);
    });
  },

  saveAppearanceSettings(settings, callback) {
    console.log("Saving appearance settings:", settings);
    chrome.storage.sync.set(settings, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving settings:", chrome.runtime.lastError);
        callback(false);
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            console.log("Sending message to update overlay appearance");
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "updateOverlayAppearance",
              ...settings
            });
          }
        });
        callback(true);
      }
    });
  }
};
