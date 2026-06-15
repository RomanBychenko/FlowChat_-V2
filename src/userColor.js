// Лаба 3 — чиста функція для кешування
// обчислює колір на основі імені користувача
export function computeUserColor(username) {

    let hash = 0;

    for (let i = 0; i < username.length; i++) {
        hash = (hash * 31 + username.charCodeAt(i)) % 360;
    }

    console.log(`Обчислено колір для "${username}"`); // видно коли РЕАЛЬНО рахується

    return `hsl(${hash}, 70%, 45%)`;
}