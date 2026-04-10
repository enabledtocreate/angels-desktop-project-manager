# DATABASE_SCHEMA: Angel's Project Manager

> Managed document. Must comply with template DATABASE_SCHEMA.template.md.

<!-- APM:DATA
{
  "docType": "database_schema",
  "version": 1,
  "markdown": "# Database Schema: Angel's Project Manager\n\n## 1. Schema Overview\n\n### 1.1 Purpose\n\n<\u0021--\nAPM-ID: database-schema-overview-purpose-schema-purpose\nAPM-LAST-UPDATED: 2026-04-03\n--\u003e\n\nObserved SQLite schema imported from the live Angel's Project Manager runtime database to regenerate DATABASE_SCHEMA.md and DATABASE_SCHEMA.dbml.\n\n### 1.2 Storage Strategy\n\n<\u0021--\nAPM-ID: database-schema-overview-storage-strategy-storage-strategy\nAPM-LAST-UPDATED: 2026-04-03\n--\u003e\n\nPrimary dialect: sqlite. Imported from sqlite database. Confidence: observed.\n\n_Last updated: 2026-04-03_\n\n### 1.3 Sync Status\n\n- Intended Version: 0\n- Observed Version: 0\n- Sync Status: unverified\n- Drift Severity: low\n- Change Source: unknown\n- Pending Migration Status: comparison_required\n- Recommended Action: capture_or_compare\n\n- Action Summary: Capture an observed schema or define the intended schema to begin tracking drift.\n- Drift Summary: No schema comparison has been recorded yet.\n\n### 1.3.1 Recommended Work Items\n\n- No schema work items are currently generated from sync drift.\n\n### 1.3.2 Sync Audit History\n\n- No sync audit history recorded yet.\n\n### 1.4 Import Source\n\n- Source Type: sqlite_database\n- Source Label: C:\\Users\\croni\\Projects\\data\\app.db\n- Dialect: sqlite\n- Confidence: observed\n- Observed At: 2026-04-03T00:16:28.120Z\n- Schema Fingerprint: 6472ebfcb4f9ce91151ef8d1006b39d2\n\n## 2. Entities\n\n### 2.1 app_settings (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `key`: Type: TEXT; Nullable: yes; Primary key; Status: observed\n- `value`: Type: TEXT; Nullable: yes; Status: observed\n- `is_secret`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n\n### 2.2 bug_items (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed\n- `code`: Type: TEXT; Nullable: no; Status: observed\n- `title`: Type: TEXT; Nullable: no; Status: observed\n- `summary`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `severity`: Type: TEXT; Nullable: yes; Default: 'medium'; Status: observed\n- `status`: Type: TEXT; Nullable: yes; Default: 'open'; Status: observed\n- `task_id`: Type: TEXT; Nullable: yes; Status: observed\n- `completed`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `regressed`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `archived`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `current_behavior`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `expected_behavior`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `work_item_type`: Type: TEXT; Nullable: yes; Default: 'software_bug'; Status: observed\n- `affected_module_keys`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed\n\n### 2.3 credentials (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed\n- `name`: Type: TEXT; Nullable: no; Status: observed\n- `host`: Type: TEXT; Nullable: no; Status: observed\n- `port`: Type: INTEGER; Nullable: yes; Default: 22; Status: observed\n- `user`: Type: TEXT; Nullable: no; Status: observed\n- `password`: Type: TEXT; Nullable: yes; Status: observed\n- `key_path`: Type: TEXT; Nullable: yes; Status: observed\n\n### 2.4 entity_relationships (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed\n- `source_entity_type`: Type: TEXT; Nullable: no; Status: observed\n- `source_entity_id`: Type: TEXT; Nullable: no; Status: observed\n- `relationship_type`: Type: TEXT; Nullable: no; Status: observed\n- `target_entity_type`: Type: TEXT; Nullable: no; Status: observed\n- `target_entity_id`: Type: TEXT; Nullable: no; Status: observed\n- `metadata_json`: Type: TEXT; Nullable: yes; Default: '{}'; Status: observed\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n\n### 2.5 feature_items (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed\n- `code`: Type: TEXT; Nullable: no; Status: observed\n- `title`: Type: TEXT; Nullable: no; Status: observed\n- `summary`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `status`: Type: TEXT; Nullable: yes; Default: 'planned'; Status: observed\n- `roadmap_phase_id`: Type: TEXT; Nullable: yes; Status: observed\n- `task_id`: Type: TEXT; Nullable: yes; Status: observed\n- `archived`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `work_item_type`: Type: TEXT; Nullable: yes; Default: 'software_feature'; Status: observed\n- `affected_module_keys`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed\n\n### 2.6 integration_events (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed\n- `source`: Type: TEXT; Nullable: no; Status: observed\n- `event_type`: Type: TEXT; Nullable: no; Status: observed\n- `delivery_status`: Type: TEXT; Nullable: yes; Default: 'received'; Status: observed\n- `payload`: Type: TEXT; Nullable: yes; Default: '{}'; Status: observed\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n\n### 2.7 migrations (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `id`: Type: INTEGER; Nullable: yes; Primary key; Status: observed\n- `name`: Type: TEXT; Nullable: no; Unique; Status: observed\n- `executed_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n\n### 2.8 prd_fragments (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed\n- `feature_id`: Type: TEXT; Nullable: yes; Status: observed\n- `code`: Type: TEXT; Nullable: no; Status: observed\n- `title`: Type: TEXT; Nullable: no; Status: observed\n- `markdown`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `mermaid`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `status`: Type: TEXT; Nullable: yes; Default: 'draft'; Status: observed\n- `merged`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `merged_at`: Type: TEXT; Nullable: yes; Status: observed\n- `file_name`: Type: TEXT; Nullable: yes; Status: observed\n- `file_path`: Type: TEXT; Nullable: yes; Status: observed\n- `file_updated_at`: Type: TEXT; Nullable: yes; Status: observed\n- `file_md5`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `db_md5`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `merged_file_name`: Type: TEXT; Nullable: yes; Status: observed\n\n### 2.9 project_md_documents (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `project_id`: Type: TEXT; Nullable: no; Primary key; References: projects.id; Status: observed\n- `doc_type`: Type: TEXT; Nullable: no; Primary key; Status: observed\n- `markdown`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `mermaid`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `file_path`: Type: TEXT; Nullable: yes; Status: observed\n- `file_updated_at`: Type: TEXT; Nullable: yes; Status: observed\n- `file_md5`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `db_md5`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `editor_state`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `title`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `module_key`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `template_name`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `template_version`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `source_of_truth`: Type: TEXT; Nullable: yes; Default: 'database'; Status: observed\n\n### 2.10 project_modules (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `project_id`: Type: TEXT; Nullable: no; Primary key; References: projects.id; Status: observed\n- `module_key`: Type: TEXT; Nullable: no; Primary key; Status: observed\n- `module_group`: Type: TEXT; Nullable: no; Status: observed\n- `label`: Type: TEXT; Nullable: no; Status: observed\n- `description`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `enabled`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `is_core`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `sort_order`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `settings_json`: Type: TEXT; Nullable: yes; Default: '{}'; Status: observed\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `purpose_summary`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n\n### 2.11 projects (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed\n- `path`: Type: TEXT; Nullable: yes; Status: observed\n- `absolute_path`: Type: TEXT; Nullable: yes; Status: observed\n- `name`: Type: TEXT; Nullable: no; Status: observed\n- `description`: Type: TEXT; Nullable: yes; Status: observed\n- `parent_id`: Type: TEXT; Nullable: yes; Status: observed\n- `server_id`: Type: TEXT; Nullable: yes; Status: observed\n- `image_path`: Type: TEXT; Nullable: yes; Status: observed\n- `open_in_cursor`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `category`: Type: TEXT; Nullable: yes; Status: observed\n- `tags`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed\n- `links`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed\n- `date_added`: Type: TEXT; Nullable: yes; Status: observed\n- `type`: Type: TEXT; Nullable: yes; Default: 'folder'; Status: observed\n- `open_in_cursor_admin`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `url`: Type: TEXT; Nullable: yes; Status: observed\n- `pinned`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `image_url`: Type: TEXT; Nullable: yes; Status: observed\n- `upload_mappings`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed\n- `mapping_groups`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed\n- `primary_action`: Type: TEXT; Nullable: yes; Default: 'auto'; Status: observed\n- `integrations`: Type: TEXT; Nullable: yes; Default: '{}'; Status: observed\n- `workspace_plugins`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed\n- `project_type`: Type: TEXT; Nullable: yes; Default: 'general'; Status: observed\n\n### 2.12 roadmap_fragments (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed\n- `project_id`: Type: TEXT; Nullable: no; Status: observed\n- `source_feature_id`: Type: TEXT; Nullable: yes; Status: observed\n- `source_phase_id`: Type: TEXT; Nullable: yes; Status: observed\n- `code`: Type: TEXT; Nullable: no; Status: observed\n- `title`: Type: TEXT; Nullable: no; Status: observed\n- `markdown`: Type: TEXT; Nullable: no; Default: ''; Status: observed\n- `mermaid`: Type: TEXT; Nullable: no; Default: ''; Status: observed\n- `payload_json`: Type: TEXT; Nullable: no; Default: ''; Status: observed\n- `status`: Type: TEXT; Nullable: no; Default: 'draft'; Status: observed\n- `merged`: Type: INTEGER; Nullable: no; Default: 0; Status: observed\n- `merged_at`: Type: TEXT; Nullable: yes; Status: observed\n- `integrated_at`: Type: TEXT; Nullable: yes; Status: observed\n- `file_name`: Type: TEXT; Nullable: yes; Status: observed\n- `file_path`: Type: TEXT; Nullable: yes; Status: observed\n- `file_updated_at`: Type: TEXT; Nullable: yes; Status: observed\n- `file_md5`: Type: TEXT; Nullable: no; Default: ''; Status: observed\n- `db_md5`: Type: TEXT; Nullable: no; Default: ''; Status: observed\n- `created_at`: Type: TEXT; Nullable: no; Status: observed\n- `updated_at`: Type: TEXT; Nullable: no; Status: observed\n\n### 2.13 roadmap_phases (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed\n- `code`: Type: TEXT; Nullable: no; Status: observed\n- `name`: Type: TEXT; Nullable: no; Status: observed\n- `summary`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `goal`: Type: TEXT; Nullable: yes; Default: ''; Status: observed\n- `status`: Type: TEXT; Nullable: yes; Default: 'planned'; Status: observed\n- `target_date`: Type: TEXT; Nullable: yes; Status: observed\n- `sort_order`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `after_phase_id`: Type: TEXT; Nullable: yes; Status: observed\n- `archived`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n\n### 2.14 tasks (table)\n\nNo entity notes captured yet.\n\n- Status: observed\n\n#### Fields\n\n- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed\n- `title`: Type: TEXT; Nullable: no; Status: observed\n- `description`: Type: TEXT; Nullable: yes; Status: observed\n- `status`: Type: TEXT; Nullable: yes; Default: 'todo'; Status: observed\n- `priority`: Type: TEXT; Nullable: yes; Default: 'medium'; Status: observed\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed\n- `due_date`: Type: TEXT; Nullable: yes; Status: observed\n- `assigned_to`: Type: TEXT; Nullable: yes; Status: observed\n- `start_date`: Type: TEXT; Nullable: yes; Status: observed\n- `end_date`: Type: TEXT; Nullable: yes; Status: observed\n- `dependency_ids`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed\n- `progress`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `milestone`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `sort_order`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed\n- `roadmap_phase_id`: Type: TEXT; Nullable: yes; Status: observed\n- `planning_bucket`: Type: TEXT; Nullable: yes; Default: 'considered'; Status: observed\n- `item_type`: Type: TEXT; Nullable: yes; Default: 'task'; Status: observed\n- `category`: Type: TEXT; Nullable: yes; Status: observed\n- `work_item_type`: Type: TEXT; Nullable: yes; Default: 'core_task'; Status: observed\n\n## 3. Relationships\n\n### 3.1 bug_items:project_id:projects:id:0\n- From: bug_items.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n### 3.2 entity_relationships:project_id:projects:id:0\n- From: entity_relationships.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n### 3.3 feature_items:project_id:projects:id:0\n- From: feature_items.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n### 3.4 integration_events:project_id:projects:id:0\n- From: integration_events.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n### 3.5 prd_fragments:project_id:projects:id:0\n- From: prd_fragments.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n### 3.6 project_md_documents:project_id:projects:id:0\n- From: project_md_documents.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n### 3.7 project_modules:project_id:projects:id:0\n- From: project_modules.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n### 3.8 roadmap_phases:project_id:projects:id:0\n- From: roadmap_phases.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n### 3.9 tasks:project_id:projects:id:0\n- From: tasks.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n## 4. Constraints\n\n### 4.1 sqlite_autoindex_migrations_1\n- Entity: migrations\n- Type: unique\n- Definition: UNIQUE (name)\n- Status: observed\n## 5. Indexes\n\n### 5.1 sqlite_autoindex_app_settings_1\n- Entity: app_settings\n- Fields: key\n- Unique: yes\n- Status: observed\n- Notes: Primary key backing index.\n### 5.2 idx_bug_items_project_archived\n- Entity: bug_items\n- Fields: project_id, archived, updated_at\n- Unique: no\n- Status: observed\n### 5.3 sqlite_autoindex_bug_items_1\n- Entity: bug_items\n- Fields: id\n- Unique: yes\n- Status: observed\n- Notes: Primary key backing index.\n### 5.4 sqlite_autoindex_credentials_1\n- Entity: credentials\n- Fields: id\n- Unique: yes\n- Status: observed\n- Notes: Primary key backing index.\n### 5.5 idx_entity_relationships_project_target\n- Entity: entity_relationships\n- Fields: project_id, target_entity_type, target_entity_id\n- Unique: no\n- Status: observed\n### 5.6 idx_entity_relationships_project_source\n- Entity: entity_relationships\n- Fields: project_id, source_entity_type, source_entity_id\n- Unique: no\n- Status: observed\n### 5.7 sqlite_autoindex_entity_relationships_1\n- Entity: entity_relationships\n- Fields: id\n- Unique: yes\n- Status: observed\n- Notes: Primary key backing index.\n### 5.8 idx_feature_items_project_archived\n- Entity: feature_items\n- Fields: project_id, archived, updated_at\n- Unique: no\n- Status: observed\n### 5.9 sqlite_autoindex_feature_items_1\n- Entity: feature_items\n- Fields: id\n- Unique: yes\n- Status: observed\n- Notes: Primary key backing index.\n### 5.10 idx_integration_events_source\n- Entity: integration_events\n- Fields: source\n- Unique: no\n- Status: observed\n### 5.11 idx_integration_events_project_created\n- Entity: integration_events\n- Fields: project_id, created_at\n- Unique: no\n- Status: observed\n### 5.12 sqlite_autoindex_integration_events_1\n- Entity: integration_events\n- Fields: id\n- Unique: yes\n- Status: observed\n- Notes: Primary key backing index.\n### 5.13 sqlite_autoindex_migrations_1\n- Entity: migrations\n- Fields: name\n- Unique: yes\n- Status: observed\n- Notes: Unique constraint backing index.\n### 5.14 idx_prd_fragments_project_merged\n- Entity: prd_fragments\n- Fields: project_id, merged, updated_at\n- Unique: no\n- Status: observed\n### 5.15 idx_prd_fragments_project_feature\n- Entity: prd_fragments\n- Fields: project_id, feature_id\n- Unique: yes\n- Status: observed\n### 5.16 sqlite_autoindex_prd_fragments_1\n- Entity: prd_fragments\n- Fields: id\n- Unique: yes\n- Status: observed\n- Notes: Primary key backing index.\n### 5.17 sqlite_autoindex_project_md_documents_1\n- Entity: project_md_documents\n- Fields: project_id, doc_type\n- Unique: yes\n- Status: observed\n- Notes: Primary key backing index.\n### 5.18 idx_project_modules_project_group\n- Entity: project_modules\n- Fields: project_id, module_group, sort_order\n- Unique: no\n- Status: observed\n### 5.19 sqlite_autoindex_project_modules_1\n- Entity: project_modules\n- Fields: project_id, module_key\n- Unique: yes\n- Status: observed\n- Notes: Primary key backing index.\n### 5.20 idx_projects_pinned\n- Entity: projects\n- Fields: pinned\n- Unique: no\n- Status: observed\n### 5.21 idx_projects_category\n- Entity: projects\n- Fields: category\n- Unique: no\n- Status: observed\n### 5.22 sqlite_autoindex_projects_1\n- Entity: projects\n- Fields: id\n- Unique: yes\n- Status: observed\n- Notes: Primary key backing index.\n### 5.23 idx_roadmap_fragments_project_status\n- Entity: roadmap_fragments\n- Fields: project_id, merged, updated_at\n- Unique: no\n- Status: observed\n### 5.24 idx_roadmap_fragments_project_feature\n- Entity: roadmap_fragments\n- Fields: project_id, source_feature_id\n- Unique: yes\n- Status: observed\n### 5.25 sqlite_autoindex_roadmap_fragments_1\n- Entity: roadmap_fragments\n- Fields: id\n- Unique: yes\n- Status: observed\n- Notes: Primary key backing index.\n### 5.26 idx_roadmap_phases_after\n- Entity: roadmap_phases\n- Fields: project_id, after_phase_id\n- Unique: no\n- Status: observed\n### 5.27 idx_roadmap_phases_project_archive\n- Entity: roadmap_phases\n- Fields: project_id, archived, sort_order\n- Unique: no\n- Status: observed\n### 5.28 idx_roadmap_phases_project_sort\n- Entity: roadmap_phases\n- Fields: project_id, sort_order\n- Unique: no\n- Status: observed\n### 5.29 sqlite_autoindex_roadmap_phases_1\n- Entity: roadmap_phases\n- Fields: id\n- Unique: yes\n- Status: observed\n- Notes: Primary key backing index.\n### 5.30 idx_tasks_project_work_item_type\n- Entity: tasks\n- Fields: project_id, work_item_type, updated_at\n- Unique: no\n- Status: observed\n### 5.31 idx_tasks_project_category\n- Entity: tasks\n- Fields: project_id, category\n- Unique: no\n- Status: observed\n### 5.32 idx_tasks_project_type\n- Entity: tasks\n- Fields: project_id, item_type, updated_at\n- Unique: no\n- Status: observed\n### 5.33 idx_tasks_project_bucket\n- Entity: tasks\n- Fields: project_id, planning_bucket, updated_at\n- Unique: no\n- Status: observed\n### 5.34 idx_tasks_project_phase\n- Entity: tasks\n- Fields: project_id, roadmap_phase_id, sort_order\n- Unique: no\n- Status: observed\n### 5.35 idx_tasks_sort_order\n- Entity: tasks\n- Fields: project_id, sort_order\n- Unique: no\n- Status: observed\n### 5.36 idx_tasks_status\n- Entity: tasks\n- Fields: status\n- Unique: no\n- Status: observed\n### 5.37 idx_tasks_project_id\n- Entity: tasks\n- Fields: project_id\n- Unique: no\n- Status: observed\n### 5.38 sqlite_autoindex_tasks_1\n- Entity: tasks\n- Fields: id\n- Unique: yes\n- Status: observed\n- Notes: Primary key backing index.\n## 6. Migration Notes\n\n<\u0021--\nAPM-ID: database-schema-migrations-live-runtime-schema-capture\nAPM-LAST-UPDATED: 2026-04-03\n--\u003e\n\n### 6.1 Live runtime schema capture\n\nThis fragment was generated directly from the active runtime SQLite database for Angel's Project Manager.\nStatus: observed\n\n- Version Date: 2026-04-03\n\n## 7. Open Questions\n\nNo open questions captured yet.\n## 8. Source-of-Truth and Sync Rules\n\n<\u0021--\nAPM-ID: database-schema-synchronization-rules-database-first-schema-model\nAPM-LAST-UPDATED: 2026-04-03\n--\u003e\n\n### 8.1 Database-first schema model\n\nThe manager database becomes the source of truth after this fragment is merged or imported.\n\n- Version Date: 2026-04-03\n\n<\u0021--\nAPM-ID: database-schema-synchronization-rules-generated-artifacts\nAPM-LAST-UPDATED: 2026-04-03\n--\u003e\n\n### 8.2 Generated artifacts\n\nRegenerate DATABASE_SCHEMA.md and DATABASE_SCHEMA.dbml from the stored schema model when files are missing or stale.\n\n- Version Date: 2026-04-03\n\n<\u0021--\nAPM-ID: database-schema-synchronization-rules-imported-fragment-provenance\nAPM-LAST-UPDATED: 2026-04-03\n--\u003e\n\n### 8.3 Imported fragment provenance\n\nImported from C:\\Users\\croni\\Projects\\data\\app.db (sqlite_database).\n\n- Version Date: 2026-04-03",
  "mermaid": "erDiagram\n  APP_SETTINGS {\n    TEXT key PK\n    TEXT value\n    INTEGER is_secret\n    TEXT updated_at\n  }\n  BUG_ITEMS {\n    TEXT id PK\n    TEXT project_id\n    TEXT code\n    TEXT title\n    TEXT summary\n    TEXT severity\n    TEXT status\n    TEXT task_id\n    INTEGER completed\n    INTEGER regressed\n    INTEGER archived\n    TEXT created_at\n    TEXT updated_at\n    TEXT current_behavior\n    TEXT expected_behavior\n    TEXT work_item_type\n    TEXT affected_module_keys\n  }\n  CREDENTIALS {\n    TEXT id PK\n    TEXT name\n    TEXT host\n    INTEGER port\n    TEXT user\n    TEXT password\n    TEXT key_path\n  }\n  ENTITY_RELATIONSHIPS {\n    TEXT id PK\n    TEXT project_id\n    TEXT source_entity_type\n    TEXT source_entity_id\n    TEXT relationship_type\n    TEXT target_entity_type\n    TEXT target_entity_id\n    TEXT metadata_json\n    TEXT created_at\n    TEXT updated_at\n  }\n  FEATURE_ITEMS {\n    TEXT id PK\n    TEXT project_id\n    TEXT code\n    TEXT title\n    TEXT summary\n    TEXT status\n    TEXT roadmap_phase_id\n    TEXT task_id\n    INTEGER archived\n    TEXT created_at\n    TEXT updated_at\n    TEXT work_item_type\n    TEXT affected_module_keys\n  }\n  INTEGRATION_EVENTS {\n    TEXT id PK\n    TEXT project_id\n    TEXT source\n    TEXT event_type\n    TEXT delivery_status\n    TEXT payload\n    TEXT created_at\n  }\n  MIGRATIONS {\n    INTEGER id PK\n    TEXT name\n    TEXT executed_at\n  }\n  PRD_FRAGMENTS {\n    TEXT id PK\n    TEXT project_id\n    TEXT feature_id\n    TEXT code\n    TEXT title\n    TEXT markdown\n    TEXT mermaid\n    TEXT status\n    INTEGER merged\n    TEXT merged_at\n    TEXT file_name\n    TEXT file_path\n    TEXT file_updated_at\n    TEXT file_md5\n    TEXT db_md5\n    TEXT created_at\n    TEXT updated_at\n    TEXT merged_file_name\n  }\n  PROJECT_MD_DOCUMENTS {\n    TEXT project_id PK\n    TEXT doc_type PK\n    TEXT markdown\n    TEXT mermaid\n    TEXT updated_at\n    TEXT file_path\n    TEXT file_updated_at\n    TEXT file_md5\n    TEXT db_md5\n    TEXT editor_state\n    TEXT title\n    TEXT module_key\n    TEXT template_name\n    TEXT template_version\n    TEXT source_of_truth\n  }\n  PROJECT_MODULES {\n    TEXT project_id PK\n    TEXT module_key PK\n    TEXT module_group\n    TEXT label\n    TEXT description\n    INTEGER enabled\n    INTEGER is_core\n    INTEGER sort_order\n    TEXT settings_json\n    TEXT created_at\n    TEXT updated_at\n    TEXT purpose_summary\n  }\n  PROJECTS {\n    TEXT id PK\n    TEXT path\n    TEXT absolute_path\n    TEXT name\n    TEXT description\n    TEXT parent_id\n    TEXT server_id\n    TEXT image_path\n    INTEGER open_in_cursor\n    TEXT category\n    TEXT tags\n    TEXT links\n    TEXT date_added\n    TEXT type\n    INTEGER open_in_cursor_admin\n    TEXT url\n    INTEGER pinned\n    TEXT image_url\n    TEXT upload_mappings\n    TEXT mapping_groups\n    TEXT primary_action\n    TEXT integrations\n    TEXT workspace_plugins\n    TEXT project_type\n  }\n  ROADMAP_FRAGMENTS {\n    TEXT id PK\n    TEXT project_id\n    TEXT source_feature_id\n    TEXT source_phase_id\n    TEXT code\n    TEXT title\n    TEXT markdown\n    TEXT mermaid\n    TEXT payload_json\n    TEXT status\n    INTEGER merged\n    TEXT merged_at\n    TEXT integrated_at\n    TEXT file_name\n    TEXT file_path\n    TEXT file_updated_at\n    TEXT file_md5\n    TEXT db_md5\n    TEXT created_at\n    TEXT updated_at\n  }\n  ROADMAP_PHASES {\n    TEXT id PK\n    TEXT project_id\n    TEXT code\n    TEXT name\n    TEXT summary\n    TEXT goal\n    TEXT status\n    TEXT target_date\n    INTEGER sort_order\n    TEXT created_at\n    TEXT updated_at\n    TEXT after_phase_id\n    INTEGER archived\n  }\n  TASKS {\n    TEXT id PK\n    TEXT project_id\n    TEXT title\n    TEXT description\n    TEXT status\n    TEXT priority\n    TEXT created_at\n    TEXT updated_at\n    TEXT due_date\n    TEXT assigned_to\n    TEXT start_date\n    TEXT end_date\n    TEXT dependency_ids\n    INTEGER progress\n    INTEGER milestone\n    INTEGER sort_order\n    TEXT roadmap_phase_id\n    TEXT planning_bucket\n    TEXT item_type\n    TEXT category\n    TEXT work_item_type\n  }\n  PROJECTS ||--o{ BUG_ITEMS : \"project_id\"\n  PROJECTS ||--o{ ENTITY_RELATIONSHIPS : \"project_id\"\n  PROJECTS ||--o{ FEATURE_ITEMS : \"project_id\"\n  PROJECTS ||--o{ INTEGRATION_EVENTS : \"project_id\"\n  PROJECTS ||--o{ PRD_FRAGMENTS : \"project_id\"\n  PROJECTS ||--o{ PROJECT_MD_DOCUMENTS : \"project_id\"\n  PROJECTS ||--o{ PROJECT_MODULES : \"project_id\"\n  PROJECTS ||--o{ ROADMAP_PHASES : \"project_id\"\n  PROJECTS ||--o{ TASKS : \"project_id\"",
  "editorState": {
    "overview": {
      "purpose": "Observed SQLite schema imported from the live Angel's Project Manager runtime database to regenerate DATABASE_SCHEMA.md and DATABASE_SCHEMA.dbml.",
      "storageStrategy": "Primary dialect: sqlite. Imported from sqlite database. Confidence: observed.",
      "versionDate": "2026-04-03T00:23:27.524Z",
      "itemIds": {
        "purpose": "database-schema-overview-purpose-schema-purpose",
        "storageStrategy": "database-schema-overview-storage-strategy-storage-strategy"
      },
      "itemSourceRefs": {
        "purpose": [],
        "storageStrategy": []
      }
    },
    "importSource": {
      "sourceType": "sqlite_database",
      "sourceLabel": "C:\\Users\\croni\\Projects\\data\\app.db",
      "dialect": "sqlite",
      "observedAt": "2026-04-03T00:16:28.120Z",
      "schemaFingerprint": "6472ebfcb4f9ce91151ef8d1006b39d2",
      "confidence": "observed"
    },
    "observedSchemaModel": null,
    "syncTracking": {
      "intendedVersion": 0,
      "observedVersion": 0,
      "intendedHash": "",
      "observedHash": "",
      "syncStatus": "unverified",
      "driftSeverity": "low",
      "changeSource": "unknown",
      "pendingMigrationStatus": "comparison_required",
      "recommendedAction": "capture_or_compare",
      "actionSummary": "Capture an observed schema or define the intended schema to begin tracking drift.",
      "lastComparedAt": "",
      "intendedUpdatedAt": "",
      "observedCapturedAt": "",
      "driftSummary": "No schema comparison has been recorded yet.",
      "driftDetails": {
        "entities": [],
        "relationships": [],
        "indexes": [],
        "constraints": []
      },
      "actionItems": [],
      "auditHistory": []
    },
    "entities": [
      {
        "title": "app_settings (table)",
        "description": "- key: Type: TEXT; Nullable: yes; Primary key\n- value: Type: TEXT; Nullable: yes\n- is_secret: Type: INTEGER; Nullable: yes; Default: 0\n- updated_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP",
        "versionDate": "2026-04-03T00:23:27.524Z",
        "id": "",
        "stableId": "database-schema-entities-app-settings-table",
        "sourceRefs": []
      },
      {
        "title": "bug_items (table)",
        "description": "- id: Type: TEXT; Nullable: yes; Primary key\n- project_id: Type: TEXT; Nullable: no; References: projects.id\n- code: Type: TEXT; Nullable: no\n- title: Type: TEXT; Nullable: no\n- summary: Type: TEXT; Nullable: yes; Default: ''\n- severity: Type: TEXT; Nullable: yes; Default: 'medium'\n- status: Type: TEXT; Nullable: yes; Default: 'open'\n- task_id: Type: TEXT; Nullable: yes\n- completed: Type: INTEGER; Nullable: yes; Default: 0\n- regressed: Type: INTEGER; Nullable: yes; Default: 0\n- archived: Type: INTEGER; Nullable: yes; Default: 0\n- created_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- updated_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- current_behavior: Type: TEXT; Nullable: yes; Default: ''\n- expected_behavior: Type: TEXT; Nullable: yes; Default: ''\n- work_item_type: Type: TEXT; Nullable: yes; Default: 'software_bug'\n- affected_module_keys: Type: TEXT; Nullable: yes; Default: '[]'",
        "versionDate": "2026-04-03T00:23:27.524Z",
        "id": "",
        "stableId": "database-schema-entities-bug-items-table",
        "sourceRefs": []
      },
      {
        "title": "credentials (table)",
        "description": "- id: Type: TEXT; Nullable: yes; Primary key\n- name: Type: TEXT; Nullable: no\n- host: Type: TEXT; Nullable: no\n- port: Type: INTEGER; Nullable: yes; Default: 22\n- user: Type: TEXT; Nullable: no\n- password: Type: TEXT; Nullable: yes\n- key_path: Type: TEXT; Nullable: yes",
        "versionDate": "2026-04-03T00:23:27.524Z",
        "id": "",
        "stableId": "database-schema-entities-credentials-table",
        "sourceRefs": []
      },
      {
        "title": "entity_relationships (table)",
        "description": "- id: Type: TEXT; Nullable: yes; Primary key\n- project_id: Type: TEXT; Nullable: no; References: projects.id\n- source_entity_type: Type: TEXT; Nullable: no\n- source_entity_id: Type: TEXT; Nullable: no\n- relationship_type: Type: TEXT; Nullable: no\n- target_entity_type: Type: TEXT; Nullable: no\n- target_entity_id: Type: TEXT; Nullable: no\n- metadata_json: Type: TEXT; Nullable: yes; Default: '{}'\n- created_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- updated_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP",
        "versionDate": "2026-04-03T00:23:27.524Z",
        "id": "",
        "stableId": "database-schema-entities-entity-relationships-table",
        "sourceRefs": []
      },
      {
        "title": "feature_items (table)",
        "description": "- id: Type: TEXT; Nullable: yes; Primary key\n- project_id: Type: TEXT; Nullable: no; References: projects.id\n- code: Type: TEXT; Nullable: no\n- title: Type: TEXT; Nullable: no\n- summary: Type: TEXT; Nullable: yes; Default: ''\n- status: Type: TEXT; Nullable: yes; Default: 'planned'\n- roadmap_phase_id: Type: TEXT; Nullable: yes\n- task_id: Type: TEXT; Nullable: yes\n- archived: Type: INTEGER; Nullable: yes; Default: 0\n- created_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- updated_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- work_item_type: Type: TEXT; Nullable: yes; Default: 'software_feature'\n- affected_module_keys: Type: TEXT; Nullable: yes; Default: '[]'",
        "versionDate": "2026-04-03T00:23:27.524Z",
        "id": "",
        "stableId": "database-schema-entities-feature-items-table",
        "sourceRefs": []
      },
      {
        "title": "integration_events (table)",
        "description": "- id: Type: TEXT; Nullable: yes; Primary key\n- project_id: Type: TEXT; Nullable: no; References: projects.id\n- source: Type: TEXT; Nullable: no\n- event_type: Type: TEXT; Nullable: no\n- delivery_status: Type: TEXT; Nullable: yes; Default: 'received'\n- payload: Type: TEXT; Nullable: yes; Default: '{}'\n- created_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP",
        "versionDate": "2026-04-03T00:23:27.524Z",
        "id": "",
        "stableId": "database-schema-entities-integration-events-table",
        "sourceRefs": []
      },
      {
        "title": "migrations (table)",
        "description": "- id: Type: INTEGER; Nullable: yes; Primary key\n- name: Type: TEXT; Nullable: no; Unique\n- executed_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP",
        "versionDate": "2026-04-03T00:23:27.524Z",
        "id": "",
        "stableId": "database-schema-entities-migrations-table",
        "sourceRefs": []
      },
      {
        "title": "prd_fragments (table)",
        "description": "- id: Type: TEXT; Nullable: yes; Primary key\n- project_id: Type: TEXT; Nullable: no; References: projects.id\n- feature_id: Type: TEXT; Nullable: yes\n- code: Type: TEXT; Nullable: no\n- title: Type: TEXT; Nullable: no\n- markdown: Type: TEXT; Nullable: yes; Default: ''\n- mermaid: Type: TEXT; Nullable: yes; Default: ''\n- status: Type: TEXT; Nullable: yes; Default: 'draft'\n- merged: Type: INTEGER; Nullable: yes; Default: 0\n- merged_at: Type: TEXT; Nullable: yes\n- file_name: Type: TEXT; Nullable: yes\n- file_path: Type: TEXT; Nullable: yes\n- file_updated_at: Type: TEXT; Nullable: yes\n- file_md5: Type: TEXT; Nullable: yes; Default: ''\n- db_md5: Type: TEXT; Nullable: yes; Default: ''\n- created_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- updated_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- merged_file_name: Type: TEXT; Nullable: yes",
        "versionDate": "2026-04-03T00:23:27.524Z",
        "id": "",
        "stableId": "database-schema-entities-prd-fragments-table",
        "sourceRefs": []
      },
      {
        "title": "project_md_documents (table)",
        "description": "- project_id: Type: TEXT; Nullable: no; Primary key; References: projects.id\n- doc_type: Type: TEXT; Nullable: no; Primary key\n- markdown: Type: TEXT; Nullable: yes; Default: ''\n- mermaid: Type: TEXT; Nullable: yes; Default: ''\n- updated_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- file_path: Type: TEXT; Nullable: yes\n- file_updated_at: Type: TEXT; Nullable: yes\n- file_md5: Type: TEXT; Nullable: yes; Default: ''\n- db_md5: Type: TEXT; Nullable: yes; Default: ''\n- editor_state: Type: TEXT; Nullable: yes; Default: ''\n- title: Type: TEXT; Nullable: yes; Default: ''\n- module_key: Type: TEXT; Nullable: yes; Default: ''\n- template_name: Type: TEXT; Nullable: yes; Default: ''\n- template_version: Type: TEXT; Nullable: yes; Default: ''\n- source_of_truth: Type: TEXT; Nullable: yes; Default: 'database'",
        "versionDate": "2026-04-03T00:23:27.524Z",
        "id": "",
        "stableId": "database-schema-entities-project-md-documents-table",
        "sourceRefs": []
      },
      {
        "title": "project_modules (table)",
        "description": "- project_id: Type: TEXT; Nullable: no; Primary key; References: projects.id\n- module_key: Type: TEXT; Nullable: no; Primary key\n- module_group: Type: TEXT; Nullable: no\n- label: Type: TEXT; Nullable: no\n- description: Type: TEXT; Nullable: yes; Default: ''\n- enabled: Type: INTEGER; Nullable: yes; Default: 0\n- is_core: Type: INTEGER; Nullable: yes; Default: 0\n- sort_order: Type: INTEGER; Nullable: yes; Default: 0\n- settings_json: Type: TEXT; Nullable: yes; Default: '{}'\n- created_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- updated_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- purpose_summary: Type: TEXT; Nullable: yes; Default: ''",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-entities-project-modules-table",
        "sourceRefs": []
      },
      {
        "title": "projects (table)",
        "description": "- id: Type: TEXT; Nullable: yes; Primary key\n- path: Type: TEXT; Nullable: yes\n- absolute_path: Type: TEXT; Nullable: yes\n- name: Type: TEXT; Nullable: no\n- description: Type: TEXT; Nullable: yes\n- parent_id: Type: TEXT; Nullable: yes\n- server_id: Type: TEXT; Nullable: yes\n- image_path: Type: TEXT; Nullable: yes\n- open_in_cursor: Type: INTEGER; Nullable: yes; Default: 0\n- category: Type: TEXT; Nullable: yes\n- tags: Type: TEXT; Nullable: yes; Default: '[]'\n- links: Type: TEXT; Nullable: yes; Default: '[]'\n- date_added: Type: TEXT; Nullable: yes\n- type: Type: TEXT; Nullable: yes; Default: 'folder'\n- open_in_cursor_admin: Type: INTEGER; Nullable: yes; Default: 0\n- url: Type: TEXT; Nullable: yes\n- pinned: Type: INTEGER; Nullable: yes; Default: 0\n- image_url: Type: TEXT; Nullable: yes\n- upload_mappings: Type: TEXT; Nullable: yes; Default: '[]'\n- mapping_groups: Type: TEXT; Nullable: yes; Default: '[]'\n- primary_action: Type: TEXT; Nullable: yes; Default: 'auto'\n- integrations: Type: TEXT; Nullable: yes; Default: '{}'\n- workspace_plugins: Type: TEXT; Nullable: yes; Default: '[]'\n- project_type: Type: TEXT; Nullable: yes; Default: 'general'",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-entities-projects-table",
        "sourceRefs": []
      },
      {
        "title": "roadmap_fragments (table)",
        "description": "- id: Type: TEXT; Nullable: yes; Primary key\n- project_id: Type: TEXT; Nullable: no\n- source_feature_id: Type: TEXT; Nullable: yes\n- source_phase_id: Type: TEXT; Nullable: yes\n- code: Type: TEXT; Nullable: no\n- title: Type: TEXT; Nullable: no\n- markdown: Type: TEXT; Nullable: no; Default: ''\n- mermaid: Type: TEXT; Nullable: no; Default: ''\n- payload_json: Type: TEXT; Nullable: no; Default: ''\n- status: Type: TEXT; Nullable: no; Default: 'draft'\n- merged: Type: INTEGER; Nullable: no; Default: 0\n- merged_at: Type: TEXT; Nullable: yes\n- integrated_at: Type: TEXT; Nullable: yes\n- file_name: Type: TEXT; Nullable: yes\n- file_path: Type: TEXT; Nullable: yes\n- file_updated_at: Type: TEXT; Nullable: yes\n- file_md5: Type: TEXT; Nullable: no; Default: ''\n- db_md5: Type: TEXT; Nullable: no; Default: ''\n- created_at: Type: TEXT; Nullable: no\n- updated_at: Type: TEXT; Nullable: no",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-entities-roadmap-fragments-table",
        "sourceRefs": []
      },
      {
        "title": "roadmap_phases (table)",
        "description": "- id: Type: TEXT; Nullable: yes; Primary key\n- project_id: Type: TEXT; Nullable: no; References: projects.id\n- code: Type: TEXT; Nullable: no\n- name: Type: TEXT; Nullable: no\n- summary: Type: TEXT; Nullable: yes; Default: ''\n- goal: Type: TEXT; Nullable: yes; Default: ''\n- status: Type: TEXT; Nullable: yes; Default: 'planned'\n- target_date: Type: TEXT; Nullable: yes\n- sort_order: Type: INTEGER; Nullable: yes; Default: 0\n- created_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- updated_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- after_phase_id: Type: TEXT; Nullable: yes\n- archived: Type: INTEGER; Nullable: yes; Default: 0",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-entities-roadmap-phases-table",
        "sourceRefs": []
      },
      {
        "title": "tasks (table)",
        "description": "- id: Type: TEXT; Nullable: yes; Primary key\n- project_id: Type: TEXT; Nullable: no; References: projects.id\n- title: Type: TEXT; Nullable: no\n- description: Type: TEXT; Nullable: yes\n- status: Type: TEXT; Nullable: yes; Default: 'todo'\n- priority: Type: TEXT; Nullable: yes; Default: 'medium'\n- created_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- updated_at: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- due_date: Type: TEXT; Nullable: yes\n- assigned_to: Type: TEXT; Nullable: yes\n- start_date: Type: TEXT; Nullable: yes\n- end_date: Type: TEXT; Nullable: yes\n- dependency_ids: Type: TEXT; Nullable: yes; Default: '[]'\n- progress: Type: INTEGER; Nullable: yes; Default: 0\n- milestone: Type: INTEGER; Nullable: yes; Default: 0\n- sort_order: Type: INTEGER; Nullable: yes; Default: 0\n- roadmap_phase_id: Type: TEXT; Nullable: yes\n- planning_bucket: Type: TEXT; Nullable: yes; Default: 'considered'\n- item_type: Type: TEXT; Nullable: yes; Default: 'task'\n- category: Type: TEXT; Nullable: yes\n- work_item_type: Type: TEXT; Nullable: yes; Default: 'core_task'",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-entities-tasks-table",
        "sourceRefs": []
      }
    ],
    "relationships": [
      {
        "title": "bug_items:project_id:projects:id:0",
        "description": "From: bug_items.project_id\nTo: projects.id\nCardinality: many-to-one\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-relationships-bug-items-project-id-projects-id-0",
        "sourceRefs": []
      },
      {
        "title": "entity_relationships:project_id:projects:id:0",
        "description": "From: entity_relationships.project_id\nTo: projects.id\nCardinality: many-to-one\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-relationships-entity-relationships-project-id-projects-id-0",
        "sourceRefs": []
      },
      {
        "title": "feature_items:project_id:projects:id:0",
        "description": "From: feature_items.project_id\nTo: projects.id\nCardinality: many-to-one\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-relationships-feature-items-project-id-projects-id-0",
        "sourceRefs": []
      },
      {
        "title": "integration_events:project_id:projects:id:0",
        "description": "From: integration_events.project_id\nTo: projects.id\nCardinality: many-to-one\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-relationships-integration-events-project-id-projects-id-0",
        "sourceRefs": []
      },
      {
        "title": "prd_fragments:project_id:projects:id:0",
        "description": "From: prd_fragments.project_id\nTo: projects.id\nCardinality: many-to-one\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-relationships-prd-fragments-project-id-projects-id-0",
        "sourceRefs": []
      },
      {
        "title": "project_md_documents:project_id:projects:id:0",
        "description": "From: project_md_documents.project_id\nTo: projects.id\nCardinality: many-to-one\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-relationships-project-md-documents-project-id-projects-id-0",
        "sourceRefs": []
      },
      {
        "title": "project_modules:project_id:projects:id:0",
        "description": "From: project_modules.project_id\nTo: projects.id\nCardinality: many-to-one\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-relationships-project-modules-project-id-projects-id-0",
        "sourceRefs": []
      },
      {
        "title": "roadmap_phases:project_id:projects:id:0",
        "description": "From: roadmap_phases.project_id\nTo: projects.id\nCardinality: many-to-one\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-relationships-roadmap-phases-project-id-projects-id-0",
        "sourceRefs": []
      },
      {
        "title": "tasks:project_id:projects:id:0",
        "description": "From: tasks.project_id\nTo: projects.id\nCardinality: many-to-one\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-relationships-tasks-project-id-projects-id-0",
        "sourceRefs": []
      }
    ],
    "constraints": [
      {
        "title": "sqlite_autoindex_migrations_1",
        "description": "Entity: migrations\nType: unique\nDefinition: UNIQUE (name)\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-constraints-sqlite-autoindex-migrations-1",
        "sourceRefs": []
      }
    ],
    "indexes": [
      {
        "title": "sqlite_autoindex_app_settings_1",
        "description": "Entity: app_settings\nFields: key\nUnique: yes\nStatus: observed\nPrimary key backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-app-settings-1",
        "sourceRefs": []
      },
      {
        "title": "idx_bug_items_project_archived",
        "description": "Entity: bug_items\nFields: project_id, archived, updated_at\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-bug-items-project-archived",
        "sourceRefs": []
      },
      {
        "title": "sqlite_autoindex_bug_items_1",
        "description": "Entity: bug_items\nFields: id\nUnique: yes\nStatus: observed\nPrimary key backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-bug-items-1",
        "sourceRefs": []
      },
      {
        "title": "sqlite_autoindex_credentials_1",
        "description": "Entity: credentials\nFields: id\nUnique: yes\nStatus: observed\nPrimary key backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-credentials-1",
        "sourceRefs": []
      },
      {
        "title": "idx_entity_relationships_project_target",
        "description": "Entity: entity_relationships\nFields: project_id, target_entity_type, target_entity_id\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-entity-relationships-project-target",
        "sourceRefs": []
      },
      {
        "title": "idx_entity_relationships_project_source",
        "description": "Entity: entity_relationships\nFields: project_id, source_entity_type, source_entity_id\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-entity-relationships-project-source",
        "sourceRefs": []
      },
      {
        "title": "sqlite_autoindex_entity_relationships_1",
        "description": "Entity: entity_relationships\nFields: id\nUnique: yes\nStatus: observed\nPrimary key backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-entity-relationships-1",
        "sourceRefs": []
      },
      {
        "title": "idx_feature_items_project_archived",
        "description": "Entity: feature_items\nFields: project_id, archived, updated_at\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-feature-items-project-archived",
        "sourceRefs": []
      },
      {
        "title": "sqlite_autoindex_feature_items_1",
        "description": "Entity: feature_items\nFields: id\nUnique: yes\nStatus: observed\nPrimary key backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-feature-items-1",
        "sourceRefs": []
      },
      {
        "title": "idx_integration_events_source",
        "description": "Entity: integration_events\nFields: source\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-integration-events-source",
        "sourceRefs": []
      },
      {
        "title": "idx_integration_events_project_created",
        "description": "Entity: integration_events\nFields: project_id, created_at\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-integration-events-project-created",
        "sourceRefs": []
      },
      {
        "title": "sqlite_autoindex_integration_events_1",
        "description": "Entity: integration_events\nFields: id\nUnique: yes\nStatus: observed\nPrimary key backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-integration-events-1",
        "sourceRefs": []
      },
      {
        "title": "sqlite_autoindex_migrations_1",
        "description": "Entity: migrations\nFields: name\nUnique: yes\nStatus: observed\nUnique constraint backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-migrations-1",
        "sourceRefs": []
      },
      {
        "title": "idx_prd_fragments_project_merged",
        "description": "Entity: prd_fragments\nFields: project_id, merged, updated_at\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-prd-fragments-project-merged",
        "sourceRefs": []
      },
      {
        "title": "idx_prd_fragments_project_feature",
        "description": "Entity: prd_fragments\nFields: project_id, feature_id\nUnique: yes\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-prd-fragments-project-feature",
        "sourceRefs": []
      },
      {
        "title": "sqlite_autoindex_prd_fragments_1",
        "description": "Entity: prd_fragments\nFields: id\nUnique: yes\nStatus: observed\nPrimary key backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-prd-fragments-1",
        "sourceRefs": []
      },
      {
        "title": "sqlite_autoindex_project_md_documents_1",
        "description": "Entity: project_md_documents\nFields: project_id, doc_type\nUnique: yes\nStatus: observed\nPrimary key backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-project-md-documents-1",
        "sourceRefs": []
      },
      {
        "title": "idx_project_modules_project_group",
        "description": "Entity: project_modules\nFields: project_id, module_group, sort_order\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-project-modules-project-group",
        "sourceRefs": []
      },
      {
        "title": "sqlite_autoindex_project_modules_1",
        "description": "Entity: project_modules\nFields: project_id, module_key\nUnique: yes\nStatus: observed\nPrimary key backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-project-modules-1",
        "sourceRefs": []
      },
      {
        "title": "idx_projects_pinned",
        "description": "Entity: projects\nFields: pinned\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-projects-pinned",
        "sourceRefs": []
      },
      {
        "title": "idx_projects_category",
        "description": "Entity: projects\nFields: category\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-projects-category",
        "sourceRefs": []
      },
      {
        "title": "sqlite_autoindex_projects_1",
        "description": "Entity: projects\nFields: id\nUnique: yes\nStatus: observed\nPrimary key backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-projects-1",
        "sourceRefs": []
      },
      {
        "title": "idx_roadmap_fragments_project_status",
        "description": "Entity: roadmap_fragments\nFields: project_id, merged, updated_at\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-roadmap-fragments-project-status",
        "sourceRefs": []
      },
      {
        "title": "idx_roadmap_fragments_project_feature",
        "description": "Entity: roadmap_fragments\nFields: project_id, source_feature_id\nUnique: yes\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-roadmap-fragments-project-feature",
        "sourceRefs": []
      },
      {
        "title": "sqlite_autoindex_roadmap_fragments_1",
        "description": "Entity: roadmap_fragments\nFields: id\nUnique: yes\nStatus: observed\nPrimary key backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-roadmap-fragments-1",
        "sourceRefs": []
      },
      {
        "title": "idx_roadmap_phases_after",
        "description": "Entity: roadmap_phases\nFields: project_id, after_phase_id\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-roadmap-phases-after",
        "sourceRefs": []
      },
      {
        "title": "idx_roadmap_phases_project_archive",
        "description": "Entity: roadmap_phases\nFields: project_id, archived, sort_order\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-roadmap-phases-project-archive",
        "sourceRefs": []
      },
      {
        "title": "idx_roadmap_phases_project_sort",
        "description": "Entity: roadmap_phases\nFields: project_id, sort_order\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-roadmap-phases-project-sort",
        "sourceRefs": []
      },
      {
        "title": "sqlite_autoindex_roadmap_phases_1",
        "description": "Entity: roadmap_phases\nFields: id\nUnique: yes\nStatus: observed\nPrimary key backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-roadmap-phases-1",
        "sourceRefs": []
      },
      {
        "title": "idx_tasks_project_work_item_type",
        "description": "Entity: tasks\nFields: project_id, work_item_type, updated_at\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-tasks-project-work-item-type",
        "sourceRefs": []
      },
      {
        "title": "idx_tasks_project_category",
        "description": "Entity: tasks\nFields: project_id, category\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-tasks-project-category",
        "sourceRefs": []
      },
      {
        "title": "idx_tasks_project_type",
        "description": "Entity: tasks\nFields: project_id, item_type, updated_at\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-tasks-project-type",
        "sourceRefs": []
      },
      {
        "title": "idx_tasks_project_bucket",
        "description": "Entity: tasks\nFields: project_id, planning_bucket, updated_at\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-tasks-project-bucket",
        "sourceRefs": []
      },
      {
        "title": "idx_tasks_project_phase",
        "description": "Entity: tasks\nFields: project_id, roadmap_phase_id, sort_order\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-tasks-project-phase",
        "sourceRefs": []
      },
      {
        "title": "idx_tasks_sort_order",
        "description": "Entity: tasks\nFields: project_id, sort_order\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-tasks-sort-order",
        "sourceRefs": []
      },
      {
        "title": "idx_tasks_status",
        "description": "Entity: tasks\nFields: status\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-tasks-status",
        "sourceRefs": []
      },
      {
        "title": "idx_tasks_project_id",
        "description": "Entity: tasks\nFields: project_id\nUnique: no\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-idx-tasks-project-id",
        "sourceRefs": []
      },
      {
        "title": "sqlite_autoindex_tasks_1",
        "description": "Entity: tasks\nFields: id\nUnique: yes\nStatus: observed\nPrimary key backing index.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-indexes-sqlite-autoindex-tasks-1",
        "sourceRefs": []
      }
    ],
    "migrations": [
      {
        "title": "Live runtime schema capture",
        "description": "This fragment was generated directly from the active runtime SQLite database for Angel's Project Manager.\nStatus: observed",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-migrations-live-runtime-schema-capture",
        "sourceRefs": []
      }
    ],
    "synchronizationRules": [
      {
        "title": "Database-first schema model",
        "description": "The manager database becomes the source of truth after this fragment is merged or imported.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-synchronization-rules-database-first-schema-model",
        "sourceRefs": []
      },
      {
        "title": "Generated artifacts",
        "description": "Regenerate DATABASE_SCHEMA.md and DATABASE_SCHEMA.dbml from the stored schema model when files are missing or stale.",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-synchronization-rules-generated-artifacts",
        "sourceRefs": []
      },
      {
        "title": "Imported fragment provenance",
        "description": "Imported from C:\\Users\\croni\\Projects\\data\\app.db (sqlite_database).",
        "versionDate": "2026-04-03T00:23:27.525Z",
        "id": "",
        "stableId": "database-schema-synchronization-rules-imported-fragment-provenance",
        "sourceRefs": []
      }
    ],
    "openQuestions": [],
    "dbml": "Project \"Angel's Project Manager\" {\n  database_type: \"Generic\"\n}\n\nTable app_settings {\n  key TEXT [pk]\n  value TEXT\n  is_secret INTEGER [default: 0]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n}\n\nTable bug_items {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  code TEXT [not null]\n  title TEXT [not null]\n  summary TEXT [default: '']\n  severity TEXT [default: 'medium']\n  status TEXT [default: 'open']\n  task_id TEXT\n  completed INTEGER [default: 0]\n  regressed INTEGER [default: 0]\n  archived INTEGER [default: 0]\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  current_behavior TEXT [default: '']\n  expected_behavior TEXT [default: '']\n  work_item_type TEXT [default: 'software_bug']\n  affected_module_keys TEXT [default: '[]']\n}\n\nTable credentials {\n  id TEXT [pk]\n  name TEXT [not null]\n  host TEXT [not null]\n  port INTEGER [default: 22]\n  user TEXT [not null]\n  password TEXT\n  key_path TEXT\n}\n\nTable entity_relationships {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  source_entity_type TEXT [not null]\n  source_entity_id TEXT [not null]\n  relationship_type TEXT [not null]\n  target_entity_type TEXT [not null]\n  target_entity_id TEXT [not null]\n  metadata_json TEXT [default: '{}']\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n}\n\nTable feature_items {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  code TEXT [not null]\n  title TEXT [not null]\n  summary TEXT [default: '']\n  status TEXT [default: 'planned']\n  roadmap_phase_id TEXT\n  task_id TEXT\n  archived INTEGER [default: 0]\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  work_item_type TEXT [default: 'software_feature']\n  affected_module_keys TEXT [default: '[]']\n}\n\nTable integration_events {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  source TEXT [not null]\n  event_type TEXT [not null]\n  delivery_status TEXT [default: 'received']\n  payload TEXT [default: '{}']\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n}\n\nTable migrations {\n  id INTEGER [pk]\n  name TEXT [unique, not null]\n  executed_at TEXT [default: CURRENT_TIMESTAMP]\n}\n\nTable prd_fragments {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  feature_id TEXT\n  code TEXT [not null]\n  title TEXT [not null]\n  markdown TEXT [default: '']\n  mermaid TEXT [default: '']\n  status TEXT [default: 'draft']\n  merged INTEGER [default: 0]\n  merged_at TEXT\n  file_name TEXT\n  file_path TEXT\n  file_updated_at TEXT\n  file_md5 TEXT [default: '']\n  db_md5 TEXT [default: '']\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  merged_file_name TEXT\n}\n\nTable project_md_documents {\n  project_id TEXT [pk, not null]\n  doc_type TEXT [pk, not null]\n  markdown TEXT [default: '']\n  mermaid TEXT [default: '']\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  file_path TEXT\n  file_updated_at TEXT\n  file_md5 TEXT [default: '']\n  db_md5 TEXT [default: '']\n  editor_state TEXT [default: '']\n  title TEXT [default: '']\n  module_key TEXT [default: '']\n  template_name TEXT [default: '']\n  template_version TEXT [default: '']\n  source_of_truth TEXT [default: 'database']\n}\n\nTable project_modules {\n  project_id TEXT [pk, not null]\n  module_key TEXT [pk, not null]\n  module_group TEXT [not null]\n  label TEXT [not null]\n  description TEXT [default: '']\n  enabled INTEGER [default: 0]\n  is_core INTEGER [default: 0]\n  sort_order INTEGER [default: 0]\n  settings_json TEXT [default: '{}']\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  purpose_summary TEXT [default: '']\n}\n\nTable projects {\n  id TEXT [pk]\n  path TEXT\n  absolute_path TEXT\n  name TEXT [not null]\n  description TEXT\n  parent_id TEXT\n  server_id TEXT\n  image_path TEXT\n  open_in_cursor INTEGER [default: 0]\n  category TEXT\n  tags TEXT [default: '[]']\n  links TEXT [default: '[]']\n  date_added TEXT\n  type TEXT [default: 'folder']\n  open_in_cursor_admin INTEGER [default: 0]\n  url TEXT\n  pinned INTEGER [default: 0]\n  image_url TEXT\n  upload_mappings TEXT [default: '[]']\n  mapping_groups TEXT [default: '[]']\n  primary_action TEXT [default: 'auto']\n  integrations TEXT [default: '{}']\n  workspace_plugins TEXT [default: '[]']\n  project_type TEXT [default: 'general']\n}\n\nTable roadmap_fragments {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  source_feature_id TEXT\n  source_phase_id TEXT\n  code TEXT [not null]\n  title TEXT [not null]\n  markdown TEXT [not null, default: '']\n  mermaid TEXT [not null, default: '']\n  payload_json TEXT [not null, default: '']\n  status TEXT [not null, default: 'draft']\n  merged INTEGER [not null, default: 0]\n  merged_at TEXT\n  integrated_at TEXT\n  file_name TEXT\n  file_path TEXT\n  file_updated_at TEXT\n  file_md5 TEXT [not null, default: '']\n  db_md5 TEXT [not null, default: '']\n  created_at TEXT [not null]\n  updated_at TEXT [not null]\n}\n\nTable roadmap_phases {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  code TEXT [not null]\n  name TEXT [not null]\n  summary TEXT [default: '']\n  goal TEXT [default: '']\n  status TEXT [default: 'planned']\n  target_date TEXT\n  sort_order INTEGER [default: 0]\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  after_phase_id TEXT\n  archived INTEGER [default: 0]\n}\n\nTable tasks {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  title TEXT [not null]\n  description TEXT\n  status TEXT [default: 'todo']\n  priority TEXT [default: 'medium']\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  due_date TEXT\n  assigned_to TEXT\n  start_date TEXT\n  end_date TEXT\n  dependency_ids TEXT [default: '[]']\n  progress INTEGER [default: 0]\n  milestone INTEGER [default: 0]\n  sort_order INTEGER [default: 0]\n  roadmap_phase_id TEXT\n  planning_bucket TEXT [default: 'considered']\n  item_type TEXT [default: 'task']\n  category TEXT\n  work_item_type TEXT [default: 'core_task']\n}\n\nRef: bug_items.project_id < projects.id\nRef: entity_relationships.project_id < projects.id\nRef: feature_items.project_id < projects.id\nRef: integration_events.project_id < projects.id\nRef: prd_fragments.project_id < projects.id\nRef: project_md_documents.project_id < projects.id\nRef: project_modules.project_id < projects.id\nRef: roadmap_phases.project_id < projects.id\nRef: tasks.project_id < projects.id",
    "schemaModel": {
      "source": {
        "sourceType": "sqlite_database",
        "sourceLabel": "C:\\Users\\croni\\Projects\\data\\app.db",
        "dialect": "sqlite",
        "observedAt": "2026-04-03T00:16:28.120Z",
        "schemaFingerprint": "6472ebfcb4f9ce91151ef8d1006b39d2",
        "confidence": "observed"
      },
      "summary": "Observed SQLite schema imported from the live Angel's Project Manager runtime database to regenerate DATABASE_SCHEMA.md and DATABASE_SCHEMA.dbml.",
      "entities": [
        {
          "id": "app_settings",
          "name": "app_settings",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "key",
              "name": "key",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "value",
              "name": "value",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "is_secret",
              "name": "is_secret",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "updated_at",
              "name": "updated_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        },
        {
          "id": "bug_items",
          "name": "bug_items",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "id",
              "name": "id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "project_id",
              "name": "project_id",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "projects",
              "referencesFieldId": "id",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "code",
              "name": "code",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "title",
              "name": "title",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "summary",
              "name": "summary",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "severity",
              "name": "severity",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'medium'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "status",
              "name": "status",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'open'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "task_id",
              "name": "task_id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "completed",
              "name": "completed",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "regressed",
              "name": "regressed",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "archived",
              "name": "archived",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "created_at",
              "name": "created_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "updated_at",
              "name": "updated_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "current_behavior",
              "name": "current_behavior",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "expected_behavior",
              "name": "expected_behavior",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "work_item_type",
              "name": "work_item_type",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'software_bug'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "affected_module_keys",
              "name": "affected_module_keys",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'[]'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        },
        {
          "id": "credentials",
          "name": "credentials",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "id",
              "name": "id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "name",
              "name": "name",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "host",
              "name": "host",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "port",
              "name": "port",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "22",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "user",
              "name": "user",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "password",
              "name": "password",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "key_path",
              "name": "key_path",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        },
        {
          "id": "entity_relationships",
          "name": "entity_relationships",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "id",
              "name": "id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "project_id",
              "name": "project_id",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "projects",
              "referencesFieldId": "id",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "source_entity_type",
              "name": "source_entity_type",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "source_entity_id",
              "name": "source_entity_id",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "relationship_type",
              "name": "relationship_type",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "target_entity_type",
              "name": "target_entity_type",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "target_entity_id",
              "name": "target_entity_id",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "metadata_json",
              "name": "metadata_json",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'{}'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "created_at",
              "name": "created_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "updated_at",
              "name": "updated_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        },
        {
          "id": "feature_items",
          "name": "feature_items",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "id",
              "name": "id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "project_id",
              "name": "project_id",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "projects",
              "referencesFieldId": "id",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "code",
              "name": "code",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "title",
              "name": "title",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "summary",
              "name": "summary",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "status",
              "name": "status",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'planned'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "roadmap_phase_id",
              "name": "roadmap_phase_id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "task_id",
              "name": "task_id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "archived",
              "name": "archived",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "created_at",
              "name": "created_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "updated_at",
              "name": "updated_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "work_item_type",
              "name": "work_item_type",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'software_feature'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "affected_module_keys",
              "name": "affected_module_keys",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'[]'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        },
        {
          "id": "integration_events",
          "name": "integration_events",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "id",
              "name": "id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "project_id",
              "name": "project_id",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "projects",
              "referencesFieldId": "id",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "source",
              "name": "source",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "event_type",
              "name": "event_type",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "delivery_status",
              "name": "delivery_status",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'received'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "payload",
              "name": "payload",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'{}'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "created_at",
              "name": "created_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        },
        {
          "id": "migrations",
          "name": "migrations",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "id",
              "name": "id",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "name",
              "name": "name",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": true,
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "executed_at",
              "name": "executed_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        },
        {
          "id": "prd_fragments",
          "name": "prd_fragments",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "id",
              "name": "id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "project_id",
              "name": "project_id",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "projects",
              "referencesFieldId": "id",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "feature_id",
              "name": "feature_id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "code",
              "name": "code",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "title",
              "name": "title",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "markdown",
              "name": "markdown",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "mermaid",
              "name": "mermaid",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "status",
              "name": "status",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'draft'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "merged",
              "name": "merged",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "merged_at",
              "name": "merged_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "file_name",
              "name": "file_name",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "file_path",
              "name": "file_path",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "file_updated_at",
              "name": "file_updated_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "file_md5",
              "name": "file_md5",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "db_md5",
              "name": "db_md5",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "created_at",
              "name": "created_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "updated_at",
              "name": "updated_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "merged_file_name",
              "name": "merged_file_name",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        },
        {
          "id": "project_md_documents",
          "name": "project_md_documents",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "project_id",
              "name": "project_id",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "projects",
              "referencesFieldId": "id",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "doc_type",
              "name": "doc_type",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "markdown",
              "name": "markdown",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "mermaid",
              "name": "mermaid",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "updated_at",
              "name": "updated_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "file_path",
              "name": "file_path",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "file_updated_at",
              "name": "file_updated_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "file_md5",
              "name": "file_md5",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "db_md5",
              "name": "db_md5",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "editor_state",
              "name": "editor_state",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "title",
              "name": "title",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "module_key",
              "name": "module_key",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "template_name",
              "name": "template_name",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "template_version",
              "name": "template_version",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "source_of_truth",
              "name": "source_of_truth",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'database'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        },
        {
          "id": "project_modules",
          "name": "project_modules",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "project_id",
              "name": "project_id",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "projects",
              "referencesFieldId": "id",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "module_key",
              "name": "module_key",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "module_group",
              "name": "module_group",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "label",
              "name": "label",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "description",
              "name": "description",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "enabled",
              "name": "enabled",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "is_core",
              "name": "is_core",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "sort_order",
              "name": "sort_order",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "settings_json",
              "name": "settings_json",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'{}'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "created_at",
              "name": "created_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "updated_at",
              "name": "updated_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "purpose_summary",
              "name": "purpose_summary",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        },
        {
          "id": "projects",
          "name": "projects",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "id",
              "name": "id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "path",
              "name": "path",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "absolute_path",
              "name": "absolute_path",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "name",
              "name": "name",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "description",
              "name": "description",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "parent_id",
              "name": "parent_id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "server_id",
              "name": "server_id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "image_path",
              "name": "image_path",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "open_in_cursor",
              "name": "open_in_cursor",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "category",
              "name": "category",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "tags",
              "name": "tags",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'[]'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "links",
              "name": "links",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'[]'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "date_added",
              "name": "date_added",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "type",
              "name": "type",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'folder'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "open_in_cursor_admin",
              "name": "open_in_cursor_admin",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "url",
              "name": "url",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "pinned",
              "name": "pinned",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "image_url",
              "name": "image_url",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "upload_mappings",
              "name": "upload_mappings",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'[]'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "mapping_groups",
              "name": "mapping_groups",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'[]'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "primary_action",
              "name": "primary_action",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'auto'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "integrations",
              "name": "integrations",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'{}'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "workspace_plugins",
              "name": "workspace_plugins",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'[]'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "project_type",
              "name": "project_type",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'general'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        },
        {
          "id": "roadmap_fragments",
          "name": "roadmap_fragments",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "id",
              "name": "id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "project_id",
              "name": "project_id",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "source_feature_id",
              "name": "source_feature_id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "source_phase_id",
              "name": "source_phase_id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "code",
              "name": "code",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "title",
              "name": "title",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "markdown",
              "name": "markdown",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "mermaid",
              "name": "mermaid",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "payload_json",
              "name": "payload_json",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "status",
              "name": "status",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'draft'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "merged",
              "name": "merged",
              "type": "INTEGER",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "merged_at",
              "name": "merged_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "integrated_at",
              "name": "integrated_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "file_name",
              "name": "file_name",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "file_path",
              "name": "file_path",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "file_updated_at",
              "name": "file_updated_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "file_md5",
              "name": "file_md5",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "db_md5",
              "name": "db_md5",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "created_at",
              "name": "created_at",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "updated_at",
              "name": "updated_at",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        },
        {
          "id": "roadmap_phases",
          "name": "roadmap_phases",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "id",
              "name": "id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "project_id",
              "name": "project_id",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "projects",
              "referencesFieldId": "id",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "code",
              "name": "code",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "name",
              "name": "name",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "summary",
              "name": "summary",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "goal",
              "name": "goal",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "''",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "status",
              "name": "status",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'planned'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "target_date",
              "name": "target_date",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "sort_order",
              "name": "sort_order",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "created_at",
              "name": "created_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "updated_at",
              "name": "updated_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "after_phase_id",
              "name": "after_phase_id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "archived",
              "name": "archived",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        },
        {
          "id": "tasks",
          "name": "tasks",
          "kind": "table",
          "status": "observed",
          "changeState": "",
          "notes": "",
          "fields": [
            {
              "id": "id",
              "name": "id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": true,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "project_id",
              "name": "project_id",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "projects",
              "referencesFieldId": "id",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "title",
              "name": "title",
              "type": "TEXT",
              "nullable": false,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "description",
              "name": "description",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "status",
              "name": "status",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'todo'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "priority",
              "name": "priority",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'medium'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "created_at",
              "name": "created_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "updated_at",
              "name": "updated_at",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "CURRENT_TIMESTAMP",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "due_date",
              "name": "due_date",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "assigned_to",
              "name": "assigned_to",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "start_date",
              "name": "start_date",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "end_date",
              "name": "end_date",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "dependency_ids",
              "name": "dependency_ids",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'[]'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "progress",
              "name": "progress",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "milestone",
              "name": "milestone",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "sort_order",
              "name": "sort_order",
              "type": "INTEGER",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "0",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "roadmap_phase_id",
              "name": "roadmap_phase_id",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "planning_bucket",
              "name": "planning_bucket",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'considered'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "item_type",
              "name": "item_type",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'task'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "category",
              "name": "category",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            },
            {
              "id": "work_item_type",
              "name": "work_item_type",
              "type": "TEXT",
              "nullable": true,
              "primaryKey": false,
              "unique": "",
              "defaultValue": "'core_task'",
              "referencesEntityId": "",
              "referencesFieldId": "",
              "status": "observed",
              "changeState": "",
              "notes": ""
            }
          ],
          "position": null
        }
      ],
      "relationships": [
        {
          "id": "bug_items:project_id:projects:id:0",
          "fromEntityId": "bug_items",
          "fromFieldId": "project_id",
          "toEntityId": "projects",
          "toFieldId": "id",
          "cardinality": "many-to-one",
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "entity_relationships:project_id:projects:id:0",
          "fromEntityId": "entity_relationships",
          "fromFieldId": "project_id",
          "toEntityId": "projects",
          "toFieldId": "id",
          "cardinality": "many-to-one",
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "feature_items:project_id:projects:id:0",
          "fromEntityId": "feature_items",
          "fromFieldId": "project_id",
          "toEntityId": "projects",
          "toFieldId": "id",
          "cardinality": "many-to-one",
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "integration_events:project_id:projects:id:0",
          "fromEntityId": "integration_events",
          "fromFieldId": "project_id",
          "toEntityId": "projects",
          "toFieldId": "id",
          "cardinality": "many-to-one",
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "prd_fragments:project_id:projects:id:0",
          "fromEntityId": "prd_fragments",
          "fromFieldId": "project_id",
          "toEntityId": "projects",
          "toFieldId": "id",
          "cardinality": "many-to-one",
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "project_md_documents:project_id:projects:id:0",
          "fromEntityId": "project_md_documents",
          "fromFieldId": "project_id",
          "toEntityId": "projects",
          "toFieldId": "id",
          "cardinality": "many-to-one",
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "project_modules:project_id:projects:id:0",
          "fromEntityId": "project_modules",
          "fromFieldId": "project_id",
          "toEntityId": "projects",
          "toFieldId": "id",
          "cardinality": "many-to-one",
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "roadmap_phases:project_id:projects:id:0",
          "fromEntityId": "roadmap_phases",
          "fromFieldId": "project_id",
          "toEntityId": "projects",
          "toFieldId": "id",
          "cardinality": "many-to-one",
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "tasks:project_id:projects:id:0",
          "fromEntityId": "tasks",
          "fromFieldId": "project_id",
          "toEntityId": "projects",
          "toFieldId": "id",
          "cardinality": "many-to-one",
          "status": "observed",
          "changeState": "",
          "notes": ""
        }
      ],
      "indexes": [
        {
          "id": "sqlite_autoindex_app_settings_1",
          "entityId": "app_settings",
          "name": "sqlite_autoindex_app_settings_1",
          "fields": [
            "key"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Primary key backing index."
        },
        {
          "id": "idx_bug_items_project_archived",
          "entityId": "bug_items",
          "name": "idx_bug_items_project_archived",
          "fields": [
            "project_id",
            "archived",
            "updated_at"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "sqlite_autoindex_bug_items_1",
          "entityId": "bug_items",
          "name": "sqlite_autoindex_bug_items_1",
          "fields": [
            "id"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Primary key backing index."
        },
        {
          "id": "sqlite_autoindex_credentials_1",
          "entityId": "credentials",
          "name": "sqlite_autoindex_credentials_1",
          "fields": [
            "id"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Primary key backing index."
        },
        {
          "id": "idx_entity_relationships_project_target",
          "entityId": "entity_relationships",
          "name": "idx_entity_relationships_project_target",
          "fields": [
            "project_id",
            "target_entity_type",
            "target_entity_id"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_entity_relationships_project_source",
          "entityId": "entity_relationships",
          "name": "idx_entity_relationships_project_source",
          "fields": [
            "project_id",
            "source_entity_type",
            "source_entity_id"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "sqlite_autoindex_entity_relationships_1",
          "entityId": "entity_relationships",
          "name": "sqlite_autoindex_entity_relationships_1",
          "fields": [
            "id"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Primary key backing index."
        },
        {
          "id": "idx_feature_items_project_archived",
          "entityId": "feature_items",
          "name": "idx_feature_items_project_archived",
          "fields": [
            "project_id",
            "archived",
            "updated_at"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "sqlite_autoindex_feature_items_1",
          "entityId": "feature_items",
          "name": "sqlite_autoindex_feature_items_1",
          "fields": [
            "id"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Primary key backing index."
        },
        {
          "id": "idx_integration_events_source",
          "entityId": "integration_events",
          "name": "idx_integration_events_source",
          "fields": [
            "source"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_integration_events_project_created",
          "entityId": "integration_events",
          "name": "idx_integration_events_project_created",
          "fields": [
            "project_id",
            "created_at"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "sqlite_autoindex_integration_events_1",
          "entityId": "integration_events",
          "name": "sqlite_autoindex_integration_events_1",
          "fields": [
            "id"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Primary key backing index."
        },
        {
          "id": "sqlite_autoindex_migrations_1",
          "entityId": "migrations",
          "name": "sqlite_autoindex_migrations_1",
          "fields": [
            "name"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Unique constraint backing index."
        },
        {
          "id": "idx_prd_fragments_project_merged",
          "entityId": "prd_fragments",
          "name": "idx_prd_fragments_project_merged",
          "fields": [
            "project_id",
            "merged",
            "updated_at"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_prd_fragments_project_feature",
          "entityId": "prd_fragments",
          "name": "idx_prd_fragments_project_feature",
          "fields": [
            "project_id",
            "feature_id"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "sqlite_autoindex_prd_fragments_1",
          "entityId": "prd_fragments",
          "name": "sqlite_autoindex_prd_fragments_1",
          "fields": [
            "id"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Primary key backing index."
        },
        {
          "id": "sqlite_autoindex_project_md_documents_1",
          "entityId": "project_md_documents",
          "name": "sqlite_autoindex_project_md_documents_1",
          "fields": [
            "project_id",
            "doc_type"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Primary key backing index."
        },
        {
          "id": "idx_project_modules_project_group",
          "entityId": "project_modules",
          "name": "idx_project_modules_project_group",
          "fields": [
            "project_id",
            "module_group",
            "sort_order"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "sqlite_autoindex_project_modules_1",
          "entityId": "project_modules",
          "name": "sqlite_autoindex_project_modules_1",
          "fields": [
            "project_id",
            "module_key"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Primary key backing index."
        },
        {
          "id": "idx_projects_pinned",
          "entityId": "projects",
          "name": "idx_projects_pinned",
          "fields": [
            "pinned"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_projects_category",
          "entityId": "projects",
          "name": "idx_projects_category",
          "fields": [
            "category"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "sqlite_autoindex_projects_1",
          "entityId": "projects",
          "name": "sqlite_autoindex_projects_1",
          "fields": [
            "id"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Primary key backing index."
        },
        {
          "id": "idx_roadmap_fragments_project_status",
          "entityId": "roadmap_fragments",
          "name": "idx_roadmap_fragments_project_status",
          "fields": [
            "project_id",
            "merged",
            "updated_at"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_roadmap_fragments_project_feature",
          "entityId": "roadmap_fragments",
          "name": "idx_roadmap_fragments_project_feature",
          "fields": [
            "project_id",
            "source_feature_id"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "sqlite_autoindex_roadmap_fragments_1",
          "entityId": "roadmap_fragments",
          "name": "sqlite_autoindex_roadmap_fragments_1",
          "fields": [
            "id"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Primary key backing index."
        },
        {
          "id": "idx_roadmap_phases_after",
          "entityId": "roadmap_phases",
          "name": "idx_roadmap_phases_after",
          "fields": [
            "project_id",
            "after_phase_id"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_roadmap_phases_project_archive",
          "entityId": "roadmap_phases",
          "name": "idx_roadmap_phases_project_archive",
          "fields": [
            "project_id",
            "archived",
            "sort_order"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_roadmap_phases_project_sort",
          "entityId": "roadmap_phases",
          "name": "idx_roadmap_phases_project_sort",
          "fields": [
            "project_id",
            "sort_order"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "sqlite_autoindex_roadmap_phases_1",
          "entityId": "roadmap_phases",
          "name": "sqlite_autoindex_roadmap_phases_1",
          "fields": [
            "id"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Primary key backing index."
        },
        {
          "id": "idx_tasks_project_work_item_type",
          "entityId": "tasks",
          "name": "idx_tasks_project_work_item_type",
          "fields": [
            "project_id",
            "work_item_type",
            "updated_at"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_tasks_project_category",
          "entityId": "tasks",
          "name": "idx_tasks_project_category",
          "fields": [
            "project_id",
            "category"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_tasks_project_type",
          "entityId": "tasks",
          "name": "idx_tasks_project_type",
          "fields": [
            "project_id",
            "item_type",
            "updated_at"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_tasks_project_bucket",
          "entityId": "tasks",
          "name": "idx_tasks_project_bucket",
          "fields": [
            "project_id",
            "planning_bucket",
            "updated_at"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_tasks_project_phase",
          "entityId": "tasks",
          "name": "idx_tasks_project_phase",
          "fields": [
            "project_id",
            "roadmap_phase_id",
            "sort_order"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_tasks_sort_order",
          "entityId": "tasks",
          "name": "idx_tasks_sort_order",
          "fields": [
            "project_id",
            "sort_order"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_tasks_status",
          "entityId": "tasks",
          "name": "idx_tasks_status",
          "fields": [
            "status"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "idx_tasks_project_id",
          "entityId": "tasks",
          "name": "idx_tasks_project_id",
          "fields": [
            "project_id"
          ],
          "unique": false,
          "status": "observed",
          "changeState": "",
          "notes": ""
        },
        {
          "id": "sqlite_autoindex_tasks_1",
          "entityId": "tasks",
          "name": "sqlite_autoindex_tasks_1",
          "fields": [
            "id"
          ],
          "unique": true,
          "status": "observed",
          "changeState": "",
          "notes": "Primary key backing index."
        }
      ],
      "constraints": [
        {
          "id": "migrations:sqlite_autoindex_migrations_1:unique",
          "entityId": "migrations",
          "name": "sqlite_autoindex_migrations_1",
          "type": "unique",
          "definition": "UNIQUE (name)",
          "status": "observed",
          "changeState": "",
          "notes": ""
        }
      ],
      "migrationNotes": [
        {
          "title": "Live runtime schema capture",
          "description": "This fragment was generated directly from the active runtime SQLite database for Angel's Project Manager.",
          "status": "observed"
        }
      ],
      "openQuestions": [],
      "mermaid": "erDiagram\n  APP_SETTINGS {\n    TEXT key PK\n    TEXT value\n    INTEGER is_secret\n    TEXT updated_at\n  }\n  BUG_ITEMS {\n    TEXT id PK\n    TEXT project_id\n    TEXT code\n    TEXT title\n    TEXT summary\n    TEXT severity\n    TEXT status\n    TEXT task_id\n    INTEGER completed\n    INTEGER regressed\n    INTEGER archived\n    TEXT created_at\n    TEXT updated_at\n    TEXT current_behavior\n    TEXT expected_behavior\n    TEXT work_item_type\n    TEXT affected_module_keys\n  }\n  CREDENTIALS {\n    TEXT id PK\n    TEXT name\n    TEXT host\n    INTEGER port\n    TEXT user\n    TEXT password\n    TEXT key_path\n  }\n  ENTITY_RELATIONSHIPS {\n    TEXT id PK\n    TEXT project_id\n    TEXT source_entity_type\n    TEXT source_entity_id\n    TEXT relationship_type\n    TEXT target_entity_type\n    TEXT target_entity_id\n    TEXT metadata_json\n    TEXT created_at\n    TEXT updated_at\n  }\n  FEATURE_ITEMS {\n    TEXT id PK\n    TEXT project_id\n    TEXT code\n    TEXT title\n    TEXT summary\n    TEXT status\n    TEXT roadmap_phase_id\n    TEXT task_id\n    INTEGER archived\n    TEXT created_at\n    TEXT updated_at\n    TEXT work_item_type\n    TEXT affected_module_keys\n  }\n  INTEGRATION_EVENTS {\n    TEXT id PK\n    TEXT project_id\n    TEXT source\n    TEXT event_type\n    TEXT delivery_status\n    TEXT payload\n    TEXT created_at\n  }\n  MIGRATIONS {\n    INTEGER id PK\n    TEXT name\n    TEXT executed_at\n  }\n  PRD_FRAGMENTS {\n    TEXT id PK\n    TEXT project_id\n    TEXT feature_id\n    TEXT code\n    TEXT title\n    TEXT markdown\n    TEXT mermaid\n    TEXT status\n    INTEGER merged\n    TEXT merged_at\n    TEXT file_name\n    TEXT file_path\n    TEXT file_updated_at\n    TEXT file_md5\n    TEXT db_md5\n    TEXT created_at\n    TEXT updated_at\n    TEXT merged_file_name\n  }\n  PROJECT_MD_DOCUMENTS {\n    TEXT project_id PK\n    TEXT doc_type PK\n    TEXT markdown\n    TEXT mermaid\n    TEXT updated_at\n    TEXT file_path\n    TEXT file_updated_at\n    TEXT file_md5\n    TEXT db_md5\n    TEXT editor_state\n    TEXT title\n    TEXT module_key\n    TEXT template_name\n    TEXT template_version\n    TEXT source_of_truth\n  }\n  PROJECT_MODULES {\n    TEXT project_id PK\n    TEXT module_key PK\n    TEXT module_group\n    TEXT label\n    TEXT description\n    INTEGER enabled\n    INTEGER is_core\n    INTEGER sort_order\n    TEXT settings_json\n    TEXT created_at\n    TEXT updated_at\n    TEXT purpose_summary\n  }\n  PROJECTS {\n    TEXT id PK\n    TEXT path\n    TEXT absolute_path\n    TEXT name\n    TEXT description\n    TEXT parent_id\n    TEXT server_id\n    TEXT image_path\n    INTEGER open_in_cursor\n    TEXT category\n    TEXT tags\n    TEXT links\n    TEXT date_added\n    TEXT type\n    INTEGER open_in_cursor_admin\n    TEXT url\n    INTEGER pinned\n    TEXT image_url\n    TEXT upload_mappings\n    TEXT mapping_groups\n    TEXT primary_action\n    TEXT integrations\n    TEXT workspace_plugins\n    TEXT project_type\n  }\n  ROADMAP_FRAGMENTS {\n    TEXT id PK\n    TEXT project_id\n    TEXT source_feature_id\n    TEXT source_phase_id\n    TEXT code\n    TEXT title\n    TEXT markdown\n    TEXT mermaid\n    TEXT payload_json\n    TEXT status\n    INTEGER merged\n    TEXT merged_at\n    TEXT integrated_at\n    TEXT file_name\n    TEXT file_path\n    TEXT file_updated_at\n    TEXT file_md5\n    TEXT db_md5\n    TEXT created_at\n    TEXT updated_at\n  }\n  ROADMAP_PHASES {\n    TEXT id PK\n    TEXT project_id\n    TEXT code\n    TEXT name\n    TEXT summary\n    TEXT goal\n    TEXT status\n    TEXT target_date\n    INTEGER sort_order\n    TEXT created_at\n    TEXT updated_at\n    TEXT after_phase_id\n    INTEGER archived\n  }\n  TASKS {\n    TEXT id PK\n    TEXT project_id\n    TEXT title\n    TEXT description\n    TEXT status\n    TEXT priority\n    TEXT created_at\n    TEXT updated_at\n    TEXT due_date\n    TEXT assigned_to\n    TEXT start_date\n    TEXT end_date\n    TEXT dependency_ids\n    INTEGER progress\n    INTEGER milestone\n    INTEGER sort_order\n    TEXT roadmap_phase_id\n    TEXT planning_bucket\n    TEXT item_type\n    TEXT category\n    TEXT work_item_type\n  }\n  PROJECTS ||--o{ BUG_ITEMS : \"project_id\"\n  PROJECTS ||--o{ ENTITY_RELATIONSHIPS : \"project_id\"\n  PROJECTS ||--o{ FEATURE_ITEMS : \"project_id\"\n  PROJECTS ||--o{ INTEGRATION_EVENTS : \"project_id\"\n  PROJECTS ||--o{ PRD_FRAGMENTS : \"project_id\"\n  PROJECTS ||--o{ PROJECT_MD_DOCUMENTS : \"project_id\"\n  PROJECTS ||--o{ PROJECT_MODULES : \"project_id\"\n  PROJECTS ||--o{ ROADMAP_PHASES : \"project_id\"\n  PROJECTS ||--o{ TASKS : \"project_id\""
    },
    "fragmentHistory": [
      {
        "id": "dbfrag-runtime-20260403001628",
        "code": "DBFRAG-RUNTIME-001",
        "title": "Runtime SQLite Schema Resync",
        "markdown": "# Database Schema Fragment: Runtime SQLite Schema Resync\n\n> Managed document. Must comply with template DATABASE_SCHEMA_FRAGMENT.template.md.\n\n<\u0021-- APM:DATA\n{\n  \"docType\": \"database_schema_fragment\",\n  \"version\": 1,\n  \"fragment\": {\n    \"id\": \"dbfrag-runtime-20260403001628\",\n    \"projectId\": \"1772489365575-mj2xfcm\",\n    \"code\": \"DBFRAG-RUNTIME-001\",\n    \"title\": \"Runtime SQLite Schema Resync\",\n    \"markdown\": \"## Import Summary\\n\\nObserved SQLite schema imported from the live Angel's Project Manager runtime database to regenerate DATABASE_SCHEMA.md and DATABASE_SCHEMA.dbml.\\n\\n## Source Metadata\\n\\n- Source Type: sqlite_database\\n- Source Label: C:\\\\Users\\\\croni\\\\Projects\\\\data\\\\app.db\\n- Dialect: sqlite\\n- Confidence: observed\\n- Observed At: 2026-04-03T00:16:28.120Z\\n- Schema Fingerprint: 6472ebfcb4f9ce91151ef8d1006b39d2\\n\\n## Observed Schema Summary\\n\\n- 14 tables/views observed\\n- 9 foreign-key relationships observed\\n- 38 indexes observed\\n- 1 explicit unique constraints observed\\n\\n## Entities\\n\\n### 1. app_settings\\n\\n- Kind: table\\n- Status: observed\\n- `key`: Type: TEXT; Nullable: yes; Primary key\\n- `value`: Type: TEXT; Nullable: yes\\n- `is_secret`: Type: INTEGER; Nullable: yes; Default: 0\\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n\\n### 2. bug_items\\n\\n- Kind: table\\n- Status: observed\\n- `id`: Type: TEXT; Nullable: yes; Primary key\\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\\n- `code`: Type: TEXT; Nullable: no\\n- `title`: Type: TEXT; Nullable: no\\n- `summary`: Type: TEXT; Nullable: yes; Default: ''\\n- `severity`: Type: TEXT; Nullable: yes; Default: 'medium'\\n- `status`: Type: TEXT; Nullable: yes; Default: 'open'\\n- `task_id`: Type: TEXT; Nullable: yes\\n- `completed`: Type: INTEGER; Nullable: yes; Default: 0\\n- `regressed`: Type: INTEGER; Nullable: yes; Default: 0\\n- `archived`: Type: INTEGER; Nullable: yes; Default: 0\\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `current_behavior`: Type: TEXT; Nullable: yes; Default: ''\\n- `expected_behavior`: Type: TEXT; Nullable: yes; Default: ''\\n- `work_item_type`: Type: TEXT; Nullable: yes; Default: 'software_bug'\\n- `affected_module_keys`: Type: TEXT; Nullable: yes; Default: '[]'\\n\\n### 3. credentials\\n\\n- Kind: table\\n- Status: observed\\n- `id`: Type: TEXT; Nullable: yes; Primary key\\n- `name`: Type: TEXT; Nullable: no\\n- `host`: Type: TEXT; Nullable: no\\n- `port`: Type: INTEGER; Nullable: yes; Default: 22\\n- `user`: Type: TEXT; Nullable: no\\n- `password`: Type: TEXT; Nullable: yes\\n- `key_path`: Type: TEXT; Nullable: yes\\n\\n### 4. entity_relationships\\n\\n- Kind: table\\n- Status: observed\\n- `id`: Type: TEXT; Nullable: yes; Primary key\\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\\n- `source_entity_type`: Type: TEXT; Nullable: no\\n- `source_entity_id`: Type: TEXT; Nullable: no\\n- `relationship_type`: Type: TEXT; Nullable: no\\n- `target_entity_type`: Type: TEXT; Nullable: no\\n- `target_entity_id`: Type: TEXT; Nullable: no\\n- `metadata_json`: Type: TEXT; Nullable: yes; Default: '{}'\\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n\\n### 5. feature_items\\n\\n- Kind: table\\n- Status: observed\\n- `id`: Type: TEXT; Nullable: yes; Primary key\\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\\n- `code`: Type: TEXT; Nullable: no\\n- `title`: Type: TEXT; Nullable: no\\n- `summary`: Type: TEXT; Nullable: yes; Default: ''\\n- `status`: Type: TEXT; Nullable: yes; Default: 'planned'\\n- `roadmap_phase_id`: Type: TEXT; Nullable: yes\\n- `task_id`: Type: TEXT; Nullable: yes\\n- `archived`: Type: INTEGER; Nullable: yes; Default: 0\\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `work_item_type`: Type: TEXT; Nullable: yes; Default: 'software_feature'\\n- `affected_module_keys`: Type: TEXT; Nullable: yes; Default: '[]'\\n\\n### 6. integration_events\\n\\n- Kind: table\\n- Status: observed\\n- `id`: Type: TEXT; Nullable: yes; Primary key\\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\\n- `source`: Type: TEXT; Nullable: no\\n- `event_type`: Type: TEXT; Nullable: no\\n- `delivery_status`: Type: TEXT; Nullable: yes; Default: 'received'\\n- `payload`: Type: TEXT; Nullable: yes; Default: '{}'\\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n\\n### 7. migrations\\n\\n- Kind: table\\n- Status: observed\\n- `id`: Type: INTEGER; Nullable: yes; Primary key\\n- `name`: Type: TEXT; Nullable: no; Unique\\n- `executed_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n\\n### 8. prd_fragments\\n\\n- Kind: table\\n- Status: observed\\n- `id`: Type: TEXT; Nullable: yes; Primary key\\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\\n- `feature_id`: Type: TEXT; Nullable: yes\\n- `code`: Type: TEXT; Nullable: no\\n- `title`: Type: TEXT; Nullable: no\\n- `markdown`: Type: TEXT; Nullable: yes; Default: ''\\n- `mermaid`: Type: TEXT; Nullable: yes; Default: ''\\n- `status`: Type: TEXT; Nullable: yes; Default: 'draft'\\n- `merged`: Type: INTEGER; Nullable: yes; Default: 0\\n- `merged_at`: Type: TEXT; Nullable: yes\\n- `file_name`: Type: TEXT; Nullable: yes\\n- `file_path`: Type: TEXT; Nullable: yes\\n- `file_updated_at`: Type: TEXT; Nullable: yes\\n- `file_md5`: Type: TEXT; Nullable: yes; Default: ''\\n- `db_md5`: Type: TEXT; Nullable: yes; Default: ''\\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `merged_file_name`: Type: TEXT; Nullable: yes\\n\\n### 9. project_md_documents\\n\\n- Kind: table\\n- Status: observed\\n- `project_id`: Type: TEXT; Nullable: no; Primary key; References: projects.id\\n- `doc_type`: Type: TEXT; Nullable: no; Primary key\\n- `markdown`: Type: TEXT; Nullable: yes; Default: ''\\n- `mermaid`: Type: TEXT; Nullable: yes; Default: ''\\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `file_path`: Type: TEXT; Nullable: yes\\n- `file_updated_at`: Type: TEXT; Nullable: yes\\n- `file_md5`: Type: TEXT; Nullable: yes; Default: ''\\n- `db_md5`: Type: TEXT; Nullable: yes; Default: ''\\n- `editor_state`: Type: TEXT; Nullable: yes; Default: ''\\n- `title`: Type: TEXT; Nullable: yes; Default: ''\\n- `module_key`: Type: TEXT; Nullable: yes; Default: ''\\n- `template_name`: Type: TEXT; Nullable: yes; Default: ''\\n- `template_version`: Type: TEXT; Nullable: yes; Default: ''\\n- `source_of_truth`: Type: TEXT; Nullable: yes; Default: 'database'\\n\\n### 10. project_modules\\n\\n- Kind: table\\n- Status: observed\\n- `project_id`: Type: TEXT; Nullable: no; Primary key; References: projects.id\\n- `module_key`: Type: TEXT; Nullable: no; Primary key\\n- `module_group`: Type: TEXT; Nullable: no\\n- `label`: Type: TEXT; Nullable: no\\n- `description`: Type: TEXT; Nullable: yes; Default: ''\\n- `enabled`: Type: INTEGER; Nullable: yes; Default: 0\\n- `is_core`: Type: INTEGER; Nullable: yes; Default: 0\\n- `sort_order`: Type: INTEGER; Nullable: yes; Default: 0\\n- `settings_json`: Type: TEXT; Nullable: yes; Default: '{}'\\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `purpose_summary`: Type: TEXT; Nullable: yes; Default: ''\\n\\n### 11. projects\\n\\n- Kind: table\\n- Status: observed\\n- `id`: Type: TEXT; Nullable: yes; Primary key\\n- `path`: Type: TEXT; Nullable: yes\\n- `absolute_path`: Type: TEXT; Nullable: yes\\n- `name`: Type: TEXT; Nullable: no\\n- `description`: Type: TEXT; Nullable: yes\\n- `parent_id`: Type: TEXT; Nullable: yes\\n- `server_id`: Type: TEXT; Nullable: yes\\n- `image_path`: Type: TEXT; Nullable: yes\\n- `open_in_cursor`: Type: INTEGER; Nullable: yes; Default: 0\\n- `category`: Type: TEXT; Nullable: yes\\n- `tags`: Type: TEXT; Nullable: yes; Default: '[]'\\n- `links`: Type: TEXT; Nullable: yes; Default: '[]'\\n- `date_added`: Type: TEXT; Nullable: yes\\n- `type`: Type: TEXT; Nullable: yes; Default: 'folder'\\n- `open_in_cursor_admin`: Type: INTEGER; Nullable: yes; Default: 0\\n- `url`: Type: TEXT; Nullable: yes\\n- `pinned`: Type: INTEGER; Nullable: yes; Default: 0\\n- `image_url`: Type: TEXT; Nullable: yes\\n- `upload_mappings`: Type: TEXT; Nullable: yes; Default: '[]'\\n- `mapping_groups`: Type: TEXT; Nullable: yes; Default: '[]'\\n- `primary_action`: Type: TEXT; Nullable: yes; Default: 'auto'\\n- `integrations`: Type: TEXT; Nullable: yes; Default: '{}'\\n- `workspace_plugins`: Type: TEXT; Nullable: yes; Default: '[]'\\n- `project_type`: Type: TEXT; Nullable: yes; Default: 'general'\\n\\n### 12. roadmap_fragments\\n\\n- Kind: table\\n- Status: observed\\n- `id`: Type: TEXT; Nullable: yes; Primary key\\n- `project_id`: Type: TEXT; Nullable: no\\n- `source_feature_id`: Type: TEXT; Nullable: yes\\n- `source_phase_id`: Type: TEXT; Nullable: yes\\n- `code`: Type: TEXT; Nullable: no\\n- `title`: Type: TEXT; Nullable: no\\n- `markdown`: Type: TEXT; Nullable: no; Default: ''\\n- `mermaid`: Type: TEXT; Nullable: no; Default: ''\\n- `payload_json`: Type: TEXT; Nullable: no; Default: ''\\n- `status`: Type: TEXT; Nullable: no; Default: 'draft'\\n- `merged`: Type: INTEGER; Nullable: no; Default: 0\\n- `merged_at`: Type: TEXT; Nullable: yes\\n- `integrated_at`: Type: TEXT; Nullable: yes\\n- `file_name`: Type: TEXT; Nullable: yes\\n- `file_path`: Type: TEXT; Nullable: yes\\n- `file_updated_at`: Type: TEXT; Nullable: yes\\n- `file_md5`: Type: TEXT; Nullable: no; Default: ''\\n- `db_md5`: Type: TEXT; Nullable: no; Default: ''\\n- `created_at`: Type: TEXT; Nullable: no\\n- `updated_at`: Type: TEXT; Nullable: no\\n\\n### 13. roadmap_phases\\n\\n- Kind: table\\n- Status: observed\\n- `id`: Type: TEXT; Nullable: yes; Primary key\\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\\n- `code`: Type: TEXT; Nullable: no\\n- `name`: Type: TEXT; Nullable: no\\n- `summary`: Type: TEXT; Nullable: yes; Default: ''\\n- `goal`: Type: TEXT; Nullable: yes; Default: ''\\n- `status`: Type: TEXT; Nullable: yes; Default: 'planned'\\n- `target_date`: Type: TEXT; Nullable: yes\\n- `sort_order`: Type: INTEGER; Nullable: yes; Default: 0\\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `after_phase_id`: Type: TEXT; Nullable: yes\\n- `archived`: Type: INTEGER; Nullable: yes; Default: 0\\n\\n### 14. tasks\\n\\n- Kind: table\\n- Status: observed\\n- `id`: Type: TEXT; Nullable: yes; Primary key\\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\\n- `title`: Type: TEXT; Nullable: no\\n- `description`: Type: TEXT; Nullable: yes\\n- `status`: Type: TEXT; Nullable: yes; Default: 'todo'\\n- `priority`: Type: TEXT; Nullable: yes; Default: 'medium'\\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\\n- `due_date`: Type: TEXT; Nullable: yes\\n- `assigned_to`: Type: TEXT; Nullable: yes\\n- `start_date`: Type: TEXT; Nullable: yes\\n- `end_date`: Type: TEXT; Nullable: yes\\n- `dependency_ids`: Type: TEXT; Nullable: yes; Default: '[]'\\n- `progress`: Type: INTEGER; Nullable: yes; Default: 0\\n- `milestone`: Type: INTEGER; Nullable: yes; Default: 0\\n- `sort_order`: Type: INTEGER; Nullable: yes; Default: 0\\n- `roadmap_phase_id`: Type: TEXT; Nullable: yes\\n- `planning_bucket`: Type: TEXT; Nullable: yes; Default: 'considered'\\n- `item_type`: Type: TEXT; Nullable: yes; Default: 'task'\\n- `category`: Type: TEXT; Nullable: yes\\n- `work_item_type`: Type: TEXT; Nullable: yes; Default: 'core_task'\\n\\n## Relationships\\n\\n### 1. bug_items:project_id:projects:id:0\\n\\n- From: bug_items.project_id\\n- To: projects.id\\n- Cardinality: many-to-one\\n- Status: observed\\n\\n### 2. entity_relationships:project_id:projects:id:0\\n\\n- From: entity_relationships.project_id\\n- To: projects.id\\n- Cardinality: many-to-one\\n- Status: observed\\n\\n### 3. feature_items:project_id:projects:id:0\\n\\n- From: feature_items.project_id\\n- To: projects.id\\n- Cardinality: many-to-one\\n- Status: observed\\n\\n### 4. integration_events:project_id:projects:id:0\\n\\n- From: integration_events.project_id\\n- To: projects.id\\n- Cardinality: many-to-one\\n- Status: observed\\n\\n### 5. prd_fragments:project_id:projects:id:0\\n\\n- From: prd_fragments.project_id\\n- To: projects.id\\n- Cardinality: many-to-one\\n- Status: observed\\n\\n### 6. project_md_documents:project_id:projects:id:0\\n\\n- From: project_md_documents.project_id\\n- To: projects.id\\n- Cardinality: many-to-one\\n- Status: observed\\n\\n### 7. project_modules:project_id:projects:id:0\\n\\n- From: project_modules.project_id\\n- To: projects.id\\n- Cardinality: many-to-one\\n- Status: observed\\n\\n### 8. roadmap_phases:project_id:projects:id:0\\n\\n- From: roadmap_phases.project_id\\n- To: projects.id\\n- Cardinality: many-to-one\\n- Status: observed\\n\\n### 9. tasks:project_id:projects:id:0\\n\\n- From: tasks.project_id\\n- To: projects.id\\n- Cardinality: many-to-one\\n- Status: observed\\n\\n## Indexes and Constraints\\n\\n- Index `sqlite_autoindex_app_settings_1` on app_settings (key) [unique]\\n- Index `idx_bug_items_project_archived` on bug_items (project_id, archived, updated_at)\\n- Index `sqlite_autoindex_bug_items_1` on bug_items (id) [unique]\\n- Index `sqlite_autoindex_credentials_1` on credentials (id) [unique]\\n- Index `idx_entity_relationships_project_target` on entity_relationships (project_id, target_entity_type, target_entity_id)\\n- Index `idx_entity_relationships_project_source` on entity_relationships (project_id, source_entity_type, source_entity_id)\\n- Index `sqlite_autoindex_entity_relationships_1` on entity_relationships (id) [unique]\\n- Index `idx_feature_items_project_archived` on feature_items (project_id, archived, updated_at)\\n- Index `sqlite_autoindex_feature_items_1` on feature_items (id) [unique]\\n- Index `idx_integration_events_source` on integration_events (source)\\n- Index `idx_integration_events_project_created` on integration_events (project_id, created_at)\\n- Index `sqlite_autoindex_integration_events_1` on integration_events (id) [unique]\\n- Index `sqlite_autoindex_migrations_1` on migrations (name) [unique]\\n- Index `idx_prd_fragments_project_merged` on prd_fragments (project_id, merged, updated_at)\\n- Index `idx_prd_fragments_project_feature` on prd_fragments (project_id, feature_id) [unique]\\n- Index `sqlite_autoindex_prd_fragments_1` on prd_fragments (id) [unique]\\n- Index `sqlite_autoindex_project_md_documents_1` on project_md_documents (project_id, doc_type) [unique]\\n- Index `idx_project_modules_project_group` on project_modules (project_id, module_group, sort_order)\\n- Index `sqlite_autoindex_project_modules_1` on project_modules (project_id, module_key) [unique]\\n- Index `idx_projects_pinned` on projects (pinned)\\n- Index `idx_projects_category` on projects (category)\\n- Index `sqlite_autoindex_projects_1` on projects (id) [unique]\\n- Index `idx_roadmap_fragments_project_status` on roadmap_fragments (project_id, merged, updated_at)\\n- Index `idx_roadmap_fragments_project_feature` on roadmap_fragments (project_id, source_feature_id) [unique]\\n- Index `sqlite_autoindex_roadmap_fragments_1` on roadmap_fragments (id) [unique]\\n- Index `idx_roadmap_phases_after` on roadmap_phases (project_id, after_phase_id)\\n- Index `idx_roadmap_phases_project_archive` on roadmap_phases (project_id, archived, sort_order)\\n- Index `idx_roadmap_phases_project_sort` on roadmap_phases (project_id, sort_order)\\n- Index `sqlite_autoindex_roadmap_phases_1` on roadmap_phases (id) [unique]\\n- Index `idx_tasks_project_work_item_type` on tasks (project_id, work_item_type, updated_at)\\n- Index `idx_tasks_project_category` on tasks (project_id, category)\\n- Index `idx_tasks_project_type` on tasks (project_id, item_type, updated_at)\\n- Index `idx_tasks_project_bucket` on tasks (project_id, planning_bucket, updated_at)\\n- Index `idx_tasks_project_phase` on tasks (project_id, roadmap_phase_id, sort_order)\\n- Index `idx_tasks_sort_order` on tasks (project_id, sort_order)\\n- Index `idx_tasks_status` on tasks (status)\\n- Index `idx_tasks_project_id` on tasks (project_id)\\n- Index `sqlite_autoindex_tasks_1` on tasks (id) [unique]\\n\\n- Constraint `sqlite_autoindex_migrations_1` on migrations: UNIQUE (name)\\n\\n## Migration Notes\\n\\n- Captured directly from the live runtime SQLite database to restore or validate the Database Schema module output.\\n\\n## Open Questions\\n\\n- None at capture time.\\n\\n## DBML\\n\\n```dbml\\nProject \\\"Angel's Project Manager\\\" {\\n  database_type: \\\"SQLite\\\"\\n}\\n\\nTable app_settings {\\n  key TEXT [pk]\\n  value TEXT\\n  is_secret INTEGER [default: 0]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n}\\n\\nTable bug_items {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  code TEXT [not null]\\n  title TEXT [not null]\\n  summary TEXT [default: '']\\n  severity TEXT [default: 'medium']\\n  status TEXT [default: 'open']\\n  task_id TEXT\\n  completed INTEGER [default: 0]\\n  regressed INTEGER [default: 0]\\n  archived INTEGER [default: 0]\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  current_behavior TEXT [default: '']\\n  expected_behavior TEXT [default: '']\\n  work_item_type TEXT [default: 'software_bug']\\n  affected_module_keys TEXT [default: '[]']\\n}\\n\\nTable credentials {\\n  id TEXT [pk]\\n  name TEXT [not null]\\n  host TEXT [not null]\\n  port INTEGER [default: 22]\\n  user TEXT [not null]\\n  password TEXT\\n  key_path TEXT\\n}\\n\\nTable entity_relationships {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  source_entity_type TEXT [not null]\\n  source_entity_id TEXT [not null]\\n  relationship_type TEXT [not null]\\n  target_entity_type TEXT [not null]\\n  target_entity_id TEXT [not null]\\n  metadata_json TEXT [default: '{}']\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n}\\n\\nTable feature_items {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  code TEXT [not null]\\n  title TEXT [not null]\\n  summary TEXT [default: '']\\n  status TEXT [default: 'planned']\\n  roadmap_phase_id TEXT\\n  task_id TEXT\\n  archived INTEGER [default: 0]\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  work_item_type TEXT [default: 'software_feature']\\n  affected_module_keys TEXT [default: '[]']\\n}\\n\\nTable integration_events {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  source TEXT [not null]\\n  event_type TEXT [not null]\\n  delivery_status TEXT [default: 'received']\\n  payload TEXT [default: '{}']\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n}\\n\\nTable migrations {\\n  id INTEGER [pk]\\n  name TEXT [unique, not null]\\n  executed_at TEXT [default: CURRENT_TIMESTAMP]\\n}\\n\\nTable prd_fragments {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  feature_id TEXT\\n  code TEXT [not null]\\n  title TEXT [not null]\\n  markdown TEXT [default: '']\\n  mermaid TEXT [default: '']\\n  status TEXT [default: 'draft']\\n  merged INTEGER [default: 0]\\n  merged_at TEXT\\n  file_name TEXT\\n  file_path TEXT\\n  file_updated_at TEXT\\n  file_md5 TEXT [default: '']\\n  db_md5 TEXT [default: '']\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  merged_file_name TEXT\\n}\\n\\nTable project_md_documents {\\n  project_id TEXT [pk, not null]\\n  doc_type TEXT [pk, not null]\\n  markdown TEXT [default: '']\\n  mermaid TEXT [default: '']\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  file_path TEXT\\n  file_updated_at TEXT\\n  file_md5 TEXT [default: '']\\n  db_md5 TEXT [default: '']\\n  editor_state TEXT [default: '']\\n  title TEXT [default: '']\\n  module_key TEXT [default: '']\\n  template_name TEXT [default: '']\\n  template_version TEXT [default: '']\\n  source_of_truth TEXT [default: 'database']\\n}\\n\\nTable project_modules {\\n  project_id TEXT [pk, not null]\\n  module_key TEXT [pk, not null]\\n  module_group TEXT [not null]\\n  label TEXT [not null]\\n  description TEXT [default: '']\\n  enabled INTEGER [default: 0]\\n  is_core INTEGER [default: 0]\\n  sort_order INTEGER [default: 0]\\n  settings_json TEXT [default: '{}']\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  purpose_summary TEXT [default: '']\\n}\\n\\nTable projects {\\n  id TEXT [pk]\\n  path TEXT\\n  absolute_path TEXT\\n  name TEXT [not null]\\n  description TEXT\\n  parent_id TEXT\\n  server_id TEXT\\n  image_path TEXT\\n  open_in_cursor INTEGER [default: 0]\\n  category TEXT\\n  tags TEXT [default: '[]']\\n  links TEXT [default: '[]']\\n  date_added TEXT\\n  type TEXT [default: 'folder']\\n  open_in_cursor_admin INTEGER [default: 0]\\n  url TEXT\\n  pinned INTEGER [default: 0]\\n  image_url TEXT\\n  upload_mappings TEXT [default: '[]']\\n  mapping_groups TEXT [default: '[]']\\n  primary_action TEXT [default: 'auto']\\n  integrations TEXT [default: '{}']\\n  workspace_plugins TEXT [default: '[]']\\n  project_type TEXT [default: 'general']\\n}\\n\\nTable roadmap_fragments {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  source_feature_id TEXT\\n  source_phase_id TEXT\\n  code TEXT [not null]\\n  title TEXT [not null]\\n  markdown TEXT [not null, default: '']\\n  mermaid TEXT [not null, default: '']\\n  payload_json TEXT [not null, default: '']\\n  status TEXT [not null, default: 'draft']\\n  merged INTEGER [not null, default: 0]\\n  merged_at TEXT\\n  integrated_at TEXT\\n  file_name TEXT\\n  file_path TEXT\\n  file_updated_at TEXT\\n  file_md5 TEXT [not null, default: '']\\n  db_md5 TEXT [not null, default: '']\\n  created_at TEXT [not null]\\n  updated_at TEXT [not null]\\n}\\n\\nTable roadmap_phases {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  code TEXT [not null]\\n  name TEXT [not null]\\n  summary TEXT [default: '']\\n  goal TEXT [default: '']\\n  status TEXT [default: 'planned']\\n  target_date TEXT\\n  sort_order INTEGER [default: 0]\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  after_phase_id TEXT\\n  archived INTEGER [default: 0]\\n}\\n\\nTable tasks {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  title TEXT [not null]\\n  description TEXT\\n  status TEXT [default: 'todo']\\n  priority TEXT [default: 'medium']\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  due_date TEXT\\n  assigned_to TEXT\\n  start_date TEXT\\n  end_date TEXT\\n  dependency_ids TEXT [default: '[]']\\n  progress INTEGER [default: 0]\\n  milestone INTEGER [default: 0]\\n  sort_order INTEGER [default: 0]\\n  roadmap_phase_id TEXT\\n  planning_bucket TEXT [default: 'considered']\\n  item_type TEXT [default: 'task']\\n  category TEXT\\n  work_item_type TEXT [default: 'core_task']\\n}\\n\\nRef: bug_items.project_id < projects.id\\nRef: entity_relationships.project_id < projects.id\\nRef: feature_items.project_id < projects.id\\nRef: integration_events.project_id < projects.id\\nRef: prd_fragments.project_id < projects.id\\nRef: project_md_documents.project_id < projects.id\\nRef: project_modules.project_id < projects.id\\nRef: roadmap_phases.project_id < projects.id\\nRef: tasks.project_id < projects.id\\n```\\n\\n## Mermaid\\n\\n```mermaid\\nerDiagram\\n  APP_SETTINGS {\\n    TEXT key PK\\n    TEXT value\\n    INTEGER is_secret\\n    TEXT updated_at\\n  }\\n  BUG_ITEMS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT code\\n    TEXT title\\n    TEXT summary\\n    TEXT severity\\n    TEXT status\\n    TEXT task_id\\n    INTEGER completed\\n    INTEGER regressed\\n    INTEGER archived\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT current_behavior\\n    TEXT expected_behavior\\n    TEXT work_item_type\\n    TEXT affected_module_keys\\n  }\\n  CREDENTIALS {\\n    TEXT id PK\\n    TEXT name\\n    TEXT host\\n    INTEGER port\\n    TEXT user\\n    TEXT password\\n    TEXT key_path\\n  }\\n  ENTITY_RELATIONSHIPS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT source_entity_type\\n    TEXT source_entity_id\\n    TEXT relationship_type\\n    TEXT target_entity_type\\n    TEXT target_entity_id\\n    TEXT metadata_json\\n    TEXT created_at\\n    TEXT updated_at\\n  }\\n  FEATURE_ITEMS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT code\\n    TEXT title\\n    TEXT summary\\n    TEXT status\\n    TEXT roadmap_phase_id\\n    TEXT task_id\\n    INTEGER archived\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT work_item_type\\n    TEXT affected_module_keys\\n  }\\n  INTEGRATION_EVENTS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT source\\n    TEXT event_type\\n    TEXT delivery_status\\n    TEXT payload\\n    TEXT created_at\\n  }\\n  MIGRATIONS {\\n    INTEGER id PK\\n    TEXT name\\n    TEXT executed_at\\n  }\\n  PRD_FRAGMENTS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT feature_id\\n    TEXT code\\n    TEXT title\\n    TEXT markdown\\n    TEXT mermaid\\n    TEXT status\\n    INTEGER merged\\n    TEXT merged_at\\n    TEXT file_name\\n    TEXT file_path\\n    TEXT file_updated_at\\n    TEXT file_md5\\n    TEXT db_md5\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT merged_file_name\\n  }\\n  PROJECT_MD_DOCUMENTS {\\n    TEXT project_id PK\\n    TEXT doc_type PK\\n    TEXT markdown\\n    TEXT mermaid\\n    TEXT updated_at\\n    TEXT file_path\\n    TEXT file_updated_at\\n    TEXT file_md5\\n    TEXT db_md5\\n    TEXT editor_state\\n    TEXT title\\n    TEXT module_key\\n    TEXT template_name\\n    TEXT template_version\\n    TEXT source_of_truth\\n  }\\n  PROJECT_MODULES {\\n    TEXT project_id PK\\n    TEXT module_key PK\\n    TEXT module_group\\n    TEXT label\\n    TEXT description\\n    INTEGER enabled\\n    INTEGER is_core\\n    INTEGER sort_order\\n    TEXT settings_json\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT purpose_summary\\n  }\\n  PROJECTS {\\n    TEXT id PK\\n    TEXT path\\n    TEXT absolute_path\\n    TEXT name\\n    TEXT description\\n    TEXT parent_id\\n    TEXT server_id\\n    TEXT image_path\\n    INTEGER open_in_cursor\\n    TEXT category\\n    TEXT tags\\n    TEXT links\\n    TEXT date_added\\n    TEXT type\\n    INTEGER open_in_cursor_admin\\n    TEXT url\\n    INTEGER pinned\\n    TEXT image_url\\n    TEXT upload_mappings\\n    TEXT mapping_groups\\n    TEXT primary_action\\n    TEXT integrations\\n    TEXT workspace_plugins\\n    TEXT project_type\\n  }\\n  ROADMAP_FRAGMENTS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT source_feature_id\\n    TEXT source_phase_id\\n    TEXT code\\n    TEXT title\\n    TEXT markdown\\n    TEXT mermaid\\n    TEXT payload_json\\n    TEXT status\\n    INTEGER merged\\n    TEXT merged_at\\n    TEXT integrated_at\\n    TEXT file_name\\n    TEXT file_path\\n    TEXT file_updated_at\\n    TEXT file_md5\\n    TEXT db_md5\\n    TEXT created_at\\n    TEXT updated_at\\n  }\\n  ROADMAP_PHASES {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT code\\n    TEXT name\\n    TEXT summary\\n    TEXT goal\\n    TEXT status\\n    TEXT target_date\\n    INTEGER sort_order\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT after_phase_id\\n    INTEGER archived\\n  }\\n  TASKS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT title\\n    TEXT description\\n    TEXT status\\n    TEXT priority\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT due_date\\n    TEXT assigned_to\\n    TEXT start_date\\n    TEXT end_date\\n    TEXT dependency_ids\\n    INTEGER progress\\n    INTEGER milestone\\n    INTEGER sort_order\\n    TEXT roadmap_phase_id\\n    TEXT planning_bucket\\n    TEXT item_type\\n    TEXT category\\n    TEXT work_item_type\\n  }\\n  PROJECTS ||--o{ BUG_ITEMS : \\\"project_id\\\"\\n  PROJECTS ||--o{ ENTITY_RELATIONSHIPS : \\\"project_id\\\"\\n  PROJECTS ||--o{ FEATURE_ITEMS : \\\"project_id\\\"\\n  PROJECTS ||--o{ INTEGRATION_EVENTS : \\\"project_id\\\"\\n  PROJECTS ||--o{ PRD_FRAGMENTS : \\\"project_id\\\"\\n  PROJECTS ||--o{ PROJECT_MD_DOCUMENTS : \\\"project_id\\\"\\n  PROJECTS ||--o{ PROJECT_MODULES : \\\"project_id\\\"\\n  PROJECTS ||--o{ ROADMAP_PHASES : \\\"project_id\\\"\\n  PROJECTS ||--o{ TASKS : \\\"project_id\\\"\\n```\\n\\n## Merge Guidance\\n\\n- Review this fragment before consuming it, because it reflects the observed runtime schema and may replace hand-authored module narrative.\\n- Consume this fragment through the Database Schema module to regenerate DATABASE_SCHEMA.md and DATABASE_SCHEMA.dbml from the imported schema model.\",\n    \"mermaid\": \"erDiagram\\n  APP_SETTINGS {\\n    TEXT key PK\\n    TEXT value\\n    INTEGER is_secret\\n    TEXT updated_at\\n  }\\n  BUG_ITEMS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT code\\n    TEXT title\\n    TEXT summary\\n    TEXT severity\\n    TEXT status\\n    TEXT task_id\\n    INTEGER completed\\n    INTEGER regressed\\n    INTEGER archived\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT current_behavior\\n    TEXT expected_behavior\\n    TEXT work_item_type\\n    TEXT affected_module_keys\\n  }\\n  CREDENTIALS {\\n    TEXT id PK\\n    TEXT name\\n    TEXT host\\n    INTEGER port\\n    TEXT user\\n    TEXT password\\n    TEXT key_path\\n  }\\n  ENTITY_RELATIONSHIPS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT source_entity_type\\n    TEXT source_entity_id\\n    TEXT relationship_type\\n    TEXT target_entity_type\\n    TEXT target_entity_id\\n    TEXT metadata_json\\n    TEXT created_at\\n    TEXT updated_at\\n  }\\n  FEATURE_ITEMS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT code\\n    TEXT title\\n    TEXT summary\\n    TEXT status\\n    TEXT roadmap_phase_id\\n    TEXT task_id\\n    INTEGER archived\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT work_item_type\\n    TEXT affected_module_keys\\n  }\\n  INTEGRATION_EVENTS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT source\\n    TEXT event_type\\n    TEXT delivery_status\\n    TEXT payload\\n    TEXT created_at\\n  }\\n  MIGRATIONS {\\n    INTEGER id PK\\n    TEXT name\\n    TEXT executed_at\\n  }\\n  PRD_FRAGMENTS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT feature_id\\n    TEXT code\\n    TEXT title\\n    TEXT markdown\\n    TEXT mermaid\\n    TEXT status\\n    INTEGER merged\\n    TEXT merged_at\\n    TEXT file_name\\n    TEXT file_path\\n    TEXT file_updated_at\\n    TEXT file_md5\\n    TEXT db_md5\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT merged_file_name\\n  }\\n  PROJECT_MD_DOCUMENTS {\\n    TEXT project_id PK\\n    TEXT doc_type PK\\n    TEXT markdown\\n    TEXT mermaid\\n    TEXT updated_at\\n    TEXT file_path\\n    TEXT file_updated_at\\n    TEXT file_md5\\n    TEXT db_md5\\n    TEXT editor_state\\n    TEXT title\\n    TEXT module_key\\n    TEXT template_name\\n    TEXT template_version\\n    TEXT source_of_truth\\n  }\\n  PROJECT_MODULES {\\n    TEXT project_id PK\\n    TEXT module_key PK\\n    TEXT module_group\\n    TEXT label\\n    TEXT description\\n    INTEGER enabled\\n    INTEGER is_core\\n    INTEGER sort_order\\n    TEXT settings_json\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT purpose_summary\\n  }\\n  PROJECTS {\\n    TEXT id PK\\n    TEXT path\\n    TEXT absolute_path\\n    TEXT name\\n    TEXT description\\n    TEXT parent_id\\n    TEXT server_id\\n    TEXT image_path\\n    INTEGER open_in_cursor\\n    TEXT category\\n    TEXT tags\\n    TEXT links\\n    TEXT date_added\\n    TEXT type\\n    INTEGER open_in_cursor_admin\\n    TEXT url\\n    INTEGER pinned\\n    TEXT image_url\\n    TEXT upload_mappings\\n    TEXT mapping_groups\\n    TEXT primary_action\\n    TEXT integrations\\n    TEXT workspace_plugins\\n    TEXT project_type\\n  }\\n  ROADMAP_FRAGMENTS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT source_feature_id\\n    TEXT source_phase_id\\n    TEXT code\\n    TEXT title\\n    TEXT markdown\\n    TEXT mermaid\\n    TEXT payload_json\\n    TEXT status\\n    INTEGER merged\\n    TEXT merged_at\\n    TEXT integrated_at\\n    TEXT file_name\\n    TEXT file_path\\n    TEXT file_updated_at\\n    TEXT file_md5\\n    TEXT db_md5\\n    TEXT created_at\\n    TEXT updated_at\\n  }\\n  ROADMAP_PHASES {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT code\\n    TEXT name\\n    TEXT summary\\n    TEXT goal\\n    TEXT status\\n    TEXT target_date\\n    INTEGER sort_order\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT after_phase_id\\n    INTEGER archived\\n  }\\n  TASKS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT title\\n    TEXT description\\n    TEXT status\\n    TEXT priority\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT due_date\\n    TEXT assigned_to\\n    TEXT start_date\\n    TEXT end_date\\n    TEXT dependency_ids\\n    INTEGER progress\\n    INTEGER milestone\\n    INTEGER sort_order\\n    TEXT roadmap_phase_id\\n    TEXT planning_bucket\\n    TEXT item_type\\n    TEXT category\\n    TEXT work_item_type\\n  }\\n  PROJECTS ||--o{ BUG_ITEMS : \\\"project_id\\\"\\n  PROJECTS ||--o{ ENTITY_RELATIONSHIPS : \\\"project_id\\\"\\n  PROJECTS ||--o{ FEATURE_ITEMS : \\\"project_id\\\"\\n  PROJECTS ||--o{ INTEGRATION_EVENTS : \\\"project_id\\\"\\n  PROJECTS ||--o{ PRD_FRAGMENTS : \\\"project_id\\\"\\n  PROJECTS ||--o{ PROJECT_MD_DOCUMENTS : \\\"project_id\\\"\\n  PROJECTS ||--o{ PROJECT_MODULES : \\\"project_id\\\"\\n  PROJECTS ||--o{ ROADMAP_PHASES : \\\"project_id\\\"\\n  PROJECTS ||--o{ TASKS : \\\"project_id\\\"\",\n    \"payload\": {\n      \"source\": {\n        \"sourceType\": \"sqlite_database\",\n        \"sourceLabel\": \"C:\\\\Users\\\\croni\\\\Projects\\\\data\\\\app.db\",\n        \"dialect\": \"sqlite\",\n        \"observedAt\": \"2026-04-03T00:16:28.120Z\",\n        \"schemaFingerprint\": \"6472ebfcb4f9ce91151ef8d1006b39d2\",\n        \"confidence\": \"observed\"\n      },\n      \"summary\": \"Observed SQLite schema imported from the live Angel's Project Manager runtime database to regenerate DATABASE_SCHEMA.md and DATABASE_SCHEMA.dbml.\",\n      \"entities\": [\n        {\n          \"id\": \"app_settings\",\n          \"name\": \"app_settings\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"key\",\n              \"name\": \"key\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"value\",\n              \"name\": \"value\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"is_secret\",\n              \"name\": \"is_secret\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"updated_at\",\n              \"name\": \"updated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        },\n        {\n          \"id\": \"bug_items\",\n          \"name\": \"bug_items\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"id\",\n              \"name\": \"id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"project_id\",\n              \"name\": \"project_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"projects\",\n              \"referencesFieldId\": \"id\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"code\",\n              \"name\": \"code\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"title\",\n              \"name\": \"title\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"summary\",\n              \"name\": \"summary\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"severity\",\n              \"name\": \"severity\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'medium'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"status\",\n              \"name\": \"status\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'open'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"task_id\",\n              \"name\": \"task_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"completed\",\n              \"name\": \"completed\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"regressed\",\n              \"name\": \"regressed\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"archived\",\n              \"name\": \"archived\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"created_at\",\n              \"name\": \"created_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"updated_at\",\n              \"name\": \"updated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"current_behavior\",\n              \"name\": \"current_behavior\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"expected_behavior\",\n              \"name\": \"expected_behavior\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"work_item_type\",\n              \"name\": \"work_item_type\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'software_bug'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"affected_module_keys\",\n              \"name\": \"affected_module_keys\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'[]'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        },\n        {\n          \"id\": \"credentials\",\n          \"name\": \"credentials\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"id\",\n              \"name\": \"id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"name\",\n              \"name\": \"name\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"host\",\n              \"name\": \"host\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"port\",\n              \"name\": \"port\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"22\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"user\",\n              \"name\": \"user\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"password\",\n              \"name\": \"password\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"key_path\",\n              \"name\": \"key_path\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        },\n        {\n          \"id\": \"entity_relationships\",\n          \"name\": \"entity_relationships\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"id\",\n              \"name\": \"id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"project_id\",\n              \"name\": \"project_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"projects\",\n              \"referencesFieldId\": \"id\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"source_entity_type\",\n              \"name\": \"source_entity_type\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"source_entity_id\",\n              \"name\": \"source_entity_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"relationship_type\",\n              \"name\": \"relationship_type\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"target_entity_type\",\n              \"name\": \"target_entity_type\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"target_entity_id\",\n              \"name\": \"target_entity_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"metadata_json\",\n              \"name\": \"metadata_json\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'{}'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"created_at\",\n              \"name\": \"created_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"updated_at\",\n              \"name\": \"updated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        },\n        {\n          \"id\": \"feature_items\",\n          \"name\": \"feature_items\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"id\",\n              \"name\": \"id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"project_id\",\n              \"name\": \"project_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"projects\",\n              \"referencesFieldId\": \"id\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"code\",\n              \"name\": \"code\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"title\",\n              \"name\": \"title\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"summary\",\n              \"name\": \"summary\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"status\",\n              \"name\": \"status\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'planned'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"roadmap_phase_id\",\n              \"name\": \"roadmap_phase_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"task_id\",\n              \"name\": \"task_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"archived\",\n              \"name\": \"archived\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"created_at\",\n              \"name\": \"created_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"updated_at\",\n              \"name\": \"updated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"work_item_type\",\n              \"name\": \"work_item_type\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'software_feature'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"affected_module_keys\",\n              \"name\": \"affected_module_keys\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'[]'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        },\n        {\n          \"id\": \"integration_events\",\n          \"name\": \"integration_events\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"id\",\n              \"name\": \"id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"project_id\",\n              \"name\": \"project_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"projects\",\n              \"referencesFieldId\": \"id\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"source\",\n              \"name\": \"source\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"event_type\",\n              \"name\": \"event_type\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"delivery_status\",\n              \"name\": \"delivery_status\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'received'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"payload\",\n              \"name\": \"payload\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'{}'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"created_at\",\n              \"name\": \"created_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        },\n        {\n          \"id\": \"migrations\",\n          \"name\": \"migrations\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"id\",\n              \"name\": \"id\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"name\",\n              \"name\": \"name\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": true,\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"executed_at\",\n              \"name\": \"executed_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        },\n        {\n          \"id\": \"prd_fragments\",\n          \"name\": \"prd_fragments\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"id\",\n              \"name\": \"id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"project_id\",\n              \"name\": \"project_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"projects\",\n              \"referencesFieldId\": \"id\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"feature_id\",\n              \"name\": \"feature_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"code\",\n              \"name\": \"code\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"title\",\n              \"name\": \"title\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"markdown\",\n              \"name\": \"markdown\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"mermaid\",\n              \"name\": \"mermaid\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"status\",\n              \"name\": \"status\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'draft'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"merged\",\n              \"name\": \"merged\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"merged_at\",\n              \"name\": \"merged_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"file_name\",\n              \"name\": \"file_name\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"file_path\",\n              \"name\": \"file_path\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"file_updated_at\",\n              \"name\": \"file_updated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"file_md5\",\n              \"name\": \"file_md5\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"db_md5\",\n              \"name\": \"db_md5\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"created_at\",\n              \"name\": \"created_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"updated_at\",\n              \"name\": \"updated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"merged_file_name\",\n              \"name\": \"merged_file_name\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        },\n        {\n          \"id\": \"project_md_documents\",\n          \"name\": \"project_md_documents\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"project_id\",\n              \"name\": \"project_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"projects\",\n              \"referencesFieldId\": \"id\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"doc_type\",\n              \"name\": \"doc_type\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"markdown\",\n              \"name\": \"markdown\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"mermaid\",\n              \"name\": \"mermaid\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"updated_at\",\n              \"name\": \"updated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"file_path\",\n              \"name\": \"file_path\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"file_updated_at\",\n              \"name\": \"file_updated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"file_md5\",\n              \"name\": \"file_md5\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"db_md5\",\n              \"name\": \"db_md5\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"editor_state\",\n              \"name\": \"editor_state\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"title\",\n              \"name\": \"title\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"module_key\",\n              \"name\": \"module_key\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"template_name\",\n              \"name\": \"template_name\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"template_version\",\n              \"name\": \"template_version\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"source_of_truth\",\n              \"name\": \"source_of_truth\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'database'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        },\n        {\n          \"id\": \"project_modules\",\n          \"name\": \"project_modules\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"project_id\",\n              \"name\": \"project_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"projects\",\n              \"referencesFieldId\": \"id\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"module_key\",\n              \"name\": \"module_key\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"module_group\",\n              \"name\": \"module_group\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"label\",\n              \"name\": \"label\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"description\",\n              \"name\": \"description\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"enabled\",\n              \"name\": \"enabled\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"is_core\",\n              \"name\": \"is_core\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"sort_order\",\n              \"name\": \"sort_order\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"settings_json\",\n              \"name\": \"settings_json\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'{}'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"created_at\",\n              \"name\": \"created_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"updated_at\",\n              \"name\": \"updated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"purpose_summary\",\n              \"name\": \"purpose_summary\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        },\n        {\n          \"id\": \"projects\",\n          \"name\": \"projects\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"id\",\n              \"name\": \"id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"path\",\n              \"name\": \"path\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"absolute_path\",\n              \"name\": \"absolute_path\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"name\",\n              \"name\": \"name\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"description\",\n              \"name\": \"description\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"parent_id\",\n              \"name\": \"parent_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"server_id\",\n              \"name\": \"server_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"image_path\",\n              \"name\": \"image_path\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"open_in_cursor\",\n              \"name\": \"open_in_cursor\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"category\",\n              \"name\": \"category\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"tags\",\n              \"name\": \"tags\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'[]'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"links\",\n              \"name\": \"links\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'[]'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"date_added\",\n              \"name\": \"date_added\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"type\",\n              \"name\": \"type\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'folder'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"open_in_cursor_admin\",\n              \"name\": \"open_in_cursor_admin\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"url\",\n              \"name\": \"url\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"pinned\",\n              \"name\": \"pinned\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"image_url\",\n              \"name\": \"image_url\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"upload_mappings\",\n              \"name\": \"upload_mappings\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'[]'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"mapping_groups\",\n              \"name\": \"mapping_groups\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'[]'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"primary_action\",\n              \"name\": \"primary_action\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'auto'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"integrations\",\n              \"name\": \"integrations\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'{}'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"workspace_plugins\",\n              \"name\": \"workspace_plugins\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'[]'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"project_type\",\n              \"name\": \"project_type\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'general'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        },\n        {\n          \"id\": \"roadmap_fragments\",\n          \"name\": \"roadmap_fragments\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"id\",\n              \"name\": \"id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"project_id\",\n              \"name\": \"project_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"source_feature_id\",\n              \"name\": \"source_feature_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"source_phase_id\",\n              \"name\": \"source_phase_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"code\",\n              \"name\": \"code\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"title\",\n              \"name\": \"title\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"markdown\",\n              \"name\": \"markdown\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"mermaid\",\n              \"name\": \"mermaid\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"payload_json\",\n              \"name\": \"payload_json\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"status\",\n              \"name\": \"status\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'draft'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"merged\",\n              \"name\": \"merged\",\n              \"type\": \"INTEGER\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"merged_at\",\n              \"name\": \"merged_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"integrated_at\",\n              \"name\": \"integrated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"file_name\",\n              \"name\": \"file_name\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"file_path\",\n              \"name\": \"file_path\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"file_updated_at\",\n              \"name\": \"file_updated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"file_md5\",\n              \"name\": \"file_md5\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"db_md5\",\n              \"name\": \"db_md5\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"created_at\",\n              \"name\": \"created_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"updated_at\",\n              \"name\": \"updated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        },\n        {\n          \"id\": \"roadmap_phases\",\n          \"name\": \"roadmap_phases\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"id\",\n              \"name\": \"id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"project_id\",\n              \"name\": \"project_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"projects\",\n              \"referencesFieldId\": \"id\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"code\",\n              \"name\": \"code\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"name\",\n              \"name\": \"name\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"summary\",\n              \"name\": \"summary\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"goal\",\n              \"name\": \"goal\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"''\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"status\",\n              \"name\": \"status\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'planned'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"target_date\",\n              \"name\": \"target_date\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"sort_order\",\n              \"name\": \"sort_order\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"created_at\",\n              \"name\": \"created_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"updated_at\",\n              \"name\": \"updated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"after_phase_id\",\n              \"name\": \"after_phase_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"archived\",\n              \"name\": \"archived\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        },\n        {\n          \"id\": \"tasks\",\n          \"name\": \"tasks\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"\",\n          \"fields\": [\n            {\n              \"id\": \"id\",\n              \"name\": \"id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": true,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"project_id\",\n              \"name\": \"project_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"projects\",\n              \"referencesFieldId\": \"id\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"title\",\n              \"name\": \"title\",\n              \"type\": \"TEXT\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"description\",\n              \"name\": \"description\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"status\",\n              \"name\": \"status\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'todo'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"priority\",\n              \"name\": \"priority\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'medium'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"created_at\",\n              \"name\": \"created_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"updated_at\",\n              \"name\": \"updated_at\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"due_date\",\n              \"name\": \"due_date\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"assigned_to\",\n              \"name\": \"assigned_to\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"start_date\",\n              \"name\": \"start_date\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"end_date\",\n              \"name\": \"end_date\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"dependency_ids\",\n              \"name\": \"dependency_ids\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'[]'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"progress\",\n              \"name\": \"progress\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"milestone\",\n              \"name\": \"milestone\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"sort_order\",\n              \"name\": \"sort_order\",\n              \"type\": \"INTEGER\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"0\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"roadmap_phase_id\",\n              \"name\": \"roadmap_phase_id\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"planning_bucket\",\n              \"name\": \"planning_bucket\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'considered'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"item_type\",\n              \"name\": \"item_type\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'task'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"category\",\n              \"name\": \"category\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            },\n            {\n              \"id\": \"work_item_type\",\n              \"name\": \"work_item_type\",\n              \"type\": \"TEXT\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": \"\",\n              \"defaultValue\": \"'core_task'\",\n              \"referencesEntityId\": \"\",\n              \"referencesFieldId\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"\"\n            }\n          ]\n        }\n      ],\n      \"relationships\": [\n        {\n          \"id\": \"bug_items:project_id:projects:id:0\",\n          \"fromEntityId\": \"bug_items\",\n          \"fromFieldId\": \"project_id\",\n          \"toEntityId\": \"projects\",\n          \"toFieldId\": \"id\",\n          \"cardinality\": \"many-to-one\",\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"entity_relationships:project_id:projects:id:0\",\n          \"fromEntityId\": \"entity_relationships\",\n          \"fromFieldId\": \"project_id\",\n          \"toEntityId\": \"projects\",\n          \"toFieldId\": \"id\",\n          \"cardinality\": \"many-to-one\",\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"feature_items:project_id:projects:id:0\",\n          \"fromEntityId\": \"feature_items\",\n          \"fromFieldId\": \"project_id\",\n          \"toEntityId\": \"projects\",\n          \"toFieldId\": \"id\",\n          \"cardinality\": \"many-to-one\",\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"integration_events:project_id:projects:id:0\",\n          \"fromEntityId\": \"integration_events\",\n          \"fromFieldId\": \"project_id\",\n          \"toEntityId\": \"projects\",\n          \"toFieldId\": \"id\",\n          \"cardinality\": \"many-to-one\",\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"prd_fragments:project_id:projects:id:0\",\n          \"fromEntityId\": \"prd_fragments\",\n          \"fromFieldId\": \"project_id\",\n          \"toEntityId\": \"projects\",\n          \"toFieldId\": \"id\",\n          \"cardinality\": \"many-to-one\",\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"project_md_documents:project_id:projects:id:0\",\n          \"fromEntityId\": \"project_md_documents\",\n          \"fromFieldId\": \"project_id\",\n          \"toEntityId\": \"projects\",\n          \"toFieldId\": \"id\",\n          \"cardinality\": \"many-to-one\",\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"project_modules:project_id:projects:id:0\",\n          \"fromEntityId\": \"project_modules\",\n          \"fromFieldId\": \"project_id\",\n          \"toEntityId\": \"projects\",\n          \"toFieldId\": \"id\",\n          \"cardinality\": \"many-to-one\",\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"roadmap_phases:project_id:projects:id:0\",\n          \"fromEntityId\": \"roadmap_phases\",\n          \"fromFieldId\": \"project_id\",\n          \"toEntityId\": \"projects\",\n          \"toFieldId\": \"id\",\n          \"cardinality\": \"many-to-one\",\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"tasks:project_id:projects:id:0\",\n          \"fromEntityId\": \"tasks\",\n          \"fromFieldId\": \"project_id\",\n          \"toEntityId\": \"projects\",\n          \"toFieldId\": \"id\",\n          \"cardinality\": \"many-to-one\",\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        }\n      ],\n      \"indexes\": [\n        {\n          \"id\": \"sqlite_autoindex_app_settings_1\",\n          \"entityId\": \"app_settings\",\n          \"name\": \"sqlite_autoindex_app_settings_1\",\n          \"fields\": [\n            \"key\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key backing index.\"\n        },\n        {\n          \"id\": \"idx_bug_items_project_archived\",\n          \"entityId\": \"bug_items\",\n          \"name\": \"idx_bug_items_project_archived\",\n          \"fields\": [\n            \"project_id\",\n            \"archived\",\n            \"updated_at\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"sqlite_autoindex_bug_items_1\",\n          \"entityId\": \"bug_items\",\n          \"name\": \"sqlite_autoindex_bug_items_1\",\n          \"fields\": [\n            \"id\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key backing index.\"\n        },\n        {\n          \"id\": \"sqlite_autoindex_credentials_1\",\n          \"entityId\": \"credentials\",\n          \"name\": \"sqlite_autoindex_credentials_1\",\n          \"fields\": [\n            \"id\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key backing index.\"\n        },\n        {\n          \"id\": \"idx_entity_relationships_project_target\",\n          \"entityId\": \"entity_relationships\",\n          \"name\": \"idx_entity_relationships_project_target\",\n          \"fields\": [\n            \"project_id\",\n            \"target_entity_type\",\n            \"target_entity_id\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_entity_relationships_project_source\",\n          \"entityId\": \"entity_relationships\",\n          \"name\": \"idx_entity_relationships_project_source\",\n          \"fields\": [\n            \"project_id\",\n            \"source_entity_type\",\n            \"source_entity_id\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"sqlite_autoindex_entity_relationships_1\",\n          \"entityId\": \"entity_relationships\",\n          \"name\": \"sqlite_autoindex_entity_relationships_1\",\n          \"fields\": [\n            \"id\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key backing index.\"\n        },\n        {\n          \"id\": \"idx_feature_items_project_archived\",\n          \"entityId\": \"feature_items\",\n          \"name\": \"idx_feature_items_project_archived\",\n          \"fields\": [\n            \"project_id\",\n            \"archived\",\n            \"updated_at\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"sqlite_autoindex_feature_items_1\",\n          \"entityId\": \"feature_items\",\n          \"name\": \"sqlite_autoindex_feature_items_1\",\n          \"fields\": [\n            \"id\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key backing index.\"\n        },\n        {\n          \"id\": \"idx_integration_events_source\",\n          \"entityId\": \"integration_events\",\n          \"name\": \"idx_integration_events_source\",\n          \"fields\": [\n            \"source\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_integration_events_project_created\",\n          \"entityId\": \"integration_events\",\n          \"name\": \"idx_integration_events_project_created\",\n          \"fields\": [\n            \"project_id\",\n            \"created_at\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"sqlite_autoindex_integration_events_1\",\n          \"entityId\": \"integration_events\",\n          \"name\": \"sqlite_autoindex_integration_events_1\",\n          \"fields\": [\n            \"id\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key backing index.\"\n        },\n        {\n          \"id\": \"sqlite_autoindex_migrations_1\",\n          \"entityId\": \"migrations\",\n          \"name\": \"sqlite_autoindex_migrations_1\",\n          \"fields\": [\n            \"name\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Unique constraint backing index.\"\n        },\n        {\n          \"id\": \"idx_prd_fragments_project_merged\",\n          \"entityId\": \"prd_fragments\",\n          \"name\": \"idx_prd_fragments_project_merged\",\n          \"fields\": [\n            \"project_id\",\n            \"merged\",\n            \"updated_at\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_prd_fragments_project_feature\",\n          \"entityId\": \"prd_fragments\",\n          \"name\": \"idx_prd_fragments_project_feature\",\n          \"fields\": [\n            \"project_id\",\n            \"feature_id\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"sqlite_autoindex_prd_fragments_1\",\n          \"entityId\": \"prd_fragments\",\n          \"name\": \"sqlite_autoindex_prd_fragments_1\",\n          \"fields\": [\n            \"id\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key backing index.\"\n        },\n        {\n          \"id\": \"sqlite_autoindex_project_md_documents_1\",\n          \"entityId\": \"project_md_documents\",\n          \"name\": \"sqlite_autoindex_project_md_documents_1\",\n          \"fields\": [\n            \"project_id\",\n            \"doc_type\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key backing index.\"\n        },\n        {\n          \"id\": \"idx_project_modules_project_group\",\n          \"entityId\": \"project_modules\",\n          \"name\": \"idx_project_modules_project_group\",\n          \"fields\": [\n            \"project_id\",\n            \"module_group\",\n            \"sort_order\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"sqlite_autoindex_project_modules_1\",\n          \"entityId\": \"project_modules\",\n          \"name\": \"sqlite_autoindex_project_modules_1\",\n          \"fields\": [\n            \"project_id\",\n            \"module_key\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key backing index.\"\n        },\n        {\n          \"id\": \"idx_projects_pinned\",\n          \"entityId\": \"projects\",\n          \"name\": \"idx_projects_pinned\",\n          \"fields\": [\n            \"pinned\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_projects_category\",\n          \"entityId\": \"projects\",\n          \"name\": \"idx_projects_category\",\n          \"fields\": [\n            \"category\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"sqlite_autoindex_projects_1\",\n          \"entityId\": \"projects\",\n          \"name\": \"sqlite_autoindex_projects_1\",\n          \"fields\": [\n            \"id\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key backing index.\"\n        },\n        {\n          \"id\": \"idx_roadmap_fragments_project_status\",\n          \"entityId\": \"roadmap_fragments\",\n          \"name\": \"idx_roadmap_fragments_project_status\",\n          \"fields\": [\n            \"project_id\",\n            \"merged\",\n            \"updated_at\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_roadmap_fragments_project_feature\",\n          \"entityId\": \"roadmap_fragments\",\n          \"name\": \"idx_roadmap_fragments_project_feature\",\n          \"fields\": [\n            \"project_id\",\n            \"source_feature_id\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"sqlite_autoindex_roadmap_fragments_1\",\n          \"entityId\": \"roadmap_fragments\",\n          \"name\": \"sqlite_autoindex_roadmap_fragments_1\",\n          \"fields\": [\n            \"id\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key backing index.\"\n        },\n        {\n          \"id\": \"idx_roadmap_phases_after\",\n          \"entityId\": \"roadmap_phases\",\n          \"name\": \"idx_roadmap_phases_after\",\n          \"fields\": [\n            \"project_id\",\n            \"after_phase_id\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_roadmap_phases_project_archive\",\n          \"entityId\": \"roadmap_phases\",\n          \"name\": \"idx_roadmap_phases_project_archive\",\n          \"fields\": [\n            \"project_id\",\n            \"archived\",\n            \"sort_order\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_roadmap_phases_project_sort\",\n          \"entityId\": \"roadmap_phases\",\n          \"name\": \"idx_roadmap_phases_project_sort\",\n          \"fields\": [\n            \"project_id\",\n            \"sort_order\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"sqlite_autoindex_roadmap_phases_1\",\n          \"entityId\": \"roadmap_phases\",\n          \"name\": \"sqlite_autoindex_roadmap_phases_1\",\n          \"fields\": [\n            \"id\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key backing index.\"\n        },\n        {\n          \"id\": \"idx_tasks_project_work_item_type\",\n          \"entityId\": \"tasks\",\n          \"name\": \"idx_tasks_project_work_item_type\",\n          \"fields\": [\n            \"project_id\",\n            \"work_item_type\",\n            \"updated_at\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_tasks_project_category\",\n          \"entityId\": \"tasks\",\n          \"name\": \"idx_tasks_project_category\",\n          \"fields\": [\n            \"project_id\",\n            \"category\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_tasks_project_type\",\n          \"entityId\": \"tasks\",\n          \"name\": \"idx_tasks_project_type\",\n          \"fields\": [\n            \"project_id\",\n            \"item_type\",\n            \"updated_at\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_tasks_project_bucket\",\n          \"entityId\": \"tasks\",\n          \"name\": \"idx_tasks_project_bucket\",\n          \"fields\": [\n            \"project_id\",\n            \"planning_bucket\",\n            \"updated_at\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_tasks_project_phase\",\n          \"entityId\": \"tasks\",\n          \"name\": \"idx_tasks_project_phase\",\n          \"fields\": [\n            \"project_id\",\n            \"roadmap_phase_id\",\n            \"sort_order\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_tasks_sort_order\",\n          \"entityId\": \"tasks\",\n          \"name\": \"idx_tasks_sort_order\",\n          \"fields\": [\n            \"project_id\",\n            \"sort_order\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_tasks_status\",\n          \"entityId\": \"tasks\",\n          \"name\": \"idx_tasks_status\",\n          \"fields\": [\n            \"status\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"idx_tasks_project_id\",\n          \"entityId\": \"tasks\",\n          \"name\": \"idx_tasks_project_id\",\n          \"fields\": [\n            \"project_id\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        },\n        {\n          \"id\": \"sqlite_autoindex_tasks_1\",\n          \"entityId\": \"tasks\",\n          \"name\": \"sqlite_autoindex_tasks_1\",\n          \"fields\": [\n            \"id\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key backing index.\"\n        }\n      ],\n      \"constraints\": [\n        {\n          \"id\": \"migrations:sqlite_autoindex_migrations_1:unique\",\n          \"entityId\": \"migrations\",\n          \"name\": \"sqlite_autoindex_migrations_1\",\n          \"type\": \"unique\",\n          \"definition\": \"UNIQUE (name)\",\n          \"status\": \"observed\",\n          \"notes\": \"\"\n        }\n      ],\n      \"migrationNotes\": [\n        {\n          \"title\": \"Live runtime schema capture\",\n          \"description\": \"This fragment was generated directly from the active runtime SQLite database for Angel's Project Manager.\",\n          \"status\": \"observed\"\n        }\n      ],\n      \"openQuestions\": [],\n      \"dbml\": \"Project \\\"Angel's Project Manager\\\" {\\n  database_type: \\\"SQLite\\\"\\n}\\n\\nTable app_settings {\\n  key TEXT [pk]\\n  value TEXT\\n  is_secret INTEGER [default: 0]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n}\\n\\nTable bug_items {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  code TEXT [not null]\\n  title TEXT [not null]\\n  summary TEXT [default: '']\\n  severity TEXT [default: 'medium']\\n  status TEXT [default: 'open']\\n  task_id TEXT\\n  completed INTEGER [default: 0]\\n  regressed INTEGER [default: 0]\\n  archived INTEGER [default: 0]\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  current_behavior TEXT [default: '']\\n  expected_behavior TEXT [default: '']\\n  work_item_type TEXT [default: 'software_bug']\\n  affected_module_keys TEXT [default: '[]']\\n}\\n\\nTable credentials {\\n  id TEXT [pk]\\n  name TEXT [not null]\\n  host TEXT [not null]\\n  port INTEGER [default: 22]\\n  user TEXT [not null]\\n  password TEXT\\n  key_path TEXT\\n}\\n\\nTable entity_relationships {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  source_entity_type TEXT [not null]\\n  source_entity_id TEXT [not null]\\n  relationship_type TEXT [not null]\\n  target_entity_type TEXT [not null]\\n  target_entity_id TEXT [not null]\\n  metadata_json TEXT [default: '{}']\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n}\\n\\nTable feature_items {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  code TEXT [not null]\\n  title TEXT [not null]\\n  summary TEXT [default: '']\\n  status TEXT [default: 'planned']\\n  roadmap_phase_id TEXT\\n  task_id TEXT\\n  archived INTEGER [default: 0]\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  work_item_type TEXT [default: 'software_feature']\\n  affected_module_keys TEXT [default: '[]']\\n}\\n\\nTable integration_events {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  source TEXT [not null]\\n  event_type TEXT [not null]\\n  delivery_status TEXT [default: 'received']\\n  payload TEXT [default: '{}']\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n}\\n\\nTable migrations {\\n  id INTEGER [pk]\\n  name TEXT [unique, not null]\\n  executed_at TEXT [default: CURRENT_TIMESTAMP]\\n}\\n\\nTable prd_fragments {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  feature_id TEXT\\n  code TEXT [not null]\\n  title TEXT [not null]\\n  markdown TEXT [default: '']\\n  mermaid TEXT [default: '']\\n  status TEXT [default: 'draft']\\n  merged INTEGER [default: 0]\\n  merged_at TEXT\\n  file_name TEXT\\n  file_path TEXT\\n  file_updated_at TEXT\\n  file_md5 TEXT [default: '']\\n  db_md5 TEXT [default: '']\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  merged_file_name TEXT\\n}\\n\\nTable project_md_documents {\\n  project_id TEXT [pk, not null]\\n  doc_type TEXT [pk, not null]\\n  markdown TEXT [default: '']\\n  mermaid TEXT [default: '']\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  file_path TEXT\\n  file_updated_at TEXT\\n  file_md5 TEXT [default: '']\\n  db_md5 TEXT [default: '']\\n  editor_state TEXT [default: '']\\n  title TEXT [default: '']\\n  module_key TEXT [default: '']\\n  template_name TEXT [default: '']\\n  template_version TEXT [default: '']\\n  source_of_truth TEXT [default: 'database']\\n}\\n\\nTable project_modules {\\n  project_id TEXT [pk, not null]\\n  module_key TEXT [pk, not null]\\n  module_group TEXT [not null]\\n  label TEXT [not null]\\n  description TEXT [default: '']\\n  enabled INTEGER [default: 0]\\n  is_core INTEGER [default: 0]\\n  sort_order INTEGER [default: 0]\\n  settings_json TEXT [default: '{}']\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  purpose_summary TEXT [default: '']\\n}\\n\\nTable projects {\\n  id TEXT [pk]\\n  path TEXT\\n  absolute_path TEXT\\n  name TEXT [not null]\\n  description TEXT\\n  parent_id TEXT\\n  server_id TEXT\\n  image_path TEXT\\n  open_in_cursor INTEGER [default: 0]\\n  category TEXT\\n  tags TEXT [default: '[]']\\n  links TEXT [default: '[]']\\n  date_added TEXT\\n  type TEXT [default: 'folder']\\n  open_in_cursor_admin INTEGER [default: 0]\\n  url TEXT\\n  pinned INTEGER [default: 0]\\n  image_url TEXT\\n  upload_mappings TEXT [default: '[]']\\n  mapping_groups TEXT [default: '[]']\\n  primary_action TEXT [default: 'auto']\\n  integrations TEXT [default: '{}']\\n  workspace_plugins TEXT [default: '[]']\\n  project_type TEXT [default: 'general']\\n}\\n\\nTable roadmap_fragments {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  source_feature_id TEXT\\n  source_phase_id TEXT\\n  code TEXT [not null]\\n  title TEXT [not null]\\n  markdown TEXT [not null, default: '']\\n  mermaid TEXT [not null, default: '']\\n  payload_json TEXT [not null, default: '']\\n  status TEXT [not null, default: 'draft']\\n  merged INTEGER [not null, default: 0]\\n  merged_at TEXT\\n  integrated_at TEXT\\n  file_name TEXT\\n  file_path TEXT\\n  file_updated_at TEXT\\n  file_md5 TEXT [not null, default: '']\\n  db_md5 TEXT [not null, default: '']\\n  created_at TEXT [not null]\\n  updated_at TEXT [not null]\\n}\\n\\nTable roadmap_phases {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  code TEXT [not null]\\n  name TEXT [not null]\\n  summary TEXT [default: '']\\n  goal TEXT [default: '']\\n  status TEXT [default: 'planned']\\n  target_date TEXT\\n  sort_order INTEGER [default: 0]\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  after_phase_id TEXT\\n  archived INTEGER [default: 0]\\n}\\n\\nTable tasks {\\n  id TEXT [pk]\\n  project_id TEXT [not null]\\n  title TEXT [not null]\\n  description TEXT\\n  status TEXT [default: 'todo']\\n  priority TEXT [default: 'medium']\\n  created_at TEXT [default: CURRENT_TIMESTAMP]\\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\\n  due_date TEXT\\n  assigned_to TEXT\\n  start_date TEXT\\n  end_date TEXT\\n  dependency_ids TEXT [default: '[]']\\n  progress INTEGER [default: 0]\\n  milestone INTEGER [default: 0]\\n  sort_order INTEGER [default: 0]\\n  roadmap_phase_id TEXT\\n  planning_bucket TEXT [default: 'considered']\\n  item_type TEXT [default: 'task']\\n  category TEXT\\n  work_item_type TEXT [default: 'core_task']\\n}\\n\\nRef: bug_items.project_id < projects.id\\nRef: entity_relationships.project_id < projects.id\\nRef: feature_items.project_id < projects.id\\nRef: integration_events.project_id < projects.id\\nRef: prd_fragments.project_id < projects.id\\nRef: project_md_documents.project_id < projects.id\\nRef: project_modules.project_id < projects.id\\nRef: roadmap_phases.project_id < projects.id\\nRef: tasks.project_id < projects.id\",\n      \"mermaid\": \"erDiagram\\n  APP_SETTINGS {\\n    TEXT key PK\\n    TEXT value\\n    INTEGER is_secret\\n    TEXT updated_at\\n  }\\n  BUG_ITEMS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT code\\n    TEXT title\\n    TEXT summary\\n    TEXT severity\\n    TEXT status\\n    TEXT task_id\\n    INTEGER completed\\n    INTEGER regressed\\n    INTEGER archived\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT current_behavior\\n    TEXT expected_behavior\\n    TEXT work_item_type\\n    TEXT affected_module_keys\\n  }\\n  CREDENTIALS {\\n    TEXT id PK\\n    TEXT name\\n    TEXT host\\n    INTEGER port\\n    TEXT user\\n    TEXT password\\n    TEXT key_path\\n  }\\n  ENTITY_RELATIONSHIPS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT source_entity_type\\n    TEXT source_entity_id\\n    TEXT relationship_type\\n    TEXT target_entity_type\\n    TEXT target_entity_id\\n    TEXT metadata_json\\n    TEXT created_at\\n    TEXT updated_at\\n  }\\n  FEATURE_ITEMS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT code\\n    TEXT title\\n    TEXT summary\\n    TEXT status\\n    TEXT roadmap_phase_id\\n    TEXT task_id\\n    INTEGER archived\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT work_item_type\\n    TEXT affected_module_keys\\n  }\\n  INTEGRATION_EVENTS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT source\\n    TEXT event_type\\n    TEXT delivery_status\\n    TEXT payload\\n    TEXT created_at\\n  }\\n  MIGRATIONS {\\n    INTEGER id PK\\n    TEXT name\\n    TEXT executed_at\\n  }\\n  PRD_FRAGMENTS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT feature_id\\n    TEXT code\\n    TEXT title\\n    TEXT markdown\\n    TEXT mermaid\\n    TEXT status\\n    INTEGER merged\\n    TEXT merged_at\\n    TEXT file_name\\n    TEXT file_path\\n    TEXT file_updated_at\\n    TEXT file_md5\\n    TEXT db_md5\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT merged_file_name\\n  }\\n  PROJECT_MD_DOCUMENTS {\\n    TEXT project_id PK\\n    TEXT doc_type PK\\n    TEXT markdown\\n    TEXT mermaid\\n    TEXT updated_at\\n    TEXT file_path\\n    TEXT file_updated_at\\n    TEXT file_md5\\n    TEXT db_md5\\n    TEXT editor_state\\n    TEXT title\\n    TEXT module_key\\n    TEXT template_name\\n    TEXT template_version\\n    TEXT source_of_truth\\n  }\\n  PROJECT_MODULES {\\n    TEXT project_id PK\\n    TEXT module_key PK\\n    TEXT module_group\\n    TEXT label\\n    TEXT description\\n    INTEGER enabled\\n    INTEGER is_core\\n    INTEGER sort_order\\n    TEXT settings_json\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT purpose_summary\\n  }\\n  PROJECTS {\\n    TEXT id PK\\n    TEXT path\\n    TEXT absolute_path\\n    TEXT name\\n    TEXT description\\n    TEXT parent_id\\n    TEXT server_id\\n    TEXT image_path\\n    INTEGER open_in_cursor\\n    TEXT category\\n    TEXT tags\\n    TEXT links\\n    TEXT date_added\\n    TEXT type\\n    INTEGER open_in_cursor_admin\\n    TEXT url\\n    INTEGER pinned\\n    TEXT image_url\\n    TEXT upload_mappings\\n    TEXT mapping_groups\\n    TEXT primary_action\\n    TEXT integrations\\n    TEXT workspace_plugins\\n    TEXT project_type\\n  }\\n  ROADMAP_FRAGMENTS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT source_feature_id\\n    TEXT source_phase_id\\n    TEXT code\\n    TEXT title\\n    TEXT markdown\\n    TEXT mermaid\\n    TEXT payload_json\\n    TEXT status\\n    INTEGER merged\\n    TEXT merged_at\\n    TEXT integrated_at\\n    TEXT file_name\\n    TEXT file_path\\n    TEXT file_updated_at\\n    TEXT file_md5\\n    TEXT db_md5\\n    TEXT created_at\\n    TEXT updated_at\\n  }\\n  ROADMAP_PHASES {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT code\\n    TEXT name\\n    TEXT summary\\n    TEXT goal\\n    TEXT status\\n    TEXT target_date\\n    INTEGER sort_order\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT after_phase_id\\n    INTEGER archived\\n  }\\n  TASKS {\\n    TEXT id PK\\n    TEXT project_id\\n    TEXT title\\n    TEXT description\\n    TEXT status\\n    TEXT priority\\n    TEXT created_at\\n    TEXT updated_at\\n    TEXT due_date\\n    TEXT assigned_to\\n    TEXT start_date\\n    TEXT end_date\\n    TEXT dependency_ids\\n    INTEGER progress\\n    INTEGER milestone\\n    INTEGER sort_order\\n    TEXT roadmap_phase_id\\n    TEXT planning_bucket\\n    TEXT item_type\\n    TEXT category\\n    TEXT work_item_type\\n  }\\n  PROJECTS ||--o{ BUG_ITEMS : \\\"project_id\\\"\\n  PROJECTS ||--o{ ENTITY_RELATIONSHIPS : \\\"project_id\\\"\\n  PROJECTS ||--o{ FEATURE_ITEMS : \\\"project_id\\\"\\n  PROJECTS ||--o{ INTEGRATION_EVENTS : \\\"project_id\\\"\\n  PROJECTS ||--o{ PRD_FRAGMENTS : \\\"project_id\\\"\\n  PROJECTS ||--o{ PROJECT_MD_DOCUMENTS : \\\"project_id\\\"\\n  PROJECTS ||--o{ PROJECT_MODULES : \\\"project_id\\\"\\n  PROJECTS ||--o{ ROADMAP_PHASES : \\\"project_id\\\"\\n  PROJECTS ||--o{ TASKS : \\\"project_id\\\"\"\n    },\n    \"status\": \"draft\",\n    \"merged\": false,\n    \"mergedAt\": null,\n    \"integratedAt\": null,\n    \"fileName\": \"DATABASE_SCHEMA_FRAGMENT_20260403_001500000.md\",\n    \"createdAt\": \"2026-04-03T00:16:28.120Z\",\n    \"updatedAt\": \"2026-04-03T00:16:28.120Z\"\n  }\n}\n--\u003e\n\n## Import Summary\n\nObserved SQLite schema imported from the live Angel's Project Manager runtime database to regenerate DATABASE_SCHEMA.md and DATABASE_SCHEMA.dbml.\n\n## Source Metadata\n\n- Source Type: sqlite_database\n- Source Label: C:\\Users\\croni\\Projects\\data\\app.db\n- Dialect: sqlite\n- Confidence: observed\n- Observed At: 2026-04-03T00:16:28.120Z\n- Schema Fingerprint: 6472ebfcb4f9ce91151ef8d1006b39d2\n\n## Observed Schema Summary\n\n- 14 tables/views observed\n- 9 foreign-key relationships observed\n- 38 indexes observed\n- 1 explicit unique constraints observed\n\n## Entities\n\n### 1. app_settings\n\n- Kind: table\n- Status: observed\n- `key`: Type: TEXT; Nullable: yes; Primary key\n- `value`: Type: TEXT; Nullable: yes\n- `is_secret`: Type: INTEGER; Nullable: yes; Default: 0\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n\n### 2. bug_items\n\n- Kind: table\n- Status: observed\n- `id`: Type: TEXT; Nullable: yes; Primary key\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\n- `code`: Type: TEXT; Nullable: no\n- `title`: Type: TEXT; Nullable: no\n- `summary`: Type: TEXT; Nullable: yes; Default: ''\n- `severity`: Type: TEXT; Nullable: yes; Default: 'medium'\n- `status`: Type: TEXT; Nullable: yes; Default: 'open'\n- `task_id`: Type: TEXT; Nullable: yes\n- `completed`: Type: INTEGER; Nullable: yes; Default: 0\n- `regressed`: Type: INTEGER; Nullable: yes; Default: 0\n- `archived`: Type: INTEGER; Nullable: yes; Default: 0\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `current_behavior`: Type: TEXT; Nullable: yes; Default: ''\n- `expected_behavior`: Type: TEXT; Nullable: yes; Default: ''\n- `work_item_type`: Type: TEXT; Nullable: yes; Default: 'software_bug'\n- `affected_module_keys`: Type: TEXT; Nullable: yes; Default: '[]'\n\n### 3. credentials\n\n- Kind: table\n- Status: observed\n- `id`: Type: TEXT; Nullable: yes; Primary key\n- `name`: Type: TEXT; Nullable: no\n- `host`: Type: TEXT; Nullable: no\n- `port`: Type: INTEGER; Nullable: yes; Default: 22\n- `user`: Type: TEXT; Nullable: no\n- `password`: Type: TEXT; Nullable: yes\n- `key_path`: Type: TEXT; Nullable: yes\n\n### 4. entity_relationships\n\n- Kind: table\n- Status: observed\n- `id`: Type: TEXT; Nullable: yes; Primary key\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\n- `source_entity_type`: Type: TEXT; Nullable: no\n- `source_entity_id`: Type: TEXT; Nullable: no\n- `relationship_type`: Type: TEXT; Nullable: no\n- `target_entity_type`: Type: TEXT; Nullable: no\n- `target_entity_id`: Type: TEXT; Nullable: no\n- `metadata_json`: Type: TEXT; Nullable: yes; Default: '{}'\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n\n### 5. feature_items\n\n- Kind: table\n- Status: observed\n- `id`: Type: TEXT; Nullable: yes; Primary key\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\n- `code`: Type: TEXT; Nullable: no\n- `title`: Type: TEXT; Nullable: no\n- `summary`: Type: TEXT; Nullable: yes; Default: ''\n- `status`: Type: TEXT; Nullable: yes; Default: 'planned'\n- `roadmap_phase_id`: Type: TEXT; Nullable: yes\n- `task_id`: Type: TEXT; Nullable: yes\n- `archived`: Type: INTEGER; Nullable: yes; Default: 0\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `work_item_type`: Type: TEXT; Nullable: yes; Default: 'software_feature'\n- `affected_module_keys`: Type: TEXT; Nullable: yes; Default: '[]'\n\n### 6. integration_events\n\n- Kind: table\n- Status: observed\n- `id`: Type: TEXT; Nullable: yes; Primary key\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\n- `source`: Type: TEXT; Nullable: no\n- `event_type`: Type: TEXT; Nullable: no\n- `delivery_status`: Type: TEXT; Nullable: yes; Default: 'received'\n- `payload`: Type: TEXT; Nullable: yes; Default: '{}'\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n\n### 7. migrations\n\n- Kind: table\n- Status: observed\n- `id`: Type: INTEGER; Nullable: yes; Primary key\n- `name`: Type: TEXT; Nullable: no; Unique\n- `executed_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n\n### 8. prd_fragments\n\n- Kind: table\n- Status: observed\n- `id`: Type: TEXT; Nullable: yes; Primary key\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\n- `feature_id`: Type: TEXT; Nullable: yes\n- `code`: Type: TEXT; Nullable: no\n- `title`: Type: TEXT; Nullable: no\n- `markdown`: Type: TEXT; Nullable: yes; Default: ''\n- `mermaid`: Type: TEXT; Nullable: yes; Default: ''\n- `status`: Type: TEXT; Nullable: yes; Default: 'draft'\n- `merged`: Type: INTEGER; Nullable: yes; Default: 0\n- `merged_at`: Type: TEXT; Nullable: yes\n- `file_name`: Type: TEXT; Nullable: yes\n- `file_path`: Type: TEXT; Nullable: yes\n- `file_updated_at`: Type: TEXT; Nullable: yes\n- `file_md5`: Type: TEXT; Nullable: yes; Default: ''\n- `db_md5`: Type: TEXT; Nullable: yes; Default: ''\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `merged_file_name`: Type: TEXT; Nullable: yes\n\n### 9. project_md_documents\n\n- Kind: table\n- Status: observed\n- `project_id`: Type: TEXT; Nullable: no; Primary key; References: projects.id\n- `doc_type`: Type: TEXT; Nullable: no; Primary key\n- `markdown`: Type: TEXT; Nullable: yes; Default: ''\n- `mermaid`: Type: TEXT; Nullable: yes; Default: ''\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `file_path`: Type: TEXT; Nullable: yes\n- `file_updated_at`: Type: TEXT; Nullable: yes\n- `file_md5`: Type: TEXT; Nullable: yes; Default: ''\n- `db_md5`: Type: TEXT; Nullable: yes; Default: ''\n- `editor_state`: Type: TEXT; Nullable: yes; Default: ''\n- `title`: Type: TEXT; Nullable: yes; Default: ''\n- `module_key`: Type: TEXT; Nullable: yes; Default: ''\n- `template_name`: Type: TEXT; Nullable: yes; Default: ''\n- `template_version`: Type: TEXT; Nullable: yes; Default: ''\n- `source_of_truth`: Type: TEXT; Nullable: yes; Default: 'database'\n\n### 10. project_modules\n\n- Kind: table\n- Status: observed\n- `project_id`: Type: TEXT; Nullable: no; Primary key; References: projects.id\n- `module_key`: Type: TEXT; Nullable: no; Primary key\n- `module_group`: Type: TEXT; Nullable: no\n- `label`: Type: TEXT; Nullable: no\n- `description`: Type: TEXT; Nullable: yes; Default: ''\n- `enabled`: Type: INTEGER; Nullable: yes; Default: 0\n- `is_core`: Type: INTEGER; Nullable: yes; Default: 0\n- `sort_order`: Type: INTEGER; Nullable: yes; Default: 0\n- `settings_json`: Type: TEXT; Nullable: yes; Default: '{}'\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `purpose_summary`: Type: TEXT; Nullable: yes; Default: ''\n\n### 11. projects\n\n- Kind: table\n- Status: observed\n- `id`: Type: TEXT; Nullable: yes; Primary key\n- `path`: Type: TEXT; Nullable: yes\n- `absolute_path`: Type: TEXT; Nullable: yes\n- `name`: Type: TEXT; Nullable: no\n- `description`: Type: TEXT; Nullable: yes\n- `parent_id`: Type: TEXT; Nullable: yes\n- `server_id`: Type: TEXT; Nullable: yes\n- `image_path`: Type: TEXT; Nullable: yes\n- `open_in_cursor`: Type: INTEGER; Nullable: yes; Default: 0\n- `category`: Type: TEXT; Nullable: yes\n- `tags`: Type: TEXT; Nullable: yes; Default: '[]'\n- `links`: Type: TEXT; Nullable: yes; Default: '[]'\n- `date_added`: Type: TEXT; Nullable: yes\n- `type`: Type: TEXT; Nullable: yes; Default: 'folder'\n- `open_in_cursor_admin`: Type: INTEGER; Nullable: yes; Default: 0\n- `url`: Type: TEXT; Nullable: yes\n- `pinned`: Type: INTEGER; Nullable: yes; Default: 0\n- `image_url`: Type: TEXT; Nullable: yes\n- `upload_mappings`: Type: TEXT; Nullable: yes; Default: '[]'\n- `mapping_groups`: Type: TEXT; Nullable: yes; Default: '[]'\n- `primary_action`: Type: TEXT; Nullable: yes; Default: 'auto'\n- `integrations`: Type: TEXT; Nullable: yes; Default: '{}'\n- `workspace_plugins`: Type: TEXT; Nullable: yes; Default: '[]'\n- `project_type`: Type: TEXT; Nullable: yes; Default: 'general'\n\n### 12. roadmap_fragments\n\n- Kind: table\n- Status: observed\n- `id`: Type: TEXT; Nullable: yes; Primary key\n- `project_id`: Type: TEXT; Nullable: no\n- `source_feature_id`: Type: TEXT; Nullable: yes\n- `source_phase_id`: Type: TEXT; Nullable: yes\n- `code`: Type: TEXT; Nullable: no\n- `title`: Type: TEXT; Nullable: no\n- `markdown`: Type: TEXT; Nullable: no; Default: ''\n- `mermaid`: Type: TEXT; Nullable: no; Default: ''\n- `payload_json`: Type: TEXT; Nullable: no; Default: ''\n- `status`: Type: TEXT; Nullable: no; Default: 'draft'\n- `merged`: Type: INTEGER; Nullable: no; Default: 0\n- `merged_at`: Type: TEXT; Nullable: yes\n- `integrated_at`: Type: TEXT; Nullable: yes\n- `file_name`: Type: TEXT; Nullable: yes\n- `file_path`: Type: TEXT; Nullable: yes\n- `file_updated_at`: Type: TEXT; Nullable: yes\n- `file_md5`: Type: TEXT; Nullable: no; Default: ''\n- `db_md5`: Type: TEXT; Nullable: no; Default: ''\n- `created_at`: Type: TEXT; Nullable: no\n- `updated_at`: Type: TEXT; Nullable: no\n\n### 13. roadmap_phases\n\n- Kind: table\n- Status: observed\n- `id`: Type: TEXT; Nullable: yes; Primary key\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\n- `code`: Type: TEXT; Nullable: no\n- `name`: Type: TEXT; Nullable: no\n- `summary`: Type: TEXT; Nullable: yes; Default: ''\n- `goal`: Type: TEXT; Nullable: yes; Default: ''\n- `status`: Type: TEXT; Nullable: yes; Default: 'planned'\n- `target_date`: Type: TEXT; Nullable: yes\n- `sort_order`: Type: INTEGER; Nullable: yes; Default: 0\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `after_phase_id`: Type: TEXT; Nullable: yes\n- `archived`: Type: INTEGER; Nullable: yes; Default: 0\n\n### 14. tasks\n\n- Kind: table\n- Status: observed\n- `id`: Type: TEXT; Nullable: yes; Primary key\n- `project_id`: Type: TEXT; Nullable: no; References: projects.id\n- `title`: Type: TEXT; Nullable: no\n- `description`: Type: TEXT; Nullable: yes\n- `status`: Type: TEXT; Nullable: yes; Default: 'todo'\n- `priority`: Type: TEXT; Nullable: yes; Default: 'medium'\n- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP\n- `due_date`: Type: TEXT; Nullable: yes\n- `assigned_to`: Type: TEXT; Nullable: yes\n- `start_date`: Type: TEXT; Nullable: yes\n- `end_date`: Type: TEXT; Nullable: yes\n- `dependency_ids`: Type: TEXT; Nullable: yes; Default: '[]'\n- `progress`: Type: INTEGER; Nullable: yes; Default: 0\n- `milestone`: Type: INTEGER; Nullable: yes; Default: 0\n- `sort_order`: Type: INTEGER; Nullable: yes; Default: 0\n- `roadmap_phase_id`: Type: TEXT; Nullable: yes\n- `planning_bucket`: Type: TEXT; Nullable: yes; Default: 'considered'\n- `item_type`: Type: TEXT; Nullable: yes; Default: 'task'\n- `category`: Type: TEXT; Nullable: yes\n- `work_item_type`: Type: TEXT; Nullable: yes; Default: 'core_task'\n\n## Relationships\n\n### 1. bug_items:project_id:projects:id:0\n\n- From: bug_items.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n\n### 2. entity_relationships:project_id:projects:id:0\n\n- From: entity_relationships.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n\n### 3. feature_items:project_id:projects:id:0\n\n- From: feature_items.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n\n### 4. integration_events:project_id:projects:id:0\n\n- From: integration_events.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n\n### 5. prd_fragments:project_id:projects:id:0\n\n- From: prd_fragments.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n\n### 6. project_md_documents:project_id:projects:id:0\n\n- From: project_md_documents.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n\n### 7. project_modules:project_id:projects:id:0\n\n- From: project_modules.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n\n### 8. roadmap_phases:project_id:projects:id:0\n\n- From: roadmap_phases.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n\n### 9. tasks:project_id:projects:id:0\n\n- From: tasks.project_id\n- To: projects.id\n- Cardinality: many-to-one\n- Status: observed\n\n## Indexes and Constraints\n\n- Index `sqlite_autoindex_app_settings_1` on app_settings (key) [unique]\n- Index `idx_bug_items_project_archived` on bug_items (project_id, archived, updated_at)\n- Index `sqlite_autoindex_bug_items_1` on bug_items (id) [unique]\n- Index `sqlite_autoindex_credentials_1` on credentials (id) [unique]\n- Index `idx_entity_relationships_project_target` on entity_relationships (project_id, target_entity_type, target_entity_id)\n- Index `idx_entity_relationships_project_source` on entity_relationships (project_id, source_entity_type, source_entity_id)\n- Index `sqlite_autoindex_entity_relationships_1` on entity_relationships (id) [unique]\n- Index `idx_feature_items_project_archived` on feature_items (project_id, archived, updated_at)\n- Index `sqlite_autoindex_feature_items_1` on feature_items (id) [unique]\n- Index `idx_integration_events_source` on integration_events (source)\n- Index `idx_integration_events_project_created` on integration_events (project_id, created_at)\n- Index `sqlite_autoindex_integration_events_1` on integration_events (id) [unique]\n- Index `sqlite_autoindex_migrations_1` on migrations (name) [unique]\n- Index `idx_prd_fragments_project_merged` on prd_fragments (project_id, merged, updated_at)\n- Index `idx_prd_fragments_project_feature` on prd_fragments (project_id, feature_id) [unique]\n- Index `sqlite_autoindex_prd_fragments_1` on prd_fragments (id) [unique]\n- Index `sqlite_autoindex_project_md_documents_1` on project_md_documents (project_id, doc_type) [unique]\n- Index `idx_project_modules_project_group` on project_modules (project_id, module_group, sort_order)\n- Index `sqlite_autoindex_project_modules_1` on project_modules (project_id, module_key) [unique]\n- Index `idx_projects_pinned` on projects (pinned)\n- Index `idx_projects_category` on projects (category)\n- Index `sqlite_autoindex_projects_1` on projects (id) [unique]\n- Index `idx_roadmap_fragments_project_status` on roadmap_fragments (project_id, merged, updated_at)\n- Index `idx_roadmap_fragments_project_feature` on roadmap_fragments (project_id, source_feature_id) [unique]\n- Index `sqlite_autoindex_roadmap_fragments_1` on roadmap_fragments (id) [unique]\n- Index `idx_roadmap_phases_after` on roadmap_phases (project_id, after_phase_id)\n- Index `idx_roadmap_phases_project_archive` on roadmap_phases (project_id, archived, sort_order)\n- Index `idx_roadmap_phases_project_sort` on roadmap_phases (project_id, sort_order)\n- Index `sqlite_autoindex_roadmap_phases_1` on roadmap_phases (id) [unique]\n- Index `idx_tasks_project_work_item_type` on tasks (project_id, work_item_type, updated_at)\n- Index `idx_tasks_project_category` on tasks (project_id, category)\n- Index `idx_tasks_project_type` on tasks (project_id, item_type, updated_at)\n- Index `idx_tasks_project_bucket` on tasks (project_id, planning_bucket, updated_at)\n- Index `idx_tasks_project_phase` on tasks (project_id, roadmap_phase_id, sort_order)\n- Index `idx_tasks_sort_order` on tasks (project_id, sort_order)\n- Index `idx_tasks_status` on tasks (status)\n- Index `idx_tasks_project_id` on tasks (project_id)\n- Index `sqlite_autoindex_tasks_1` on tasks (id) [unique]\n\n- Constraint `sqlite_autoindex_migrations_1` on migrations: UNIQUE (name)\n\n## Migration Notes\n\n- Captured directly from the live runtime SQLite database to restore or validate the Database Schema module output.\n\n## Open Questions\n\n- None at capture time.\n\n## DBML\n\n```dbml\nProject \"Angel's Project Manager\" {\n  database_type: \"SQLite\"\n}\n\nTable app_settings {\n  key TEXT [pk]\n  value TEXT\n  is_secret INTEGER [default: 0]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n}\n\nTable bug_items {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  code TEXT [not null]\n  title TEXT [not null]\n  summary TEXT [default: '']\n  severity TEXT [default: 'medium']\n  status TEXT [default: 'open']\n  task_id TEXT\n  completed INTEGER [default: 0]\n  regressed INTEGER [default: 0]\n  archived INTEGER [default: 0]\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  current_behavior TEXT [default: '']\n  expected_behavior TEXT [default: '']\n  work_item_type TEXT [default: 'software_bug']\n  affected_module_keys TEXT [default: '[]']\n}\n\nTable credentials {\n  id TEXT [pk]\n  name TEXT [not null]\n  host TEXT [not null]\n  port INTEGER [default: 22]\n  user TEXT [not null]\n  password TEXT\n  key_path TEXT\n}\n\nTable entity_relationships {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  source_entity_type TEXT [not null]\n  source_entity_id TEXT [not null]\n  relationship_type TEXT [not null]\n  target_entity_type TEXT [not null]\n  target_entity_id TEXT [not null]\n  metadata_json TEXT [default: '{}']\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n}\n\nTable feature_items {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  code TEXT [not null]\n  title TEXT [not null]\n  summary TEXT [default: '']\n  status TEXT [default: 'planned']\n  roadmap_phase_id TEXT\n  task_id TEXT\n  archived INTEGER [default: 0]\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  work_item_type TEXT [default: 'software_feature']\n  affected_module_keys TEXT [default: '[]']\n}\n\nTable integration_events {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  source TEXT [not null]\n  event_type TEXT [not null]\n  delivery_status TEXT [default: 'received']\n  payload TEXT [default: '{}']\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n}\n\nTable migrations {\n  id INTEGER [pk]\n  name TEXT [unique, not null]\n  executed_at TEXT [default: CURRENT_TIMESTAMP]\n}\n\nTable prd_fragments {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  feature_id TEXT\n  code TEXT [not null]\n  title TEXT [not null]\n  markdown TEXT [default: '']\n  mermaid TEXT [default: '']\n  status TEXT [default: 'draft']\n  merged INTEGER [default: 0]\n  merged_at TEXT\n  file_name TEXT\n  file_path TEXT\n  file_updated_at TEXT\n  file_md5 TEXT [default: '']\n  db_md5 TEXT [default: '']\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  merged_file_name TEXT\n}\n\nTable project_md_documents {\n  project_id TEXT [pk, not null]\n  doc_type TEXT [pk, not null]\n  markdown TEXT [default: '']\n  mermaid TEXT [default: '']\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  file_path TEXT\n  file_updated_at TEXT\n  file_md5 TEXT [default: '']\n  db_md5 TEXT [default: '']\n  editor_state TEXT [default: '']\n  title TEXT [default: '']\n  module_key TEXT [default: '']\n  template_name TEXT [default: '']\n  template_version TEXT [default: '']\n  source_of_truth TEXT [default: 'database']\n}\n\nTable project_modules {\n  project_id TEXT [pk, not null]\n  module_key TEXT [pk, not null]\n  module_group TEXT [not null]\n  label TEXT [not null]\n  description TEXT [default: '']\n  enabled INTEGER [default: 0]\n  is_core INTEGER [default: 0]\n  sort_order INTEGER [default: 0]\n  settings_json TEXT [default: '{}']\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  purpose_summary TEXT [default: '']\n}\n\nTable projects {\n  id TEXT [pk]\n  path TEXT\n  absolute_path TEXT\n  name TEXT [not null]\n  description TEXT\n  parent_id TEXT\n  server_id TEXT\n  image_path TEXT\n  open_in_cursor INTEGER [default: 0]\n  category TEXT\n  tags TEXT [default: '[]']\n  links TEXT [default: '[]']\n  date_added TEXT\n  type TEXT [default: 'folder']\n  open_in_cursor_admin INTEGER [default: 0]\n  url TEXT\n  pinned INTEGER [default: 0]\n  image_url TEXT\n  upload_mappings TEXT [default: '[]']\n  mapping_groups TEXT [default: '[]']\n  primary_action TEXT [default: 'auto']\n  integrations TEXT [default: '{}']\n  workspace_plugins TEXT [default: '[]']\n  project_type TEXT [default: 'general']\n}\n\nTable roadmap_fragments {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  source_feature_id TEXT\n  source_phase_id TEXT\n  code TEXT [not null]\n  title TEXT [not null]\n  markdown TEXT [not null, default: '']\n  mermaid TEXT [not null, default: '']\n  payload_json TEXT [not null, default: '']\n  status TEXT [not null, default: 'draft']\n  merged INTEGER [not null, default: 0]\n  merged_at TEXT\n  integrated_at TEXT\n  file_name TEXT\n  file_path TEXT\n  file_updated_at TEXT\n  file_md5 TEXT [not null, default: '']\n  db_md5 TEXT [not null, default: '']\n  created_at TEXT [not null]\n  updated_at TEXT [not null]\n}\n\nTable roadmap_phases {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  code TEXT [not null]\n  name TEXT [not null]\n  summary TEXT [default: '']\n  goal TEXT [default: '']\n  status TEXT [default: 'planned']\n  target_date TEXT\n  sort_order INTEGER [default: 0]\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  after_phase_id TEXT\n  archived INTEGER [default: 0]\n}\n\nTable tasks {\n  id TEXT [pk]\n  project_id TEXT [not null]\n  title TEXT [not null]\n  description TEXT\n  status TEXT [default: 'todo']\n  priority TEXT [default: 'medium']\n  created_at TEXT [default: CURRENT_TIMESTAMP]\n  updated_at TEXT [default: CURRENT_TIMESTAMP]\n  due_date TEXT\n  assigned_to TEXT\n  start_date TEXT\n  end_date TEXT\n  dependency_ids TEXT [default: '[]']\n  progress INTEGER [default: 0]\n  milestone INTEGER [default: 0]\n  sort_order INTEGER [default: 0]\n  roadmap_phase_id TEXT\n  planning_bucket TEXT [default: 'considered']\n  item_type TEXT [default: 'task']\n  category TEXT\n  work_item_type TEXT [default: 'core_task']\n}\n\nRef: bug_items.project_id < projects.id\nRef: entity_relationships.project_id < projects.id\nRef: feature_items.project_id < projects.id\nRef: integration_events.project_id < projects.id\nRef: prd_fragments.project_id < projects.id\nRef: project_md_documents.project_id < projects.id\nRef: project_modules.project_id < projects.id\nRef: roadmap_phases.project_id < projects.id\nRef: tasks.project_id < projects.id\n```\n\n## Mermaid\n\n```mermaid\nerDiagram\n  APP_SETTINGS {\n    TEXT key PK\n    TEXT value\n    INTEGER is_secret\n    TEXT updated_at\n  }\n  BUG_ITEMS {\n    TEXT id PK\n    TEXT project_id\n    TEXT code\n    TEXT title\n    TEXT summary\n    TEXT severity\n    TEXT status\n    TEXT task_id\n    INTEGER completed\n    INTEGER regressed\n    INTEGER archived\n    TEXT created_at\n    TEXT updated_at\n    TEXT current_behavior\n    TEXT expected_behavior\n    TEXT work_item_type\n    TEXT affected_module_keys\n  }\n  CREDENTIALS {\n    TEXT id PK\n    TEXT name\n    TEXT host\n    INTEGER port\n    TEXT user\n    TEXT password\n    TEXT key_path\n  }\n  ENTITY_RELATIONSHIPS {\n    TEXT id PK\n    TEXT project_id\n    TEXT source_entity_type\n    TEXT source_entity_id\n    TEXT relationship_type\n    TEXT target_entity_type\n    TEXT target_entity_id\n    TEXT metadata_json\n    TEXT created_at\n    TEXT updated_at\n  }\n  FEATURE_ITEMS {\n    TEXT id PK\n    TEXT project_id\n    TEXT code\n    TEXT title\n    TEXT summary\n    TEXT status\n    TEXT roadmap_phase_id\n    TEXT task_id\n    INTEGER archived\n    TEXT created_at\n    TEXT updated_at\n    TEXT work_item_type\n    TEXT affected_module_keys\n  }\n  INTEGRATION_EVENTS {\n    TEXT id PK\n    TEXT project_id\n    TEXT source\n    TEXT event_type\n    TEXT delivery_status\n    TEXT payload\n    TEXT created_at\n  }\n  MIGRATIONS {\n    INTEGER id PK\n    TEXT name\n    TEXT executed_at\n  }\n  PRD_FRAGMENTS {\n    TEXT id PK\n    TEXT project_id\n    TEXT feature_id\n    TEXT code\n    TEXT title\n    TEXT markdown\n    TEXT mermaid\n    TEXT status\n    INTEGER merged\n    TEXT merged_at\n    TEXT file_name\n    TEXT file_path\n    TEXT file_updated_at\n    TEXT file_md5\n    TEXT db_md5\n    TEXT created_at\n    TEXT updated_at\n    TEXT merged_file_name\n  }\n  PROJECT_MD_DOCUMENTS {\n    TEXT project_id PK\n    TEXT doc_type PK\n    TEXT markdown\n    TEXT mermaid\n    TEXT updated_at\n    TEXT file_path\n    TEXT file_updated_at\n    TEXT file_md5\n    TEXT db_md5\n    TEXT editor_state\n    TEXT title\n    TEXT module_key\n    TEXT template_name\n    TEXT template_version\n    TEXT source_of_truth\n  }\n  PROJECT_MODULES {\n    TEXT project_id PK\n    TEXT module_key PK\n    TEXT module_group\n    TEXT label\n    TEXT description\n    INTEGER enabled\n    INTEGER is_core\n    INTEGER sort_order\n    TEXT settings_json\n    TEXT created_at\n    TEXT updated_at\n    TEXT purpose_summary\n  }\n  PROJECTS {\n    TEXT id PK\n    TEXT path\n    TEXT absolute_path\n    TEXT name\n    TEXT description\n    TEXT parent_id\n    TEXT server_id\n    TEXT image_path\n    INTEGER open_in_cursor\n    TEXT category\n    TEXT tags\n    TEXT links\n    TEXT date_added\n    TEXT type\n    INTEGER open_in_cursor_admin\n    TEXT url\n    INTEGER pinned\n    TEXT image_url\n    TEXT upload_mappings\n    TEXT mapping_groups\n    TEXT primary_action\n    TEXT integrations\n    TEXT workspace_plugins\n    TEXT project_type\n  }\n  ROADMAP_FRAGMENTS {\n    TEXT id PK\n    TEXT project_id\n    TEXT source_feature_id\n    TEXT source_phase_id\n    TEXT code\n    TEXT title\n    TEXT markdown\n    TEXT mermaid\n    TEXT payload_json\n    TEXT status\n    INTEGER merged\n    TEXT merged_at\n    TEXT integrated_at\n    TEXT file_name\n    TEXT file_path\n    TEXT file_updated_at\n    TEXT file_md5\n    TEXT db_md5\n    TEXT created_at\n    TEXT updated_at\n  }\n  ROADMAP_PHASES {\n    TEXT id PK\n    TEXT project_id\n    TEXT code\n    TEXT name\n    TEXT summary\n    TEXT goal\n    TEXT status\n    TEXT target_date\n    INTEGER sort_order\n    TEXT created_at\n    TEXT updated_at\n    TEXT after_phase_id\n    INTEGER archived\n  }\n  TASKS {\n    TEXT id PK\n    TEXT project_id\n    TEXT title\n    TEXT description\n    TEXT status\n    TEXT priority\n    TEXT created_at\n    TEXT updated_at\n    TEXT due_date\n    TEXT assigned_to\n    TEXT start_date\n    TEXT end_date\n    TEXT dependency_ids\n    INTEGER progress\n    INTEGER milestone\n    INTEGER sort_order\n    TEXT roadmap_phase_id\n    TEXT planning_bucket\n    TEXT item_type\n    TEXT category\n    TEXT work_item_type\n  }\n  PROJECTS ||--o{ BUG_ITEMS : \"project_id\"\n  PROJECTS ||--o{ ENTITY_RELATIONSHIPS : \"project_id\"\n  PROJECTS ||--o{ FEATURE_ITEMS : \"project_id\"\n  PROJECTS ||--o{ INTEGRATION_EVENTS : \"project_id\"\n  PROJECTS ||--o{ PRD_FRAGMENTS : \"project_id\"\n  PROJECTS ||--o{ PROJECT_MD_DOCUMENTS : \"project_id\"\n  PROJECTS ||--o{ PROJECT_MODULES : \"project_id\"\n  PROJECTS ||--o{ ROADMAP_PHASES : \"project_id\"\n  PROJECTS ||--o{ TASKS : \"project_id\"\n```\n\n## Merge Guidance\n\n- Review this fragment before consuming it, because it reflects the observed runtime schema and may replace hand-authored module narrative.\n- Consume this fragment through the Database Schema module to regenerate DATABASE_SCHEMA.md and DATABASE_SCHEMA.dbml from the imported schema model.\n",
        "status": "integrated",
        "fileName": "DATABASE_SCHEMA_FRAGMENT_20260403_001500000.md",
        "sourceScope": "shared",
        "merged": true,
        "mergedAt": "2026-04-03T00:23:27.554Z",
        "integratedAt": "2026-04-03T00:23:27.554Z",
        "updatedAt": "2026-04-03T00:23:27.520Z"
      },
      {
        "id": "schema-fragment-project-modules-purpose-summary",
        "code": "DBFRAG-002",
        "title": "Add purpose_summary to project_modules",
        "markdown": "# Database Schema Fragment: project_modules purpose summary\n\n> Managed document. Must comply with template DATABASE_SCHEMA_FRAGMENT.template.md.\n\n<\u0021-- APM:DATA\n{\n  \"docType\": \"database_schema_fragment\",\n  \"version\": 1,\n  \"fragment\": {\n    \"id\": \"schema-fragment-project-modules-purpose-summary\",\n    \"projectId\": \"manager-repo\",\n    \"code\": \"DBFRAG-002\",\n    \"title\": \"Add purpose_summary to project_modules\",\n    \"payload\": {\n      \"source\": {\n        \"sourceType\": \"mixed\",\n        \"sourceLabel\": \"Module hierarchy refactor and persistence update\",\n        \"dialect\": \"sqlite\",\n        \"observedAt\": \"2026-03-31T21:00:00.000Z\",\n        \"schemaFingerprint\": \"project-modules-purpose-summary-v1\",\n        \"confidence\": \"mixed\"\n      },\n      \"summary\": \"Adds a purpose_summary column to project_modules so each module can store a concise, user-facing explanation of how it contributes to the project.\",\n      \"entities\": [\n        {\n          \"id\": \"project_modules\",\n          \"name\": \"project_modules\",\n          \"kind\": \"table\",\n          \"status\": \"observed\",\n          \"notes\": \"Stores per-project module state, labels, hierarchy metadata, and now concise purpose text for navigation and AI-readable summaries.\",\n          \"fields\": [\n            {\n              \"id\": \"project_modules.project_id\",\n              \"name\": \"project_id\",\n              \"type\": \"text\",\n              \"nullable\": false,\n              \"primaryKey\": true,\n              \"unique\": false,\n              \"defaultValue\": \"\",\n              \"referencesEntityId\": \"projects\",\n              \"referencesFieldId\": \"projects.id\",\n              \"status\": \"observed\",\n              \"notes\": \"Owning project id.\"\n            },\n            {\n              \"id\": \"project_modules.module_key\",\n              \"name\": \"module_key\",\n              \"type\": \"text\",\n              \"nullable\": false,\n              \"primaryKey\": true,\n              \"unique\": false,\n              \"defaultValue\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"Stable module key.\"\n            },\n            {\n              \"id\": \"project_modules.module_group\",\n              \"name\": \"module_group\",\n              \"type\": \"text\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": false,\n              \"defaultValue\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"Module grouping such as core, software, or ai.\"\n            },\n            {\n              \"id\": \"project_modules.label\",\n              \"name\": \"label\",\n              \"type\": \"text\",\n              \"nullable\": false,\n              \"primaryKey\": false,\n              \"unique\": false,\n              \"defaultValue\": \"\",\n              \"status\": \"observed\",\n              \"notes\": \"Display label for the module.\"\n            },\n            {\n              \"id\": \"project_modules.description\",\n              \"name\": \"description\",\n              \"type\": \"text\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": false,\n              \"defaultValue\": \"''\",\n              \"status\": \"observed\",\n              \"notes\": \"Longer module description.\"\n            },\n            {\n              \"id\": \"project_modules.purpose_summary\",\n              \"name\": \"purpose_summary\",\n              \"type\": \"text\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": false,\n              \"defaultValue\": \"''\",\n              \"status\": \"inferred\",\n              \"notes\": \"Concise plain-language explanation of how the module contributes to the project.\"\n            },\n            {\n              \"id\": \"project_modules.enabled\",\n              \"name\": \"enabled\",\n              \"type\": \"integer\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": false,\n              \"defaultValue\": \"0\",\n              \"status\": \"observed\",\n              \"notes\": \"Whether the module is enabled for the project.\"\n            },\n            {\n              \"id\": \"project_modules.is_core\",\n              \"name\": \"is_core\",\n              \"type\": \"integer\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": false,\n              \"defaultValue\": \"0\",\n              \"status\": \"observed\",\n              \"notes\": \"Whether the module is part of the always-on core.\"\n            },\n            {\n              \"id\": \"project_modules.sort_order\",\n              \"name\": \"sort_order\",\n              \"type\": \"integer\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": false,\n              \"defaultValue\": \"0\",\n              \"status\": \"observed\",\n              \"notes\": \"Order in which modules appear.\"\n            },\n            {\n              \"id\": \"project_modules.settings_json\",\n              \"name\": \"settings_json\",\n              \"type\": \"text\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": false,\n              \"defaultValue\": \"'{}'\",\n              \"status\": \"observed\",\n              \"notes\": \"Module-specific persisted settings.\"\n            },\n            {\n              \"id\": \"project_modules.created_at\",\n              \"name\": \"created_at\",\n              \"type\": \"text\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": false,\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"status\": \"observed\",\n              \"notes\": \"Creation timestamp.\"\n            },\n            {\n              \"id\": \"project_modules.updated_at\",\n              \"name\": \"updated_at\",\n              \"type\": \"text\",\n              \"nullable\": true,\n              \"primaryKey\": false,\n              \"unique\": false,\n              \"defaultValue\": \"CURRENT_TIMESTAMP\",\n              \"status\": \"observed\",\n              \"notes\": \"Last update timestamp.\"\n            }\n          ]\n        }\n      ],\n      \"relationships\": [\n        {\n          \"id\": \"rel_project_modules_projects\",\n          \"fromEntityId\": \"project_modules\",\n          \"fromFieldId\": \"project_modules.project_id\",\n          \"toEntityId\": \"projects\",\n          \"toFieldId\": \"projects.id\",\n          \"cardinality\": \"many-to-one\",\n          \"status\": \"observed\",\n          \"notes\": \"Each module record belongs to a single project.\"\n        }\n      ],\n      \"indexes\": [\n        {\n          \"id\": \"idx_project_modules_primary\",\n          \"entityId\": \"project_modules\",\n          \"name\": \"sqlite_autoindex_project_modules_1\",\n          \"fields\": [\n            \"project_id\",\n            \"module_key\"\n          ],\n          \"unique\": true,\n          \"status\": \"observed\",\n          \"notes\": \"Primary key index for per-project module lookup.\"\n        },\n        {\n          \"id\": \"idx_project_modules_project_group\",\n          \"entityId\": \"project_modules\",\n          \"name\": \"idx_project_modules_project_group\",\n          \"fields\": [\n            \"project_id\",\n            \"module_group\",\n            \"sort_order\"\n          ],\n          \"unique\": false,\n          \"status\": \"observed\",\n          \"notes\": \"Supports grouped module navigation ordering.\"\n        }\n      ],\n      \"constraints\": [\n        {\n          \"id\": \"pk_project_modules\",\n          \"entityId\": \"project_modules\",\n          \"name\": \"project_modules_pk\",\n          \"type\": \"primary_key\",\n          \"definition\": \"(project_id, module_key)\",\n          \"status\": \"observed\",\n          \"notes\": \"Composite primary key for module rows.\"\n        },\n        {\n          \"id\": \"fk_project_modules_project\",\n          \"entityId\": \"project_modules\",\n          \"name\": \"project_modules_project_fk\",\n          \"type\": \"foreign_key\",\n          \"definition\": \"FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE\",\n          \"status\": \"observed\",\n          \"notes\": \"Deletes module records when a project is removed.\"\n        }\n      ],\n      \"migrationNotes\": [\n        {\n          \"title\": \"Add purpose_summary column\",\n          \"description\": \"Add a nullable text column to project_modules and backfill it from module definitions so the navigation and AI-facing summaries stay consistent.\",\n          \"status\": \"inferred\"\n        }\n      ],\n      \"openQuestions\": [],\n      \"dbml\": \"Table project_modules {\\n  project_id text [pk, ref: > projects.id]\\n  module_key text [pk]\\n  module_group text [not null]\\n  label text [not null]\\n  description text\\n  purpose_summary text\\n  enabled integer [default: 0]\\n  is_core integer [default: 0]\\n  sort_order integer [default: 0]\\n  settings_json text [default: '{}']\\n  created_at text [default: `CURRENT_TIMESTAMP`]\\n  updated_at text [default: `CURRENT_TIMESTAMP`]\\n}\\n\\nRef: project_modules.project_id > projects.id\",\n      \"mermaid\": \"erDiagram\\n  PROJECTS ||--o{ PROJECT_MODULES : owns\\n  PROJECT_MODULES {\\n    text project_id PK\\n    text module_key PK\\n    text module_group\\n    text label\\n    text description\\n    text purpose_summary\\n    integer enabled\\n    integer is_core\\n    integer sort_order\\n    text settings_json\\n    text created_at\\n    text updated_at\\n  }\"\n    }\n  }\n}\n--\u003e\n\n## Import Summary\n\nThis fragment proposes a focused schema update to `project_modules` so each module can persist a concise purpose summary alongside its existing label and description.\n\n## Source Metadata\n\n- Source Type: mixed\n- Source Label: Module hierarchy refactor and persistence update\n- Dialect: sqlite\n- Confidence: mixed\n- Observed At: 2026-03-31T21:00:00.000Z\n- Schema Fingerprint: project-modules-purpose-summary-v1\n\n## Observed Schema Summary\n\n- `project_modules` already stores module labels, descriptions, enabled state, and ordering.\n- Navigation now needs a shorter, plainer explanation for each module.\n- The new `purpose_summary` field is intended to support compact UI guidance and AI-readable module context.\n\n## Entities\n\n### 1. project_modules\n\n- Status: observed\n- Notes: Stores module state for each project. This change adds a concise explanation field for navigation and AI-facing summaries.\n\n#### Fields\n\n- `project_id` (`text`) - observed - project owner id\n- `module_key` (`text`) - observed - stable module key\n- `module_group` (`text`) - observed - core/software/ai grouping\n- `label` (`text`) - observed - module display name\n- `description` (`text`) - observed - longer description\n- `purpose_summary` (`text`) - inferred - concise plain-language contribution summary\n- `enabled` (`integer`) - observed - enabled flag\n- `is_core` (`integer`) - observed - core module flag\n- `sort_order` (`integer`) - observed - navigation order\n- `settings_json` (`text`) - observed - module settings payload\n- `created_at` (`text`) - observed - creation timestamp\n- `updated_at` (`text`) - observed - update timestamp\n\n## Relationships\n\n- `project_modules.project_id` -> `projects.id`\n  - Cardinality: many-to-one\n  - Status: observed\n  - Notes: Each module record belongs to a single project.\n\n## Indexes and Constraints\n\n- Index: `sqlite_autoindex_project_modules_1`\n  - Fields: `project_id`, `module_key`\n  - Unique: yes\n  - Status: observed\n\n- Index: `idx_project_modules_project_group`\n  - Fields: `project_id`, `module_group`, `sort_order`\n  - Unique: no\n  - Status: observed\n\n- Constraint: `project_modules_pk`\n  - Type: primary_key\n  - Definition: `(project_id, module_key)`\n  - Status: observed\n\n- Constraint: `project_modules_project_fk`\n  - Type: foreign_key\n  - Definition: `FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE`\n  - Status: observed\n\n## Migration Notes\n\n- Add `purpose_summary` as a nullable text column on `project_modules`.\n- Backfill it from the module definition registry so existing projects immediately get concise summaries.\n- Keep the longer `description` field intact for fuller explanations elsewhere in the UI.\n\n## Open Questions\n\n- None at this time.\n\n## DBML\n\n```dbml\nTable project_modules {\n  project_id text [pk, ref: > projects.id]\n  module_key text [pk]\n  module_group text [not null]\n  label text [not null]\n  description text\n  purpose_summary text\n  enabled integer [default: 0]\n  is_core integer [default: 0]\n  sort_order integer [default: 0]\n  settings_json text [default: '{}']\n  created_at text [default: `CURRENT_TIMESTAMP`]\n  updated_at text [default: `CURRENT_TIMESTAMP`]\n}\n\nRef: project_modules.project_id > projects.id\n```\n\n## Mermaid\n\n```mermaid\nerDiagram\n  PROJECTS ||--o{ PROJECT_MODULES : owns\n  PROJECT_MODULES {\n    text project_id PK\n    text module_key PK\n    text module_group\n    text label\n    text description\n    text purpose_summary\n    integer enabled\n    integer is_core\n    integer sort_order\n    text settings_json\n    text created_at\n    text updated_at\n  }\n```\n\n## Merge Guidance\n\n- Merge this fragment when the module registry should support concise, persisted purpose summaries.\n- After merge, regenerate any schema outputs so `DATABASE_SCHEMA.md` and `DATABASE_SCHEMA.dbml` both reflect the new field.\n- Use the new field for compact navigation/help text, while keeping `description` available for longer explanations.\n",
        "status": "integrated",
        "fileName": "DATABASE_SCHEMA_FRAGMENT_20260331_210000000.md",
        "sourceScope": "shared",
        "merged": true,
        "mergedAt": "2026-04-02T01:35:00.212Z",
        "integratedAt": "2026-04-02T01:35:00.212Z",
        "updatedAt": "2026-04-02T01:35:00.176Z"
      }
    ]
  }
}
-->

# Database Schema: Angel's Project Manager

## 1. Schema Overview

### 1.1 Purpose

<!--
APM-ID: database-schema-overview-purpose-schema-purpose
APM-LAST-UPDATED: 2026-04-03
-->

Observed SQLite schema imported from the live Angel's Project Manager runtime database to regenerate DATABASE_SCHEMA.md and DATABASE_SCHEMA.dbml.

### 1.2 Storage Strategy

<!--
APM-ID: database-schema-overview-storage-strategy-storage-strategy
APM-LAST-UPDATED: 2026-04-03
-->

Primary dialect: sqlite. Imported from sqlite database. Confidence: observed.

_Last updated: 2026-04-03_

### 1.3 Sync Status

- Intended Version: 0
- Observed Version: 0
- Sync Status: unverified
- Drift Severity: low
- Change Source: unknown
- Pending Migration Status: comparison_required
- Recommended Action: capture_or_compare

- Action Summary: Capture an observed schema or define the intended schema to begin tracking drift.
- Drift Summary: No schema comparison has been recorded yet.

### 1.3.1 Recommended Work Items

- No schema work items are currently generated from sync drift.

### 1.3.2 Sync Audit History

- No sync audit history recorded yet.

### 1.4 Import Source

- Source Type: sqlite_database
- Source Label: C:\Users\croni\Projects\data\app.db
- Dialect: sqlite
- Confidence: observed
- Observed At: 2026-04-03T00:16:28.120Z
- Schema Fingerprint: 6472ebfcb4f9ce91151ef8d1006b39d2

## 2. Entities

### 2.1 app_settings (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `key`: Type: TEXT; Nullable: yes; Primary key; Status: observed
- `value`: Type: TEXT; Nullable: yes; Status: observed
- `is_secret`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed

### 2.2 bug_items (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed
- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed
- `code`: Type: TEXT; Nullable: no; Status: observed
- `title`: Type: TEXT; Nullable: no; Status: observed
- `summary`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `severity`: Type: TEXT; Nullable: yes; Default: 'medium'; Status: observed
- `status`: Type: TEXT; Nullable: yes; Default: 'open'; Status: observed
- `task_id`: Type: TEXT; Nullable: yes; Status: observed
- `completed`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `regressed`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `archived`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `current_behavior`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `expected_behavior`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `work_item_type`: Type: TEXT; Nullable: yes; Default: 'software_bug'; Status: observed
- `affected_module_keys`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed

### 2.3 credentials (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed
- `name`: Type: TEXT; Nullable: no; Status: observed
- `host`: Type: TEXT; Nullable: no; Status: observed
- `port`: Type: INTEGER; Nullable: yes; Default: 22; Status: observed
- `user`: Type: TEXT; Nullable: no; Status: observed
- `password`: Type: TEXT; Nullable: yes; Status: observed
- `key_path`: Type: TEXT; Nullable: yes; Status: observed

### 2.4 entity_relationships (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed
- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed
- `source_entity_type`: Type: TEXT; Nullable: no; Status: observed
- `source_entity_id`: Type: TEXT; Nullable: no; Status: observed
- `relationship_type`: Type: TEXT; Nullable: no; Status: observed
- `target_entity_type`: Type: TEXT; Nullable: no; Status: observed
- `target_entity_id`: Type: TEXT; Nullable: no; Status: observed
- `metadata_json`: Type: TEXT; Nullable: yes; Default: '{}'; Status: observed
- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed

### 2.5 feature_items (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed
- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed
- `code`: Type: TEXT; Nullable: no; Status: observed
- `title`: Type: TEXT; Nullable: no; Status: observed
- `summary`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `status`: Type: TEXT; Nullable: yes; Default: 'planned'; Status: observed
- `roadmap_phase_id`: Type: TEXT; Nullable: yes; Status: observed
- `task_id`: Type: TEXT; Nullable: yes; Status: observed
- `archived`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `work_item_type`: Type: TEXT; Nullable: yes; Default: 'software_feature'; Status: observed
- `affected_module_keys`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed

### 2.6 integration_events (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed
- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed
- `source`: Type: TEXT; Nullable: no; Status: observed
- `event_type`: Type: TEXT; Nullable: no; Status: observed
- `delivery_status`: Type: TEXT; Nullable: yes; Default: 'received'; Status: observed
- `payload`: Type: TEXT; Nullable: yes; Default: '{}'; Status: observed
- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed

### 2.7 migrations (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `id`: Type: INTEGER; Nullable: yes; Primary key; Status: observed
- `name`: Type: TEXT; Nullable: no; Unique; Status: observed
- `executed_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed

### 2.8 prd_fragments (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed
- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed
- `feature_id`: Type: TEXT; Nullable: yes; Status: observed
- `code`: Type: TEXT; Nullable: no; Status: observed
- `title`: Type: TEXT; Nullable: no; Status: observed
- `markdown`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `mermaid`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `status`: Type: TEXT; Nullable: yes; Default: 'draft'; Status: observed
- `merged`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `merged_at`: Type: TEXT; Nullable: yes; Status: observed
- `file_name`: Type: TEXT; Nullable: yes; Status: observed
- `file_path`: Type: TEXT; Nullable: yes; Status: observed
- `file_updated_at`: Type: TEXT; Nullable: yes; Status: observed
- `file_md5`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `db_md5`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `merged_file_name`: Type: TEXT; Nullable: yes; Status: observed

### 2.9 project_md_documents (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `project_id`: Type: TEXT; Nullable: no; Primary key; References: projects.id; Status: observed
- `doc_type`: Type: TEXT; Nullable: no; Primary key; Status: observed
- `markdown`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `mermaid`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `file_path`: Type: TEXT; Nullable: yes; Status: observed
- `file_updated_at`: Type: TEXT; Nullable: yes; Status: observed
- `file_md5`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `db_md5`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `editor_state`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `title`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `module_key`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `template_name`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `template_version`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `source_of_truth`: Type: TEXT; Nullable: yes; Default: 'database'; Status: observed

### 2.10 project_modules (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `project_id`: Type: TEXT; Nullable: no; Primary key; References: projects.id; Status: observed
- `module_key`: Type: TEXT; Nullable: no; Primary key; Status: observed
- `module_group`: Type: TEXT; Nullable: no; Status: observed
- `label`: Type: TEXT; Nullable: no; Status: observed
- `description`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `enabled`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `is_core`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `sort_order`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `settings_json`: Type: TEXT; Nullable: yes; Default: '{}'; Status: observed
- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `purpose_summary`: Type: TEXT; Nullable: yes; Default: ''; Status: observed

### 2.11 projects (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed
- `path`: Type: TEXT; Nullable: yes; Status: observed
- `absolute_path`: Type: TEXT; Nullable: yes; Status: observed
- `name`: Type: TEXT; Nullable: no; Status: observed
- `description`: Type: TEXT; Nullable: yes; Status: observed
- `parent_id`: Type: TEXT; Nullable: yes; Status: observed
- `server_id`: Type: TEXT; Nullable: yes; Status: observed
- `image_path`: Type: TEXT; Nullable: yes; Status: observed
- `open_in_cursor`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `category`: Type: TEXT; Nullable: yes; Status: observed
- `tags`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed
- `links`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed
- `date_added`: Type: TEXT; Nullable: yes; Status: observed
- `type`: Type: TEXT; Nullable: yes; Default: 'folder'; Status: observed
- `open_in_cursor_admin`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `url`: Type: TEXT; Nullable: yes; Status: observed
- `pinned`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `image_url`: Type: TEXT; Nullable: yes; Status: observed
- `upload_mappings`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed
- `mapping_groups`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed
- `primary_action`: Type: TEXT; Nullable: yes; Default: 'auto'; Status: observed
- `integrations`: Type: TEXT; Nullable: yes; Default: '{}'; Status: observed
- `workspace_plugins`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed
- `project_type`: Type: TEXT; Nullable: yes; Default: 'general'; Status: observed

### 2.12 roadmap_fragments (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed
- `project_id`: Type: TEXT; Nullable: no; Status: observed
- `source_feature_id`: Type: TEXT; Nullable: yes; Status: observed
- `source_phase_id`: Type: TEXT; Nullable: yes; Status: observed
- `code`: Type: TEXT; Nullable: no; Status: observed
- `title`: Type: TEXT; Nullable: no; Status: observed
- `markdown`: Type: TEXT; Nullable: no; Default: ''; Status: observed
- `mermaid`: Type: TEXT; Nullable: no; Default: ''; Status: observed
- `payload_json`: Type: TEXT; Nullable: no; Default: ''; Status: observed
- `status`: Type: TEXT; Nullable: no; Default: 'draft'; Status: observed
- `merged`: Type: INTEGER; Nullable: no; Default: 0; Status: observed
- `merged_at`: Type: TEXT; Nullable: yes; Status: observed
- `integrated_at`: Type: TEXT; Nullable: yes; Status: observed
- `file_name`: Type: TEXT; Nullable: yes; Status: observed
- `file_path`: Type: TEXT; Nullable: yes; Status: observed
- `file_updated_at`: Type: TEXT; Nullable: yes; Status: observed
- `file_md5`: Type: TEXT; Nullable: no; Default: ''; Status: observed
- `db_md5`: Type: TEXT; Nullable: no; Default: ''; Status: observed
- `created_at`: Type: TEXT; Nullable: no; Status: observed
- `updated_at`: Type: TEXT; Nullable: no; Status: observed

### 2.13 roadmap_phases (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed
- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed
- `code`: Type: TEXT; Nullable: no; Status: observed
- `name`: Type: TEXT; Nullable: no; Status: observed
- `summary`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `goal`: Type: TEXT; Nullable: yes; Default: ''; Status: observed
- `status`: Type: TEXT; Nullable: yes; Default: 'planned'; Status: observed
- `target_date`: Type: TEXT; Nullable: yes; Status: observed
- `sort_order`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `after_phase_id`: Type: TEXT; Nullable: yes; Status: observed
- `archived`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed

### 2.14 tasks (table)

No entity notes captured yet.

- Status: observed

#### Fields

- `id`: Type: TEXT; Nullable: yes; Primary key; Status: observed
- `project_id`: Type: TEXT; Nullable: no; References: projects.id; Status: observed
- `title`: Type: TEXT; Nullable: no; Status: observed
- `description`: Type: TEXT; Nullable: yes; Status: observed
- `status`: Type: TEXT; Nullable: yes; Default: 'todo'; Status: observed
- `priority`: Type: TEXT; Nullable: yes; Default: 'medium'; Status: observed
- `created_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `updated_at`: Type: TEXT; Nullable: yes; Default: CURRENT_TIMESTAMP; Status: observed
- `due_date`: Type: TEXT; Nullable: yes; Status: observed
- `assigned_to`: Type: TEXT; Nullable: yes; Status: observed
- `start_date`: Type: TEXT; Nullable: yes; Status: observed
- `end_date`: Type: TEXT; Nullable: yes; Status: observed
- `dependency_ids`: Type: TEXT; Nullable: yes; Default: '[]'; Status: observed
- `progress`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `milestone`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `sort_order`: Type: INTEGER; Nullable: yes; Default: 0; Status: observed
- `roadmap_phase_id`: Type: TEXT; Nullable: yes; Status: observed
- `planning_bucket`: Type: TEXT; Nullable: yes; Default: 'considered'; Status: observed
- `item_type`: Type: TEXT; Nullable: yes; Default: 'task'; Status: observed
- `category`: Type: TEXT; Nullable: yes; Status: observed
- `work_item_type`: Type: TEXT; Nullable: yes; Default: 'core_task'; Status: observed

## 3. Relationships

### 3.1 bug_items:project_id:projects:id:0
- From: bug_items.project_id
- To: projects.id
- Cardinality: many-to-one
- Status: observed
### 3.2 entity_relationships:project_id:projects:id:0
- From: entity_relationships.project_id
- To: projects.id
- Cardinality: many-to-one
- Status: observed
### 3.3 feature_items:project_id:projects:id:0
- From: feature_items.project_id
- To: projects.id
- Cardinality: many-to-one
- Status: observed
### 3.4 integration_events:project_id:projects:id:0
- From: integration_events.project_id
- To: projects.id
- Cardinality: many-to-one
- Status: observed
### 3.5 prd_fragments:project_id:projects:id:0
- From: prd_fragments.project_id
- To: projects.id
- Cardinality: many-to-one
- Status: observed
### 3.6 project_md_documents:project_id:projects:id:0
- From: project_md_documents.project_id
- To: projects.id
- Cardinality: many-to-one
- Status: observed
### 3.7 project_modules:project_id:projects:id:0
- From: project_modules.project_id
- To: projects.id
- Cardinality: many-to-one
- Status: observed
### 3.8 roadmap_phases:project_id:projects:id:0
- From: roadmap_phases.project_id
- To: projects.id
- Cardinality: many-to-one
- Status: observed
### 3.9 tasks:project_id:projects:id:0
- From: tasks.project_id
- To: projects.id
- Cardinality: many-to-one
- Status: observed
## 4. Constraints

### 4.1 sqlite_autoindex_migrations_1
- Entity: migrations
- Type: unique
- Definition: UNIQUE (name)
- Status: observed
## 5. Indexes

### 5.1 sqlite_autoindex_app_settings_1
- Entity: app_settings
- Fields: key
- Unique: yes
- Status: observed
- Notes: Primary key backing index.
### 5.2 idx_bug_items_project_archived
- Entity: bug_items
- Fields: project_id, archived, updated_at
- Unique: no
- Status: observed
### 5.3 sqlite_autoindex_bug_items_1
- Entity: bug_items
- Fields: id
- Unique: yes
- Status: observed
- Notes: Primary key backing index.
### 5.4 sqlite_autoindex_credentials_1
- Entity: credentials
- Fields: id
- Unique: yes
- Status: observed
- Notes: Primary key backing index.
### 5.5 idx_entity_relationships_project_target
- Entity: entity_relationships
- Fields: project_id, target_entity_type, target_entity_id
- Unique: no
- Status: observed
### 5.6 idx_entity_relationships_project_source
- Entity: entity_relationships
- Fields: project_id, source_entity_type, source_entity_id
- Unique: no
- Status: observed
### 5.7 sqlite_autoindex_entity_relationships_1
- Entity: entity_relationships
- Fields: id
- Unique: yes
- Status: observed
- Notes: Primary key backing index.
### 5.8 idx_feature_items_project_archived
- Entity: feature_items
- Fields: project_id, archived, updated_at
- Unique: no
- Status: observed
### 5.9 sqlite_autoindex_feature_items_1
- Entity: feature_items
- Fields: id
- Unique: yes
- Status: observed
- Notes: Primary key backing index.
### 5.10 idx_integration_events_source
- Entity: integration_events
- Fields: source
- Unique: no
- Status: observed
### 5.11 idx_integration_events_project_created
- Entity: integration_events
- Fields: project_id, created_at
- Unique: no
- Status: observed
### 5.12 sqlite_autoindex_integration_events_1
- Entity: integration_events
- Fields: id
- Unique: yes
- Status: observed
- Notes: Primary key backing index.
### 5.13 sqlite_autoindex_migrations_1
- Entity: migrations
- Fields: name
- Unique: yes
- Status: observed
- Notes: Unique constraint backing index.
### 5.14 idx_prd_fragments_project_merged
- Entity: prd_fragments
- Fields: project_id, merged, updated_at
- Unique: no
- Status: observed
### 5.15 idx_prd_fragments_project_feature
- Entity: prd_fragments
- Fields: project_id, feature_id
- Unique: yes
- Status: observed
### 5.16 sqlite_autoindex_prd_fragments_1
- Entity: prd_fragments
- Fields: id
- Unique: yes
- Status: observed
- Notes: Primary key backing index.
### 5.17 sqlite_autoindex_project_md_documents_1
- Entity: project_md_documents
- Fields: project_id, doc_type
- Unique: yes
- Status: observed
- Notes: Primary key backing index.
### 5.18 idx_project_modules_project_group
- Entity: project_modules
- Fields: project_id, module_group, sort_order
- Unique: no
- Status: observed
### 5.19 sqlite_autoindex_project_modules_1
- Entity: project_modules
- Fields: project_id, module_key
- Unique: yes
- Status: observed
- Notes: Primary key backing index.
### 5.20 idx_projects_pinned
- Entity: projects
- Fields: pinned
- Unique: no
- Status: observed
### 5.21 idx_projects_category
- Entity: projects
- Fields: category
- Unique: no
- Status: observed
### 5.22 sqlite_autoindex_projects_1
- Entity: projects
- Fields: id
- Unique: yes
- Status: observed
- Notes: Primary key backing index.
### 5.23 idx_roadmap_fragments_project_status
- Entity: roadmap_fragments
- Fields: project_id, merged, updated_at
- Unique: no
- Status: observed
### 5.24 idx_roadmap_fragments_project_feature
- Entity: roadmap_fragments
- Fields: project_id, source_feature_id
- Unique: yes
- Status: observed
### 5.25 sqlite_autoindex_roadmap_fragments_1
- Entity: roadmap_fragments
- Fields: id
- Unique: yes
- Status: observed
- Notes: Primary key backing index.
### 5.26 idx_roadmap_phases_after
- Entity: roadmap_phases
- Fields: project_id, after_phase_id
- Unique: no
- Status: observed
### 5.27 idx_roadmap_phases_project_archive
- Entity: roadmap_phases
- Fields: project_id, archived, sort_order
- Unique: no
- Status: observed
### 5.28 idx_roadmap_phases_project_sort
- Entity: roadmap_phases
- Fields: project_id, sort_order
- Unique: no
- Status: observed
### 5.29 sqlite_autoindex_roadmap_phases_1
- Entity: roadmap_phases
- Fields: id
- Unique: yes
- Status: observed
- Notes: Primary key backing index.
### 5.30 idx_tasks_project_work_item_type
- Entity: tasks
- Fields: project_id, work_item_type, updated_at
- Unique: no
- Status: observed
### 5.31 idx_tasks_project_category
- Entity: tasks
- Fields: project_id, category
- Unique: no
- Status: observed
### 5.32 idx_tasks_project_type
- Entity: tasks
- Fields: project_id, item_type, updated_at
- Unique: no
- Status: observed
### 5.33 idx_tasks_project_bucket
- Entity: tasks
- Fields: project_id, planning_bucket, updated_at
- Unique: no
- Status: observed
### 5.34 idx_tasks_project_phase
- Entity: tasks
- Fields: project_id, roadmap_phase_id, sort_order
- Unique: no
- Status: observed
### 5.35 idx_tasks_sort_order
- Entity: tasks
- Fields: project_id, sort_order
- Unique: no
- Status: observed
### 5.36 idx_tasks_status
- Entity: tasks
- Fields: status
- Unique: no
- Status: observed
### 5.37 idx_tasks_project_id
- Entity: tasks
- Fields: project_id
- Unique: no
- Status: observed
### 5.38 sqlite_autoindex_tasks_1
- Entity: tasks
- Fields: id
- Unique: yes
- Status: observed
- Notes: Primary key backing index.
## 6. Migration Notes

<!--
APM-ID: database-schema-migrations-live-runtime-schema-capture
APM-LAST-UPDATED: 2026-04-03
-->

### 6.1 Live runtime schema capture

This fragment was generated directly from the active runtime SQLite database for Angel's Project Manager.
Status: observed

- Version Date: 2026-04-03

## 7. Open Questions

No open questions captured yet.
## 8. Source-of-Truth and Sync Rules

<!--
APM-ID: database-schema-synchronization-rules-database-first-schema-model
APM-LAST-UPDATED: 2026-04-03
-->

### 8.1 Database-first schema model

The manager database becomes the source of truth after this fragment is merged or imported.

- Version Date: 2026-04-03

<!--
APM-ID: database-schema-synchronization-rules-generated-artifacts
APM-LAST-UPDATED: 2026-04-03
-->

### 8.2 Generated artifacts

Regenerate DATABASE_SCHEMA.md and DATABASE_SCHEMA.dbml from the stored schema model when files are missing or stale.

- Version Date: 2026-04-03

<!--
APM-ID: database-schema-synchronization-rules-imported-fragment-provenance
APM-LAST-UPDATED: 2026-04-03
-->

### 8.3 Imported fragment provenance

Imported from C:\Users\croni\Projects\data\app.db (sqlite_database).

- Version Date: 2026-04-03

## Mermaid

```mermaid
erDiagram
  APP_SETTINGS {
    TEXT key PK
    TEXT value
    INTEGER is_secret
    TEXT updated_at
  }
  BUG_ITEMS {
    TEXT id PK
    TEXT project_id
    TEXT code
    TEXT title
    TEXT summary
    TEXT severity
    TEXT status
    TEXT task_id
    INTEGER completed
    INTEGER regressed
    INTEGER archived
    TEXT created_at
    TEXT updated_at
    TEXT current_behavior
    TEXT expected_behavior
    TEXT work_item_type
    TEXT affected_module_keys
  }
  CREDENTIALS {
    TEXT id PK
    TEXT name
    TEXT host
    INTEGER port
    TEXT user
    TEXT password
    TEXT key_path
  }
  ENTITY_RELATIONSHIPS {
    TEXT id PK
    TEXT project_id
    TEXT source_entity_type
    TEXT source_entity_id
    TEXT relationship_type
    TEXT target_entity_type
    TEXT target_entity_id
    TEXT metadata_json
    TEXT created_at
    TEXT updated_at
  }
  FEATURE_ITEMS {
    TEXT id PK
    TEXT project_id
    TEXT code
    TEXT title
    TEXT summary
    TEXT status
    TEXT roadmap_phase_id
    TEXT task_id
    INTEGER archived
    TEXT created_at
    TEXT updated_at
    TEXT work_item_type
    TEXT affected_module_keys
  }
  INTEGRATION_EVENTS {
    TEXT id PK
    TEXT project_id
    TEXT source
    TEXT event_type
    TEXT delivery_status
    TEXT payload
    TEXT created_at
  }
  MIGRATIONS {
    INTEGER id PK
    TEXT name
    TEXT executed_at
  }
  PRD_FRAGMENTS {
    TEXT id PK
    TEXT project_id
    TEXT feature_id
    TEXT code
    TEXT title
    TEXT markdown
    TEXT mermaid
    TEXT status
    INTEGER merged
    TEXT merged_at
    TEXT file_name
    TEXT file_path
    TEXT file_updated_at
    TEXT file_md5
    TEXT db_md5
    TEXT created_at
    TEXT updated_at
    TEXT merged_file_name
  }
  PROJECT_MD_DOCUMENTS {
    TEXT project_id PK
    TEXT doc_type PK
    TEXT markdown
    TEXT mermaid
    TEXT updated_at
    TEXT file_path
    TEXT file_updated_at
    TEXT file_md5
    TEXT db_md5
    TEXT editor_state
    TEXT title
    TEXT module_key
    TEXT template_name
    TEXT template_version
    TEXT source_of_truth
  }
  PROJECT_MODULES {
    TEXT project_id PK
    TEXT module_key PK
    TEXT module_group
    TEXT label
    TEXT description
    INTEGER enabled
    INTEGER is_core
    INTEGER sort_order
    TEXT settings_json
    TEXT created_at
    TEXT updated_at
    TEXT purpose_summary
  }
  PROJECTS {
    TEXT id PK
    TEXT path
    TEXT absolute_path
    TEXT name
    TEXT description
    TEXT parent_id
    TEXT server_id
    TEXT image_path
    INTEGER open_in_cursor
    TEXT category
    TEXT tags
    TEXT links
    TEXT date_added
    TEXT type
    INTEGER open_in_cursor_admin
    TEXT url
    INTEGER pinned
    TEXT image_url
    TEXT upload_mappings
    TEXT mapping_groups
    TEXT primary_action
    TEXT integrations
    TEXT workspace_plugins
    TEXT project_type
  }
  ROADMAP_FRAGMENTS {
    TEXT id PK
    TEXT project_id
    TEXT source_feature_id
    TEXT source_phase_id
    TEXT code
    TEXT title
    TEXT markdown
    TEXT mermaid
    TEXT payload_json
    TEXT status
    INTEGER merged
    TEXT merged_at
    TEXT integrated_at
    TEXT file_name
    TEXT file_path
    TEXT file_updated_at
    TEXT file_md5
    TEXT db_md5
    TEXT created_at
    TEXT updated_at
  }
  ROADMAP_PHASES {
    TEXT id PK
    TEXT project_id
    TEXT code
    TEXT name
    TEXT summary
    TEXT goal
    TEXT status
    TEXT target_date
    INTEGER sort_order
    TEXT created_at
    TEXT updated_at
    TEXT after_phase_id
    INTEGER archived
  }
  TASKS {
    TEXT id PK
    TEXT project_id
    TEXT title
    TEXT description
    TEXT status
    TEXT priority
    TEXT created_at
    TEXT updated_at
    TEXT due_date
    TEXT assigned_to
    TEXT start_date
    TEXT end_date
    TEXT dependency_ids
    INTEGER progress
    INTEGER milestone
    INTEGER sort_order
    TEXT roadmap_phase_id
    TEXT planning_bucket
    TEXT item_type
    TEXT category
    TEXT work_item_type
  }
  PROJECTS ||--o{ BUG_ITEMS : "project_id"
  PROJECTS ||--o{ ENTITY_RELATIONSHIPS : "project_id"
  PROJECTS ||--o{ FEATURE_ITEMS : "project_id"
  PROJECTS ||--o{ INTEGRATION_EVENTS : "project_id"
  PROJECTS ||--o{ PRD_FRAGMENTS : "project_id"
  PROJECTS ||--o{ PROJECT_MD_DOCUMENTS : "project_id"
  PROJECTS ||--o{ PROJECT_MODULES : "project_id"
  PROJECTS ||--o{ ROADMAP_PHASES : "project_id"
  PROJECTS ||--o{ TASKS : "project_id"
```
