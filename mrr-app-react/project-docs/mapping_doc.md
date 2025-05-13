# Make-Ready Report Generator Mapping/Sources

## Column A: Operation Number

*   **Primary Source(s):** External / Manual
*   **SPIDAcalc Data Extraction:** N/A
*   **Katapult Data Extraction:** N/A
*   **Derivation/Calculation Logic:** As per your mapping document, this field is assumed to be manually generated or come from an external work management system. It will not be sourced from the provided SPIDAcalc or Katapult JSONs.
*   **Handling Missing Data:** Leave blank or use a placeholder if not provided externally.

## Column B: Attachment Action (Installing / Transfer / E Joining)

*   **Primary Source(s):** SPIDAcalc (for design comparisons), Katapult (for explicit proposed/moved items). The target is Charter/Spectrum's primary proposed attachment/action for the pole.
*   **Logic Overview:** This is complex and depends on how "Install," "Transfer/Relocate," and "Existing/Joining" are defined for Charter/Spectrum's attachment.
    1.  **Identify Charter/Spectrum's Target Attachment/Action:**
        *   **Katapult:**
            *   Look in `katapult_data.traces.trace_data` for entries where `[trace_id].proposed === true` AND `[trace_id].company` matches Charter/Spectrum.
            *   Alternatively, look in `nodes.[node_id].photos.[photo_uuid].photofirst_data.wire.[wire_id]` (or similar for equipment) for items that belong to Charter/Spectrum AND have a non-zero `mr_move` value.
        *   **SPIDAcalc:**
            *   Compare the "Measured Design" (`layerType=="Measured"`) with the "Recommended Design" (`layerType=="Recommended"`) for the current `project.leads[*].locations[*].designs[*]`.
            *   An "Install" might be an item (wire/equipment owned by Charter/Spectrum) present in "Recommended" but not "Measured."
            *   A "Transfer/Relocate" might be an item owned by Charter/Spectrum present in both, but with differing `attachmentHeight` or other key properties.
*   **Determine Action:**
    *   **"I" (Install):**
        *   If a Katapult trace for Charter/Spectrum is found with `proposed: true`.
        *   OR, if a SPIDAcalc item (wire/equipment) for Charter/Spectrum exists *only* in the "Recommended Design" and not in the "Measured Design."
    *   **"R" (Transfer/Relocate/Replace):**
        *   If a Katapult `photofirst_data.wire.[wire_id].mr_move` (or equivalent for equipment) has a non-zero value for Charter/Spectrum's attachment.
        *   OR, in SPIDAcalc, if an attachment for Charter/Spectrum exists in *both* "Measured Design" and "Recommended Design," but its `attachmentHeight` (or other critical properties like `clientItem.id` if a full replacement) differs.
    *   **"E" (Existing - No Change / Joining):**
        *   If an attachment for Charter/Spectrum exists in SPIDAcalc "Measured Design" AND/OR Katapult (not marked proposed or with `mr_move`) AND it also exists in SPIDAcalc "Recommended Design" with the *same critical properties* (e.g., height, type).
        *   "E Joining" implies your attachment is co-existing with others without needing to move due to *your* new attachment. This is the default if no "I" or "R" action is identified for Charter/Spectrum.
    *   **"Remove":**
        *   If an attachment for Charter/Spectrum exists in SPIDAcalc "Measured Design" (or Katapult as existing) but is *absent* from SPIDAcalc "Recommended Design" (or marked for removal in Katapult if such a flag exists).
*   **SPIDAcalc Data Extraction for Comparison:**
    *   `project.leads[*].locations[*].designs[*]` (array). Compare items in the design object where `layerType=="Measured"` vs. `layerType=="Recommended"`.
    *   Identify items by `owner.id` or `clientItem` properties matching Charter/Spectrum.
*   **Katapult Data Extraction for Proposed/Moved:**
    *   `katapult_data.traces.trace_data.[trace_id].proposed`
    *   `katapult_data.traces.trace_data.[trace_id].company`
    *   `katapult_data.nodes.[node_id].photos.[photo_uuid].photofirst_data.wire.[wire_id].mr_move`
    *   Check `katapult_data.nodes.[node_id].attributes` for any custom status fields indicating actions.
*   **Handling Missing Data:** If no specific action is identified for your target attachment, this might default to "E" or "N/A." Clarify the default.

## Column C: Pole Owner

