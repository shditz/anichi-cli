import fs from "fs";
import path from "path";
import os from "os";
import {WatchHistoryItem} from "./types";
import {ensureConfigDir} from "./config";
import {logger} from "./ui";

const HISTORY_FILE = path.join(os.homedir(), ".config", "anichi", "history.json");
const MAX_ENTRIES = 100;

export const loadHistory = (): WatchHistoryItem[] => {
  ensureConfigDir();
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }
  try {
    const content = fs.readFileSync(HISTORY_FILE, "utf-8");
    const data: unknown = JSON.parse(content);
    if (!Array.isArray(data)) {
      logger.warn("File riwayat corrupt, reset ke kosong.");
      return [];
    }
    return (data as WatchHistoryItem[]).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (err) {
    logger.warn("Gagal memuat riwayat, reset ke kosong.");
    return [];
  }
};

export const saveHistory = (history: WatchHistoryItem[]): void => {
  ensureConfigDir();
  try {
    const limited = history.slice(0, MAX_ENTRIES);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(limited, null, 2));
  } catch (err: any) {
    logger.error(`Gagal menyimpan riwayat: ${err.message}`);
  }
};

export const addToHistory = (item: Omit<WatchHistoryItem, "timestamp">): void => {
  const history = loadHistory();
  const newItem: WatchHistoryItem = {
    ...item,
    timestamp: new Date().toISOString(),
  };
  history.unshift(newItem);
  saveHistory(history);
};

export const clearHistory = (): void => {
  ensureConfigDir();
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      fs.unlinkSync(HISTORY_FILE);
    }
    logger.success("Riwayat tontonan berhasil dihapus.");
  } catch (err: any) {
    logger.error(`Gagal menghapus riwayat: ${err.message}`);
  }
};
