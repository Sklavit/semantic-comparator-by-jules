// gemini_client.js

export async function runGoogleApiComparison(apiKey, textA, textB) {
    const url = '/api/gemini'; // Calls the local proxy

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
        // The proxy forwards the error from the API, so we can throw it
        throw new Error(`Google API Error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    // The proxy forwards the response, so we need to extract the final result
    const jsonString = data.candidates[0].content.parts[0].text;
    return JSON.parse(jsonString);
}
