"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const node_cache_1 = __importDefault(require("node-cache"));
const ora_1 = __importDefault(require("ora"));
const ui_1 = require("./ui");
const BASE_URL = "https://www.sankavollerei.com/anime";
const CACHE_TTL = 3600;
const MAX_RETRIES = 3;
const MIN_REQUEST_DELAY = 600;
class ApiClient {
    constructor() {
        this.lastRequestTime = 0;
        this.client = axios_1.default.create({
            baseURL: BASE_URL,
            timeout: 60000,
        });
        this.cache = new node_cache_1.default({ stdTTL: CACHE_TTL, checkperiod: 600 });
    }
    async request(url) {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < MIN_REQUEST_DELAY) {
            const waitTime = MIN_REQUEST_DELAY - elapsed;
            await new Promise((r) => setTimeout(r, waitTime));
        }
        this.lastRequestTime = now;
        const cached = this.cache.get(url);
        if (cached)
            return cached;
        const spinner = (0, ora_1.default)({
            text: "Loading data...",
            color: "cyan",
        }).start();
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const { data, status } = await this.client.get(url);
                if (data.statusCode === 404) {
                    spinner.warn("Not found");
                    return data;
                }
                if (status !== 200)
                    throw new Error(`HTTP ${status}`);
                if (data.ok === true || data.status === "success") {
                    this.cache.set(url, data);
                }
                spinner.succeed();
                return data;
            }
            catch (err) {
                if (attempt === MAX_RETRIES - 1) {
                    spinner.fail();
                    throw err;
                }
                const delay = Math.pow(2, attempt + 1) * 1000;
                spinner.text = `Retry ${attempt + 1}/${MAX_RETRIES}...`;
                await new Promise((r) => setTimeout(r, delay));
            }
        }
        throw new Error("Request failed");
    }
    async getHome() {
        return this.request("/home");
    }
    async getOngoing(page = 1) {
        return this.request(`/ongoing-anime?page=${page}`);
    }
    async getCompleted(page = 1) {
        return this.request(`/complete-anime?page=${page}`);
    }
    async getAnime(slug) {
        return this.request(`/anime/${slug}`);
    }
    async getGenre() {
        return this.request("/genre");
    }
    async getEpisode(slug) {
        return this.request(`/episode/${slug}`);
    }
    async getServer(id) {
        return this.request(`/server/${id}`);
    }
    async getBatch(slug) {
        return this.request(`/batch/${slug}`);
    }
    async getSearch(keyword) {
        return this.request(`/search/${keyword}`);
    }
    async getSchedule() {
        return this.request(`/schedule`);
    }
    async getGenreAnime(slug, page = 1) {
        return this.request(`/genre/${slug}?page=${page}`);
    }
    clearCache() {
        this.cache.flushAll();
        ui_1.logger.success("Cache cleared");
    }
}
exports.default = new ApiClient();
//# sourceMappingURL=api.js.map