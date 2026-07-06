// src/ui/interactive.ts
import chalk from "chalk";
import readline from "readline";

// === Cyberpunk Minimalist Theme ===
const ui = {
  accent: "#00f5ff",      // Neon Cyan
  accentAlt: "#ff007f",   // Neon Pink
  text: "#e2e8f0",        // Light Slate (text biasa)
  muted: "#64748b",       // Slate Gray (text redup)
  activeBg: "#0f172a",    // Navy gelap (highlight baris aktif)
  pointer: "❯",           // Karakter penunjuk modern
  separator: "─",
};

// Fungsi untuk memotong teks dan menambahkan "..." jika terlalu panjang
function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length - 3) + "...";
}

// Footer navigasi yang konsisten
function renderFooter(): string {
  return (
    chalk.hex(ui.muted)("  ") +
    chalk.hex(ui.accent)("↑↓") + chalk.hex(ui.muted)(" Navigasi") +
    chalk.hex(ui.muted)("  •  ") +
    chalk.hex(ui.accent)("Enter") + chalk.hex(ui.muted)(" Pilih") +
    chalk.hex(ui.muted)("  •  ") +
    chalk.hex(ui.accent)("Ctrl+C") + chalk.hex(ui.muted)(" Keluar")
  );
}

// Fungsi untuk membuat tabel navigasi yang hanya menampilkan bagian yang muat di layar
function createNavigationTable(
  choices: { name: string; value: string }[],
  selectedIndex: number,
  visibleCount: number = 10 // Jumlah baris yang ditampilkan
): string {
  const lines: string[] = [];

  const startIndex = Math.max(0, selectedIndex - Math.floor(visibleCount / 2));
  const endIndex = Math.min(choices.length, startIndex + visibleCount);

  // Scroll indicator atas
  if (startIndex > 0) {
    lines.push(chalk.hex(ui.muted)("    ↑ " + (startIndex) + " item lainnya"));
  }

  const visibleChoices = choices.slice(startIndex, endIndex);
  const offset = startIndex;

  visibleChoices.forEach((choice, i) => {
    const actualIndex = offset + i;
    const isActive = actualIndex === selectedIndex;

    if (choice.name === "──────────────────") {
      // Separator
      lines.push(chalk.hex(ui.muted)("  " + ui.separator.repeat(72)));
    } else if (choice.name.startsWith("[") && (choice.name.includes("Back") || choice.name.includes("Next") || choice.name.includes("Previous"))) {
      // Aksi navigasi
      const pointer = isActive ? chalk.hex(ui.accent).bold(` ${ui.pointer} `) : "   ";
      const label = isActive
        ? chalk.bgHex(ui.activeBg).hex(ui.accentAlt).bold(` ${choice.name} `)
        : chalk.hex(ui.accentAlt)(` ${choice.name}`);
      lines.push(pointer + label);
    } else {
      // Pilihan biasa
      let simplifiedName = choice.name;

      // Coba ekstrak info penting: Judul, No Ep, Tanggal, Resume
      const epRegex = /(.*?)\s+(Episode\s+\d+(?:\s+\([^)]+\))?|Eps?\s*\d+(?:\s+\([^)]+\))?|Eps?\s*\d+)\s*(.*)/i;
      const match = choice.name.match(epRegex);

      if (match) {
        const title = match[1].trim();
        const epPart = match[2].trim();
        const rest = match[3].trim();

        let datePart = "";
        let resumePart = "";

        const dateResumeRegex = /^(.*)\s+\(Resume:\s*(.*)\)\s*$/;

        if (rest.includes("(Resume:")) {
          const drMatch = rest.match(dateResumeRegex);
          if (drMatch) {
            datePart = drMatch[1].trim();
            resumePart = `Resume: ${drMatch[2]}`;
          } else {
            const parts = rest.split(" • ");
            if (parts.length >= 2) {
              datePart = parts.slice(0, -1).join(" • ");
              const lastPart = parts[parts.length - 1];
              if (lastPart.startsWith("(Resume:")) {
                resumePart = lastPart.replace(/[()]/g, "");
              } else {
                datePart += ` • ${lastPart}`;
              }
            } else {
              datePart = rest;
            }
          }
        } else {
          const parts = rest.split(" • ");
          if (parts.length >= 2) {
            datePart = parts[0];
            for (let j = 1; j < parts.length; j++) {
              if (parts[j].startsWith("(Resume:")) {
                resumePart = parts[j].replace(/[()]/g, "");
                break;
              }
            }
          } else {
            datePart = rest;
          }
        }

        simplifiedName = `${title}  ${epPart}`;
        if (datePart) simplifiedName += `  ${chalk.hex(ui.muted)("•")}  ${datePart}`;
        if (resumePart) simplifiedName += `  ${chalk.hex(ui.accentAlt)("│")}  ${chalk.hex(ui.accentAlt)(resumePart)}`;
      }

      // Pointer & label
      const pointer = isActive ? chalk.hex(ui.accent).bold(` ${ui.pointer} `) : "   ";
      const num = chalk.hex(ui.muted)((actualIndex + 1).toString().padStart(2) + ".");

      const label = isActive
        ? chalk.bgHex(ui.activeBg).hex(ui.accent).bold(" " + truncate(simplifiedName, 72) + " ")
        : chalk.hex(ui.text)(truncate(simplifiedName, 72));

      lines.push(pointer + num + " " + label);
    }
  });

  // Scroll indicator bawah
  const remaining = choices.length - endIndex;
  if (remaining > 0) {
    lines.push(chalk.hex(ui.muted)("    ↓ " + remaining + " item lainnya"));
  }

  return lines.join("\n");
}