*   **Primary Source(s):** SPIDAcalc, then Katapult.
*   **SPIDAcalc Data Extraction:**
    *   Path: `project.leads[*].locations[*].designs[?(@.layerType=="Measured")].structure.pole.owner.id`
    *   Logic: Extract the id string (e.g., "CPS Energy"). Assume "Measured" design reflects current ownership.
*   **Katapult Data Extraction (if not in SPIDA):**
    *   Path: `katapult_data.nodes.[node_id].attributes.pole_owner.multi_added` (this specific path needs verification with your Katapult JSON structure; it might be a direct key like `attributes.pole_owner_name` or `attributes.pole_owner.-Imported.one`).
    *   Logic: Extract the owner's name.
*   **Derivation/Calculation Logic:** Prefer SPIDAcalc if available.
*   **Handling Missing Data:** "Unknown" or leave blank.

## Column D: Pole #

*   **Primary Source(s):** SPIDAcalc, then Katapult (correlate using the established Pole Correlation Key).
*   **SPIDAcalc Data Extraction:**
    *   Primary Path: `project.leads[*].locations[*].label` (this is often the primary pole identifier).
    *   Secondary Path: `project.leads[*].locations[*].designs[?(@.layerType=="Measured")].structure.pole.clientItemAlias` (if `label` is not the pole number).
    *   Tertiary Path: Iterate `project.leads[*].locations[*].poleTags[*]`. Look for an object where a specific key (e.g., `tag_number`, `name`, or `value` if `poleTags` is an array of simple key-value pairs) represents the pole number. The exact structure of `poleTags` needs to be confirmed from your SPIDAcalc JSON sample.
*   **Katapult Data Extraction (if not in SPIDA or for correlation):**
    *   Path 1: `katapult_data.nodes.[node_id].attributes.PoleNumber.-Imported`
    *   Path 2: `katapult_data.nodes.[node_id].attributes.electric_pole_tag.assessment`
    *   Path 3: `katapult_data.nodes.[node_id].attributes.DLOC_number.-Imported`
    *   Check other custom attributes under `nodes.[node_id].attributes` that might store pole numbers.
*   **Derivation/Calculation Logic:** Use the value from SPIDAcalc `loc.label` as the primary. If matching/correlating, ensure the same field used for the Pole Correlation step is prioritized.
*   **Handling Missing Data:** "Unknown" or leave blank.

## Column E: Pole Structure (Species & Class)

*   **Primary Source(s):** SPIDAcalc, then Katapult.
*   **SPIDAcalc Data Extraction:**
    1.  Get the `clientItem.id` or `clientItemVersion` of the pole from `project.leads[*].locations[*].designs[?(@.layerType=="Measured")].structure.pole.clientItem.id` (or `.clientItemVersion`).
    2.  This `id` (or `version`) is a reference to an entry in `spida_data.clientData.poles`. You'll need to lookup the pole definition in `spida_data.clientData.poles` where `pole_definition.aliases[*].id` (or a main ID field if not using aliases for primary ID) matches the `pole_ref_id`.
    3.  Once the matching pole definition is found (e.g., at `spida_data.clientData.poles[pole_index]`), extract:
        *   `spida_data.clientData.poles[pole_index].species`
        *   `spida_data.clientData.poles[pole_index].classOfPole`
*   **Katapult Data Extraction (if not in SPIDA):**
    *   Path: `katapult_data.nodes.[node_id].attributes`. Look for keys like `pole_species`, `pole_class`.
    *   It might also be nested, e.g., under `birthmark_brand.[some_id].pole_species` (Katapult's `photofirst_data.birthmark` doesn't show these fields in the provided schema, so these are likely custom attributes if present in Katapult).
*   **Derivation/Calculation Logic:** Concatenate: `[Species]` + " " + `[Class]`. Prefer SPIDAcalc data.
*   **Handling Missing Data:** Leave parts blank if one is missing (e.g., "Southern Pine " or " 3"). If both missing, "Unknown."

## Column F: Proposed Riser (Yes/No) & Proposed Guy (Yes/No) & PLA (%) with proposed attachment

### F1: Proposed Riser (Yes/No):

*   **Primary Source(s):** SPIDAcalc ("Recommended Design"), Katapult (proposed traces/attributes).
*   **SPIDAcalc Data Extraction:**
    1.  Iterate through `project.leads[*].locations[*].designs[?(@.layerType=="Recommended")].structure.equipments`.
    2.  For each equipment, get its `clientItem.id` (or `clientItemVersion`).
    3.  Lookup this `equipment_ref_id` in `spida_data.clientData.equipments`.
    4.  Check if `equipment_definition.type.name === "RISER"`.
    5.  If found, output "YES".
