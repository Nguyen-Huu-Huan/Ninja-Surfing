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
    chrome.storage.sync.set(settings, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving settings:", chrome.runtime.lastError);
        callback(false);
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
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

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function preventTyping(event) {
  if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
    event.preventDefault();
  }
}

export function filterSimilarElements(elements) {
  const uniqueElements = [];
  const seenTargets = new Set();

  elements.forEach(element => {
    const target = element.getAttribute('href') || element.getAttribute('onclick') || element.textContent.trim();
    if (!seenTargets.has(target)) {
      seenTargets.add(target);
      uniqueElements.push(element);
    }
  });

  return uniqueElements;
}

export function loadAppearanceSettings(callback) {
  // Load settings from storage and execute the callback
  chrome.storage.sync.get(['backgroundColor', 'textColor', 'fontSize', 'padding'], (settings) => {
    callback(settings);
  });
}

export function saveAppearanceSettings(settings, callback) {
  // Save settings to storage
  chrome.storage.sync.set(settings, () => {
    callback(true);
  });
}