// Fungsi utama untuk Home
export async function askInteractiveHome(
  message: string,
  choices: { name: string; value: string }[],
  renderContext: () => void
): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    let selectedIndex = 0;

    const render = () => {
      console.clear();
      renderContext();

      console.log(chalk.hex("#00f5ff").bold("🏠 ") + chalk.hex("#00f5ff").bold(message));
      console.log(createNavigationTable(choices, selectedIndex));
      console.log(`\n${renderFooter()}`);
    };

    const handler = (_str: string, key: any) => {
      if (key?.name === "up") {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render();
      } else if (key?.name === "down") {
        selectedIndex = Math.min(choices.length - 1, selectedIndex + 1);
        render();
      } else if (key?.name === "return") {
        cleanup();
        resolve(choices[selectedIndex].value);
      }
    };

    const cleanup = () => {
      rl.close();
      process.stdin.removeListener("keypress", handler as any);
      if ((process.stdin as any).isTTY) {
        (process.stdin as any).setRawMode(false);
      }
    };

    if ((process.stdin as any).isTTY) {
      (process.stdin as any).setRawMode(true);
      process.stdin.on("keypress", handler as any);
      render();
    } else {
      cleanup();
      resolve(choices[0]?.value || "");
    }
  });
}

// Fungsi utama untuk Menu Utama (Ongoing, Completed, Popular)
export async function askInteractiveMain(
  message: string,
  choices: { name: string; value: string }[],
  renderContext: () => void
): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    let selectedIndex = 0;

    const render = () => {
      console.clear();
      renderContext();

      console.log(chalk.hex("#00f5ff").bold("📺 ") + chalk.hex("#00f5ff").bold(message));
      console.log(createNavigationTable(choices, selectedIndex));
      console.log(`\n${renderFooter()}`);
    };

    const handler = (_str: string, key: any) => {
      if (key?.name === "up") {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render();
      } else if (key?.name === "down") {
        selectedIndex = Math.min(choices.length - 1, selectedIndex + 1);
        render();
      } else if (key?.name === "return") {
        cleanup();
        resolve(choices[selectedIndex].value);
      }
    };

    const cleanup = () => {
      rl.close();
      process.stdin.removeListener("keypress", handler as any);
      if ((process.stdin as any).isTTY) {
        (process.stdin as any).setRawMode(false);
      }
    };

    if ((process.stdin as any).isTTY) {
      (process.stdin as any).setRawMode(true);
      process.stdin.on("keypress", handler as any);
      render();
    } else {
      cleanup();
      resolve(choices[0]?.value || "");
    }
  });
}

