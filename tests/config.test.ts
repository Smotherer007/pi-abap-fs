import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { AbapProfile } from "../src/types.ts";

const testHome = path.join(os.tmpdir(), "pi-abap-fs-test-" + Date.now());
const testConfigDir = path.join(testHome, ".pi");
const testConfigFile = path.join(testConfigDir, "abap-config.json");

const sampleProfile: AbapProfile = {
  url: "http://sapdev.local:8000",
  username: "DEVELOPER",
  password: "secret123",
  client: "001",
  language: "EN",
};

const sampleProfile2: AbapProfile = {
  url: "http://sapprod.local:44300",
  username: "ADMIN",
  password: "password456",
};

import * as config from "../src/config.ts";

describe("Config persistence — multi-profile", () => {
  beforeEach(() => {
    if (fs.existsSync(testHome)) {
      fs.rmSync(testHome, { recursive: true });
    }
    fs.mkdirSync(testConfigDir, { recursive: true });
    process.env.HOME = testHome;
    process.env.USERPROFILE = testHome;
    config._resetForTesting();
  });

  afterEach(() => {
    config._resetForTesting();
    if (fs.existsSync(testHome)) {
      fs.rmSync(testHome, { recursive: true });
    }
  });

  it("starts with no profiles", () => {
    config.loadConfig();
    assert.strictEqual(config.getConfig(), null);
    assert.strictEqual(config.getActiveProfile(), null);
    assert.deepStrictEqual(config.getProfiles(), {});
  });

  it("saves a profile and sets it as active", () => {
    config.saveProfile("dev", sampleProfile);
    assert.strictEqual(config.getActiveProfile(), "dev");
    assert.deepStrictEqual(config.getConfig(), sampleProfile);
  });

  it("persists profiles to disk with 0600 permissions", () => {
    config.saveProfile("dev", sampleProfile);
    assert.ok(fs.existsSync(testConfigFile));
    const mode = fs.statSync(testConfigFile).mode & 0o777;
    assert.strictEqual(mode, 0o600);
  });

  it("reloads persisted profiles", () => {
    config.saveProfile("dev", sampleProfile);
    config.saveProfile("prod", sampleProfile2);
    config._resetForTesting();
    config.loadConfig();
    assert.deepStrictEqual(Object.keys(config.getProfiles()).sort(), [
      "dev",
      "prod",
    ]);
  });

  it("switches the active profile", () => {
    config.saveProfile("dev", sampleProfile);
    config.saveProfile("prod", sampleProfile2);
    config.setActiveProfile("prod");
    assert.strictEqual(config.getActiveProfile(), "prod");
    assert.deepStrictEqual(config.getConfig(), sampleProfile2);
  });

  it("deletes a profile and picks a new active one", () => {
    config.saveProfile("dev", sampleProfile);
    config.saveProfile("prod", sampleProfile2);
    assert.strictEqual(config.deleteProfile("dev"), true);
    assert.strictEqual(config.getActiveProfile(), "prod");
    assert.deepStrictEqual(config.getProfiles(), { prod: sampleProfile2 });
  });

  it("resolveConfig throws when a profile is missing", () => {
    config.saveProfile("dev", sampleProfile);
    assert.throws(() => config.resolveConfig("nope"), /not found/);
  });
});
