// claude_client.js
import { getFullPrompt } from './utils.js';

export async function runClaudeApiComparison(apiKey, textA, textB) {
    const url = 'https://api.anthropic.com/v1/messages';
    const fullPrompt = getFullPrompt(textA, textB);
    const toolSchema = getClaudeToolSchema();

    const requestBody = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 4096,
        messages: [{ role: "user", content: fullPrompt }],
        tools: [toolSchema],
        tool_choice: {
            type: "tool",
            name: "semantic_alignment_output"
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude API Error: ${errorData.error.message}`);
    }

    const data = await response.json();
    const toolUseBlock = data.content.find(block => block.type === 'tool_use');
    if (!toolUseBlock) {
        throw new Error("Claude API did not return a valid tool use response.");
    }
    return toolUseBlock.input;
}

function getClaudeToolSchema() {
    // The schema for the tool's input is our desired JSON output structure.
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
