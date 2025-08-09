import os
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Get the absolute path to the index.html file
    file_path = os.path.abspath('index.html')

    # Navigate to the local HTML file
    page.goto(f'file://{file_path}')

    # --- Test 1: Manually switch to Google API ---
    print("Testing manual switch to Google API...")
    page.locator("#model-selector").select_option("google-api")
    expect(page.locator("#api-key-container")).to_be_visible(timeout=5000)
    expect(page.locator("#claude-api-key-container")).to_be_hidden()
    print("Manual switch to Google API verified.")

    # --- Test 2: Manually switch to Claude API ---
    print("Testing manual switch to Claude API...")
    page.locator("#model-selector").select_option("claude-api")
    expect(page.locator("#api-key-container")).to_be_hidden()
    expect(page.locator("#claude-api-key-container")).to_be_visible()
    print("Manual switch to Claude API verified.")

    # --- Test 3: Test Claude API call with dummy key ---
    print("Testing Claude API call with a dummy key...")
    page.locator("#text1").fill("This is a test for Claude.")
    page.locator("#text2").fill("This is another test for Claude.")
    page.locator("#claude-api-key-input").fill("DUMMY_API_KEY")
    page.get_by_role("button", name="Compare").click()
    expect(page.locator("#result")).to_contain_text("Claude API Error", timeout=30000)
    print("Claude API error verified successfully.")

    # Take a screenshot of the final state
    page.screenshot(path="jules-scratch/verification/verification.png")
    print("Successfully generated final screenshot.")

    browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
