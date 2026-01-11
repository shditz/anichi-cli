"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigPath = exports.saveConfig = exports.loadConfig = exports.ensureConfigDir = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const ui_1 = require("./ui");
const CONFIG_DIR = path_1.default.join(os_1.default.homedir(), ".config", "anichi");
const CONFIG_FILE = path_1.default.join(CONFIG_DIR, "config.json");
const ensureConfigDir = () => {
    if (!fs_1.default.existsSync(CONFIG_DIR)) {
        fs_1.default.mkdirSync(CONFIG_DIR, { recursive: true });
    }
};
exports.ensureConfigDir = ensureConfigDir;
const loadConfig = () => {
    (0, exports.ensureConfigDir)();
    if (!fs_1.default.existsSync(CONFIG_FILE)) {
        return {};
    }
    try {
        const content = fs_1.default.readFileSync(CONFIG_FILE, "utf-8");
        const config = JSON.parse(content);
        if (typeof config !== "object" || config === null) {
            ui_1.logger.warn("Invalid config format, resetting to default.");
            return {};
        }
        return config;
    }
    catch (err) {
        ui_1.logger.warn("Corrupt config file found, resetting to default.");
        return {};
    }
};
exports.loadConfig = loadConfig;
const saveConfig = (config) => {
    (0, exports.ensureConfigDir)();
    try {
        fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    }
    catch (err) {
        ui_1.logger.error(`Failed to save config: ${err.message}`);
    }
};
exports.saveConfig = saveConfig;
const getConfigPath = () => CONFIG_FILE;
exports.getConfigPath = getConfigPath;
//# sourceMappingURL=config.js.map