import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  formatSearchResults,
  formatQueryResult,
  formatUnitTests,
  formatSyntaxCheck,
  formatProfileStatus,
  formatActivation,
  formatObjectStructure,
} from "../src/formatting/formatters.ts";
import type { AbapProfile } from "../src/types.ts";

describe("formatSearchResults", () => {
  it("handles empty results", () => {
    assert.match(formatSearchResults([], "ZCL_X"), /No objects found/);
  });

  it("lists name, type and package", () => {
    const text = formatSearchResults(
      [
        {
          "adtcore:name": "ZCL_MY_CLASS",
          "adtcore:type": "CLAS/OC",
          "adtcore:uri": "/sap/bc/adt/oo/classes/zcl_my_class",
          "adtcore:packageName": "Z_MY_PACKAGE",
          "adtcore:description": "My class",
        },
      ],
      "ZCL_MY_CLASS",
    );
    assert.match(text, /ZCL_MY_CLASS/);
    assert.match(text, /CLAS\/OC/);
    assert.match(text, /Z_MY_PACKAGE/);
  });
});

describe("formatQueryResult", () => {
  it("reports no rows", () => {
    assert.match(
      formatQueryResult({ columns: [], values: [] }),
      /no rows/i,
    );
  });

  it("renders a table with a header", () => {
    const text = formatQueryResult({
      columns: [
        { name: "CARRID", type: "C" as never, description: "", keyAttribute: false, colType: "", isKeyFigure: false, length: 3 },
        { name: "CONNID", type: "N" as never, description: "", keyAttribute: false, colType: "", isKeyFigure: false, length: 4 },
      ],
      values: [
        { CARRID: "LH", CONNID: 400 },
        { CARRID: "AA", CONNID: 17 },
      ],
    });
    assert.match(text, /CARRID/);
    assert.match(text, /CONNID/);
    assert.match(text, /LH/);
    assert.match(text, /2 row\(s\)/);
  });
});

describe("formatUnitTests", () => {
  it("reports no test classes", () => {
    assert.match(formatUnitTests([]), /No test classes/);
  });

  it("lists passed and failed methods", () => {
    const text = formatUnitTests([
      {
        "adtcore:name": "LTCL_TEST",
        "adtcore:type": "CLAS/OC",
        "adtcore:uri": "/sap/bc/adt/oo/classes/ltcl_test",
        uriType: "semantic",
        durationCategory: "short",
        riskLevel: "harmless",
        alerts: [],
        testmethods: [
          {
            "adtcore:name": "test_ok",
            "adtcore:type": "CLAS/OM",
            "adtcore:uri": "/sap/bc/adt/oo/classes/ltcl_test#type=method;name=test_ok",
            executionTime: 1,
            uriType: "semantic",
            unit: "LTCL_TEST",
            alerts: [],
          },
          {
            "adtcore:name": "test_fail",
            "adtcore:type": "CLAS/OM",
            "adtcore:uri": "/sap/bc/adt/oo/classes/ltcl_test#type=method;name=test_fail",
            executionTime: 2,
            uriType: "semantic",
            unit: "LTCL_TEST",
            alerts: [
              {
                kind: "failedAssertion" as never,
                severity: "critical" as never,
                details: ["Expected 1 but got 2"],
                stack: [],
                title: "Assertion failed",
              },
            ],
          },
        ],
      },
    ]);
    assert.match(text, /test_ok/);
    assert.match(text, /test_fail/);
    assert.match(text, /FAILED/);
    assert.match(text, /1 failure/);
  });
});

describe("formatSyntaxCheck", () => {
  it("reports no errors", () => {
    assert.match(formatSyntaxCheck([]), /No syntax errors/);
  });

  it("lists severity, line and text", () => {
    const text = formatSyntaxCheck([
      { uri: "/sap/bc/adt/x#start=4,2", line: 4, offset: 2, severity: "E", text: "Field not defined" },
    ]);
    assert.match(text, /line 4/);
    assert.match(text, /Field not defined/);
  });
});

describe("formatProfileStatus", () => {
  it("reports no configuration", () => {
    assert.match(formatProfileStatus({}, null), /No SAP connection/);
  });

  it("marks the active profile and hides passwords", () => {
    const profiles: Record<string, AbapProfile> = {
      dev: { url: "http://sap.local:8000", username: "DEV", password: "secret" },
    };
    const text = formatProfileStatus(profiles, "dev");
    assert.match(text, /\[active\] dev/);
    assert.match(text, /DEV@http:\/\/sap.local:8000/);
    assert.doesNotMatch(text, /secret/);
  });
});

describe("formatActivation", () => {
  it("reports success", () => {
    assert.match(
      formatActivation({ success: true, messages: [], inactive: [] }),
      /successful/,
    );
  });

  it("lists failure messages", () => {
    const text = formatActivation({
      success: false,
      messages: [{ objDescr: "ZCL_X", type: "E", line: 10, href: "", forceSupported: false, shortText: "boom" }],
      inactive: [],
    });
    assert.match(text, /failed/);
    assert.match(text, /boom/);
  });
});

describe("formatObjectStructure", () => {
  it("includes name and type", () => {
    const text = formatObjectStructure({
      objectUrl: "/sap/bc/adt/oo/classes/zcl_x",
      metaData: {
        "adtcore:name": "ZCL_X",
        "adtcore:type": "CLAS/OC",
        "adtcore:changedAt": 0,
        "adtcore:changedBy": "",
        "adtcore:createdAt": 0,
        "adtcore:language": "EN",
        "adtcore:responsible": "DEVELOPER",
        "adtcore:version": "active",
      },
      links: [],
    });
    assert.match(text, /ZCL_X/);
    assert.match(text, /CLAS\/OC/);
  });
});
