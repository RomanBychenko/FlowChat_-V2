"# FlowChat_-V2" 

# FlowChat

Чат-менеджер з реалізацією всіх лабораторних робіт 2 семестру.
Побудований на чистому Node.js без зовнішніх бібліотек (крім dev-tools).

## Запуск

1. Встановити залежності:
   npm install

2. Запустити сервер:
   node src/server.js

3. Відкрити в браузері:
   http://localhost:8080

4. Демонстрація генераторів (Лаба 1):
   node examples/generators-demo.js

## Структура проєкту

flowchat/
├── lib/                    ← бібліотека flowchat-lib (Лаба 2)
│   ├── package.json        ← окремий пакет з name: "flowchat-lib"
│   ├── index.js            ← єдина точка експорту
│   ├── generator.js        ← Лаба 1
│   ├── memoize.js          ← Лаба 3
│   ├── priorityQueue.js    ← Лаба 4
│   ├── asyncFilter.js      ← Лаба 5
│   ├── logStream.js        ← Лаба 6
│   ├── eventBus.js         ← Лаба 7
│   ├── httpClient.js       ← Лаба 8
│   ├── authProxy.js        ← Лаба 8
│   └── logDecorator.js     ← Лаба 9
├── src/
│   ├── server.js           ← головний HTTP сервер
│   ├── moderation.js       ← список поганих слів (Лаба 5)
│   ├── userColor.js        ← чиста функція для мемоізації (Лаба 3)
│   └── apiService.js       ← споживач через DI (Лаба 8)
├── public/
│   ├── index.html          ← інтерфейс чату
│   └── app.js              ← клієнтська логіка
├── examples/
│   └── generators-demo.js  ← демо Лаби 1 і 2
├── package.json            ← залежність: "flowchat-lib": "file:./lib"
└── .gitignore

## Де яка лабораторна

### Лаба 1 — Generators and Iterators
- Файл: lib/generator.js
- messageIdGenerator() — нескінченний генератор унікальних ID
- statusGenerator() — циклічний генератор статусів (online/away/offline)
- runForTime(generator, seconds, cb, interval) — timeout iterator
- Демо: node examples/generators-demo.js

### Лаба 2 — Project Setup
- lib/ — окрема бібліотека зі своїм package.json (name: "flowchat-lib")
- package.json (root) — підключено як: "flowchat-lib": "file:./lib"
- Імпорт скрізь через: import { ... } from 'flowchat-lib'
- examples/ — окремий демо-проєкт що споживає бібліотеку

### Лаба 3 — Memoization
- Файл: lib/memoize.js
- Стратегії: LRU, LFU, TTL, custom
- Використання: src/userColor.js — колір ніка кешується через LRU (maxSize: 5)

### Лаба 4 — Bi-directional Priority Queue
- Файл: lib/priorityQueue.js
- enqueue(value, priority), peek/dequeue(oldest|newest|highest|lowest)
- Використання: src/server.js — черга розсилки (системні повідомлення пріоритет 10, звичайні — 1)

### Лаба 5 — Async Array Function Variants
- Файл: lib/asyncFilter.js
- asyncFilterPromise(array, predicate, signal) — Promise версія
- asyncFilterCallback(array, predicate, callback, signal) — Callback версія (error-first)
- AbortController підтримка в обох версіях
- Використання: src/server.js — перевірка повідомлень на погані слова

### Лаба 6 — Streams / Async Iterators
- Файл: lib/logStream.js
- readLogLines(filePath) — async generator, читає файл по рядку без завантаження в пам'ять
- Використання: GET /logs — стрімінг логів з chat.log

### Лаба 7 — Reactive Communication
- Файл: lib/eventBus.js
- on(event, cb), off(event, cb), emit(event, data)
- Кожен listener обгорнутий у try/catch — один зламаний не зупиняє інших
- Використання: src/server.js — chatEvents (user:join, user:leave, message:new)
- Два незалежних listener: логування і статистика

