// Лаба 5 — список поганих слів + асинхронна перевірка

export const BAD_WORDS = ['fuck', 'six-seven', 'stupid', 'noob'];

// асинхронна перевірка — чи містить text дане слово
// (імітація запиту до зовнішнього сервісу модерації, 30мс)
export function checkWordInMessage(word, text) {
    return new Promise((resolve) => {       // Promise це об'єкт, який представляє майбутній результат операції.
        setTimeout(() => {
            resolve(text.toLowerCase().includes(word.toLowerCase()));   // resolve –  завершує Promise успішно та передає результат назовні.
        }, 30);
    });
}