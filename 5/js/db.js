// js/db.js
const DB_KEY = 'cheese_shop_db';

function initDB() {
    if (!localStorage.getItem(DB_KEY)) {
        const initialData = {
            users: [
                { id: 1, login: 'admin', password: '123', role: 'admin', full_name: 'Иванов Иван Иванович', status: 'free' },
                { id: 2, login: 'disp', password: '123', role: 'dispatcher', full_name: 'Смирнова Анна Игоревна', status: 'free' },
                { id: 3, login: 'cour1', password: '123', role: 'courier', status: 'free', full_name: 'Петров Алексей Сергеевич', phone: '+7 (900) 111-22-33', car: 'Лада Гранта А123БВ' },
                { id: 4, login: 'cour2', password: '123', role: 'courier', status: 'free', full_name: 'Сидоров Максим Андреевич', phone: '+7 (900) 222-33-44', car: 'Киа Рио В456ГД' },
                { id: 5, login: 'cour3', password: '123', role: 'courier', status: 'off', full_name: 'Козлов Дмитрий Олегович', phone: '+7 (900) 333-44-55', car: 'Хендай Солярис Е789ЖЗ' },
                { id: 6, login: 'cour4', password: '123', role: 'courier', status: 'off', full_name: 'Новиков Артём Викторович', phone: '+7 (900) 444-55-66', car: 'Тойота Камри И012КЛ' },
                { id: 7, login: 'buyer', password: '123', role: 'buyer', full_name: 'Кузнецов Дмитрий Васильевич', phone: '+7 (900) 555-66-77', address: 'ул. Ленина, д. 10, кв. 5' },
                { id: 8, login: 'ivan', password: '123', role: 'buyer', full_name: 'Грозный Иван Васильевич', phone: '+7 (900) 666-77-88', address: 'пр-т Мира, д. 5, кв. 12' },
                { id: 9, login: 'buyer2', password: '123', role: 'buyer', full_name: 'Морозова Елена Павловна', phone: '+7 (900) 777-88-99', address: 'ул. Пушкина, д. 20, кв. 30' },
                { id: 10, login: 'buyer3', password: '123', role: 'buyer', full_name: 'Волков Сергей Николаевич', phone: '+7 (900) 888-99-00', address: 'ул. Гагарина, д. 15, кв. 8' }
            ],
            products: [
                { id: 1, name: 'Сыр Гауда', description: 'Классический полутвердый сыр с мягким сливочным вкусом.', fat_content: '45%', image: 'img/1.png' },
                { id: 2, name: 'Сыр Чеддер', description: 'Выдержанный сыр с плотной текстурой и насыщенным послевкусием.', fat_content: '50%', image: 'img/2.png' },
                { id: 3, name: 'Сыр Пармезан', description: 'Твердый ломкий сыр длительной выдержки. Незаменим для пасты.', fat_content: '32%', image: 'img/3.png' },
                { id: 4, name: 'Сыр Бри', description: 'Мягкий сыр с белой благородной плесенью. Идеален с вином.', fat_content: '60%', image: 'img/4.png' },
                { id: 5, name: 'Масло Крестьянское', description: 'Традиционное сладкосливочное несоленое масло ГОСТ.', fat_content: '72.5%', image: 'img/5.png' },
                { id: 6, name: 'Масло Вологодское', description: 'Премиальное масло с выраженным ореховым привкусом сливок.', fat_content: '82.5%', image: 'img/6.png' },
                { id: 7, name: 'Сыр Моцарелла', description: 'Свежий мягкий сыр в рассоле. Идеально для пиццы и капрезе.', fat_content: '45%', image: 'img/7.png' },
                { id: 8, name: 'Сыр Дорблю', description: 'Сыр с голубой плесенью. Пикантный, в меру соленый и острый вкус.', fat_content: '50%', image: 'img/8.png' },
                { id: 9, name: 'Сыр Маасдам', description: 'Сыр с крупными глазками и сладковатым ореховым вкусом.', fat_content: '45%', image: 'img/9.png' },
                { id: 10, name: 'Масло Топленое', description: 'Чистый молочный жир. Идеально подходит для жарки и выпечки.', fat_content: '99%', image: 'img/10.png' },
                { id: 11, name: 'Сыр Рикотта', description: 'Мягкий итальянский сыр из сыворотки. Нежный и слегка сладковатый.', fat_content: '13%', image: 'img/1.png' },
                { id: 12, name: 'Масло Сливочное 72%', description: 'Классическое сливочное масло по ГОСТу. Идеально для бутербродов.', fat_content: '72%', image: 'img/5.png' }
            ],
            inventory: [
                // Гауда
                { id: 1, product_id: 1, weight: 300, price: 450, quantity: 25, exp_date: '2026-11-05' },
                { id: 2, product_id: 1, weight: 500, price: 700, quantity: 40, exp_date: '2026-11-20' },
                // Чеддер
                { id: 3, product_id: 2, weight: 200, price: 550, quantity: 30, exp_date: '2026-12-01' },
                { id: 4, product_id: 2, weight: 400, price: 1050, quantity: 15, exp_date: '2026-12-10' },
                // Пармезан
                { id: 5, product_id: 3, weight: 250, price: 800, quantity: 50, exp_date: '2027-05-10' },
                { id: 6, product_id: 3, weight: 500, price: 1500, quantity: 20, exp_date: '2027-06-15' },
                // Бри
                { id: 7, product_id: 4, weight: 150, price: 400, quantity: 15, exp_date: '2026-10-31' },
                { id: 8, product_id: 4, weight: 300, price: 780, quantity: 10, exp_date: '2026-11-05' },
                // Масло крестьянское
                { id: 9, product_id: 5, weight: 200, price: 220, quantity: 100, exp_date: '2026-11-15' },
                { id: 10, product_id: 5, weight: 400, price: 400, quantity: 40, exp_date: '2026-11-25' },
                // Масло вологодское
                { id: 11, product_id: 6, weight: 200, price: 350, quantity: 60, exp_date: '2026-11-25' },
                // Моцарелла
                { id: 12, product_id: 7, weight: 250, price: 300, quantity: 45, exp_date: '2026-10-25' },
                // Дорблю
                { id: 13, product_id: 8, weight: 200, price: 650, quantity: 20, exp_date: '2026-11-30' },
                // Маасдам
                { id: 14, product_id: 9, weight: 300, price: 480, quantity: 35, exp_date: '2026-12-15' },
                // Масло топлёное
                { id: 15, product_id: 10, weight: 500, price: 900, quantity: 25, exp_date: '2027-08-01' },
                // Рикотта
                { id: 16, product_id: 11, weight: 250, price: 380, quantity: 20, exp_date: '2026-11-10' },
                // Масло 72%
                { id: 17, product_id: 12, weight: 180, price: 180, quantity: 80, exp_date: '2026-11-20' },
                { id: 18, product_id: 12, weight: 450, price: 420, quantity: 55, exp_date: '2026-12-05' }
            ],
            orders: [
                // Завершенные заказы (для истории и статистики)
                { id: 1001, buyer_id: 7, courier_id: 3, status: 'completed', delivery_type: 'delivery', address: 'ул. Ленина, д. 10, кв. 5', total_sum: 1350, payment_card: '**** 4432', eta_time: '14:30', date: '2026-10-28' },
                { id: 1002, buyer_id: 8, courier_id: 4, status: 'completed', delivery_type: 'delivery', address: 'пр-т Мира, д. 5, кв. 12', total_sum: 800, payment_card: '**** 1111', eta_time: '15:00', date: '2026-10-28' },
                { id: 1003, buyer_id: 9, courier_id: null, status: 'completed', delivery_type: 'pickup', address: '', total_sum: 1200, payment_card: '**** 2222', date: '2026-10-29' },
                { id: 1004, buyer_id: 10, courier_id: 3, status: 'completed', delivery_type: 'delivery', address: 'ул. Пушкина, д. 20, кв. 30', total_sum: 2100, payment_card: '**** 3333', eta_time: '16:15', date: '2026-10-29' },
                { id: 1005, buyer_id: 7, courier_id: 4, status: 'completed', delivery_type: 'delivery', address: 'ул. Гагарина, д. 15, кв. 8', total_sum: 950, payment_card: '**** 4444', eta_time: '10:45', date: '2026-10-30' },
                { id: 1006, buyer_id: 8, courier_id: null, status: 'completed', delivery_type: 'pickup', address: '', total_sum: 650, payment_card: '**** 5555', date: '2026-10-30' },
                // Активный заказ на курьере (assigned)
                { id: 1007, buyer_id: 9, courier_id: 3, status: 'assigned', delivery_type: 'delivery', address: 'ул. Советская, д. 42, кв. 15', total_sum: 1450, payment_card: '**** 6666', eta_time: '17:30', date: '2026-10-30' },
                // Новые заказы в очереди (new)
                { id: 1008, buyer_id: 10, courier_id: null, status: 'new', delivery_type: 'delivery', address: 'ул. Кирова, д. 8, кв. 22', total_sum: 1800, payment_card: '**** 7777', eta_time: '18:00', date: '2026-10-30' },
                { id: 1009, buyer_id: 7, courier_id: null, status: 'new', delivery_type: 'pickup', address: '', total_sum: 700, payment_card: '**** 8888', date: '2026-10-30' },
                { id: 1010, buyer_id: 8, courier_id: null, status: 'new', delivery_type: 'delivery', address: 'пр-т Ленина, д. 100, кв. 5', total_sum: 2300, payment_card: '**** 9999', eta_time: '19:15', date: '2026-10-30' }
            ],
            orderItems: []
        };
        localStorage.setItem(DB_KEY, JSON.stringify(initialData));
    }
}

function getDB() {
    return JSON.parse(localStorage.getItem(DB_KEY));
}

function saveDB(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

initDB();