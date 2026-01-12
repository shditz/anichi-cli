import chalk from "chalk";
import ora from "ora";
import {Command} from "commander";
import readline from "readline";
import open from "open";
import api from "./api";
import {playUrl} from "./player";
import {loadConfig, saveConfig, getConfigPath} from "./config";
import {
  clearScreen,
  showBanner,
  createHeader,
  logger,
  printAnimeList,
  printEpisodeList,
  showMenu,
  showAnimeDetails,
  printQualityOptions,
  printDownloadOptions,
  printBatchFormats,
  printBatchQualities,
  printBatchProviders,
  printSearchResults,
  printSchedule,
  printGenreList,
  printGenreAnimeList,
  printPaginationControls,
  printFAQ,
} from "./ui";
import {AnimeDetailData} from "./types";

const program = new Command();
program.name("anichi").description("Anime streaming for CLI").version("2.6.2");

const ask = (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(chalk.hex("#00d9ff")(`  ${query} `), (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
};

const resolveEpisode = (eps: number | "latest", list: any[]) => {
  if (eps === "latest") return list[0];
  return list.find((e) => e.eps === eps || e.episode === eps);
};

const tryGetServer = async (serverId: string): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://www.sankavollerei.com/anime/server/${serverId}`, {
      signal: controller.signal,
    }).then((r) => r.json());
    clearTimeout(timeoutId);
    if (res.status === "success" && res.data?.url) {
      return res.data.url;
    }
    return null;
  } catch {
    return null;
  }
};

const handleBatch = async (animeId: string, batchData: any) => {
  clearScreen();

  if (!batchData?.downloadUrl?.formats || batchData.downloadUrl.formats.length === 0) {
    logger.error("No batch download links available");
    await new Promise((r) => setTimeout(r, 2000));
    return;
  }

  const formats = batchData.downloadUrl.formats;

  createHeader("Download Batch", "#00ff9f");
  printBatchFormats(formats);
  logger.br();
  logger.muted("  Pilih format (1-" + formats.length + ") atau 'back'\n");

  const ansFormat = await ask("Format:");
  const fmtChoice = ansFormat.toLowerCase();

  if (fmtChoice === "back" || fmtChoice === "0") return;

  const fIndex = parseInt(fmtChoice) - 1;
  if (isNaN(fIndex) || fIndex < 0 || fIndex >= formats.length) {
    logger.warn("Invalid selection");
    await new Promise((r) => setTimeout(r, 1000));
    return await handleBatch(animeId, batchData);
  }

  const selectedFormat = formats[fIndex];

  clearScreen();
  createHeader(`Pilih Quality (${selectedFormat.title})`, "#00ff9f");
  printBatchQualities(selectedFormat.qualities);
  logger.br();
  logger.muted("  Pilih kualitas (1-" + selectedFormat.qualities.length + ") atau 'back'\n");

  const ansQuality = await ask("Kualitas:");
  const qChoice = ansQuality.toLowerCase();

  if (qChoice === "back" || qChoice === "0") return await handleBatch(animeId, batchData);

  const qIndex = parseInt(qChoice) - 1;
  if (isNaN(qIndex) || qIndex < 0 || qIndex >= selectedFormat.qualities.length) {
    logger.warn("Invalid selection");
    await new Promise((r) => setTimeout(r, 1000));
    return await handleBatch(animeId, batchData);
  }

  const selectedQuality = selectedFormat.qualities[qIndex];

  clearScreen();
  createHeader(`Pilih Provider (${selectedQuality.title})`, "#00ff9f");
  printBatchProviders(selectedQuality.urls);
  logger.br();
  logger.muted("  Pilih provider (1-" + selectedQuality.urls.length + ") atau 'back'\n");

  const ansProv = await ask("Provider:");
  const pChoice = ansProv.toLowerCase();

  if (pChoice === "back" || pChoice === "0") return await handleBatch(animeId, batchData);

  const pIndex = parseInt(pChoice) - 1;
  if (isNaN(pIndex) || pIndex < 0 || pIndex >= selectedQuality.urls.length) {
    logger.warn("Invalid selection");
    await new Promise((r) => setTimeout(r, 1000));
    return await handleBatch(animeId, batchData);
  }

  const provider = selectedQuality.urls[pIndex];
  logger.info(`Opening ${provider.title}...`);
  await open(provider.url);
  await new Promise((r) => setTimeout(r, 2000));
};

