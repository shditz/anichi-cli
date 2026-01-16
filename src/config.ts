import fs from "fs";
import path from "path";
import os from "os";
import {AppConfig} from "./types";
import {logger} from "./ui";

const CONFIG_DIR = path.join(os.homedir(), ".config", "anichi");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const CORRUPT_BACKUP = path.join(CONFIG_DIR, "config.corrupt.json");

export const ensureConfigDir = (): void => {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, {recursive: true});
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
