// claude_client.js

export async function runClaudeApiComparison(apiKey, textA, textB) {
    const url = '/api/claude'; // Calls the local proxy

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ textA, textB })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Claude API Error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    // The proxy forwards the response, so we need to extract the final result
    const toolUseBlock = data.content.find(block => block.type === 'tool_use');
    if (!toolUseBlock) {
        throw new Error("Claude API did not return a valid tool use response.");
    }
    return toolUseBlock.input;
}
