/**
 *
 * @param {string} titleString The text to display in the tooltip flyout content
 * @param containerStyle Optional CSS styles to apply to the info icon
 * @returns
 */
export default function CreateInfoEl(
  titleString: string,
  containerStyle?: Partial<CSSStyleDeclaration>
) {
  // Input validation remains the same
  if (typeof titleString !== "string") {
    throw new Error(
      `argument "titleString" must be of type "string". Received: "${typeof titleString}"`
    );
  }
  if (containerStyle && typeof containerStyle !== "object") {
    throw new Error(
      `argument "containerStyle" must be of type "object". Received: "${typeof containerStyle}"`
    );
  }

  const span = document.createElement("span");
  span.classList.add("info-icon");

  const icon = document.createElement("i");
  icon.classList.add("fa", "fa-solid", "fa-info-circle");
  icon.setAttribute("aria-label", "Info");
  icon.style.cursor = "pointer";

  const flyoutContent = document.createElement("div");
  flyoutContent.innerHTML = titleString;
  flyoutContent.classList.add("flyout-content");

  span.appendChild(icon);
  span.appendChild(flyoutContent);

  if (containerStyle) {
    Object.assign(icon.style, containerStyle);
  }

  // Function to position flyout content remains the same
  const positionFlyout = () => {
    flyoutContent.style.display = "block";

    const flyoutRect = flyoutContent.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    if (flyoutRect.right > viewportWidth) {
      const overflowAmount = flyoutRect.right - viewportWidth;
      flyoutContent.style.left = `calc(50% - ${overflowAmount}px)`;
    }

    if (flyoutRect.left < 0) {
      const overflowAmount = Math.abs(flyoutRect.left);
      flyoutContent.style.left = `calc(50% + ${overflowAmount}px)`;
    }
  };

  // Move event listeners to the span container
  span.addEventListener("mouseenter", () => {
    positionFlyout();
  });

  span.addEventListener("mouseleave", (event) => {
    // Check if we're not moving to a child element
    const relatedTarget = event.relatedTarget as Node;
    if (!span.contains(relatedTarget)) {
      flyoutContent.style.display = "none";
    }
  });

  // Touch handling remains on the icon for better mobile UX
  icon.addEventListener("touchstart", (event) => {
    event.preventDefault();
    flyoutContent.style.display =
      flyoutContent.style.display === "block" ? "none" : "block";
    if (flyoutContent.style.display === "block") {
      positionFlyout();
    }
  });

  document.body.addEventListener("click", (event: Event) => {
    if (!span.contains(event.target as Node)) {
      flyoutContent.style.display = "none";
    }
  });

  flyoutContent.style.display = "none";
  return span;
}
