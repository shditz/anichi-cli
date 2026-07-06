import chalk from "chalk";
import ora from "ora";
import { Command } from "commander";
import readline from "readline";
import open from "open";
import api from "./api";
import { playUrl } from "./player";
import { loadConfig, saveConfig, getConfigPath, ensureScriptsAndCacheDirs } from "./config";
import { theme, logger, clearScreen, showBanner, createHeader, showAnimeDetails, printDownloadOptions, printBatchProviders, printFAQ, printWatchHistory } from "./ui";

// Import fungsi askInteractive dari file terpisah
import {
  askInteractiveHome,
  askInteractiveMain,
  askInteractiveSearch,
  askInteractiveGenre,
  askInteractiveSchedule,
  askInteractiveHistory,
  askInteractiveEpisode,
  askInteractiveQuality,
} from "./ui/interactive";

import { BatchData } from "./types";
import { loadHistory, clearHistory, addToHistory } from "./history";
import { getResumeForEpisode, clearResume } from "./resume";
import axios from "axios";

const resolveRedirect = async (url: string): Promise<string> => {
  let resolvedUrl = url;
  try {
    const response = await axios.head(url, { maxRedirects: 0, validateStatus: () => true, timeout: 5000 });
    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      resolvedUrl = response.headers.location;
    }
  } catch {
    // ignore redirect errors
  }

  // Rewrite pixeldrain viewer URL to direct file URL
  if (resolvedUrl.includes("pixeldrain.com/u/")) {
    resolvedUrl = resolvedUrl.replace("pixeldrain.com/u/", "pixeldrain.com/api/file/");
  }
  return resolvedUrl;
};

