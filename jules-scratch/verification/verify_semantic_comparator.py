import os
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Get the absolute path to the index.html file
    file_path = os.path.abspath('index.html')

    # Navigate to the local HTML file
    page.goto(f'file://{file_path}')

    # --- Test 1: Verify automatic switch to Google API ---
    print("Verifying final state after automatic switch to Google API...")
    # In this environment, the on-device model is not available.
    # The app should detect this, switch the model, and settle into the 'Google API ready' state.

    # Check that the model selector has switched to 'google-api'
    expect(page.locator("#model-selector")).to_have_value("google-api", timeout=10000)

    # Check that the API key container is now visible
    expect(page.locator("#api-key-container")).to_be_visible()

    # Check that the final status message is correct
    expect(page.locator("#result")).to_have_text("Ready to compare using Google Gemini API.")
    print("Automatic switch and final state verified successfully.")

    # --- Test 2: Test Google Gemini API call with dummy key ---
    print("Testing Google Gemini API call with a dummy key...")
    # Enter text and a dummy API key
    page.locator("#text1").fill("This is a test.")
    page.locator("#text2").fill("This is another test.")
    page.locator("#api-key-input").fill("DUMMY_API_KEY")

    # Click compare
    page.get_by_role("button", name="Compare").click()

    # --- Test 3: Check for expected error ---
    print("Testing for expected API error...")
    # Wait for the error message from the invalid API key
    expect(page.locator("#result")).to_contain_text("Google API Error", timeout=30000)
    print("API error verified successfully.")

    # Take a screenshot of the final state
    page.screenshot(path="jules-scratch/verification/verification.png")
    print("Successfully generated final screenshot.")

    browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
