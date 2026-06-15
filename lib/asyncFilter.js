// Лаба 5 — Async Array Function Variants (filter)

/* 
Promise-версія 
array — масив елементів
predicate(item) — async функція, повертає Promise<boolean>
signal — AbortController.signal (опціонально) 
*/
export function asyncFilterPromise(array, predicate, signal) {

    return new Promise((resolve, reject) => {

        if (signal?.aborted) {
            // ?. перевіряє чи signal існує перш ніж читати .aborted (інакше помилка якщо signal === undefined)
            reject(new Error('Aborted'));
            return;
        }

        const results = [];
        let index = 0;

        // викликається якщо хтось зробить controller.abort()
        function onAbort() {
            reject(new Error('Aborted'));
        }

        if (signal) {
            signal.addEventListener('abort', onAbort, { once: true }); // once: true означає що listener спрацює тільки один раз і сам видалиться
        }

        function processNext() {

            // якщо обробили всі елементи
            if (index >= array.length) {
                if (signal) signal.removeEventListener('abort', onAbort); // signal.removeEventListener(...) — прибирання за собою
                resolve(results);
                return;
            }

            const item = array[index];
            index++;

            predicate(item)
                .then((keep) => {
                    if (keep) results.push(item);
                    processNext(); // йдемо до наступного елемента
                })
                .catch((error) => {
                    if (signal) signal.removeEventListener('abort', onAbort);
                    reject(error);
                });
        }

        processNext();
    });
}

//  Callback-версія (error-first) 
// predicate(item, cb) — cb викликається як cb(error, keep)
export function asyncFilterCallback(array, predicate, callback, signal) {

    if (signal?.aborted) {
        callback(new Error('Aborted'));
        return;
    }

    const results = [];
    let index = 0;

    function onAbort() {
        callback(new Error('Aborted'));
    }

    if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
    }

    function processNext() {

        if (index >= array.length) {
            if (signal) signal.removeEventListener('abort', onAbort);
            callback(null, results);
            return;
        }

        const item = array[index];
        index++;

        predicate(item, (error, keep) => {

            if (error) {
                if (signal) signal.removeEventListener('abort', onAbort);
                callback(error);
                return;
            }

            if (keep) results.push(item);
            processNext();
        });
    }

    processNext();
}