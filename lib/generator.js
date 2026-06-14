// Лаба 1 — Generators and Iterators

// Генератор унікальних ID для повідомлень
export function* messageIdGenerator() {     // * означає, що це генераторна функція, після кожного yield виконання ставиться на паузу
    let id = 1;
    while (true) {
        yield id++;
    }
}

// Генератор циклічних статусів користувача
export function* statusGenerator() {
    const STATUSES = ["online", "away", "offline"];
    let index = 0;
    while(true) {
        yield STATUSES[index % STATUSES.length];    // оператор % повертає остачу від ділення
        index++;
    
    }
}

// Функція яка споживає генератор протягом певного часу
export async function runForTime(generator, seconds, onValue) {    // параметри: генератор, скільки секунд буде працювати, функція для обробки кожного значення
    const endTime = Date.now() + seconds * 1000;    // обчислення часу завершення. Date.now() - повертає поточний час у мілісекундах
    
    for (const value of generator) {
        if (Date.now() > endTime) break;    // якщо час вийшов, завершення циклу
        onValue(value);
    }
}

