# Roadmap: JSON to Excel Make-Ready Report Automation

**Project Goal:** To develop a robust and maintainable solution that automates the generation of an Excel-based make-ready report by accurately extracting, transforming, correlating, and mapping data from SPIDAcalc and Katapult Pro JSON files. [cite: 1]

**Dev:** Ryan Miller [cite: 2]

## Phase 1: Initiation & Planning (IP)

**Objective:** Define project scope, objectives, requirements, resources, and risks. [cite: 3] Solidify the understanding of input data and desired output. [cite: 3]

* **IP-T1: Kick-off Meeting & Scope Definition**
    * **Action:** Clearly define the "must-have" vs. "nice-to-have" features for the initial version. [cite: 4]
    * **Deliverable:** Project Charter Document (including scope, objectives, success criteria). [cite: 4]
    * **Confirm:** Finalize the exact Excel report template to be generated. [cite: 5] Identify all columns and their precise meaning/derivation rules. [cite: 5]
    * **Clarify:** Define the definition of an "attachment" for the report (e.g., is it one row per pole, or one row per specific make-ready action on a pole?). [cite: 6] This roadmap currently assumes one row per pole, focusing on a primary proposed attachment. [cite: 6] Adjustments will be needed if the granularity is per action. [cite: 7]
* **IP-T2: Requirements Gathering & Refinement**
    * **Action:** Review the detailed data mapping plan (previously created). [cite: 8] Identify any ambiguities or edge cases. [cite: 8]
    * **Deliverable:** Finalized Data Mapping Document. [cite: 9] List of specific business rules for data transformation (e.g., unit conversions, default values, handling of "I/R/E" logic). [cite: 9]
    * **Confirm:** How will the script/tool be invoked? (e.g., command-line, simple UI). [cite: 10]
    * **Identify:** What are the expected input parameters? (e.g., file paths to SPIDAcalc JSON, Katapult Pro JSON, output Excel file name). [cite: 11]
* **IP-T3: Resource Allocation & Timeline**
    * **Action:** Identify personnel for development, testing, and SME (Subject Matter Expert) consultation. [cite: 12]
    * **Deliverable:** High-level project timeline with key milestones. [cite: 13] Resource plan. [cite: 13]
* **IP-T4: Risk Assessment & Mitigation Planning**
    * **Action:** Identify potential risks (e.g., variations in JSON structure, complex correlation logic, missing data, evolving requirements). [cite: 14]
    * **Deliverable:** Risk Register with mitigation strategies. [cite: 14]
* **IP-T5: Obtain Sample Data**
    * **Action:** Gather a diverse set of representative SPIDAcalc and Katapult Pro JSON files. [cite: 15] Include examples of different scenarios, complexities, and potential edge cases (e.g., poles with many attachments, missing pole tags, different types of make-ready actions). [cite: 15]
    * **Deliverable:** Curated set of sample JSON files for development and testing. [cite: 16]

## Phase 2: Environment Setup & Tooling (EST)

**Objective:** Prepare the development environment and select appropriate tools and libraries. [cite: 17]

* **EST-T1: Choose Programming Language & Core Libraries**
    * **Action:** Based on team expertise and project needs, select a language (e.g., Python, JavaScript/Node.js). [cite: 18]
    * **Python Recommendation:** [cite: 19]
        * JSON processing: `json` (built-in) [cite: 19]
        * Data manipulation: `pandas` (excellent for tabular data and Excel output) [cite: 19]
        * Excel writing: `openpyxl` or `xlsxwriter` (often used with pandas) [cite: 19]
    * **JavaScript/Node.js Recommendation:**
        * JSON processing: `JSON.parse()` (built-in) [cite: 20]
        * Data manipulation: Consider libraries like `lodash` or plain JavaScript objects/arrays. [cite: 20]
        * Excel writing: `exceljs` or `xlsx`. [cite: 20]
    * **Deliverable:** Decision on programming language and core libraries. [cite: 21]
