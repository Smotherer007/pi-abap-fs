/**
 * Smoke test — verifies all 19 tools have the correct shape.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AbapSetupTool } from "../src/tools/abap-setup.ts";
import { AbapStatusTool } from "../src/tools/abap-status.ts";
import { AbapProfileTool } from "../src/tools/abap-profile.ts";
import { AbapTestConnectionTool } from "../src/tools/abap-test-connection.ts";
import { AbapSearchTool } from "../src/tools/abap-search.ts";
import { AbapObjectStructureTool } from "../src/tools/abap-object-structure.ts";
import { AbapReadTool } from "../src/tools/abap-read.ts";
import { AbapLockTool } from "../src/tools/abap-lock.ts";
import { AbapUnlockTool } from "../src/tools/abap-unlock.ts";
import { AbapWriteTool } from "../src/tools/abap-write.ts";
import { AbapActivateTool } from "../src/tools/abap-activate.ts";
import { AbapSyntaxCheckTool } from "../src/tools/abap-syntax-check.ts";
import { AbapUnitTestTool } from "../src/tools/abap-unit-test.ts";
import { AbapQueryTool } from "../src/tools/abap-query.ts";
import { AbapTableTool } from "../src/tools/abap-table.ts";
import { AbapWhereUsedTool } from "../src/tools/abap-where-used.ts";
import { AbapObjectTypesTool } from "../src/tools/abap-object-types.ts";
import { AbapNodeContentsTool } from "../src/tools/abap-node-contents.ts";
import { AbapTransportsTool } from "../src/tools/abap-transports.ts";
import { AbapAtcTool } from "../src/tools/abap-atc.ts";
import { AbapDumpsTool } from "../src/tools/abap-dumps.ts";
import { AbapTracesTool } from "../src/tools/abap-traces.ts";
import { AbapTraceHitListTool } from "../src/tools/abap-trace-hitlist.ts";
import { AbapTransportDetailsTool } from "../src/tools/abap-transport-details.ts";
import { AbapTextElementsTool } from "../src/tools/abap-text-elements.ts";
import { AbapSetTextElementsTool } from "../src/tools/abap-set-text-elements.ts";
import { AbapCreateObjectTool } from "../src/tools/abap-create-object.ts";

const allTools = [
  AbapSetupTool,
  AbapStatusTool,
  AbapProfileTool,
  AbapTestConnectionTool,
  AbapSearchTool,
  AbapObjectStructureTool,
  AbapReadTool,
  AbapLockTool,
  AbapUnlockTool,
  AbapWriteTool,
  AbapActivateTool,
  AbapSyntaxCheckTool,
  AbapUnitTestTool,
  AbapQueryTool,
  AbapTableTool,
  AbapWhereUsedTool,
  AbapObjectTypesTool,
  AbapNodeContentsTool,
  AbapTransportsTool,
  AbapAtcTool,
  AbapDumpsTool,
  AbapTracesTool,
  AbapTraceHitListTool,
  AbapTransportDetailsTool,
  AbapTextElementsTool,
  AbapSetTextElementsTool,
  AbapCreateObjectTool,
];

describe("Tool structure smoke test", () => {
  it("has exactly 27 tools", () => {
    assert.strictEqual(allTools.length, 27);
  });

  for (const tool of allTools) {
    it(`${tool.name} has required fields`, () => {
      assert.ok(tool.name);
      assert.strictEqual(typeof tool.name, "string");
      assert.ok(tool.label);
      assert.strictEqual(typeof tool.label, "string");
      assert.ok(tool.description);
      assert.strictEqual(typeof tool.description, "string");
      assert.ok(tool.parameters !== undefined);
      assert.strictEqual(typeof tool.execute, "function");
    });
  }

  it("all tool names are unique", () => {
    const names = allTools.map((t) => t.name);
    assert.strictEqual(new Set(names).size, names.length);
  });

  it("all tool names follow abap_ prefix convention", () => {
    for (const tool of allTools) {
      assert.ok(/^abap_/.test(tool.name));
    }
  });
});
