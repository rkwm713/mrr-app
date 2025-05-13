Okay, here's the content from the OCR converted into a Markdown file. I've tried to maintain the hierarchical structure and use Markdown formatting for clarity.

```markdown
# SPIDAcalc JSON File Structure

## Top-Level Object:

*   `label` (String): A label for the project, e.g., `"CPS_6457E_03"`.
*   `dateModified` (Number): Timestamp of the last modification, e.g., `1746193395463`.
*   `clientFile` (String): The name of the associated client file, e.g., `"TechServ_Light C_Static_Tension.client"`.
*   `date` (String): The date of the project, e.g., `"2025-04-15"`.
*   `schema` (String): Path to the schema definition for this project type, e.g., `"/schema/spidacalc/calc/project.schema"`.
*   `version` (Number): Version number of the schema, e.g., `11`.
*   `engineer` (String): Name of the engineer, e.g., `"Taylor Larsen"`.
*   `comments` (String): Any comments related to the project.
*   `generalLocation` (String): General location description.
*   `address` (Object): Contains address details:
    *   `number` (String): Street number.
    *   `street` (String): Street name.
    *   `city` (String): City.
    *   `county` (String): County.
    *   `state` (String): State.
    *   `zip_code` (String): Zip code.
*   `userDefinedValues` (Object): An empty object in this example, likely for custom key-value pairs.
*   `clientData` (Object): Contains detailed data from the client file.
    *   `schema` (String): Path to the schema definition for client data, e.g., `"/schema/spidacalc/client/data.schema"`.
    *   `version` (Number): Version number of the client data schema, e.g., `11`.
    *   `name` (String): Name of the client file, e.g., `"TechServ_Light C_Static_Tension.client"`.
    *   `poles` (Array of Objects): List of pole definitions. Each pole object has:
        *   `aliases` (Array of Objects): List of aliases for the pole. Each alias object has:
            *   `id` (String): Alias identifier, e.g., `"40-3"`.
        *   `shape` (String): Shape of the pole, e.g., `"ROUND"`.
        *   `materialCategory` (String): Material of the pole, e.g., `"WOOD"`.
        *   `classOfPole` (String): Class of the pole, e.g., `"3"`.
        *   `species` (String): Species of wood if applicable, e.g., `"Southern Pine"`.
        *   `height` (Object): Height of the pole.
            *   `unit` (String): Unit of height, e.g., `"METRE"`.
            *   `value` (Number): Value of height, e.g., `12.192000000000002`.
        *   `taper` (Number): Taper value, e.g., `0.122`.
        *   `density` (Object): Density of the pole material.
            *   `unit` (String): Unit of density, e.g., `"KILOGRAM_PER_CUBIC_METRE"`.
            *   `value` (Number): Value of density, e.g., `624.7200715844455`.
        *   `maximumAllowableStress` (Object): Maximum stress the pole can withstand.
            *   `unit` (String): Unit of stress, e.g., `"PASCAL"`.
            *   `value` (Number): Value of stress, e.g., `5.515805834534689E7`.
        *   `ptc` (Object): Pole top circumference or characteristic.
            *   `unit` (String): Unit, e.g., `"METRE"`.
            *   `value` (Number): Value, e.g., `0.5842`.
        *   `modulus` (Object): Modulus of elasticity.
            *   `unit` (String): Unit, e.g., `"PASCAL"`.
            *   `value` (Number): Value, e.g., `1.241056312770305E10`.
        *   `wallThickness` (Object): Wall thickness (relevant for hollow poles).
            *   `unit` (String): Unit, e.g., `"METRE"`.
            *   `value` (Number): Value, e.g., `-1.0` (may indicate solid or not applicable).
        *   `poissonRatio` (Number): Poisson's ratio for the material, e.g., `0.3`.
        *   `settingType` (String): Type of setting, e.g., `"ANSI"`.
        *   `momentAtHeights` (Array): Likely for storing moment calculations at different heights, empty in this example.
        *   `wires` (Array of Objects): List of wire definitions. Each wire object has:
            *   `aliases` (Array): List of aliases for the wire (can be empty).
            *   `size` (String): Size/type of the wire, e.g., `"2 AAC Duplex"`.
            *   `calculation` (String): Calculation type, e.g., `"STATIC"`.
            *   `strength` (Object): Breaking strength of the wire.
                *   `unit` (String): Unit, e.g., `"NEWTON"`.
                *   `value` (Number): Value, e.g., `6005.099180601675`.
            *   `weight` (Object): Weight per unit length.
                *   `unit` (String): Unit, e.g., `"NEWTON_PER_METRE"`.
                *   `value` (Number): Value, e.g., `2.145303731769335`.
            *   `crossArea` (Object): Cross-sectional area.
                *   `unit` (String): Unit, e.g., `"SQUARE_METRE"`.
                *   `value` (Number): Value, e.g., `3.3677352E-5`.
            *   `diameter` (Object): Diameter of the wire.
                *   `unit` (String): Unit, e.g., `"METRE"`.
                *   `value` (Number): Value, e.g., `0.0189484`.
            *   `description` (String): Description of the wire, e.g., `"2 AAC Duplex - Doberman"`.
            *   `coreStrands` (Number): Number of core strands, e.g., `0`.
            *   `conductorStrands` (Number): Number of conductor strands, e.g., `7`.
            *   `numberOfConductors` (Number): Total number of conductors, e.g., `1`.
            *   `usageGroups` (Array of Strings): Groups the wire belongs to, e.g., `["SECONDARY", "UTILITY_SERVICE"]`.
            *   `conductorProperties` (String): Specifies which properties are being referred to, e.g., `"TOTAL"`.
            *   `expansionCoefficient` (Object): Thermal expansion coefficient.
                *   `unit` (String): Unit, e.g., `"PER_CELSIUS"`.
                *   `value` (Number): Value, e.g., `2.303999999999999E-5`.
            *   `modulus` (Object): Modulus of elasticity for the wire.
                *   `unit` (String): Unit, e.g., `"PASCAL"`.
                *   `value` (Number): Value, e.g., `6.412124282646576E10`.
            *   `tensionGroups` (Array of Objects): Defines tension characteristics under different conditions. Each object has:
                *   `name` (String): Name of the tension group, e.g., `"Full"`.
                *   `temperature` (Object): Temperature for this group.
                    *   `unit` (String): Unit, e.g., `"CELSIUS"`.
                    *   `value` (Number): Value, e.g., `15.55555555555555`.
                *   `groups` (Array of Objects): Specific tension values for different distances. Each object has:
                    *   `distance` (Object): Span length.
                        *   `unit` (String): Unit, e.g., `"METRE"`.
                        *   `value` (Number): Value, e.g., `1523.6952`.
                    *   `tension` (Object): Tension value.
                        *   `unit` (String): Unit, e.g., `"NEWTON"`.
                        *   `value` (Number): Value, e.g., `720.611901672201`.
        *   `anchors` (Array of Objects): List of anchor definitions. Each anchor object has:
            *   `aliases` (Array): List of aliases for the anchor (can be empty).
            *   `size` (String): Size/type of the anchor, e.g., `"8" - 10" - 12" Triple Helix - 11/4" Rod"`.
            *   `strength` (Object): Strength of the anchor.
                *   `unit` (String): Unit, e.g., `"NEWTON"`.
                *   `value` (Number): Value, e.g., `204618.194301983`.
        *   `equipments` (Array of Objects): List of equipment definitions. Each equipment object has:
            *   `aliases` (Array): List of aliases (can be empty).
            *   `size` (String): Size/type of the equipment, e.g., `"Secondary"`.
            *   `type` (Object): Type of equipment.
                *   `name` (String): Name of the equipment type, e.g., `"DRIP_LOOP"`.
                *   `industry` (String): Industry it belongs to, e.g., `"UTILITY"`.
            *   `distanceToBottom` (Object): Vertical distance measurement.
                *   `unit` (String): Unit, e.g., `"METRE"`.
                *   `value` (Number): Value, e.g., `0.0`.
            *   `distanceToTop` (Object): Vertical distance measurement.
                *   `unit` (String): Unit, e.g., `"METRE"`.
                *   `value` (Number): Value, e.g., `0.0`.
            *   `valuePerLength` (Object): A value per unit length, if applicable.
                *   `unit` (String): Unit, e.g., `"METRE"`.
                *   `value` (Number): Value, e.g., `0.0`.
            *   `shape` (String): Shape of the equipment, e.g., `"ROUND"`.
            *   `offset` (Object): Offset distance.
                *   `unit` (String): Unit, e.g., `"METRE"`.
                *   `value` (Number): Value, e.g., `0.0`.
            *   `weight` (Object): Weight of the equipment.
                *   `unit` (String): Unit, e.g., `"NEWTON"`.
                *   `value` (Number): Value, e.g., `0.0`.
            *   `lateralArea` (Object): Lateral surface area.
                *   `unit` (String): Unit, e.g., `"SQUARE_METRE"`.
                *   `value` (Number): Value, e.g., `0.0`.
            *   `poleSideArea` (Object): Area on the pole side.
                *   `unit` (String): Unit, e.g., `"SQUARE_METRE"`.
                *   `value` (Number): Value, e.g., `0.0`.
            *   `throughHoleDiameter` (Object): Diameter of any through-hole.
                *   `unit` (String): Unit, e.g., `"METRE"`.
                *   `value` (Number): Value, e.g., `-0.0015875000000000002`.
        *   `equipmentTypes` (Array of Objects): Defines available types of equipment. Each object has:
            *   `name` (String): Name of the equipment type, e.g., `"APPARATUS_CASE"`.
            *   `industry` (String): Industry, e.g., `"COMMUNICATION"`.
        *   `insulators` (Array of Objects): List of insulator definitions. Each object has properties like `aliases`, `size`, `type`, `horizontalOffset`, `verticalOffset`, `lateralArea`, `poleSideArea`, `shape`, `strength`, `weight`, `throughHoleDiameter` (each with unit and value sub-objects where applicable).
        *   `foundations` (Array): Empty in this example, likely for foundation definitions.
        *   `crossArms` (Array of Objects): List of cross-arm definitions. Each object includes properties such as `aliases`, `size`, `doubleCrossArm` (boolean), `poissonRatio`, `wallThickness`, `materialCategory`, `width`, `height`, `length`, `shape`, `density`, `modulus`, `stressAllow`, `throughHoleDiameter` (each with unit and value sub-objects where applicable).
        *   `braces` (Array): Empty in this example.
        *   `bundleComponents` (Array of Objects): Defines components that can make up a wire bundle. Each object has `aliases`, `size`, `abbreviation`, `weight`, `diameter`, `description`, `groups`.
        *   `bundles` (Array of Objects): Defines wire bundles. Each bundle object has:
            *   `aliases` (Array).
            *   `size` (String): Name/identifier for the bundle.
            *   `diameter` (Object): Calculated or defined diameter of the bundle.
                *   `unit` (String).
                *   `value` (Number).
            *   `group` (String): Grouping category for the bundle, e.g., `"Quick Bundles"`.
            *   `autoCalculateDiameter` (Boolean): Whether the diameter is auto-calculated.
            *   `source` (String): Source of the bundle definition, e.g., `"PROJECT"`.
            *   `messenger` (Object): Defines the messenger wire for the bundle.
                *   `size` (String): Size of the messenger wire.
                *   `conductorStrands` (Number).
                *   `coreStrands` (Number).
                *   `clientItemVersion` (String): Version identifier from the client file.
            *   `bundleComponents` (Array of Objects): List of components in this bundle. Each object has:
                *   `size` (String): Size of the component.
                *   `clientItemVersion` (String): Version identifier from the client file.
        *   `assemblies` (Array of Objects): List of pre-defined assemblies that can be placed on a pole. Each assembly has:
            *   `aliases` (Array).
            *   `code` (String): Code or identifier for the assembly, e.g., `"Street Light"`.
            *   `group` (String): Group identifier.
            *   `assemblyStructure` (Object): Defines the components and layout of the assembly. This includes arrays for `wireEndPoints`, `spanPoints`, `anchors`, `notePoints`, `pointLoads`, `wirePointLoads`, `damages`, `wires`, `spanGuys`, `guys`, `equipments`, `wireMountedEquipments`, `guyAttachPoints`, `crossArms`, `insulators`, `pushBraces`, `sidewalkBraces`, `foundations`, `trusses`, `assemblies`. The structure of these components is similar to their top-level definitions (e.g., equipments within an assembly will have similar fields to the equipments array in `clientData`).
            *   `distanceFromPoleTop` (Object with unit and value).
            *   `distanceToUnderbuild` (Object with unit and value).
            *   `minimumLineAngle` (Object with unit and value).
            *   `maximumLineAngle` (Object with unit and value).
            *   `assemblyType` (String): e.g., `"FRAMING"`.
        *   `trusses` (Array): Empty in this example.
        *   `environments` (Array): Empty in this example, likely for defining environmental conditions.
        *   `defaultEnvironment` (Object): Default environmental settings.
            *   `name` (String).
            *   `description` (String).
        *   `analysisCases` (Array of Objects): Defines different analysis scenarios. Each case has:
            *   `type` (String): Type of analysis case, e.g., `"zoneStrengthCase"` or `"NESC 2012-2017"`.
            *   `name` (String): Name of the case, e.g., `"NESC"` or `"Light - Grade C"`.
            *   Numerous specific parameters for the analysis, such as `addByDefault`, `includeThroughBolts`, `minimumAllowableRatio`, `analysisMethod`, `windType`, `constructionGrade`, `loadZone`, various factors and multipliers (`anchorStrengthFactor`, `poleStrengthFactors`, etc.), and `valuesApplied` (which itself contains objects for `ice`, `temperature`, `windPressure`, and various factors and multipliers for different components and materials).
        *   `owners` (Array of Objects): List of possible owners for components. Each object has:
            *   `industry` (String): e.g., `"UTILITY"`.
            *   `id` (String): Owner identifier, e.g., `"CPS Energy"`.
        *   `notes` (Array): Empty in this example.
        *   `locationForms` (Array): Empty in this example.
        *   `projectForms` (Array): Empty in this example.
        *   `customReportSetups` (Array): Empty in this example.
        *   `designLayers` (Array of Objects): Defines design layers. Each object has:
            *   `name` (String): e.g., `"Measured Design"`.
            *   `type` (String): e.g., `"Measured"`.
        *   `defaultLocationForms` (Array): Empty in this example.
        *   `defaultProjectForms` (Array): Empty in this example.
        *   `clearanceCases` (Array): Empty in this example.
        *   `componentGroups` (Array): Empty in this example.
        *   `wireClasses` (Array): Empty in this example.
        *   `wireStates` (Array): Empty in this example.
*   `hash` (String): A hash value for the client data, e.g., `"7af301f4f3a4d29355a75642bb20f37e"`.
*   `clientFileVersion` (String): Version hash of the client file, e.g., `"7af301f4f3a4d29355a75642bb20f37e"`.
*   `forms` (Array): Empty in this example.
*   `defaultLocationForms` (Array): Repeated from `clientData`, empty here.
*   `defaultLoadCases` (Array of Objects): Similar structure to `analysisCases` within `clientData`, defining default load scenarios.
*   `defaultStrengthCase` (Object): Similar structure to an individual analysis case, defining a default strength scenario.
*   `leads` (Array of Objects): Contains information about specific leads or pole lines. Each lead object has:
    *   `label` (String): Label for the lead.
    *   `locations` (Array of Objects): Defines specific pole locations within the lead. Each location object has:
        *   `label` (String): Label for the location, e.g., `"1-PL410620"`.
        *   `mapNumber` (String).
        *   `comments` (String).
        *   `address` (Object): Address details for the location (same structure as top-level address).
        *   `technician` (String).
        *   `crossStreet1` (String).
        *   `crossStreet2` (String).
        *   `geographicCoordinate` (Object): GeoJSON point.
            *   `type` (String): `"Point"`.
            *   `coordinates` (Array of Numbers): `[longitude, latitude]`.
            *   `properties` (Object, optional): Additional properties like time.
        *   `remedies` (Array).
        *   `poleTags` (Array).
        *   `userDefinedValues` (Object).
        *   `summaryNotes` (Array).
        *   `forms` (Array).
        *   `images` (Array).
        *   `photosToBeAssigned` (Array).
        *   `designs` (Array of Objects): Contains different design versions for this location (e.g., `"Measured Design"`, `"Recommended Design"`). Each design object has:
            *   `label` (String): e.g., `"Measured Design"`.
            *   `layerType` (String): e.g., `"Measured"`.
            *   `structure` (Object): Detailed structure definition for this design at this location. This is a complex object containing:
                *   `pole` (Object): Definition of the pole at this location, including `id`, `owner`, `glc` (ground line circumference), `agl` (above ground length), `autoGLC`, `autoAGL`, `cutTop`, `environment`, `temperature`, `stressRatio`, `leanAngle`, `leanDirection`, `clientItemVersion`, `clientItem` (referencing a pole from `clientData`), and `clientItemAlias`.
                *   `wireEndPoints` (Array of Objects): Points where wires connect or terminate. Includes `id`, `externalId`, `direction`, `distance`, `relativeElevation`, `inclination`, `type` (e.g., `"OTHER_POLE"`, `"PREVIOUS_POLE"`), `comments`, `environment`, `wires` (array of wire IDs attached here), `spanGuys`, `spanPoints`, `terrainPoints`, `environmentRegions`, `calculateClearances`.
                *   `spanPoints` (Array).
                *   `anchors` (Array of Objects): Anchors at this location, with `id`, `height`, `direction`, `distance`, `owner`, `clientItemVersion`, `clientItem`, `guys` (array of guy IDs attached).
                *   `notePoints` (Array).
                *   `pointLoads` (Array).
                *   `wirePointLoads` (Array).
                *   `damages` (Array).
                *   `wires` (Array of Objects): Wires present at this location in this design. Includes `id`, `externalId`, `owner`, `clientItemVersion`, `clientItem` (referencing a wire from `clientData` or a bundle), `attachmentHeight`, `usageGroup`, `tensionGroup`, `midspanHeight`, `connectionId`, `connectedWire` (ID of wire on the other side of the span), `wireEndPointPlacement` (vector coordinates).
                *   `spanGuys` (Array).
                *   `guys` (Array of Objects): Guys at this location. Includes `id`, `externalId`, `owner`, `clientItemVersion`, `clientItem`, `clientItemAlias`, `attachmentHeight`.
                *   `equipments` (Array of Objects): Equipment on this pole. Includes `id`, `externalId`, `direction`, `owner`, `clientItemVersion`, `clientItem`, `attachmentHeight`, `bottomHeight`, `autoBottomHeight`.
                *   `wireMountedEquipments` (Array).
                *   `guyAttachPoints` (Array).
                *   `crossArms` (Array of Objects): Cross-arms on this pole. Includes `id`, `externalId`, `direction`, `owner`, `supportedWEPs`, `clientItemVersion`, `clientItem`, `attachmentHeight`, `offset`, `insulators` (array of insulator IDs on this arm).
                *   `insulators` (Array of Objects): Insulators on this pole. Includes `id`, `externalId`, `owner`, `clientItemVersion`, `clientItem`, `offset`, `direction`, `doubleInsulator`, `wires` (array of wire IDs attached).
                *   `pushBraces` (Array).
                *   `sidewalkBraces` (Array).
                *   `foundations` (Array).
                *   `trusses` (Array).
                *   `assemblies` (Array of Objects): Instances of assemblies placed on this pole. Includes `id`, `source`, `externalId`, `clientItemVersion`, `clientItem` (referencing an assembly from `clientData`), `items` (listing the specific components of this assembly instance).
            *   `geographicCoordinate` (Object): GeoJSON point for the design.
            *   `mapLocation` (Object): GeoJSON point for map display.
            *   `analysis` (Array of Objects): Results of analyses run for this design at this location. Each object has:
                *   `id` (String): Identifier for the analysis case used (e.g., `"Light - Grade C"`).
                *   `analysisCaseDetails` (Object): A copy of the analysis case definition from `clientData.analysisCases` or `defaultLoadCases`.
                *   `results` (Array of Objects): List of results for different components. Each result object has:
                    *   `actual` (Number): Actual calculated value.
                    *   `allowable` (Number): Allowable value.
                    *   `unit` (String): Unit of the values, e.g., `"PERCENT"`.
                    *   `analysisDate` (Number): Timestamp of the analysis.
                    *   `component` (String): ID of the component analyzed, e.g., `"Insulator#7"`.
                    *   `loadInfo` (String): Name of the load case.
                    *   `passes` (Boolean): Whether the component passed the analysis.
                    *   `analysisType` (String): Type of analysis, e.g., `"FORCE"`, `"STRESS"`.

This schema is quite comprehensive and designed to model utility pole structures and their analysis in detail. The use of `clientItemVersion` and `clientItem` suggests a library or database of standard components that are referenced within the project.
```