const selectQuality = async (qualities: any[]): Promise<any | null> => {
  clearScreen();
  createHeader("Pilih Quality", "#ff6b9d");
  printQualityOptions(qualities);
  logger.br();
  logger.muted("  Pilih kualitas (1-" + qualities.length + ") atau 'back'\n");

  const answer = await ask("Kualitas:");
  const choice = answer.toLowerCase();

  if (choice === "back" || choice === "0") return null;

  const index = parseInt(choice) - 1;
  if (!isNaN(index) && index >= 0 && index < qualities.length) {
    return qualities[index];
  }

  logger.warn("Invalid selection");
  await new Promise((r) => setTimeout(r, 1000));
  return await selectQuality(qualities);
};

const handleDownload = async (episodeData: any) => {
  const downloads = episodeData.downloadUrl?.qualities || [];

  if (downloads.length === 0) {
    logger.error("No download links available");
    return;
  }

  clearScreen();
  createHeader("Download Episode", "#00ff9f");
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
  createHeader(`Download ${selected.title} (${selected.size})`, "#00ff9f");

  selected.urls.forEach((provider: any, idx: number) => {
    const num = chalk.hex("#00ff9f").bold(`  [${idx + 1}]`);
    console.log(`${num} ${chalk.white(provider.title)}`);
  });

  logger.br();
  logger.muted("  Pilih provider (1-" + selected.urls.length + ") atau 'back'\n");

  const provAnswer = await ask("Provider:");
  const provChoice = provAnswer.toLowerCase();

  if (provChoice === "back" || provChoice === "0") return await handleDownload(episodeData);

  const pIndex = parseInt(provAnswer) - 1;
  if (isNaN(pIndex) || pIndex < 0 || pIndex >= selected.urls.length) {
    logger.warn("Invalid selection");
    await new Promise((r) => setTimeout(r, 1000));
    return await handleDownload(episodeData);
  }

  const provider = selected.urls[pIndex];
  logger.info(`Opening ${provider.title}...`);
  await open(provider.url);
  await new Promise((r) => setTimeout(r, 2000));
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
    const episode = resolveEpisode(epsNum, data.episodeList);

    if (!episode) {
      logger.error(`Episode ${episodeStr} not found`);
      return false;
    }

    let epRes: any;
    epRes = await api.getEpisode(episode.episodeId);

    if ((!epRes.ok && epRes.status !== "success") || !epRes.data) {
      logger.error("Failed to fetch episode data");
      return false;
    }

    let qualities: any[] = [];
    let defaultUrl = "";

    qualities = epRes.data.server?.qualities || [];
    defaultUrl = epRes.data.defaultStreamingUrl || "";

    if (qualities.length === 0) {
      logger.warn("No streaming qualities available");
      if (defaultUrl) {
        logger.info("Opening default stream in browser...");
        await open(defaultUrl);
        return true;
      }
      return false;
    }

    const selectedQuality = await selectQuality(qualities);
    if (!selectedQuality) return false;

    clearScreen();
    logger.info(`Playing: ${episode.title}`);
    logger.info(`Quality: ${selectedQuality.title}`);

    let url: string | null = null;

    for (const server of selectedQuality.serverList) {
      logger.info(`Trying ${server.title}...`);
      url = await tryGetServer(server.serverId);
      if (url) {
        if (url.includes("filedon.co") || url.includes("vidhide")) {
          logger.warn(`${server.title} unsupported (Embed detected), skipping...`);
          continue;
        }
        break;
      }
    }

    if (!url) {
      logger.warn("No working server found, using default...");
      url = defaultUrl;
    }

    if (!url) {
      logger.error("No stream URL available");
      return false;
    }

    if (url.includes("/embed/") || url.includes("player")) {
      logger.info("Opening browser player...");
      await open(url);
      await new Promise((r) => setTimeout(r, 1000));
      return true;
    }

    const playerPath = config.player || config.playerPath;
    const args = config.playerArgs ? config.playerArgs.split(" ") : [];

    const success = await playUrl(url, playerPath, args, false);

    return success;
  } catch (err: any) {
    logger.error(`Playback failed: ${err.message}`);
    return false;
  }
};