* **EST-T2: Setup Development Environment**
    * **Action:** Install necessary language interpreters/compilers, IDEs (e.g., VS Code, PyCharm), and version control (Git). [cite: 22]
    * **Deliverable:** Functional development environment for each developer. [cite: 22]
* **EST-T3: Version Control Setup**
    * **Action:** Initialize a Git repository (e.g., on GitHub, GitLab, Bitbucket). [cite: 23] Define branching strategy (e.g., main/develop, feature branches). [cite: 23]
    * **Deliverable:** Shared Git repository. [cite: 24]

## Phase 3: Data Exploration & Schema Validation (DESV)

**Objective:** Deeply understand the structure and content of the sample JSON files. [cite: 25] Validate assumptions made in the data mapping plan. [cite: 25]

* **DESV-T1: Analyze Sample JSON Structures**
    * **Action:** Manually inspect and programmatically explore the sample JSON files. [cite: 26]
    * **Verify:** Confirm the actual paths to data points identified in the mapping plan. [cite: 27] Note any discrepancies or variations from the provided PDF schema documents. [cite: 27]
    * **Identify:** Pay close attention to dynamic keys in Katapult (e.g., within attributes, photofirst_data). [cite: 28] Document common patterns. [cite: 28]
    * **Deliverable:** Updated Data Mapping Document with validated JSON paths and notes on structural variations. [cite: 29]
* **DESV-T2: Develop Utility Functions for Data Access**
    * **Action:** Create helper functions to safely access nested data in JSONs (e.g., a function that takes a path string like `obj.key1.key2[0].key3` and returns the value or a default if the path is invalid). [cite: 30] This improves code readability and error handling. [cite: 31]
    * **Deliverable:** Set of utility functions for JSON navigation. [cite: 31]
* **DESV-T3: Investigate Pole Correlation Keys**
    * **Action:** Test the reliability of chosen pole correlation keys across all sample data. [cite: 32]
    * **Determine:** What is the most robust combination of fields for linking SPIDAcalc locations to Katapult nodes? [cite: 33]
    * **Deliverable:** Confirmed strategy and specific field names for pole correlation. [cite: 34]

## Phase 4: Development - Data Extraction & Transformation Logic (DETL)

**Objective:** Implement the core logic for extracting data from individual JSON files and transforming it as per the mapping plan. [cite: 35]

* **DETL-T1: Implement SPIDAcalc Data Extractor Module**
    * **Action:** Develop functions to load a SPIDAcalc JSON and extract all required fields for a single pole/location. [cite: 36]
    * **Implement:** Logic for distinguishing "Measured Design" vs. "Recommended Design". [cite: 36]
    * **Implement:** Unit conversions (metric to imperial where needed). [cite: 37]
    * **Handle:** Logic for inferring data (e.g., "Proposed Riser/Guy" from equipment/guy arrays). [cite: 37]
    * **Deliverable:** SPIDAcalc data extraction module with unit tests for key functions. [cite: 37]
* **DETL-T2: Implement Katapult Pro Data Extractor Module**
    * **Action:** Develop functions to load a Katapult Pro JSON and extract all required fields for a single node. [cite: 38]
    * **Implement:** Logic for navigating dynamic attribute keys. [cite: 39]
    * **Implement:** Logic for accessing `photofirst_data` and interpreting measurements (e.g., `_measured_height`, `mr_move`). [cite: 39]
    * **Implement:** Unit conversions (e.g., feet-inches strings to numerical feet). [cite: 40]
    * **Implement:** Logic for inferring "Attachment Action (I/R/E)" based on proposed flags, `mr_move` values, etc. [cite: 41]
    * **Deliverable:** Katapult Pro data extraction module with unit tests. [cite: 41]
* **DETL-T3: Develop Transformation and Calculation Functions**
    * **Action:** Implement functions for any complex transformations or calculations (e.g., concatenating pole structure, calculating proposed heights from existing + move, deriving PLA if not direct).
    * **Deliverable:** Module for data transformations with unit tests.

## Phase 5: Development - Pole Correlation & Data Merging (PCDM)

