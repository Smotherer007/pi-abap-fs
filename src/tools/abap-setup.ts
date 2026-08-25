/**
 * abap_setup tool — Configure an SAP connection profile.
 *
 * Stores a named profile (ADT base URL + credentials). A profile is
 * automatically set as active if it's the first one. Credentials are stored
 * in ~/.pi/abap-config.json, readable only by the owner.
 */

import { Type } from "typebox";
import { saveProfile } from "../config.ts";
import type { AbapProfile } from "../types.ts";

export interface SetupParams {
  name: string;
  url: string;
  username: string;
  password: string;
  client?: string;
  language?: string;
  allowUnauthorized?: boolean;
}

export const AbapSetupTool = {
  name: "abap_setup",
  label: "ABAP Setup",
  description:
    "Configure an SAP system connection profile (ADT protocol). Call this first before using any other ABAP tools. Credentials are stored in ~/.pi/abap-config.json (readable only by you). The SAP system must have ADT (ABAP Development Tools) enabled.",
  parameters: Type.Object({
    name: Type.String({
      description:
        "Profile name, e.g. 'dev', 'prod'. Use a short, memorable name.",
    }),
    url: Type.String({
      description:
        "ADT base URL, e.g. http://vhcalnplci.bti.local:8000 or https://sap.example.com:44300",
    }),
    username: Type.String({
      description: "SAP logon user (e.g. DEVELOPER)",
    }),
    password: Type.String({
      description: "SAP password",
    }),
    client: Type.Optional(
      Type.String({ description: "SAP client / mandant, e.g. '001'" }),
    ),
    language: Type.Optional(
      Type.String({ description: "Logon language key, e.g. 'EN'" }),
    ),
    allowUnauthorized: Type.Optional(
      Type.Boolean({
        description:
          "Accept self-signed TLS certificates. Defaults to false. Set to true only for on-premise dev systems without a valid certificate.",
      }),
    ),
  }),

  async execute(_toolCallId: string, params: SetupParams, _signal: AbortSignal) {
    const config: AbapProfile = {
      url: params.url.replace(/\/+$/, ""),
      username: params.username,
      password: params.password,
      ...(params.client !== undefined && { client: params.client }),
      ...(params.language !== undefined && { language: params.language }),
      ...(params.allowUnauthorized !== undefined && {
        allowUnauthorized: params.allowUnauthorized,
      }),
    };

    saveProfile(params.name, config);

    return {
      content: [
        {
          type: "text" as const,
          text: `SAP profile "${params.name}" saved and set as active. You can now use all ABAP tools (e.g. abap_test_connection to verify).`,
        },
      ],
      details: { profileName: params.name, configSaved: true },
    };
  },
};
