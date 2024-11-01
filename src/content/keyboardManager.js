function initializeSpanLabels() {
    // Apply current color and background to span labels
    const spanLabels = document.querySelectorAll('span.label');
    spanLabels.forEach(label => {
        label.style.color = getCurrentColor(); // Assuming this function retrieves the current color
        label.style.backgroundColor = getCurrentBackground(); // Assuming this function retrieves the current background
    });
}
// Call the initialization function on load
initializeSpanLabels(); 