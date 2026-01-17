import fs from "fs";
import path from "path";
import os from "os";
import { WatchHistoryItem } from "./types";
import { ensureConfigDir } from "./config";
import { logger } from "./ui";

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
    // Sort ASCENDING berdasarkan timestamp (terlama dulu)
    return (data as WatchHistoryItem[]).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch (err) {
    logger.warn("Gagal memuat riwayat, reset ke kosong.");
    return [];
  }
};

export const saveHistory = (history: WatchHistoryItem[]): void => {
  ensureConfigDir();
  try {
    // Batasi maksimal 100 entri (setelah sort ascending, slice(0, 100) menghapus yang terbaru jika melebihi)
    const limited = history.slice(0, MAX_ENTRIES);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(limited, null, 2));
  } catch (err: any) {
    logger.error(`Gagal menyimpan riwayat: ${err.message}`);
  }
};

export const addToHistory = (item: Omit<WatchHistoryItem, "timestamp">): void => {
  let history = loadHistory(); // sudah di-sort ascending

  const newTimestamp = new Date().toISOString();

  // Cari apakah kombinasi slug + episode sudah ada
  const existingIndex = history.findIndex(
    (h) => h.slug === item.slug && h.episode === item.episode
  );

  if (existingIndex !== -1) {
    // Jika sudah ada → overwrite timestamp saja
    history[existingIndex].timestamp = newTimestamp;
    logger.muted(`Riwayat diperbarui: ${item.animeTitle} Ep ${item.episode}`);
  } else {
    // Jika belum ada → tambahkan entri baru di akhir (karena ascending)
    const newItem: WatchHistoryItem = {
      ...item,
      timestamp: newTimestamp,
    };
    history.push(newItem);
    logger.muted(`Riwayat ditambahkan: ${item.animeTitle} Ep ${item.episode}`);
  }

  // Jika setelah penambahan/update melebihi batas, hapus yang paling lama (index 0)
  if (history.length > MAX_ENTRIES) {
    history = history.slice(1); // hapus entri terlama
    logger.muted(`Riwayat melebihi batas, entri terlama dihapus.`);
  }

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