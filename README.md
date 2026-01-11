# 🎌 Anichi

<div align="center">

![Version](https://img.shields.io/badge/version-2.6.1-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)

**A Modern, Interactive CLI for Discovering, Streaming, and Managing Anime Directly from the Terminal**

Built by Aditya K.

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Development](#-development) • [License](#-license)

</div>

---

## 🌟 Features

Anichi brings the anime streaming experience to your terminal with a modern, interactive interface:

- **🎨 Premium Modern UI**: Gradient banners, elegant tables, ASCII art banners, and vibrant color themes powered by `chalk`, `boxen`, `figlet`, and `gradient-string`
- **📂 Comprehensive Browsing**:
  - **Ongoing Anime**: Browse currently airing anime with release day and latest episode information
  - **Completed Anime**: Explore finished series with scores and ratings
  - **Popular Anime**: Discover trending and popular titles
  - **Search by Genre**: Filter anime by categories (Action, Adventure, Comedy, Drama, etc.)
  - **Anime Schedule**: View broadcast schedule by day of the week
- **🔍 Smart Search**: Instantly search for anime by title with detailed metadata
- **📺 Streaming**: Play episodes directly using MPV or fallback to browser playback
- **⬇️ Downloads**:
  - Single episode downloads with multiple quality options
  - Batch downloads with format, quality, and provider selection
- **⚡ Performance**: Lightning-fast caching system to eliminate redundant API calls
- **⚙️ Configuration**: Easily customize player paths, arguments, and playback preferences
- **🔄 Cache Management**: Clear cached data on demand
- **📊 Pagination Support**: Navigate through large lists with ease

---

## 🛠️ Tech Stack

Anichi is built with modern, battle-tested libraries:

- **Language**: TypeScript 5.x
- **Runtime**: Node.js 18+
- **CLI Framework**: Commander.js 11.x
- **HTTP Client**: Axios 1.6.x
- **UI/Styling**:
  - `chalk` - Terminal color styling
  - `cli-table3` - Data table rendering
  - `boxen` - Text boxes with borders
  - `gradient-string` - Gradient text effects
  - `figlet` - ASCII art banners
  - `chalk-animation` - Animated text
- **User Interaction**:
  - `inquirer` - Interactive CLI prompts
  - `terminal-kit` - Terminal utilities
  - `readline` - Command-line input
- **Performance**:
  - `node-cache` - Fast in-memory caching
  - `log-symbols` - Standard symbols (✓, ✗, ℹ, ⚠)
  - `ora` - Loading spinners
- **Utilities**:
  - `open` - Cross-platform URL/file opening
  - `update-notifier` - Update notifications
  - `string-width` - Text width calculation
  - `wrap-ansi` - ANSI text wrapping
- **Cross-Platform**: Optimized for Windows, macOS, and Linux

---

## 📦 Supported Video Players

Anichi automatically detects and uses the best available video player on your system:

### Primary Player: MPV (Recommended)

**Why MPV?** Lightweight, supports virtually all formats, highly customizable, and perfect for streaming.

**Installation Locations:**

- **Windows**:
  - Scoop: `~/scoop/apps/mpv/current/mpv.exe`
  - Program Files: `C:\Program Files\mpv\mpv.exe`
  - Program Files (x86): `C:\Program Files (x86)\mpv\mpv.exe`
  - Chocolatey: `C:\ProgramData\chocolatey\bin\mpvio.install\tools\mpv.exe`
  - AppData: `%APPDATA%\Local\Programs\mpv\mpv.exe`
- **macOS**:
  - Homebrew: `/opt/homebrew/bin/mpv`
  - MacPorts: `/opt/local/bin/mpv`
  - App Bundle: `/Applications/mpv.app/Contents/MacOS/mpv`
- **Linux**:
  - Snap: `/snap/bin/mpv`
  - Flatpak: `/var/lib/flatpak/exports/bin/io.github.mpv.mpv`
  - Package Manager: `/usr/bin/mpv` or `/usr/local/bin/mpv`

### Fallback: Browser

If no compatible player is found, streams automatically open in your default web browser.

### Important: yt-dlp Requirement

MPV requires **yt-dlp** to extract direct streaming URLs from various sources. Without it, some streams may fail to play.

**Install yt-dlp:**

- Windows: `choco install yt-dlp`
- macOS: `brew install yt-dlp`
- Linux: `sudo apt install yt-dlp` or `sudo pacman -S yt-dlp`

---

## 🚀 Installation

### Prerequisites

- **Node.js 18.0.0** or higher
- **npm** or **yarn** package manager
- **MPV player** (recommended) - See [Supported Video Players](#-supported-video-players)
- **yt-dlp** (required for streaming) - See [Supported Video Players](#-supported-video-players)

### Install Globally via NPM

```bash
npm install -g anichi
```

### Install Globally via Yarn

```bash
yarn global add anichi
```

### Verify Installation

```bash
anichi --version
# Output: 2.6.1

anichi --help
# Shows available commands
```

---

## 💻 Usage

### Launch Interactive Menu

Start the application with:

```bash
an home
```

or

```bash
anichi home
```

This launches the main menu with beautiful ASCII banners and gradient text. Navigate using number inputs (1-7) or keywords.

### Menu Options

#### 1. 🔄 Ongoing Anime

Browse currently airing anime series:

- View release day and latest episode information
- Pagination support (25 items per page)
- Navigate: `n` for next, `p` for previous
- Select anime by number to view details and streaming options

#### 2. ✅ Completed Anime

Explore finished anime series:

- View completion status and ratings/scores
- Pagination support
- Access to all completed episodes

#### 3. 🌟 Popular Anime

Discover trending and popular titles:

- See what the community is watching
- Ratings and current status
- Pagination support

#### 4. 🔍 Search Anime

Find anime by title:

```bash
# When prompted, enter anime title
Enter keyword: Naruto
```

- Displays all matching results
- Shows status and score
- Select to view details

#### 5. 🎬 Search by Genre

Filter anime by category:

- Browse available genres (Action, Adventure, Comedy, Drama, etc.)
- Select genre to view paginated anime list
- Search within genre results

#### 6. 📅 Schedule Anime

View anime broadcast schedule:

- Organized by day of the week (Senin - Minggu)
- Shows airing time when available

#### 7. ❓ FAQ

Frequently asked questions:

- Player installation guides
- Troubleshooting common issues
- Performance tips
- Command reference

---

### 📺 Episode Viewing & Streaming

When viewing an anime's episode list, you have several options:

```
Perintah:
• [nomor] atau 'latest' - Watch episode
• 'b' atau 'batch'      - Download entire series (if available)
• 'd' atau 'download'   - Download single episode
• 'back'                - Return to anime list
```

**Example - Watch Episode:**

```
Peintah: 10
# Starts streaming episode 10 with MPV player

Peintah: latest
# Streams the newest episode
```

**Streaming Process:**

1. Select episode number
2. Choose video quality
3. MPV player launches automatically

### 📼 Episode Downloading

Download episodes for offline viewing:

```
Peintah: d
# Shows available qualities with file sizes
# Select quality → Select provider → Opens download link in browser
```

### 📦 Batch Downloads

Download entire anime series (if available):

```
Peintah: b
# Select format (720p, 1080p, etc.)
# Select quality within format
# Select provider (drive, mega, etc.)
# Opens download link in browser
```

---

### ⌨️ Command Line Commands

#### Direct Episode Playback

Skip the menu and play a specific episode immediately:

```bash
anichi play <slug> <episode>
```

**Example:**

```bash
anichi play one-piece-sub-indo 1070
# Directly streams One Piece episode 1070
```

**Options:**

- `-p, --player <path>` - Custom player path (e.g., `"C:\mpv\mpv.exe"`)
- `-a, --args <args>` - Player arguments (e.g., `"--fullscreen --no-audio-display"`)

**Example with Options:**

```bash
anichi play naruto-shippuden-sub-indo 100 -p "C:\mpv\mpv.exe" -a "--fs --loop"
```

#### Configuration Management

Manage your playback preferences:

```bash
# View current configuration
anichi config show

# Set default player path
anichi config set playerPath "C:\mpv\mpv.exe"

# Set default player arguments
anichi config set playerArgs "--fullscreen --no-border"
```

**Configuration File Location:**

- Windows: `%APPDATA%\.config\anichi\config.json`
- macOS/Linux: `~/.config/anichi/config.json`

#### Cache Management

Clear application cache to force fresh data:

```bash
# Clear all cached anime data
anichi cache clear
```

**When to clear cache:**

- Huge data updates from API
- Outdated episode information
- To reset pagination

---

### 🛠️ Setup Guide: MPV + yt-dlp

#### Windows (Recommended: Chocolatey)

**Step 1: Install Chocolatey** (if not already installed)

Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**Step 2: Install MPV and yt-dlp**

```powershell
choco install mpv yt-dlp -y
```

**Step 3: Verify Installation**

```powershell
mpv --version
yt-dlp --version
```

#### macOS (Homebrew)

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MPV and yt-dlp
brew install mpv yt-dlp

# Verify
mpv --version
yt-dlp --version
```

#### Linux (Ubuntu/Debian)

```bash
# Update package manager
sudo apt update

# Install MPV and yt-dlp
sudo apt install mpv yt-dlp -y

# Verify
mpv --version
yt-dlp --version
```

---

## 🐛 Troubleshooting

### "MPV not found" Error

**Solution 1: Install MPV**

- Windows: `choco install mpv`
- macOS: `brew install mpv`
- Linux: `sudo apt install mpv`

**Solution 2: Set Custom Path**

```bash
anichi config set playerPath "C:\path\to\mpv.exe"
```

### Stream won't load in MPV

**Common Cause:** Missing yt-dlp

**Solution:**

- Windows: `choco install yt-dlp`
- macOS: `brew install yt-dlp`
- Linux: `sudo apt install yt-dlp`

### Rate Limiting (Too Many Requests)

Anichi implements intelligent rate limiting to respect the API:

- Minimum 600ms between requests
- Automatic retry with exponential backoff
- Integrated caching to minimize requests

**Workaround:** Don't rapidly navigate between sections

### Pagination Issues

If pagination seems stuck:

```bash
anichi cache clear
```

---

## 📁 Project Structure

```
anichi/
├── src/
│   ├── index.ts       # Main application logic, CLI commands
│   ├── api.ts         # Axios HTTP client, API integration, caching
│   ├── ui.ts          # Terminal UI, tables, colors, formatting
│   ├── player.ts      # External player detection & management
│   ├── config.ts      # Configuration file handling
│   └── types.ts       # TypeScript interfaces & type definitions
├── bin/
│   └── anichi         # CLI entry point
├── dist/              # Compiled JavaScript (after build)
├── package.json       # Dependencies & scripts
├── tsconfig.json      # TypeScript configuration
├── jest.config.js     # Test configuration
├── README.md          # This file
├── CHANGELOG.md       # Version history
└── LICENSE            # MIT License
```

---

## 🛠️ Development

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/anichi.git
cd anichi

# Install dependencies
npm install

# Start development mode (watches for changes)
npm run dev

# Build project
npm run build

# Link globally for testing
npm link

# Test the CLI
anichi home
```

### Available NPM Scripts

```bash
npm run build       # Compile TypeScript to JavaScript
npm run dev         # Development mode with auto-reload
npm run test        # Run test suite (if configured)
npm run lint        # Check code style with ESLint
npm start           # Run built application
```

### Code Style

- **Language**: TypeScript 5.x
- **Linter**: ESLint
- **Format**: Automatic via tsconfig.json
- **Conventions**: camelCase for variables, PascalCase for types/interfaces

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Credits & Acknowledgments

- **Created By**: Aditya K.
- **Email**: adityarabbyoka3@gmail.com
- **Built With**: TypeScript, Node.js, and amazing open-source libraries

---

## 📞 Support

Need help? Check these resources:

1. **FAQ** - Run `anichi` → Select option 7
2. **Documentation** - See this README for detailed guides

---

<div align="center">

### Made with ❤️ and ☕ by Aditya K.

⭐ If you found this useful, please give it a star! ⭐

</div>
