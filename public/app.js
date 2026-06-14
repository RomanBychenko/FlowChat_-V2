// отримуємо елементи зі сторінки за їх id
const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const roomInput = document.getElementById('room-input');
const joinBtn = document.getElementById('join-btn');
const roomTitle = document.getElementById('room-title');

// показуємо екран входу при завантаженні
joinScreen.style.display = 'block';

// тут будемо зберігати дані поточного користувача
let username = '';
let room = '';

// обробник кліку на кнопку "Увійти"
joinBtn.addEventListener('click', () => {   // виконує код коли натискають на елемент

    // .value — текст введений в <input>
    // .trim() — видаляє пробіли на початку/кінці (щоб " name " не вважалось валідним)
    username = usernameInput.value.trim();
    room = roomInput.value.trim();

    // перевірка що поля не порожні
    if (username === '' || room === '') {
        alert('Введи нік і назву кімнати');
        return;
    }

    // перемикаємо екрани       // .style.display — змінює CSS властивість через JS (показати/сховати)
    joinScreen.style.display = 'none';
    chatScreen.style.display = 'block';

    // .textContent — змінює текст всередині елемента
    roomTitle.textContent = 'Кімната: ' + room;

    // підключаємось до SSE — з'єднання яке сервер тримає відкритим
    const eventSource = new EventSource(`/events?room=${room}&username=${username}`);

    eventSource.onopen = () => {
        console.log('Підключено до сервера через SSE'); 
    };EventSource
    // EventSource — вбудований в браузер об'єкт для SSE, автоматично відкриває потокове з'єднання
    // SSE (Server-Sent Events) — це технологія, де: сервер постійно надсилає дані в браузер в реальному часі
});

// обробник кнопки "Відправити" 
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

sendBtn.addEventListener('click', () => {

    const text = messageInput.value.trim();

    if (text === '') {
        return;
    }

    // надсилаємо POST запит на сервер
    fetch('/send', {    // fetch  відправляє дані на сервер
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, room, text })
    });

    messageInput.value = ''; // очищаємо поле
});