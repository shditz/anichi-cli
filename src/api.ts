import axios, {AxiosInstance} from "axios";
import NodeCache from "node-cache";
import ora from "ora";
import {
  HomeResponse,
  OngoingResponse,
  CompletedResponse,
  AnimeDetailResponse,
  GenreResponse,
  EpisodeResponse,
  ServerResponse,
  BatchResponse,
  SearchResponse,
  ScheduleResponse,
  GenreAnimeResponse,
} from "./types";
import {logger} from "./ui";

const BASE_URL = "https://shivraapi.my.id/otd";
const CACHE_TTL = 3600;
const MAX_RETRIES = 3;
const MIN_REQUEST_DELAY = 600;

class ApiClient {
  private client: AxiosInstance;
  private cache: NodeCache;
  private lastRequestTime: number = 0;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 60000,
    });
    this.cache = new NodeCache({stdTTL: CACHE_TTL, checkperiod: 600});
  }

  private async request(url: string): Promise<any> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;

    if (elapsed < MIN_REQUEST_DELAY) {
      const waitTime = MIN_REQUEST_DELAY - elapsed;
      await new Promise((r) => setTimeout(r, waitTime));
    }
    this.lastRequestTime = now;

    const cached = this.cache.get(url);
    if (cached) return cached;

    const spinner = ora({
      text: "Loading data...",
      color: "cyan",
    }).start();

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const {data, status} = await this.client.get(url);

        if (status !== 200) throw new Error(`HTTP ${status}`);

        if (data.meta && data.meta.status === true) {
          this.cache.set(url, data);
          spinner.succeed();
          return data;
        } else {
          spinner.warn(data.meta?.message || "Request failed");
          return data;
        }
      } catch (err: any) {
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
    return this.request("/");
  }

  async getOngoing(page: number = 1) {
    return this.request(`/ongoing?page=${page}`);
  }

  async getCompleted(page: number = 1) {
    return this.request(`/completed?page=${page}`);
  }

  async getAnime(slug: string) {
    return this.request(`/anime/${slug}`);
  }

  async getGenre() {
    return this.request("/genres");
  }

  async getEpisode(slug: string) {
    return this.request(`/episode/${slug}`);
  }

  async getServer(id: string) {
    return {meta: {status: false}, data: {}};
  }

  async getBatch(slug: string) {
    return this.request(`/batch/${slug}`);
  }

  async getSearch(keyword: string) {
    return this.request(`/search?q=${encodeURIComponent(keyword)}`);
  }

  async getSchedule() {
    return this.request("/schedule");
  }

  async getGenreAnime(slug: string, page: number = 1) {
    return this.request(`/genres/${slug}?page=${page}`);
  }

  clearCache() {
    this.cache.flushAll();
    logger.success("Cache cleared");
  }
}

export default new ApiClient();
