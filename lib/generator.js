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


// Функція яка споживає генератор протягом певного часу, з паузою між значеннями
export async function runForTime(generator, seconds, onValue, intervalMs = 500) {
    const endTime = Date.now() + seconds * 1000;

    while (Date.now() < endTime) {
        const { value, done } = generator.next();

        if (done) break;

        onValue(value);

        // пауза перед наступним значенням
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
}
