import http from 'http';    // модуль Node.js для створення веб-серверів
import fs from 'fs';    // модуль для роботи з файлами (File System)
import path from 'path';    // модуль для роботи з шляхами до файлів і папок

const PORT = 8080;

// зберігаємо підключених клієнтів по кімнатах
const rooms = {};

// визначаємо тип файлу за розширенням
function getContentType(filePath) {
    const ext = path.extname(filePath);
    if (ext === '.html') return 'text/html';
    if (ext === '.js') return 'application/javascript';
    if (ext === '.css') return 'text/css';
    return 'text/plain';
}

// створення сервера
const server = http.createServer((req, res) => {
    //                            (Request) - містить інформацію про запит. (Response) - відповідь сервера

    // надсилає повідомлення всім клієнтам у кімнаті
    function broadcastToRoom(room, message) {

        if (!rooms[room]) {
            return;
        }

        for (const client of rooms[room]) {
            // формат SSE: "data: текст\n\n"
            client.res.write(`data: ${JSON.stringify(message)}\n\n`);
        }
    }


    // надсилає всім у кімнаті оновлений список користувачів
    function broadcastRoomData(room) {

        if (!rooms[room]) {
            return;
        }

        // створюємо масив імен користувачів кімнати
        const users = rooms[room].map((client) => client.username);     // .map((client) => client.username) — перетворює масив об'єктів {username, res} на масив рядків з іменами

        broadcastToRoom(room, {
            type: 'roomData',
            users: users,
            online: users.length
        });
    }


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
        req.on('end', () => {
            const data = JSON.parse(body);

            broadcastToRoom(data.room, {
                type: 'message',
                username: data.username,
                text: data.text
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
        });

        return;
    }

    //  SSE endpoint 
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
        rooms[room].push({ username, res });

        console.log(username + ' connected to room: ' + room);

        // повідомляємо всіх про новий список користувачів
        broadcastRoomData(room);


        // коли користувач закриває вкладку — видаляємо з кімнати
        req.on('close', () => {
            rooms[room] = rooms[room].filter(client => client.res !== res);
            console.log(username + ' disconnected from room: ' + room);
            broadcastRoomData(room);
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