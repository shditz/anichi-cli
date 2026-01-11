export interface ApiResponse<T> {
    status: string;
    creator: string;
    statusCode: number;
    statusMessage?: string;
    message?: string;
    ok: boolean;
    data: T;
    pagination: any;
}
export interface PaginationData {
    currentPage: number;
    hasPrevPage: boolean;
    prevPage: number | null;
    hasNextPage: boolean;
    nextPage: number | null;
    totalPages: number;
}
export interface AnimeSummary {
    title: string;
    poster: string;
    episodes: number;
    releaseDay?: string;
    latestReleaseDate?: string;
    lastReleaseDate?: string;
    score?: string;
    animeId: string;
    href: string;
    otakudesuUrl: string;
}
export interface HomeData {
    ongoing: {
        href: string;
        otakudesuUrl: string;
        animeList: AnimeSummary[];
    };
    completed: {
        href: string;
        otakudesuUrl: string;
        animeList: AnimeSummary[];
    };
}
export type HomeResponse = ApiResponse<HomeData>;
export interface OngoingData {
    animeList: AnimeSummary[];
    pagination: PaginationData;
}
export type OngoingResponse = ApiResponse<OngoingData>;
export interface CompletedData {
    animeList: AnimeSummary[];
    pagination: PaginationData;
}
export type CompletedResponse = ApiResponse<CompletedData>;
export interface GenreItem {
    title: string;
    genreId: string;
    href: string;
    otakudesuUrl: string;
}
export interface GenreData {
    genreList: GenreItem[];
}
export type GenreResponse = ApiResponse<GenreData>;
export interface EpisodeItem {
    title: string;
    eps: number;
    date: string;
    episodeId: string;
    href: string;
    otakudesuUrl: string;
}
export interface AnimeDetailData {
    title: string;
    poster: string;
    japanese: string;
    score: string;
    producers: string;
    type: string;
    status: string;
    episodes: number;
    duration: string;
    aired: string;
    studios: string;
    batch?: {
        title: string;
        batchId: string;
        href: string;
        otakudesuUrl: string;
    };
    synopsis: {
        paragraphs: string[];
        connections: {
            title: string;
            animeId: string;
            href: string;
            otakudesuUrl: string;
        }[];
    };
    genreList: GenreItem[];
    episodeList: EpisodeItem[];
    recommendedAnimeList: AnimeSummary[];
}
export type AnimeDetailResponse = ApiResponse<AnimeDetailData>;
export interface ServerItem {
    title: string;
    serverId: string;
    href: string;
}
export interface QualityItem {
    title: string;
    serverList: ServerItem[];
}
export interface EpisodeData {
    title: string;
    animeId: string;
    releaseTime: string;
    defaultStreamingUrl: string;
    server: {
        qualities: QualityItem[];
    };
    downloadUrl: any;
    info: any;
    episodeList: any;
}
export type EpisodeResponse = ApiResponse<EpisodeData>;
export interface ServerData {
    url: string;
}
export type ServerResponse = ApiResponse<ServerData>;
export interface BatchUrlItem {
    title: string;
    url: string;
}
export interface BatchQualityItem {
    title: string;
    urls: BatchUrlItem[];
}
export interface BatchFormatItem {
    title: string;
    qualities: BatchQualityItem[];
}
export interface BatchData {
    title: string;
    formats: BatchFormatItem[];
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
    poster: string;
    status: string;
    score: string;
    animeId: string;
    href: string;
    otakudesuUrl: string;
    genreList: GenreItem[];
}
export interface SearchData {
    animeList: SearchAnimeItem[];
}
export type SearchResponse = ApiResponse<SearchData>;
export interface ScheduleAnimeItem {
    title: string;
    poster: string;
    slug: string;
    url: string;
}
export interface SeasonItem {
    day: string;
    anime_list: ScheduleAnimeItem[];
}
export type ScheduleResponse = ApiResponse<SeasonItem[]>;
export interface GenreAnimeItem {
    title: string;
    poster: string;
    status: string;
    score: string;
    episodes: number;
    animeId: string;
    href: string;
    otakudesuUrl: string;
    genreList: GenreItem[];
}
export interface GenreAnimeData {
    animeList: GenreAnimeItem[];
    pagination: PaginationData;
}
export type GenreAnimeResponse = ApiResponse<GenreAnimeData>;
//# sourceMappingURL=types.d.ts.map