// Fungsi untuk Search
export async function askInteractiveSearch(
  message: string,
  choices: { name: string; value: string }[],
  renderContext: () => void
): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    let selectedIndex = 0;

    const render = () => {
      console.clear();
      renderContext();

      console.log(chalk.hex("#00f5ff").bold("🔍 ") + chalk.hex("#00f5ff").bold(message));
      console.log(createNavigationTable(choices, selectedIndex));
      console.log(`\n${renderFooter()}`);
    };

    const handler = (_str: string, key: any) => {
      if (key?.name === "up") {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render();
      } else if (key?.name === "down") {
        selectedIndex = Math.min(choices.length - 1, selectedIndex + 1);
        render();
      } else if (key?.name === "return") {
        cleanup();
        resolve(choices[selectedIndex].value);
      }
    };

    const cleanup = () => {
      rl.close();
      process.stdin.removeListener("keypress", handler as any);
      if ((process.stdin as any).isTTY) {
        (process.stdin as any).setRawMode(false);
      }
    };

    if ((process.stdin as any).isTTY) {
      (process.stdin as any).setRawMode(true);
      process.stdin.on("keypress", handler as any);
      render();
    } else {
      cleanup();
      resolve(choices[0]?.value || "");
    }
  });
}

// Fungsi untuk Genre
export async function askInteractiveGenre(
  message: string,
  choices: { name: string; value: string }[],
  renderContext: () => void
): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    let selectedIndex = 0;

    const render = () => {
      console.clear();
      renderContext();

      console.log(chalk.hex("#00f5ff").bold("🏷️ ") + chalk.hex("#00f5ff").bold(message));
      console.log(createNavigationTable(choices, selectedIndex));
      console.log(`\n${renderFooter()}`);
    };

    const handler = (_str: string, key: any) => {
      if (key?.name === "up") {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render();
      } else if (key?.name === "down") {
        selectedIndex = Math.min(choices.length - 1, selectedIndex + 1);
        render();
      } else if (key?.name === "return") {
        cleanup();
        resolve(choices[selectedIndex].value);
      }
    };

    const cleanup = () => {
      rl.close();
      process.stdin.removeListener("keypress", handler as any);
      if ((process.stdin as any).isTTY) {
        (process.stdin as any).setRawMode(false);
      }
    };

    if ((process.stdin as any).isTTY) {
      (process.stdin as any).setRawMode(true);
      process.stdin.on("keypress", handler as any);
      render();
    } else {
      cleanup();
      resolve(choices[0]?.value || "");
    }
  });
}

// Fungsi untuk Schedule
export async function askInteractiveSchedule(
  message: string,
  choices: { name: string; value: string }[],
  renderContext: () => void
): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    let selectedIndex = 0;

    const render = () => {
      console.clear();
      renderContext();

      console.log(chalk.hex("#00f5ff").bold("📅 ") + chalk.hex("#00f5ff").bold(message));
      console.log(createNavigationTable(choices, selectedIndex));
      console.log(`\n${renderFooter()}`);
    };

    const handler = (_str: string, key: any) => {
      if (key?.name === "up") {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render();
      } else if (key?.name === "down") {
        selectedIndex = Math.min(choices.length - 1, selectedIndex + 1);
        render();
      } else if (key?.name === "return") {
        cleanup();
        resolve(choices[selectedIndex].value);
      }
    };

    const cleanup = () => {
      rl.close();
      process.stdin.removeListener("keypress", handler as any);
      if ((process.stdin as any).isTTY) {
        (process.stdin as any).setRawMode(false);
      }
    };

    if ((process.stdin as any).isTTY) {
      (process.stdin as any).setRawMode(true);
      process.stdin.on("keypress", handler as any);
      render();
    } else {
      cleanup();
      resolve(choices[0]?.value || "");
    }
  });
}

