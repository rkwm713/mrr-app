To find the "Construction Grade of Analysis," you will primarily refer to the `CPS_6457E_03_SPIDAcalc.json` file, as this parameter is a specific input for structural analysis.

**1. In `CPS_6457E_03_SPIDAcalc.json`:**

The Construction Grade is part of the definition of an analysis case.

* **Path to check for global analysis case definitions:** `clientData.analysisCases[index]`
    * Each object in the `analysisCases` array describes a type of analysis that can be run (e.g., "NESC 2012-2017").
    * Within each of these objects, you will find the field `constructionGrade`.
    * For example, `clientData.analysisCases[0].constructionGrade` gives "C" for the "Light - Grade C" analysis case.

* **Path to check for a specific analysis applied to a pole:** `leads[index].locations[index].analysis[index].analysisCaseDetails`
    * When an analysis is run on a specific pole (location), the details of the case used, including its `constructionGrade`, are stored here.
    * For example, `leads[0].locations[0].analysis[0].analysisCaseDetails.constructionGrade` would show the construction grade for the first analysis run on the first pole.

**JSON Snippet Example from `CPS_6457E_03_SPIDAcalc.json` (from `clientData.analysisCases`):**

```json
{
  "clientData": {
    "schema": "/schema/spidacalc/client/data.schema",
    "version": 11,
    "name": "TechServ_Light C_Static_Tension.client",
    "analysisCases": [
      {
        "name": "Light - Grade C",
        "type": "NESC 2012-2017",
        // ... other analysis parameters ...
        "constructionGrade": "C", // Here is the Construction Grade
        "loadZone": "LIGHT",
        // ...
      }
      // ... other analysis cases ...
    ],
    // ...
  }
}
```

And here's how it appears for an analysis run on a specific pole location (e.g., "1-PL410620"):
```json
// Path: leads[0].locations[0].analysis[0] (conceptual)
{
  "id": "Light - Grade C",
  "analysisCaseDetails": {
    "name": "Light - Grade C",
    "type": "NESC 2012-2017",
    // ... other analysis parameters ...
    "constructionGrade": "C", // Construction Grade for this specific analysis run
    "loadZone": "LIGHT",
    // ...
  },
  "results": [
    // ... analysis results ...
  ]
}
```
In both instances, the field `constructionGrade` provides the value you're looking for (e.g., "B", "C", or "N" for NESC).

**2. In `CPS_6457E_03_Katapult.json`:**

The `CPS_6457E_03_Katapult.json` file is primarily for field data collection and asset inventory. It **does not typically store the "Construction Grade of Analysis"** as a direct, structured attribute for each pole or analysis.

* This parameter is an input for the structural analysis itself (like SPIDAcalc) and is defined within the analysis setup.
* While Katapult might have notes or custom fields where such information could be manually entered for a project or specific poles, it's not a standard, machine-readable field tied directly to analysis parameters in the same way it is in the SPIDAcalc output.
* A search of the provided Katapult JSON file for terms like "constructionGrade" or similar does not yield a dedicated field for this information within the node attributes.

Therefore, for "Construction Grade of Analysis," the `CPS_6457E_03_SPIDAcalc.json` file is the definitive source.