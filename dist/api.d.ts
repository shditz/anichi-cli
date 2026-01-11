declare class ApiClient {
    private client;
    private cache;
    private lastRequestTime;
    constructor();
    private request;
    getHome(): Promise<any>;
    getOngoing(page?: number): Promise<any>;
    getCompleted(page?: number): Promise<any>;
    getAnime(slug: string): Promise<any>;
    getGenre(): Promise<any>;
    getEpisode(slug: string): Promise<any>;
    getServer(id: string): Promise<any>;
    getBatch(slug: string): Promise<any>;
    getSearch(keyword: string): Promise<any>;
    getSchedule(): Promise<any>;
    getGenreAnime(slug: string, page?: number): Promise<any>;
    clearCache(): void;
}
declare const _default: ApiClient;
export default _default;
//# sourceMappingURL=api.d.ts.map