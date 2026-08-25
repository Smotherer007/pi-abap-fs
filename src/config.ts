/**
 * Configuration persistence and state.
 *
 * Stores named SAP connection profiles in ~/.pi/abap-config.json.
 * Supports multiple profiles with an active profile selector.
 *
 * File format:
 *   { "profiles": { "name": AbapProfile, ... }, "activeProfile": "name" }
 */

import type { AbapProfile, AbapProfiles } from "./types.ts";
import { AbapNotConfiguredError, AbapProfileNotFoundError } from "./types.ts";
import * as fs from "node:fs";
import * as path from "node:path";

// Mutable state

let profiles: Record<string, AbapProfile> = {};
let activeProfile: string | null = null;

// Path resolution

function configPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "~";
  return path.join(home, ".pi", "abap-config.json");
}

// Persistence

/**
 * Write the profile store.
 *
 * The file holds plaintext passwords, so it must never be group- or
 * world-readable. writeFileSync's `mode` only applies when the file is
 * created, so an existing file keeps its old (possibly 0644) permissions —
 * we therefore write to a private temp file and rename it into place. That
 * is also atomic, so a crash mid-write cannot truncate the config.
 */
function persistProfiles(): void {
  const filePath = configPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  const data: AbapProfiles = { profiles, activeProfile };
  const tmpPath = `${filePath}.${process.pid}.tmp`;

  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), {
      encoding: "utf-8",
      mode: 0o600,
    });
    fs.chmodSync(tmpPath, 0o600);
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
    throw err;
  }
}

export function loadConfig(): void {
  try {
    const filePath = configPath();
    if (fs.existsSync(filePath)) {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      // Tighten permissions on config files written by older versions.
      try {
        const mode = fs.statSync(filePath).mode & 0o777;
        if (mode !== 0o600) fs.chmodSync(filePath, 0o600);
      } catch {
        /* ignore */
      }

      if (raw && typeof raw === "object" && raw.profiles) {
        profiles = raw.profiles;
        if (raw.activeProfile && profiles[raw.activeProfile]) {
          activeProfile = raw.activeProfile;
        } else if (Object.keys(profiles).length > 0) {
          activeProfile = Object.keys(profiles)[0];
        } else {
          activeProfile = null;
        }
      }
    }
  } catch {
    profiles = {};
    activeProfile = null;
  }
}

// Access

export function getConfig(): AbapProfile | null {
  if (!activeProfile) return null;
  return profiles[activeProfile] ?? null;
}

export function getConfigOrThrow(): AbapProfile {
  const config = getConfig();
  if (!config) {
    throw new AbapNotConfiguredError();
  }
  return config;
}

/** Get a specific profile by name, or null if not found. */
export function getProfile(name: string): AbapProfile | null {
  return profiles[name] ?? null;
}

/**
 * Resolve a profile parameter: if a name is given, return that profile
 * (or throw if not found). Otherwise, return the active profile or throw.
 */
export function resolveConfig(profileName?: string): AbapProfile {
  if (profileName) {
    const config = getProfile(profileName);
    if (!config) {
      throw new AbapProfileNotFoundError(profileName, Object.keys(profiles));
    }
    return config;
  }
  return getConfigOrThrow();
}

export function getProfiles(): Record<string, AbapProfile> {
  return { ...profiles };
}

export function getActiveProfile(): string | null {
  return activeProfile;
}

// Mutations

export function saveProfile(name: string, config: AbapProfile): void {
  profiles[name] = config;
  // Auto-set as active if it's the first profile or no active profile.
  if (!activeProfile || Object.keys(profiles).length === 1) {
    activeProfile = name;
  }
  persistProfiles();
}

export function setActiveProfile(name: string): void {
  if (!profiles[name]) {
    throw new AbapProfileNotFoundError(name, Object.keys(profiles));
  }
  activeProfile = name;
  persistProfiles();
}

export function deleteProfile(name: string): boolean {
  if (!profiles[name]) return false;
  delete profiles[name];
  if (activeProfile === name) {
    const keys = Object.keys(profiles);
    activeProfile = keys.length > 0 ? keys[0] : null;
  }
  persistProfiles();
  return true;
}

/** @internal Reset state — for testing only */
export function _resetForTesting(): void {
  profiles = {};
  activeProfile = null;
}
