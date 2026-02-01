# Begrippensets

Deze map bevat externe datasets (JSON of JS) voor Leer Begrippen Reeksen.

## Nieuwe set toevoegen
1) Maak een JSON- of JS-bestand in deze map.
2) Voeg de set toe aan `sets.json`.

### JSON-formaat
Een JSON-config bevat een object met een `concepts`-array.
Elke entry gebruikt hetzelfde schema als de oorspronkelijke set.

```json
{
  "concepts": [
    {
      "term": "voorbeeld",
      "description": "Korte definitie.",
      "termQuestions": ["Vraag 1", "Vraag 2"],
      "descriptionQuestions": ["Vraag 1", "Vraag 2"]
    }
  ]
}
```

### JS-formaat
Gebruik dit als je liever een JS-file laadt. De `id` moet gelijk zijn aan de `id` in `sets.json`.

```js
window.registerBegrippenSet({
  id: "mijn-set",
  concepts: [
    {
      term: "voorbeeld",
      description: "Korte definitie.",
      termQuestions: ["Vraag 1"],
      descriptionQuestions: ["Vraag 1"]
    }
  ]
});
```

## sets.json
`sets.json` is het manifest dat in de UI wordt getoond.

```json
{
  "default": "elektriciteit",
  "sets": [
    {
      "id": "elektriciteit",
      "label": "Elektriciteit (42 begrippen)",
      "description": "Korte omschrijving.",
      "file": "configs/elektriciteit.json"
    }
  ]
}
```

- `default` (optioneel) bepaalt welke set standaard wordt geladen.
- `file` is een pad vanaf `stories/natuurkunde-begrippen-test/`.
