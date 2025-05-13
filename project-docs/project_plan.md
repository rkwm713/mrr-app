# Project Plan

**Project:** Web-Based Make-Ready Report Generator

**Overall Goal:** Create a web application where users can upload a SPIDAcalc JSON file and a Katapult JSON file. The application will process these files and allow the user to download a generated Excel Make-Ready Report.

## Phase 0: Project Setup and Environment

### Step 0.1: Create Project Directory
*   **Goal:** Establish a root folder for our project.
*   **Action:** Create a new folder named `make_ready_webapp`.
*   **Expected Outcome:** A new directory `make_ready_webapp/` exists.

### Step 0.2: Create Virtual Environment
*   **Goal:** Isolate project dependencies.
*   **Action (in terminal, inside `make_ready_webapp/`):**
    ```bash
    python -m venv venv
    source venv/bin/activate # On Windows: venv\Scripts\activate
    ```
*   **Expected Outcome:** Virtual environment activated. Prompt might change.
*   **Best Practice:** Always use virtual environments for Python projects.

### Step 0.3: Install Initial Libraries
*   **Goal:** Install necessary Python packages.
*   **Action (in terminal, with venv activated):**
    ```bash
    pip install Flask pandas openpyxl
    ```
    *   Flask: For the web server.
    *   pandas: For data manipulation and easy Excel export.
    *   openpyxl: Engine for Pandas to write .xlsx files.
*   **Expected Outcome:** Libraries installed successfully.

### Step 0.4: Create Basic Project Structure
*   **Goal:** Organize files.
*   **Action:** Inside `make_ready_webapp/`, create the following:
    *   Folder: `app/`
        *   Folder: `app/templates/` (for HTML files)
        *   Folder: `app/static/` (for CSS, JS, images later)
        *   File: `app/__init__.py` (to make app a Python package)
        *   File: `app/routes.py` (for Flask routes)
        *   File: `app/utils.py` (for helper functions)
        *   File: `app/spida_parser.py` (for SPIDAcalc JSON logic)
        *   File: `app/katapult_parser.py` (for Katapult JSON logic)
        *   File: `app/report_generator.py` (for merging and Excel logic)
    *   File: `run.py` (to start the Flask app)
    *   File: `requirements.txt`
    *   Folder: `sample_data/` (for your example JSON files)
    *   Folder: `output/` (where generated Excel files will be temporarily saved)
*   **Expected Outcome:** Directory structure created.

### Step 0.5: Initialize Git Repository
*   **Goal:** Enable version control.
*   **Action (in terminal, inside `make_ready_webapp/`):**
    ```bash
    git init
    echo "venv/" > .gitignore
    echo "__pycache__/" >> .gitignore
    echo "*.pyc" >> .gitignore
    echo "output/" >> .gitignore
    git add .
    git commit -m "Initial project setup and structure"
    ```
*   **Expected Outcome:** Git repository initialized, common files ignored.

### Step 0.6: Populate requirements.txt
*   **Goal:** List project dependencies for reproducibility.
*   **Action (in terminal, with venv activated):**
    ```bash
    pip freeze > requirements.txt
    ```
*   **Action:** Commit this change to Git.
*   **Expected Outcome:** `requirements.txt` file created with Flask, pandas, openpyxl versions.

## Phase 1: Basic Flask Web App Shell

### Step 1.1: Create Basic Flask App (`app/__init__.py`)
*   **Goal:** Initialize the Flask application.
*   **Action:** AI, please write the following code into `app/__init__.py`:
    ```python
    from flask import Flask

    app = Flask(__name__)
    # Configuration for uploads (can be added later)
    # app.config['UPLOAD_FOLDER'] = 'output/' # Or a more secure temp location
    # app.config['ALLOWED_EXTENSIONS'] = {'json'}

    from app import routes # Import routes after app is created
    ```
*   **Expected Outcome:** `app/__init__.py` created.

