# semantic-comparator-by-jules
Static web app. Input: 2 texts Output:  - texts should be splitted on some sort of continuous fragments - these fragments should be aligned like in Levenshtain metrics (insertions, deletions, changes), taking into account semantic similarity of the selected fragments.

# dev-1 
Gemini API still not working. Jules can't fix it.

```
script.js:92 Error: Google API Error: Invalid JSON payload received. Unknown name "type" at 'generation_config.response_schema.properties[1].value.items.properties[0].value': Proto field is not repeating, cannot start list.
Invalid JSON payload received. Unknown name "type" at 'generation_config.response_schema.properties[1].value.items.properties[1].value': Proto field is not repeating, cannot start list.
    at runGoogleApiComparison (script.js:138:19)
    at async HTMLButtonElement.<anonymous> (script.js:88:17)
```

