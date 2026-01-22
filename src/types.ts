export interface ApiResponse<T> {
  meta: {
    status: boolean;
    code: number;
    message: string;
    creator: string;
    source: string;
    timestamp: string;
  };
  data: T;
}

export interface PaginationData {
  current_page: number;
  per_page: number;
}

export interface AnimeSummary {
  title: string;
  cover: string;
  slug: string;
  episode?: string;
  total_episode?: string;
  rating?: string;
  day?: string;
  date?: string;
  status?: string;
  url: string;
}

export interface HomeData {
  info: string;
  status: string;
}

export type HomeResponse = ApiResponse<HomeData>;

export interface OngoingData {
  list: AnimeSummary[];
  pagination: PaginationData;
}

export type OngoingResponse = ApiResponse<OngoingData>;

export interface CompletedData {
  list: AnimeSummary[];
  pagination: PaginationData;
}

export type CompletedResponse = ApiResponse<CompletedData>;

export interface GenreItem {
  name: string;
  slug: string;
  url: string;
}

export interface GenreData {
  list: GenreItem[];
}

export type GenreResponse = ApiResponse<GenreData>;

export interface EpisodeItem {
  title: string;
  slug: string;
  url: string;
  date: string;
}

export interface AnimeDetailData {
  title: string;
  japanese: string;
  skor: string;
  produser: string;
  tipe: string;
  status: string;
  total_episode: string;
  durasi: string;
  tanggal_rilis: string;
  studio: string;
  genre: {name: string; url: string}[];
  synopsis: string;
  url: string;
  batch?: {
    title: string;
    slug: string;
    url: string;
    date: string;
  };
  episode_list: EpisodeItem[];
}

export type AnimeDetailResponse = ApiResponse<AnimeDetailData>;

export interface Provider {
  provider: string;
  url: string;
}

export interface StreamQuality {
  quality: string;
  providers: Provider[];
}

export interface EpisodeData {
  title: string;
  url: string;
  waktu_rilis: string;
  defaultstreaming: string;
  stream: StreamQuality[];
  downloads: {
    resolution: string;
    size: string;
    links: Provider[];
  }[];
}

export type EpisodeResponse = ApiResponse<EpisodeData>;

export interface ServerData {
  url: string;
}

export type ServerResponse = ApiResponse<ServerData>;

export interface BatchData {
  title: string;
  cover: string;
  download_links: {
    resolution: string;
    size: string;
    links: Provider[];
  }[];
}

export type BatchResponse = ApiResponse<BatchData>;

export interface AppConfig {
  [key: string]: any;
  playerPath?: string;
  playerArgs?: string;
  subtitle?: boolean;
  resume?: boolean;
}

export interface SearchAnimeItem {
  title: string;
  cover: string;
  status: string;
  rating: string;
  slug: string;
  url: string;
  genre: string[];
}

export interface SearchData {
  query: string;
  result_count: number;
  list: SearchAnimeItem[];
}

export type SearchResponse = ApiResponse<SearchData>;

export interface ScheduleAnimeItem {
  title: string;
  url: string;
  slug: string;
}

export interface ScheduleData {
  [key: string]: ScheduleAnimeItem[];
}

export type ScheduleResponse = ApiResponse<ScheduleData>;

export interface GenreAnimeItem {
  title: string;
  cover: string;
  status: string;
  rating: string;
  episode: string;
  slug: string;
  url: string;
  genre: {name: string; url: string}[];
}

export interface GenreAnimeData {
  list: GenreAnimeItem[];
  pagination: PaginationData;
}

export type GenreAnimeResponse = ApiResponse<GenreAnimeData>;

export interface WatchHistoryItem {
  animeTitle: string;
  slug: string;
  episode: number;
  timestamp: string;
}

export interface ResumeWatchItem {
  slug: string;
  episode: number;
  position: number;
  duration: number;
  timestamp: string;
  animeTitle?: string;
}

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