*   **Katapult Data Extraction:**
    *   Path 1: Check `katapult_data.nodes.[node_id].attributes.riser.button_added`. If value indicates "Yes" or true (verify exact key and value for "riser" and "button_added").
    *   Path 2: Iterate `katapult_data.traces.trace_data`. Look for a trace associated with the current `node_id` where `trace.proposed === true` AND `trace._trace_type === "equipment"` AND (`trace.label` or `trace.cable_type` indicates "Riser").
*   **Derivation/Calculation Logic:** If either system indicates a proposed riser, output "YES". Otherwise "NO". Prioritize Katapult if it's the source of truth for newly proposed items not yet in SPIDA's recommended design.
*   **Handling Missing Data:** Default to "NO".

### F2: Proposed Guy (Yes/No):

*   **Primary Source(s):** SPIDAcalc ("Recommended Design"), Katapult (proposed traces/connections).
*   **SPIDAcalc Data Extraction:**
    1.  Check if `project.leads[*].locations[*].designs[?(@.layerType=="Recommended")].structure.guys` array is non-empty.
    2.  OR check `project.leads[*].locations[*].designs[?(@.layerType=="Recommended")].structure.spanGuys` array if relevant to your definition of "proposed guy."
    3.  If any proposed guys exist, output "YES".
*   **Katapult Data Extraction:**
    *   Path 1: Iterate `katapult_data.traces.trace_data`. Look for a trace associated with the current `node_id` where `trace.proposed === true` AND (`trace._trace_type === "down_guy"` OR `trace._trace_type === "anchor"`).
    *   Path 2: Iterate `katapult_data.connections`. Look for connections where `connection.node_id_1` (or `node_id_2`) `=== current_node_id`, AND `connection.button` is `"down_guy"` or `"anchor"`.
        *   Katapult connections schema doesn't show a direct "proposed" flag. This might be inferred if the *connected trace* is proposed, or via a custom attribute on the connection object within `connection.attributes`.
*   **Derivation/Calculation Logic:** If either system indicates a proposed guy, output "YES". Otherwise "NO".
*   **Handling Missing Data:** Default to "NO".

### F3: PLA (%) with proposed attachment:

*   **Primary Source(s):** SPIDAcalc ("Recommended Design").
*   **SPIDAcalc Data Extraction:**
    *   Path (Direct): `project.leads[*].locations[*].designs[?(@.layerType=="Recommended")].structure.pole.stressRatio`. Multiply by 100.
    *   Path (From Analysis Results): Iterate `project.leads[*].locations[*].designs[?(@.layerType=="Recommended")].analysis[*]`. Find the relevant analysis case (e.g., the governing load case, often named "NESC" or similar). Within its `results` array, filter for an object where `component` is the pole's ID (or a general pole stress result like "Pole") AND `unit === "PERCENT"`. The actual value would be the PLA.
*   **Katapult Data Extraction:** N/A for direct calculation. Katapult *may* store a pre-calculated PLA value in `nodes.[node_id].attributes` (e.g., a custom field like `final_passing_capacity_%` or `proposed_pla_%`).
*   **Derivation/Calculation Logic:** Primarily from SPIDAcalc's "Recommended Design." If using `stressRatio`, ensure it represents the overall pole loading percentage *after* proposed attachments are considered.
*   **Handling Missing Data:** "--" or "Not Calculated." (Your note about Katapult not calculating combined PLA is correct; it would come from SPIDA or be manually calculated).

## Column G: Construction Grade of Analysis

*   **Primary Source(s):** SPIDAcalc.
*   **SPIDAcalc Data Extraction:**
    *   Path: `project.leads[*].locations[*].designs[?(@.layerType=="Recommended")].analysis[relevant_analysis_index].analysisCaseDetails.constructionGrade`.
    *   Logic: You need to select the `relevant_analysis_index` (e.g., the governing load case for the "Recommended Design").
*   **Katapult Data Extraction:** N/A.
*   **Derivation/Calculation Logic:** Direct extraction from SPIDAcalc.
*   **Handling Missing Data:** "--" or "Not Specified." (Your note "not in Katapult" is correct).

## Columns H, I, J: Existing Mid-Span Data
(These refer to the *lowest* of such attachments on the span connected to the current pole).

### Column H: Height Lowest Com (Existing)