// Fungsi untuk History
export async function askInteractiveHistory(
  message: string,
  choices: { name: string; value: string }[],
  renderContext: () => void
): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    let selectedIndex = 0;

    const render = () => {
      console.clear();
      renderContext();

      console.log(chalk.hex("#00f5ff").bold("🕒 ") + chalk.hex("#00f5ff").bold(message));
      console.log(createNavigationTable(choices, selectedIndex));
      console.log(`\n${renderFooter()}`);
    };

    const handler = (_str: string, key: any) => {
      if (key?.name === "up") {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render();
      } else if (key?.name === "down") {
        selectedIndex = Math.min(choices.length - 1, selectedIndex + 1);
        render();
      } else if (key?.name === "return") {
        cleanup();
        resolve(choices[selectedIndex].value);
      }
    };

    const cleanup = () => {
      rl.close();
      process.stdin.removeListener("keypress", handler as any);
      if ((process.stdin as any).isTTY) {
        (process.stdin as any).setRawMode(false);
      }
    };

    if ((process.stdin as any).isTTY) {
      (process.stdin as any).setRawMode(true);
      process.stdin.on("keypress", handler as any);
      render();
    } else {
      cleanup();
      resolve(choices[0]?.value || "");
    }
  });
}

// Fungsi untuk Episode
export async function askInteractiveEpisode(
  message: string,
  choices: { name: string; value: string }[],
  renderContext: () => void
): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    let selectedIndex = 0;

    // Tambahkan log untuk melihat state awal
    console.log("DEBUG: Initial selectedIndex =", selectedIndex);

    const render = () => {
      console.clear();
      renderContext();

      console.log(chalk.hex("#00f5ff").bold("🎬 ") + chalk.hex("#00f5ff").bold(message));
      console.log(createNavigationTable(choices, selectedIndex));
      console.log(`\n${renderFooter()}`);
    };

    const handler = (_str: string, key: any) => {
      if (key?.name === "up") {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render();
      } else if (key?.name === "down") {
        selectedIndex = Math.min(choices.length - 1, selectedIndex + 1);
        render();
      } else if (key?.name === "return") {
        cleanup();
        resolve(choices[selectedIndex].value);
      }
    };

    const cleanup = () => {
      rl.close();
      process.stdin.removeListener("keypress", handler as any);
      if ((process.stdin as any).isTTY) {
        (process.stdin as any).setRawMode(false);
      }
    };

    if ((process.stdin as any).isTTY) {
      (process.stdin as any).setRawMode(true);
      process.stdin.on("keypress", handler as any);
      render();
    } else {
      cleanup();
      resolve(choices[0]?.value || "");
    }
  });
}

// Fungsi untuk Kualitas
export async function askInteractiveQuality(
  message: string,
  choices: { name: string; value: string }[],
  renderContext: () => void
): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    let selectedIndex = 0;

    const render = () => {
      console.clear();
      renderContext();

      console.log(chalk.hex("#00f5ff").bold("💿 ") + chalk.hex("#00f5ff").bold(message));
      console.log(createNavigationTable(choices, selectedIndex));
      console.log(`\n${renderFooter()}`);
    };

    const handler = (_str: string, key: any) => {
      if (key?.name === "up") {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render();
      } else if (key?.name === "down") {
        selectedIndex = Math.min(choices.length - 1, selectedIndex + 1);
        render();
      } else if (key?.name === "return") {
        cleanup();
        resolve(choices[selectedIndex].value);
      }
    };

    const cleanup = () => {
      rl.close();
      process.stdin.removeListener("keypress", handler as any);
      if ((process.stdin as any).isTTY) {
        (process.stdin as any).setRawMode(false);
      }
    };

    if ((process.stdin as any).isTTY) {
      (process.stdin as any).setRawMode(true);
      process.stdin.on("keypress", handler as any);
      render();
    } else {
      cleanup();
      resolve(choices[0]?.value || "");
    }
  });
}