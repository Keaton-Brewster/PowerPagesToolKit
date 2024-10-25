export default function CreateInfoEl(titleString) {
  // Create a container span
  const span = document.createElement("span");
  span.style.position = "relative";
  span.style.display = "inline-block"; // Ensure proper placement

  // Create the "i" icon
  const icon = document.createElement("i");
  icon.classList.add("fa", "fa-solid", "fa-info-circle");
  icon.setAttribute("aria-label", "Info"); // For accessibility
  icon.style.cursor = "pointer"; // Ensure it's clear it's interactive

  // Create the flyout content
  const flyoutContent = document.createElement("div");
  flyoutContent.innerHTML = titleString;
  flyoutContent.style.display = "none";
  flyoutContent.style.position = "absolute";
  flyoutContent.style.top = "100%";
  flyoutContent.style.left = "0";
  flyoutContent.style.backgroundColor = "#f9f9f9";
  flyoutContent.style.padding = "10px";
  flyoutContent.style.border = "1px solid #ddd";
  flyoutContent.style.zIndex = "1";
  flyoutContent.style.width = "max-content"; // Default for larger screens

  // Responsive Design Adjustments
  flyoutContent.style.maxWidth = "90vw"; // Ensure it doesn't overflow on mobile
  flyoutContent.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.1)"; // Add shadow for clarity
  flyoutContent.style.borderRadius = "4px"; // Make it more modern with rounded corners

  // Append the icon and flyout content to the container
  span.appendChild(icon);
  span.appendChild(flyoutContent);

  // Event listeners for desktop (hover)
  icon.addEventListener("mouseenter", () => {
    flyoutContent.style.display = "block";
  });
  icon.addEventListener("mouseleave", () => {
    flyoutContent.style.display = "none";
  });

  // Event listeners for mobile (touch)
  icon.addEventListener("touchstart", (event) => {
    event.preventDefault(); // Prevent triggering other touch events like click
    if (flyoutContent.style.display === "none") {
      flyoutContent.style.display = "block";
    } else {
      flyoutContent.style.display = "none";
    }
  });

  // Optional: Add an "x" button or click-away to close the flyout on mobile
  document.body.addEventListener("click", (event) => {
    if (!span.contains(event.target)) {
      flyoutContent.style.display = "none"; // Hide if clicked outside
    }
  });

  // Return the span element which holds the icon and flyout content
  return span;
}
