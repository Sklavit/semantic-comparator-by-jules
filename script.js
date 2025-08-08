document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const modelSelector = document.getElementById('model-selector');
    const apiKeyContainer = document.getElementById('api-key-container');
    const apiKeyInput = document.getElementById('api-key-input');
    const compareBtn = document.getElementById('compare-btn');
    const text1 = document.getElementById('text1');
    const text2 = document.getElementById('text2');
    const resultContainer = document.getElementById('result');

    let onDeviceSession; // To hold the on-device language model session

    // --- Model Initialization ---
    async function initializeOnDeviceModel() {
        compareBtn.disabled = true;
        resultContainer.innerHTML = 'Initializing on-device model...';
        if (!window.LanguageModel) {
            resultContainer.innerHTML = 'On-Device API not available. Switched to Google API.';
            modelSelector.options[0].disabled = true;
            modelSelector.value = 'google-api';
            modelSelector.dispatchEvent(new Event('change'));
            return;
        }

        try {
            const availability = await window.LanguageModel.availability();
            if (availability.status === 'available') {
                resultContainer.innerHTML = 'On-device AI Model is ready.';
                onDeviceSession = await window.LanguageModel.create();
                compareBtn.disabled = false;
            } else if (availability.status === 'downloadable') {
                resultContainer.innerHTML = 'On-device model needs to be downloaded. Starting...';
                onDeviceSession = await window.LanguageModel.create({
                    monitor(m) {
                        m.addEventListener('downloadprogress', (e) => {
                            const percentage = e.total ? Math.round(e.loaded / e.total * 100) : '...';
                            resultContainer.innerHTML = `Downloading on-device model: ${percentage}%`;
                        });
                    },
                });
                resultContainer.innerHTML = 'On-device AI Model downloaded and ready.';
                compareBtn.disabled = false;
            } else {
                resultContainer.innerHTML = `On-device model not available (${availability.status}). Switched to Google API.`;
                modelSelector.options[0].disabled = true;
                modelSelector.value = 'google-api';
                modelSelector.dispatchEvent(new Event('change'));
            }
        } catch (error) {
            resultContainer.innerHTML = `Error initializing on-device model: ${error.message}. Switched to Google API.`;
            modelSelector.options[0].disabled = true;
            modelSelector.value = 'google-api';
            modelSelector.dispatchEvent(new Event('change'));
            console.error(error);
        }
    }

    // --- Event Listeners ---
    modelSelector.addEventListener('change', () => {
        const selectedModel = modelSelector.value;
        if (selectedModel === 'google-api') {
            apiKeyContainer.style.display = 'flex';
            compareBtn.disabled = false;
            resultContainer.innerHTML = 'Ready to compare using Google Gemini API.';
        } else {
            apiKeyContainer.style.display = 'none';
            initializeOnDeviceModel();
        }
    });

    compareBtn.addEventListener('click', async () => {
        const selectedModel = modelSelector.value;
        const textA = text1.value;
        const textB = text2.value;

        if (!textA || !textB) {
            resultContainer.innerHTML = 'Please enter both texts to compare.';
            return;
        }

        compareBtn.disabled = true;
        resultContainer.innerHTML = 'Processing...';

        try {
            if (selectedModel === 'on-device') {
                await runOnDeviceComparison(textA, textB);
            } else {
                await runGoogleApiComparison(textA, textB);
            }
        } catch (error) {
            resultContainer.innerHTML = `An error occurred: ${error.message}`;
            console.error(error);
        } finally {
            compareBtn.disabled = false;
        }
    });

    // --- Comparison Logic ---
    async function runOnDeviceComparison(textA, textB) {
        if (!onDeviceSession) {
            throw new Error('On-device session not initialized. Please select it again to retry.');
        }
        const fullPrompt = getFullPrompt(textA, textB);
        const jsonSchema = getJsonSchema();
        const rawResponse = await onDeviceSession.prompt(fullPrompt, {
            responseConstraint: { schema: jsonSchema }
        });
        const response = JSON.parse(rawResponse);
        displayResults(response, resultContainer);
    }

    async function runGoogleApiComparison(textA, textB) {
        const apiKey = apiKeyInput.value;
        if (!apiKey) {
            throw new Error('Please enter your Google Gemini API key.');
        }

        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        const fullPrompt = getFullPrompt(textA, textB);
        const jsonSchema = getJsonSchema();

        const requestBody = {
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: jsonSchema
            }
        };

        const response = await fetch(`${url}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Google API Error: ${errorData.error.message}`);
        }

        const data = await response.json();
        const jsonString = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(jsonString);
        displayResults(result, resultContainer);
    }

    // --- Initial Setup ---
    // Initialize with the default selected model
    if (modelSelector.value === 'on-device') {
        initializeOnDeviceModel();
    } else {
        apiKeyContainer.style.display = 'flex';
        compareBtn.disabled = false;
        resultContainer.innerHTML = 'Ready to compare using Google Gemini API.';
    }
});

