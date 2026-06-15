// Демонстрація Лаби 1 — Generators and Iterators
// Окремий приклад використання бібліотеки flowchat-lib (вимога Лаби 2)

import { messageIdGenerator, statusGenerator, runForTime } from 'flowchat-lib';

console.log('=== 1. Генератор ID повідомлень (нескінченний) ===');
const ids = messageIdGenerator();
console.log(ids.next().value); // 1
console.log(ids.next().value); // 2
console.log(ids.next().value); // 3

console.log('\n=== 2. Генератор статусів (циклічний) ===');
const statuses = statusGenerator();
console.log(statuses.next().value); // online
console.log(statuses.next().value); // away
console.log(statuses.next().value); // busy
console.log(statuses.next().value); // online (по колу)

console.log('\n=== 3. Timeout Iterator — споживаємо статуси 2 секунди ===');

await runForTime(statusGenerator(), 2, (status) => {
    console.log(new Date().toISOString(), '-', status);
}, 400); // нове значення кожні 400мс

console.log('\nГотово!');