*   **Primary Source(s):** SPIDAcalc ("Measured Design"), then Katapult.
*   **SPIDAcalc Data Extraction:**
    1.  Initialize `min_comm_height = infinity`.
    2.  Iterate `project.leads[*].locations[*].designs[?(@.layerType=="Measured")].structure.wires`.
    3.  For each wire, get its `clientItem.id` (or `clientItemVersion`) and look up the definition in `spida_data.clientData.wires`.
    4.  Check if `wire_definition.usageGroups` array contains "COMMUNICATION" or "COMMUNICATION_BUNDLE".
    5.  If yes, `current_height = wire.midspanHeight.value` (or `wire.midspanHeight` if it's a direct numeric value in the instance; the SPIDA schema for `wireEndPoints.wires` shows `midspanHeight` as an object with unit and value, but the example in `clientData.poles.wires` shows it directly. Clarify from your actual `structure.wires` instances. The schema for `structure.wires` (page 10) suggests it's direct on the wire instance if populated).
    6.  Convert `current_height` (likely METRE) to FEET (1 METRE = 3.28084 FEET).
    7.  `min_comm_height = min(min_comm_height, current_height_feet)`.
    8.  The final `min_comm_height` is your value.
*   **Katapult Data Extraction (if SPIDA data is unavailable/incomplete):**
    1.  Initialize `min_comm_height_katapult = infinity`.
    2.  Identify communication traces: Iterate `katapult_data.traces.trace_data`. Filter for traces where `trace.company` is a known comms company OR `trace.cable_type` indicates communication (e.g., "Fiber", "Coax", "Telephone") AND `trace.proposed !== true` (for existing).
    3.  For each such trace, find its corresponding measured mid-span height. This is the challenging part with Katapult's structure for mid-spans:
        *   **Option A (Midspan object in `photofirst_data`):** `nodes.[node_id].photos.[photo_uuid].photofirst_data.midspanHeight.[measurement_id]`. The schema shows `midspanHeight` keyed by a unique ID, with `_routine_instance_id` and `over` (String) (surface type). It doesn't explicitly link this measurement to a specific trace/wire ID in the provided schema. This link would need to be inferred or exist in a way not detailed.
        *   **Option B (Wire height at section - if midspans are modeled as sections of a connection):** If your connections have sections that represent mid-span points, you might find `photofirst_data.wire.[wire_id]._measured_height` within that section's photo data. This requires linking traces to `photofirst_data.wire` IDs.
        *   **Option C (Attachment height at node - as a fallback):** `nodes.[node_id].photos.[photo_uuid].photofirst_data.wire.[wire_id]._measured_height`. This is typically pole attachment height, *not* mid-span. Use with extreme caution if true mid-span data is unavailable.
    4.  Convert Katapult's `_measured_height` (likely in feet/inches string like "6' 7"" or just inches) to a consistent numerical unit (e.g., decimal feet).
    5.  `min_comm_height_katapult = min(min_comm_height_katapult, converted_katapult_height)`.
*   **Derivation/Calculation Logic:** Prefer SPIDAcalc `midspanHeight` if available and accurate for existing comms. If using Katapult, be very cautious about whether the height is true mid-span or pole attachment. Perform unit conversions.
*   **Handling Missing Data:** "--" or "N/A."

### Column I: Height Lowest CPS Electrical (Existing)

*   **Primary Source(s):** SPIDAcalc ("Measured Design"), then Katapult.
*   **SPIDAcalc Data Extraction:** Similar logic to "Height Lowest Com (Existing)":
    1.  Initialize `min_elec_height = infinity`.
    2.  Iterate `project.leads[*].locations[*].designs[?(@.layerType=="Measured")].structure.wires`.
    3.  Lookup `wire_definition.usageGroups` for "PRIMARY", "SECONDARY", "NEUTRAL", "UTILITY_SERVICE".
    4.  If electrical, `current_height = wire.midspanHeight.value` (or direct value).
    5.  Convert METRE to FEET.
    6.  `min_elec_height = min(min_elec_height, current_height_feet)`.
*   **Katapult Data Extraction:** Similar logic to Katapult for "Height Lowest Com (Existing)":
    1.  Identify electrical traces (e.g., `trace.company === "CPS ENERGY"` or `trace.cable_type` like "Primary," "Secondary," "Neutral") AND `trace.proposed !== true`.
    2.  Find corresponding `_measured_height` from `photofirst_data` (midspan or attachment, as per H).
    3.  Convert units.