**Objective:** Implement the logic to correlate poles between the two systems and merge their data into a unified structure for report generation.

* **PCDM-T1: Implement Pole Correlation Module**
    * **Action:** Based on DESV-T3, build the logic to create a mapping between SPIDAcalc locations and Katapult nodes. [cite: 42]
    * **Handle:** Scenarios where a pole exists in one system but not the other. [cite: 42]
    * **Deliverable:** Pole correlation module. [cite: 42]
* **PCDM-T2: Implement Data Merging Logic**
    * **Action:** Create a main processing loop that iterates through SPIDAcalc locations (or your primary data source for looping). [cite: 43]
        For each pole: [cite: 43]
        1.  Extract SPIDAcalc data using DETL-T1 module. [cite: 43]
        2.  Find the correlated Katapult node using PCDM-T1 module. [cite: 43]
        3.  If Katapult node found, extract Katapult data using DETL-T2 module. [cite: 44]
        4.  Merge data from both sources, applying rules for precedence (e.g., if Pole Owner exists in both, which one to use?). [cite: 45]
        5.  Apply any final transformations using DETL-T3 module. [cite: 46]
    * **Deliverable:** Core data processing script/module that produces a list of structured data objects (e.g., one object per Excel row). [cite: 46]

## Phase 6: Development - Excel Report Generation (ERG)

**Objective:** Implement the functionality to write the processed data to an Excel file matching the specified template. [cite: 47]

* **ERG-T1: Implement Excel Writing Module**
    * **Action:** Using the chosen library (e.g., pandas `to_excel`, `openpyxl`, `exceljs`), write the list of structured data objects (from PCDM-T2) to an Excel spreadsheet. [cite: 48]
    * **Ensure:** Column order matches the template. [cite: 49]
    * **Implement:** Basic formatting (e.g., header styles, column widths) if required. [cite: 49]
    * **Deliverable:** Excel generation module. [cite: 49]
* **ERG-T2: Implement Main Script/Application Entry Point**
    * **Action:** Create the main executable script that: [cite: 50]
        1.  Takes input file paths (SPIDA JSON, Katapult JSON, output Excel path). [cite: 50]
        2.  Calls the data loading, correlation, processing, and Excel generation modules in sequence. [cite: 51]
        3.  Includes error handling and logging. [cite: 52]
    * **Deliverable:** Runnable application/script. [cite: 52]

## Phase 7: Testing & Quality Assurance (TQA)

**Objective:** Ensure the accuracy, reliability, and robustness of the solution. [cite: 53]

* **TQA-T1: Unit Testing**
    * **Action:** Write unit tests for all critical functions, especially data extraction, transformation, and correlation logic. [cite: 54] (Should be ongoing during DETL, PCDM). [cite: 55]
    * **Deliverable:** Comprehensive suite of unit tests. [cite: 55]
* **TQA-T2: Integration Testing**
    * **Action:** Test the interaction between different modules (e.g., does the output of the SPIDA extractor feed correctly into the merger?). [cite: 56]
    * **Deliverable:** Integration test cases and results. [cite: 57]
* **TQA-T3: End-to-End Testing with Sample Data**
    * **Action:** Run the complete script with various sample JSON file pairs. [cite: 58]
    * **Manually verify:** Compare the generated Excel reports against expected outputs (which may require manual cross-referencing of JSONS for a few test cases). [cite: 58]
    * **Check:** All columns, data transformations, unit conversions, and edge case handling. [cite: 59]
    * **Deliverable:** Test reports, bug list. [cite: 59]
* **TQA-T4: User Acceptance Testing (UAT)**
    * **Action:** Have end-users (e.g., engineers who will use the report) test the tool with real-world (but non-production critical) data. [cite: 60]
    * **Gather:** Feedback on usability, accuracy, and completeness. [cite: 61]
    * **Deliverable:** UAT sign-off or list of required changes. [cite: 61]
