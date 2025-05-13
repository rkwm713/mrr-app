# Data Handling Rules

## 1. JSON Path Navigation
- Create a safe navigation utility function similar to Python's `get_nested_value()`
- Never assume object properties exist - always provide defaults
- Example: `getNestedValue(data, ['path', 'to', 'key'], defaultValue)`

```javascript
function getNestedValue(obj, path, defaultValue = null) {
    return path.reduce((current, key) => {
        if (current && typeof current === 'object' && key in current) {
            return current[key];
        }
        return undefined;
    }, obj) ?? defaultValue;
}
```

## 2. SPIDAcalc Specific Rules
- **Design Types**: Distinguish between "Measured" and "Recommended" designs
  - Measured = current state
  - Recommended = proposed state
- **Client Data Lookups**: 
  - Pole definitions are in `clientData.poles`
  - Wire definitions are in `clientData.wires`
  - Equipment definitions are in `clientData.equipments`
  - Use `clientItem.id` or `clientItemVersion` as lookup keys
- **Units**: SPIDAcalc uses metric units (metres), convert to feet (×3.28084)
- **Height Properties**: Look for `.value` in height objects (e.g., `attachmentHeight.value`)

## 3. Katapult Specific Rules
- **Dynamic Keys**: Attributes often have dynamic IDs (e.g., `"-Imported"`, `"-OL-xyz"`)
- **Special Key Patterns**:
  - `"-Imported"` = original imported value
  - `one` field = primary value among multiple options
  - `auto_calced` = automatically calculated value
  - `assessment` = manually assessed value
- **Units**: Katapult typically uses Imperial units (feet/inches)
- **Photo Data**: `photofirst_data` contains measured values but may be pole attachment, not midspan

## 4. Data Correlation Rules
- **Primary Pole Key**: Use SPIDA `location.label` as the primary identifier
- **Katapult Pole Keys** (in priority order):
  1. `attributes.PoleNumber.-Imported`
  2. `attributes.electric_pole_tag.assessment`
  3. `attributes.DLOC_number.-Imported`
- **Fallback Strategy**: If primary correlation fails, store in unmatched list

## 5. Company-Specific Logic
- **Target Company**: Focus on Charter/Spectrum attachments
- **Company Matching**: Look for company names in:
  - SPIDA: `owner.id`
  - Katapult: `trace.company`

## 6. Data Transformation Rules
- **Unit Conversions**: Always convert to feet for output
- **Missing Values**: Use "N/A", "Unknown", or "--" consistently
- **Boolean Values**: Convert to "YES"/"NO" for Excel output
- **Percentage Values**: Multiply ratios by 100, add % symbol if needed