*   **Derivation/Calculation Logic:** Prefer SPIDAcalc. Convert units.
*   **Handling Missing Data:** "—" or "N/A."

### Column J: From Pole / To Pole (related to mid-span data)

*   **Logic:** This column is about the span itself where the lowest height (from H or I) was found.
    *   **"From Pole":** This would be the current SPIDAcalc pole identifier (`project.leads[*].locations[*].label`).
    *   **"To Pole":** This requires identifying the pole at the other end of the span.
        *   In SPIDAcalc `structure.wireEndPoints[*].type` can be "OTHER_POLE", "PREVIOUS_POLE", etc. The `connectionId` might link back to a top-level connection, or the `externalId` might be usable if it's a known pole ID. However, directly getting the `label` of the "To Pole" from within the current pole's structure is not straightforward from the schema.
        *   You might need to iterate through all `project.leads[*].locations` and find the one whose `geographicCoordinate` and connectivity implies it's the other end of the relevant span.
        *   Alternatively, if Katapult connection data is more explicit (`connections.[conn_id].node_id_1` and `node_id_2`), you could use that to find the Katapult node ID of the "To Pole" and then map it back to its SPIDAcalc label (if such a mapping exists).
*   **Recommendation:** This needs clarification. A simpler approach might be to list the current pole as "Pole A" and the connected span's bearing/direction if the actual "To Pole" ID is too complex to retrieve reliably for every case. If the lowest height was found on span X, you need to identify both poles for span X.

