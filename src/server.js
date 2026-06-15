import http from 'http';    // модуль Node.js для створення веб-серверів
import fs from 'fs';    // модуль для роботи з файлами (File System)
import path from 'path';    // модуль для роботи з шляхами до файлів і папок
// підключаємо генератор ID
import { messageIdGenerator } from 'flowchat-lib';
// import { EventBus } from 'flowchat-lib';
import { EventBus, withLogging } from 'flowchat-lib';
import { asyncFilterPromise } from 'flowchat-lib';
import { BAD_WORDS, checkWordInMessage } from './moderation.js';
import { PriorityQueue } from 'flowchat-lib';
import { memoize } from 'flowchat-lib';
import { computeUserColor } from './userColor.js';
import { readLogLines } from 'flowchat-lib';
import { BaseHttpClient, AuthProxy } from 'flowchat-lib';
import { ApiService } from './apiService.js';

// центральна шина подій чату
const chatEvents = new EventBus();

//  Listener 1 — логування подій 
chatEvents.on('user:join', (data) => {
    console.log(`[EVENT] ${data.username} joined "${data.room}"`);
});

chatEvents.on('user:leave', (data) => {
    console.log(`[EVENT] ${data.username} left "${data.room}"`);
});

chatEvents.on('message:new', (data) => {
    console.log(`[EVENT] ${data.username} → "${data.room}": ${data.text}`);
});

// Listener 2 — статистика (незалежний від логера) 
let totalMessages = 0;

chatEvents.on('message:new', () => {
    totalMessages++;
    console.log(`[STATS] Total messages: ${totalMessages}`);
});


// генератор унікальних ID для повідомлень (Лаба 1)
const messageIds = messageIdGenerator();

// Лаба 3 — мемоізований розрахунок кольору (LRU, максимум 5 кольорів в кеші)
const getUserColor = memoize(computeUserColor, {
    strategy: 'LRU',
    maxSize: 5
});

const PORT = 8080;

// Лаба 8 — ключі авторизації (з env або дефолт для розробки)
const API_KEY = process.env.API_KEY || 'dev-secret-key';
//              ^^^^^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^^^^^^
//              якщо встановлено      значення за замовчуванням
//              змінну середовища     (для локальної розробк
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-token';


// зберігаємо підключених клієнтів по кімнатах
const rooms = {};

// Лаба 4 — черга розсилки повідомлень з пріоритетом
const broadcastQueue = new PriorityQueue();

// додає повідомлення в черту
function enqueueBroadcast(room, message, priority) {
    broadcastQueue.enqueue({ room, message }, priority);
}

// кожні 50мс обробляємо одне повідомлення — спочатку з найвищим пріоритетом
setInterval(() => {
    if (!broadcastQueue.isEmpty()) {
        const item = broadcastQueue.dequeue('highest');
        broadcastToRoom(item.room, item.message);
    }
}, 50);

// надсилає повідомлення всім клієнтам у кімнаті
function _broadcastToRoom(room, message) {
    if (!rooms[room]) {
        return;
    }
    for (const client of rooms[room]) {
        // формат SSE: "data: текст\n\n"
        client.res.write(`data: ${JSON.stringify(message)}\n\n`);
    }
}

// обгортаємо логуванням (DEBUG — кожна розсилка)
const broadcastToRoom = withLogging(_broadcastToRoom, {
    level: "DEBUG",
    name: "broadcastToRoom",
    logFile: "./logs/chat.log"
});

// надсилає всім у кімнаті оновлений список користувачів
function _broadcastRoomData(room) {
    if (!rooms[room]) {
        return;
    }

    // тепер зберігаємо ім'я і статус кожного користувача
    const users = rooms[room].map((client) => ({
        username: client.username,
        status: client.status
    }));
    // системне оновлення — пріоритет 10 (вищий)
    enqueueBroadcast(room, {
        type: 'roomData',
        users: users,
        online: users.length
    }, 10);
}

// обгортаємо логуванням (INFO — зміна списку юзерів)
const broadcastRoomData = withLogging(_broadcastRoomData, {
    level: "INFO",
    name: "broadcastRoomData",
    logFile: "./logs/chat.log"
});


// визначаємо тип файлу за розширенням
function getContentType(filePath) {
    const ext = path.extname(filePath);
    if (ext === '.html') return 'text/html';
    if (ext === '.js') return 'application/javascript';
    if (ext === '.css') return 'text/css';
    return 'text/plain';
}

