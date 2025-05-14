# Data Mapping Rules for Make-Ready Report Generator

## General Mapping Principles

- **Source Prioritization**
  - SPIDAcalc is primary source for structural and analytical data
  - Katapult is primary source for field measurements and proposed changes
  - When both sources have data, follow the prioritization in MAPPING_GUIDE.md

- **Data Extraction Strategy**
  - Use a layered extraction approach (try primary source, fall back to secondary)
  - Implement each field extraction in dedicated, testable functions
  - Follow the field implementation order in development-workflow.md

## SPIDAcalc Data Extraction

- **Design Types**
  - "Measured" design = current/existing state
  - "Recommended" design = proposed/future state
  - Always compare both designs to determine changes

- **Path Navigation**
  - Access poles through: `project.leads[*].locations[*]`
  - Access designs through: `locations[*].designs[*]`
  - Access structures through: `designs[*].structure`

- **Client Data References**
  - Resolve all `clientItem.id` references to actual definitions in `clientData`
  - Map component types based on usage groups and type names
  - Cache lookup results for repeated clientData references

## Katapult Data Extraction

- **Dynamic Keys**
  - Handle dynamic keys in attributes with flexible matching patterns
  - Properly resolve nested attributes with patterns like:
    - `-Imported` = original imported data
    - `assessment` = field-measured value
    - `one` = selected value among options
    - `button_added` = how data was entered

- **Trace & Node Navigation**
  - Access nodes through: `nodes.[node_id]`
  - Access traces through: `traces.trace_data.[trace_id]`
  - Link traces to photos using: `nodes.[node_id].photos.[photo_uuid].photofirst_data`

- **Company Matching**
  - Implement case-insensitive comparison for company names
  - Match variations of "Charter," "Spectrum," and "Time Warner"

## Pole Correlation

- **Matching Strategy**
  - Implement multi-stage matching with decreasing confidence:
    1. Exact match on pole number
    2. Normalized match (remove prefixes, punctuation)
    3. Partial match (string similarity > 0.8)
    4. Geographic match (if coordinates available)

- **Correlation Requirements**
  - Store matching confidence score (0.0-1.0) for each pair
  - Track matching method used for debugging
  - Include all poles from both data sources in final set

## Field-Specific Rules

- **Attachment Action (Column B)**
  - "I" (Install) = attachment in Recommended but not Measured or `proposed:true` in Katapult
  - "R" (Relocate) = attachment in both designs with different heights or non-zero `mr_move`
  - "E" (Existing) = attachment in both designs with same properties

- **Column F (Proposed Riser/Guy/PLA)**
  - Default to "NO" for riser and guy if uncertain
  - Format PLA as percentage with 2 decimal places
  - Check for both explicit and implied risers/guys (e.g., `trace._trace_type === "equipment"`)

- **Midspan Heights (Columns H-J)**
  - Calculate lowest height among all wires of appropriate type
  - Verify midspan measurements are actually midspan, not attachment heights
  - Convert all heights to consistent decimal feet format