### Step 1.2: Create `run.py`
*   **Goal:** Create a script to run the Flask development server.
*   **Action:** AI, please write the following code into `run.py`:
    ```python
    from app import app

    if __name__ == '__main__':
        app.run(debug=True)
    ```
*   **Expected Outcome:** `run.py` created.

### Step 1.3: Create Basic HTML Template (`app/templates/index.html`)
*   **Goal:** Create a homepage.
*   **Action:** AI, please write the following HTML into `app/templates/index.html`:
    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Make-Ready Report Generator</title>
    </head>
    <body>
        <h1>Welcome to the Make-Ready Report Generator</h1>
        <p><a href="{{ url_for('upload_files') }}">Upload Files to Generate Report</a></p>
    </body>
    </html>
    ```
*   **Expected Outcome:** `index.html` created.

### Step 1.4: Create Initial Routes (`app/routes.py`)
*   **Goal:** Define web pages and their logic.
*   **Action:** AI, please write the following code into `app/routes.py`:
    ```python
    from flask import render_template, request, redirect, url_for, send_from_directory
    from app import app
    import os

    # Configure upload folder (relative to the app's root directory)
    # This should match or be derived from app.config['UPLOAD_FOLDER'] if set there
    UPLOAD_FOLDER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'output')
    if not os.path.exists(UPLOAD_FOLDER_PATH):
        os.makedirs(UPLOAD_FOLDER_PATH)

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/upload', methods=['GET', 'POST'])
    def upload_files():
        if request.method == 'POST':
            # File handling logic will go here
            return "Files uploaded (processing logic to be added)"
        return render_template('upload_form.html') # We'll create this next
    ```
*   **Expected Outcome:** `routes.py` created with basic routes.

### Step 1.5: Create File Upload Form (`app/templates/upload_form.html`)
*   **Goal:** Create the HTML form for users to upload their JSON files.
*   **Action:** AI, please write the following HTML into `app/templates/upload_form.html`:
    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Upload JSON Files</title>
    </head>
    <body>
        <h1>Upload SPIDAcalc and Katapult JSON Files</h1>
        <form method="post" enctype="multipart/form-data">
            <div>
                <label for="spida_file">SPIDAcalc JSON File:</label>
                <input type="file" id="spida_file" name="spida_file" accept=".json" required>
            </div>
            <br>
            <div>
                <label for="katapult_file">Katapult JSON File:</label>
                <input type="file" id="katapult_file" name="katapult_file" accept=".json" required>
            </div>
            <br>
            <div>
                <button type="submit">Generate Report</button>
            </div>
        </form>
        <p><a href="{{ url_for('index') }}">Back to Home</a></p>
    </body>
    </html>
    ```
*   **Expected Outcome:** `upload_form.html` created.

### Step 1.6: Initial Test
*   **Goal:** Ensure the basic Flask app runs and pages are accessible.
*   **Action (in terminal, with venv activated, from `make_ready_webapp/`):**
    ```bash
    python run.py
    ```
    Open a web browser and go to `http://127.0.0.1:5000/`. Click the link to navigate to the upload page.
*   **Expected Outcome:** Web app runs, homepage and upload form are visible. Submitting the form will show "Files uploaded...".
*   **AI Tip:** Small, testable increments are key.

## Phase 2: File Handling and Basic JSON Parsing

