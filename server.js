const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
// Serve static files from the root directory
app.use(express.static('.'));

// --- Proxy Endpoints ---

// Proxy for Google Gemini API
app.post('/api/gemini', async (req, res) => {
    try {
        const { textA, textB } = req.body;
        const apiKey = req.headers.authorization?.split(' ')[1];

        if (!apiKey) {
            return res.status(401).json({ error: { message: 'API key is missing' } });
        }

        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        const fullPrompt = getFullPrompt(textA, textB);
        const jsonSchema = getGoogleApiJsonSchema();

        const requestBody = {
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: jsonSchema
            }
        };

        const apiResponse = await axios.post(`${url}?key=${apiKey}`, requestBody, {
            headers: { 'Content-Type': 'application/json' }
        });

        res.json(apiResponse.data);

    } catch (error) {
        console.error('Gemini Proxy Error:', error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.error || { message: 'An internal server error occurred' } });
    }
});

// Proxy for Claude API
app.post('/api/claude', async (req, res) => {
    try {
        const { textA, textB } = req.body;
        const apiKey = req.headers.authorization?.split(' ')[1];

        if (!apiKey) {
            return res.status(401).json({ error: { message: 'API key is missing' } });
        }

        const url = 'https://api.anthropic.com/v1/messages';
        const fullPrompt = getFullPrompt(textA, textB);
        const toolSchema = getClaudeToolSchema();

        const requestBody = {
            model: "claude-3-sonnet-20240229",
            max_tokens: 4096,
            messages: [{ role: "user", content: fullPrompt }],
            tools: [toolSchema],
            tool_choice: { type: "tool", name: "semantic_alignment_output" }
        };

        const apiResponse = await axios.post(url, requestBody, {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        });

        res.json(apiResponse.data);

    } catch (error) {
        console.error('Claude Proxy Error:', error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.error || { message: 'An internal server error occurred' } });
    }
});


// --- Server Start ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});


// --- Helper Functions ---

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

function getGoogleApiJsonSchema() {
    return {
        "type": "OBJECT",
        "properties": {
            "fragments": { "type": "OBJECT", "properties": { "textA": { "type": "ARRAY", "items": { "type": "OBJECT", "properties": { "id": { "type": "STRING" }, "text": { "type": "STRING" }, "startIndex": { "type": "INTEGER" }, "endIndex": { "type": "INTEGER" } }, "required": ["id", "text", "startIndex", "endIndex"] } }, "textB": { "type": "ARRAY", "items": { "type": "OBJECT", "properties": { "id": { "type": "STRING" }, "text": { "type": "STRING" }, "startIndex": { "type": "INTEGER" }, "endIndex": { "type": "INTEGER" } }, "required": ["id", "text", "startIndex", "endIndex"] } } }, "required": ["textA", "textB"] },
            "alignments": { "type": "ARRAY", "items": { "type": "OBJECT", "properties": { "textAFragment": { "type": "STRING", "nullable": true }, "textBFragment": { "type": "STRING", "nullable": true }, "type": { "type": "STRING", "enum": ["MATCH", "SUBSTITUTION", "INSERTION", "DELETION"] }, "similarity": { "type": "NUMBER" }, "description": { "type": "STRING" } }, "required": ["textAFragment", "textBFragment", "type", "similarity", "description"] } },
            "summary": { "type": "OBJECT", "properties": { "totalFragmentsA": { "type": "INTEGER" }, "totalFragmentsB": { "type": "INTEGER" }, "matches": { "type": "INTEGER" }, "substitutions": { "type": "INTEGER" }, "insertions": { "type": "INTEGER" }, "deletions": { "type": "INTEGER" }, "overallSimilarity": { "type": "NUMBER" } }, "required": ["totalFragmentsA", "totalFragmentsB", "matches", "substitutions", "insertions", "deletions", "overallSimilarity"] }
        },
        "required": ["fragments", "alignments", "summary"]
    };
}

function getClaudeToolSchema() {
    return {
        name: "semantic_alignment_output",
        description: "A tool to output the semantic alignment of two texts in a structured JSON format.",
        input_schema: {
            "type": "object",
            "properties": {
                "fragments": { "type": "object", "properties": { "textA": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string" }, "text": { "type": "string" }, "startIndex": { "type": "integer" }, "endIndex": { "type": "integer" } }, "required": ["id", "text", "startIndex", "endIndex"] } }, "textB": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string" }, "text": { "type": "string" }, "startIndex": { "type": "integer" }, "endIndex": { "type": "integer" } }, "required": ["id", "text", "startIndex", "endIndex"] } } }, "required": ["textA", "textB"] },
                "alignments": { "type": "array", "items": { "type": "object", "properties": { "textAFragment": { "type": ["string", "null"] }, "textBFragment": { "type": ["string", "null"] }, "type": { "type": "string", "enum": ["MATCH", "SUBSTITUTION", "INSERTION", "DELETION"] }, "similarity": { "type": "number" }, "description": { "type": "string" } }, "required": ["textAFragment", "textBFragment", "type", "similarity", "description"] } },
                "summary": { "type": "object", "properties": { "totalFragmentsA": { "type": "integer" }, "totalFragmentsB": { "type": "integer" }, "matches": { "type": "integer" }, "substitutions": { "type": "integer" }, "insertions": { "type": "integer" }, "deletions": { "type": "integer" }, "overallSimilarity": { "type": "number" } }, "required": ["totalFragmentsA", "totalFragmentsB", "matches", "substitutions", "insertions", "deletions", "overallSimilarity"] }
            },
            "required": ["fragments", "alignments", "summary"]
        }
    };
}
