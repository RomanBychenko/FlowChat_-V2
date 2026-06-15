// Лаба 8 — споживач (Consumer). Отримує httpClient через конструктор (DI).
// НЕ імпортує BaseHttpClient чи AuthProxy напряму — не знає як вони влаштовані.
export class ApiService {

    constructor(httpClient, baseUrl) {
        this.client = httpClient;
        this.baseUrl = baseUrl;
    }

    async get(path) {
        return this.client.request({
            url: this.baseUrl + path,
            method: 'GET'
        });
    }
}