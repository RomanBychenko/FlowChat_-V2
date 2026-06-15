// Лаба 8 — базовий HTTP-клієнт. НІЧОГО не знає про auth/token/Authorization
export class BaseHttpClient {

    async request({ url, method = 'GET', headers = {}, body }) {

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        return {
            status: response.status,
            ok: response.ok,
            data
        };
    }
}