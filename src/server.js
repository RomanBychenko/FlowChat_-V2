import http from 'http';    // модуль Node.js для створення веб-серверів
import fs from 'fs';    // модуль для роботи з файлами (File System)
import path from 'path';    // модуль для роботи з шляхами до файлів і папок

const PORT = 8080;


// визначаємо тип файлу за розширенням
function getContentType(filePath) {
    const ext = path.extname(filePath);
    if (ext === '.html') return 'text/html';
    if (ext === '.js') return 'application/javascript';
    if (ext === '.css') return 'text/css';
    return 'text/plain';
}

const server = http.createServer((req, res) => {    // Створення сервера. функція викликається щоразу, коли браузер робить запит
    //                            req (Request) - містить інформацію про запит.   res (Response) - відповідь сервера

    // якщо запит "/" — показуємо index.html
    let filePath = req.url === '/' ? '/index.html' : req.url;

    // повний шлях до файлу в папці public
    filePath = path.join('./public', filePath);

    fs.readFile(filePath, (err, data) => {  // метод чинання html файлу
        // якщо адреса невідома
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        
        // якщо адреса невідома
        res.writeHead(200, { 'Content-Type': getContentType(filePath) });
        res.end(data);
    });
});

// запуск сервера
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});