### Лаба 8 — Auth Proxy
- Файли: lib/httpClient.js, lib/authProxy.js, src/apiService.js
- BaseHttpClient — не знає про auth
- AuthProxy — інжектує заголовки (apiKey / bearer / jwt / oauth), підтримка 401→refresh
- ApiService — отримує клієнт через конструктор (DI), не імпортує Base/Proxy
- Демо endpoints: GET /demo/stats, GET /demo/admin

### Лаба 9 — Logging Decorator
- Файл: lib/logDecorator.js
- withLogging(fn, { level, name, logFile })
- Рівні: INFO / DEBUG / ERROR
- ISO timestamp, sync і async функції, запис у файл logs/chat.log
- Використання: broadcastToRoom (DEBUG), broadcastRoomData (INFO)

## Технічні деталі

- HTTP сервер: вбудований Node.js http модуль (без express)
- Live-зв'язок: Server-Sent Events (SSE)
- Авторизація: API Key і Bearer token через AuthProxy
- Логи: logs/chat.log (не комітяться, в .gitignore)








##
Блок 2 — Лаба 7: Event Bus (EventEmitter)

EventEmitter (або Event Bus) — це об'єкт на якому можна:

on(подія, функція) — підписатись на подію
emit(подія, дані) — викликати подію (всі підписники спрацюють)
off(подія, функція) — відписатись

Це робить код слабко зв'язаним — наприклад, коли приходить нове повідомлення, можуть незалежно спрацювати: логування, лічильник статистики, перевірка модерації — і жоден з них не знає про інші.

вимога:

listener під try/catch всередині emit — інакше один зламаний listener з'їдає всі наступні

пишемо свій простий EventBus (не вбудований events), де самі контролюємо обробку помилок.

Інтегруємо EventBus в чат
Тепер підключимо EventBus до реального чату. Ідея: коли щось відбувається (заходить юзер, пише повідомлення) — emit подію, а кілька незалежних слухачів реагують (логування + статистика).


##
Блок 3 — Лаба 9: Logging Decorator

Декоратор — це функція яка "обгортає" іншу функцію, додаючи поведінку без зміни самої функції.

function add(a, b) {
    return a + b;
}

const loggedAdd = log(add); // обгорнута версія

loggedAdd(2, 3);
// виведе: [LOG] add called with [2, 3]
// виведе: [LOG] add returned 5
// і також поверне 5

Вимоги:

Рівні INFO / DEBUG / ERROR
ISO timestamp (не Date.now())
Має працювати з sync і async функціями
@log(level="ERROR") — логує тільки якщо сталась помилка


Інтегруємо декоратор в чат
Застосуємо withLogging до функцій розсилки.
Маленьке зауваження — в методичці є синтаксис @log(level="INFO"). Це декоратори класів/методів — окрема експериментальна фіча JS, нестабільна в Node. Ми робимо те саме через звичайну обгортку функції (withLogging(fn, options)) — результат ідентичний, просто інший синтаксис викликання.

##
Блок 4 — Лаба 5: Async Filter (модерація)

Спочатку — AbortController 

Це вбудований в JS об'єкт для скасування асинхронних операцій:

const controller = new AbortController();
const signal = controller.signal;

// десь хочемо перевірити чи скасовано
signal.addEventListener('abort', () => {
    console.log('Операцію скасовано!');
});

// десь інше — скасовуємо
controller.abort();

console.log(signal.aborted); // true

Уяви — signal це як "пульт" який передаєш у довгу операцію, а controller.abort() — натискаєш на ньому "стоп".


Коли приходить повідомлення, асинхронно (з імітацією затримки, як реальна перевірка через API) перевіряємо кожне слово зі списку — чи є воно в повідомленні. Якщо знайшли хоч одне — повідомлення блокується.
Це "розширення filter на асинхронну версію" — filter по масиву поганих слів, де перевірка кожного елемента асинхронна.


##
Блок 5 — Лаба 4: Bi-directional Priority Queue

Що це
Черга де можна дістати елемент:

за порядком вставки — oldest (найстаріший) / newest (найновіший)
за пріоритетом — highest / lowest

Тут також знову зустрінеться class (як в EventBus):

