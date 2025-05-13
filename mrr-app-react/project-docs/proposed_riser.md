To find information about "Proposed Riser (Yes/No)" in both JSON files, you would look for different indicators in each file:

**1. In `CPS_6457E_03_SPIDAcalc.json`:**

You'll typically find information about proposed equipment within the "Recommended Design" for a specific pole location.

* **Path to check:** `leads[index].locations[index].designs`
    * Iterate through the `designs` array for a specific pole location.
    * Look for the design object where `label` is "Recommended Design" (or `layerType` is "Recommended").
    * Within this "Recommended Design" object, navigate to `structure.equipments`. This is an array of equipment on the pole.
* **How to determine "Proposed Riser":**
    * Iterate through the `equipments` array in the "Recommended Design".
    * For each equipment object, check `clientItem.type.name`.
    * If you find an equipment object where `clientItem.type.name == "RISER"`, it indicates a "Proposed Riser (Yes)" for that pole in the recommended design.
    * If no such equipment is found in the "Recommended Design", it implies "Proposed Riser (No)".

**JSON Snippet Example from `CPS_6457E_03_SPIDAcalc.json` (conceptual path):**
```json
// ... leads -> locations -> designs array ...
{
  "label": "Recommended Design",
  "layerType": "Recommended",
  "structure": {
    "pole": {
      // ... pole details ...
    },
    "equipments": [
      {
        "id": "Equip#X",
        "owner": {
          "industry": "COMMUNICATION", // or "UTILITY" / "BOTH"
          "id": "Charter" // or other owner
        },
        "clientItemVersion": "...",
        "clientItem": {
          "type": {
            "name": "RISER", // This indicates a riser
            "industry": "BOTH"
          },
          "size": "2 PVC" // Example size
        },
        // ... other equipment details ...
      }
      // ... other equipment ...
    ],
    // ... other structure details ...
  },
  // ... other design details ...
}
```
In the example above, the presence of an equipment with `clientItem.type.name == "RISER"` in the "Recommended Design" indicates a proposed riser.

**2. In `CPS_6457E_03_Katapult.json`:**

Information about risers is usually found within the `attributes` of each pole node.

* **Path to check:** `nodes[node_id].attributes`
* **How to determine "Proposed Riser":**
    * Look for an attribute key directly named `riser` or similar within the `attributes` object for a specific pole node.
        * For example, you might find something like `"riser": { "button_added": "No" }`, which directly indicates "Proposed Riser (No)" for that pole.
        * If it were `"button_added": "Yes"` or a specific riser type, it would indicate "Yes".
    * Alternatively, look into the `attributes.equipment` object (which contains details of various equipment on the pole).
        * If an equipment item has `"equipment_type": "Riser"` and is part of a proposed layer or has a status indicating it's proposed (Katapult data is often structured around existing vs. proposed states), then it's a "Proposed Riser (Yes)".

**JSON Snippet Example from `CPS_6457E_03_Katapult.json` (for node `-OJ_PMjpiNrD4UyT0JSz`):**
```json
{
  // ...
  "-OJ_PMjpiNrD4UyT0JSz": {
    "_created": { /* ... */ },
    "attributes": {
      // ... other attributes ...
      "riser": { // Direct attribute indicating riser status
        "button_added": "No" // This means No Proposed Riser for this pole
      }
      // ... OR ...
      // "equipment": {
      //   "-some_equipment_id": {
      //     "equipment_type": "Riser", // Indicates a riser
      //     "notes": "Proposed Charter Riser" // Notes might indicate if it's proposed
      //     // ... other equipment details ...
      //   }
      // }
    },
    // ...
  }
  // ...
}
```
In the Katapult file, the most direct way is to look for a `riser` attribute and its `button_added` value. If an equipment item of type "Riser" is found under `attributes.equipment`, you would then need to infer from other attributes or context if it's a *proposed* riser (e.g., associated with a "Charter" make-ready design as seen in the data where new equipment is being added by Charter). For example, in node `"-OJif6kQEblo9j4gD6-l"` there is an equipment:
```json
  "equipment": {
    "-OMSm7xU2nO2-d6X-sY0": {
      "equipment_type": "Riser"
      // ...
    }
  }
```
If this riser was added as part of the "Recommended Design" (from the SPIDAcalc context) or by "Charter" (as seen in other proposed communication items in Katapult), it would imply a "Proposed Riser (Yes)".