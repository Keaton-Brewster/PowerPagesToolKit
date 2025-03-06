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

  /********/ private getFartherSideOfScreen(): number {
    const { left, right } = this.getDistanceToWindowEdges();
    let minNum = 200;
    if (right > left) {
      minNum = right;
    } else if (left > right) {
      minNum = left;
    }
    return minNum;
  }

  /********/ private getDesiredWidth(): string {
    const smaller = this.getFartherSideOfScreen();
    return `${smaller}px`;
  }

  /********/ private positionFlyout(): void {
    this.flyoutContent.style.display = "block";

    const flyoutRect = this.flyoutContent.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    if (flyoutRect.right > viewportWidth) {
      const overflowAmount = flyoutRect.right - viewportWidth;
      this.flyoutContent.style.left = `calc(50% - ${overflowAmount}px)`;
    }

    if (flyoutRect.left < 0) {
      const overflowAmount = Math.abs(flyoutRect.left);
      this.flyoutContent.style.left = `calc(50% + ${overflowAmount}px)`;
    }
  }

  /********/ private updateFlyoutWidth(): void {
    this.flyoutContent.style.minWidth = this.getDesiredWidth();
  }

  /********/ private getDistanceToWindowEdges() {
    // Get the element's position relative to the viewport
    const rect = this.getBoundingClientRect();

    // Calculate distances to each edge
    const distanceToTop = rect.top;
    const distanceToRight = window.innerWidth - rect.right;
    const distanceToBottom = window.innerHeight - rect.bottom;
    const distanceToLeft = rect.left;

    return {
      top: distanceToTop,
      right: distanceToRight,
      bottom: distanceToBottom,
      left: distanceToLeft,
    };
  }

  /********/ private handleClick(e: Event): void {
    if (!this.contains(e.target as Node)) {
      this.flyoutContent.style.display = "none";
    }
  }

  /********/ private handleResize(_e: Event): void {
    this.flyoutContent.style.minWidth = this.getDesiredWidth();
  }

  /********/ private handleTouchStart(event: Event): void {
    event.preventDefault();
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

  /********/ private destroy(): void {
    document.body.removeEventListener("click", this.handleClick);
    window.removeEventListener("resize", this.handleResize);
    this.icon.removeEventListener("touchstart", this.handleTouchStart);
    this.removeEventListener("mouseenter", this.handleMouseEnter);
    this.removeEventListener("mouseleave", this.handleMouseLeave);

    this.observers.forEach((obv) => obv.disconnect());
  }
}

customElements.define("info-element", InfoElement);