## Columns K, L, M, N, O: Make Ready Data
(These columns refer to the *specific attachment being actioned* as determined in Column B, assumed to be Charter/Spectrum's primary proposed attachment/action for this pole-centric row).

### Column K: Attacher Description

*   **Primary Source(s):** Katapult (if new proposed/actioned item from field), SPIDAcalc (if existing item being modified in design).
*   **Katapult Data Extraction (if this is a *newly proposed* attachment primarily defined in Katapult):**
    1.  Identify the *target proposed trace* for Charter/Spectrum (e.g., `trace.proposed === true` AND `trace.company` matches Charter/Spectrum).
    2.  Path: `katapult_data.traces.trace_data.[target_proposed_trace_id].label` OR `katapult_data.traces.trace_data.[target_proposed_trace_id].cable_type`.
*   **SPIDAcalc Data Extraction (if this is an *existing attachment being modified*, and the "Recommended Design" shows the change):**
    1.  Identify the *target wire/equipment* for Charter/Spectrum in the "Recommended Design."
    2.  For wire: `project.leads[*].locations[*].designs[?(@.layerType=="Recommended")].structure.wires[target_wire_index].clientItem` (then lookup description in `spida_data.clientData.wires` based on this reference).
    3.  For equipment: `project.leads[*].locations[*].designs[?(@.layerType=="Recommended")].structure.equipments[target_eq_index].clientItem` (then lookup `type.name` or `alias` in `spida_data.clientData.equipments`).
*   **Derivation/Calculation Logic:** Your note "(New field in your make-ready JSON)" suggests this might be a newly defined description for the report. If the actioned item is from Katapult's proposed data, use Katapult paths. If it's an existing SPIDA item being modified as per "Recommended Design", use SPIDA paths.
*   **Handling Missing Data:** Blank or "N/A."

### Column L: Attachment Height - Existing (at the pole)

*   **Primary Source(s):** SPIDAcalc ("Measured Design"), Katapult. This is for the *specific attachment being actioned*.
*   **SPIDAcalc Data Extraction:**
    1.  Identify the target wire/equipment (as defined in Column K, but from the "Measured Design") in `project.leads[*].locations[*].designs[?(@.layerType=="Measured")].structure.wires` or `.equipments`.
    2.  Path: `target_wire.attachmentHeight.value` or `target_equipment.attachmentHeight.value`. (Units: METRE, convert to FEET).
*   **Katapult Data Extraction:**
    1.  Identify the *existing* target wire/equipment trace (ensure `trace.proposed !== true` or not subject to `mr_move` if that's the actioned item).
    2.  Path: `katapult_data.nodes.[node_id].photos.[photo_uuid].photofirst_data.wire.[wire_id]._measured_height` (or similar for equipment like `photofirst_data.equipment.[eq_id]._measured_height`). (Units: Imperial, convert if necessary).
*   **Derivation/Calculation Logic:** Use SPIDA if the item is modeled and measured there. Otherwise, use Katapult. This is for the attachment *at the pole*, not mid-span.
*   **Handling Missing Data:** "—" or "N/A."

### Column M: Attachment Height - Proposed (at the pole)

*   **Primary Source(s):** SPIDAcalc ("Recommended Design"), Katapult (derived from `mr_move` or specific proposed height attributes), or New Input if the design decision is external.
*   **SPIDAcalc Data Extraction:**
    1.  Identify the target wire/equipment in `project.leads[*].locations[*].designs[?(@.layerType=="Recommended")].structure.wires` or `.equipments`.
    2.  Path: `target_wire.attachmentHeight.value` or `target_equipment.attachmentHeight.value`. (Units: Metric, convert to FEET).
*   **Katapult Data Extraction:**
    1.  If `mr_move` exists for the target attachment (e.g., from `nodes.[node_id].photos.[photo_uuid].photofirst_data.wire.[wire_id].mr_move`):
        *   Get existing height (from Column L source).
        *   Proposed height = `existing_height + mr_move_value`. Ensure units are compatible before adding (Katapult `mr_move` is often in inches).
    2.  If it's a *newly proposed trace*: Katapult might have a specific attribute for its proposed height under `nodes.[node_id].attributes.[your_custom_proposed_height_attr]` or associated with the `trace_data` itself. This is not standard in the provided schema and would be a custom implementation.
*   **Derivation/Calculation Logic:** If "(New field in your make-ready JSON)" implies this is an externally decided height, it's manual. Otherwise:
    *   Use SPIDAcalc "Recommended Design" if the item and its proposed height are modeled there.
    *   Else, use Katapult derived height (from `mr_move` or a specific custom proposed height attribute).
*   **Handling Missing Data:** "--" or "N/A."

### Column N: Mid-Span (same span as existing) - Existing

*   **Logic:** This refers to the existing mid-span height of the *specific attacher* identified in Column K, on the primary span connected to the current pole.
*   **SPIDAcalc Data Extraction:**
    1.  Identify the target wire/equipment (for the attacher in Column K) in `project.leads[*].locations[*].designs[?(@.layerType=="Measured")].structure.wires` (or `.equipments` if it's equipment with midspan properties).
    2.  Extract `target_wire.midspanHeight.value` (or direct value as discussed for Column H). Convert METRE to FEET.
*   **Katapult Data Extraction:**
    1.  Identify the *existing trace* for the attacher in Column K.
    2.  Attempt to find its mid-span height using the Katapult logic from Column H (Option A, B, or C), being mindful of whether it's true mid-span or attachment height. Convert units.
*   **Handling Missing Data:** "—" or "N/A."

### Column O: Mid-Span (same span as existing) - Proposed

*   **Primary Source(s):** SPIDAcalc ("Recommended Design"), or "Calculated" as per your mapping doc.
*   **SPIDAcalc Data Extraction:**
    1.  Identify the target wire/equipment (for the attacher in Column K) in `project.leads[*].locations[*].designs[?(@.layerType=="Recommended")].structure.wires`.
    2.  Path: `target_wire.midspanHeight.value` (or direct value). (Units: Metric, convert to FEET).
*   **Katapult Data Extraction:**
    *   Katapult is unlikely to calculate this directly for a *proposed* state unless it's a manually entered attribute. Check `nodes.[node_id].attributes` for a custom field, or if a `photofirst_data.midspanHeight` point type exists that explicitly flags "proposed" (not standard in schema).
*   **Derivation/Calculation Logic (if "Calculated"):**
    *   Your note `makeReady.midSpanHeight = existing mid-span ± clearance change` implies an external calculation.
    *   Inputs needed:
        *   Existing mid-span height (from Column N).
        *   Span length (SPIDA: from `wireEndPoint` geometry; Katapult: from `connections.[conn_id].attributes.manually_override_connection_length` or calculated from node coordinates).
        *   Proposed attachment height at poles (from Column M for both ends of the span).
        *   Wire type/properties (from SPIDA `clientData.wires` or Katapult trace attributes).
    *   This is a complex sag/tension calculation. SPIDAcalc does this internally. Replicating it accurately externally is non-trivial and typically requires specialized sag/tension software or formulas (e.g., catenary equations).
    *   **Safest programmatic approach:** If the wire and its proposed changes (including new attachment heights at poles) are fully modeled in SPIDAcalc's "Recommended Design", pull the `midspanHeight` from there.
*   **Handling Missing Data:** "—" or "Not Calculated by SPIDA."