### Step 2.1: Update Flask Route to Handle File Uploads (`app/routes.py`)
*   **Goal:** Save uploaded files and parse them.
*   **Action:** AI, please modify the `upload_files` function in `app/routes.py`:
    ```python
    #... (keep existing imports and UPLOAD_FOLDER_PATH)
    # Add these imports at the top of routes.py
    import json
    from werkzeug.utils import secure_filename

    #... (keep index route)

    def allowed_file(filename):
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in ['json']

    @app.route('/upload', methods=['GET', 'POST'])
    def upload_files():
        if request.method == 'POST':
            spida_file = request.files.get('spida_file')
            katapult_file = request.files.get('katapult_file')

            if not spida_file or spida_file.filename == '':
                return "No SPIDAcalc file selected"
            if not katapult_file or katapult_file.filename == '':
                return "No Katapult file selected"

            if spida_file and allowed_file(spida_file.filename) and \
               katapult_file and allowed_file(katapult_file.filename):
                # For now, we'll just read the content and parse.
                # In a production app, you'd save to a secure temp location or process in memory.
                try:
                    spida_data = json.load(spida_file.stream)
                    katapult_data = json.load(katapult_file.stream)
                except json.JSONDecodeError:
                    return "Invalid JSON file format."
                except Exception as e:
                    return f"An error occurred during file processing: {e}"

                # Placeholder for actual report generation
                # report_filename = "make_ready_report.xlsx"
                # report_path = os.path.join(UPLOAD_FOLDER_PATH, report_filename)
                # Call your report generation logic here, e.g.:
                # from app.report_generator import generate_report
                # generate_report(spida_data, katapult_data, report_path)

                # return send_from_directory(UPLOAD_FOLDER_PATH, report_filename, as_attachment=True)
                return f"SPIDA Data keys: {list(spida_data.keys())}<br>Katapult Data keys: {list(katapult_data.keys())}"
            else:
                return "Invalid file type. Please upload JSON files."
        return render_template('upload_form.html')
    ```
*   **Expected Outcome:** Files can be uploaded, parsed into Python dictionaries. The page will show top-level keys of the JSONs.
*   **Best Practice:** `secure_filename` is good, but here we're parsing directly. Be mindful of security with user uploads in a production environment. For this tool, ensuring they are valid JSON is the primary concern.

### Step 2.2: Create Utility Functions (`app/utils.py`)
*   **Goal:** Create helper functions for safe data access.
*   **Action:** AI, please write the following code into `app/utils.py`:
    ```python
    def get_nested_value(data_dict, path_keys, default=None):
        """
        Safely retrieves a value from a nested dictionary.
        :param data_dict: The dictionary to search.
        :param path_keys: A list of keys representing the path to the value.
        :param default: The value to return if the path is not found.
        :return: The retrieved value or the default.
        """
        current_level = data_dict
        for key in path_keys:
            if isinstance(current_level, dict) and key in current_level:
                current_level = current_level[key]
            elif isinstance(current_level, list) and isinstance(key, int) and 0 <= key < len(current_level):
                current_level = current_level[key]
            else:
                return default
        return current_level

    def convert_spida_height_to_feet(height_obj):
        """
        Converts SPIDAcalc height (METRE) to feet.
        Assumes height_obj is like: {"unit": "METRE", "value": 12.3}
        """
        if not height_obj or height_obj.get("unit") != "METRE":
            return None # Or raise an error, or return 0
        metre_value = height_obj.get("value")
        if metre_value is None:
            return None
        return metre_value * 3.28084 # 1 METRE = 3.28084 FEET

    # Add more conversion functions as needed (e.g., Katapult imperial strings to decimal feet)
    ```
*   **Expected Outcome:** `utils.py` created with helper functions.

## Phase 3: Core Logic - Pole Correlation (This will be refined based on sample data)

