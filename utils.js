// utils.js

export function getFullPrompt(textA, textB) {
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

export function displayResults(data, container) {
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
