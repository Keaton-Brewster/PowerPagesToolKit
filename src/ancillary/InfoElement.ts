/**
 *
 * @param {string} titleString The text to display in the tooltip flyout content
 * @param iconStyle Optional CSS styles to apply to the info icon
 * @returns
 */
/********/ /********/ export default class InfoElement extends HTMLElement {
  private flyoutContent: HTMLDivElement;
  private icon: HTMLElement;
  private observers: MutationObserver[] = [];

  /********/ constructor(
    titleString: string,
    iconStyle?: Partial<CSSStyleDeclaration>
  ) {
    super();
    // Input validation remains the same
    if (typeof titleString !== "string") {
      throw new Error(
        `argument "titleString" must be of type "string". Received: "${typeof titleString}"`
      );
    }
    if (iconStyle && typeof iconStyle !== "object") {
      throw new Error(
        `argument "iconStyle" must be of type "object". Received: "${typeof iconStyle}"`
      );
    }

    this.classList.add("info-icon");

    this.icon = document.createElement("i");
    this.icon.classList.add("fa", "fa-solid", "fa-info-circle");
    this.icon.setAttribute("aria-label", "Info");
    this.icon.style.cursor = "pointer";

    this.flyoutContent = document.createElement("div");
    this.flyoutContent.innerHTML = titleString;
    this.flyoutContent.classList.add("flyout-content");

    this.appendChild(this.icon);
    this.appendChild(this.flyoutContent);

    if (iconStyle) {
      Object.assign(this.icon.style, iconStyle);
    }

    this.handleClick = this.handleClick.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleScroll = this.handleScroll.bind(this);

    this.flyoutContent.style.minWidth = this.getDesiredWidth();

    this.flyoutContent.style.display = "none";

    this.attachEventListeners();
    this.setupObservers();
  }

  /********/ private attachEventListeners(): void {
    document.body.addEventListener("click", this.handleClick);
    self.addEventListener("resize", this.handleResize);
    this.icon.addEventListener("touchstart", this.handleTouchStart);
    this.addEventListener("mouseenter", this.handleMouseEnter);
    this.addEventListener("mouseleave", this.handleMouseLeave);
    self.addEventListener("scroll", this.handleScroll);
  }

  /********/ private setupObservers(): void {
    // observe if element is removed, so that we can perform cleanup
    const _destroy_observer = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        for (const node of Array.from(mut.removedNodes)) {
          if (node === this) {
            this.destroy();
            return;
          }
        }
      }
    });
    _destroy_observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    // observe for changes in the DOM, and trigger position
    const _position_observer = new MutationObserver(
      () => this.updateFlyoutWidth
    );
    _position_observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    // track observers for cleanup
    this.observers.push(_destroy_observer, _position_observer);
  }

  /********/ private getDesiredWidth(): string {
    // Get a reasonable width that works for center positioning
    const viewportWidth = self.innerWidth;
    const maxWidth = Math.min(viewportWidth - 40, 600); // Max 600px wide with 20px padding on each side
    return `${maxWidth}px`;
  }

  /********/ private positionFlyout(): void {
    // Always position the flyout in the center of the screen
    this.flyoutContent.style.display = "block";
    // Get the icon's position relative to the viewport
    const iconRect = this.icon.getBoundingClientRect();
    const flyoutRect = this.flyoutContent.getBoundingClientRect();
    const viewportHeight = self.innerHeight;
    const margin = 5; // Space between icon and flyout
    let topPosition = iconRect.bottom - margin; // Default below the icon
    // If the flyout would go beyond the viewport, position it above
    if (topPosition + flyoutRect.height > viewportHeight) {
      topPosition = iconRect.top - flyoutRect.height; // Move above the icon
    }
    // Apply positions
    this.flyoutContent.style.top = `${topPosition}px`;
  }

  /********/ private updateFlyoutWidth(): void {
    this.flyoutContent.style.minWidth = this.getDesiredWidth();
  }

  /********/ private handleClick(e: Event): void {
    if (!this.contains(e.target as Node)) {
      this.flyoutContent.style.display = "none";
    }
  }

  /********/ private handleResize(_e: Event): void {
    this.flyoutContent.style.minWidth = this.getDesiredWidth();
  }

  /********/ private handleTouchStart(): void {
    this.flyoutContent.style.display =
      this.flyoutContent.style.display === "block" ? "none" : "block";
    if (this.flyoutContent.style.display === "block") {
      this.positionFlyout();
    }
  }

  /********/ private handleMouseEnter(_e: MouseEvent): void {
    this.positionFlyout();
  }

  /********/ private handleMouseLeave(event: MouseEvent): void {
    // Check if we're not moving to a child element
    const relatedTarget = event.relatedTarget as Node;
    if (!this.contains(relatedTarget)) {
      this.flyoutContent.style.display = "none";
    }
  }

  /********/ private handleScroll(): void {
    const previousFlyoutDisplay = this.flyoutContent.style.display;
    if (previousFlyoutDisplay === "none") return;

    this.positionFlyout();

    this.flyoutContent.style.display = previousFlyoutDisplay;
  }

  /********/ private destroy(): void {
    document.body.removeEventListener("click", this.handleClick);
    self.removeEventListener("resize", this.handleResize);
    this.icon.removeEventListener("touchstart", this.handleTouchStart);
    this.removeEventListener("mouseenter", this.handleMouseEnter);
    this.removeEventListener("mouseleave", this.handleMouseLeave);
    self.removeEventListener("scroll", this.handleScroll);

    this.observers.forEach((obv) => obv.disconnect());
  }
}

customElements.define("info-element", InfoElement);