### Step 3.1: Define Pole Correlation Strategy (`app/report_generator.py` initially, might move)
*   **Goal:** Implement the function to map SPIDA poles to Katapult nodes.
*   **Action:** AI, in `app/report_generator.py`, create a function `correlate_poles`. Refer to the "Mapping Document - Phase 1, Step 2".
    Primary SPIDAcalc Key: `project.leads[*].locations[*].label`
    Katapult Potential Keys:
    1.  `nodes.[node_id].attributes.PoleNumber.-Imported`
    2.  `nodes.[node_id].attributes.electric_pole_tag.assessment`
    3.  `nodes.[node_id].attributes.DLOC_number.-Imported`
    ```python
    from app.utils import get_nested_value # If you put it there

    def correlate_poles(spida_data, katapult_data):
        """
        Correlates SPIDAcalc poles with Katapult nodes.
        Returns a dictionary mapping: {spida_pole_label: katapult_node_id}
        and a list of SPIDA pole labels that couldn't be correlated.
        """
        spida_poles_map = {} # {label: spida_location_object}
        correlated_map = {}
        unmatched_spida_poles = []

        # 1. Extract SPIDA pole labels and store locations for easy access
        for lead in get_nested_value(spida_data, ['leads'], []):
            for location in get_nested_value(lead, ['locations'], []):
                spida_pole_label = get_nested_value(location, ['label'])
                if spida_pole_label:
                    spida_poles_map[spida_pole_label] = location # Store the whole location object

        # 2. Create a lookup for Katapult nodes by their potential identifiers
        katapult_pole_id_to_node_id = {}
        katapult_nodes = get_nested_value(katapult_data, ['nodes'], {})
        for node_id, node_data in katapult_nodes.items():
            # Try primary Katapult keys
            pole_number_imported = get_nested_value(node_data, ['attributes', 'PoleNumber', '-Imported'])
            if pole_number_imported:
                katapult_pole_id_to_node_id[str(pole_number_imported)] = node_id

            pole_tag_assessment = get_nested_value(node_data, ['attributes', 'electric_pole_tag', 'assessment'])
            if pole_tag_assessment:
                katapult_pole_id_to_node_id[str(pole_tag_assessment)] = node_id
            
            dloc_imported = get_nested_value(node_data, ['attributes', 'DLOC_number', '-Imported'])
            if dloc_imported:
                 katapult_pole_id_to_node_id[str(dloc_imported)] = node_id

            # Add other Katapult potential keys as identified in your mapping/sample data

        # 3. Correlate
        for spida_label, spida_loc_obj in spida_poles_map.items():
            # Try SPIDA label first
            if str(spida_label) in katapult_pole_id_to_node_id:
                correlated_map[spida_label] = {
                    "spida_location": spida_loc_obj,
                    "katapult_node_id": katapult_pole_id_to_node_id[str(spida_label)],
                    "katapult_node_data": katapult_nodes.get(katapult_pole_id_to_node_id[str(spida_label)])
                }
                continue
            
            # Add fallback SPIDA keys if 'label' fails (e.g., clientItemAlias, poleTags)
            # Example for clientItemAlias (conceptual, needs path validation)
            # measured_design = next((d for d in get_nested_value(spida_loc_obj, ['designs'], []) if 
            #                         get_nested_value(d, ['layerType']) == "Measured"), None)
            # if measured_design:
            #     alias = get_nested_value(measured_design, ['structure', 'pole', 'clientItemAlias'])
            #     if alias and str(alias) in katapult_pole_id_to_node_id:
            #         correlated_map[spida_label] = { ... } # as above
            #         continue

            unmatched_spida_poles.append(spida_label)
            
        return correlated_map, unmatched_spida_poles
    ```
*   **Expected Outcome:** A function that can map SPIDA poles to Katapult nodes.
*   **AI Tip:** Test this function with your sample JSONs. Print the `correlated_map` and `unmatched_spida_poles` to verify. This step is critical and might need many iterations based on real data variations.

## Phase 4: Data Extraction Modules (`spida_parser.py`, `katapult_parser.py`)

*   **Goal:** Create functions to extract specific data points for each Excel column from the respective JSON structures, given a single pole/node.
*   **AI Tip:** For each Excel column (A-O), create a dedicated helper function in the appropriate parser file. For example, `get_spida_pole_owner(spida_pole_design_data)` or `get_katapult_pole_owner(katapult_node_data)`.

### Step 4.1: `spida_parser.py` - Column C: Pole Owner
*   **Action:** AI, create `get_spida_pole_owner(pole_design_data)` in `spida_parser.py`.
    ```python
    from app.utils import get_nested_value

    def get_spida_pole_owner(pole_design_data):
        # Assuming pole_design_data is the 'structure.pole' object from a specific design layer
        return get_nested_value(pole_design_data, ['owner', 'id'])
    ```

