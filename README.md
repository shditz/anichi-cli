# 🎌 Anichi

<div align="center">

![Version](https://img.shields.io/badge/version-2.9.1-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)

**A Modern, Interactive CLI for Discovering, Streaming, and Managing Anime Directly from the Terminal**

Built by Aditya K.

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Setup Guide](#-setup-guide-mpv--yt-dlp) • [Troubleshooting](#-troubleshooting) • [License](#-license)

</div>

---

## 🌟 Features

Anichi brings a premium anime streaming experience to your terminal with a focus on speed and aesthetics, powered by the **ShivraAPI**:

- **📡 Powered by ShivraAPI**: High-performance API integration (`https://shivraapi.my.id/otd`) providing fast, reliable, and up-to-date anime data including schedules, genres, and streaming links.
- **🎨 Premium Modern UI**: Gradient banners, elegant tables, ASCII art, and vibrant color themes powered by `chalk`, `boxen`, `figlet`, and `gradient-string`.
- **📂 Comprehensive Browsing**:
  - **Ongoing Anime**: Track currently airing series with release days and latest episodes.
  - **Completed Anime**: Explore finished series with ratings and scores.
  - **Popular Anime**: Discover trending and high-rated titles.
  - **Search by Genre**: Filter anime by categories (Action, Adventure, Comedy, etc.).
  - **Anime Schedule**: View broadcast schedule organized by day of the week.
  - **Smart Search**: Instantly search anime by title with detailed metadata.
- **📺 Optimized Streaming**:
  - Play episodes directly using **MPV**.
  - **Browser Fallback**: Automatic fallback to browser if MPV is unavailable.
- **⬇️ Download Support**:
  - **Single Episode**: Download with multiple resolution and provider options.
  - **Batch Downloads**: Download entire series with format/quality selection.
- **⚙️ Configuration & History**:
  - **Config Management**: Customize player paths and arguments easily.
  - **Watch History**: Automatically tracks your recently watched episodes.
- **⚡ Performance**: Built-in intelligent caching with rate-limiting protection to ensure smooth API interactions.

---

## 🛠️ Tech Stack

Anichi is built with modern, efficient libraries:

- **Language**: TypeScript 5.x
- **Runtime**: Node.js 18+
- **Data Source**: [ShivraAPI](https://shivraapi.my.id) - Open Anime Data API
- **CLI Framework**: Commander.js
- **HTTP Client**: Axios (with Node-Cache)
- **UI/Styling**: `chalk`, `cli-table3`, `boxen`, `gradient-string`, `figlet`
- **Process Management**: `ora` (spinners), `open` (cross-platform opener)
- **Video Player**: Optimized for MPV with `yt-dlp` integration

---

## 📦 Requirements

Before installing Anichi, ensure you have the following:

1.  **Node.js** version `18.0.0` or higher.
2.  **MPV Player** (Recommended for the best experience).
3.  **yt-dlp** (Required for MPV to stream video links).

> 💡 **Note**: Without `yt-dlp`, MPV cannot open most streaming links, and Anichi will automatically fallback to your web browser.

---

## 🚀 Installation

### Install via NPM

```bash
npm install -g anichi
```

### Install via Yarn

```bash
yarn global add anichi
```

### Verify Installation

```bash
anichi --version
# Output: 2.9.1

anichi --help
# Shows available commands
```

---

## 💻 Usage

### Launch Interactive Menu

Start the application:

```bash
anichi home or an home
```

This launches the interactive dashboard. Navigate using your keyboard arrow keys (↑/↓) and press Enter to select.

### Command Line Options

#### Direct Playback

Skip the menu and play a specific episode immediately:

```bash
anichi play <slug> <episode>
```

**Example:**

```bash
anichi play one-piece 1070
```

#### Configuration Management

```bash
# View current config
anichi config show

# Set custom MPV path
anichi config set playerPath "C:\mpv\mpv.exe"

# Set MPV arguments (e.g., force fullscreen)
anichi config set playerArgs "--fullscreen"
```

#### Cache Management

Clear cached data to force fresh API fetches:

```bash
anichi cache clear
```

---

## 🎬 Menu Guide

#### 1. 🔄 Ongoing Anime

Browse anime currently airing. Shows release day, latest episode, and air date.

- **Nav**: `n` (Next), `p` (Prev), `[number]` (Select Anime).

#### 2. ✅ Completed Anime

Browse finished series sorted by completion date and rating.

#### 3. 🌟 Popular Anime

Discover top-rated and trending anime.

#### 4. 🔍 Search Anime

Find anime by title.

- **Input**: Type anime name (e.g., "Naruto").

#### 5. 🎬 Search by Genre

Filter anime by specific categories (Action, Isekai, Slice of Life, etc.).

#### 6. 📅 Schedule Anime

View the weekly broadcast schedule organized by day (Senin - Minggu).

#### 7. 🕒 History Anime

View and resume your recently watched episodes.

#### 8. ❓ FAQ

Built-in help guide for installation and troubleshooting.

---

## 🛠️ Setup Guide: MPV & yt-dlp

For the best experience, using **MPV** is highly recommended.

### Windows (Recommended: Chocolatey)

1.  **Install Chocolatey** (Run PowerShell as Admin):

    ```powershell
    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    ```

2.  **Install Tools**:
    ```powershell
    choco install mpv yt-dlp -y
    ```

### macOS (Homebrew)

```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MPV and yt-dlp
brew install mpv yt-dlp
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install mpv yt-dlp -y
```

---

## 🐛 Troubleshooting

### ❓ "MPV Player tidak ditemukan" (MPV Not Found)

- **Solution**: Ensure MPV is installed and added to your system PATH. If installed in a custom location, set it manually:
  ```bash
  anichi config set playerPath "C:\Path\To\Your\mpv.exe"
  ```

### ❓ Video doesn't play / MPV closes immediately

- **Cause**: You likely do not have **yt-dlp** installed.
- **Solution**: MPV requires `yt-dlp` to extract direct video streams from hosting sites. Install it using commands in the [Setup Guide](#-setup-guide-mpv--yt-dlp) above. If `yt-dlp` is missing, Anichi will automatically fallback to opening the video in your browser.

### ❓ "Rate Limiting" / "Too Many Requests"

- **Cause**: The API has rate limits to prevent abuse.
- **Solution**: Anichi has built-in delays and caching. Avoid rapidly switching pages (mashing Next/Prev) to allow the cooldown to reset.

### ❓ Pagination stuck or wrong data

- **Solution**: Clear the cache to fetch fresh data:
  ```bash
  anichi cache clear
  ```

---

## 📁 Project Structure

```
anichi/
├── src/
|   ├── ui
|   |   ├── interactive.ts  # Terminal UI Interactive
│   ├── index.ts            # Main logic, commands, and CLI flow
│   ├── api.ts              # HTTP client (Axios) and caching logic
│   ├── ui.ts               # Terminal UI, tables, and colors
│   ├── player.ts           # MPV detection and spawning logic
│   ├── config.ts           # Configuration file handling
│   ├── types.ts            # TypeScript interfaces
│   └── history.ts          # Watch history management
├── bin/
│   └── anichi              # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributors

We would like to thank the following contributors who have helped improve this project:

- [Hafast 2008](https://github.com/2Hafast8)

---

## 🙏 Credits

- **Created By**: Aditya K.
- **Email**: adityarabbyoka3@gmail.com
- **Data API**: [ShivraAPI](https://shivraapi.my.id) by ShDitz
- **Special Thanks**: Open Source Community

---

<div align="center">

### Made with ❤️ and ☕ by Aditya K.

If you find Anichi useful, please give it a ⭐ on GitHub!

</div>