// створення сервера
const server = http.createServer(async (req, res) => {
    //                            (Request) - містить інформацію про запит. (Response) - відповідь сервера

    // надсилає повідомлення всім клієнтам у кімнаті
    /*
    function _broadcastToRoom(room, message) {

        if (!rooms[room]) {
            return;
        }

        for (const client of rooms[room]) {
            // формат SSE: "data: текст\n\n"
            client.res.write(`data: ${JSON.stringify(message)}\n\n`);
        }
    }

    // обгортаємо логуванням (DEBUG — кожна розсилка)
    const broadcastToRoom = withLogging(_broadcastToRoom, {
        level: "DEBUG",
        name: "broadcastToRoom",
        logFile: "./logs/chat.log"
    });


    // надсилає всім у кімнаті оновлений список користувачів
    function _broadcastRoomData(room) {

        if (!rooms[room]) {
            return;
        }

        // тепер зберігаємо ім'я і статус кожного користувача
        const users = rooms[room].map((client) => ({
            username: client.username,
            status: client.status
        }));

        // системне оновлення — пріоритет 10 (вищий)
        enqueueBroadcast(room, {
            type: 'roomData',
            users: users,
            online: users.length
        }, 10);
    }

    // обгортаємо логуванням (INFO — зміна списку юзерів)
    const broadcastRoomData = withLogging(_broadcastRoomData, {
        level: "INFO",
        name: "broadcastRoomData",
        logFile: "./logs/chat.log"
    });
    */



    // парсимо URL разом з query-параметрами (?room=...&username=...)
    const url = new URL(req.url, `http://${req.headers.host}`);     // new URL(req.url, ...) — розбирає адресу на частини

    //  надсилання повідомлення 
    if (url.pathname === '/send' && req.method === 'POST') {

        let body = '';

        // дані приходять частинами (chunks) — збираємо їх
        req.on('data', (chunk) => {
            body += chunk;
        });

        // коли всі дані прийшли
        req.on('end', async () => {
            const data = JSON.parse(body);

            // Лаба 5 — асинхронна перевірка на погані слова
            const foundBadWords = await asyncFilterPromise(
                BAD_WORDS,
                (word) => checkWordInMessage(word, data.text)
            );

            if (foundBadWords.length > 0) {
                res.writeHead(200, { 'Content-Type': 'application/json' });     // встановлює HTTP-заголовок відповіді.
                res.end(JSON.stringify({        // закінчує відповідь сервера.
                    ok: false,
                    blocked: true,
                    badWords: foundBadWords
                }));
                return;
            }

            chatEvents.emit('message:new', {
                username: data.username,
                room: data.room,
                text: data.text
            });

            // звичайне повідомлення — пріоритет 1 (нижчий)
            enqueueBroadcast(data.room, {
                id: messageIds.next().value,
                type: 'message',
                username: data.username,
                text: data.text,
                color: getUserColor(data.username)
            }, 1);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
        });

        return;
    }


    // === Лаба 8: захищені endpoints (вимагають авторизацію) ===

    // захищено API-ключем (заголовок X-API-Key)
    if (url.pathname === '/api/stats' && req.method === 'GET') {

        if (req.headers['x-api-key'] !== API_KEY) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        const stats = {
            totalMessages,
            roomsCount: Object.keys(rooms).length,
            rooms: Object.keys(rooms).map((room) => ({
                name: room,
                online: rooms[room].length
            }))
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
        return;
    }

    // захищено Bearer-токеном (заголовок Authorization)
    if (url.pathname === '/api/admin' && req.method === 'GET') {

        if (req.headers['authorization'] !== `Bearer ${ADMIN_TOKEN}`) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Admin access granted', uptime: process.uptime() }));
        return;
    }

    //  Лаба 8: демонстрація AuthProxy (складання через DI) 

    if (url.pathname === '/demo/stats' && req.method === 'GET') {

        const statsService = new ApiService(
            new AuthProxy(new BaseHttpClient(), {
                type: 'apiKey',
                headerName: 'X-API-Key',
                key: API_KEY
            }),
            `http://localhost:${PORT}`
        );

        const result = await statsService.get('/api/stats');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
    }

    if (url.pathname === '/demo/admin' && req.method === 'GET') {

        const adminService = new ApiService(
            new AuthProxy(new BaseHttpClient(), {
                type: 'bearer',
                token: ADMIN_TOKEN
            }),
            `http://localhost:${PORT}`
        );

        const result = await adminService.get('/api/admin');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
    }


    //  Лаба 6: стрім логів 
    if (url.pathname === '/logs' && req.method === 'GET') {

        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });

        try {
            for await (const line of readLogLines('./logs/chat.log')) {
                res.write(line + '\n');
            }
        } catch (error) {
            res.write('\n[Помилка читання логів: ' + error.message + ']\n');
        }

        res.end();
        return;
    }


    //  SSE endpoint 
    //  зміна статусу користувача       // endpoint для зміни статусу   
    if (url.pathname === '/status' && req.method === 'POST') {

        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', () => {
            const data = JSON.parse(body);

            // шукаємо клієнта в кімнаті за іменем і змінюємо статус
            const client = rooms[data.room]?.find(
                (c) => c.username === data.username
            );

            if (client) {
                client.status = data.status;
                broadcastRoomData(data.room);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
        });

        return;
    }


    if (url.pathname === '/events') {
        const room = url.searchParams.get('room');
        const username = url.searchParams.get('username');

        // спеціальні заголовки для потокового з'єднання
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // додаємо клієнта в список кімнати
        if (!rooms[room]) {
            rooms[room] = [];
        }
        rooms[room].push({ username, res, status: 'online' });

        console.log(username + ' connected to room: ' + room);

        // повідомляємо всіх про новий список користувачів
        broadcastRoomData(room);

        chatEvents.emit('user:join', { username, room });


        // коли користувач закриває вкладку — видаляємо з кімнати
        req.on('close', () => {
            rooms[room] = rooms[room].filter(client => client.res !== res);
            console.log(username + ' disconnected from room: ' + room);
            broadcastRoomData(room);
            chatEvents.emit('user:leave', { username, room });
        });

        return;
    }

    //  статичні файли (index.html, app.js) 
    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    filePath = path.join('./public', filePath);

    fs.readFile(filePath, (err, data) => {  // // метод чинання html файлу
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': getContentType(filePath) });
        res.end(data);
    });
});

// запуск сервера
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});