### Step 4.2: `katapult_parser.py` - Column C: Pole Owner
*   **Action:** AI, create `get_katapult_pole_owner(node_data)` in `katapult_parser.py`.
    ```python
    from app.utils import get_nested_value

    def get_katapult_pole_owner(node_data):
        # This path needs verification based on actual Katapult JSON.
        # It could be attributes.pole_owner_name or attributes.pole_owner.multi_added.one etc.
        # Using a placeholder path, needs adjustment.
        owner_obj = get_nested_value(node_data, ['attributes', 'pole_owner', 'multi_added'])
        # If 'multi_added' is an object like {"-someID": "OwnerName", "one": "-someID"},
        # you might need to refine this. If 'one' key exists and points to another key:
        # primary_key = get_nested_value(owner_obj, ['one'])
        # if primary_key:
        #    return get_nested_value(owner_obj, [primary_key])
        # Or if it's directly under an attribute
        # owner = get_nested_value(node_data, ['attributes', 'pole_owner_name'])
        # For simplicity, if owner_obj is the direct value:
        if isinstance(owner_obj, str): # Or directly check if it's the owner name
             return owner_obj
        # If it's a dict like from multi_added, with 'one' pointing to the actual value's key
        primary_key_for_value = get_nested_value(owner_obj, ['one'])
        if primary_key_for_value and isinstance(owner_obj, dict):
            return owner_obj.get(primary_key_for_value)
        
        return None # Adjust based on actual structure
    ```

### Step 4.3: Continue for ALL other columns (D through O)
*   **Action:** AI, for each column D through O specified in the "Make-Ready Report Generator Mapping Document":
    1.  Identify the SPIDAcalc JSON path(s).
    2.  Create a corresponding function in `spida_parser.py` (e.g., `get_spida_pole_number_label(spida_location_data)`, `get_spida_pole_structure(spida_pole_client_data_entry)`).
    3.  Identify the Katapult JSON path(s).
    4.  Create a corresponding function in `katapult_parser.py` (e.g., `get_katapult_pole_number_imported(node_data)`).
    5.  Crucially implement the logic outlined in the "Detailed Mapping Plan (Column by Column)" document, including:
        *   Distinguishing "Measured" vs. "Recommended" designs in SPIDA.
        *   Handling clientItem lookups in SPIDA.
        *   Logic for "Attachment Action".
        *   Logic for "Proposed Riser/Guy".
        *   Calculations for PLA (if attempting).
        *   Height conversions.
        *   Extraction of existing vs. proposed heights for attachments and mid-spans.
*   **AI Tip:** Do one column at a time. For SPIDA, remember that `clientData` is a library and specific pole/wire/equipment details are found by looking up `clientItem.id` or `clientItemVersion`.
*   **Example (Conceptual) for `spida_parser.py` - Pole Structure (Column E):**
    ```python
    # In spida_parser.py
    def get_spida_pole_definition_by_ref(pole_structure_ref, client_data_poles):
        # pole_structure_ref is like clientItem.id from the pole in a design
        # client_data_poles is the spida_data['clientData']['poles'] list
        for pole_def in client_data_poles:
            # Check main ID or aliases
            if get_nested_value(pole_def, ['id']) == pole_structure_ref: # Assuming id is primary key
                return pole_def
            for alias in get_nested_value(pole_def, ['aliases'], []):
                if get_nested_value(alias, ['id']) == pole_structure_ref:
                    return pole_def
        return None

    def get_spida_pole_structure_string(pole_def_entry):
        if not pole_def_entry:
            return "Unknown"
        species = get_nested_value(pole_def_entry, ['species'], "")
        class_of_pole = get_nested_value(pole_def_entry, ['classOfPole'], "")
        return f"{species} {class_of_pole}".strip()
    ```
*   **Expected Outcome:** `spida_parser.py` and `katapult_parser.py` populated with data extraction functions for each required field.

