import { displayResults, getFullPrompt } from './utils.js';
import { runGoogleApiComparison } from './gemini_client.js';
import { runClaudeApiComparison } from './claude_client.js';
import { initializeOnDeviceModel, createOnDeviceSessionWithMonitor, runOnDeviceComparison } from './on_device_client.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const modelSelector = document.getElementById('model-selector');
    const googleApiKeyContainer = document.getElementById('api-key-container');
    const googleApiKeyInput = document.getElementById('api-key-input');
    const claudeApiKeyContainer = document.getElementById('claude-api-key-container');
    const claudeApiKeyInput = document.getElementById('claude-api-key-input');
    const compareBtn = document.getElementById('compare-btn');
    const text1 = document.getElementById('text1');
    const text2 = document.getElementById('text2');
    const resultContainer = document.getElementById('result');

    // --- App State ---
    let currentModel = modelSelector.value;

    // --- UI Update Logic ---
    function updateUiForModel(model) {
        currentModel = model;
        googleApiKeyContainer.classList.add('hidden');
        claudeApiKeyContainer.classList.add('hidden');
        compareBtn.disabled = true;

        if (model === 'google-api') {
            googleApiKeyContainer.classList.remove('hidden');
            resultContainer.innerHTML = 'Ready to compare using Google Gemini API.';
            compareBtn.disabled = false;
        } else if (model === 'claude-api') {
            claudeApiKeyContainer.classList.remove('hidden');
            resultContainer.innerHTML = 'Ready to compare using Claude API.';
            compareBtn.disabled = false;
        } else { // on-device
            initializeAppState();
        }
    }

    // --- Initialization ---
    async function initializeAppState() {
        compareBtn.disabled = true;
        resultContainer.innerHTML = 'Initializing on-device model...';

        const result = await initializeOnDeviceModel();

        if (result.status === 'ready') {
            resultContainer.innerHTML = 'On-device AI Model is ready.';
            compareBtn.disabled = false;
        } else if (result.status === 'downloading') {
            resultContainer.innerHTML = 'On-device model needs to be downloaded. Starting...';
            await createOnDeviceSessionWithMonitor((e) => {
                const percentage = e.total ? Math.round(e.loaded / e.total * 100) : '...';
                resultContainer.innerHTML = `Downloading on-device model: ${percentage}%`;
            });
            resultContainer.innerHTML = 'On-device AI Model downloaded and ready.';
            compareBtn.disabled = false;
        } else { // 'unavailable'
            console.error(result.error);
            resultContainer.innerHTML = 'On-Device API not available. Please choose another model.';
            modelSelector.options[0].disabled = true;
            if (modelSelector.value === 'on-device') {
                modelSelector.value = 'google-api';
                updateUiForModel('google-api');
            }
        }
    }

    // --- Event Listeners ---
    modelSelector.addEventListener('change', (e) => {
        updateUiForModel(e.target.value);
    });

    compareBtn.addEventListener('click', async () => {
        const textA = text1.value;
        const textB = text2.value;
        if (!textA || !textB) {
            resultContainer.innerHTML = 'Please enter both texts to compare.';
            return;
        }

        compareBtn.disabled = true;
        resultContainer.innerHTML = 'Processing...';
        let result;

        try {
            const fullPrompt = getFullPrompt(textA, textB);
            if (currentModel === 'on-device') {
                result = await runOnDeviceComparison(fullPrompt);
            } else if (currentModel === 'google-api') {
                const apiKey = googleApiKeyInput.value;
                if (!apiKey) throw new Error('Please enter your Google Gemini API key.');
                result = await runGoogleApiComparison(apiKey, fullPrompt);
            } else if (currentModel === 'claude-api') {
                const apiKey = claudeApiKeyInput.value;
                if (!apiKey) throw new Error('Please enter your Claude API key.');
                result = await runClaudeApiComparison(apiKey, fullPrompt);
            }
            displayResults(result, resultContainer);
        } catch (error) {
            resultContainer.innerHTML = `An error occurred: ${error.message}`;
            console.error(error);
        } finally {
            compareBtn.disabled = false;
        }
    });

    // --- Initial App Load ---
    updateUiForModel(modelSelector.value);
});
