# Semantic Text Comparator

This is an advanced, fully client-side web application that performs a deep semantic comparison of two texts. Unlike traditional diff tools that work on a character or word level, this application aligns text fragments based on their meaning.

The application leverages modern, in-browser AI models to provide a sophisticated analysis of textual similarity, with options to use powerful server-side models as well.

## Features

-   **Multi-Model Support:** Users can choose from three different AI models for the comparison:
    1.  **On-Device (Gemini Nano):** Utilizes the experimental Chrome Prompt API to perform the entire analysis on the user's machine. This is fully private and requires no server interaction.
    2.  **Google Gemini API:** Leverages the powerful Gemini 1.5 Flash model via its REST API. Requires a user-provided API key.
    3.  **Claude API:** Uses the Anthropic Claude 3 Sonnet model via its REST API. Requires a user-provided API key.
-   **Structured JSON Output:** The application instructs the selected AI model to return a detailed, structured JSON object containing the full analysis. This is achieved using the `responseConstraint` feature of the Chrome Prompt API and the "tool use" feature of the Claude API.
-   **Detailed Comparison View:** The results are displayed in a clean, user-friendly format, including:
    -   A high-level summary with an overall similarity score, and counts of matches, substitutions, insertions, and deletions.
    -   A color-coded, side-by-side table showing the alignment of individual text fragments.
-   **Modular Codebase:** The JavaScript is structured with a modern, modular approach:
    -   A central `script.js` controller for UI logic.
    -   Separate client modules for each AI model (`on_device_client.js`, `gemini_client.js`, `claude_client.js`).
    -   A shared `utils.js` for common functions.
-   **Graceful Fallback:** The application intelligently detects if the on-device API is available in the user's browser. If not, it disables the option and defaults to one of the server-side APIs.

## How to Use

1.  **Open `index.html` in a compatible browser.**
2.  **Select an AI Model** from the dropdown menu at the top.
3.  **Provide an API Key** if you select the Google Gemini or Claude API. The input field will appear automatically.
4.  **Enter the two texts** you want to compare into the text areas.
5.  **Click the "Compare" button.**
6.  View the detailed analysis in the "Comparison Result" section.

## Browser Compatibility

The **On-Device Model (Gemini Nano)** option relies on the experimental **Chrome Prompt API**. This has very specific requirements:

-   **Browser:** Google Chrome (Version 138+ is recommended).
-   **Platform:** Desktop only (Windows, macOS, Linux).
-   **Hardware:** A capable GPU with more than 4GB of VRAM is often required.

For users on other browsers (Firefox, Safari, etc.) or with incompatible hardware, this option will be automatically disabled, and they can use one of the server-side API options instead.

## Deployment on GitHub Pages

This static web application can be easily hosted on GitHub Pages.

1.  **Push Code:** Ensure the `dev-1` branch (or your main branch) is pushed to your GitHub repository.
2.  **Configure Pages:** In your repository settings, go to the "Pages" tab.
3.  **Set Source:** Set the source to "Deploy from a branch", select your branch, and keep the folder as `/(root)`.
4.  **Save and Wait:** After saving, GitHub Actions will deploy your site. The public URL will be shown on the Pages settings page.

**Note:** The on-device model will still be subject to the browser compatibility requirements mentioned above, even when hosted on GitHub Pages.
