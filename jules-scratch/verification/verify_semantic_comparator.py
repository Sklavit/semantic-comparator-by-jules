import os
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Get the absolute path to the index.html file
    file_path = os.path.abspath('index.html')

    # Navigate to the local HTML file
    page.goto(f'file://{file_path}')

    try:
        # Wait for the model to be ready by checking if the compare button is enabled
        compare_button = page.get_by_role("button", name="Compare")
        # A long timeout is needed as the browser might be downloading the model
        expect(compare_button).to_be_enabled(timeout=180000) # 3 minutes

        # Input texts
        text1 = "The weather is beautiful today. I love sunny days."
        text2 = "Today’s weather is gorgeous. Sunny weather makes me happy."
        page.locator("#text1").fill(text1)
        page.locator("#text2").fill(text2)

        # Click the compare button
        compare_button.click()

        # Wait for the result table to appear. This can take a while.
        result_table = page.locator("#result table")
        expect(result_table).to_be_visible(timeout=120000) # 2 minutes

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Successfully generated screenshot.")

    except AssertionError as e: # Corrected exception type
        # Get the status message from the result container
        status_message = page.locator("#result").text_content()
        print(f"Playwright script failed. Status message: '{status_message}'")
        page.screenshot(path="jules-scratch/verification/failure_screenshot.png")
        raise

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
