/**
 * pi ABAP FS Extension
 *
 * Provides ABAP remote filesystem capabilities via the ADT (ABAP Development
 * Tools) protocol, using the `abap-adt-api` package.
 *
 * Tools:
 *   - abap_setup: Configure an SAP connection profile
 *   - abap_status: Show connection status and profiles
 *   - abap_profile: List, switch or delete profiles
 *   - abap_test_connection: Verify a profile can log on
 *   - abap_search: Search objects by name pattern
 *   - abap_object_structure: Object metadata and includes
 *   - abap_read: Read object source code
 *   - abap_lock / abap_unlock: Lock management
 *   - abap_write: Write source code (lock + write + unlock)
 *   - abap_activate: Activate an object
 *   - abap_syntax_check: Syntax check source
 *   - abap_unit_test: Run ABAP unit tests
 *   - abap_query: Run ABAP SQL
 *   - abap_table: Preview table contents
 *   - abap_where_used: Where-used list
 *   - abap_object_types: List searchable object types
 *   - abap_node_contents: Browse package object tree
 *   - abap_transports: List user transports
 *
 * Data-oriented design:
 *   - All domain data is represented as plain immutable interfaces (types.ts)
 *   - I/O is isolated in the client module (client.ts)
 *   - Pure formatting functions convert data to display strings (formatting/)
 *   - Each tool is a single-responsibility module (tools/)
 *   - Configuration is managed as mutable state with file persistence (config.ts)
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { loadConfig } from "./src/config.ts";
import { AbapSetupTool } from "./src/tools/abap-setup.ts";
import { AbapStatusTool } from "./src/tools/abap-status.ts";
import { AbapProfileTool } from "./src/tools/abap-profile.ts";
import { AbapTestConnectionTool } from "./src/tools/abap-test-connection.ts";
import { AbapSearchTool } from "./src/tools/abap-search.ts";
import { AbapObjectStructureTool } from "./src/tools/abap-object-structure.ts";
import { AbapReadTool } from "./src/tools/abap-read.ts";
import { AbapLockTool } from "./src/tools/abap-lock.ts";
import { AbapUnlockTool } from "./src/tools/abap-unlock.ts";
import { AbapWriteTool } from "./src/tools/abap-write.ts";
import { AbapActivateTool } from "./src/tools/abap-activate.ts";
import { AbapSyntaxCheckTool } from "./src/tools/abap-syntax-check.ts";
import { AbapUnitTestTool } from "./src/tools/abap-unit-test.ts";
import { AbapQueryTool } from "./src/tools/abap-query.ts";
import { AbapTableTool } from "./src/tools/abap-table.ts";
import { AbapWhereUsedTool } from "./src/tools/abap-where-used.ts";
import { AbapObjectTypesTool } from "./src/tools/abap-object-types.ts";
import { AbapNodeContentsTool } from "./src/tools/abap-node-contents.ts";
import { AbapTransportsTool } from "./src/tools/abap-transports.ts";

export default function (pi: ExtensionAPI) {
  // Load saved config on startup.
  loadConfig();

  // Register all tools.
  pi.registerTool(AbapSetupTool);
  pi.registerTool(AbapStatusTool);
  pi.registerTool(AbapProfileTool);
  pi.registerTool(AbapTestConnectionTool);
  pi.registerTool(AbapSearchTool);
  pi.registerTool(AbapObjectStructureTool);
  pi.registerTool(AbapReadTool);
  pi.registerTool(AbapLockTool);
  pi.registerTool(AbapUnlockTool);
  pi.registerTool(AbapWriteTool);
  pi.registerTool(AbapActivateTool);
  pi.registerTool(AbapSyntaxCheckTool);
  pi.registerTool(AbapUnitTestTool);
  pi.registerTool(AbapQueryTool);
  pi.registerTool(AbapTableTool);
  pi.registerTool(AbapWhereUsedTool);
  pi.registerTool(AbapObjectTypesTool);
  pi.registerTool(AbapNodeContentsTool);
  pi.registerTool(AbapTransportsTool);
}
