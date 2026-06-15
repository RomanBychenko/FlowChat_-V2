// Лаба 6 — асинхронний iterator: читає файл по рядку, не завантажуючи весь у пам'ять
import fs from 'fs';

export async function* readLogLines(filePath) {

    const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });

    let leftover = ''; // частина рядка яка ще не закінчилась

    // читаємо потік частинами (chunks)
    for await (const chunk of stream) {

        leftover += chunk;

        // шукаємо переводи рядка \n всередині накопиченого тексту
        let newlineIndex;
        while ((newlineIndex = leftover.indexOf('\n')) !== -1) {

            const line = leftover.slice(0, newlineIndex);
            leftover = leftover.slice(newlineIndex + 1);

            if (line.trim() !== '') {
                yield line; // повертаємо один рядок
            }
        }
    }

    // останній рядок (якщо файл не закінчується на \n)
    if (leftover.trim() !== '') {
        yield leftover;
    }
}

/*
Якщо файл не існує або сталась помилка читання — stream згенерує подію error, і for await...of сама перетворить це на виключення (exception). 
Якщо ми не обгорнемо це в try/catch тут — помилка піде "наверх" до того, хто викликав readLogLines. Це правильно — споживач дізнається про помилку, 
а не отримає тихе "файл закінчився"
*/