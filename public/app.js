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
});