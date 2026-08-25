/**
 * abap_table tool — Preview the contents of a DDIC table / view.
 */

import { Type } from "typebox";
import { withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatQueryResult } from "../formatting/formatters.ts";

export const AbapTableTool = {
  name: "abap_table",
  label: "Preview ABAP Table",
  description:
    "Preview the contents of a DDIC table or view. Returns the first N rows. Optionally provide a WHERE-style filter via the sqlQuery parameter (empty string returns all rows up to rowNumber).",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    table: Type.String({
      description: "DDIC table or view name, e.g. 'SFLIGHT' or 'MARA'.",
    }),
    rowNumber: Type.Optional(
      Type.Number({ description: "Maximum rows to return (default 100)." }),
    ),
    filter: Type.Optional(
      Type.String({
        description:
          "Optional SQL WHERE condition (without the WHERE keyword), e.g. \"CARRID = 'LH'\".",
      }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: {
      profile?: string;
      table: string;
      rowNumber?: number;
      filter?: string;
    },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const filterSql = params.filter ? `WHERE ${params.filter}` : "";
    const result = await withClient(config, (client) =>
      client.tableContents(
        params.table,
        params.rowNumber ?? 100,
        true,
        filterSql,
      ),
    );

    return {
      content: [
        { type: "text" as const, text: formatQueryResult(result) },
      ],
      details: {
        table: params.table.toUpperCase(),
        rowCount: result.values.length,
        columns: result.columns.map((c) => c.name),
      },
    };
  },
};
