/**
 * Data types for the pi ABAP FS extension.
 *
 * All domain data is represented as plain immutable-shaped interfaces.
 * No behavior — just data.
 */

// Configuration

export interface AbapProfile {
  /** ADT base URL, e.g. http://vhcalnplci.bti.local:8000 */
  readonly url: string;
  /** SAP logon user (e.g. DEVELOPER) */
  readonly username: string;
  /** Password (stored in ~/.pi/abap-config.json with 0600 permissions) */
  readonly password: string;
  /** SAP client / mandant, e.g. "001" */
  readonly client?: string;
  /** Logon language key, e.g. "EN" */
  readonly language?: string;
  /** Accept self-signed TLS certificates (on-premise dev systems). Defaults to false. */
  readonly allowUnauthorized?: boolean;
}

export interface AbapProfiles {
  readonly profiles: Record<string, AbapProfile>;
  readonly activeProfile: string | null;
}

// Operation errors

export class AbapNotConfiguredError extends Error {
  constructor() {
    super(
      "No SAP connection configured. Use the abap_setup tool first.",
    );
    this.name = "AbapNotConfiguredError";
  }
}

export class AbapObjectNotFoundError extends Error {
  constructor(name: string) {
    super(`No ABAP object found matching "${name}".`);
    this.name = "AbapObjectNotFoundError";
  }
}

export class AbapProfileNotFoundError extends Error {
  constructor(name: string, available: ReadonlyArray<string>) {
    super(
      `Profile "${name}" not found. Available: ${available.join(", ") || "none"}`,
    );
    this.name = "AbapProfileNotFoundError";
  }
}
