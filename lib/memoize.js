// Лаба 3 — Memoization з конфігурованими стратегіями витіснення
// strategy: 'LRU' | 'LFU' | 'TTL' | 'custom'
/*
Як працює кожна стратегія

LRU (Least Recently Used) — при кожному зверненні елемент переміщується в кінець Map. При переповненні видаляється перший (найдовше не використовувався)
LFU (Least Frequently Used) — рахуємо accessCount, видаляємо елемент з найменшою кількістю звернень
TTL (Time-To-Live) — кожен запис має createdAt, при зверненні перевіряємо чи не "протух"
custom — передаєш свою функцію (cache) => ключ, яка вирішує що видалити
*/
export function memoize(fn, options = {}) {

    const maxSize = options.maxSize || Infinity;
    const strategy = options.strategy || 'LRU';
    const ttl = options.ttl;                 // для TTL — час життя в мс
    const customEvict = options.customEvict; // для custom — функція(cache) => ключ для видалення

    // cache: ключ -> { value, accessCount, createdAt }
    const cache = new Map();

    function evict() {
        let keyToEvict;

        if (strategy === 'LFU') {
            // шукаємо ключ з найменшою кількістю звернень
            let minCount = Infinity;
            for (const [key, entry] of cache) {
                if (entry.accessCount < minCount) {
                    minCount = entry.accessCount;
                    keyToEvict = key;
                }
            }
        } else if (strategy === 'custom' && customEvict) {
            keyToEvict = customEvict(cache);
        } else {
            // LRU і TTL — видаляємо найстаріший елемент Map (перший за порядком)
            keyToEvict = cache.keys().next().value;
        }

        cache.delete(keyToEvict);
    }

    return function (...args) {
        const key = JSON.stringify(args);
        const now = Date.now();

        // TTL — перевіряємо чи запис не застарів
        if (strategy === 'TTL' && cache.has(key)) {
            const entry = cache.get(key);
            if (now - entry.createdAt > ttl) {
                cache.delete(key);
            }
        }

        // якщо є в кеші — повертаємо без обчислення
        if (cache.has(key)) {
            const entry = cache.get(key);
            entry.accessCount++;

            // LRU — переміщуємо елемент в кінець (він щойно використаний)
            if (strategy === 'LRU') {
                cache.delete(key);
                cache.set(key, entry);
            }

            return entry.value;
        }

        // не знайдено в кеші — обчислюємо
        const value = fn(...args);

        cache.set(key, { value, accessCount: 1, createdAt: now });

        // перевищили розмір — видаляємо за стратегією
        if (cache.size > maxSize) {
            evict();
        }

        return value;
    };
}