class Animal {
    constructor(name) {       // викликається при new Animal("Cat")
        this.name = name;     // this — поточний об'єкт
    }

    speak() {
        console.log(this.name + " says hi");
    }
}

const cat = new Animal("Cat");
cat.speak(); // "Cat says hi"

І switch — коротший запис багатьох if/else if:

switch (mode) {
    case 'a':
        console.log('A');
        break;
    case 'b':
        console.log('B');
        break;
    default:
        console.log('інше');
}

Інтегруємо черту в чат

Ідея: всі повідомлення (звичайні + системні оновлення списку юзерів) спочатку потрапляють у черту з пріоритетом. Системні оновлення (хто онлайн) — пріоритет вищий, звичайні повідомлення — нижчий. Черта обробляється кожні 50мс.

Новий концепт — setInterval
setInterval — як setTimeout, але повторюється нескінченно:

setInterval(() => {
    console.log("Тік");
}, 1000); // кожну секунду

Що змінилось

broadcastToRoom (з логуванням) тепер викликається тільки з setInterval — реальна розсилка
enqueueBroadcast — просто додає в черту, нічого не розсилає одразу
Якщо одночасно прийдуть системне оновлення (пріоритет 10) і повідомлення (пріоритет 1) — спочатку розішлеться системне

##
Блок 6 — Лаба 3: Memoization + Cache

Новий концепт — Map
Map — як об'єкт {}, але краще для кешу: зберігає порядок вставки і легко переміщувати елементи.

const map = new Map();

map.set('a', 1);
map.set('b', 2);

map.get('a');    // 1
map.has('a');    // true
map.delete('a');
map.size;        // 1

// переміщення в кінець (для LRU) — видалити і знову додати
map.delete('b');
map.set('b', 2); // тепер 'b' — останній

for (const [key, value] of map) {
    console.log(key, value);
}

Ідея для чату
Кожен користувач має колір ніка в чаті (щоб візуально відрізняти). Обчислення кольору з імені — чиста функція (pure function — однакові вхідні дані = однаковий результат). Замість обчислювати колір кожного разу при кожному повідомленні — кешуємо результат через memoize.

Як працює кожна стратегія

LRU (Least Recently Used) — при кожному зверненні елемент переміщується в кінець Map. При переповненні видаляється перший (найдовше не використовувався)
LFU (Least Frequently Used) — рахуємо accessCount, видаляємо елемент з найменшою кількістю звернень
TTL (Time-To-Live) — кожен запис має createdAt, при зверненні перевіряємо чи не "протух"
custom — передаєш свою функцію (cache) => ключ, яка вирішує що видалити

##
Блок 7 — Лаба 6: Streams / Async Iterators

Ідея
У нас вже є файл logs/chat.log, який росте з кожним повідомленням. Реалізуємо асинхронний iterator, який читає цей файл частинами (по рядку), а не завантажує весь файл у пам'ять одразу — це і є суть Лаби 6 ("великі дані, що не вміщуються в пам'ять").

Новий концепт — for await...of
Це for...of, але для асинхронних джерел даних (потоків):

for await (const chunk of someStream) {
    console.log(chunk);
}

Кожен chunk приходить поступово, по мірі готовності — а не весь одразу.


##
Блок 8 — Лаба 8: Auth Proxy

Архітектура (3 шари, ключова вимога!)

BaseHttpClient — обгортка над fetch. Нічого не знає про auth/токени
AuthProxy — приймає інший HttpClient як параметр, сам реалізує той самий інтерфейс. Додає заголовки авторизації і делегує запит далі
Споживач (наша служба) — отримує HttpClient через конструктор (Dependency Injection). Не імпортує ні базу, ні Proxy напряму

// складання ззовні:

new StatsService(
    new AuthProxy(
        new BaseHttpClient(),
        { type: 'apiKey', key: '...' }
    )
)

Новий концепт — process.env
Змінні середовища — спосіб зберігати секрети поза кодом:

const API_KEY = process.env.API_KEY || 'dev-secret-key';
//              ^^^^^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^^^^^^
//              якщо встановлено      значення за замовчуванням
//              змінну середовища     (для локальної розробки)