// ... (The rest of the functions getFullPrompt, getJsonSchema, displayResults remain the same, so I'm omitting them for brevity)
function getFullPrompt(textA, textB) {
    return `# Semantic Text Alignment Prompt

You are an expert text alignment system. Your task is to perform semantic alignment between two texts, similar to sequence alignment in bioinformatics but focusing on semantic meaning rather than exact character matches.

## Task Overview

Given two input texts, you need to:

1.  Split both texts into meaningful, continuous fragments (phrases, sentences, or semantic units)
2.  Align these fragments based on semantic similarity
3.  Identify alignments as matches, insertions, deletions, or substitutions

## Instructions

### Step 1: Fragment Segmentation

*   Split each text into coherent semantic units (typically sentences or meaningful phrases)
*   Each fragment should be self-contained and represent a complete thought or concept
*   Number the fragments for reference (Text A: A1, A2, A3… Text B: B1, B2, B3…)

### Step 2: Semantic Similarity Assessment

For each possible pair of fragments between the texts:

*   Evaluate semantic similarity on a scale of 0-1
*   Consider:
    *   Core meaning and concepts
    *   Paraphrasing and synonyms
    *   Contextual equivalence
    *   Logical relationships
*   Fragments with similarity ≥ 0.7 are considered potential matches

### Step 3: Alignment Generation

Create the optimal alignment using dynamic programming principles:

*   **MATCH**: Fragments with high semantic similarity (≥ 0.7)
*   **SUBSTITUTION**: Fragments with moderate similarity (0.3-0.69) that occupy similar positions
*   **INSERTION**: Fragment exists in Text B but has no good match in Text A
*   **DELETION**: Fragment exists in Text A but has no good match in Text B

Now please process the following texts:

**Text A**: """${textA}"""

**Text B**: """${textB}"""
`;
}

function getJsonSchema() {
    return {
        "type": "object",
        "properties": {
            "fragments": {
                "type": "object",
                "properties": {
                    "textA": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": { "type": "string" },
                                "text": { "type": "string" },
                                "startIndex": { "type": "integer" },
                                "endIndex": { "type": "integer" }
                            },
                            "required": ["id", "text", "startIndex", "endIndex"]
                        }
                    },
                    "textB": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": { "type": "string" },
                                "text": { "type": "string" },
                                "startIndex": { "type": "integer" },
                                "endIndex": { "type": "integer" }
                            },
                            "required": ["id", "text", "startIndex", "endIndex"]
                        }
                    }
                },
                "required": ["textA", "textB"]
            },
            "alignments": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "textAFragment": { "type": ["string", "null"] },
                        "textBFragment": { "type": ["string", "null"] },
                        "type": { "type": "string", "enum": ["MATCH", "SUBSTITUTION", "INSERTION", "DELETION"] },
                        "similarity": { "type": "number" },
                        "description": { "type": "string" }
                    },
                    "required": ["textAFragment", "textBFragment", "type", "similarity", "description"]
                }
            },
            "summary": {
                "type": "object",
                "properties": {
                    "totalFragmentsA": { "type": "integer" },
                    "totalFragmentsB": { "type": "integer" },
                    "matches": { "type": "integer" },
                    "substitutions": { "type": "integer" },
                    "insertions": { "type": "integer" },
                    "deletions": { "type": "integer" },
                    "overallSimilarity": { "type": "number" }
                },
                "required": ["totalFragmentsA", "totalFragmentsB", "matches", "substitutions", "insertions", "deletions", "overallSimilarity"]
            }
        },
        "required": ["fragments", "alignments", "summary"]
    };
}

function displayResults(data, container) {
    const { fragments, alignments, summary } = data;
    const fragmentsA = fragments.textA.reduce((acc, f) => ({ ...acc, [f.id]: f.text }), {});
    const fragmentsB = fragments.textB.reduce((acc, f) => ({ ...acc, [f.id]: f.text }), {});

    let html = '<h3>Summary</h3>';
    html += '<ul>';
    html += `<li>Overall Similarity: ${summary.overallSimilarity.toFixed(2)}</li>`;
    html += `<li>Matches: ${summary.matches}</li>`;
    html += `<li>Substitutions: ${summary.substitutions}</li>`;
    html += `<li>Insertions: ${summary.insertions}</li>`;
    html += `<li>Deletions: ${summary.deletions}</li>`;
    html += '</ul>';

    html += '<h3>Alignment Details</h3>';
    html += '<table>';

    alignments.forEach(pair => {
        let rowClass = '';
        let textA = '';
        let textB = '';
        let similarity = '';

        if (pair.type === 'MATCH' || pair.type === 'SUBSTITUTION') {
            rowClass = pair.type === 'MATCH' ? 'match' : 'change';
            textA = fragmentsA[pair.textAFragment];
            textB = fragmentsB[pair.textBFragment];
            similarity = `(Score: ${pair.similarity.toFixed(2)})`;
        } else if (pair.type === 'DELETION') {
            rowClass = 'delete';
            textA = fragmentsA[pair.textAFragment];
            textB = '';
        } else if (pair.type === 'INSERTION') {
            rowClass = 'insert';
            textA = '';
            textB = fragmentsB[pair.textBFragment];
        }

        html += `<tr class="${rowClass}">`;
        html += `<td>${textA}</td>`;
        html += `<td>${textB} ${similarity}</td>`;
        html += '</tr>';
    });

    html += '</table>';
    container.innerHTML = html;
}
