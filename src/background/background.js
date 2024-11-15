let popupOpen = false;

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs
    .create({ url: "src/options/options.html" })
    .catch((error) => console.error("Error creating options tab:", error));
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle_link_shortcuts") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "toggleLinkShortcuts" },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError);
            }
          }
        );
      } else {
        console.error("No active tab found");
      }
    });
  } else if (command === "toggle_popup") {
    togglePopup();
  }
});

function togglePopup() {
  if (popupOpen) {
    chrome.action
      .setPopup({ popup: "" })
      .then(() => {
        popupOpen = false;
      })
      .catch((error) => console.error("Error closing popup:", error));
  } else {
    chrome.action
      .setPopup({ popup: "src/popup/popup.html" })
      .then(() => {
        popupOpen = true;
        return chrome.action.openPopup();
      })
      .catch((error) => console.error("Error opening popup:", error));
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getShortcut") {
    chrome.commands
      .getAll()
      .then((commands) => {
        const toggleCommand = commands.find(
          (cmd) => cmd.name === "toggle_link_shortcuts"
        );
        sendResponse({
          shortcut: toggleCommand ? toggleCommand.shortcut : null,
        });
      })
      .catch((error) => {
        console.error("Error getting shortcuts:", error);
        sendResponse({ error: "Failed to get shortcuts" });
      });
    return true;
  } else if (request.action === "closePopup") {
    if (popupOpen) {
      togglePopup();
    }
    sendResponse({ success: true });
  } else if (request.action === "updateOverlayAppearance") {
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        if (tabs && tabs.length > 0) {
          return chrome.tabs.sendMessage(tabs[0].id, request);
        } else {
          throw new Error("No active tab found");
        }
      })
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error("Error updating overlay appearance:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else {
    console.warn("Unknown action received:", request.action);
    sendResponse({ error: "Unknown action" });
  }
  return true;
});
