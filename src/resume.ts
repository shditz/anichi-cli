import fs from "fs";
import path from "path";
import os from "os";
import { ResumeWatchItem } from "./types";
import { ensureConfigDir } from "./config";
import { logger } from "./ui";

const RESUME_FILE = path.join(os.homedir(), ".config", "anichi", "resume.json");
const MAX_ENTRIES = 100;

export const loadResume = (): ResumeWatchItem[] => {
  ensureConfigDir();
  if (!fs.existsSync(RESUME_FILE)) {
    return [];
  }
  try {
    const content = fs.readFileSync(RESUME_FILE, "utf-8");
    if (content.trim() === "") {
      logger.warn("resume.json kosong, reset ke array kosong.");
      fs.unlinkSync(RESUME_FILE);
      return [];
    }
    const data: unknown = JSON.parse(content);
    if (!Array.isArray(data)) {
      logger.warn("resume.json bukan array, reset ke array kosong.");
      fs.unlinkSync(RESUME_FILE);
      return [];
    }
    return (data as ResumeWatchItem[]).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch (error: any) {
    logger.error(`Gagal parsing resume.json: ${error.message}, reset ke array kosong.`);
    try {
      fs.unlinkSync(RESUME_FILE);
    } catch {}
    return [];
  }
};

export const saveResume = (resumeList: ResumeWatchItem[]): void => {
  ensureConfigDir();
  try {
    const limited = resumeList.slice(0, MAX_ENTRIES);
    fs.writeFileSync(RESUME_FILE, JSON.stringify(limited, null, 2));
  } catch (err: any) {
    logger.error(`Failed to save resume: ${err.message}`);
  }
};

export const addOrUpdateResume = (item: Omit<ResumeWatchItem, "timestamp">): void => {
  let resumeList = loadResume();
  const newTimestamp = new Date().toISOString();

  const existingIndex = resumeList.findIndex(
    (r) => r.slug === item.slug && r.episode === item.episode
  );

  const newItem: ResumeWatchItem = { ...item, timestamp: newTimestamp };

  if (existingIndex !== -1) {
    resumeList[existingIndex] = newItem;
  } else {
    resumeList.push(newItem);
  }

  resumeList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (resumeList.length > MAX_ENTRIES) {
    resumeList = resumeList.slice(1);
  }

  saveResume(resumeList);
};

export const getResumeForEpisode = (slug: string, episode: number): ResumeWatchItem | null => {
  const resumeList = loadResume();
  return resumeList.find((r) => r.slug === slug && r.episode === episode) || null;
};

export const clearResume = (): void => {
  ensureConfigDir();
  try {
    if (fs.existsSync(RESUME_FILE)) {
      fs.unlinkSync(RESUME_FILE);
      logger.success("Resume data cleared.");
    }
  } catch (err: any) {
    logger.error(`Failed to clear resume: ${err.message}`);
  }
};

export const removeResumeForEpisode = (slug: string, episode: number): void => {
  let resumeList = loadResume();

  const initialLength = resumeList.length;
  resumeList = resumeList.filter(r => !(r.slug === slug && r.episode === episode));

  if (resumeList.length < initialLength) {
    saveResume(resumeList);
    logger.success(`Resume untuk ${slug} Ep ${episode} berhasil dihapus.`);
  } else {
    logger.warn(`Tidak ada resume untuk ${slug} Ep ${episode}.`);
  }
};