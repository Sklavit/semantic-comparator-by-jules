// gemini_client.js
import { getFullPrompt } from './utils.js';

export async function runGoogleApiComparison(apiKey, textA, textB) {
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
    return JSON.parse(jsonString);
}

function getGoogleApiJsonSchema() {
    // Returns a hardcoded schema with uppercase types and nullable fields for the Google API
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
