import { spawn } from "child_process";
import open from "open";
import { logger } from "./ui";
import fs from "fs";
import path from "path";
import os from "os";
import { addOrUpdateResume, getResumeForEpisode } from "./resume";
import { Buffer } from "buffer";

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
    path.join(os.homedir(), "Applications", "mpv.app", "Contents", "MacoS", "mpv"),
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

const getMpvIpcPath = (): string => {
  if (process.platform === "win32") {
    return `\\\\.\\pipe\\mpv-ipc-${Date.now()}`;
  }
  const tmpDir = os.tmpdir();
  return path.join(tmpDir, `mpv-ipc-${Date.now()}.sock`);
};

const getResumeCachePath = (slug: string, episode: number): string => {
  return path.join(os.homedir(), ".config", "anichi", "resume-cache", `${slug}_${episode}.txt`);
};

const spawnPlayerWithIpc = (
  player: string,
  args: string[],
  ipcPath: string
): Promise<{ success: boolean; finalPosition: number | null }> => {
  return new Promise((resolve) => {
    const finalArgs = [...args, `--input-ipc-server=${ipcPath}`];

    const child = spawn(player, finalArgs, {
      stdio: ['ignore', 'ignore', 'ignore'],
      shell: process.platform === "win32",
      env: process.env,
    });

    let resolved = false;
    let lastKnownPosition: number | null = null;

    const startTime = Date.now();

    if (process.platform !== "win32") {
      const net = require("net") as typeof import("net");
      const server = net.createServer((socket: import("net").Socket) => {
        socket.on("data", ( Buffer) => {
          const lines = Buffer.toString().split("\n");
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const res = JSON.parse(line);
              if (res.event === "property-change" && res.name === "time-pos" && typeof res.data === "number") {
                lastKnownPosition = Math.floor(res.data);
              }
            } catch {}
          }
        });
      });

      server.listen(ipcPath, () => {});
      child.on("exit", () => {
        server.close(() => {
          if (fs.existsSync(ipcPath)) {
            try {
              fs.unlinkSync(ipcPath);
            } catch {}
          }
        });
      });
    }

    const cleanup = (success: boolean) => {
      if (resolved) return;
      resolved = true;

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const finalPos = lastKnownPosition ?? elapsed;

      resolve({ success, finalPosition: finalPos });
    };

    child.on("error", (err) => {
      logger.error(`MPV error: ${err.message}`);
      cleanup(false);
    });

    child.on("exit", () => {
      cleanup(true);
    });
  });
};

export const playUrl = async (
  url: string,
  customPlayer?: string,
  customArgs: string[] = [],
  noBrowser = false,
  metadata?: { slug: string; animeTitle: string; episode: number }
): Promise<boolean> => {
  logger.info(`Memulai playUrl untuk URL: ${url}`);

  let playerPath = customPlayer || findPlayer();
  const ytdlpFound = commandExists("yt-dlp");

  if (!playerPath) {
    logger.error("MPV Player tidak ditemukan di sistem Anda.");
    if (!noBrowser) {
      logger.info("Membuka di Browser sebagai fallback...");
      await open(url);
      if (metadata) {
        const { addToHistory } = await import("./history");
        addToHistory(metadata);
      }
      return true;
    }
    return false;
  }

  if (!ytdlpFound) {
    logger.warn("yt-dlp tidak ditemukan. Streaming mungkin tidak akan berjalan.");
  } else {
    logger.success("yt-dlp ditemukan.");
  }

  const finalArgs = customArgs.length > 0 ? customArgs : [
    "--fs",
    "--no-border",
    "--deband=no",
    "--scale=ewa_lanczossharp",
    "--cscale=ewa_lanczossharp",
    "--tscale=oversample",
  ];

  if (metadata) {
    const resume = getResumeForEpisode(metadata.slug, metadata.episode);
    if (resume) {
      const mins = Math.floor(resume.position / 60);
      const secs = Math.floor(resume.position % 60);
      logger.success(`Melanjutkan dari ${mins}:${secs.toString().padStart(2, "0")}`);
      finalArgs.push(`--start=${resume.position}`);
    }

    if (process.platform === "win32") {
      finalArgs.push(`--script-opts-add=user-data/anichi-slug=${metadata.slug}`);
      finalArgs.push(`--script-opts-add=user-data/anichi-episode=${metadata.episode}`);

      const scriptPath = path.join(os.homedir(), ".config", "anichi", "scripts", "save-position.lua");
      if (fs.existsSync(scriptPath)) {
        finalArgs.push(`--script=${scriptPath}`);
      }
    }
  }

  let finalPosition: number | null = null;

  if (process.platform === "win32") {
    const startTime = Date.now();

    const child = spawn(playerPath, [...finalArgs, url], {
      stdio: ['ignore', 'ignore', 'ignore'],
      shell: process.platform === "win32",
      env: process.env,
    });

    await new Promise<void>((resolve) => {
      child.on("error", (err) => {
        logger.error(`MPV error: ${err.message}`);
        resolve();
      });

      child.on("exit", () => {
        resolve();
      });
    });

    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    if (metadata) {
      const cachePath = getResumeCachePath(metadata.slug, metadata.episode);
      if (fs.existsSync(cachePath)) {
        try {
          const content = fs.readFileSync(cachePath, "utf-8").trim();
          finalPosition = parseInt(content, 10);
          fs.unlinkSync(cachePath);
        } catch (e) {
          logger.warn("Gagal membaca resume cache, gunakan estimasi.");
        }
      }

      if (!finalPosition) {
        finalPosition = elapsed;
      }
    }
  } else {
    const ipcPath = getMpvIpcPath();
    logger.info(`IPC Path: ${ipcPath}`);
    const result = await spawnPlayerWithIpc(playerPath, [...finalArgs, url], ipcPath);
    finalPosition = result.finalPosition;
  }

  if (finalPosition !== null && finalPosition > 10 && metadata) {
    addOrUpdateResume({
      slug: metadata.slug,
      episode: metadata.episode,
      position: finalPosition,
      duration: 0,
      animeTitle: metadata.animeTitle,
    });
    logger.info(`Resume disimpan untuk Ep ${metadata.episode} pada ${finalPosition}s`);
  }

  if (metadata) {
    const { addToHistory } = await import("./history");
    addToHistory(metadata);
  }

  return true;
};