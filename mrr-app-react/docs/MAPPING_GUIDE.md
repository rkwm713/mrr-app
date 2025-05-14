# Data Mapping Guide

This document provides a concise overview of how data is mapped from SPIDAcalc and Katapult JSON structures to the Excel Make-Ready Report. It focuses on the essential mapping rules and extraction paths without excessive detail.

## Excel Report Structure

The Make-Ready Report contains the following columns:

| Column | Field                                 | Primary Source       | Notes                            |
|--------|---------------------------------------|----------------------|----------------------------------|
| A      | Operation Number                      | External/Manual      | Sequential numbering             |
| B      | Attachment Action                     | SPIDAcalc/Katapult   | Install/Transfer/Existing        |
| C      | Pole Owner                            | SPIDAcalc, Katapult  | Company owning the pole          |
| D      | Pole #                                | SPIDAcalc, Katapult  | Pole identifier                  |
| E      | Pole Structure                        | SPIDAcalc, Katapult  | Species & Class                  |
| F      | Proposed Riser/Guy/PLA%               | SPIDAcalc, Katapult  | Yes/No for riser/guy, % for PLA  |
| G      | Construction Grade                    | SPIDAcalc            | Construction grade used in analysis |
| H      | Height Lowest Com                     | SPIDAcalc, Katapult  | Existing lowest comm height      |
| I      | Height Lowest CPS Electrical          | SPIDAcalc, Katapult  | Existing lowest power height     |
| J      | From Pole / To Pole                   | SPIDAcalc, Katapult  | Span identifier                  |
| K      | Attacher Description                  | SPIDAcalc, Katapult  | Description of target attachment |
| L      | Attachment Height - Existing          | SPIDAcalc, Katapult  | Height at pole                   |
| M      | Attachment Height - Proposed          | SPIDAcalc, Katapult  | Height at pole                   |
| N      | Mid-Span - Existing                   | SPIDAcalc, Katapult  | Height at midspan                |
| O      | Mid-Span - Proposed                   | SPIDAcalc, Calculated| Height at midspan                |

## Key Mapping Rules

### Column B: Attachment Action

Determines the primary action for Charter/Spectrum's attachment (Install/Transfer/Existing).

**Decision Logic:**
- **"I" (Install):** 
  - SPIDAcalc: Item exists in "Recommended" design but not in "Measured" design
  - Katapult: Trace with `proposed: true` for Charter/Spectrum
- **"R" (Transfer/Relocate):** 
  - SPIDAcalc: Item exists in both designs but with different height/properties
  - Katapult: Has non-zero `mr_move` value
- **"E" (Existing - No Change):** 
  - Item exists in both designs with same properties or only in Measured design

**Data Paths:**
- SPIDAcalc: Compare objects in `designs[?(@.layerType=="Measured")]` vs `designs[?(@.layerType=="Recommended")]`
- Katapult: Check `traces.trace_data.[trace_id].proposed` and `nodes.[node_id].photos.[photo_uuid].photofirst_data.wire.[wire_id].mr_move`

### Column C: Pole Owner

**Data Paths:**
- SPIDAcalc: `project.leads[*].locations[*].designs[?(@.layerType=="Measured")].structure.pole.owner.id`
- Katapult: `nodes.[node_id].attributes.pole_owner.multi_added` or similar attribute

### Column D: Pole #

**Data Paths:**
- SPIDAcalc: Primary - `project.leads[*].locations[*].label`
- Katapult: 
  1. `nodes.[node_id].attributes.PoleNumber.-Imported`
  2. `nodes.[node_id].attributes.electric_pole_tag.assessment`
  3. `nodes.[node_id].attributes.DLOC_number.-Imported`

### Column E: Pole Structure

**Data Paths:**
- SPIDAcalc: 
  1. Get pole reference: `project.leads[*].locations[*].designs[*].structure.pole.clientItem.id`
  2. Lookup in `clientData.poles` to get `species` and `classOfPole`
- Katapult: 
  - `nodes.[node_id].attributes.pole_species` and `nodes.[node_id].attributes.pole_class`

### Column F Parts

#### F1: Proposed Riser (Yes/No)

**Data Paths:**
- SPIDAcalc: Check `designs[?(@.layerType=="Recommended")].structure.equipments[*]` for equipment with type "RISER"
- Katapult: Check `traces.trace_data` for proposed trace of type "equipment" with appropriate label

#### F2: Proposed Guy (Yes/No)

**Data Paths:**
- SPIDAcalc: Check for non-empty `designs[?(@.layerType=="Recommended")].structure.guys` array
- Katapult: Check `traces.trace_data` for proposed trace of type "down_guy" or "anchor"

#### F3: PLA (%) with proposed attachment

**Data Paths:**
- SPIDAcalc: `designs[?(@.layerType=="Recommended")].structure.pole.stressRatio` × 100
- Katapult: Usually not available (use SPIDAcalc value)

### Column G: Construction Grade

**Data Paths:**
- SPIDAcalc: `designs[?(@.layerType=="Recommended")].analysis[*].analysisCaseDetails.constructionGrade`
- Katapult: Not available

### Columns H & I: Lowest Heights

**Data Paths:**
- Find the lowest midspanHeight value among all wires of the appropriate type (communication or electrical)
- SPIDAcalc: Iterate through `designs[?(@.layerType=="Measured")].structure.wires[*].midspanHeight`
- Katapult: More complex, requires tracing from `photofirst_data.midspanHeight` measurements

### Columns K-O: Make Ready Data

These columns focus on the specific attachment being actioned (the Charter/Spectrum attachment identified in Column B).

**Key Paths:**
- Identify the target attachment from Column B decision
- For existing height:
  - SPIDAcalc: `designs[?(@.layerType=="Measured")].structure.wires[target_index].attachmentHeight`
  - Katapult: `nodes.[node_id].photos.[photo_uuid].photofirst_data.wire.[wire_id]._measured_height`
- For proposed height:
  - SPIDAcalc: `designs[?(@.layerType=="Recommended")].structure.wires[target_index].attachmentHeight`
  - Katapult: Calculate from existing + `mr_move`
- For midspan heights:
  - Similar to attachment heights but using `midspanHeight` property

## Data Extraction Best Practices

1. **Safe Navigation:**
   - Always use safe navigation patterns (e.g., optional chaining or the `getNestedValue` utility)
   - Provide appropriate default values for missing data

2. **Unit Conversions:**
   - Convert SPIDAcalc metric values (metres) to feet: `value * 3.28084`
   - Parse Katapult imperial strings (e.g., "25' 6"") to decimal feet

3. **Client Data References:**
   - For SPIDAcalc, references to client items must be resolved by looking up IDs in the `clientData` section
   - Example: To get wire properties, follow the reference from `structure.wires[*].clientItem.id` to `clientData.wires`

4. **Prioritization:**
   - When both systems have data, prefer SPIDAcalc for structural and analytical data
   - Prefer Katapult for field-measured data and proposed changes identified in the field

5. **Missing Data Handling:**
   - Use consistent placeholders: "N/A", "Unknown", or "--"
   - For Boolean values, default to "NO" when uncertain
