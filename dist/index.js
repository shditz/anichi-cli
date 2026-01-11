"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const commander_1 = require("commander");
const readline_1 = __importDefault(require("readline"));
const open_1 = __importDefault(require("open"));
const api_1 = __importDefault(require("./api"));
const player_1 = require("./player");
const config_1 = require("./config");
const ui_1 = require("./ui");
const program = new commander_1.Command();
program.name("anichi").description("Anime streaming for CLI").version("2.6.2");
const ask = (query) => {
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => rl.question(chalk_1.default.hex("#00d9ff")(`  ${query} `), (ans) => {
        rl.close();
        resolve(ans.trim());
    }));
};
const resolveEpisode = (eps, list) => {
    if (eps === "latest")
        return list[0];
    return list.find((e) => e.eps === eps || e.episode === eps);
};
const tryGetServer = async (serverId) => {
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
    }
    catch {
        return null;
    }
};
const handleBatch = async (animeId, batchData) => {
    (0, ui_1.clearScreen)();
    if (!batchData?.downloadUrl?.formats || batchData.downloadUrl.formats.length === 0) {
        ui_1.logger.error("No batch download links available");
        await new Promise((r) => setTimeout(r, 2000));
        return;
    }
    const formats = batchData.downloadUrl.formats;
    (0, ui_1.createHeader)("Download Batch", "#00ff9f");
    (0, ui_1.printBatchFormats)(formats);
    ui_1.logger.br();
    ui_1.logger.muted("  Pilih format (1-" + formats.length + ") atau 'back'\n");
    const ansFormat = await ask("Format:");
    const fmtChoice = ansFormat.toLowerCase();
    if (fmtChoice === "back" || fmtChoice === "0")
        return;
    const fIndex = parseInt(fmtChoice) - 1;
    if (isNaN(fIndex) || fIndex < 0 || fIndex >= formats.length) {
        ui_1.logger.warn("Invalid selection");
        await new Promise((r) => setTimeout(r, 1000));
        return await handleBatch(animeId, batchData);
    }
    const selectedFormat = formats[fIndex];
    (0, ui_1.clearScreen)();
    (0, ui_1.createHeader)(`Pilih Quality (${selectedFormat.title})`, "#00ff9f");
    (0, ui_1.printBatchQualities)(selectedFormat.qualities);
    ui_1.logger.br();
    ui_1.logger.muted("  Pilih kualitas (1-" + selectedFormat.qualities.length + ") atau 'back'\n");
    const ansQuality = await ask("Kualitas:");
    const qChoice = ansQuality.toLowerCase();
    if (qChoice === "back" || qChoice === "0")
        return await handleBatch(animeId, batchData);
    const qIndex = parseInt(qChoice) - 1;
    if (isNaN(qIndex) || qIndex < 0 || qIndex >= selectedFormat.qualities.length) {
        ui_1.logger.warn("Invalid selection");
        await new Promise((r) => setTimeout(r, 1000));
        return await handleBatch(animeId, batchData);
    }
    const selectedQuality = selectedFormat.qualities[qIndex];
    (0, ui_1.clearScreen)();
    (0, ui_1.createHeader)(`Pilih Provider (${selectedQuality.title})`, "#00ff9f");
    (0, ui_1.printBatchProviders)(selectedQuality.urls);
    ui_1.logger.br();
    ui_1.logger.muted("  Pilih provider (1-" + selectedQuality.urls.length + ") atau 'back'\n");
    const ansProv = await ask("Provider:");
    const pChoice = ansProv.toLowerCase();
    if (pChoice === "back" || pChoice === "0")
        return await handleBatch(animeId, batchData);
    const pIndex = parseInt(pChoice) - 1;
    if (isNaN(pIndex) || pIndex < 0 || pIndex >= selectedQuality.urls.length) {
        ui_1.logger.warn("Invalid selection");
        await new Promise((r) => setTimeout(r, 1000));
        return await handleBatch(animeId, batchData);
    }
    const provider = selectedQuality.urls[pIndex];
    ui_1.logger.info(`Opening ${provider.title}...`);
    await (0, open_1.default)(provider.url);
    await new Promise((r) => setTimeout(r, 2000));
};
const selectQuality = async (qualities) => {
    (0, ui_1.clearScreen)();
    (0, ui_1.createHeader)("Pilih Quality", "#ff6b9d");
    (0, ui_1.printQualityOptions)(qualities);
    ui_1.logger.br();
    ui_1.logger.muted("  Pilih kualitas (1-" + qualities.length + ") atau 'back'\n");
    const answer = await ask("Kualitas:");
    const choice = answer.toLowerCase();
    if (choice === "back" || choice === "0")
        return null;
    const index = parseInt(choice) - 1;
    if (!isNaN(index) && index >= 0 && index < qualities.length) {
        return qualities[index];
    }
    ui_1.logger.warn("Invalid selection");
    await new Promise((r) => setTimeout(r, 1000));
    return await selectQuality(qualities);
};
const handleDownload = async (episodeData) => {
    const downloads = episodeData.downloadUrl?.qualities || [];
    if (downloads.length === 0) {
        ui_1.logger.error("No download links available");
        return;
    }
    (0, ui_1.clearScreen)();
    (0, ui_1.createHeader)("Download Episode", "#00ff9f");
    (0, ui_1.printDownloadOptions)(downloads);
    ui_1.logger.br();
    ui_1.logger.muted("  Pilih kualitas (1-" + downloads.length + ") atau 'back'\n");
    const answer = await ask("Kualitas:");
    const choice = answer.toLowerCase();
    if (choice === "back" || choice === "0")
        return;
    const qIndex = parseInt(choice) - 1;
    if (isNaN(qIndex) || qIndex < 0 || qIndex >= downloads.length) {
        ui_1.logger.warn("Invalid selection");
        await new Promise((r) => setTimeout(r, 1000));
        return await handleDownload(episodeData);
    }
    const selected = downloads[qIndex];
    (0, ui_1.clearScreen)();
    (0, ui_1.createHeader)(`Download ${selected.title} (${selected.size})`, "#00ff9f");
    selected.urls.forEach((provider, idx) => {
        const num = chalk_1.default.hex("#00ff9f").bold(`  [${idx + 1}]`);
        console.log(`${num} ${chalk_1.default.white(provider.title)}`);
    });
    ui_1.logger.br();
    ui_1.logger.muted("  Pilih provider (1-" + selected.urls.length + ") atau 'back'\n");
    const provAnswer = await ask("Provider:");
    const provChoice = provAnswer.toLowerCase();
    if (provChoice === "back" || provChoice === "0")
        return await handleDownload(episodeData);
    const pIndex = parseInt(provAnswer) - 1;
    if (isNaN(pIndex) || pIndex < 0 || pIndex >= selected.urls.length) {
        ui_1.logger.warn("Invalid selection");
        await new Promise((r) => setTimeout(r, 1000));
        return await handleDownload(episodeData);
    }
    const provider = selected.urls[pIndex];
    ui_1.logger.info(`Opening ${provider.title}...`);
    await (0, open_1.default)(provider.url);
    await new Promise((r) => setTimeout(r, 2000));
};
const handlePlay = async (slug, episodeStr, animeData) => {
    const config = (0, config_1.loadConfig)();
    try {
        let data = animeData;
        if (!data) {
            const spinner = (0, ora_1.default)("Fetching details...").start();
            const res = await api_1.default.getAnime(slug);
            data = res.data;
            spinner.stop();
        }
        const epsNum = episodeStr === "latest" ? "latest" : parseInt(episodeStr, 10);
        const episode = resolveEpisode(epsNum, data.episodeList);
        if (!episode) {
            ui_1.logger.error(`Episode ${episodeStr} not found`);
            return false;
        }
        let epRes;
        epRes = await api_1.default.getEpisode(episode.episodeId);
        if ((!epRes.ok && epRes.status !== "success") || !epRes.data) {
            ui_1.logger.error("Failed to fetch episode data");
            return false;
        }
        let qualities = [];
        let defaultUrl = "";
        qualities = epRes.data.server?.qualities || [];
        defaultUrl = epRes.data.defaultStreamingUrl || "";
        if (qualities.length === 0) {
            ui_1.logger.warn("No streaming qualities available");
            if (defaultUrl) {
                ui_1.logger.info("Opening default stream in browser...");
                await (0, open_1.default)(defaultUrl);
                return true;
            }
            return false;
        }
        const selectedQuality = await selectQuality(qualities);
        if (!selectedQuality)
            return false;
        (0, ui_1.clearScreen)();
        ui_1.logger.info(`Playing: ${episode.title}`);
        ui_1.logger.info(`Quality: ${selectedQuality.title}`);
        let url = null;
        for (const server of selectedQuality.serverList) {
            ui_1.logger.info(`Trying ${server.title}...`);
            url = await tryGetServer(server.serverId);
            if (url) {
                if (url.includes("filedon.co") || url.includes("vidhide")) {
                    ui_1.logger.warn(`${server.title} unsupported (Embed detected), skipping...`);
                    continue;
                }
                break;
            }
        }
        if (!url) {
            ui_1.logger.warn("No working server found, using default...");
            url = defaultUrl;
        }
        if (!url) {
            ui_1.logger.error("No stream URL available");
            return false;
        }
        if (url.includes("/embed/") || url.includes("player")) {
            ui_1.logger.info("Opening browser player...");
            await (0, open_1.default)(url);
            await new Promise((r) => setTimeout(r, 1000));
            return true;
        }
        const playerPath = config.player || config.playerPath;
        const args = config.playerArgs ? config.playerArgs.split(" ") : [];
        const success = await (0, player_1.playUrl)(url, playerPath, args, false);
        return success;
    }
    catch (err) {
        ui_1.logger.error(`Playback failed: ${err.message}`);
        return false;
    }
};
const showEpisodeMenu = async (slug, data) => {
    (0, ui_1.clearScreen)();
    (0, ui_1.showAnimeDetails)(data);
    (0, ui_1.createHeader)("Episodes", "#ff6b9d");
    (0, ui_1.printEpisodeList)(data.episodeList);
    ui_1.logger.br();
    ui_1.logger.muted("  Perintah:");
    ui_1.logger.muted("  • [nomor] atau 'latest' - Tonton episode");
    if (data.batch)
        ui_1.logger.muted("  • 'b' atau 'batch' - Download batch");
    ui_1.logger.muted("  • 'd' atau 'download' - Download episode");
    ui_1.logger.muted("  • 'back' - Kembali ke daftar anime\n");
    const answer = await ask("Perintah:");
    const choice = answer.toLowerCase();
    if (choice === "back" || choice === "0")
        return;
    if (choice === "b" || choice === "batch") {
        if (!data.batch) {
            ui_1.logger.error("No batch download available for this anime");
            await new Promise((r) => setTimeout(r, 2000));
            return await showEpisodeMenu(slug, data);
        }
        const batchId = data.batch.batchId;
        const spinner = (0, ora_1.default)("Fetching batch info...").start();
        let res;
        try {
            res = await api_1.default.getBatch(batchId);
        }
        catch (err) {
            spinner.fail();
            ui_1.logger.error("Failed to fetch batch info (Network Error)");
            await new Promise((r) => setTimeout(r, 2000));
            return await showEpisodeMenu(slug, data);
        }
        spinner.stop();
        if (res.ok && res.data && res.data.downloadUrl && res.data.downloadUrl.formats.length > 0) {
            await handleBatch(slug, res.data);
            return await showEpisodeMenu(slug, data);
        }
        else {
            ui_1.logger.error("Failed to fetch batch info or no batch links available");
            await new Promise((r) => setTimeout(r, 2000));
            return await showEpisodeMenu(slug, data);
        }
    }
    if (choice === "d" || choice === "download") {
        (0, ui_1.clearScreen)();
        (0, ui_1.createHeader)("Pilih Episode untuk Download", "#00ff9f");
        (0, ui_1.printEpisodeList)(data.episodeList);
        ui_1.logger.br();
        ui_1.logger.muted("  Ketik nomor episode atau 'back'\n");
        const epAnswer = await ask("Episode:");
        const epChoice = epAnswer.toLowerCase();
        if (epChoice !== "back" && epChoice !== "0") {
            const epNum = parseInt(epAnswer);
            if (!isNaN(epNum) || epChoice === "latest") {
                const episode = resolveEpisode(epChoice === "latest" ? "latest" : epNum, data.episodeList);
                if (episode) {
                    let epRes;
                    epRes = await api_1.default.getEpisode(episode.episodeId);
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
    ui_1.logger.warn("Invalid input");
    await new Promise((r) => setTimeout(r, 1000));
    return await showEpisodeMenu(slug, data);
};
const handlePopularMenu = async (currentPage) => {
    const spinner = (0, ora_1.default)(`Fetching Popular Anime (Page ${currentPage})...`).start();
    let res;
    try {
        res = await api_1.default.getCompleted(currentPage);
        spinner.stop();
    }
    catch (err) {
        spinner.fail();
        ui_1.logger.error("Failed to fetch popular anime");
        await new Promise((r) => setTimeout(r, 2000));
        return await runHome();
    }
    if (res.ok && res.data && res.data.animeList) {
        const popularList = [...res.data.animeList].sort((a, b) => {
            const scoreA = parseFloat(a.score) || 0;
            const scoreB = parseFloat(b.score) || 0;
            return scoreB - scoreA;
        });
        (0, ui_1.clearScreen)();
        (0, ui_1.createHeader)("Anime Populer", "#00d9ff");
        (0, ui_1.printAnimeList)(popularList, false);
        (0, ui_1.printPaginationControls)(res.pagination, "Anime Populer", true);
        const answer = await ask("Perintah:");
        const choice = answer.toLowerCase();
        if (choice === "b" || choice === "back") {
            return await runHome();
        }
        if (choice === "n" || choice === "next") {
            if (res.pagination.hasNextPage) {
                return await handlePopularMenu(res.pagination.nextPage);
            }
            else {
                ui_1.logger.warn("No next page available");
                return await handlePopularMenu(currentPage);
            }
        }
        if (choice === "p" || choice === "prev") {
            if (res.pagination.hasPrevPage) {
                return await handlePopularMenu(res.pagination.prevPage);
            }
            else {
                ui_1.logger.warn("No previous page available");
                return await handlePopularMenu(currentPage);
            }
        }
        const index = parseInt(choice) - 1;
        if (!isNaN(index) && index >= 0 && index < popularList.length) {
            await showAnimeDetail(popularList[index].animeId);
            return await handlePopularMenu(currentPage);
        }
        else {
            ui_1.logger.warn("Invalid selection");
            return await handlePopularMenu(currentPage);
        }
    }
    else {
        ui_1.logger.error("No popular anime found");
        await new Promise((r) => setTimeout(r, 2000));
        return await runHome();
    }
};
const showAnimeDetail = async (slug) => {
    try {
        const res = await api_1.default.getAnime(slug);
        await showEpisodeMenu(slug, res.data);
    }
    catch {
        ui_1.logger.error("Failed to load anime");
    }
};
const handleOngoingMenu = async (currentPage) => {
    const spinner = (0, ora_1.default)(`Fetching Ongoing page ${currentPage}...`).start();
    let res;
    try {
        res = await api_1.default.getOngoing(currentPage);
        spinner.stop();
    }
    catch (err) {
        spinner.fail();
        ui_1.logger.error("Failed to fetch ongoing anime");
        await new Promise((r) => setTimeout(r, 2000));
        return await runHome();
    }
    if (res.ok && res.data && res.data.animeList) {
        (0, ui_1.clearScreen)();
        (0, ui_1.createHeader)("Ongoing Anime", "#00d9ff");
        (0, ui_1.printAnimeList)(res.data.animeList, true);
        (0, ui_1.printPaginationControls)(res.pagination, "Ongoing Anime", true);
        const answer = await ask("Perintah:");
        const choice = answer.toLowerCase();
        if (choice === "b" || choice === "back") {
            return await runHome();
        }
        if (choice === "n" || choice === "next") {
            if (res.pagination.hasNextPage) {
                return await handleOngoingMenu(res.pagination.nextPage);
            }
            else {
                ui_1.logger.warn("No next page available");
                return await handleOngoingMenu(currentPage);
            }
        }
        if (choice === "p" || choice === "prev") {
            if (res.pagination.hasPrevPage) {
                return await handleOngoingMenu(res.pagination.prevPage);
            }
            else {
                ui_1.logger.warn("No previous page available");
                return await handleOngoingMenu(currentPage);
            }
        }
        const index = parseInt(choice) - 1;
        if (!isNaN(index) && index >= 0 && index < res.data.animeList.length) {
            await showAnimeDetail(res.data.animeList[index].animeId);
            return await handleOngoingMenu(currentPage);
        }
        else {
            ui_1.logger.warn("Invalid selection");
            return await handleOngoingMenu(currentPage);
        }
    }
    else {
        ui_1.logger.error("No ongoing anime found");
        await new Promise((r) => setTimeout(r, 2000));
        return await runHome();
    }
};
const handleCompletedMenu = async (currentPage) => {
    const spinner = (0, ora_1.default)(`Fetching Completed page ${currentPage}...`).start();
    let res;
    try {
        res = await api_1.default.getCompleted(currentPage);
        spinner.stop();
    }
    catch (err) {
        spinner.fail();
        ui_1.logger.error("Failed to fetch completed anime");
        await new Promise((r) => setTimeout(r, 2000));
        return await runHome();
    }
    if (res.ok && res.data && res.data.animeList) {
        (0, ui_1.clearScreen)();
        (0, ui_1.createHeader)("Completed Anime", "#00d9ff");
        (0, ui_1.printAnimeList)(res.data.animeList, false);
        (0, ui_1.printPaginationControls)(res.pagination, "Completed Anime", true);
        const answer = await ask("Perintah:");
        const choice = answer.toLowerCase();
        if (choice === "b" || choice === "back") {
            return await runHome();
        }
        if (choice === "n" || choice === "next") {
            if (res.pagination.hasNextPage) {
                return await handleCompletedMenu(res.pagination.nextPage);
            }
            else {
                ui_1.logger.warn("No next page available");
                return await handleCompletedMenu(currentPage);
            }
        }
        if (choice === "p" || choice === "prev") {
            if (res.pagination.hasPrevPage) {
                return await handleCompletedMenu(res.pagination.prevPage);
            }
            else {
                ui_1.logger.warn("No previous page available");
                return await handleCompletedMenu(currentPage);
            }
        }
        const index = parseInt(choice) - 1;
        if (!isNaN(index) && index >= 0 && index < res.data.animeList.length) {
            await showAnimeDetail(res.data.animeList[index].animeId);
            return await handleCompletedMenu(currentPage);
        }
        else {
            ui_1.logger.warn("Invalid selection");
            return await handleCompletedMenu(currentPage);
        }
    }
    else {
        ui_1.logger.error("No completed anime found");
        await new Promise((r) => setTimeout(r, 2000));
        return await runHome();
    }
};
const handleSearch = async () => {
    (0, ui_1.clearScreen)();
    (0, ui_1.createHeader)("Search Anime", "#ff6b9d");
    ui_1.logger.br();
    const keyword = await ask("Enter keyword (e.g. Naruto):");
    if (!keyword) {
        ui_1.logger.warn("Keyword cannot be empty");
        return await runHome();
    }
    const spinner = (0, ora_1.default)("Searching...").start();
    let res;
    try {
        res = await api_1.default.getSearch(keyword);
        spinner.stop();
    }
    catch (err) {
        spinner.fail();
        ui_1.logger.error("Network error or server issue (500).");
        await new Promise((r) => setTimeout(r, 2000));
        return await runHome();
    }
    if (res.ok && res.data && res.data.animeList && res.data.animeList.length > 0) {
        (0, ui_1.clearScreen)();
        (0, ui_1.createHeader)("Hasil Search", "#ff6b9d");
        (0, ui_1.printSearchResults)(res.data.animeList);
        ui_1.logger.br();
        ui_1.logger.muted(`  Pilih anime (1-${res.data.animeList.length}) atau 'back'\n`);
        const answer = await ask("Pilih:");
        const choice = answer.toLowerCase();
        if (choice === "back" || choice === "0")
            return await runHome();
        const index = parseInt(choice) - 1;
        if (!isNaN(index) && index >= 0 && index < res.data.animeList.length) {
            await showAnimeDetail(res.data.animeList[index].animeId);
        }
        else {
            ui_1.logger.warn("Invalid selection");
            await new Promise((r) => setTimeout(r, 1000));
            return await handleSearch();
        }
    }
    else {
        ui_1.logger.error("No anime found");
        await new Promise((r) => setTimeout(r, 2000));
        return await runHome();
    }
};
const handleGenreMenu = async () => {
    (0, ui_1.clearScreen)();
    (0, ui_1.createHeader)("Pilih Genre", "#ffaa00");
    ui_1.logger.br();
    const spinner = (0, ora_1.default)("Fetching genres...").start();
    let res;
    try {
        res = await api_1.default.getGenre();
        spinner.stop();
    }
    catch (err) {
        spinner.fail();
        ui_1.logger.error("Failed to fetch genres");
        await new Promise((r) => setTimeout(r, 2000));
        return await runHome();
    }
    if (res.ok && res.data && res.data.genreList) {
        (0, ui_1.clearScreen)();
        (0, ui_1.createHeader)("Pilih Genre", "#ffaa00");
        ui_1.logger.br();
        (0, ui_1.printGenreList)(res.data.genreList);
        ui_1.logger.br();
        ui_1.logger.muted(`  Pilih genre (1-${res.data.genreList.length}) atau 'back'\n`);
        const answer = await ask("Pilih:");
        const choice = answer.toLowerCase();
        if (choice === "back" || choice === "0")
            return await runHome();
        const index = parseInt(choice) - 1;
        if (!isNaN(index) && index >= 0 && index < res.data.genreList.length) {
            const selectedGenre = res.data.genreList[index];
            await handleGenreAnimeList(selectedGenre.title, selectedGenre.genreId, 1);
        }
        else {
            ui_1.logger.warn("Invalid selection");
            return await handleGenreMenu();
        }
    }
    else {
        ui_1.logger.error("Failed to fetch genres");
        await new Promise((r) => setTimeout(r, 2000));
        return await runHome();
    }
};
const handleGenreAnimeList = async (genreTitle, genreSlug, currentPage) => {
    const spinner = (0, ora_1.default)(`Fetching page ${currentPage}...`).start();
    let res;
    try {
        res = await api_1.default.getGenreAnime(genreSlug, currentPage);
        spinner.stop();
    }
    catch (err) {
        spinner.fail();
        ui_1.logger.error("Network error or server issue (500).");
        await new Promise((r) => setTimeout(r, 2000));
        return await handleGenreMenu();
    }
    if (res.ok && res.data && res.data.animeList) {
        (0, ui_1.clearScreen)();
        (0, ui_1.createHeader)(`Genre: ${genreTitle}`, "#ffaa00");
        ui_1.logger.br();
        (0, ui_1.printGenreAnimeList)(res.data.animeList);
        (0, ui_1.printPaginationControls)(res.pagination, `: ${genreTitle}`, true);
        const answer = await ask("Perintah:");
        const choice = answer.toLowerCase();
        if (choice === "b" || choice === "back") {
            return await handleGenreMenu();
        }
        if (choice === "n" || choice === "next") {
            if (res.pagination.hasNextPage) {
                return await handleGenreAnimeList(genreTitle, genreSlug, res.pagination.nextPage);
            }
            else {
                ui_1.logger.warn("No next page available");
                return await handleGenreAnimeList(genreTitle, genreSlug, currentPage);
            }
        }
        if (choice === "p" || choice === "prev") {
            if (res.pagination.hasPrevPage) {
                return await handleGenreAnimeList(genreTitle, genreSlug, res.pagination.prevPage);
            }
            else {
                ui_1.logger.warn("No previous page available");
                return await handleGenreAnimeList(genreTitle, genreSlug, currentPage);
            }
        }
        const index = parseInt(choice) - 1;
        if (!isNaN(index) && index >= 0 && index < res.data.animeList.length) {
            await showAnimeDetail(res.data.animeList[index].animeId);
        }
        else {
            ui_1.logger.warn("Invalid selection");
            return await handleGenreAnimeList(genreTitle, genreSlug, currentPage);
        }
    }
    else {
        ui_1.logger.error("No anime found for this genre");
        await new Promise((r) => setTimeout(r, 2000));
        return await handleGenreMenu();
    }
};
const handleSchedule = async () => {
    const spinner = (0, ora_1.default)("Fetching schedule...").start();
    let res;
    try {
        res = await api_1.default.getSchedule();
        spinner.stop();
    }
    catch (err) {
        spinner.fail();
        ui_1.logger.error("Failed to fetch schedule");
        await new Promise((r) => setTimeout(r, 2000));
        return await runHome();
    }
    if (res && res.status === "success" && res.data) {
        (0, ui_1.clearScreen)();
        (0, ui_1.createHeader)("Anime Schedule", "#ffaa00");
        (0, ui_1.printSchedule)(res.data);
        ui_1.logger.br();
        ui_1.logger.muted("  Perintah:");
        ui_1.logger.muted("  • [nomor] - Pilih hari (1-Minggu)");
        ui_1.logger.muted("  • [hari] - Filter berdasarkan hari (e.g. Senin, Selasa)");
        ui_1.logger.muted("  • 'back' - Kembali ke home\n");
        const answer = await ask("Perintah:");
        const choice = answer.toLowerCase();
        if (choice === "back" || choice === "0")
            return await runHome();
        const index = parseInt(choice);
        if (!isNaN(index) && index >= 1 && index <= res.data.length) {
            const selectedDay = res.data[index - 1];
            (0, ui_1.clearScreen)();
            (0, ui_1.createHeader)(`Schedule: ${selectedDay.day}`, "#ffaa00");
            (0, ui_1.printSchedule)([selectedDay]);
            ui_1.logger.br();
            if (selectedDay.anime_list && selectedDay.anime_list.length > 0) {
                ui_1.logger.muted(`  Pilih anime (1-${selectedDay.anime_list.length}) atau 'back'\n`);
                const ansAnime = await ask("Pilih:");
                const aChoice = ansAnime.toLowerCase();
                if (aChoice === "back" || aChoice === "0")
                    return await handleSchedule();
                const aIndex = parseInt(aChoice) - 1;
                if (!isNaN(aIndex) && aIndex >= 0 && aIndex < selectedDay.anime_list.length) {
                    await showAnimeDetail(selectedDay.anime_list[aIndex].slug);
                    return await handleSchedule();
                }
            }
            else {
                ui_1.logger.warn("No anime scheduled for this day");
                return await handleSchedule();
            }
        }
        const dayData = res.data.find((d) => d.day.toLowerCase() === choice);
        if (dayData) {
            (0, ui_1.clearScreen)();
            (0, ui_1.createHeader)(`Schedule: ${dayData.day}`, "#ffaa00");
            (0, ui_1.printSchedule)([dayData]);
            ui_1.logger.br();
            ui_1.logger.muted(`  Pilih anime (1-${dayData.anime_list.length}) atau 'back'\n`);
            const ansAnime = await ask("Pilih:");
            const aChoice = ansAnime.toLowerCase();
            if (aChoice === "back" || aChoice === "0")
                return await handleSchedule();
            const aIndex = parseInt(aChoice) - 1;
            if (!isNaN(aIndex) && aIndex >= 0 && aIndex < dayData.anime_list.length) {
                await showAnimeDetail(dayData.anime_list[aIndex].slug);
                return await handleSchedule();
            }
            else {
                ui_1.logger.warn("Invalid selection");
                return await handleSchedule();
            }
        }
        else {
            ui_1.logger.warn("Day not found");
            return await handleSchedule();
        }
    }
    else {
        ui_1.logger.error("Failed to fetch schedule (API Error or Invalid Data)");
        await new Promise((r) => setTimeout(r, 2000));
        return await runHome();
    }
};
const handleFAQ = async () => {
    (0, ui_1.clearScreen)();
    (0, ui_1.createHeader)("Frequently Asked Questions", "#ffaa00");
    (0, ui_1.printFAQ)();
    const answer = await ask("Perintah:");
    const choice = answer.toLowerCase();
    if (choice === "back" || choice === "0") {
        return await runHome();
    }
    ui_1.logger.warn("Invalid command, returning to home...");
    await new Promise((r) => setTimeout(r, 500));
    return await runHome();
};
const runHome = async () => {
    (0, ui_1.clearScreen)();
    (0, ui_1.showBanner)();
    (0, ui_1.createHeader)("Main Menu", "#ff6b9d");
    ui_1.logger.br();
    (0, ui_1.showMenu)([
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
    }
    else if (answer === "2") {
        await handleCompletedMenu(1);
    }
    else if (answer === "3") {
        await handlePopularMenu(1);
    }
    else if (answer === "4") {
        await handleSearch();
    }
    else if (answer === "5") {
        await handleGenreMenu();
    }
    else if (answer === "6") {
        await handleSchedule();
    }
    else if (answer === "7") {
        await handleFAQ();
    }
    else {
        ui_1.logger.warn("Invalid choice");
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
    (0, ui_1.clearScreen)();
    (0, ui_1.showBanner)();
    await handlePlay(slug, ep);
});
program
    .command("config [action] [key] [value]")
    .description("Manage configuration")
    .action((action = "show", key, value) => {
    const config = (0, config_1.loadConfig)();
    if (action === "set" && key && value) {
        if (key === "player" || key === "playerArgs") {
            config[key] = value;
            (0, config_1.saveConfig)(config);
            ui_1.logger.success(`${key} = ${value}`);
        }
        else {
            ui_1.logger.error("Invalid key");
        }
    }
    else {
        console.log(JSON.stringify(config, null, 2));
        ui_1.logger.info(`Config: ${(0, config_1.getConfigPath)()}`);
    }
});
program
    .command("cache <cmd>")
    .description("Cache management")
    .action((cmd) => {
    if (cmd === "clear")
        api_1.default.clearCache();
    else
        ui_1.logger.info("Usage: anichi cache clear");
});
program.parse();
//# sourceMappingURL=index.js.map