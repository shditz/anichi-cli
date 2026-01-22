import fs from "fs";
import path from "path";
import os from "os";
import { AppConfig } from "./types";
import { logger } from "./ui";

const CONFIG_DIR = path.join(os.homedir(), ".config", "anichi");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const SCRIPTS_DIR = path.join(CONFIG_DIR, "scripts");
const CACHE_DIR = path.join(CONFIG_DIR, "resume-cache");
const CORRUPT_BACKUP = path.join(CONFIG_DIR, "config.corrupt.json");

const LUA_SCRIPT_CONTENT = `
local msg = require 'mp.msg'

local function save_position()
    local pos = mp.get_property_number("time-pos")
    if pos then
        local slug = mp.get_property("user-data/anichi-slug")
        local episode = mp.get_property("user-data/anichi-episode")

        if slug and episode then
            local file_path = os.getenv("HOME") or os.getenv("USERPROFILE")
            file_path = file_path .. [[/.config/anichi/resume-cache/]] .. slug .. "_" .. episode .. ".txt"

            local f = io.open(file_path, "w")
            if f then
                f:write(math.floor(pos))
                f:close()
                msg.info("Resume saved to: " .. file_path)
            end
        end
    end
end

mp.register_event("shutdown", save_position)
`;

export const ensureConfigDir = (): void => {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
};

export const ensureScriptsAndCacheDirs = (): void => {
  ensureConfigDir();

  if (!fs.existsSync(SCRIPTS_DIR)) {
    fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
  }

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  const luaPath = path.join(SCRIPTS_DIR, "save-position.lua");
  if (!fs.existsSync(luaPath)) {
    fs.writeFileSync(luaPath, LUA_SCRIPT_CONTENT.trim());
    logger.success("save-position.lua berhasil dibuat otomatis.");
  }
};

export const loadConfig = (): AppConfig => {
  ensureConfigDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const content = fs.readFileSync(CONFIG_FILE, "utf-8");
    const config = JSON.parse(content);

    if (typeof config !== "object" || config === null) {
      logger.warn("Invalid config format, resetting to default.");
      return {};
    }

    return config;
  } catch (err) {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        fs.renameSync(CONFIG_FILE, CORRUPT_BACKUP);
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({}, null, 2));
      logger.warn("Corrupt config file detected. Resetting to default settings.");
    } catch (renameErr) {}
    return {};
  }
};

export const saveConfig = (config: AppConfig): void => {
  ensureConfigDir();
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (err: any) {
    logger.error(`Failed to save config: ${err.message}`);
  }
};

export const getConfigPath = (): string => CONFIG_FILE;