// Лаба 7 — простий Event Bus (reactive primitive)
export class EventBus {

    constructor() {
        // зберігаємо підписників: { "подія": [функція1, функція2, ...] }
        this.listeners = {};
    }

    // підписатись на подію
    on(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    // відписатись від події
    off(eventName, callback) {
        if (!this.listeners[eventName]) {
            return;
        }
        this.listeners[eventName] = this.listeners[eventName].filter(
            (cb) => cb !== callback
        );
    }

    // викликати подію — всі підписники спрацюють
    emit(eventName, data) {
        const callbacks = this.listeners[eventName];

        // якщо немає підписників — просто нічого не робимо
        if (!callbacks || callbacks.length === 0) {
            return;
        }

        for (const callback of callbacks) {
            try {
                callback(data);
            } catch (error) {
                // один зламаний listener не зупиняє інші
                console.error(
                    `Error in listener for "${eventName}":`,
                    error.message
                );
            }
        }
    }
}