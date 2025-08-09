// on_device_client.js
import { getFullPrompt } from './utils.js';

let onDeviceSession;

export async function initializeOnDeviceModel() {
    if (!window.LanguageModel) {
        return { status: 'unavailable', error: 'On-Device API not available in this browser.' };
    }

    try {
        const availability = await window.LanguageModel.availability();
        if (availability.status === 'available') {
            onDeviceSession = await window.LanguageModel.create();
            return { status: 'ready' };
        } else if (availability.status === 'downloadable') {
            return { status: 'downloading' };
        } else {
            return { status: 'unavailable', error: `On-device model not available (${availability.status}).` };
        }
    } catch (error) {
        return { status: 'unavailable', error: error.message };
    }
}

export async function createOnDeviceSessionWithMonitor(progressCallback) {
    onDeviceSession = await window.LanguageModel.create({
        monitor(m) {
            m.addEventListener('downloadprogress', progressCallback);
        },
    });
    return { status: 'ready' };
}

export async function runOnDeviceComparison(textA, textB) {
    if (!onDeviceSession) {
        throw new Error('On-device session not initialized.');
    }
    const jsonSchema = getOnDeviceJsonSchema();
    const rawResponse = await onDeviceSession.prompt(getFullPrompt(textA, textB), {
        responseConstraint: { schema: jsonSchema }
    });
    return JSON.parse(rawResponse);
}

function getOnDeviceJsonSchema() {
    return {
        "type": "object",
        "properties": {
            "fragments": { "type": "object", "properties": { "textA": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string" }, "text": { "type": "string" }, "startIndex": { "type": "integer" }, "endIndex": { "type": "integer" } }, "required": ["id", "text", "startIndex", "endIndex"] } }, "textB": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string" }, "text": { "type": "string" }, "startIndex": { "type": "integer" }, "endIndex": { "type": "integer" } }, "required": ["id", "text", "startIndex", "endIndex"] } } }, "required": ["textA", "textB"] },
            "alignments": { "type": "array", "items": { "type": "object", "properties": { "textAFragment": { "type": ["string", "null"] }, "textBFragment": { "type": ["string", "null"] }, "type": { "type": "string", "enum": ["MATCH", "SUBSTITUTION", "INSERTION", "DELETION"] }, "similarity": { "type": "number" }, "description": { "type": "string" } }, "required": ["textAFragment", "textBFragment", "type", "similarity", "description"] } },
            "summary": { "type": "object", "properties": { "totalFragmentsA": { "type": "integer" }, "totalFragmentsB": { "type": "integer" }, "matches": { "type": "integer" }, "substitutions": { "type": "integer" }, "insertions": { "type": "integer" }, "deletions": { "type": "integer" }, "overallSimilarity": { "type": "number" } }, "required": ["totalFragmentsA", "totalFragmentsB", "matches", "substitutions", "insertions", "deletions", "overallSimilarity"] }
        },
        "required": ["fragments", "alignments", "summary"]
    };
}
