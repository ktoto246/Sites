const database = (() => {
  const keys = { 
    users: 'stroyka_users', 
    session: 'stroyka_session', 
    products: 'stroyka_products_v2', // Обновлённый ключ для принудительного обновления списка
    orders: 'stroyka_orders', 
    cart: 'stroyka_cart', 
    employees: 'stroyka_employees' 
  };
  
  const defaults = {
    users: [
      { login: 'client', password: '1234', role: 'client', name: 'Клиент' },
      { login: 'admin', password: '1234', role: 'admin', name: 'Администратор' },
      { login: 'dispatcher', password: '1234', role: 'dispatcher', name: 'Диспетчер' }
    ],
    products: [
      { id: 1, name: 'Цемент М500', category: 'Сухие смеси', price: 450, unit: 'мешок 50 кг', image: 'https://kuzmich24.ru/images/cms/data/suchie_smesi/cement/10717_cement2.jpg' },
      { id: 2, name: 'Штукатурка гипсовая', category: 'Сухие смеси', price: 560, unit: 'мешок 30 кг', image: 'https://twowin.ru/wa-data/public/shop/products/01/53/15301/images/64151/64151.970.jpg' },
      { id: 3, name: 'Кирпич строительный', category: 'Кирпич и блоки', price: 28, unit: 'шт.', image: 'https://avatars.mds.yandex.net/i?id=5d0b43a11a43bfb803c875fddaa465dc_l-16050229-images-thumbs&n=13' },
      { id: 4, name: 'Газобетонный блок', category: 'Кирпич и блоки', price: 210, unit: 'шт.', image: 'https://avatars.mds.yandex.net/i?id=5e01c354a64825c468d4347893cccddf_l-8159518-images-thumbs&n=13' },
      { id: 5, name: 'Доска обрезная', category: 'Пиломатериалы', price: 490, unit: 'шт.', image: 'https://avatars.mds.yandex.net/get-mpic/18234312/2a0000019e1f603804d42b3a365f478600ce/orig' },
      { id: 6, name: 'Фанера шлифованная', category: 'Пиломатериалы', price: 1290, unit: 'лист', image: 'https://avatars.mds.yandex.net/get-mpic/5131700/2a00000191c711c3fc718c45cf7184332474/orig' },
      { id: 7, name: 'Краска интерьерная белая', category: 'Краски', price: 1150, unit: 'ведро 5 л', image: 'https://ir.ozone.ru/s3/multimedia-1-h/7121519441.jpg' },
      { id: 8, name: 'Грунтовка глубокого проникновения', category: 'Краски', price: 640, unit: 'канистра 10 л', image: 'https://avatars.mds.yandex.net/get-mpic/12219175/2a00000194dec6d38a838d4409caa99beb6b/orig' },
      { id: 9, name: 'Клей плиточный', category: 'Сухие смеси', price: 430, unit: 'мешок 25 кг', image: 'https://cdn.vseinstrumenti.ru/images/goods/stroitelnye-materialy/stroitelnye-smesi/20662208/2400x1600/204977528.jpg' },
      { id: 10, name: 'Кирпич облицовочный', category: 'Кирпич и блоки', price: 42, unit: 'шт.', image: 'https://ir.ozone.ru/s3/multimedia-1-y/7049075002.jpg' },
      { id: 11, name: 'Гипсокартон стеновой', category: 'Листовые материалы', price: 490, unit: 'лист', image: 'https://i.stroy-ka.ru/fc/b9/fcb9c1fb489f1692878b22f9972252cd.jpeg' },
      { id: 12, name: 'Пена монтажная', category: 'Крепёж и монтаж', price: 370, unit: 'баллон', image: 'https://user51928.clients-cdnnow.ru/upload/iblock/680/1_214_5.jpg' }
    ],
    employees: [
      { id: 'picker-1', name: 'Алексей Смирнов', role: 'picker' },
      { id: 'picker-2', name: 'Мария Волкова', role: 'picker' },
      { id: 'driver-1', name: 'Дмитрий Орлов', role: 'driver' },
      { id: 'driver-2', name: 'Елена Соколова', role: 'driver' }
    ],
    orders: [], 
    cart: []
  };

  // Инициализация хранилища значениями по умолчанию
  for (const [name, value] of Object.entries(defaults)) {
    if (localStorage.getItem(keys[name]) === null) {
      localStorage.setItem(keys[name], JSON.stringify(value));
    }
  }

  function get(name) { return JSON.parse(localStorage.getItem(keys[name])); }
  function set(name, value) { localStorage.setItem(keys[name], JSON.stringify(value)); }

  const cartsKey = 'stroyka_carts_v2';
  if (localStorage.getItem(cartsKey) === null) {
    localStorage.setItem(cartsKey, JSON.stringify({ guest: get('cart') || [], users: {} }));
  }

  function getCart(login) {
    const carts = JSON.parse(localStorage.getItem(cartsKey));
    return login ? (carts.users[`user:${login}`] || []) : carts.guest;
  }

  function setCart(login, items) {
    const carts = JSON.parse(localStorage.getItem(cartsKey));
    if (login) carts.users[`user:${login}`] = items; else carts.guest = items;
    localStorage.setItem(cartsKey, JSON.stringify(carts));
  }

  function mergeGuestCart(login) {
    const carts = JSON.parse(localStorage.getItem(cartsKey));
    const items = carts.users[`user:${login}`] || [];
    for (const entry of carts.guest) {
      const existing = items.find((item) => item.id === entry.id);
      if (existing) existing.quantity += entry.quantity; else items.push({ ...entry });
    }
    carts.users[`user:${login}`] = items;
    carts.guest = [];
    localStorage.setItem(cartsKey, JSON.stringify(carts));
  }

  function newOrderId() {
    return `З-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  const orders = get('orders');
  let changed = false;
  orders.forEach((order) => { if (!order.id) { order.id = newOrderId(); changed = true; } });
  if (changed) set('orders', orders);

  return { 
    get, 
    set, 
    getCart, 
    setCart, 
    mergeGuestCart, 
    newOrderId, 
    logout() { localStorage.removeItem(keys.session); } 
  };
})();