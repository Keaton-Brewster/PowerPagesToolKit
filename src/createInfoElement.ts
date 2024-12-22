/**
 *
 * @param {string} titleString The text to display in the tooltip flyout content
 * @param containerStyle Optional CSS styles to apply to the container for the info element
 * @returns
 */
export default function CreateInfoEl(
  titleString: string,
  containerStyle?: Partial<CSSStyleDeclaration>
) {
  if (typeof titleString !== "string") {
    throw new Error(
      `argument "titleString" must be of type "string". Received: "${typeof titleString}"`
    );
  }
  if (containerStyle && !(containerStyle instanceof CSSStyleDeclaration)) {
    throw new Error(
      `argument "containerStyle" must be of type "CSSStyleDeclaration". Received: "${typeof containerStyle}"`
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

  if (containerStyle instanceof CSSStyleDeclaration) {
    Object.assign(span.style, containerStyle);
  }

  // Function to position flyout content
  const positionFlyout = () => {
    flyoutContent.style.display = "block"; // Show the flyout to calculate dimensions

    const flyoutRect = flyoutContent.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    // Position the flyout

    // Adjust if flyout is too far to the right
    if (flyoutRect.right > viewportWidth) {
      const overflowAmount = flyoutRect.right - viewportWidth;
      flyoutContent.style.left = `calc(50% - ${overflowAmount}px)`; // Shift left
    }

    // Adjust if flyout is too far to the left
    if (flyoutRect.left < 0) {
      const overflowAmount = Math.abs(flyoutRect.left);
      flyoutContent.style.left = `calc(50% + ${overflowAmount}px)`; // Shift right
    }
  };

  icon.addEventListener("mouseenter", positionFlyout);

  icon.addEventListener("mouseleave", () => {
    flyoutContent.style.display = "none"; // Hide on mouse leave
  });

  icon.addEventListener("touchstart", (event) => {
    event.preventDefault();
    // Toggle flyout visibility on touch
    flyoutContent.style.display =
      flyoutContent.style.display === "block" ? "none" : "block";
    if (flyoutContent.style.display === "block") {
      positionFlyout(); // Position the flyout when displayed
    }
  });

  document.body.addEventListener("click", (event: Event) => {
    if (!span.contains(<Node>event.target)) {
      flyoutContent.style.display = "none"; // Hide on body click
    }
  });

  flyoutContent.style.display = "none";
  return span;
}
