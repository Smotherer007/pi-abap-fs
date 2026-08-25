/**
 * abap_unit_test tool — Run ABAP unit tests for a class.
 */

import { Type } from "typebox";
import { resolveObject, withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatUnitTests } from "../formatting/formatters.ts";

export const AbapUnitTestTool = {
  name: "abap_unit_test",
  label: "Run ABAP Unit Tests",
  description:
    "Run ABAP unit tests for a class (or program). Provide the object name or URL. By default only short, harmless tests run; enable dangerous/critical or medium/long durations as needed.",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    name: Type.Optional(
      Type.String({ description: "Class name, e.g. 'ZCL_MY_CLASS'" }),
    ),
    objectUrl: Type.Optional(
      Type.String({
        description:
          "Object URL, e.g. '/sap/bc/adt/oo/classes/zcl_my_class'. Takes precedence over name.",
      }),
    ),
    type: Type.Optional(
      Type.String({ description: "Optional type hint for search, e.g. 'CLAS/OC'." }),
    ),
    dangerous: Type.Optional(
      Type.Boolean({ description: "Include dangerous tests (default false)." }),
    ),
    critical: Type.Optional(
      Type.Boolean({ description: "Include critical tests (default false)." }),
    ),
    medium: Type.Optional(
      Type.Boolean({ description: "Include medium-duration tests (default false)." }),
    ),
    long: Type.Optional(
      Type.Boolean({ description: "Include long-duration tests (default false)." }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: {
      profile?: string;
      name?: string;
      objectUrl?: string;
      type?: string;
      dangerous?: boolean;
      critical?: boolean;
      medium?: boolean;
      long?: boolean;
    },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const { resolved, classes } = await withClient(config, async (client) => {
      const resolved = await resolveObject(client, params);
      const classes = await client.unitTestRun(resolved.objectUrl, {
        harmless: true,
        dangerous: params.dangerous ?? false,
        critical: params.critical ?? false,
        short: true,
        medium: params.medium ?? false,
        long: params.long ?? false,
      });
      return { resolved, classes };
    });

    return {
      content: [
        { type: "text" as const, text: formatUnitTests(classes) },
      ],
      details: {
        name: resolved.name,
        testClasses: classes,
      },
    };
  },
};
