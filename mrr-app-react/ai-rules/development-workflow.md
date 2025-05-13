# Development Workflow Rules

## 1. Phase-by-Phase Development
Follow the adapted order for client-side development:
1. **Phase 0**: Project setup (HTML, CSS, JS structure)
2. **Phase 1**: Basic HTML interface with file inputs
3. **Phase 2**: File reading and JSON parsing
4. **Phase 3**: Pole correlation logic
5. **Phase 4**: Data extraction modules
6. **Phase 5**: Report generation and Excel creation
7. **Phase 6**: UI/UX improvements and error handling
8. **Phase 7**: Testing and documentation

## 2. Task Implementation Rules
- Complete ALL subtasks in a phase before moving to the next
- Check off each item in `checklist.md` as completed
- Test each function immediately after implementation
- Use sample data for all testing
- Test in browser console before integrating into UI

## 3. Function Development Order
For Phase 4 (Data Extraction), implement in this order:
1. Column C (Pole Owner) - simplest to start with
2. Column D (Pole #) - builds on correlation
3. Column E (Pole Structure) - introduces client data lookups
4. Column B (Attachment Action) - most complex business logic
5. Column F parts (Proposed features) - requires design comparison
6. Remaining columns (G-O) - midspan and height calculations

## 4. Testing Requirements
- Test functions in browser console
- Create simple HTML test pages for individual functions
- Use console.log for debugging JSON paths
- Manually verify Excel output against JSON source
- Test with all available sample files
- Handle edge cases (missing data, empty arrays)

## 5. Error Handling Standards
```javascript
// Always wrap data access in try-catch
function extractValue(data, path, defaultValue = "N/A") {
    try {
        const value = getNestedValue(data, path);
        if (value === null || value === undefined) {
            return defaultValue;
        }
        return value;
    } catch (error) {
        console.error(`Error extracting ${path.join('.')}:`, error);
        return "ERROR";
    }
}
```

## 6. Documentation Requirements
- Add JSDoc comments to all functions
- Comment complex business logic
- Update README as features are added
- Document any assumptions made about data structure

## 7. Git Workflow
- Commit after each major function implementation
- Use descriptive commit messages referencing checklist items
- Example: "PHASE4: Implement getSpidaPoleOwner - Column C complete"
- Create feature branches for complex functionality