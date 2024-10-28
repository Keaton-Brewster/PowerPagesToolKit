import "../CSS/infoEl.style.css"; // Import the CSS file

export default function CreateInfoEl(titleString) {
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

  document.body.addEventListener("click", (event) => {
    if (!span.contains(event.target)) {
      flyoutContent.style.display = "none"; // Hide on body click
    }
  });

  return span;
}
