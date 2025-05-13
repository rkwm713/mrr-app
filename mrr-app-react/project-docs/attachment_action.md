Okay, let's break down how to determine the "(I)nstalling" or "(E)xisting" status for a Charter/Spectrum attachment on a pole using the logic you've provided, with actual snippets from your `CPS_6457E_03_SPIDAcalc.json` file.

First, it's crucial to identify "Charter/Spectrum" attachments. In your SPIDAcalc JSON, "Charter" is listed as an owner:
`project.clientData.owners` (contains `{"industry": "COMMUNICATION", "id": "Charter"}`)

We'll need to check for wires or equipment owned by "Charter" in both the "Measured Design" and "Recommended Design" layers for a specific pole.

Let's use **Pole "1-PL410620"** (`project.leads[0].locations[0]`) as our example.

**Logic Point 1: If Charter/Spectrum is not on the pole in the measured layer, then it would be (I)nstalling.**
(This implies we are checking if a *new* Charter/Spectrum attachment appears in the "Recommended Design" that wasn't in the "Measured Design".)

* **Step 1: Check for Charter/Spectrum attachments in the "Measured Design" for pole "1-PL410620".**
    * **Standard Path to Wires in Measured Design**: `project.leads[*].locations[*].designs[?(@.layerType=="Measured")].structure.wires[*]`
    * **Example Path Snippet (Pole "1-PL410620", Measured Design Wires):**
        ```json
        // From project.leads[0].locations[0].designs[0].structure (assuming designs[0] is "Measured Design")
        "wires": [
          {
            "id": "Wire#1",
            "owner": { "industry": "UTILITY", "id": "CPS Energy" }
            // ... other wire properties
          },
          // ... other wires up to Wire#9, none owned by "Charter" in this snippet
          {
            "id": "Wire#5",
            "owner": { "industry": "COMMUNICATION", "id": "CPS Communications" },
            "attachmentHeight": { "unit": "METRE", "value": 8.534400000000002 }
          },
          {
            "id": "Wire#6",
            "owner": { "industry": "COMMUNICATION", "id": "AT&T" },
            "attachmentHeight": { "unit": "METRE", "value": 7.188200000000001 }
          }
          // ...
        ],
        "equipments": [] // Assuming no Charter equipment in measured design for simplicity here
        ```
    * **Analysis**: In the "Measured Design" for pole "1-PL410620", by iterating through the `wires` array and checking `owner.id`, we do **not** find any existing attachments explicitly owned by "Charter". (Note: The provided snippet shows "CPS Communications" and "AT&T", not "Charter". A full search of the actual file's measured design for this pole would be needed to be certain.)

* **Step 2: Check if a new Charter/Spectrum attachment is in the "Recommended Design" for pole "1-PL410620".**
    * **Standard Path to Wires in Recommended Design**: `project.leads[*].locations[*].designs[?(@.layerType=="Recommended")].structure.wires[*]`
    * **Example Path Snippet (Pole "1-PL410620", Recommended Design Wires):**
        ```json
        // From project.leads[0].locations[0].designs[1].structure (assuming designs[1] is "Recommended Design")
        "wires": [
          // ... other existing wires carried over from Measured to Recommended ...
          {
            "id": "Wire#18", // This is a new wire in the Recommended design
            "owner": {
              "industry": "COMMUNICATION",
              "id": "Charter" // Charter is the owner
            },
            "attachmentHeight": {
              "unit": "METRE",
              "value": 7.493000000000001
            },
            "usageGroup": "COMMUNICATION_BUNDLE"
            // ...
          }
        ],
        "equipments": [
           {
            "id": "Equip#Riser1",
            "owner": {
              "industry": "COMMUNICATION",
              "id": "Charter"
            },
            "clientItem": {
              "type": "RISER",
              "size": "2 PVC"
            },
            "attachmentHeight":{"unit":"METRE","value":6.502400000000001}
           }
        ]
        ```
    * **Analysis**: In the "Recommended Design" for pole "1-PL410620", we find `Wire#18` and `Equip#Riser1` owned by "Charter".

* **Conclusion for Logic Point 1 (for Pole "1-PL410620")**: Since "Charter" attachments (e.g., `Wire#18`) appear in the "Recommended Design" and were *not* found in the "Measured Design" (based on the snippet and assumption), this would be considered **(I)nstalling**.

**Logic Point 2: If Charter/Spectrum is on the pole and a new Charter/Spectrum attachment then it would be (I)nstalling.**
This is largely covered by the above. If Charter had an existing wire and then *another new* wire was added in the recommended design, the action for that *new* wire would be "Installing". The report is pole-centric but focuses on *actions*. If the primary action is a new installation, it's "I".

**Logic Point 3: If Charter/Spectrum is on the pole (in Measured) and we are not installing a new line (in Recommended) then it would be (E)xisting.**
(This implies Charter/Spectrum was in the "Measured Design" and is still present in the "Recommended Design" with the same properties, or no new Charter/Spectrum lines are being added.)

Let's consider a hypothetical scenario for a *different pole*, say "Pole X", as "1-PL410620" already fits "Installing".

* **Scenario for "Pole X":**
    * **Step 1: Check for Charter/Spectrum attachments in the "Measured Design" for "Pole X".**
        * Assume we find:
            ```json
            // In Measured Design for "Pole X"
            // ...
            "wires": [
              {
                "id": "Wire#C1",
                "owner": { "industry": "COMMUNICATION", "id": "Charter" },
                "attachmentHeight": { "unit": "METRE", "value": 7.0 }
                // ... other properties
              }
            ]
            // ...
            ```
        * **Analysis**: "Charter" is present in the Measured Design.

    * **Step 2: Check for Charter/Spectrum attachments in the "Recommended Design" for "Pole X".**
        * **Option A (Truly Existing - No Change):** Assume the "Recommended Design" contains the exact same Charter wire with the same properties:
            ```json
            // In Recommended Design for "Pole X"
            // ...
            "wires": [
              {
                "id": "Wire#C1", // Same ID or correlated wire
                "owner": { "industry": "COMMUNICATION", "id": "Charter" },
                "attachmentHeight": { "unit": "METRE", "value": 7.0 } // Same height
                // ... other properties are the same
              }
              // AND no other *new* wires owned by Charter are added.
            ]
            // ...
            ```
            * **Conclusion for Option A**: This would be **(E)xisting**.

        * **Option B (Still Existing, even if other non-Charter work happens):** Assume the "Recommended Design" still contains Charter's attachment (perhaps with minor, non-relocation changes as per your original more detailed logic for 'E'), AND no *new* Charter/Spectrum lines are being added.
            * **Conclusion for Option B**: If Charter is present in Measured, and no *new* Charter lines are added in Recommended, and no *relocation* of existing Charter lines occurs, it would be **(E)xisting** for Charter's attachment.

**Summary of how to find the data for this logic in SPIDAcalc JSON:**

1.  **Identify the Target Pole**: Loop through `project.leads[*].locations[*]`. The `label` (e.g., "1-PL410620") is your pole identifier.
2.  **Access Designs**: For the current pole (location), access its `designs` array. You'll need to identify which design object is "Measured" and which is "Recommended" by checking the `layerType` property.
    * `locations[X].designs[Y].layerType == "Measured"`
    * `locations[X].designs[Z].layerType == "Recommended"`
3.  **Check Wires/Equipment in Measured Design**:
    * Iterate through `locations[X].designs[Y].structure.wires[*]` and `locations[X].designs[Y].structure.equipments[*]`.
    * For each wire/equipment, check `owner.id`. If it matches "Charter" (or "CHARTER", "Spectrum" etc.), then Charter/Spectrum is on the pole in the measured layer. Keep a list or flag for these existing Charter attachments.
4.  **Check Wires/Equipment in Recommended Design**:
    * Iterate through `locations[X].designs[Z].structure.wires[*]` and `locations[X].designs[Z].structure.equipments[*]`.
    * For each wire/equipment owned by "Charter":
        * Determine if it's a *new* attachment (e.g., by checking if an item with a similar ID or characteristics existed in the list of Charter attachments from the Measured Design).
        * If it's new, then the action is **(I)nstalling**.
        * If it's an existing attachment (found in Measured), compare its properties (like `attachmentHeight`) between Measured and Recommended to check for relocations (which would be 'R' based on your original prompt, though your simplified logic here doesn't explicitly cover 'R').

Based on *your simplified logic*:

* To determine **(I)nstalling**:
    * **Path for Measured Wires**: `project.leads[L_idx].locations[LOC_idx].designs[M_idx].structure.wires[*].owner.id`
    * **Path for Recommended Wires**: `project.leads[L_idx].locations[LOC_idx].designs[R_idx].structure.wires[*].owner.id`
    * **Logic**:
        1.  Search for "Charter" in `owner.id` of wires/equipment in the Measured Design for the current pole.
        2.  Search for "Charter" in `owner.id` of wires/equipment in the Recommended Design for the current pole.
        3.  If not found in Measured OR if new "Charter" items are found in Recommended that were not in Measured, it's **(I)nstalling**.

* To determine **(E)xisting**:
    * **Logic**: If "Charter" items are found in the Measured Design, AND no *new* "Charter" items are found in the Recommended Design (that weren't in Measured), it's **(E)xisting**.

This requires comparing the set of Charter attachments in the Measured layer versus the Recommended layer for each pole.
The "Remove" status would be if a Charter attachment is in Measured but not in Recommended. Your simplified logic doesn't explicitly ask for "Remove", but the initial prompt did.