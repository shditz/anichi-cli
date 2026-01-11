"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playUrl = void 0;
const child_process_1 = require("child_process");
const open_1 = __importDefault(require("open"));
const ui_1 = require("./ui");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const MPV_EXECUTABLE = {
    win32: "mpv.exe",
    darwin: "mpv",
    linux: "mpv",
};
const findMpvOnWindows = () => {
    const paths = [
        path_1.default.join(os_1.default.homedir(), "scoop", "apps", "mpv", "current", "mpv.exe"),
        "C:\\Program Files\\mpv\\mpv.exe",
        "C:\\Program Files (x86)\\mpv\\mpv.exe",
        "C:\\ProgramData\\chocolatey\\lib\\mpvio.install\\tools\\mpv.exe",
        "C:\\ProgramData\\chocolatey\\bin\\mpv.exe",
        path_1.default.join(os_1.default.homedir(), "AppData", "Local", "Programs", "mpv", "mpv.exe"),
        "C:\\mpv\\mpv.exe",
    ];
    for (const p of paths) {
        if (fs_1.default.existsSync(p))
            return p;
    }
    return null;
};
const findMpvOnMac = () => {
    const paths = [
        "/usr/local/bin/mpv",
        "/opt/homebrew/bin/mpv",
        "/opt/local/bin/mpv",
        "/Applications/mpv.app/Contents/MacOS/mpv",
        path_1.default.join(os_1.default.homedir(), "Applications", "mpv.app", "Contents", "MacOS", "mpv"),
    ];
    for (const p of paths) {
        if (fs_1.default.existsSync(p))
            return p;
    }
    return null;
};
const findMpvOnLinux = () => {
    const paths = [
        "/snap/bin/mpv",
        "/var/lib/flatpak/exports/bin/io.github.mpv.mpv",
        "/usr/bin/mpv",
        "/usr/local/bin/mpv",
    ];
    for (const p of paths) {
        if (fs_1.default.existsSync(p))
            return p;
    }
    return null;
};
const commandExists = (cmd) => {
    try {
        const check = process.platform === "win32" ? `where "${cmd}" 2>nul` : `command -v ${cmd}`;
        const { execSync } = require("child_process");
        execSync(check, { stdio: "pipe" });
        return true;
    }
    catch {
        return false;
    }
};
const findPlayer = () => {
    let player = null;
    if (process.platform === "win32") {
        player = findMpvOnWindows();
    }
    else if (process.platform === "darwin") {
        player = findMpvOnMac();
    }
    else if (process.platform === "linux") {
        player = findMpvOnLinux();
    }
    if (!player) {
        const genericName = MPV_EXECUTABLE[process.platform];
        if (commandExists(genericName)) {
            player = genericName;
        }
    }
    return player;
};
const spawnPlayer = (player, args) => {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(player, args, {
            stdio: "ignore",
            detached: true,
            shell: process.platform === "win32",
            windowsHide: true,
        });
        let resolved = false;
        child.on("error", (err) => {
            if (!resolved) {
                resolved = true;
                reject(err);
            }
        });
        child.on("spawn", () => {
            if (!resolved) {
                if (child.unref)
                    child.unref();
                resolved = true;
                resolve(true);
            }
        });
        setTimeout(() => {
            if (!resolved) {
                if (child.pid && !child.killed) {
                    if (child.unref)
                        child.unref();
                    resolved = true;
                    resolve(true);
                }
                else {
                    resolved = true;
                    reject(new Error("Player spawn timeout"));
                }
            }
        }, 1500);
    });
};
const playUrl = async (url, customPlayer, customArgs = [], noBrowser = false) => {
    const args = customArgs.map((a) => (a.startsWith("--") || a.startsWith("-") ? a : `--${a}`));
    let playerPath = customPlayer || findPlayer();
    const ytdlpFound = commandExists("yt-dlp");
    if (!playerPath) {
        ui_1.logger.error("MPV Player tidak ditemukan di sistem Anda.");
        ui_1.logger.warn("Anichi hanya mendukung MPV untuk CLI player.");
        if (!noBrowser) {
            ui_1.logger.info("Membuka di Browser sebagai fallback...");
            await (0, open_1.default)(url);
            await new Promise((r) => setTimeout(r, 2000));
            return true;
        }
        return false;
    }
    if (!ytdlpFound) {
        ui_1.logger.warn("MPV membutuhkan 'yt-dlp' untuk streaming.");
        ui_1.logger.muted("Silakan install yt-dlp agar streaming lancar (choco/scoop/brew install yt-dlp).");
    }
    try {
        await spawnPlayer(playerPath, [...args, url]);
        ui_1.logger.success(`Streaming di MPV (${path_1.default.basename(playerPath)})`);
        return true;
    }
    catch (err) {
        ui_1.logger.error(`Gagal membuka MPV: ${err.message}`);
        if (!noBrowser) {
            ui_1.logger.info("Membuka di Browser sebagai fallback...");
            await (0, open_1.default)(url);
            await new Promise((r) => setTimeout(r, 2000));
            return true;
        }
        return false;
    }
};
exports.playUrl = playUrl;
//# sourceMappingURL=player.js.map