To find the height of the lowest CPS Electrical wire in the existing mid-span data, you will primarily use the **`CPS_6457E_03_Katapult.json`** file. This file contains the actual field-collected measurements.

The `CPS_6457E_03_SPIDAcalc.json` file, while containing information about electrical wires, typically stores *calculated* values based on a model for analysis purposes, rather than direct *measured existing* mid-span heights.

Here's how to find the information in the Katapult file:

**In `CPS_6457E_03_Katapult.json`:**

1.  **Navigate to Mid-span Sections:**

      * Go to the `connections` object. Each key under `connections` is a unique `connection_id` representing a span between two nodes (poles or other points).
      * Within each specific `connection` object (e.g., `connections["-OJ_PU-ftGPy7TovEc5a"]`), navigate to its `sections` object.
      * A `section` within this object (e.g., `sections["-OJj4T5K3z3UV0YPI68v"]`) can represent a mid-span measurement point. You can identify these mid-span sections by:
          * Checking if the `photos` associated with a `section` (found under `connections[connection_id].sections[section_id].photos`) have a corresponding entry in the `photo_summary` object where the photo ID has the attribute `height: true`. This indicates a height measurement photo was taken at that section. For example, for section `"-OJj4T5K3z3UV0YPI68v"`, the photo `photo_summary["02303762-d0ad-468d-a957-23dc103c4099"]` has `height: true`.
          * Alternatively, examining the `annotations` within a `section` for height measurements that are not pole attachments (e.g., annotation `type` might be "midspan\_attachment").

2.  **Identify CPS Electrical Wires and Their Heights:**

      * For each identified mid-span `section`, look into its `annotations` object. Each key under `annotations` is an `annotation_id` representing a measured wire or cable at that mid-span point.
      * For each `annotation` object, check its `attributes` to confirm it's a CPS Electrical wire:
          * **Owner:** Look for `attributes.owner_name.one` or `attributes.owner_name.multi_added` being "CPS Energy" (or variations like "CPS").
          * **Wire Type:** Check `attributes.equipment_type.button_added` or `attributes.conductor_type.button_added` for electrical types such as "Primary", "Secondary", "Neutral", or "Service Drop" (if it's an electrical service).
      * Once a CPS Electrical wire is identified, get its measured height. This is usually found in fields like:
          * `measured_height_ft`: A string value like "28'-9"". You'll need to convert this to decimal feet (e.g., 28.75 feet).
          * `height_ft_decimal`: A numerical value directly in decimal feet (e.g., 28.75). This is preferred if available.
          * Sometimes, notes like those in `connections["-OJif9TaTKzDx4iAqQeV"].sections["-OJt1tLn65I6PCgLr-xf"].multi_attributes.note["-OL-NT3rkwEDXrPEvVnn"]` mention "Hot stick measurements" like "primary 38:2" and "neutral 28:9", which are direct height readings (38 feet 2 inches, and 28 feet 9 inches respectively).

3.  **Determine the Lowest CPS Electrical Wire Height:**

      * Collect all the height values for all identified existing CPS Electrical wires from all relevant mid-span `sections`.
      * Ensure all heights are converted to a consistent numerical format (e.g., decimal feet).
      * The minimum of these numerical height values will be the height of the lowest CPS Electrical wire in the existing mid-span data.

**Example Snippet from `CPS_6457E_03_Katapult.json` for a mid-span section with height notes:**

For connection `-OJif9TaTKzDx4iAqQeV`, section `-OJt1tLn65I6PCgLr-xf` contains a note under `multi_attributes`:

```json
{
  "note": {
    "-OL-NT3rkwEDXrPEvVnn": "Hot stick measurements:\nprimary 38:2\nneutral 28:9"
  }
}
```

Assuming these "primary" and "neutral" wires are CPS Electrical (which would be confirmed by checking their `owner_name` attribute within their respective full annotations if available elsewhere for these traces, or by project context), the heights are:

  * Primary: 38 feet 2 inches (38.17 feet)
  * Neutral: 28 feet 9 inches (28.75 feet)

In this specific example, the lowest CPS Electrical wire would be the neutral at 28.75 feet. You would need to perform this check across all relevant mid-span sections and their annotations to find the overall lowest value.

**Regarding `CPS_6457E_03_SPIDAcalc.json`:**

This file contains modeled data. To find *calculated* mid-span clearances for existing CPS Electrical wires in a modeled scenario (not raw field measurements):

1.  Navigate to `leads[index].locations[index].designs`.
2.  Find the design object where `label == "Measured Design"`.
3.  Within this design, go to `structure.spanWires`.
4.  Identify `spanWires` where `owner.id` is "CPS ENERGY" (or equivalent) and `clientItem.usageGroups` includes electrical types like "PRIMARY", "SECONDARY", "NEUTRAL".
5.  The file provides data like sag (e.g., `sagAtMax.value`) and attachment heights, from which clearances are calculated by the analysis software for specific conditions. It doesn't directly store the *lowest measured existing mid-span height*.

For "Existing Mid-Span Data" as per your request, the **`CPS_6457E_03_Katapult.json`** is the file to analyze.