import { messageIdGenerator, statusGenerator, runForTime } from 'flowchat-lib';

// перевірка генератора ID
const ids = messageIdGenerator();
console.log("ID:", ids.next().value); // 1
console.log("ID:", ids.next().value); // 2
console.log("ID:", ids.next().value); // 3

// перевірка генератора статусів
const statuses = statusGenerator();
console.log("Статус:", statuses.next().value); // online
console.log("Статус:", statuses.next().value); // away
console.log("Статус:", statuses.next().value); // busy
console.log("Статус:", statuses.next().value); // online (по колу)