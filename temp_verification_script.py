import os
import subprocess
import time
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    server_process = None
    try:
        # --- Start the server ---
        print("Starting the backend proxy server using npm start --prefix .")
        server_process = subprocess.Popen(['npm', 'start', '--prefix', '.'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, preexec_fn=os.setsid)
        time.sleep(3)

        if server_process.poll() is not None:
            stderr_output = server_process.stderr.read()
            raise RuntimeError(f"Server failed to start. Error: {stderr_output}")

        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000')

        # --- Test UI Flows ---
        print("Testing UI flows...")
        page.locator("#model-selector").select_option("google-api")
        expect(page.locator("#api-key-container")).to_be_visible()
        page.locator("#model-selector").select_option("claude-api")
        expect(page.locator("#claude-api-key-container")).to_be_visible()
        print("UI flows verified.")

        # --- Test Claude API call ---
        print("Testing Claude API call with a dummy key via proxy...")
        page.locator("#text1").fill("Test")
        page.locator("#text2").fill("Test")
        page.locator("#claude-api-key-input").fill("DUMMY_API_KEY")
        page.get_by_role("button", name="Compare").click()
        expect(page.locator("#result")).to_contain_text("Claude API Error", timeout=30000)
        print("Claude API error verified successfully.")

        page.screenshot(path="verification.png")
        print("Successfully generated final screenshot.")
        browser.close()

    finally:
        if server_process:
            print("Stopping the backend proxy server...")
            try:
                os.killpg(os.getpgid(server_process.pid), 9)
            except ProcessLookupError:
                print("Server process already terminated.")

with sync_playwright() as playwright:
    run_verification(playwright)
