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
      // First, clean up any existing overlays to ensure a clean state
      this.cleanup();

      // Toggle the state first
      this.overlayVisible = !this.overlayVisible;

      if (this.overlayVisible) {
        this.addOverlays();
        this.keyboardManager.activate();
      } else {
        this.removeOverlays();
        this.keyboardManager.deactivate();
      }
    }

    addOverlays() {
      this.cleanup();
      const elements = this.getClickableElements();
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
        settings.overlayBackgroundColor || this.overlayBackgroundColor;
      this.overlayTextColor =
        settings.overlayTextColor || this.overlayTextColor;
      this.overlayFontSize = settings.overlayFontSize || this.overlayFontSize;
      this.overlayPadding = settings.overlayPadding || this.overlayPadding;
      this.overlayLineHeight = settings.lineHeight || this.overlayLineHeight;
      this.overlayFontWeight = settings.fontWeight || "500";
      this.overlayTextShadow =
        settings.textShadow || "0 1px 1px rgba(0,0,0,0.1)";

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

    async updateVisibleOverlays(elements) {
      const viewportHeight = window.innerHeight;
      const bufferZone = viewportHeight * this.VIEWPORT_BUFFER;
      const topBound = window.scrollY - bufferZone;
      const bottomBound = window.scrollY + viewportHeight + bufferZone;
      let fragment = document.createDocumentFragment();

      // Retrieve the user's preferred option
      const preferredOption = await this.getUserPreferredOption(); // Await the promise

      // Create all overlays first
      elements.forEach((element, index) => {
        const { top, bottom } = element.getBoundingClientRect();
        const elementTop = top + window.scrollY;
        const elementBottom = bottom + window.scrollY;

        if (elementBottom >= topBound && elementTop <= bottomBound) {
          if (!this.elementOverlayMap.has(element)) {
            const charLabel = this.generateCharLabel(index, preferredOption); // Pass the preferred option
            const overlay = this.createOverlay(charLabel, element);
            fragment.appendChild(overlay);
            this.elementOverlayMap.set(element, overlay);
            this.charMap[charLabel] = { element };
          } else {
            this.updateOverlayPosition(element);
          }
        } else {
          this.removeOverlay(element);
        }
      });
      document.body.appendChild(fragment);

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
        z-index: 2147483647;
        pointer-events: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        font-weight: ${this.overlayFontWeight};
        letter-spacing: 0.5px;
        text-align: center;
        min-width: 20px;
        transform: translate(-50%, 0);
        backdrop-filter: blur(2px);
        border: 0.5px solid rgba(255,255,255,0.3);
        text-shadow: ${this.overlayTextShadow};
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

    generateCharLabel(index, preferredOption) {
      const chars = "abcdefghijklmnopqrstuvwxyz";
      const nums = "0123456789";
      const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

      const charsLength = chars.length;
      const numsLength = nums.length;
      const specialCharsLength = specialChars.length;

      switch (preferredOption) {
        case "default":
          // Handle default option (unique labels)
          return this.handleDefaultOption(
            index,
            chars,
            nums,
            specialChars,
            charsLength,
            numsLength,
            specialCharsLength
          );

        case "characters_only":
          // Handle characters only option
          return this.handleCharactersOrNumbersOnlyOption(
            index,
            chars,
            charsLength
          );

        case "numbers_only":
          // Handle numbers only option
          return this.handleCharactersOrNumbersOnlyOption(
            index,
            nums,
            numsLength
          );

        default:
          console.error("Invalid preferred option");
          return ""; // Return empty string or handle error as needed
      }
    }

    handleDefaultOption(
      index,
      chars,
      nums,
      specialChars,
      charsLength,
      numsLength,
      specialCharsLength
    ) {
      // First, handle single-character labels (only from `chars`)
      if (index < charsLength) {
        return chars[index];
      }

      // If index exceeds single characters, handle two-character labels (chars + nums)
      index -= charsLength;
      const twoCharCombinations = charsLength * numsLength;
      if (index < twoCharCombinations) {
        const firstCharIndex = Math.floor(index / numsLength);
        const secondCharIndex = index % numsLength;
        return nums[secondCharIndex] + chars[firstCharIndex];
      }

      // If index exceeds two-character labels, handle three-character labels (chars + nums + specialChars)
      index -= twoCharCombinations;
      const threeCharCombinations =
        charsLength * numsLength * specialCharsLength;
      if (index < threeCharCombinations) {
        const firstCharIndex = Math.floor(
          index / (numsLength * specialCharsLength)
        );
        const secondCharIndex =
          Math.floor(index / specialCharsLength) % numsLength;
        const thirdCharIndex = index % specialCharsLength;
        return (
          specialChars[thirdCharIndex] +
          nums[secondCharIndex] +
          chars[firstCharIndex]
        );
      }

      return ""; // Extend further if necessary
    }

    handleCharactersOrNumbersOnlyOption(index, chars, charsLength) {
      // Generate labels that may start with the same character but are unique
      if (index < charsLength) {
        return chars[index];
      }
      let label = "";

      while (index >= 0) {
        label = chars[index % charsLength] + label;
        index = Math.floor(index / charsLength) - 1;
      }
      return label;
    }

    async handleCharInput(char) {
      this.typedChars += char;
      document.activeElement.blur();
      let matchFound = false;
      for (const [charLabel, { element }] of Object.entries(this.charMap)) {
        if (charLabel.startsWith(this.typedChars)) {
          matchFound = true;
          const overlay = this.elementOverlayMap.get(element);
          if (overlay) {
            this.updateOverlayHighlight(overlay, charLabel);
            const preferredOption = await this.getUserPreferredOption(); // Await the promise
            if (this.typedChars === charLabel) {
              if (preferredOption !== "default") {
                // Require Enter key to activate
                document.addEventListener(
                  "keydown",
                  (event) => {
                    if (event.key === "Enter") {
                      this.removeOverlays();
                      if (
                        element.tagName === "INPUT" ||
                        element.tagName === "TEXTAREA"
                      ) {
                        element.focus();
                      } else {
                        element.click();
                      }
                    }
                  },
                  { once: true }
                );
              } else {
                this.removeOverlays();
                if (
                  element.tagName === "INPUT" ||
                  element.tagName === "TEXTAREA"
                ) {
                  element.focus();
                } else {
                  element.click();
                }
              }
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

    getUserPreferredOption() {
      // Retrieve the preferred option from storage
      return new Promise((resolve) => {
        chrome.storage.sync.get("preferredOption", (data) => {
          resolve(data.preferredOption || "default"); // Default to 'default' if not set
        });
      });
    }

    // Other methods like createOverlay, updateOverlayPosition, etc.
  }

  // KeyboardManager class definition
  class KeyboardManager {
    constructor(overlayManager) {
      this.overlayManager = overlayManager;
      this.handleKeyPress = this.handleKeyPress.bind(this);
      this.handleInput = this.handleInput.bind(this); // Bind handleInput to this
      this.inputElement = null;
    }

    activate() {
      this.inputElement = document.createElement("input"); // Use input instead of textarea
      this.inputElement.tabIndex = -1; // Prevent focus by tabbing
      this.inputElement.style.position = "absolute";
      this.inputElement.style.width = "0px";
      this.inputElement.style.height = "0px";
      this.inputElement.style.zIndex = "-1000";

      document.body.appendChild(this.inputElement);

      // Add event listeners
      this.inputElement.addEventListener("input", this.handleInput);
      document.addEventListener("keydown", this.handleKeyPress);
    }

    deactivate() {
      // Remove event listeners and input element
      if (this.inputElement) {
        this.inputElement.removeEventListener("input", this.handleInput);
        document.body.removeChild(this.inputElement);
        this.inputElement = null;
      }
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

      // Capture the key pressed
      const keyPressed = event.key;

      if (keyPressed === "Escape") {
        this.overlayManager.removeOverlays();
        this.deactivate();
        return;
      }

      // Prevent default scrolling behavior for certain keys
      const scrollKeys = [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
      ];
      if (scrollKeys.includes(keyPressed)) {
        event.preventDefault(); // Prevent scrolling
      }

      // Stop event propagation to prevent scrolling
      event.stopPropagation();

      // Set the value of the input element to capture the key press
      this.inputElement.value = keyPressed; // Capture the key pressed
      this.inputElement.dispatchEvent(new Event("input")); // Trigger input event

      // Check for Ctrl + Enter
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        this.handleCtrlEnter();
        return;
      }
    }

    handleInput(event) {
      const inputValue = event.target.value; // Get the raw input value

      // Regex pattern for validation (allowing numbers and special characters)
      const pattern = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;:,.<>?]*$/;

      // Validate the input value against the pattern
      if (pattern.test(inputValue)) {
        event.preventDefault();
        this.overlayManager.handleCharInput(inputValue); // Pass the input value to the overlay manager
      }
    }

    handleCtrlEnter() {
      const activeElement = document.activeElement;
      if (activeElement) {
        // Check if the active element is a button or input
        if (
          activeElement.tagName === "BUTTON" ||
          activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA"
        ) {
          activeElement.click(); // Click the button or input
        } else {
          activeElement.focus(); // Focus on the element
        }
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
    overlayManager = new OverlayManager();
    keyboardManager = new KeyboardManager(overlayManager);
    navigationObserver = new NavigationObserver(overlayManager);

    // Load current appearance settings when initializing
    loadAppearanceSettings();

    chrome.runtime.onMessage.addListener(handleMessages);
  }

  function handleMessages(request, sender, sendResponse) {
    // Unfocus any focused elements
    document.activeElement.blur();
    if (request && request.action === "toggleLinkShortcuts") {
      overlayManager.toggleOverlays();
      sendResponse({ success: true });
    } else if (request && request.action === "updateOverlayAppearance") {
      overlayManager.updateAppearance(request);
      sendResponse({ success: true });
    } else if (request && request.action === "getCurrentSettings") {
      sendResponse({
        backgroundColor: overlayManager.overlayBackgroundColor,
        textColor: overlayManager.overlayTextColor,
        fontSize: overlayManager.overlayFontSize,
        padding: overlayManager.overlayPadding,
        lineHeight: overlayManager.overlayLineHeight,
        fontWeight: overlayManager.overlayFontWeight,
        textShadow: overlayManager.overlayTextShadow,
      });
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

  // Ensure that the options page can also call this function
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getCurrentSettings") {
      sendResponse({
        backgroundColor: overlayManager.overlayBackgroundColor,
        textColor: overlayManager.overlayTextColor,
        fontSize: overlayManager.overlayFontSize,
        padding: overlayManager.overlayPadding,
        lineHeight: overlayManager.overlayLineHeight,
        fontWeight: overlayManager.overlayFontWeight,
        textShadow: overlayManager.overlayTextShadow,
      });
    } else if (request.action === "updateOverlayAppearance") {
      overlayManager.updateAppearance(request);
      sendResponse({ success: true });
    }
  });

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
})();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateOverlayAppearance") {
    // Handle the message and update the overlay appearance
    // Perform the necessary updates here
    sendResponse({ success: true });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateSpanStyle") {
    const spans = document.querySelectorAll("span"); // Adjust selector as needed
    spans.forEach((span) => {
      span.style.color = request.color; // Example style update
      // Add more style updates as needed
    });
    sendResponse({ status: "success" });
  }
});
