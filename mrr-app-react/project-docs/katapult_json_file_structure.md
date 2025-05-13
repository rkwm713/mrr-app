# Katapult JSON File Structure

## Top-Level Object:

*   `connections` (Object): Contains connection data, where each key is a unique connection ID (e.g., `"-OJ_PU-ftGPy7TovEc5a"`). Each connection object has:
    *   `_created` (Object): Metadata about the creation of the connection.
        *   `method` (String): Method of creation, e.g., `"desktop"` or `"mobile"`.
        *   `timestamp` (Number): Timestamp of creation.
        *   `uid` (String): User ID of the creator.
    *   `attributes` (Object): Contains various attributes of the connection. Each key is an attribute name (e.g., `"connection_type"`, `"manually_override_connection_length"`). The value is often an object containing:
        *   `button_added` (String or Boolean): Indicates how the attribute was added or its state.
        *   `auto` (Boolean, optional): Indicates if the attribute was automatically set.
        *   Other fields specific to the attribute.
    *   `button` (String): Type of connection, e.g., `"aerial_path"`, `"SERVICE_poly_path"`, `"anchor"`, `"ref"`, `"join_aerial"`, `"aerial"`, `"UG_poly_path"`.
    *   `node_id_1` (String): ID of the starting node for the connection.
    *   `node_id_2` (String): ID of the ending node for the connection.
    *   `sections` (Object, optional): Contains section data for the connection, where each key is a unique section ID (e.g., `"-OJj4T5K3z3UV0YPI68v"`) or `"midpoint_section"`. Each section object has:
        *   `_created` (Object): Metadata about the creation of the section (similar to connection `_created`).
        *   `latitude` (Number): Latitude of the section point.
        *   `longitude` (Number): Longitude of the section point.
        *   `multi_attributes` (Object): Contains attributes specific to this section.
            *   `field_completed` (Object, optional):
                *   `value` (Boolean): Indicates if field work is complete for this section.
            *   `mr_state` (Object, optional):
                *   `auto_calced` (String): Automatically calculated make-ready state, e.g., `"MR Resolved"`, `"No MR"`.
            *   `photo_classified` (Object, optional):
                *   `multi_added` (Boolean): Indicates if photos were added in a multi-add process.
            *   `time_bucket` (Object, optional): Tracks time spent on this section. Keys are unique IDs.
                *   `start` (Number): Start timestamp.
                *   `stop` (Number): Stop timestamp.
                *   `uid` (String): User ID for this time entry.
            *   `note` (Object, optional): Contains notes for the section. Keys are unique note IDs.
                *   The value is a string containing the note text.
            *   `photos` (Object, optional): Contains photo associations for this section. Keys are photo UUIDs.
                *   Each photo association object has:
                    *   `association` (String or Boolean): Type of association, e.g., `true`, `"main"`.
                    *   `association_type` (String): How the association was made, e.g., `"auto"`, `"manual"`.
        *   `breakpoints` (Array of Arrays of Numbers, optional): For polygonal paths (like service drops or UG paths), contains an array of `[latitude, longitude]` pairs defining the path's vertices.

*   `date_created` (Number): Timestamp of the job creation.
*   `geohash` (Object): Contains geohash data for map rendering. Keys are node IDs, connection ID segments (e.g., `"connectionID~1"`), or section IDs.
    *   Each geohash entry contains properties for map display:
        *   `c` (String): Color (hex or rgba).
        *   `g` (String): Geohash string.
        *   `i` (String): Icon identifier, e.g., `"katapult-map:asterisk"`, `"katapult-map:bullseye"`.
        *   `is` (Array of Objects, optional): Array of icon styles for different zoom levels/conditions.
            *   `c` (String): Color.
            *   `i` (String): Icon identifier.
            *   `m` (Number, optional): Unknown purpose, e.g., `1`.
            *   `s` (String or Number, optional): Size.
            *   `u` (String, optional): Identifier.
            *   `z` (Number, optional): Zoom level or z-index.
            *   `o` (Number, optional): Opacity.
            *   `p` (String, optional): Pattern, e.g., `"solid"`, `"dashed"`.
            *   `w` (Number, optional): Width.
        *   `l` (Array of Numbers): Latitude and longitude coordinates.
        *   `l2` (Array of Numbers, for connections/sections): Latitude and longitude of the second point for line rendering.
        *   `m` (Number, optional): Unknown purpose, e.g., `1`.
        *   `n` (Object, for nodes): Contains connected connection IDs as keys with a value of `1`.
        *   `s` (String or Number, optional): Size.
        *   `t` (String): Type, e.g., `"n"` (node), `"c"` (connection), `"s"` (section).
        *   `u` (String, optional): Identifier.
        *   `z` (Number, optional): Zoom level or z-index.
        *   `d` (Number, for connections/sections): Length or distance.
        *   `o` (Number, optional): Opacity.
        *   `p` (String, optional): Pattern, e.g., `"solid"`, `"dashed"`.
        *   `w` (Number, optional): Width.
        *   `b` (Array of Arrays of Numbers, for polygonal connections): Breakpoints.

