# JSON Schema Guide

This document provides a simplified overview of the key JSON structures for SPIDAcalc and Katapult data. Rather than documenting every possible field, it focuses on the most important paths and structures needed for the Make-Ready Report Generator.

## SPIDAcalc JSON Structure

SPIDAcalc JSON represents structural analysis data for utility poles, including measured (existing) and recommended (proposed) designs.

### Key Paths and Structures

```
project/                             # Root project object
├── leads/[*]/                       # Array of lead objects (circuits)
│   └── locations/[*]/               # Array of location objects (poles)
│       ├── label                    # Pole identifier/number
│       ├── designs/[*]/             # Array of designs (Measured vs Recommended)
│       │   ├── layerType            # "Measured" or "Recommended"
│       │   ├── structure/           # Physical structure model
│       │   │   ├── pole/            # Pole properties
│       │   │   │   ├── owner        # Pole ownership information
│       │   │   │   ├── clientItem   # Reference to pole definition
│       │   │   │   └── stressRatio  # PLA value (as decimal)
│       │   │   ├── wires/[*]/       # Array of wires on this pole
│       │   │   │   ├── owner        # Wire ownership
│       │   │   │   ├── clientItem   # Reference to wire definition
│       │   │   │   ├── attachmentHeight # Height at pole
│       │   │   │   └── midspanHeight    # Height at midspan
│       │   │   ├── equipments/[*]/  # Array of equipment on pole
│       │   │   │   ├── owner        # Equipment ownership
│       │   │   │   ├── clientItem   # Reference to equipment definition
│       │   │   │   └── attachmentHeight # Height at pole
│       │   │   └── guys/[*]/        # Array of guys on pole
│       │   │       ├── owner        # Guy ownership
│       │   │       ├── clientItem   # Reference to guy definition
│       │   │       └── attachmentHeight # Height at pole
│       │   └── analysis/[*]/        # Analysis results
│       │       ├── id               # Analysis case identifier
│       │       ├── analysisCaseDetails/ # Analysis parameters
│       │       │   └── constructionGrade # Construction grade used
│       │       └── results/[*]/     # Results for each component
└── clientData/                     # Library of component definitions
    ├── poles/[*]/                  # Pole definitions
    │   ├── aliases/[*]/id          # Pole type identifiers
    │   ├── species                 # Wood species or material
    │   └── classOfPole             # Pole class
    ├── wires/[*]/                  # Wire definitions
    │   ├── size                    # Wire size/gauge
    │   ├── usageGroups             # Categories ("PRIMARY", "COMMUNICATION", etc)
    │   └── description             # Wire description
    └── equipments/[*]/             # Equipment definitions
        ├── size                    # Equipment size/model
        └── type/name               # Equipment type ("RISER", "TRANSFORMER", etc)
```

### Key Concepts

1. **Design Types**:
   - `"Measured"` = Current/existing state
   - `"Recommended"` = Proposed/future state

2. **Client Item References**:
   - Components in `structure` reference definitions in `clientData` using `clientItem.id` or `clientItemVersion`
   - You must look up these references to get detailed information

3. **Units**:
   - SPIDAcalc uses metric units (metres)
   - Values should be converted to feet (×3.28084) for the report

## Katapult JSON Structure

Katapult JSON represents field data collection, including photogrammetry measurements, GPS coordinates, and traced components.

### Key Paths and Structures

```
nodes/                             # Collection of nodes (poles, anchors, etc)
├── [node_id]/                     # Node objects keyed by unique ID
│   ├── attributes/                # Node attributes
│   │   ├── PoleNumber/-Imported   # Imported pole number
│   │   ├── electric_pole_tag/assessment # Measured pole tag
│   │   ├── pole_owner/multi_added # Pole owner information
│   │   ├── pole_species/          # Pole species information
│   │   └── pole_class/            # Pole class information
│   ├── button                     # Node type identifier
│   ├── latitude                   # GPS latitude
│   ├── longitude                  # GPS longitude
│   └── photos/                    # Photos associated with this node
│       └── [photo_uuid]/          # Photo association object
│           ├── association        # Type of association
│           └── photofirst_data/   # Photogrammetry data (if available)
│               ├── wire/[*]/      # Wire measurement data
│               │   ├── _trace     # Reference to trace ID
│               │   ├── _measured_height # Measured height
│               │   └── mr_move    # Make-ready movement amount
│               ├── equipment/[*]/ # Equipment measurement data
│               └── midspanHeight/[*]/ # Midspan height measurements
│
traces/                            # Logical traces (cables, guys, etc)
├── trace_data/                    # Trace definitions
│   └── [trace_id]/                # Trace objects keyed by unique ID
│       ├── _trace_type            # Type of trace ("cable", "down_guy", etc)
│       ├── cable_type             # Type of cable ("Primary", "Fiber", etc)
│       ├── company                # Owning company
│       └── proposed               # Whether trace is proposed (true/false)
└── trace_items/                   # Maps photos to visible traces
    └── [photo_uuid]/              # Photo UUID
        └── [trace_id]/            # Trace visibility in this photo

connections/                       # Connections between nodes
└── [connection_id]/               # Connection objects keyed by unique ID
    ├── button                     # Connection type
    ├── node_id_1                  # Starting node
    ├── node_id_2                  # Ending node
    └── sections/                  # Connection sections (if any)
        └── [section_id]/          # Section objects
            ├── latitude           # Section point latitude
            └── longitude          # Section point longitude
```

### Key Concepts

1. **Dynamic Keys**:
   - Many objects use dynamic IDs as keys (e.g., `[node_id]`, `[trace_id]`, `[photo_uuid]`)
   - You need to iterate through these collections to find specific items

2. **Data Organization**:
   - `nodes` = Physical objects (poles, equipment)
   - `traces` = Logical lines (wires, cables, guys)
   - `connections` = Physical links between nodes

3. **Key Patterns**:
   - `"-Imported"` suffix = original imported data
   - `"assessment"` field = manually measured value
   - `"button_added"` field = how data was entered
   - `"mr_move"` = Make-ready movement amount (in inches)

4. **Units**:
   - Katapult typically uses imperial units (feet/inches)
   - Height values may be strings like "25' 6""

## Correlation Between Systems

The key to linking SPIDAcalc and Katapult data is the pole identifier, which may be found in:

1. **SPIDAcalc**:
   - `leads[*].locations[*].label` (primary)
   - `designs[*].structure.pole.clientItemAlias`
   - `poleTags[*]` (various formats)

2. **Katapult**:
   - `nodes.[node_id].attributes.PoleNumber.-Imported`
   - `nodes.[node_id].attributes.electric_pole_tag.assessment`
   - `nodes.[node_id].attributes.DLOC_number.-Imported`

Pole correlation may require normalization (removing prefixes, standardizing formats) and may use multiple strategies (exact, partial, or geographic matching).
