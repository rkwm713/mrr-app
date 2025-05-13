To find the "PLA (%) with proposed attachment" (Percent Load Analysis or pole utilization) from the stressed analysis of the recommended layer, you will primarily use the `CPS_6457E_03_SPIDAcalc.json` file. This file contains the detailed structural analysis results.

**1. In `CPS_6457E_03_SPIDAcalc.json`:**

The PLA (%) for the pole under the recommended design (which includes proposed attachments) is found by looking at the stress analysis results for the "Pole" component within the "Recommended Design" layer for a specific load case.

* **Path to the data for each pole location:** `leads[index].locations[index]`
    * Identify the specific pole location you are interested in (e.g., by its `label` like "1-PL410620").
* **Navigate to the "Recommended Design":**
    * Inside the selected `location` object, go to the `designs` array.
    * Find the object in this array where `label == "Recommended Design"`.
* **Find the relevant stress analysis results:**
    * Within the "Recommended Design" object, there's an `analysis` array. This array contains results for different load cases (e.g., "Light - Grade C", "NESC").
    * Select the analysis case you are interested in (e.g., the one representing the primary stressed condition, often a NESC defined load case like "Light - Grade C").
    * Inside that specific analysis case object, look at the `results` array.
* **Locate the Pole's PLA (%):**
    * Iterate through the `results` array.
    * Find the object where `component == "Pole"` and `analysisType == "STRESS"`.
    * The value of the `actual` field in this object is the PLA (%) for the pole with proposed attachments under that specific load case.

**JSON Snippet Example from `CPS_6457E_03_SPIDAcalc.json`:**

Let's take the pole labeled "1-PL410620" and its "Recommended Design" under the "Light - Grade C" analysis case:

```json
// Path: leads[0].locations[0] (assuming "1-PL410620" is the first location)
{
  "label": "1-PL410620",
  // ... other location data ...
  "designs": [
    {
      "label": "Measured Design",
      // ...
    },
    {
      "label": "Recommended Design", // This is the layer with proposed attachments
      "layerType": "Recommended",
      "structure": {
        // ... details of the pole and all attachments, including proposed ones ...
      },
      "analysis": [
        {
          "id": "Light - Grade C", // This is the stressed analysis case
          "analysisCaseDetails": {
            "name": "Light - Grade C",
            "constructionGrade": "C",
            "loadZone": "LIGHT",
            // ... other analysis case details ...
          },
          "results": [
            // ... results for other components like insulators, crossarms ...
            {
              "actual": 78.69941383944798, // PLA (%) for the pole
              "allowable": 100.0,
              "unit": "PERCENT",
              "analysisDate": 1746193313033,
              "component": "Pole",        // Component is the Pole
              "loadInfo": "Light - Grade C",
              "passes": true,
              "analysisType": "STRESS"     // Analysis type is STRESS
            }
            // ... other results ...
          ]
        },
        {
          "id": "NESC", // Another possible analysis case
          // ...
        }
      ]
    }
  ]
}
```
In this example for pole "1-PL410620", under the "Recommended Design" and "Light - Grade C" analysis, the PLA (%) is **78.69941383944798%**. You would repeat this process for other poles and potentially other relevant stress analysis cases defined in the file.

**2. In `CPS_6457E_03_Katapult.json`:**

The Katapult JSON file (`CPS_6457E_03_Katapult.json`) is primarily used for field data collection, inventory, and high-level make-ready assessments. It **typically does not contain the detailed stressed analysis results like PLA percentages** calculated from structural analysis software such as SPIDAcalc.

However, you might find related summary fields within a node's attributes if these results were imported or summarized from an external analysis:

* **Path to check:** `nodes[node_id].attributes`
* **Potential Fields (these are general and might not directly correspond to the specific "stressed analysis of the recommended layer" PLA):**
    * `existing_capacity_%`: Might indicate the pole's capacity before proposed changes.
    * `final_passing_capacity_%`: This is more likely to reflect the pole's capacity *after* make-ready or proposed changes if the analysis results were integrated back into Katapult. For example, for node `-OJ_PMjpiNrD4UyT0JSz` (PL370858), there's a `"final_passing_capacity_%": { "-ONzZigRJczUNfA6wSoG": "41.95" }`. This percentage would be based on whatever analysis was performed and its results recorded in Katapult.

To get the specific "PLA (%) with proposed attachment from the stressed analysis of the recommended layer" as requested, the `CPS_6457E_03_SPIDAcalc.json` file is the authoritative source to consult, following the steps outlined for it.