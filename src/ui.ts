import chalk from "chalk";
import boxen from "boxen";
import gradient from "gradient-string";
import figlet from "figlet";
import Table from "cli-table3";
import { ScheduleAnimeItem, WatchHistoryItem } from "./types";
import { getResumeForEpisode } from "./resume";

export const theme = {
  primary: "#00d9ff",
  secondary: "#ff6b9d",
  success: "#00ff9f",
  warning: "#ffaa00",
  error: "#ff4757",
  info: "#70a1ff",
  muted: "#747d8c",
  border: "#3a506b",
};

export const clearScreen = () => {
  process.stdout.write("\x1Bc");
  console.clear();
  console.log("\n");
};

export const showBanner = () => {
  const banner = figlet.textSync("ANICHI", {
    font: "ANSI Shadow",
    horizontalLayout: "fitted",
  });
  console.log(gradient.pastel.multiline(banner));
  console.log(chalk.hex(theme.muted)("  v2.8.1  •  Streaming Anime CLI By ShDitz\n"));
  console.log(chalk.hex(theme.muted)("  Butuh bantuan tentang Anichi? ketik 8 untuk 'FAQ'\n"));
};

export const createBox = (content: string, title?: string, color: string = theme.primary) => {
  return boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: color,
    title: title,
    titleAlignment: "center",
  });
};

export const createHeader = (text: string, color: string = theme.primary) => {
  const box = boxen(chalk.bold.white(text), {
    padding: { top: 0, bottom: 0, left: 2, right: 2 },
    borderStyle: "round",
    borderColor: color,
    dimBorder: false,
  });
  console.log(box);
};

export const logger = {
  info: (msg: string) => console.log(chalk.hex(theme.info)("  ℹ"), chalk.white(msg)),
  success: (msg: string) => console.log(chalk.hex(theme.success)("  ✓"), chalk.white(msg)),
  warn: (msg: string) => console.log(chalk.hex(theme.warning)("  ⚠"), chalk.white(msg)),
  error: (msg: string) => console.log(chalk.hex(theme.error)("  ✗"), chalk.white(msg)),
  plain: (msg: string) => console.log(chalk.white(msg)),
  muted: (msg: string) => console.log(chalk.hex(theme.muted)(msg)),
  br: () => console.log(""),
};

