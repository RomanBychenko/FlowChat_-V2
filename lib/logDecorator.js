// Лаба 9 — Logging Decorator
import fs from 'fs';
import path from 'path';

// безпечне перетворення в рядок (на випадок складних об'єктів)
function formatArgs(args) {
    try {
        return JSON.stringify(args);    // якщо об'єкт неможливо перетворити — використовуємо просто String(args)
    } catch {
        return String(args);
    }
}

// записує рядок логу — в консоль і, якщо вказано, у файл
function writeLog(message, logFile, isError = false) {

    if (isError) {
        console.error(message);
    } else {
        console.log(message);
    }

    if (logFile) {
        const dir = path.dirname(logFile);

        // створюємо папку для логів якщо її ще немає
        if (!fs.existsSync(dir)) {      // fs.existsSync(dir) — перевіряє чи існує папка
            fs.mkdirSync(dir, { recursive: true });     // створює папку (і батьківські, якщо треба)
        }

        // дописуємо рядок в кінець файлу
        fs.appendFileSync(logFile, message + '\n');
    }
}

// withLogging — обгортає функцію логуванням
// options.level   — "INFO" | "DEBUG" | "ERROR"
// options.name    — назва для логів
// options.logFile — шлях до файлу логів (опціонально)
export function withLogging(fn, options = {}) {

    const level = options.level || "INFO";
    const name = options.name || fn.name || "anonymous";
    const logFile = options.logFile || null;

    return function (...args) {

        const timestamp = new Date().toISOString();

        // ERROR-режим — логуємо тільки якщо буде помилка
        if (level === "ERROR") {
            try {
                const result = fn(...args);

                if (result instanceof Promise) {
                    return result.catch((error) => {
                        writeLog(`[${timestamp}] [ERROR] ${name} threw: ${error.message}`, logFile, true);
                        throw error;
                    });
                }

                return result;
            } catch (error) {
                writeLog(`[${timestamp}] [ERROR] ${name} threw: ${error.message}`, logFile, true);
                throw error;
            }
        }

        // INFO / DEBUG — логуємо вхід і вихід
        writeLog(`[${timestamp}] [${level}] ${name} called with: ${formatArgs(args)}`, logFile);

        const result = fn(...args);

        if (result instanceof Promise) {
            return result.then((value) => {
                writeLog(`[${timestamp}] [${level}] ${name} returned: ${formatArgs([value])}`, logFile);
                return value;
            });
        }

        writeLog(`[${timestamp}] [${level}] ${name} returned: ${formatArgs([result])}`, logFile);
        return result;
    };
}