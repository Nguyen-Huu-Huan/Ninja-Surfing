export class NavigationObserver {
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
