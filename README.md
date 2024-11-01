# Ninja Surfing: Mouse-Free Internet Browsing Extension

## Overview

Ninja Surfing is a Chrome extension designed to enhance productivity by enabling mouse-free internet browsing. It's an efficient alternative to mouse navigation, helping users quickly interact with web elements using customizable keyboard shortcuts.

Inspired by the [SurfingKeys extension](https://chromewebstore.google.com/detail/surfingkeys/gfbliohnnapiefjpjlpjnehglfpaknnc), Ninja Surfing addresses configuration complexities associated with VIM-style shortcuts, focusing on simplicity. This project also serves as an exploration of the Chrome Extension API to improve productivity.

## Features

- **Customizable Shortcuts:** Easily configurable shortcuts for intuitive navigation
- **Label System:** Unique labels generated for each clickable item on the page
- **Dynamic Labeling:** Overlay displays progressively as the user types the shortcut
- **Toggle Mode:** Activate or deactivate shortcuts quickly
- **Regenerate Labels on Scroll:** Automatically regenerate labels when scrolling
- **Customizable Label Appearance:** Modify style, color, and size of labels

## Installation

1. **Download or Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/ninja-surfing-extension.git
   cd ninja-surfing-extension
   ```

2. **Load the Extension in Chrome**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right corner)
   - Click "Load unpacked" and select the ninja-surfing-extension folder

3. **Configure Toggle Mode**

   - Go to `chrome://extensions/shortcuts` (or `edge://extensions/shortcuts` for Edge)
   - Set a keyboard shortcut for Toggle Ninja Surfing Mode

## How It Works

### Label Generation

- **Single Characters:** a-z for first 26 interactive elements
- **Two Characters:** aa to zz for elements beyond 26
- **Three Characters:** Supports special characters, numbers, and letters for pages with 234+ elements

### Dynamic Label Regeneration

- Labels automatically regenerate on scroll
- Optimized with debounce for performance
- Ensures new elements become interactable without page refresh

## Configuration

### Shortcut Mapping

- Customize keys for link navigation, form inputs, and buttons
- Configure toggle mode shortcut in browser extension settings

### Label Display Options

- **Overlay Style:** Configurable size, font, and color
- **Progressive Coloring:** Visual feedback as characters are typed
- **Appearance:** Adjustable to user preferences

## Technical Details

Ninja Surfing leverages the Chrome Extension API to:

- Scan viewport for clickable elements
- Assign unique labels based on element count
- Handle high interactivity effectively
- Adapt to dynamic page content

## Logo

The Ninja Surfing logo was created using AI-generated design.

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the Repository
2. Create a Branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit Changes
   ```bash
   git commit -m "Add your message here"
   ```
4. Push to the Branch
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

Special thanks to the developers of SurfingKeys for inspiring this project.
