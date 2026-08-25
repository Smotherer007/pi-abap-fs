/**
 * abap_query tool — Run an ABAP SQL (freestyle) query on the connected system.
 */

import { Type } from "typebox";
import { withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatQueryResult } from "../formatting/formatters.ts";

export const AbapQueryTool = {
  name: "abap_query",
  label: "Run ABAP SQL Query",
  description:
    "Run an ABAP SQL SELECT query on the connected SAP system (freestyle data preview). Returns rows as text. Example: SELECT * FROM sflight UP TO 10 ROWS. Use with care on production systems.",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    sql: Type.String({
      description:
        "ABAP SQL SELECT statement, e.g. 'SELECT carrid, connid, fldate FROM sflight UP TO 20 ROWS'.",
    }),
    rowNumber: Type.Optional(
      Type.Number({ description: "Maximum rows to return (default 100)." }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: { profile?: string; sql: string; rowNumber?: number },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const result = await withClient(config, (client) =>
      client.runQuery(params.sql, params.rowNumber ?? 100),
    );

    return {
      content: [
        { type: "text" as const, text: formatQueryResult(result) },
      ],
      details: {
        rowCount: result.values.length,
        columns: result.columns.map((c) => c.name),
      },
    };
  },
};
