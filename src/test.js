import { withLogging } from 'flowchat-lib';

// звичайна sync функція
function add(a, b) {
    return a + b;
}

// async функція
async function fetchData(id) {
    if (id < 0) throw new Error("Invalid id");
    return { id, name: "Item " + id };
}

const loggedAdd = withLogging(add, { level: "DEBUG" });
const loggedFetch = withLogging(fetchData, { level: "INFO" });
const errorOnly = withLogging(fetchData, { level: "ERROR", name: "fetchData-errorMode" });

loggedAdd(2, 3);

await loggedFetch(5);

// ERROR-режим — успішний випадок (нічого не логує)
await errorOnly(5);

// ERROR-режим — з помилкою (повинно залогувати)
try {
    await errorOnly(-1);
} catch (e) {
    console.log("Caught:", e.message);
}