* **TQA-T5: Bug Fixing & Refinement**
    * **Action:** Address bugs and issues identified during all testing phases. [cite: 62]
    * **Deliverable:** Updated and stabilized codebase. [cite: 62]

## Phase 8: Deployment & Documentation (DD)

**Objective:** Make the solution available to users and provide necessary documentation. [cite: 63]

* **DD-T1: Prepare Deployment Package**
    * **Action:** If necessary, package the application (e.g., create an executable, bundle dependencies). [cite: 64]
    * **Deliverable:** Deployment package or clear instructions for running the script. [cite: 65]
* **DD-T2: Write User Documentation**
    * **Action:** Create a user guide explaining: [cite: 66]
        * How to install/setup (if applicable). [cite: 66]
        * How to run the script/tool. [cite: 66]
        * Input requirements (file formats, naming conventions). [cite: 66]
        * Description of the output Excel report. [cite: 67]
        * Troubleshooting common issues. [cite: 67]
    * **Deliverable:** User Manual. [cite: 67]
* **DD-T3: Write Technical Documentation**
    * **Action:** Document the code structure, key algorithms, data mapping logic, and dependencies for future maintenance and development. [cite: 68]
    * **Ensure:** Code is well-commented. [cite: 69]
    * **Deliverable:** Technical/Developer Documentation. [cite: 69]
* **DD-T4: User Training (Optional)**
    * **Action:** Conduct a training session for end-users if needed. [cite: 70]
    * **Deliverable:** Training materials (if any). [cite: 70]
* **DD-T5: Go-Live/Deployment**
    * **Action:** Release the tool for production use.
    * **Deliverable:** Deployed solution. [cite: 71]

## Phase 9: Maintenance & Iteration (MI) (Ongoing)

**Objective:** Support users, fix bugs, and implement enhancements over time. [cite: 72]

* **MI-T1: Post-Deployment Support**
    * **Action:** Address user queries and issues that arise after deployment. [cite: 72]
    * **Deliverable:** Ongoing support. [cite: 72]
* **MI-T2: Bug Fixing**
    * **Action:** Fix any new bugs discovered in production. [cite: 73]
    * **Deliverable:** Patches and updates. [cite: 73]
* **MI-T3: Feature Enhancements**
    * **Action:** Based on user feedback and evolving needs, plan and implement new features or improvements (e.g., support for new JSON schema versions, additional report columns, improved UI). [cite: 74]
    * **Deliverable:** New versions of the tool. [cite: 75]
* **MI-T4: Regular Review & Refinement**
    * **Action:** Periodically review the tool's performance, accuracy, and relevance. [cite: 76]
    * **Consider:** Changes in SPIDAcalc or Katapult Pro export formats. [cite: 76]
    * **Deliverable:** Maintenance log and plans for future updates. [cite: 76]

## Best Practices to Follow:

* **Version Control (Git):** Commit frequently with clear messages. [cite: 77] Use branches for features and bug fixes. [cite: 77]
* **Modular Code:** Break down the problem into smaller, manageable functions and modules. [cite: 78]
* **Clear Naming Conventions:** Use descriptive names for variables, functions, and files. [cite: 79]
* **Code Comments:** Explain complex logic, assumptions, and "why" something is done. [cite: 80]
* **Error Handling:** Implement robust error handling (e.g., try-except blocks) to manage issues like missing files, incorrect JSON formats, or missing data keys. [cite: 81] Log errors effectively. [cite: 82]
* **Configuration:** Externalize configurable parameters (e.g., default file paths, specific mapping keys if they might change) instead of hardcoding them. [cite: 82]
* **Testing:** Write tests as you develop. [cite: 83] Aim for good test coverage. [cite: 83]
* **Iterative Development:** Don't try to build everything perfectly at once. [cite: 84] Get a basic version working and then iterate and refine. [cite: 84]
* **Regular Communication:** Keep stakeholders informed of progress, challenges, and changes. [cite: 85]

This roadmap provides a structured approach. [cite: 86] You may need to adjust tasks based on your specific resources and the complexity encountered in the data. Good luck! [cite: 86]