// === FUNGSI INPUT TEKS (UNTUK TEMPAT YANG BUTUH TIPE) ===
const ask = (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(chalk.hex(theme.primary)(`  ${query} `), (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
};

ensureScriptsAndCacheDirs();

const program = new Command();
program.name("anichi").description("Anime streaming for CLI").version("2.9.1");

const extractEpisodeNumber = (title: string): number => {
  const matches = title.match(/(?:Episode|Eps?)\s*(\d+)/i);
  if (matches) {
    return parseInt(matches[1], 10);
  }
  const nums = title.match(/\d+/g);
  if (nums) {
    return parseInt(nums[nums.length - 1], 10);
  }
  return 0;
};

const resolveEpisode = (eps: number | "latest", list: any[]) => {
  if (eps === "latest") return list[0];
  const targetNum = eps;
  const exactMatch = list.find((e: any) => extractEpisodeNumber(e.title) === targetNum);
  if (exactMatch) return exactMatch;
  const fuzzyMatch = list.find((e: any) => e.title.includes(targetNum.toString()));
  if (fuzzyMatch) return fuzzyMatch;
  return null;
};

const handleBatch = async (animeSlug: string, batchData: any) => {
  clearScreen();
  if (!batchData?.download_links || batchData.download_links.length === 0) {
    logger.error("No batch download links available");
    await new Promise((r) => setTimeout(r, 2000));
    return;
  }

  const links = batchData.download_links;
  const tableOptions = links.map((l: BatchData["download_links"][number], i: number) => ({
    index: i,
    title: `${l.resolution} - ${l.size}`,
  }));

  printBatchProviders(tableOptions);
  logger.br();
  logger.muted("  Pilih kualitas (1-" + links.length + ") atau 'back'\n");

  const ansQuality = await ask("Kualitas:");
  const qChoice = ansQuality.toLowerCase();
  if (qChoice === "back" || qChoice === "0") return;

  const qIndex = parseInt(qChoice) - 1;
  if (isNaN(qIndex) || qIndex < 0 || qIndex >= links.length) {
    logger.warn("Invalid selection");
    await new Promise((r) => setTimeout(r, 1000));
    return await handleBatch(animeSlug, batchData);
  }

  const selectedQuality = links[qIndex];
  clearScreen();
  createHeader(`Pilih Provider (${selectedQuality.resolution})`, theme.success);
  printBatchProviders(selectedQuality.links);
  logger.br();
  logger.muted("  Pilih provider (1-" + selectedQuality.links.length + ") atau 'back'\n");

  const ansProv = await ask("Provider:");
  const pChoice = ansProv.toLowerCase();
  if (pChoice === "back" || pChoice === "0") return await handleBatch(animeSlug, batchData);

  const pIndex = parseInt(ansProv) - 1;
  if (isNaN(pIndex) || pIndex < 0 || pIndex >= selectedQuality.links.length) {
    logger.warn("Invalid selection");
    await new Promise((r) => setTimeout(r, 1000));
    return await handleBatch(animeSlug, batchData);
  }

  const provider = selectedQuality.links[pIndex];
  logger.info(`Opening ${provider.provider}...`);
  await open(provider.url);
  await new Promise((r) => setTimeout(r, 2000));
};

const selectQuality = async (qualities: any[]): Promise<any | null> => {
  const choices = [
    ...qualities.map((q: any) => ({
      name: `${q.quality} • ${q.providers.length > 0 ? `${q.providers.length} provider` : 'Direct Download/Stream'}`,
      value: q.quality,
    })),
    { name: "──────────────────", value: "separator" },
    { name: "[←] Back to Episodes", value: "back" },
  ];

  const selectedValue = await askInteractiveQuality("Kualitas Video:", choices, () => {
    clearScreen();
    createHeader("Pilih Quality", theme.secondary);
    logger.br();
  });

  if (selectedValue === "back") return null;

  return qualities.find((q: any) => q.quality === selectedValue) || null;
};

const handleDownload = async (episodeData: any) => {
  const downloads = episodeData.downloads || [];
  if (downloads.length === 0) {
    logger.error("No download links available");
    return;
  }

  clearScreen();
  createHeader("Download Episode", theme.success);
  printDownloadOptions(downloads);
  logger.br();
  logger.muted("  Pilih kualitas (1-" + downloads.length + ") atau 'back'\n");

  const answer = await ask("Kualitas:");
  const choice = answer.toLowerCase();
  if (choice === "back" || choice === "0") return;

  const qIndex = parseInt(choice) - 1;
  if (isNaN(qIndex) || qIndex < 0 || qIndex >= downloads.length) {
    logger.warn("Invalid selection");
    await new Promise((r) => setTimeout(r, 1000));
    return await handleDownload(episodeData);
  }

  const selected = downloads[qIndex];
  clearScreen();
  createHeader(`Download ${selected.resolution} (${selected.size})`, theme.success);
  selected.links.forEach((provider: any, idx: number) => {
    const num = chalk.hex(theme.success).bold(`  [${idx + 1}]`);
    console.log(`${num} ${chalk.white(provider.provider)}`);
  });
  logger.br();
  logger.muted("  Pilih provider (1-" + selected.links.length + ") atau 'back'\n");

  const provAnswer = await ask("Provider:");
  const provChoice = provAnswer.toLowerCase();
  if (provChoice === "back" || provChoice === "0") return await handleDownload(episodeData);

  const pIndex = parseInt(provAnswer) - 1;
  if (isNaN(pIndex) || pIndex < 0 || pIndex >= selected.links.length) {
    logger.warn("Invalid selection");
    await new Promise((r) => setTimeout(r, 1000));
    return await handleDownload(episodeData);
  }

  const provider = selected.links[pIndex];
  logger.info(`Opening ${provider.provider}...`);
  await open(provider.url);
  await new Promise((r) => setTimeout(r, 2000));
};

const sortQuality = (a: any, b: any) => {
  const getResValue = (str: string) => {
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };
  return getResValue(a.quality) - getResValue(b.quality);
};

const handlePlay = async (slug: string, episodeStr: string, animeData?: any) => {
  const config = loadConfig();
  try {
    let data = animeData;
    if (!data) {
      const spinner = ora("Fetching details...").start();
      const res: any = await api.getAnime(slug);
      data = res.data;
      spinner.stop();
    }

    const epsNum = episodeStr === "latest" ? "latest" : parseInt(episodeStr, 10);
    const episode = resolveEpisode(epsNum, data.episode_list);
    if (!episode) {
      logger.error(`Episode ${episodeStr} not found`);
      return false;
    }

    const epRes: any = await api.getEpisode(episode.slug);
    if (!epRes.meta.status || !epRes.data) {
      logger.error("Failed to fetch episode data");
      return false;
    }
    let qualities: any[] = [];
    let defaultUrl = "";
    qualities = [...(epRes.data.stream || [])];
    defaultUrl = epRes.data.defaultstreaming || "";

    // Gabungkan resolusi dari downloads jika belum ada di streaming qualities
    const downloads = epRes.data.downloads || [];
    downloads.forEach((dl: any) => {
      const dlResLower = dl.resolution.toLowerCase();
      const hasQuality = qualities.some((q: any) => {
        const qLower = q.quality.toLowerCase();
        // Bedakan MKV dan MP4
        const isA_Mkv = qLower.includes("mkv");
        const isB_Mkv = dlResLower.includes("mkv");
        if (isA_Mkv !== isB_Mkv) return false;

        const numMatch = dlResLower.match(/\d+/);
        if (numMatch && qLower.includes(numMatch[0])) {
          return true;
        }
        return qLower.includes(dlResLower) || dlResLower.includes(qLower);
      });

      if (!hasQuality) {
        qualities.push({
          quality: dl.resolution,
          providers: [], // Kosong agar langsung fallback ke downloads resolver
        });
      }
    });

    if (qualities.length === 0) {
      logger.warn("No streaming qualities available");
      if (defaultUrl) {
        logger.info("Opening default stream in browser...");
        await open(defaultUrl);
        return true;
      }
      return false;
    }

    qualities.sort(sortQuality);
    const selectedQuality = await selectQuality(qualities);
    if (!selectedQuality) return false;

    clearScreen();
    logger.info(`Playing: ${episode.title}`);
    logger.info(`Quality: ${selectedQuality.quality}`);

    const playerPath = config.player || config.playerPath;
    const args = config.playerArgs ? config.playerArgs.split(" ") : [];
    const epNum = extractEpisodeNumber(episode.title);

    let success = false;
    let fallbackUrl = defaultUrl;

    const providers = selectedQuality.providers || [];
    if (providers.length > 0) {
      fallbackUrl = providers[0].url;

      for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        const url = provider.url;
        logger.info(`Mencoba provider [${i + 1}/${providers.length}]: ${provider.provider}...`);

        if (url.includes("/embed/") || url.includes("player")) {
          logger.info(`Provider ${provider.provider} adalah embed player, lanjut ke browser...`);
          await open(url);
          success = true;
          addToHistory({
            animeTitle: data.title,
            slug,
            episode: epNum,
          });
          break;
        }

        const playResult = await playUrl(url, playerPath, args, true, {
          slug,
          animeTitle: data.title,
          episode: epNum,
        });

        if (playResult) {
          success = true;
          break;
        } else {
          logger.warn(`Provider ${provider.provider} gagal diputar di MPV.`);
        }
      }
    }

    if (!success) {
      // Trik Power-User: cari link dari data downloads API jika MPV gagal memutar stream langsung
      const selectedRes = selectedQuality.quality.toLowerCase();
      const resNumberMatch = selectedRes.match(/\d+/);
      const resNumber = resNumberMatch ? resNumberMatch[0] : null;

      let matchingDownload = epRes.data.downloads?.find((d: any) => {
        const dResLower = d.resolution.toLowerCase();
        if (resNumber && dResLower.includes(resNumber)) {
          return true;
        }
        return dResLower.includes(selectedRes);
      });

      if (!matchingDownload && epRes.data.downloads && epRes.data.downloads.length > 0) {
        // Fallback jika pencarian resolusi gagal, gunakan resolusi pertama yang tersedia
        matchingDownload = epRes.data.downloads[0];
      }

      const downloadLinks = matchingDownload ? [...matchingDownload.links] : [];
      if (downloadLinks.length > 0) {
        const providerPriority = ["pdrain", "gofile", "kfiles", "acefile", "mega", "filedon"];
        downloadLinks.sort((a: any, b: any) => {
          const indexA = providerPriority.indexOf(a.provider.toLowerCase());
          const indexB = providerPriority.indexOf(b.provider.toLowerCase());
          const priorityA = indexA === -1 ? 99 : indexA;
          const priorityB = indexB === -1 ? 99 : indexB;
          return priorityA - priorityB;
        });

        logger.info("Mencoba mengekstrak tautan langsung dari penyedia unduhan...");
        for (let i = 0; i < downloadLinks.length; i++) {
          const dlLink = downloadLinks[i];
          logger.info(`Menghubungkan ke penyedia unduhan [${i + 1}/${downloadLinks.length}]: ${dlLink.provider}...`);
          try {
            const directUrl = await resolveRedirect(dlLink.url);
            logger.info(`Berhasil memproses tautan unduhan: ${dlLink.provider}`);

            const playResult = await playUrl(directUrl, playerPath, args, true, {
              slug,
              animeTitle: data.title,
              episode: epNum,
            });

            if (playResult) {
              success = true;
              break;
            } else {
              logger.warn(`Penyedia unduhan ${dlLink.provider} gagal diputar di MPV.`);
            }
          } catch (dlErr: any) {
            logger.warn(`Gagal memutar penyedia unduhan ${dlLink.provider}: ${dlErr.message}`);
          }
        }
      }
    }

    if (!success) {
      if (!fallbackUrl && defaultUrl) {
        fallbackUrl = defaultUrl;
      }
      if (fallbackUrl) {
        logger.warn("Semua provider gagal diputar di MPV.");
        logger.info("Membuka di Browser sebagai fallback...");
        await open(fallbackUrl);
        
        addToHistory({
          animeTitle: data.title,
          slug,
          episode: epNum,
        });
        success = true;
      } else {
        logger.error("Tidak ada URL streaming yang tersedia.");
      }
    }

    return success;
  } catch (err: any) {
    logger.error(`Playback failed: ${err.message}`);
    return false;
  }
};

const showEpisodeMenu = async (slug: string, data: any) => {
  // Tampilkan detail dan episode list sekali saja
  clearScreen();
  showAnimeDetails(data);
  createHeader("Episodes", theme.secondary);
  logger.br();

  // Siapkan pilihan episode + aksi
  // Di sini kita buat daftar episode dengan resume
  const episodeChoices = data.episode_list.map((ep: any) => {
    const epNum = extractEpisodeNumber(ep.title);
    const resume = getResumeForEpisode(slug, epNum);
    const resumeText = resume ? ` (Resume: ${Math.floor(resume.position / 60)}:${(resume.position % 60).toString().padStart(2, '0')})` : '';
    return {
      name: `${ep.title} • ${ep.date || ""}${resumeText}`,
      value: ep.slug,
    };
  });

  const allChoices = [
    ...episodeChoices,
    { name: "──────────────────", value: "separator" },
    ...(data.batch ? [{ name: "[B] Download Batch", value: "batch" }] : []),
    { name: "[D] Download Episode", value: "download" },
    { name: "[←] Back to Anime List", value: "back" },
  ];

  const selectedValue = await askInteractiveEpisode("Aksi:", allChoices, () => {
    clearScreen();
    showAnimeDetails(data);
    createHeader("Episodes", theme.secondary);
    logger.br();
  });

  if (selectedValue === "back") return;

  if (selectedValue === "batch") {
    if (!data.batch) {
      logger.error("No batch download available for this anime");
      await new Promise((r) => setTimeout(r, 2000));
      return await showEpisodeMenu(slug, data);
    }

    const batchSlug = data.batch.slug;
    const spinner = ora("Fetching batch info...").start();
    let res: any;
    try {
      res = await api.getBatch(batchSlug);
    } catch (err) {
      spinner.fail();
      logger.error("Failed to fetch batch info (Network Error)");
      await new Promise((r) => setTimeout(r, 2000));
      return await showEpisodeMenu(slug, data);
    }
    spinner.stop();

    if (res.meta.status && res.data?.download_links?.length > 0) {
      await handleBatch(slug, res.data);
      return await showEpisodeMenu(slug, data);
    } else {
      logger.error("Failed to fetch batch info or no batch links available");
      await new Promise((r) => setTimeout(r, 2000));
      return await showEpisodeMenu(slug, data);
    }
  }

  if (selectedValue === "download") {
    // Pilih episode untuk download
    clearScreen();
    showAnimeDetails(data);
    createHeader("Pilih Episode untuk Download", theme.success);
    logger.br();

    const epChoices = data.episode_list.map((ep: any) => ({
      name: `${ep.title} • ${ep.date || ""}`,
      value: ep.slug,
    }));

    const epAnswer = await askInteractiveEpisode("Pilih episode:", epChoices, () => {
      clearScreen();
      showAnimeDetails(data);
      createHeader("Pilih Episode untuk Download", theme.success);
      logger.br();
    });

    if (epAnswer !== "back" && epAnswer !== "0") {
      const episode = data.episode_list.find((ep: any) => ep.slug === epAnswer);
      if (episode) {
        const epRes: any = await api.getEpisode(episode.slug);
        if (epRes.meta.status && epRes.data) {
          await handleDownload(epRes.data);
        }
      }
    }
    return await showEpisodeMenu(slug, data);
  }

  // Jika memilih episode
  const episode = data.episode_list.find((ep: any) => ep.slug === selectedValue);
  if (episode) {
    const epNum = extractEpisodeNumber(episode.title);
    await handlePlay(slug, epNum.toString(), data);
    await new Promise((r) => setTimeout(r, 2000));
    return await showEpisodeMenu(slug, data);
  }

  logger.warn("Invalid selection");
  await new Promise((r) => setTimeout(r, 1000));
  return await showEpisodeMenu(slug, data);
};

const handlePopularMenu = async (currentPage: number) => {
  const spinner = ora(`Fetching Popular Anime (Page ${currentPage})...`).start();
  let res: any;
  try {
    res = await api.getCompleted(currentPage);
    spinner.stop();
  } catch (err) {
    spinner.fail();
    logger.error("Failed to fetch popular anime");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }

  if (res.meta.status && res.data && res.data.list) {
    const popularList = [...res.data.list].sort((a: any, b: any) => {
      const scoreA = parseFloat(a.rating) || 0;
      const scoreB = parseFloat(b.rating) || 0;
      return scoreB - scoreA;
    });

    const allChoices = [
      ...popularList.map((a: any, i: number) => ({
        name: `${i + 1}. ${a.title} • Score: ${a.rating || "N/A"}`,
        value: a.slug,
      })),
      { name: "──────────────────", value: "separator" },
      { name: "[N] Next Page", value: "next" },
      ...(currentPage > 1 ? [{ name: "[P] Previous Page", value: "prev" }] : []),
      { name: "[←] Back to Home", value: "back" },
    ];

    const answer = await askInteractiveMain("Navigasi:", allChoices, () => {
      clearScreen();
      showBanner();
      createHeader("Anime Populer", theme.primary);
      logger.br();
    });

    if (answer === "back") {
      return await runHome();
    }

    if (answer === "next") {
      return await handlePopularMenu(currentPage + 1);
    }

    if (answer === "prev") {
      if (currentPage > 1) return await handlePopularMenu(currentPage - 1);
      logger.warn("No previous page available");
      return await handlePopularMenu(currentPage);
    }

    await showAnimeDetail(answer);
    return await handlePopularMenu(currentPage);
  } else {
    logger.error("No popular anime found");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }
};

const showAnimeDetail = async (slug: string) => {
  try {
    const res: any = await api.getAnime(slug);
    await showEpisodeMenu(slug, res.data);
  } catch {
    logger.error("Failed to load anime");
  }
};

const handleOngoingMenu = async (currentPage: number) => {
  const spinner = ora(`Fetching Ongoing page ${currentPage}...`).start();
  let res: any;
  try {
    res = await api.getOngoing(currentPage);
    spinner.stop();
  } catch (err) {
    spinner.fail();
    logger.error("Failed to fetch ongoing anime");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }

  if (res.meta.status && res.data && res.data.list) {
    const allChoices = [
      ...res.data.list.map((a: any, i: number) => ({
        name: `${i + 1}. ${a.title} • ${a.day || "N/A"} • ${a.date || "N/A"}`,
        value: a.slug,
      })),
      { name: "──────────────────", value: "separator" },
      { name: "[N] Next Page", value: "next" },
      ...(currentPage > 1 ? [{ name: "[P] Previous Page", value: "prev" }] : []),
      { name: "[←] Back to Home", value: "back" },
    ];

    const answer = await askInteractiveMain("Navigasi:", allChoices, () => {
      clearScreen();
      showBanner();
      createHeader("Ongoing Anime", theme.primary);
      logger.br();
    });

    if (answer === "back") {
      return await runHome();
    }

    if (answer === "next") {
      return await handleOngoingMenu(currentPage + 1);
    }

    if (answer === "prev") {
      if (currentPage > 1) return await handleOngoingMenu(currentPage - 1);
      logger.warn("No previous page available");
      return await handleOngoingMenu(currentPage);
    }

    await showAnimeDetail(answer);
    return await handleOngoingMenu(currentPage);
  } else {
    logger.error("No ongoing anime found");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }
};

const handleCompletedMenu = async (currentPage: number) => {
  const spinner = ora(`Fetching Completed page ${currentPage}...`).start();
  let res: any;
  try {
    res = await api.getCompleted(currentPage);
    spinner.stop();
  } catch (err) {
    spinner.fail();
    logger.error("Failed to fetch completed anime");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }

  if (res.meta.status && res.data && res.data.list) {
    const allChoices = [
      ...res.data.list.map((a: any, i: number) => ({
        name: `${i + 1}. ${a.title} • Episodes: ${a.total_episode || "N/A"} • Score: ${a.rating || "N/A"}`,
        value: a.slug,
      })),
      { name: "──────────────────", value: "separator" },
      { name: "[N] Next Page", value: "next" },
      ...(currentPage > 1 ? [{ name: "[P] Previous Page", value: "prev" }] : []),
      { name: "[←] Back to Home", value: "back" },
    ];

    const answer = await askInteractiveMain("Navigasi:", allChoices, () => {
      clearScreen();
      showBanner();
      createHeader("Completed Anime", theme.primary);
      logger.br();
    });

    if (answer === "back") {
      return await runHome();
    }

    if (answer === "next") {
      return await handleCompletedMenu(currentPage + 1);
    }

    if (answer === "prev") {
      if (currentPage > 1) return await handleCompletedMenu(currentPage - 1);
      logger.warn("No previous page available");
      return await handleCompletedMenu(currentPage);
    }

    await showAnimeDetail(answer);
    return await handleCompletedMenu(currentPage);
  } else {
    logger.error("No completed anime found");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }
};

const handleSearch = async () => {
  clearScreen();
  createHeader("Search Anime", theme.secondary);
  logger.br();
  const keyword = await ask("Enter keyword (e.g. Naruto):");
  if (!keyword) {
    logger.warn("Keyword cannot be empty");
    return await runHome();
  }

  const spinner = ora("Searching...").start();
  let res: any;
  try {
    res = await api.getSearch(keyword);
    spinner.stop();
  } catch (err) {
    spinner.fail();
    logger.error("Network error or server issue (500).");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }

  if (res.meta.status && res.data && res.data.list && res.data.list.length > 0) {
    const allChoices = [
      ...res.data.list.map((a: any, i: number) => ({
        name: `${i + 1}. ${a.title} • Status: ${a.status} • Score: ${a.rating || "N/A"}`,
        value: a.slug,
      })),
      { name: "──────────────────", value: "separator" },
      { name: "[←] Back to Home", value: "back" },
    ];

    const answer = await askInteractiveSearch("Pilih:", allChoices, () => {
      clearScreen();
      showBanner();
      createHeader("Hasil Search", theme.secondary);
      logger.br();
    });

    if (answer === "back") return await runHome();

    await showAnimeDetail(answer);
  } else {
    logger.error("No anime found");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }
};

const handleGenreMenu = async () => {
  clearScreen();
  createHeader("Pilih Genre", theme.warning);
  logger.br();

  const spinner = ora("Fetching genres...").start();
  let res: any;
  try {
    res = await api.getGenre();
    spinner.stop();
  } catch (err) {
    spinner.fail();
    logger.error("Failed to fetch genres");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }

  if (res.meta.status && res.data && res.data.list) {
    const allChoices = [
      ...res.data.list.map((g: any) => ({
        name: g.name,
        value: g.slug,
      })),
      { name: "──────────────────", value: "separator" },
      { name: "[←] Back to Home", value: "back" },
    ];

    const answer = await askInteractiveGenre("Pilih:", allChoices, () => {
      clearScreen();
      showBanner();
      createHeader("Pilih Genre", theme.warning);
      logger.br();
    });

    if (answer === "back") return await runHome();

    await handleGenreAnimeList("", answer, 1); // genreName tidak digunakan, biarkan kosong
  } else {
    logger.error("Failed to fetch genres");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }
};

const handleGenreAnimeList = async (genreTitle: string, genreSlug: string, currentPage: number) => {
  const spinner = ora(`Fetching page ${currentPage}...`).start();
  let res: any;
  try {
    res = await api.getGenreAnime(genreSlug, currentPage);
    spinner.stop();
  } catch (err) {
    spinner.fail();
    logger.error("Network error or server issue (500).");
    await new Promise((r) => setTimeout(r, 2000));
    return await handleGenreMenu();
  }

  if (res.meta.status && res.data && res.data.list) {
    const allChoices = [
      ...res.data.list.map((a: any, i: number) => ({
        name: `${i + 1}. ${a.title} • Episodes: ${a.episode || "N/A"} • Score: ${a.rating || "N/A"}`,
        value: a.slug,
      })),
      { name: "──────────────────", value: "separator" },
      { name: "[N] Next Page", value: "next" },
      ...(currentPage > 1 ? [{ name: "[P] Previous Page", value: "prev" }] : []),
      { name: "[←] Back to Genre List", value: "back" },
    ];

    const answer = await askInteractiveGenre("Navigasi:", allChoices, () => {
      clearScreen();
      showBanner();
      createHeader(`Genre: ${genreSlug}`, theme.warning);
      logger.br();
    });

    if (answer === "back") {
      return await handleGenreMenu();
    }

    if (answer === "next") {
      return await handleGenreAnimeList(genreTitle, genreSlug, currentPage + 1);
    }

    if (answer === "prev") {
      if (currentPage > 1) return await handleGenreAnimeList(genreTitle, genreSlug, currentPage - 1);
      logger.warn("No previous page available");
      return await handleGenreAnimeList(genreTitle, genreSlug, currentPage);
    }

    await showAnimeDetail(answer);
  } else {
    logger.error("No anime found for this genre");
    await new Promise((r) => setTimeout(r, 2000));
    return await handleGenreMenu();
  }
};

const handleSchedule = async () => {
  const spinner = ora("Fetching schedule...").start();
  let res: any;
  try {
    res = await api.getSchedule();
    spinner.stop();
  } catch (err) {
    spinner.fail();
    logger.error("Failed to fetch schedule");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }

  if (res.meta.status && res.data) {
    const scheduleList = Object.keys(res.data).map((key) => ({
      day: key.charAt(0).toUpperCase() + key.slice(1),
      anime_list: res.data[key],
    }));

    const allChoices = [
      ...scheduleList.map((day, i) => ({
        name: `${i + 1}. ${day.day} (${day.anime_list.length} anime)`,
        value: day.day,
      })),
      { name: "──────────────────", value: "separator" },
      { name: "[←] Back to Home", value: "back" },
    ];

    const answer = await askInteractiveSchedule("Pilih hari:", allChoices, () => {
      clearScreen();
      showBanner();
      createHeader("Anime Schedule", theme.warning);
      logger.br();
    });

    if (answer === "back") return await runHome();

    const dayData = scheduleList.find(d => d.day.toLowerCase() === answer.toLowerCase());
    if (dayData) {
      const animeChoices = [
        ...dayData.anime_list.map((a: any, i: number) => ({
          name: `${i + 1}. ${a.title}`,
          value: a.slug,
        })),
        { name: "──────────────────", value: "separator" },
        { name: "[←] Back to Schedule", value: "back" },
      ];

      const animeAnswer = await askInteractiveSchedule("Pilih anime:", animeChoices, () => {
        clearScreen();
        showBanner();
        createHeader(`Schedule: ${dayData.day}`, theme.warning);
        logger.br();
      });

      if (animeAnswer !== "back") {
        await showAnimeDetail(animeAnswer);
        return await handleSchedule();
      } else {
        return await handleSchedule();
      }
    } else {
      logger.warn("Day not found");
      return await handleSchedule();
    }
  } else {
    logger.error("Failed to fetch schedule (API Error or Invalid Data)");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }
};

const handleFAQ = async () => {
  clearScreen();
  createHeader("Frequently Asked Questions", theme.warning);
  printFAQ();

  const answer = await ask("Perintah:");
  const choice = answer.toLowerCase();

  if (choice === "back" || choice === "0") {
    return await runHome();
  }

  logger.warn("Invalid command, returning to home...");
  await new Promise((r) => setTimeout(r, 500));
  return await runHome();
};

const handleWatchHistory = async () => {
  clearScreen();
  showBanner();
  createHeader("Riwayat Tontonan", theme.secondary);

  const history = loadHistory();
  printWatchHistory(history);
  logger.br();

  if (history.length === 0) {
    logger.muted("Belum ada riwayat tontonan.");
    logger.br();
    const answer = await ask("Ketik 'back' untuk kembali: ");
    if (answer.toLowerCase() === "back") {
      return await runHome();
    }
    return;
  }

  const allChoices = [
    ...history.map((item, i) => ({
      name: `${i + 1}. ${item.animeTitle} • Ep ${item.episode} • ${new Date(item.timestamp).toLocaleDateString()}`,
      value: item.slug + "|" + item.episode,
    })),
    { name: "──────────────────", value: "separator" },
    { name: "[C] Clear All History", value: "clear" },
    { name: "[R] Clear All Resume", value: "clear-resume" },
    { name: "[←] Back to Home", value: "back" },
  ];

  const answer = await askInteractiveHistory("Aksi:", allChoices, () => {
    clearScreen();
    showBanner();
    createHeader("Riwayat Tontonan", theme.secondary);
    printWatchHistory(history);
    logger.br();
  });

  if (answer === "back") {
    return await runHome();
  }

  if (answer === "clear") {
    clearHistory();
    await new Promise((r) => setTimeout(r, 2000));
    return await handleWatchHistory();
  }

  if (answer === "clear-resume") {
    clearResume();
    await new Promise((r) => setTimeout(r, 2000));
    return await handleWatchHistory();
  }

  // Jika memilih item untuk replay
  if (answer.includes("|")) {
    const [slug, ep] = answer.split("|");
    logger.info(`Memutar ulang: ${slug} - Ep ${ep}`);
    await handlePlay(slug, ep);
    await new Promise((r) => setTimeout(r, 2000));
    return await handleWatchHistory();
  }

  logger.warn("Pilihan tidak valid");
  await new Promise((r) => setTimeout(r, 1000));
  return await handleWatchHistory();
};

const runHome = async () => {
  const answer = await askInteractiveHome("Navigasi:", [
    { name: "1. Ongoing Anime", value: "1" },
    { name: "2. Completed Anime", value: "2" },
    { name: "3. Popular Anime", value: "3" },
    { name: "4. Search Anime", value: "4" },
    { name: "5. Search by Genre", value: "5" },
    { name: "6. Schedule Anime", value: "6" },
    { name: "7. History Anime", value: "7" },
    { name: "8. FAQ", value: "8" },
  ], () => {
    clearScreen();
    showBanner();
    createHeader("Main Menu", theme.secondary);
    logger.br();
  });

  if (answer === "1") {
    await handleOngoingMenu(1);
  } else if (answer === "2") {
    await handleCompletedMenu(1);
  } else if (answer === "3") {
    await handlePopularMenu(1);
  } else if (answer === "4") {
    await handleSearch();
  } else if (answer === "5") {
    await handleGenreMenu();
  } else if (answer === "6") {
    await handleSchedule();
  } else if (answer === "7") {
    await handleWatchHistory();
  } else if (answer === "8") {
    await handleFAQ();
  } else {
    logger.warn("Invalid choice");
    await new Promise((r) => setTimeout(r, 1000));
    await runHome();
  }
};

program.command("home").description("Launch interactive menu").action(runHome);

program
  .command("play <slug> <episode>")
  .description("Play episode directly")
  .option("-p, --player <path>", "Player path")
  .option("-a, --args <args>", "Player arguments")
  .action(async (slug, ep) => {
    clearScreen();
    showBanner();
    await handlePlay(slug, ep);
  });

program
  .command("config [action] [key] [value]")
  .description("Manage configuration")
  .action((action = "show", key, value) => {
    const config = loadConfig();
    if (action === "set" && key && value) {
      if (key === "player" || key === "playerPath" || key === "playerArgs") {
        (config as any)[key] = value;
        saveConfig(config);
        logger.success(`${key} = ${value}`);
      } else {
        logger.error("Invalid key");
      }
    } else {
      console.log(JSON.stringify(config, null, 2));
      logger.info(`Config: ${getConfigPath()}`);
    }
  });

program
  .command("cache <cmd>")
  .description("Cache management")
  .action((cmd) => {
    if (cmd === "clear") api.clearCache();
    else logger.info("Usage: anichi cache clear");
  });

program.parse();