## Phase 5: Report Generation Logic (`app/report_generator.py`)

### Step 5.1: Main Report Generation Function
*   **Goal:** Orchestrate data extraction, merging, and formatting for the Excel report.
*   **Action:** AI, create/extend `generate_report(spida_data, katapult_data, output_excel_path)` in `app/report_generator.py`.
    ```python
    import pandas as pd
    from app.utils import get_nested_value #, convert_spida_height_to_feet, etc.
    # Import your specific parser functions
    from app.spida_parser import (
        get_spida_pole_owner as spida_owner,
        get_spida_pole_definition_by_ref, # Example from above
        get_spida_pole_structure_string # Example from above
        #... import all other spida_parser functions needed
    )
    from app.katapult_parser import (
        get_katapult_pole_owner as katapult_owner,
        #... import all other katapult_parser functions needed
    )
    # from app.report_generator import correlate_poles # If it's here, or import it
    # Assuming correlate_poles is in this file or imported

    def generate_report(spida_data, katapult_data, output_excel_path):
        correlated_poles, unmatched_spida = correlate_poles(spida_data, katapult_data)
        report_data_rows = []

        # Define your Excel columns in the correct order
        # THIS MUST MATCH YOUR FINAL EXCEL TEMPLATE
        excel_columns = [
            "Operation Number", "Attachment Action (I/R/E)", "Pole Owner",
            "Pole #", "Pole Structure",
            "Proposed Riser", "Proposed Guy", "PLA (%) with proposed attachment", # Combined Column F
            "Construction Grade of Analysis",
            "Height Lowest Com (Existing)", "Height Lowest CPS Electrical (Existing)",
            "Mid-Span From Pole", "Mid-Span To Pole", # Combined Column J
            "Attacher Description", "Existing Attachment Height",
            "Proposed Attachment Height", "Existing Mid-Span", "Proposed Mid-Span"
        ]

        # Loop through correlated SPIDA poles (as per your mapping plan's primary loop)
        for spida_label, correlation_info in correlated_poles.items():
            spida_loc = correlation_info["spida_location"]
            kat_node_id = correlation_info["katapult_node_id"]
            kat_node_data = correlation_info["katapult_node_data"]

            row = {"Operation Number": "MANUAL_ENTRY"} # Placeholder

            # --- Extract data for each column using your parser functions ---
            # --- This is where the detailed mapping logic is critical ---

            # Example for Pole Owner (Column C) - apply precedence
            spida_pole_measured_design = next((d for d in get_nested_value(spida_loc, ['designs'], []) if
                                               get_nested_value(d, ['layerType']) == "Measured"), None)
            
            pole_owner_val = None
            if spida_pole_measured_design:
                spida_pole_obj = get_nested_value(spida_pole_measured_design, ['structure', 'pole'])
                if spida_pole_obj:
                    pole_owner_val = spida_owner(spida_pole_obj)

            if not pole_owner_val and kat_node_data:
                pole_owner_val = katapult_owner(kat_node_data)
            row["Pole Owner"] = pole_owner_val if pole_owner_val else "Unknown"

            # Example for Pole # (Column D) - SPIDA label is primary
            row["Pole #"] = spida_label

            # Pole Structure (Column E)
            # You'll need spida_data['clientData']['poles'] for the lookup
            # client_poles_list = get_nested_value(spida_data, ['clientData', 'poles'], [])
            # pole_ref_id = get_nested_value(spida_pole_obj, ['clientItem', 'id']) # Or clientItemVersion
            # spida_pole_def = get_spida_pole_definition_by_ref(pole_ref_id, client_poles_list)
            # pole_structure_str = get_spida_pole_structure_string(spida_pole_def)
            # if pole_structure_str == "Unknown" and kat_node_data:
            #     # Add logic to get from Katapult if defined
            #     pass
            # row["Pole Structure"] = pole_structure_str
            row["Pole Structure"] = "TODO" # Placeholder
            
            # Attachment Action (Column B) - Complex logic referring to your mapping
            # This will depend on identifying YOUR company's attachment and its changes
            row["Attachment Action (I/R/E)"] = "TODO_Complex_Logic"

            # Column F: Proposed Riser, Guy, PLA
            # spida_pole_recommended_design = next((d for d in get_nested_value(spida_loc, ['designs'], []) if 
            #                                     get_nested_value(d, ['layerType']) == "Recommended"), None)
            # row["Proposed Riser"] = get_spida_proposed_riser(spida_pole_recommended_design, 
            #                                                 spida_data['clientData']['equipments']) # Needs implementation
            # row["Proposed Guy"] = get_spida_proposed_guy(spida_pole_recommended_design) # Needs implementation
            # row["PLA (%) with proposed attachment"] = get_spida_pla(spida_pole_recommended_design) # Needs implementation
            row["Proposed Riser"] = "TODO"
            row["Proposed Guy"] = "TODO"
            row["PLA (%) with proposed attachment"] = "TODO"

            # ... and so on for ALL other columns H-O ...
            # For each column, call the appropriate parser functions, apply precedence,
            # and handle missing data (e.g., with "N/A", "Unknown", or blank).

            row["Construction Grade of Analysis"] = "TODO"
            row["Height Lowest Com (Existing)"] = "TODO"
            row["Height Lowest CPS Electrical (Existing)"] = "TODO"
            row["Mid-Span From Pole"] = spida_label # From pole is the current pole
            row["Mid-Span To Pole"] = "TODO_Find_Other_End"
            row["Attacher Description"] = "TODO_Your_Company_Attachment"
            row["Existing Attachment Height"] = "TODO"
            row["Proposed Attachment Height"] = "TODO"
            row["Existing Mid-Span"] = "TODO"
            row["Proposed Mid-Span"] = "TODO"
            
            report_data_rows.append(row)

        # Handle unmatched SPIDA poles if needed (e.g., add them with only SPIDA data)
        for unmatched_label in unmatched_spida:
            # spida_loc = spida_poles_map[unmatched_label]
            # row = {"Operation Number": "MANUAL_ENTRY", "Pole #": unmatched_label, ... fill with N/A for Katapult}
            # report_data_rows.append(row)
            pass # Decide how to handle these

        df = pd.DataFrame(report_data_rows)

        # Reorder columns to match the Excel template exactly
        # Filter df.columns to only include those present in excel_columns to avoid errors
        # if columns are missing from dataframe (because they were all TODO)
        df_columns_ordered = [col for col in excel_columns if col in df.columns]
        if not df.empty:
            df = df[df_columns_ordered]
        else: # Handle empty dataframe case
            df = pd.DataFrame(columns=excel_columns)

        df.to_excel(output_excel_path, index=False, engine='openpyxl')
        print(f"Report generated: {output_excel_path}")
    ```