*   `job_auth_token` (Object): Authentication tokens.
    *   `default` (Object):
        *   `token` (String): Authentication token.
        *   `valid` (Boolean): Whether the token is valid.

*   `job_creator` (String): Creator of the job, e.g., `"techserv_CPS_ENERGY"`.
*   `job_owner` (String): Owner of the job, e.g., `"techserv"`.
*   `last_upload` (Number): Timestamp of the last upload.
*   `layers` (Object): Defines map layers.
    *   `list` (Object): Contains layer definitions, where each key is a unique layer ID.
        *   Each layer object has:
            *   `color` (String): Hex color code for the layer.
            *   `name` (String): Name of the layer.
            *   `order` (Number): Display order of the layer.
            *   `storage_file_name` (String): Filename for the layer data.
            *   `type` (String): Type of layer, e.g., `"shapefile"`.

*   `map_styles` (Object): Defines map styling rules.
    *   `default` (Object): Contains default styling rules.
        *   `_counter` (Number): A counter, purpose unknown.
        *   `_default_published` (Boolean): Whether the style is the default published style.
        *   `_name` (String): Name of the style, e.g., `"Charter_CPS-Energy"`.
        *   `_note` (String): Notes about the style.
        *   `connections` (Array of Objects): Styling rules for connections based on attributes. Each rule object has:
            *   `attribute` (String): The attribute to check, e.g., `"connection_type"`.
            *   `color` (String): Color to apply (hex or rgba).
            *   `comparator` (String): How to compare the attribute value, e.g., `"equals"`.
            *   `id` (String): Unique identifier for the style rule.
            *   `pattern` (String): Line pattern, e.g., `"solid"`, `"dashed"`.
            *   `value` (String or Object): The value to compare against. Can be a string or an object for complex conditions.
            *   `width` (Number): Line width.
        *   `nodes` (Array of Objects): Styling rules for nodes based on attributes. Each rule object has:
            *   `attribute` (String): The attribute to check, e.g., `"node_type"`, `"field_completed"`.
            *   `color` (String): Color to apply (hex or rgba).
            *   `comparator` (String): How to compare, e.g., `"equals"`, `"does not equal"`, `"has"`.
            *   `icon` (String): Icon identifier, e.g., `"maps:place"`, `"katapult-map:bullseye"`.
            *   `id` (String): Unique identifier for the style rule.
            *   `size` (String or Number): Size of the icon/node.
            *   `stackable` (Boolean, optional): Whether icons can be stacked.
            *   `value` (String, Boolean, or Object): The value to compare against.
        *   `sections` (Array of Objects): Styling rules for sections (similar structure to nodes and connections rules).

