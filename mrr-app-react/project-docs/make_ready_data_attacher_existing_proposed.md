To find the wire owner names and their attachment heights for attachments located at or below the (CPS) neutral wire, looking at both "existing (measured)" and "proposed (recommended)" layers, you'll need to consult both JSON files.

* **`CPS_6457E_03_Katapult.json`** will be the primary source for "existing (measured)" data.
* **`CPS_6457E_03_SPIDAcalc.json`** will be the primary source for "proposed (recommended)" data, specifically within its "Recommended Design" layer.

Here’s a breakdown of how to find this information for each pole:

**I. Existing (Measured) Layer Data (from `CPS_6457E_03_Katapult.json`)**

For each `node_id` (pole) in the `nodes` object:

1.  **Find the Lowest Existing CPS Neutral Wire Height:**
    * Navigate to `nodes[node_id].attributes.equipment`. This object lists all existing equipment on the pole.
    * Iterate through each piece of equipment (identified by its `equipment_id`):
        * **Identify Owner:** Check `attributes.equipment[equipment_id].owner_name.one` (or `.multi_added`) to confirm the owner is "CPS Energy" (or a known variant like "CPS").
        * **Identify Type:** Check `attributes.equipment[equipment_id].equipment_type.button_added` (or `.one`, `.auto_button`, etc.) for values like "Neutral", "Secondary Neutral".
        * **Get Height:** If it's a CPS neutral, extract its height from fields like `attributes.equipment[equipment_id].attachment_height_ft` (e.g., "32'-5\"") or `measured_height_ft`. Convert this height from feet-inches format to decimal feet (e.g., "32'-5\"" becomes 32.42 feet).
    * Determine the minimum height among all identified CPS neutral wires on this pole. This is `lowest_cps_neutral_height_existing`. If no CPS neutral is found for a pole, you cannot proceed with the "neutral and below" filtering for that specific pole from this file based on this criterion.

2.  **List Existing Wire Owners and Attachment Heights At or Below Neutral:**
    * Once `lowest_cps_neutral_height_existing` is known for the pole:
        * Iterate again through all equipment under `nodes[node_id].attributes.equipment`.
        * For each attachment:
            * Get its attachment height (convert to decimal feet as above).
            * If the attachment's height is less than or equal to `lowest_cps_neutral_height_existing`:
                * **Owner Name:** Extract from `attributes.equipment[equipment_id].owner_name.one` (or `.multi_added`).
                * **Attachment Height:** The decimal feet height.
                * Record the owner name and its attachment height.

**Example Snippet (Katapult - Conceptual):**
For pole `"-OJ_PMjpiNrD4UyT0JSz"`:
* Assume a CPS Neutral is found: `nodes["-OJ_PMjpiNrD4UyT0JSz"].attributes.equipment["equip_id_neutral"].attachment_height_ft` = "30-0" (30.0 feet). `lowest_cps_neutral_height_existing` = 30.0 ft.
* Iterate other equipment:
    * `nodes["-OJ_PMjpiNrD4UyT0JSz"].attributes.equipment["equip_id_comm1"]`:
        * `owner_name.one`: "AT&T"
        * `attachment_height_ft`: "28-6" (28.5 feet)
        * *Result for existing:* AT&T at 28.5 feet (since 28.5 <= 30.0)
    * `nodes["-OJ_PMjpiNrD4UyT0JSz"].attributes.equipment["equip_id_power_secondary"]`:
        * `owner_name.one`: "CPS Energy"
        * `attachment_height_ft`: "32-0" (32.0 feet)
        * *Result for existing:* (Ignore, as 32.0 > 30.0)

**II. Proposed (Recommended) Layer Data (from `CPS_6457E_03_SPIDAcalc.json`)**

For each pole location (e.g., identified by `leads[index].locations[index].label`):

1.  **Navigate to the "Recommended Design":**
    * Go to `leads[index].locations[index].designs`.
    * Find the object in this array where `label == "Recommended Design"`.

2.  **Find the Lowest Proposed CPS Neutral Wire Height in the Recommended Design:**
    * Within the `structure.wires` array of the "Recommended Design":
        * Identify wires where `owner.id == "CPS ENERGY"` (or equivalent identifier used in SPIDAcalc) AND `clientItem.usageGroups` contains "NEUTRAL".
        * Get their `attachmentHeight.value`. This value is in meters and must be converted to feet (1 meter ≈ 3.28084 feet).
    * Determine the minimum height among these proposed CPS neutral wires. This is `lowest_cps_neutral_height_proposed`. If no proposed CPS neutral is found, you cannot proceed for this pole's recommended design.

3.  **List Proposed Wire Owners and Attachment Heights At or Below Neutral in the Recommended Design:**
    * Once `lowest_cps_neutral_height_proposed` is known:
        * Iterate through all items in `structure.wires[]` (for cables/conductors) and `structure.equipments[]` (for other pole-mounted items that might have an owner and height, though wires are the primary focus of "wire owner").
        * For each item:
            * Get its attachment height: `attachmentHeight.value` (convert to feet).
            * If its height is less than or equal to `lowest_cps_neutral_height_proposed`:
                * **Owner Name/ID:** Extract from `owner.id`. This will likely be an identifier like "CPS ENERGY", "AT&T", "CHARTER".
                * **Attachment Height:** The decimal feet height.
                * Record the owner ID and its attachment height.

**Example Snippet (SPIDAcalc - Conceptual, for a pole in "Recommended Design"):**
`leads[0].locations[0].designs[1]` (assuming this is the "Recommended Design"):
* `structure.wires`:
    * Item 1: `owner.id: "CPS ENERGY"`, `clientItem.usageGroups: ["NEUTRAL"]`, `attachmentHeight.value: 9.144` (approx 30.0 feet). This is `lowest_cps_neutral_height_proposed`.
    * Item 2: `owner.id: "AT&T"`, `clientItem.usageGroups: ["COMMUNICATION"]`, `attachmentHeight.value: 8.6868` (approx 28.5 feet).
        * *Result for proposed:* AT&T at 28.5 feet (since 28.5 <= 30.0)
    * Item 3: `owner.id: "CHARTER"`, `clientItem.usageGroups: ["COMMUNICATION_BUNDLE"]`, `attachmentHeight.value: 7.62` (approx 25.0 feet).
        * *Result for proposed:* CHARTER at 25.0 feet (since 25.0 <= 30.0)

**III. Compiling the List of All Different Owner Names (Neutral and Below):**

1.  **Collect Data:** For each pole, apply the methods above to get lists of (Owner, Height) pairs for both existing (Katapult) and proposed (SPIDAcalc) attachments that are at or below the respective neutral wire heights.
2.  **Extract Owners:** From these lists, extract all the owner names/IDs.
3.  **Unique List:** Create a combined, unique set of these owner names. This will give you all different owners who have attachments at or below the neutral height, considering both existing and proposed configurations as found in the respective files.

By following these steps for each file, you can differentiate between the existing measured setup and the proposed recommended design, extracting the requested owner names and their attachment heights relative to the neutral wire. Remember to handle height conversions (meters to feet for SPIDAcalc, ft-in to decimal feet for Katapult) consistently.