// Лаба 8 — Auth Proxy
// приймає інший HttpClient (з конструктора), сам реалізує той самий інтерфейс { request(req) }
export class AuthProxy {

    constructor(client, authConfig) {
        this.client = client;       // делегуємо сюди
        this.authConfig = authConfig;
    }

    // формує заголовки авторизації залежно від типу
    _getAuthHeaders() {
        switch (this.authConfig.type) {
            //  підтримка кількох методів авторизації (apiKey / bearer / jwt / oauth)

            case 'apiKey':
                return { [this.authConfig.headerName || 'X-API-Key']: this.authConfig.key };

            case 'bearer':
            case 'jwt':
                return { 'Authorization': `Bearer ${this.authConfig.token}` };

            case 'oauth':
                return { 'Authorization': `Bearer ${this.authConfig.accessToken}` };

            default:
                return {};
        }
    }

    async request(req) {

        const headers = { ...req.headers, ...this._getAuthHeaders() };      
        //               spread оператор для об'єктів: створює новий об'єкт об'єднуючи властивості (другий перезаписує перший при конфлікті)

        let response = await this.client.request({ ...req, headers });

        // якщо 401 і є функція оновлення токена — пробуємо ще раз
        if (response.status === 401 && this.authConfig.onUnauthorized) {        // onUnauthorized — опціональний хук для 401 → refresh token
            await this.authConfig.onUnauthorized(this.authConfig);

            const newHeaders = { ...req.headers, ...this._getAuthHeaders() };
            response = await this.client.request({ ...req, headers: newHeaders });
        }

        return response;
    }
}