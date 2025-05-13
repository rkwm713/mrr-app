To find information about "Proposed Guy (Yes/No)" in both JSON files, you would look for specific structures and keywords:

**1. In `CPS_6457E_03_SPIDAcalc.json`:**

Information about proposed guys is typically found within the "Recommended Design" section for a specific pole location.

* **Path to check:** `leads[index].locations[index].designs`
    * Iterate through the `designs` array for a specific pole location.
    * Look for the design object where `label` is "Recommended Design" (or `layerType` is "Recommended").
    * Within this "Recommended Design" object, navigate to `structure.guys` or `structure.spanGuys`. These are arrays.
* **How to determine "Proposed Guy":**
    * If the `guys` array or the `spanGuys` array is present and contains objects (i.e., is not empty) within the "Recommended Design", it indicates a "Proposed Guy (Yes)" for that pole.
    * Each object within the `guys` array will detail a specific down guy, including its `clientItem.size` and `attachmentHeight`.
    * Each object within the `spanGuys` array will detail a specific span guy.
    * If both arrays are empty or not present in the "Recommended Design", it implies "Proposed Guy (No)".

**JSON Snippet Example from `CPS_6457E_03_SPIDAcalc.json` (conceptual path within a "Recommended Design"):**
```json
// ... leads -> locations -> designs (Recommended Design) -> structure ...
"structure": {
  // ... other pole structure details ...
  "guys": [
    {
      "id": "Guy#1",
      "owner": { /* ... */ },
      "clientItemVersion": "...",
      "clientItem": {
        "size": "3/8\" EHS", // Indicates a guy wire
        "coreStrands": 0,
        "conductorStrands": 7
      },
      "clientItemAlias": "E1.1L.3/8",
      "attachmentHeight": {
        "unit": "METRE",
        "value": 10.3632
      }
      // ... other guy details
    }
  ],
  "spanGuys": [
    // ... span guy objects if any ...
  ]
  // ...
}
```
The presence of objects in the `guys` or `spanGuys` array in the "Recommended Design" means "Proposed Guy (Yes)".

**2. In `CPS_6457E_03_Katapult.json`:**

Information about proposed guys can be found within the `attributes` of each pole node, or in connection details for anchors.

* **Path to check:** `nodes[node_id].attributes`
* **How to determine "Proposed Guy":**
    * Look for an attribute object named `guying`. This object would contain details for individual guys. Check if any of these guy objects explicitly state they are proposed (e.g., via a `"proposed": true` attribute, or if the guy entry itself is part of a proposed design layer).
        * For example, node `-OJ_P_8Z7s5gxN9tQia9` in your file has a `guying` attribute where a guy wire has `"proposed": true`. This means "Proposed Guy (Yes)".
    * Check descriptive note fields like `STRESS_-_MR_responsible_party` (and its nested notes) or `kat_MR_notes`. These fields sometimes contain text explicitly stating the installation of a guy (e.g., "Install down guy and anchor" or "Charter install down guy"). This would indicate "Proposed Guy (Yes)".
    * You can also look at the `connections` object. Connections with a `"button": "anchor"` represent a guy wire system. The attributes of the anchor node itself (found in `nodes[anchor_node_id].attributes`) or the attributes of the connection might indicate if the guy system is new/proposed.

**JSON Snippet Example from `CPS_6457E_03_Katapult.json` (Node `-OJ_P_8Z7s5gxN9tQia9`):**
```json
{
  // ...
  "-OJ_P_8Z7s5gxN9tQia9": { // Pole Node ID
    "_created": { /* ... */ },
    "attributes": {
      // ... other attributes ...
      "guying": {
        "-OJj2q6jHK_EzpyUmjhZ": { // Guy ID
          "anchor_id": {
            "node_id": "-OJj2q6kUMzRpTvFaeiA"
          },
          "attachment_height": "31'-7\"",
          "guy_lead": "40",
          "guy_type": "Down Guy",
          "guy_wire_size": "EHS 1/4\"",
          "heading": 147,
          "measured_anchor_rod_size": "5/8\"",
          "measured_guy_height": "20'-7\"",
          "proposed": true, // This indicates a Proposed Guy (Yes)
          "sharing": "No"
        }
        // ... other guys ...
      },
      "STRESS_-_MR_responsible_party": { // Check notes here
        "-OL-SLmWEDXrPEvVnn8N": "CPS Energy"
      },
      "kat_MR_notes": { // Also check notes here
         "-OL-SLAFeGmttFF_XEZ4": "CPS - Crossarm Broken and missing insulator\nRaise Driploop 10\" above supply fiber"
         // A note about adding a guy here would indicate "Yes"
      }
      // ... other attributes ...
    },
    // ...
  }
  // ...
}
```
In this Katapult example, the `guying` object for pole `-OJ_P_8Z7s5gxN9tQia9` contains a guy (`-OJj2q6jHK_EzpyUmjhZ`) which has `"proposed": true`, meaning "Proposed Guy (Yes)".
Additionally, for pole `-OJ_PMjpiNrD4UyT0JSz`, the attribute `STRESS_-_MR_responsible_party` has a note: `"-OL-SzMh_kwEDXrPEvVq": "Install down guy and anchor"`, which also indicates a "Proposed Guy (Yes)".