*   **Expected Outcome:** A function that takes parsed JSONs and an output path, then generates an Excel file.
*   **AI Tip:** This is the most complex part. Focus on getting the structure for ONE pole/row correct first. Test by printing the row dictionary.

## Phase 6: Connect Backend to Frontend

### Step 6.1: Update Flask Route to Call Report Generator (`app/routes.py`)
*   **Goal:** Call the `generate_report` function and allow download.
*   **Action:** AI, modify the `upload_files` function in `app/routes.py` to call `generate_report` and `send_from_directory`.
    ```python
    #... (keep existing imports, UPLOAD_FOLDER_PATH, allowed_file)
    from app.report_generator import generate_report # Make sure this is imported

    @app.route('/upload', methods=['GET', 'POST'])
    def upload_files():
        if request.method == 'POST':
            #... (file checking logic remains the same) ...
            spida_file = request.files.get('spida_file') # Redefine for clarity within POST
            katapult_file = request.files.get('katapult_file') # Redefine for clarity

            if not spida_file or spida_file.filename == '' or \
               not katapult_file or katapult_file.filename == '':
                return "Both SPIDAcalc and Katapult files must be selected.", 400

            if spida_file and allowed_file(spida_file.filename) and \
               katapult_file and allowed_file(katapult_file.filename):
                try:
                    spida_data = json.load(spida_file.stream)
                    katapult_data = json.load(katapult_file.stream)
                except json.JSONDecodeError:
                    return "Invalid JSON file format.", 400 # Return error code
                except Exception as e:
                    return f"An error occurred during file reading: {e}", 500
                
                try:
                    # Ensure UPLOAD_FOLDER_PATH is defined and accessible
                    # It should be an absolute path or relative to where run.py is executed
                    # For simplicity, let's use a fixed name for now
                    report_filename = "make_ready_report.xlsx"
                    # Construct absolute path for output
                    # base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__))) # project root (app is one level down)
                    # If routes.py is in app/, and output/ is at project root:
                    # output_dir = os.path.join(os.path.dirname(app.root_path), 'output')
                    # Simpler if UPLOAD_FOLDER_PATH is already correctly defined relative to project root
                    # and accessible from where generate_report might be called or where files are written.
                    # Let's assume UPLOAD_FOLDER_PATH is already the correct output directory path.
                    if not os.path.exists(UPLOAD_FOLDER_PATH):
                        os.makedirs(UPLOAD_FOLDER_PATH)
                    report_full_path = os.path.join(UPLOAD_FOLDER_PATH, report_filename)

                    generate_report(spida_data, katapult_data, report_full_path)

                    return send_from_directory(directory=UPLOAD_FOLDER_PATH, 
                                               path=report_filename, # Changed from filename= to path= for Flask 2.x+
                                               as_attachment=True)
                except Exception as e:
                    # Log the exception e for debugging
                    print(f"Error during report generation: {e}") # Server-side log
                    return f"An error occurred during report generation: {e}", 500
            else:
                return "Invalid file type. Please upload JSON files.", 400
        return render_template('upload_form.html')
    ```