const showEpisodeMenu = async (slug: string, data: any) => {
  clearScreen();
  showAnimeDetails(data);
  createHeader("Episodes", "#ff6b9d");
  printEpisodeList(data.episodeList);
  logger.br();

  logger.muted("  Perintah:");
  logger.muted("  • [nomor] atau 'latest' - Tonton episode");
  if (data.batch) logger.muted("  • 'b' atau 'batch' - Download batch");
  logger.muted("  • 'd' atau 'download' - Download episode");
  logger.muted("  • 'back' - Kembali ke daftar anime\n");

  const answer = await ask("Perintah:");
  const choice = answer.toLowerCase();

  if (choice === "back" || choice === "0") return;

  if (choice === "b" || choice === "batch") {
    if (!data.batch) {
      logger.error("No batch download available for this anime");
      await new Promise((r) => setTimeout(r, 2000));
      return await showEpisodeMenu(slug, data);
    }

    const batchId = data.batch.batchId;
    const spinner = ora("Fetching batch info...").start();
    let res: any;
    try {
      res = await api.getBatch(batchId);
    } catch (err) {
      spinner.fail();
      logger.error("Failed to fetch batch info (Network Error)");
      await new Promise((r) => setTimeout(r, 2000));
      return await showEpisodeMenu(slug, data);
    }
    spinner.stop();

    if (res.ok && res.data && res.data.downloadUrl && res.data.downloadUrl.formats.length > 0) {
      await handleBatch(slug, res.data);
      return await showEpisodeMenu(slug, data);
    } else {
      logger.error("Failed to fetch batch info or no batch links available");
      await new Promise((r) => setTimeout(r, 2000));
      return await showEpisodeMenu(slug, data);
    }
  }

  if (choice === "d" || choice === "download") {
    clearScreen();
    createHeader("Pilih Episode untuk Download", "#00ff9f");
    printEpisodeList(data.episodeList);
    logger.br();
    logger.muted("  Ketik nomor episode atau 'back'\n");

    const epAnswer = await ask("Episode:");
    const epChoice = epAnswer.toLowerCase();

    if (epChoice !== "back" && epChoice !== "0") {
      const epNum = parseInt(epAnswer);
      if (!isNaN(epNum) || epChoice === "latest") {
        const episode = resolveEpisode(epChoice === "latest" ? "latest" : epNum, data.episodeList);
        if (episode) {
          let epRes: any;
          epRes = await api.getEpisode(episode.episodeId);

          if (epRes.ok && epRes.data) {
            await handleDownload(epRes.data);
          }
        }
      }
    }
    return await showEpisodeMenu(slug, data);
  }

  const epNum = parseInt(choice);
  if (!isNaN(epNum) || choice === "latest") {
    await handlePlay(slug, isNaN(epNum) ? "latest" : String(epNum), data);
    await new Promise((r) => setTimeout(r, 2000));
    return await showEpisodeMenu(slug, data);
  }

  logger.warn("Invalid input");
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

  if (res.ok && res.data && res.data.animeList) {
    const popularList = [...res.data.animeList].sort((a: any, b: any) => {
      const scoreA = parseFloat(a.score) || 0;
      const scoreB = parseFloat(b.score) || 0;
      return scoreB - scoreA;
    });

    clearScreen();
    createHeader("Anime Populer", "#00d9ff");
    printAnimeList(popularList, false);

    printPaginationControls(res.pagination, "Anime Populer", true);

    const answer = await ask("Perintah:");
    const choice = answer.toLowerCase();

    if (choice === "b" || choice === "back") {
      return await runHome();
    }

    if (choice === "n" || choice === "next") {
      if (res.pagination.hasNextPage) {
        return await handlePopularMenu(res.pagination.nextPage);
      } else {
        logger.warn("No next page available");
        return await handlePopularMenu(currentPage);
      }
    }

    if (choice === "p" || choice === "prev") {
      if (res.pagination.hasPrevPage) {
        return await handlePopularMenu(res.pagination.prevPage);
      } else {
        logger.warn("No previous page available");
        return await handlePopularMenu(currentPage);
      }
    }

    const index = parseInt(choice) - 1;
    if (!isNaN(index) && index >= 0 && index < popularList.length) {
      await showAnimeDetail(popularList[index].animeId);
      return await handlePopularMenu(currentPage);
    } else {
      logger.warn("Invalid selection");
      return await handlePopularMenu(currentPage);
    }
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

  if (res.ok && res.data && res.data.animeList) {
    clearScreen();
    createHeader("Ongoing Anime", "#00d9ff");
    printAnimeList(res.data.animeList, true);

    printPaginationControls(res.pagination, "Ongoing Anime", true);

    const answer = await ask("Perintah:");
    const choice = answer.toLowerCase();

    if (choice === "b" || choice === "back") {
      return await runHome();
    }

    if (choice === "n" || choice === "next") {
      if (res.pagination.hasNextPage) {
        return await handleOngoingMenu(res.pagination.nextPage);
      } else {
        logger.warn("No next page available");
        return await handleOngoingMenu(currentPage);
      }
    }

    if (choice === "p" || choice === "prev") {
      if (res.pagination.hasPrevPage) {
        return await handleOngoingMenu(res.pagination.prevPage);
      } else {
        logger.warn("No previous page available");
        return await handleOngoingMenu(currentPage);
      }
    }

    const index = parseInt(choice) - 1;
    if (!isNaN(index) && index >= 0 && index < res.data.animeList.length) {
      await showAnimeDetail(res.data.animeList[index].animeId);
      return await handleOngoingMenu(currentPage);
    } else {
      logger.warn("Invalid selection");
      return await handleOngoingMenu(currentPage);
    }
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

  if (res.ok && res.data && res.data.animeList) {
    clearScreen();
    createHeader("Completed Anime", "#00d9ff");
    printAnimeList(res.data.animeList, false);

    printPaginationControls(res.pagination, "Completed Anime", true);

    const answer = await ask("Perintah:");
    const choice = answer.toLowerCase();

    if (choice === "b" || choice === "back") {
      return await runHome();
    }

    if (choice === "n" || choice === "next") {
      if (res.pagination.hasNextPage) {
        return await handleCompletedMenu(res.pagination.nextPage);
      } else {
        logger.warn("No next page available");
        return await handleCompletedMenu(currentPage);
      }
    }

    if (choice === "p" || choice === "prev") {
      if (res.pagination.hasPrevPage) {
        return await handleCompletedMenu(res.pagination.prevPage);
      } else {
        logger.warn("No previous page available");
        return await handleCompletedMenu(currentPage);
      }
    }

    const index = parseInt(choice) - 1;
    if (!isNaN(index) && index >= 0 && index < res.data.animeList.length) {
      await showAnimeDetail(res.data.animeList[index].animeId);
      return await handleCompletedMenu(currentPage);
    } else {
      logger.warn("Invalid selection");
      return await handleCompletedMenu(currentPage);
    }
  } else {
    logger.error("No completed anime found");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }
};

const handleSearch = async () => {
  clearScreen();
  createHeader("Search Anime", "#ff6b9d");
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

  if (res.ok && res.data && res.data.animeList && res.data.animeList.length > 0) {
    clearScreen();
    createHeader("Hasil Search", "#ff6b9d");
    printSearchResults(res.data.animeList);
    logger.br();
    logger.muted(`  Pilih anime (1-${res.data.animeList.length}) atau 'back'\n`);

    const answer = await ask("Pilih:");
    const choice = answer.toLowerCase();

    if (choice === "back" || choice === "0") return await runHome();

    const index = parseInt(choice) - 1;
    if (!isNaN(index) && index >= 0 && index < res.data.animeList.length) {
      await showAnimeDetail(res.data.animeList[index].animeId);
    } else {
      logger.warn("Invalid selection");
      await new Promise((r) => setTimeout(r, 1000));
      return await handleSearch();
    }
  } else {
    logger.error("No anime found");
    await new Promise((r) => setTimeout(r, 2000));
    return await runHome();
  }
};

const handleGenreMenu = async () => {
  clearScreen();
  createHeader("Pilih Genre", "#ffaa00");
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

  if (res.ok && res.data && res.data.genreList) {
    clearScreen();
    createHeader("Pilih Genre", "#ffaa00");
    logger.br();
    printGenreList(res.data.genreList);
    logger.br();
    logger.muted(`  Pilih genre (1-${res.data.genreList.length}) atau 'back'\n`);

    const answer = await ask("Pilih:");
    const choice = answer.toLowerCase();

    if (choice === "back" || choice === "0") return await runHome();

    const index = parseInt(choice) - 1;
    if (!isNaN(index) && index >= 0 && index < res.data.genreList.length) {
      const selectedGenre = res.data.genreList[index];
      await handleGenreAnimeList(selectedGenre.title, selectedGenre.genreId, 1);
    } else {
      logger.warn("Invalid selection");
      return await handleGenreMenu();
    }
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

  if (res.ok && res.data && res.data.animeList) {
    clearScreen();
    createHeader(`Genre: ${genreTitle}`, "#ffaa00");
    logger.br();
    printGenreAnimeList(res.data.animeList);

    printPaginationControls(res.pagination, `: ${genreTitle}`, true);

    const answer = await ask("Perintah:");
    const choice = answer.toLowerCase();

    if (choice === "b" || choice === "back") {
      return await handleGenreMenu();
    }

    if (choice === "n" || choice === "next") {
      if (res.pagination.hasNextPage) {
        return await handleGenreAnimeList(genreTitle, genreSlug, res.pagination.nextPage);
      } else {
        logger.warn("No next page available");
        return await handleGenreAnimeList(genreTitle, genreSlug, currentPage);
      }
    }

    if (choice === "p" || choice === "prev") {
      if (res.pagination.hasPrevPage) {
        return await handleGenreAnimeList(genreTitle, genreSlug, res.pagination.prevPage);
      } else {
        logger.warn("No previous page available");
        return await handleGenreAnimeList(genreTitle, genreSlug, currentPage);
      }
    }

    const index = parseInt(choice) - 1;
    if (!isNaN(index) && index >= 0 && index < res.data.animeList.length) {
      await showAnimeDetail(res.data.animeList[index].animeId);
    } else {
      logger.warn("Invalid selection");
      return await handleGenreAnimeList(genreTitle, genreSlug, currentPage);
    }
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

  if (res && res.status === "success" && res.data) {
    clearScreen();
    createHeader("Anime Schedule", "#ffaa00");
    printSchedule(res.data);
    logger.br();
    logger.muted("  Perintah:");
    logger.muted("  • [nomor] - Pilih hari (1-Minggu)");
    logger.muted("  • [hari] - Filter berdasarkan hari (e.g. Senin, Selasa)");
    logger.muted("  • 'back' - Kembali ke home\n");

    const answer = await ask("Perintah:");
    const choice = answer.toLowerCase();

    if (choice === "back" || choice === "0") return await runHome();

    const index = parseInt(choice);

    if (!isNaN(index) && index >= 1 && index <= res.data.length) {
      const selectedDay = res.data[index - 1];

      clearScreen();
      createHeader(`Schedule: ${selectedDay.day}`, "#ffaa00");
      printSchedule([selectedDay]);
      logger.br();

      if (selectedDay.anime_list && selectedDay.anime_list.length > 0) {
        logger.muted(`  Pilih anime (1-${selectedDay.anime_list.length}) atau 'back'\n`);
        const ansAnime = await ask("Pilih:");
        const aChoice = ansAnime.toLowerCase();

        if (aChoice === "back" || aChoice === "0") return await handleSchedule();

        const aIndex = parseInt(aChoice) - 1;
        if (!isNaN(aIndex) && aIndex >= 0 && aIndex < selectedDay.anime_list.length) {
          await showAnimeDetail(selectedDay.anime_list[aIndex].slug);
          return await handleSchedule();
        }
      } else {
        logger.warn("No anime scheduled for this day");
        return await handleSchedule();
      }
    }

    const dayData = res.data.find((d: any) => d.day.toLowerCase() === choice);

    if (dayData) {
      clearScreen();
      createHeader(`Schedule: ${dayData.day}`, "#ffaa00");
      printSchedule([dayData]);
      logger.br();
      logger.muted(`  Pilih anime (1-${dayData.anime_list.length}) atau 'back'\n`);

      const ansAnime = await ask("Pilih:");
      const aChoice = ansAnime.toLowerCase();

      if (aChoice === "back" || aChoice === "0") return await handleSchedule();

      const aIndex = parseInt(aChoice) - 1;
      if (!isNaN(aIndex) && aIndex >= 0 && aIndex < dayData.anime_list.length) {
        await showAnimeDetail(dayData.anime_list[aIndex].slug);
        return await handleSchedule();
      } else {
        logger.warn("Invalid selection");
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
  createHeader("Frequently Asked Questions", "#ffaa00");
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

const runHome = async () => {
  clearScreen();
  showBanner();
  createHeader("Main Menu", "#ff6b9d");
  logger.br();
  showMenu([
    "Ongoing Anime",
    "Completed Anime",
    "Popular Anime",
    "Search Anime",
    "Search by Genre",
    "Schedule Anime",
    "FAQ",
  ]);

  const answer = await ask("Pilih:");

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
      if (key === "player" || key === "playerArgs") {
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
