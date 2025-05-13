You can find pole data specifications in both JSON files, though the structure and specific field names differ slightly.

**1. In `CPS_6457E_03_SPIDAcalc.json`:**

The pole specifications are located within the `clientData.poles` array. Each object in this array represents a pole.

* **Path:** `clientData.poles[index]`
* **Relevant Fields:**
    * `species`: The species of the pole (e.g., "Southern Pine").
    * `classOfPole`: The class of the pole (e.g., "4").
    * `height.value`: The height of the pole. The unit is specified in `height.unit` (e.g., "METRE"). You'll need to convert this to feet if needed (1 meter ≈ 3.28084 feet).

**JSON Snippet Example from `CPS_6457E_03_SPIDAcalc.json`:**
```json
{
  "aliases": [{"id": "40-4"}],
  "shape": "ROUND",
  "materialCategory": "WOOD",
  "classOfPole": "4",
  "species": "Southern Pine",
  "height": {
    "unit": "METRE",
    "value": 12.192000000000002
  },
  // ... other pole data ...
}
```
In this snippet, you'd find:
* Species: "Southern Pine"
* Class: "4"
* Height: 12.192 meters (which is approximately 40 feet)

**2. In `CPS_6457E_03_Katapult.json`:**

The pole specifications are located within the `nodes` object. Each key under `nodes` is a node ID, and its value is an object containing an `attributes` object where pole details are stored.

* **Path:** `nodes[node_id].attributes`
* **Relevant Fields (field names can vary slightly or be nested, e.g., within `birthmark_brand`):**
    * Look for attributes like `pole_height` or a similar key (often directly in feet, or nested under `birthmark_brand.pole_height`).
    * Look for `pole_class` (or nested under `birthmark_brand.pole_class`).
    * Look for `pole_species` or `pole_species*` (or nested under `birthmark_brand.pole_species*`. Note: "SPC" might be an abbreviation for Southern Pine).

**JSON Snippet Example from `CPS_6457E_03_Katapult.json` (for node ID `-OJ_PMjpiNrD4UyT0JSz`):**
```json
{
  "-OJ_PMjpiNrD4UyT0JSz": {
    "_created": {
      // ...
    },
    "attributes": {
      "DLOC_number": {
        "-Imported": "PL370858"
      },
      // ... other attributes ...
      "birthmark_brand": {
        "-OJj4wQRhE4mYkP1vFfH": {
          "measured_groundline_circumference": "33",
          "pole_class": "2",
          "pole_height": "45",
          "pole_species*": "SPC" // SPC might denote Southern Pine
        }
      },
      "height": { // This might also be a direct height attribute elsewhere
        "-OJy0DnjN_BPIXwoGvh0": "45"
      },
      "pole_class": { // Or look for a direct pole_class attribute
        "one": "2"
      },
      "pole_owner": {
        "multi_added": "CPS Energy"
      },
      "pole_species": { // Or a direct pole_species attribute
        "one": "Southern Pine" // Example from another node
      }
      // ... other attributes ...
    },
    "button": "aerial_path",
    "latitude": 29.289827214686998,
    "longitude": -98.40951323764607,
    // ...
  }
}
```
In this snippet for node `-OJ_PMjpiNrD4UyT0JSz`, you would primarily look within `attributes.birthmark_brand["-OJj4wQRhE4mYkP1vFfH"]`:
* Species: "SPC" (likely Southern Pine)
* Class: "2"
* Height: "45" (likely in feet)

You might also find direct attributes like `attributes.height.one`, `attributes.pole_class.one`, or `attributes.pole_species.one` for some nodes. You'll need to check the specific structure for each pole ID.