import { spawn } from "child_process";
import open from "open";
import { logger } from "./ui";
import fs from "fs";
import path from "path";
import os from "os";

const MPV_EXECUTABLE = {
  win32: "mpv.exe",
  darwin: "mpv",
  linux: "mpv",
};

const findMpvOnWindows = (): string | null => {
  const paths = [
    path.join(os.homedir(), "scoop", "apps", "mpv", "current", "mpv.exe"),
    "C:\\Program Files\\mpv\\mpv.exe",
    "C:\\Program Files (x86)\\mpv\\mpv.exe",
    "C:\\ProgramData\\chocolatey\\lib\\mpvio.install\\tools\\mpv.exe",
    "C:\\ProgramData\\chocolatey\\bin\\mpv.exe",
    path.join(os.homedir(), "AppData", "Local", "Programs", "mpv", "mpv.exe"),
    "C:\\mpv\\mpv.exe",
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
};

const findMpvOnMac = (): string | null => {
  const paths = [
    "/usr/local/bin/mpv",
    "/opt/homebrew/bin/mpv",
    "/opt/local/bin/mpv",
    "/Applications/mpv.app/Contents/MacOS/mpv",
    path.join(os.homedir(), "Applications", "mpv.app", "Contents", "MacOS", "mpv"),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
};

const findMpvOnLinux = (): string | null => {
  const paths = [
    "/snap/bin/mpv",
    "/var/lib/flatpak/exports/bin/io.github.mpv.mpv",
    "/usr/bin/mpv",
    "/usr/local/bin/mpv",
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
};

const commandExists = (cmd: string): boolean => {
  try {
    const check = process.platform === "win32" ? `where "${cmd}" 2>nul` : `command -v ${cmd}`;
    const { execSync } = require("child_process");
    execSync(check, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
};

const findPlayer = (): string | null => {
  let player: string | null = null;

  if (process.platform === "win32") {
    player = findMpvOnWindows();
  } else if (process.platform === "darwin") {
    player = findMpvOnMac();
  } else if (process.platform === "linux") {
    player = findMpvOnLinux();
  }

  if (!player) {
    const genericName = MPV_EXECUTABLE[process.platform as keyof typeof MPV_EXECUTABLE];
    if (commandExists(genericName)) {
      player = genericName;
    }
  }

  return player;
};

const spawnPlayer = (player: string, args: string[]): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const child = spawn(player, args, {
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
        if (child.unref) child.unref();
        resolved = true;
        resolve(true);
      }
    });

    setTimeout(() => {
      if (!resolved) {
        if (child.pid && !child.killed) {
          if (child.unref) child.unref();
          resolved = true;
          resolve(true);
        } else {
          resolved = true;
          reject(new Error("Player spawn timeout"));
        }
      }
    }, 1500);
  });
};

export const playUrl = async (
  url: string,
  customPlayer?: string,
  customArgs: string[] = [],
  noBrowser = false,
  metadata?: { slug: string; animeTitle: string; episode: number }
): Promise<boolean> => {
  const args = customArgs.map((a) => (a.startsWith("--") || a.startsWith("-") ? a : `--${a}`));

  let playerPath = customPlayer || findPlayer();

  const ytdlpFound = commandExists("yt-dlp");

  if (!playerPath) {
    logger.error("MPV Player tidak ditemukan di sistem Anda.");
    logger.warn("Anichi hanya mendukung MPV untuk CLI player.");

    if (!noBrowser) {
      logger.info("Membuka di Browser sebagai fallback...");
      await open(url);
      await new Promise((r) => setTimeout(r, 2000));
      if (metadata) {
        const { addToHistory } = await import("./history");
        addToHistory(metadata);
      }
      return true;
    }
    return false;
  }

  if (!ytdlpFound) {
    logger.warn("MPV membutuhkan 'yt-dlp' untuk streaming.");
    logger.muted("Silakan install yt-dlp agar streaming lancar (choco/scoop/brew install yt-dlp).");
  }

  try {
    await spawnPlayer(playerPath, [...args, url]);
    logger.success(`Streaming di MPV (${path.basename(playerPath)})`);
    if (metadata) {
      const { addToHistory } = await import("./history");
      addToHistory(metadata);
    }
    return true;
  } catch (err: any) {
    logger.error(`Gagal membuka MPV: ${err.message}`);

    if (!noBrowser) {
      logger.info("Membuka di Browser sebagai fallback...");
      await open(url);
      await new Promise((r) => setTimeout(r, 2000));
      if (metadata) {
        const { addToHistory } = await import("./history");
        addToHistory(metadata);
      }
      return true;
    }
    return false;
  }
};