*   **Expected Outcome:** Upon successful processing, the browser should download the generated Excel file.

## Phase 7: Testing, Refinement, and Documentation

### Step 7.1: Thorough Testing
*   **Goal:** Test with all your sample data, verify all columns, edge cases, and error handling.
*   **Action:** Use the web app to upload various combinations of your sample JSON files.
*   **Action:** Manually cross-reference the generated Excel reports with the source JSONs and your mapping document.
*   **Expected Outcome:** Report accurately reflects the data as per the mapping.

### Step 7.2: Code Comments and Docstrings
*   **Goal:** Make the code understandable and maintainable.
*   **Action:** AI, go through all Python files (`.py`) and add:
    *   Module-level docstrings explaining the purpose of each file.
    *   Function-level docstrings explaining what each function does, its parameters, and what it returns.
    *   Inline comments for complex or non-obvious logic.
*   **Expected Outcome:** Well-commented code.

### Step 7.3: Create a README.md
*   **Goal:** Provide instructions for setting up and running the project.
*   **Action:** AI, create a README.md file in the project root with:
    *   Project title and brief description.
    *   Prerequisites (Python 3.x, pip).
    *   Setup instructions (create virtual env, install requirements).
    *   How to run the web application (`python run.py`).
    *   How to use the web application (navigate to URL, upload files).
*   **Expected Outcome:** A helpful README.md file.

## Next Steps (Beyond MVP, for AI to consider later):

*   **Advanced Frontend:** Use JavaScript `fetch` API for asynchronous file uploads, progress bars, and better error display without page reloads.
*   **Celery/Task Queues:** For long-running report generation, offload processing to a background task queue to prevent web request timeouts.
*   **More Sophisticated Error Reporting:** Logging errors to a file, more user-friendly error pages.
*   **Configuration File:** For settings like upload folder, allowed extensions, etc.
*   **Automated Testing Framework:** Implement `pytest` for more structured unit and integration tests.