*   `name` (String): Name of the job/project, e.g., `"CPS_6457E_03"`.
*   `nodes` (Object): Contains node data, where each key is a unique node ID (e.g., `"-OJ_PMjpiNrD4UyTOJSz"`). Each node object has:
    *   `_created` (Object): Metadata about the creation of the node (similar to connection `_created`).
    *   `attributes` (Object): Contains various attributes of the node. Each key is an attribute name (e.g., `"DLOC_number"`, `"pole_height"`).
        *   The value can be a simple type (String, Number, Boolean) or an object.
        *   For attributes that can have multiple entries or versions, the value is an object where keys are unique IDs (e.g., `"-Imported"`, `"-OL-T23Q1l-JgvxhHg2J"`) and values are the attribute's value for that entry/version (can be a string, number, or object).
        *   Common sub-fields include `button_added` (how it was added), `auto_calced` (auto-calculated value), `assessment` (measured value), `one` (primary value), `multi_added` (if added via multi-add).
    *   `button` (String): Type of node, e.g., `"aerial_path"`, `"SERVICE_poly_path"`, `"anchor"`, `"ref"`, `"charter_FA_assessment"`.
    *   `latitude` (Number): Latitude of the node.
    *   `longitude` (Number): Longitude of the node.
    *   `photos` (Object, optional): Contains photo associations for this node. Keys are photo UUIDs.
        *   Each photo association object has:
            *   `association` (String or Boolean): Type of association, e.g., `true`, `"main"`.
            *   `association_type` (String): How the association was made, e.g., `"auto"`, `"manual"`.
    *   `numAssociated` (Number): Total number of associated photos.
    *   `numPhotos` (Number): Total number of photos.
    *   `numTagged` (Number): Number of tagged photos.
    *   `numUploaded` (Number): Number of uploaded photos.
    *   `photo_folders` (Object): Information about photo folders.
        *   Each key is a folder ID (e.g., `"-OJxWccCX35h4Sbc2-Nv"`).
            *   `cameras` (Object): Information about cameras used within this folder. Keys are camera IDs.
                *   Each camera object has `date_created`, `numAssociated`, `numPhotos`, `numTagged`, `numUploaded`.
            *   `date_created` (Number): Timestamp of folder creation.
            *   `done` (Boolean): Whether processing for this folder is done.
            *   `job_id` (String): Job ID associated with the folder.
            *   `last_upload` (Number): Timestamp of the last upload to this folder.
            *   `numAssociated`, `numPhotos`, `numTagged`, `numUploaded` (Number): Photo counts for the folder.
            *   `status` (String): Current status of the folder, e.g., `"Tagging"`.
    *   `photo_summary` (Object): Summary information for each photo, keyed by photo UUID.
        *   Each photo summary object contains:
            *   `associated` (Boolean): Whether the photo is associated with a location/section.
            *   `data` (Boolean, optional): Indicates if data has been extracted/processed from the photo.
            *   `height` (Boolean, optional): Indicates if height measurements are available from the photo.
            *   `name` (String): Filename of the photo, or a placeholder like `"(No Name)"`.
            *   `tags` (String, optional): Tags associated with the photo, e.g., `"Blank Photos"`.
            *   `camera_id` (String, optional): ID of the camera used.
            *   `camera_make` (String, optional): Camera manufacturer.
            *   `camera_model` (String, optional): Camera model.
            *   `camera_serial_number` (String, optional): Camera serial number.
            *   `date_taken` (Number, optional): Timestamp when the photo was taken.
            *   `f_number` (Number, optional): Aperture value.
            *   `filename` (String, optional): Original filename.
            *   `focal_length` (Number, optional): Focal length.
            *   `folder_id` (String, optional): ID of the folder the photo belongs to.
            *   `image_height` (Number): Height of the image in pixels.
            *   `image_width` (Number): Width of the image in pixels.
            *   `iso` (Number, optional): ISO speed.
            *   `lens` (String, optional): Lens model.
            *   `name_date` (String, optional): Combination of name and date.
            *   `orientation` (Number, optional): Image orientation metadata.
            *   `original_size` (Number, optional): Original file size in bytes.
            *   `shutter_speed` (Number, optional): Shutter speed.
            *   `status` (String, optional): Upload status, e.g., `"upload_complete"`.
            *   `synced_time` (Number, optional): Timestamp of synchronization.
            *   `upload_date` (Number, optional): Timestamp of upload.
            *   `uploaded_by` (String, optional): User ID of the uploader.
            *   `vignetting_correction` (String, optional): Vignetting correction data.
            *   `vignetting_correction_2` (String, optional): Additional vignetting correction data.
            *   `photofirst_data` (Object, optional): Data extracted from photogrammetry or first-pass analysis. This is a complex nested object that includes:
                *   `_editors` (Object): User IDs and timestamps of edits.
                *   `anchor_calibration` (Object): Calibration data for anchors, keyed by unique IDs.
                    *   `_routine_instance_id` (String).
                    *   `_score` (Number, optional).
                    *   `height` (String): Calibrated height.
                    *   `pixel_selection` (Array of Objects): X and Y percentage coordinates of the selection.
                *   `ground_marker` (Object): Information about the ground marker.
                    *   `auto_added` (Object):
                        *   `_measured_height` (Number).
                        *   `_routine_instance_id` (String).
                        *   `over` (String): Surface type, e.g., `"Yard"`, `"Roadway ROW"`.
                        *   `pixel_selection` (Array of Objects).
                        *   `mr_resolved` (Boolean, optional).
                *   `midspanHeight` (Object): Midspan height data.
                    *   Keyed by a unique ID, value contains `_routine_instance_id` and `over` (String).
                *   `wire` (Object): Information about wires identified in the photo, keyed by unique IDs.
                    *   `_exists` (Boolean, optional).
                    *   `_measured_height` (Number): Measured height.
                    *   `_trace` (String): ID of the trace this wire belongs to.
                    *   `diameter` (String): Wire diameter.
                    *   `pixel_selection` (Array of Objects).
                    *   `mr_move` (String or Number, optional): Make-ready movement.
                    *   `mr_resolved` (Boolean, optional).
                    *   `_effective_moves` (Object, optional): Effective moves considering multiple photos.
                *   `arm` (Object, optional): Information about cross-arms.
                *   `birthmark` (Object, optional): Pole birthmark data.
                *   `equipment` (Object, optional): Equipment data.
                *   `guying` (Object, optional): Guy wire data.
                *   `poleHeight` (Object, optional): Pole height calibration data.
                *   `pole_top` (Object, optional): Pole top data.
                *   `tag` (Object, optional): Pole tag data.
            *   `skip_url_signing` (Boolean, optional): If true, URLs don't require signing.
            *   `url_extra_large`, `url_large`, `url_small`, `url_tiny` (String): URLs to different sizes of the image.

