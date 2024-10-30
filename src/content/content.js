(function () {
  // OverlayManager class definition
  class OverlayManager {
    constructor() {
      this.overlayVisible = false;
      this.charMap = {};
      this.elementOverlayMap = new WeakMap();
      this.typedChars = "";
      this.overlayBackgroundColor = "yellow";
      this.overlayTextColor = "black";
      this.overlayFontSize = "1rem";
      this.overlayPadding = "2px";
      this.overlayLineHeight = "1.3rem";
      this.SCROLL_DEBOUNCE_TIME = 150;
      this.VIEWPORT_BUFFER = 0.5;

      this.debouncedHandleScroll = this.debounce(
        this.handleScroll.bind(this),
        150
      );
      this.keyboardManager = new KeyboardManager(this);
    }

    toggleOverlays() {
      console.log("toggleOverlays called, current state:", this.overlayVisible);

      // First, clean up any existing overlays to ensure a clean state
      this.cleanup();

      // Toggle the state first
      this.overlayVisible = !this.overlayVisible;

      if (this.overlayVisible) {
        console.log("Adding overlays");
        this.addOverlays();
        this.keyboardManager.activate();
      } else {
        console.log("Removing overlays");
        this.removeOverlays();
        this.keyboardManager.deactivate();
      }

      console.log("Overlays toggled, new state:", this.overlayVisible);
    }

    addOverlays() {
      console.log("addOverlays called");
      this.cleanup();
      const elements = this.getClickableElements();
      console.log("Clickable elements found:", elements.length);
      if (!elements.length) return;

      this.updateVisibleOverlays(elements);
      window.addEventListener("scroll", this.debouncedHandleScroll);
    }

    removeOverlays() {
      this.cleanup();
      window.removeEventListener("scroll", this.debouncedHandleScroll);
      this.keyboardManager.deactivate();
      this.overlayVisible = false; // Ensure state is consistent
    }

    cleanup() {
      document
        .querySelectorAll("[data-link-overlay]")
        .forEach((overlay) => overlay.remove());
      this.elementOverlayMap = new WeakMap();
      this.charMap = {};
      this.typedChars = "";
    }

    updateAppearance(settings) {
      this.overlayBackgroundColor =
        settings.backgroundColor || this.overlayBackgroundColor;
      this.overlayTextColor = settings.textColor || this.overlayTextColor;
      this.overlayFontSize = settings.fontSize || this.overlayFontSize;
      this.overlayPadding = settings.padding || this.overlayPadding;
      if (this.overlayVisible) {
        this.removeOverlays();
        this.addOverlays();
      }
    }

    getClickableElements() {
      const elements = Array.from(
        document.querySelectorAll(
          "a, input, select, option, button, [style*='cursor: pointer']"
        )
      );
      const hoverableElements = Array.from(
        document.querySelectorAll("*")
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        return style.cursor === "pointer" || style.getPropertyValue(":hover");
      });
      return [...new Set([...elements, ...hoverableElements])];
    }

    updateVisibleOverlays(elements) {
      console.log(
        "updateVisibleOverlays called with",
        elements.length,
        "elements"
      );
      const viewportHeight = window.innerHeight;
      const bufferZone = viewportHeight * this.VIEWPORT_BUFFER;
      const topBound = window.scrollY - bufferZone;
      const bottomBound = window.scrollY + viewportHeight + bufferZone;

      // Create all overlays first
      elements.forEach((element, index) => {
        const { top, bottom } = element.getBoundingClientRect();
        const elementTop = top + window.scrollY;
        const elementBottom = bottom + window.scrollY;

        if (elementBottom >= topBound && elementTop <= bottomBound) {
          if (!this.elementOverlayMap.has(element)) {
            const charLabel = this.generateCharLabel(index);
            const overlay = this.createOverlay(charLabel, element);
            document.body.appendChild(overlay);
            this.elementOverlayMap.set(element, overlay);
            this.charMap[charLabel] = { element };
          } else {
            this.updateOverlayPosition(element);
          }
        } else {
          this.removeOverlay(element);
        }
      });

      // Now check for overlaps and remove overlapping spans
      this.removeOverlappingOverlays();
    }

    removeOverlappingOverlays() {
      const overlays = Array.from(
        document.querySelectorAll("[data-link-overlay]")
      );
      const overlaysToRemove = new Set();

      for (let i = 0; i < overlays.length; i++) {
        if (overlaysToRemove.has(overlays[i])) continue;

        const rect1 = overlays[i].getBoundingClientRect();

        for (let j = i + 1; j < overlays.length; j++) {
          if (overlaysToRemove.has(overlays[j])) continue;

          const rect2 = overlays[j].getBoundingClientRect();

          if (this.isOverlapping(rect1, rect2)) {
            // Remove the overlay that's lower on the page
            const overlayToRemove =
              rect1.top > rect2.top ? overlays[i] : overlays[j];
            overlaysToRemove.add(overlayToRemove);
          }
        }
      }

      // Remove the overlapping overlays
      overlaysToRemove.forEach((overlay) => {
        const charLabel = overlay.textContent;
        const element = this.charMap[charLabel]?.element;
        if (element) {
          this.removeOverlay(element);
        }
      });
    }

    isOverlapping(rect1, rect2) {
      const buffer = 5; // 5px buffer to account for very close overlays
      return !(
        rect1.right + buffer < rect2.left ||
        rect1.left > rect2.right + buffer ||
        rect1.bottom + buffer < rect2.top ||
        rect1.top > rect2.bottom + buffer
      );
    }

    handleScroll() {
      console.log("handleScroll called");
      const elements = this.getClickableElements();
      this.updateVisibleOverlays(elements);
    }

    createOverlay(charLabel, element) {
      const overlay = document.createElement("span");
      overlay.setAttribute("data-link-overlay", "true");
      overlay.textContent = charLabel;
      overlay.style.cssText = `
        position: absolute;
        background: linear-gradient(135deg, ${this.overlayBackgroundColor} 0%, rgba(255,255,255,0.9) 100%);
        color: ${this.overlayTextColor};
        font-size: ${this.overlayFontSize};
        padding-left: ${this.overlayPadding};
        padding-right: ${this.overlayPadding};
        line-height: ${this.overlayLineHeight};
        border-radius: 4px;
        z-index: 1000;
        pointer-events: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        font-weight: 500;
        letter-spacing: 0.5px;
        text-align: center;
        min-width: 20px;
        transform: translate(-50%, 0);
        backdrop-filter: blur(2px);
        border: 0.5px solid rgba(255,255,255,0.3);
        text-shadow: 0 1px 1px rgba(0,0,0,0.1);
        transition: all 0.2s ease;
      `;

      const { top, left, width } = element.getBoundingClientRect();
      overlay.style.top = `${top + window.scrollY}px`;
      overlay.style.left = `${left + window.scrollX + width / 2}px`;

      // Add hover effect
      overlay.addEventListener("mouseenter", () => {
        overlay.style.transform = "translate(-50%, 0) scale(1.1)";
        overlay.style.boxShadow =
          "0 4px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.15)";
      });

      overlay.addEventListener("mouseleave", () => {
        overlay.style.transform = "translate(-50%, 0) scale(1)";
        overlay.style.boxShadow =
          "0 2px 4px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1)";
      });

      return overlay;
    }

    generateCharLabel(index) {
      const chars = "abcdefghijklmnopqrstuvwxyz";
      const first = chars[Math.floor(index / chars.length) % chars.length];
      const second = chars[index % chars.length];
      return `${first}${second}`;
    }

    handleCharInput(char) {
      this.typedChars += char;
      console.log("Typed chars:", this.typedChars);

      let matchFound = false;
      for (const [charLabel, { element }] of Object.entries(this.charMap)) {
        if (charLabel.startsWith(this.typedChars)) {
          matchFound = true;
          const overlay = this.elementOverlayMap.get(element);
          if (overlay) {
            this.updateOverlayHighlight(overlay, charLabel);
            if (this.typedChars === charLabel) {
              this.removeOverlays();
              element.click();
              break;
            }
          }
        }
      }

      if (!matchFound) {
        this.typedChars = "";
      }
    }

    updateOverlayHighlight(overlay, charLabel) {
      overlay.innerHTML = charLabel
        .split("")
        .map(
          (char, index) =>
            `<span style="
          color: ${
            index < this.typedChars.length ? "#ff3366" : this.overlayTextColor
          };
          transition: color 0.2s ease;
          display: inline-block;
          ${index < this.typedChars.length ? "transform: scale(1.1);" : ""}
        ">${char}</span>`
        )
        .join("");
    }

    updateOverlayPosition(element) {
      const overlay = this.elementOverlayMap.get(element);
      if (overlay) {
        const { top, left, width } = element.getBoundingClientRect();
        overlay.style.top = `${top + window.scrollY}px`;
        overlay.style.left = `${left + window.scrollX + width / 2}px`;
      }
    }

    removeOverlay(element) {
      const overlay = this.elementOverlayMap.get(element);
      if (overlay) {
        overlay.remove();
        this.elementOverlayMap.delete(element);
        const charLabel = overlay.textContent;
        delete this.charMap[charLabel];
      }
    }

    debounce(func, wait) {
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

    filterSimilarElements(elements) {
      const uniqueElements = [];
      const seenTargets = new Set();

      elements.forEach((element) => {
        const target =
          element.getAttribute("href") ||
          element.getAttribute("onclick") ||
          element.textContent.trim();
        if (!seenTargets.has(target)) {
          seenTargets.add(target);
          uniqueElements.push(element);
        }
      });

      return uniqueElements;
    }

    // Other methods like createOverlay, updateOverlayPosition, etc.
  }

  // KeyboardManager class definition
  class KeyboardManager {
    constructor(overlayManager) {
      this.overlayManager = overlayManager;
      this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    activate() {
      document.addEventListener("keydown", this.handleKeyPress);
    }

    deactivate() {
      document.removeEventListener("keydown", this.handleKeyPress);
    }

    handleKeyPress(event) {
      // Allow typing in input fields and textareas
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      const keyPressed = event.key.toLowerCase();

      if (keyPressed === "escape") {
        this.overlayManager.removeOverlays();
        return;
      }

      // Only prevent default for alphabetic keys
      if (/^[a-z]$/.test(keyPressed)) {
        event.preventDefault();
        this.overlayManager.handleCharInput(keyPressed);
      }
    }
  }

  // NavigationObserver class definition
  class NavigationObserver {
    constructor(overlayManager) {
      this.overlayManager = overlayManager;
      this.lastPathname = window.location.pathname;
      this.observerInstance = null;
      this.setupObserver();
    }

    setupObserver() {
      if (this.observerInstance) {
        this.observerInstance.disconnect();
      }

      this.observerInstance = new MutationObserver((mutations) => {
        const currentPathname = window.location.pathname;
        if (currentPathname !== this.lastPathname) {
          this.lastPathname = currentPathname;
          this.overlayManager.cleanup();
        }
      });

      this.observerInstance.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    disconnect() {
      if (this.observerInstance) {
        this.observerInstance.disconnect();
      }
    }
  }

  // Utility functions
  function debounce(func, wait) {
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

  function preventTyping(event) {
    if (
      event.target.tagName !== "INPUT" &&
      event.target.tagName !== "TEXTAREA"
    ) {
      event.preventDefault();
    }
  }

  function filterSimilarElements(elements) {
    const uniqueElements = [];
    const seenTargets = new Set();

    elements.forEach((element) => {
      const target =
        element.getAttribute("href") ||
        element.getAttribute("onclick") ||
        element.textContent.trim();
      if (!seenTargets.has(target)) {
        seenTargets.add(target);
        uniqueElements.push(element);
      }
    });

    return uniqueElements;
  }

  // Main logic
  let overlayManager;
  let keyboardManager;
  let navigationObserver;

  function initialize() {
    console.log("Initializing content script");
    overlayManager = new OverlayManager();
    keyboardManager = new KeyboardManager(overlayManager);
    navigationObserver = new NavigationObserver(overlayManager);

    chrome.runtime.onMessage.addListener(handleMessages);
    loadAppearanceSettings();
    console.log("Content script initialized");
  }

  function handleMessages(request, sender, sendResponse) {
    console.log("Message received in content script:", request);
    if (request && request.action === "toggleLinkShortcuts") {
      console.log("Toggling link shortcuts");
      overlayManager.toggleOverlays();
      sendResponse({ success: true });
    } else if (request && request.action === "updateOverlayAppearance") {
      console.log("Updating overlay appearance");
      overlayManager.updateAppearance(request);
      sendResponse({ success: true });
    }
  }

  function loadAppearanceSettings() {
    chrome.runtime.sendMessage(
      { action: "getAppearanceSettings" },
      (response) => {
        if (response) {
          overlayManager.updateAppearance(response);
        }
      }
    );
  }

  window.addEventListener("load", initialize);
  window.addEventListener("beforeunload", () => {
    navigationObserver.disconnect();
    overlayManager.cleanup();
  });

  // Override history methods
  const originalPushState = history.pushState;
  history.pushState = function () {
    originalPushState.apply(this, arguments);
    overlayManager.cleanup();
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    overlayManager.cleanup();
  };

  console.log("Content script loaded");
})();