const formatTime = (seconds: number): string => {
  if (!seconds || seconds <= 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const printAnimeList = (list: any[], isOngoing: boolean) => {
  const table = new Table({
    head: [
      chalk.bold.white("No"),
      chalk.bold.white("Title"),
      chalk.bold.white("Eps"),
      isOngoing ? chalk.bold.white("Hari Rilis") : chalk.bold.white("Terakhir Rilis"),
      isOngoing ? chalk.bold.white("Terbaru ") : chalk.bold.white("Score"),
    ],
    colWidths: [5, 42, 6, 10, 9],
    wordWrap: true,
    style: { head: [], border: [theme.border] },
  });

  list.forEach((anime, idx) => {
    const scoreColor =
      anime.rating && parseFloat(anime.rating) >= 8.0
        ? theme.success
        : anime.rating && parseFloat(anime.rating) >= 6.0
        ? theme.warning
        : theme.muted;

    table.push([
      chalk.hex(theme.primary).bold((idx + 1).toString()),
      anime.title,
      anime.episode || anime.total_episode || "-",
      isOngoing ? anime.day || "-" : anime.date || "-",
      isOngoing ? anime.date || "-" : anime.rating ? chalk.hex(scoreColor)(anime.rating) : "-",
    ]);
  });

  console.log(table.toString());
};

export const printEpisodeList = (list: any[], animeSlug: string) => {
  if (list.length === 0) {
    logger.muted("No episodes available");
    return;
  }

  const sortedList = [...list].sort((a, b) => {
    const numA = extractEpisodeNumber(a.title);
    const numB = extractEpisodeNumber(b.title);
    return numA - numB;
  });

  const table = new Table({
    head: [chalk.bold.white(" No"), chalk.bold.white("Episode"), chalk.bold.white("Resume")],
    colWidths: [10, 35, 20],
    wordWrap: true,
    style: { head: [], border: [theme.border] },
  });

  sortedList.forEach((ep, idx) => {
    const epNum = extractEpisodeNumber(ep.title);
    const resume = getResumeForEpisode(animeSlug, epNum);
    const resumeText = resume
      ? chalk.hex(theme.warning)(`Lanjut ${formatTime(resume.position)}`)
      : "-";

    table.push([
      chalk.hex(theme.primary).bold((idx + 1).toString().padStart(3)),
      chalk.white(ep.title),
      resumeText,
    ]);
  });

  console.log(table.toString());
};

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

export const showMenu = (options: string[]) => {
  options.forEach((opt, idx) => {
    const num = chalk.hex(theme.primary).bold(`  [${idx + 1}]`);
    console.log(`${num} ${chalk.white(opt)}`);
  });
  logger.br();
};

export const showAnimeDetails = (data: any) => {
  const metaTable = new Table({
    colWidths: [20, 60],
    wordWrap: true,
    style: { head: [], border: [theme.border] },
  });

  metaTable.push(
    [chalk.hex(theme.secondary)("Judul"), data.title],
    [chalk.hex(theme.secondary)("Japanese"), data.japanese],
    [chalk.hex(theme.secondary)("Score"), chalk.hex(theme.warning)(data.skor)],
    [chalk.hex(theme.secondary)("Status"), chalk.hex(theme.success)(data.status)],
    [chalk.hex(theme.secondary)("Studio"), data.studio],
    [chalk.hex(theme.secondary)("Tipe"), data.tipe],
    [chalk.hex(theme.secondary)("Durasi"), data.durasi],
    [chalk.hex(theme.secondary)("Episode"), data.total_episode],
    [chalk.hex(theme.secondary)("Ditayangkan"), data.tanggal_rilis],
    [chalk.hex(theme.secondary)("Produser"), data.produser],
    [chalk.hex(theme.secondary)("Genre"), data.genre.map((g: any) => g.name).join(", ")]
  );

  console.log(metaTable.toString());
  logger.br();

  const synopsisBox = boxen(chalk.white(data.synopsis), {
    padding: 1,
    margin: 1,
    borderStyle: "single",
    borderColor: theme.muted,
    title: chalk.bold.white("Sinopsis"),
    titleAlignment: "left",
  });
  console.log(synopsisBox);

  if (data.batch) {
    logger.br();
    logger.muted(`  📦 Batch Tersedia`);
    logger.br();
  }
};

export const printQualityOptions = (qualities: any[]) => {
  const table = new Table({
    head: [chalk.bold.white("No"), chalk.bold.white("Quality"), chalk.bold.white("Providers")],
    colWidths: [5, 15, 10],
    style: { head: [], border: [theme.border] },
  });

  qualities.forEach((q, idx) => {
    table.push([
      chalk.hex(theme.primary).bold(idx + 1),
      chalk.white(q.quality),
      chalk.hex(theme.muted)(q.providers.length),
    ]);
  });

  console.log(table.toString());
};

export const printSearchResults = (list: any[]) => {
  if (list.length === 0) {
    logger.muted("No anime found");
    return;
  }

  const table = new Table({
    head: [
      chalk.bold.white("No"),
      chalk.bold.white("Title"),
      chalk.bold.white("Status"),
      chalk.bold.white("Score"),
    ],
    colWidths: [5, 50, 15, 7],
    wordWrap: true,
    style: { head: [], border: [theme.border] },
  });

  list.forEach((anime, idx) => {
    const scoreColor =
      anime.rating && parseFloat(anime.rating) >= 8.0
        ? theme.success
        : anime.rating && parseFloat(anime.rating) >= 6.0
        ? theme.warning
        : theme.muted;
    table.push([
      chalk.hex(theme.primary).bold((idx + 1).toString().padStart(2, "0")),
      anime.title,
      chalk.hex(theme.success)(anime.status),
      chalk.hex(scoreColor)(anime.rating || "-"),
    ]);
  });

  console.log(table.toString());
};

export const printGenreAnimeList = (list: any[]) => {
  if (list.length === 0) {
    logger.muted("No anime found");
    return;
  }

  const table = new Table({
    head: [
      chalk.bold.white("No"),
      chalk.bold.white("Title"),
      chalk.bold.white("Eps"),
      chalk.bold.white("Score"),
    ],
    colWidths: [5, 55, 6, 7],
    wordWrap: true,
    style: { head: [], border: [theme.border] },
  });

  list.forEach((anime, idx) => {
    const scoreColor =
      anime.rating && parseFloat(anime.rating) >= 8.0
        ? theme.success
        : anime.rating && parseFloat(anime.rating) >= 6.0
        ? theme.warning
        : theme.muted;
    table.push([
      chalk.hex(theme.primary).bold((idx + 1).toString().padStart(2, "0")),
      anime.title,
      anime.episode || "-",
      chalk.hex(scoreColor)(anime.rating || "-"),
    ]);
  });

  console.log(table.toString());
};

export const printGenreList = (list: any[]) => {
  if (list.length === 0) {
    logger.muted("No genres available");
    return;
  }

  const COLS = 2;
  const ROWS = Math.ceil(list.length / COLS);

  const table = new Table({
    head: Array(COLS).fill(chalk.bold.white("No")),
    colWidths: Array(COLS).fill(25),
    wordWrap: true,
    style: { head: [], border: [theme.border] },
  });

  for (let row = 0; row < ROWS; row++) {
    const tableRow: string[] = [];
    for (let col = 0; col < COLS; col++) {
      const idx = row + col * ROWS;
      if (idx < list.length) {
        const item = list[idx];
        tableRow.push(
          chalk.hex(theme.primary).bold((idx + 1).toString().padStart(2, "0")) +
            ". " +
            chalk.white(item.name)
        );
      } else {
        tableRow.push("");
      }
    }
    table.push(tableRow);
  }

  console.log(table.toString());
};

export const printPaginationControls = (
  pagination: any,
  currentTitle: string,
  showBack?: boolean
) => {
  if (!pagination) return;

  logger.br();
  logger.muted(`  📚 ${currentTitle} | Page: ${chalk.white(pagination.current_page)}`);

  let controls = "";
  if (pagination.current_page > 1) {
    controls += `${chalk.hex(theme.warning).bold("[P] Prev")}  `;
  }
  controls += `${chalk.hex(theme.success).bold("[N] Next")}  `;
  if (showBack) {
    controls += `${chalk.hex(theme.error).bold("[B] Back")}`;
  }

  console.log(`\n  ${controls}`);
  logger.br();
};

export const printSchedule = (list: any[]) => {
  list.forEach((day: any) => {
    console.log(`\n  ${chalk.hex(theme.secondary).bold("📅 " + day.day)}`);
    if (day.anime_list.length === 0) {
      logger.muted("  No anime scheduled");
      return;
    }

    const table = new Table({
      head: [chalk.bold.white("No"), chalk.bold.white("Title")],
      colWidths: [5, 60],
      wordWrap: true,
      style: { head: [], border: [theme.border] },
    });

    day.anime_list.forEach((anime: ScheduleAnimeItem, idx: number) => {
      table.push([
        chalk.hex(theme.primary).bold((idx + 1).toString().padStart(2, "0")),
        anime.title,
      ]);
    });

    console.log(table.toString());
  });
};

export const printBatchFormats = (formats: any[]) => {
  const table = new Table({
    head: [chalk.bold.white("No"), chalk.bold.white("Format")],
    colWidths: [5, 30],
    style: { head: [], border: [theme.border] },
  });

  formats.forEach((f, idx) => {
    const num = chalk.hex(theme.primary).bold(`[${idx + 1}]`);
    table.push([num, f.title]);
  });

  console.log(table.toString());
};

export const printBatchQualities = (qualities: any[]) => {
  const table = new Table({
    head: [chalk.bold.white("No"), chalk.bold.white("Quality")],
    colWidths: [5, 30],
    style: { head: [], border: [theme.border] },
  });

  qualities.forEach((q, idx) => {
    const num = chalk.hex(theme.primary).bold(`[${idx + 1}]`);
    table.push([num, q.title]);
  });

  console.log(table.toString());
};

export const printBatchProviders = (providers: any[]) => {
  const table = new Table({
    head: [chalk.bold.white("No"), chalk.bold.white("Provider")],
    colWidths: [5, 30],
    style: { head: [], border: [theme.border] },
  });

  providers.forEach((p, idx) => {
    const name = p.provider || p.title;
    const num = chalk.hex(theme.primary).bold(`[${idx + 1}]`);
    table.push([num, name]);
  });

  console.log(table.toString());
};

export const printDownloadOptions = (downloads: any[]) => {
  const table = new Table({
    head: [chalk.bold.white("No"), chalk.bold.white("Quality"), chalk.bold.white("Size")],
    colWidths: [5, 20, 15],
    style: { head: [], border: [theme.border] },
  });

  downloads.forEach((dl, idx) => {
    const num = chalk.hex(theme.primary).bold(`[${idx + 1}]`);
    table.push([num, dl.resolution, chalk.hex(theme.warning)(dl.size)]);
  });

  console.log(table.toString());
};

export const printFAQ = () => {
  const faqData = [
    {
      q: chalk.hex(theme.secondary).bold("P: Video player apa saja yang mendukung?"),
      a: chalk.white(
        "J: Hanya MPV. Jika MPV tidak ditemukan, streaming akan diarahkan ke browser."
      ),
    },
    {
      q: chalk.hex(theme.secondary).bold("P: Bagaimana cara menginstall choco (Windows)?"),
      a:
        chalk.white("J: Jalankan di PowerShell (Run Administrator):") +
        "\n" +
        chalk
          .hex(theme.warning)
          .bold(
            "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1  '))"
          ),
    },
    {
      q: chalk.hex(theme.secondary).bold("P: Bagaimana cara menginstall MPV?"),
      a:
        chalk.white("J: Windows (PowerShell Admin): choco install mpv") +
        "\n" +
        chalk.white("   macOS (Terminal): brew install mpv") +
        "\n" +
        chalk.white("   Linux: sudo apt install mpv"),
    },
    {
      q: chalk
        .hex(theme.secondary)
        .bold(
          "P: Sudah menginstall MPV tapi saat ingin menonton episode video player tidak muncul?"
        ),
      a:
        chalk.white(
          "J: Ini disebabkan karena yt-dlp belum terinstall. MPV butuh yt-dlp untuk streaming link."
        ) +
        "\n" +
        chalk.white("   Windows: choco install yt-dlp") +
        "\n" +
        chalk.white("   macOS: brew install yt-dlp"),
    },
    {
      q: chalk.hex(theme.secondary).bold("P: Apakah ada rate limiting?"),
      a:
        chalk.white("J: Ya. Kami membatasi 100 permintaan permenit.") +
        "\n" +
        chalk.white("   Anichi akan otomatis mengatur jeda antar request.") +
        "\n" +
        chalk.white("   Jangan terlalu cepat navigasi agar tidak terkena limit."),
    },
    {
      q: chalk
        .hex(theme.secondary)
        .bold("P: Saat ingin menonton, video player (MPV) tidak muncul?"),
      a: chalk.white("J: Coba beberapa kali, jika masih tidak bisa ganti quality."),
    },
  ];

  logger.br();
  console.log(chalk.hex(theme.secondary).bold("  Frequently Asked Questions"));
  logger.br();

  faqData.forEach((item) => {
    console.log(item.q);
    console.log(item.a);
    logger.br();
  });

  logger.muted(`  Ketik 'back' atau '0' untuk kembali.\n`);
};

export const printWatchHistory = (items: WatchHistoryItem[]) => {
  if (items.length === 0) {
    const content = chalk.hex(theme.muted)("Belum ada riwayat tontonan.");
    console.log(
      boxen(content, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: theme.muted,
        title: "Riwayat Kosong",
        titleAlignment: "center",
      })
    );
    return;
  }

  const table = new Table({
    head: [
      chalk.bold.white("No"),
      chalk.bold.white("Judul Anime"),
      chalk.bold.white("Episode"),
      chalk.bold.white("Waktu"),
      chalk.bold.white("Resume"),
    ],
    colWidths: [5, 40, 10, 20, 20],
    wordWrap: true,
    style: { head: [], border: [theme.border] },
  });

  items.forEach((item, idx) => {
    const date = new Date(item.timestamp);
    const waktu = date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const resume = getResumeForEpisode(item.slug, item.episode);
    const resumeText = resume
      ? chalk.hex(theme.warning)(`Lanjut ${formatTime(resume.position)}`)
      : "-";

    table.push([
      chalk.hex(theme.primary).bold((idx + 1).toString()),
      item.animeTitle,
      `Ep ${item.episode}`,
      chalk.hex(theme.info)(waktu),
      resumeText,
    ]);
  });

  console.log(table.toString());
};