*   `photos` (Object): Detailed information about each photo, keyed by photo UUID. This object is very similar in structure to `photo_summary` but may contain more raw or less processed data initially. It also includes the `photofirst_data` object with detailed measurements and annotations.
*   `project_folder` (String): Path to the project folder, e.g., `"techserv/Charter/CPS/TX/6457E"`.
*   `sharing` (Object): Sharing permissions for the project.
    *   Key is the user/group (e.g., `"techserv"`), value is the permission level (e.g., `"write"`).
*   `traces` (Object): Defines logical traces (like cables or guy wires) that connect various components.
    *   `trace_data` (Object): Contains individual trace definitions, keyed by unique trace IDs (e.g., `"-OKgrAOGdWZixzTDtIzO"`).
        *   Each trace object has:
            *   `_trace_type` (String): Type of trace, e.g., `"cable"`, `"down_guy"`, `"equipment"`.
            *   `cable_type` (String, if `_trace_type` is `"cable"`): Specific type of cable, e.g., `"Supply Fiber"`, `"Primary"`, `"Neutral"`, `"Com Drop"`.
            *   `company` (String): Owning company, e.g., `"CPS ENERGY"`, `"AT&T"`, `"Spectrum"`.
            *   `label` (String): Optional label for the trace.
            *   `proposed` (Boolean, optional): Indicates if the trace is proposed.
    *   `trace_items` (Object): Maps photo UUIDs to the traces visible or annotated in that photo.
        *   Each key is a photo UUID. The value is an object where keys are trace IDs and values are objects indicating the presence of that trace in the photo (often an empty object `{}` or an object with specific annotation details if available, though not detailed in this snippet).

*   `warning_reports` (Object): Contains information about warnings or QC issues.
    *   `general_qc` (Object):
        *   `hidden_warnings` (Object): A dictionary where keys are unique warning identifiers (often concatenating node/section IDs and a warning type) and values are `true` if the warning is hidden/acknowledged.

This schema is highly detailed and geared towards capturing field data (including photos and precise measurements), managing project attributes, and tracking the status of various components and make-ready engineering tasks. The use of unique IDs for almost every entity (connections, nodes, sections, photos, traces, attributes within nodes) allows for a flexible and relational data structure.