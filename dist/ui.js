"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printFAQ = exports.printDownloadOptions = exports.printBatchProviders = exports.printBatchQualities = exports.printBatchFormats = exports.printSchedule = exports.printPaginationControls = exports.printGenreList = exports.printGenreAnimeList = exports.printSearchResults = exports.printQualityOptions = exports.showAnimeDetails = exports.showMenu = exports.printEpisodeList = exports.printAnimeList = exports.logger = exports.createHeader = exports.createBox = exports.showBanner = exports.clearScreen = void 0;
const chalk_1 = __importDefault(require("chalk"));
const boxen_1 = __importDefault(require("boxen"));
const gradient_string_1 = __importDefault(require("gradient-string"));
const figlet_1 = __importDefault(require("figlet"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const theme = {
    primary: "#00d9ff",
    secondary: "#ff6b9d",
    success: "#00ff9f",
    warning: "#ffaa00",
    error: "#ff4757",
    info: "#70a1ff",
    muted: "#747d8c",
    border: "#3a506b",
};
const clearScreen = () => {
    process.stdout.write("\x1Bc");
    console.clear();
    console.log("\n");
};
exports.clearScreen = clearScreen;
const showBanner = () => {
    const banner = figlet_1.default.textSync("ANICHI", {
        font: "ANSI Shadow",
        horizontalLayout: "fitted",
    });
    console.log(gradient_string_1.default.pastel.multiline(banner));
    console.log(chalk_1.default.hex(theme.muted)("  v2.6.2  •  Streaming Anime CLI By ShDitz\n"));
    console.log(chalk_1.default.hex(theme.muted)("  Butuh bantuan tentang Anichi? ketik 7 untuk 'FAQ'\n"));
};
exports.showBanner = showBanner;
const createBox = (content, title, color = theme.primary) => {
    return (0, boxen_1.default)(content, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: color,
        title: title,
        titleAlignment: "center",
    });
};
exports.createBox = createBox;
const createHeader = (text, color = theme.primary) => {
    const box = (0, boxen_1.default)(chalk_1.default.bold.white(text), {
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        borderStyle: "round",
        borderColor: color,
        dimBorder: false,
    });
    console.log(box);
};
exports.createHeader = createHeader;
exports.logger = {
    info: (msg) => console.log(chalk_1.default.hex(theme.info)("  ℹ"), chalk_1.default.white(msg)),
    success: (msg) => console.log(chalk_1.default.hex(theme.success)("  ✓"), chalk_1.default.white(msg)),
    warn: (msg) => console.log(chalk_1.default.hex(theme.warning)("  ⚠"), chalk_1.default.white(msg)),
    error: (msg) => console.log(chalk_1.default.hex(theme.error)("  ✗"), chalk_1.default.white(msg)),
    plain: (msg) => console.log(chalk_1.default.white(msg)),
    muted: (msg) => console.log(chalk_1.default.hex(theme.muted)(msg)),
    br: () => console.log(""),
};
const printAnimeList = (list, isOngoing) => {
    const table = new cli_table3_1.default({
        head: [
            chalk_1.default.bold.white("No"),
            chalk_1.default.bold.white("Title"),
            chalk_1.default.bold.white("Eps"),
            isOngoing ? chalk_1.default.bold.white("Hari Rilis") : chalk_1.default.bold.white("Terakhir Rilis"),
            isOngoing ? chalk_1.default.bold.white("Terbaru ") : chalk_1.default.bold.white("Score"),
        ],
        colWidths: [5, 42, 6, 10, 9],
        wordWrap: true,
        style: { head: [], border: [theme.border] },
    });
    list.forEach((anime, idx) => {
        const scoreColor = anime.score && parseFloat(anime.score) >= 8.0
            ? theme.success
            : anime.score && parseFloat(anime.score) >= 6.0
                ? theme.warning
                : theme.muted;
        table.push([
            chalk_1.default.hex(theme.primary).bold((idx + 1).toString()),
            anime.title,
            anime.episodes || "-",
            isOngoing ? anime.releaseDay || "-" : anime.lastReleaseDate || "-",
            isOngoing
                ? anime.latestReleaseDate || "-"
                : anime.score
                    ? chalk_1.default.hex(scoreColor)(anime.score)
                    : "-",
        ]);
    });
    console.log(table.toString());
};
exports.printAnimeList = printAnimeList;
const printEpisodeList = (list) => {
    if (list.length === 0) {
        exports.logger.muted("No episodes available");
        return;
    }
    const sortedList = [...list].sort((a, b) => a.eps - b.eps);
    const table = new cli_table3_1.default({
        head: [chalk_1.default.bold.white(" No"), chalk_1.default.bold.white("Episode")],
        colWidths: [10, 20],
        wordWrap: true,
        style: { head: [], border: [theme.border] },
    });
    sortedList.forEach((ep, idx) => {
        table.push([
            chalk_1.default.hex(theme.primary).bold((idx + 1).toString().padStart(3)),
            chalk_1.default.white(`Ep ${ep.eps.toString().padStart(4)}`),
        ]);
    });
    console.log(table.toString());
};
exports.printEpisodeList = printEpisodeList;
const showMenu = (options) => {
    options.forEach((opt, idx) => {
        const num = chalk_1.default.hex(theme.primary).bold(`  [${idx + 1}]`);
        console.log(`${num} ${chalk_1.default.white(opt)}`);
    });
    exports.logger.br();
};
exports.showMenu = showMenu;
const showAnimeDetails = (data) => {
    const metaTable = new cli_table3_1.default({
        colWidths: [20, 60],
        wordWrap: true,
        style: { head: [], border: [theme.border] },
    });
    metaTable.push([chalk_1.default.hex(theme.secondary)("Judul"), data.title], [chalk_1.default.hex(theme.secondary)("Japanese"), data.japanese], [chalk_1.default.hex(theme.secondary)("Score"), chalk_1.default.hex(theme.warning)(data.score)], [chalk_1.default.hex(theme.secondary)("Status"), chalk_1.default.hex(theme.success)(data.status)], [chalk_1.default.hex(theme.secondary)("Studio"), data.studios], [chalk_1.default.hex(theme.secondary)("Tipe"), data.type], [chalk_1.default.hex(theme.secondary)("Durasi"), data.duration], [chalk_1.default.hex(theme.secondary)("Episode"), data.episodes], [chalk_1.default.hex(theme.secondary)("Ditayangkan"), data.aired], [chalk_1.default.hex(theme.secondary)("Produser"), data.producers], [chalk_1.default.hex(theme.secondary)("Genre"), data.genreList.map((g) => g.title).join(", ")]);
    console.log(metaTable.toString());
    exports.logger.br();
    const synopsis = data.synopsis.paragraphs.join(" ");
    const synopsisBox = (0, boxen_1.default)(chalk_1.default.white(synopsis), {
        padding: 1,
        margin: 1,
        borderStyle: "single",
        borderColor: theme.muted,
        title: chalk_1.default.bold.white("Sinopsis"),
        titleAlignment: "left",
    });
    console.log(synopsisBox);
    if (data.batch) {
        exports.logger.br();
        exports.logger.muted(`  📦 Batch Tersedia`);
        exports.logger.br();
    }
};
exports.showAnimeDetails = showAnimeDetails;
const printQualityOptions = (qualities) => {
    const table = new cli_table3_1.default({
        head: [chalk_1.default.bold.white("No"), chalk_1.default.bold.white("Quality"), chalk_1.default.bold.white("Servers")],
        colWidths: [5, 15, 10],
        style: { head: [], border: [theme.border] },
    });
    qualities.forEach((q, idx) => {
        table.push([
            chalk_1.default.hex(theme.primary).bold(idx + 1),
            chalk_1.default.white(q.title),
            chalk_1.default.hex(theme.muted)(q.serverList.length),
        ]);
    });
    console.log(table.toString());
};
exports.printQualityOptions = printQualityOptions;
const printSearchResults = (list) => {
    if (list.length === 0) {
        exports.logger.muted("No anime found");
        return;
    }
    const table = new cli_table3_1.default({
        head: [
            chalk_1.default.bold.white("No"),
            chalk_1.default.bold.white("Title"),
            chalk_1.default.bold.white("Status"),
            chalk_1.default.bold.white("Score"),
        ],
        colWidths: [5, 50, 15, 7],
        wordWrap: true,
        style: { head: [], border: [theme.border] },
    });
    list.forEach((anime, idx) => {
        const scoreColor = anime.score && parseFloat(anime.score) >= 8.0
            ? theme.success
            : anime.score && parseFloat(anime.score) >= 6.0
                ? theme.warning
                : theme.muted;
        table.push([
            chalk_1.default.hex(theme.primary).bold((idx + 1).toString().padStart(2, "0")),
            anime.title,
            chalk_1.default.hex(theme.success)(anime.status),
            chalk_1.default.hex(scoreColor)(anime.score || "-"),
        ]);
    });
    console.log(table.toString());
};
exports.printSearchResults = printSearchResults;
const printGenreAnimeList = (list) => {
    if (list.length === 0) {
        exports.logger.muted("No anime found");
        return;
    }
    const table = new cli_table3_1.default({
        head: [
            chalk_1.default.bold.white("No"),
            chalk_1.default.bold.white("Title"),
            chalk_1.default.bold.white("Eps"),
            chalk_1.default.bold.white("Score"),
        ],
        colWidths: [5, 55, 6, 7],
        wordWrap: true,
        style: { head: [], border: [theme.border] },
    });
    list.forEach((anime, idx) => {
        const scoreColor = anime.score && parseFloat(anime.score) >= 8.0
            ? theme.success
            : anime.score && parseFloat(anime.score) >= 6.0
                ? theme.warning
                : theme.muted;
        table.push([
            chalk_1.default.hex(theme.primary).bold((idx + 1).toString().padStart(2, "0")),
            anime.title,
            anime.episodes || "-",
            chalk_1.default.hex(scoreColor)(anime.score || "-"),
        ]);
    });
    console.log(table.toString());
};
exports.printGenreAnimeList = printGenreAnimeList;
const printGenreList = (list) => {
    if (list.length === 0) {
        exports.logger.muted("No genres available");
        return;
    }
    const COLS = 2;
    const ROWS = Math.ceil(list.length / COLS);
    const table = new cli_table3_1.default({
        head: Array(COLS).fill(chalk_1.default.bold.white("No")),
        colWidths: Array(COLS).fill(25),
        wordWrap: true,
        style: { head: [], border: [theme.border] },
    });
    for (let row = 0; row < ROWS; row++) {
        const tableRow = [];
        for (let col = 0; col < COLS; col++) {
            const idx = row + col * ROWS;
            if (idx < list.length) {
                const item = list[idx];
                tableRow.push(chalk_1.default.hex(theme.primary).bold((idx + 1).toString().padStart(2, "0")) +
                    ". " +
                    chalk_1.default.white(item.title));
            }
            else {
                tableRow.push("");
            }
        }
        table.push(tableRow);
    }
    console.log(table.toString());
};
exports.printGenreList = printGenreList;
const printPaginationControls = (pagination, currentTitle, showBack) => {
    exports.logger.br();
    exports.logger.muted(`  📚 ${currentTitle} | Page: ${chalk_1.default.white(pagination.currentPage)} / ${chalk_1.default.white(pagination.totalPages)}`);
    let controls = "";
    if (pagination.hasPrevPage) {
        controls += `${chalk_1.default.hex(theme.warning).bold("[P] Prev")}  `;
    }
    if (pagination.hasNextPage) {
        controls += `${chalk_1.default.hex(theme.success).bold("[N] Next")}  `;
    }
    if (showBack) {
        controls += `${chalk_1.default.hex(theme.error).bold("[B] Back")}`;
    }
    console.log(`\n  ${controls}`);
    exports.logger.br();
};
exports.printPaginationControls = printPaginationControls;
const printSchedule = (list) => {
    list.forEach((day) => {
        console.log(`\n  ${chalk_1.default.hex(theme.secondary).bold("📅 " + day.day)}`);
        if (day.anime_list.length === 0) {
            exports.logger.muted("  No anime scheduled");
            return;
        }
        const table = new cli_table3_1.default({
            head: [chalk_1.default.bold.white("No"), chalk_1.default.bold.white("Title")],
            colWidths: [5, 60],
            wordWrap: true,
            style: { head: [], border: [theme.border] },
        });
        day.anime_list.forEach((anime, idx) => {
            table.push([
                chalk_1.default.hex(theme.primary).bold((idx + 1).toString().padStart(2, "0")),
                anime.title,
            ]);
        });
        console.log(table.toString());
    });
};
exports.printSchedule = printSchedule;
const printBatchFormats = (formats) => {
    const table = new cli_table3_1.default({
        head: [chalk_1.default.bold.white("No"), chalk_1.default.bold.white("Format")],
        colWidths: [5, 30],
        style: { head: [], border: [theme.border] },
    });
    formats.forEach((f, idx) => {
        const num = chalk_1.default.hex(theme.primary).bold(`[${idx + 1}]`);
        table.push([num, f.title]);
    });
    console.log(table.toString());
};
exports.printBatchFormats = printBatchFormats;
const printBatchQualities = (qualities) => {
    const table = new cli_table3_1.default({
        head: [chalk_1.default.bold.white("No"), chalk_1.default.bold.white("Quality")],
        colWidths: [5, 30],
        style: { head: [], border: [theme.border] },
    });
    qualities.forEach((q, idx) => {
        const num = chalk_1.default.hex(theme.primary).bold(`[${idx + 1}]`);
        table.push([num, q.title]);
    });
    console.log(table.toString());
};
exports.printBatchQualities = printBatchQualities;
const printBatchProviders = (providers) => {
    const table = new cli_table3_1.default({
        head: [chalk_1.default.bold.white("No"), chalk_1.default.bold.white("Provider")],
        colWidths: [5, 30],
        style: { head: [], border: [theme.border] },
    });
    providers.forEach((p, idx) => {
        const num = chalk_1.default.hex(theme.primary).bold(`[${idx + 1}]`);
        table.push([num, p.title]);
    });
    console.log(table.toString());
};
exports.printBatchProviders = printBatchProviders;
const printDownloadOptions = (downloads) => {
    const table = new cli_table3_1.default({
        head: [chalk_1.default.bold.white("No"), chalk_1.default.bold.white("Quality"), chalk_1.default.bold.white("Size")],
        colWidths: [5, 20, 15],
        style: { head: [], border: [theme.border] },
    });
    downloads.forEach((dl, idx) => {
        const num = chalk_1.default.hex(theme.primary).bold(`[${idx + 1}]`);
        table.push([num, dl.title, chalk_1.default.hex(theme.warning)(dl.size)]);
    });
    console.log(table.toString());
};
exports.printDownloadOptions = printDownloadOptions;
const printFAQ = () => {
    const faqData = [
        {
            q: chalk_1.default.hex(theme.secondary).bold("P: Video player apa saja yang mendukung?"),
            a: chalk_1.default.white("J: Hanya MPV. Jika MPV tidak ditemukan, streaming akan diarahkan ke browser."),
        },
        {
            q: chalk_1.default.hex(theme.secondary).bold("P: Bagaimana cara menginstall choco (Windows)?"),
            a: chalk_1.default.white("J: Jalankan di PowerShell (Run Administrator):") +
                "\n" +
                chalk_1.default
                    .hex(theme.warning)
                    .bold("Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"),
        },
        {
            q: chalk_1.default.hex(theme.secondary).bold("P: Bagaimana cara menginstall MPV?"),
            a: chalk_1.default.white("J: Windows (PowerShell Admin): choco install mpv") +
                "\n" +
                chalk_1.default.white("   macOS (Terminal): brew install mpv") +
                "\n" +
                chalk_1.default.white("   Linux: sudo apt install mpv"),
        },
        {
            q: chalk_1.default
                .hex(theme.secondary)
                .bold("P: Sudah menginstall MPV tapi saat ingin menonton episode video player tidak muncul?"),
            a: chalk_1.default.white("J: Ini disebabkan karena yt-dlp belum terinstall. MPV butuh yt-dlp untuk streaming link.") +
                "\n" +
                chalk_1.default.white("   Windows: choco install yt-dlp") +
                "\n" +
                chalk_1.default.white("   macOS: brew install yt-dlp"),
        },
        {
            q: chalk_1.default.hex(theme.secondary).bold("P: Apakah ada rate limiting?"),
            a: chalk_1.default.white("J: Ya. Kami membatasi 100 permintaan permenit.") +
                "\n" +
                chalk_1.default.white("   Anichi akan otomatis mengatur jeda antar request.") +
                "\n" +
                chalk_1.default.white("   Jangan terlalu cepat navigasi agar tidak terkena limit."),
        },
        {
            q: chalk_1.default
                .hex(theme.secondary)
                .bold("P: Saat ingin menonton, video player (MPV) tidak muncul?"),
            a: chalk_1.default.white("J: Coba beberapa kali, jika masih tidak bisa ganti quality."),
        },
    ];
    exports.logger.br();
    console.log(chalk_1.default.hex(theme.secondary).bold("  Frequently Asked Questions"));
    exports.logger.br();
    faqData.forEach((item) => {
        console.log(item.q);
        console.log(item.a);
        exports.logger.br();
    });
    exports.logger.muted(`  Ketik 'back' atau '0' untuk kembali.\n`);
};
exports.printFAQ = printFAQ;
//# sourceMappingURL=ui.js.map