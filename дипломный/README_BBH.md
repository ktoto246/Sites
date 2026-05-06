# БХБ - Балашовская хлебная база

Веб-приложение для управления операциями хранилища зерна и хлебной продукции. Система поддерживает различные роли пользователей (клиенты, диспетчеры, администраторы, финансисты) и управляет хранением, доставкой, финансами и справочниками культур.

## 📋 Описание проекта

**БХБ** — это комплексное решение для управления операциями хлебной базы, включая:
- 🏦 **Управление хранилищем** — отслеживание сырья и готовой продукции
- 🚚 **Система доставки** — управление запросами на доставку и статусы перевозок
- 📊 **Финансовый учёт** — управление расходами и доходами
- 👥 **Управление пользователями** — разные роли и уровни доступа
- 📖 **Справочники** — каталоги культур и услуг

## 🏗️ Структура проекта

```
/
├── Web/                          # Frontend (HTML, CSS, JavaScript)
│   ├── index.html                # Главная страница (для клиентов)
│   ├── login.html                # Вход в систему
│   ├── register.html             # Регистрация
│   ├── admin.html                # Админ-панель
│   ├── dispatcher.html           # Интерфейс диспетчера
│   ├── profile.html              # Профиль пользователя
│   ├── css/                      # Стили
│   │   ├── layout.css
│   │   ├── style.css
│   │   ├── login.css
│   │   ├── register.css
│   │   ├── admin.css
│   │   └── client.css
│   └── js/                       # JavaScript логика
│       ├── client.js             # Логика клиента
│       ├── admin.js              # Логика админа
│       ├── dispatcher.js         # Логика диспетчера
│       ├── login.js
│       ├── register.js
│       └── profile.js
│
├── WebApplication2/              # Backend (ASP.NET Core 8)
│   ├── WebApplication2.sln       # Solution файл
│   ├── Controllers/              # API контроллеры
│   │   ├── AuthController.cs     # Аутентификация
│   │   ├── RequestsController.cs # Управление запросами
│   │   ├── ReferencesController.cs # Справочники
│   │   ├── FinanceController.cs  # Финансы
│   │   └── ServicesController.cs # Услуги
│   ├── DTOs/                     # Data Transfer Objects
│   ├── Models/                   # Модели данных
│   ├── appsettings.json          # Конфигурация
│   └── Program.cs                # Точка входа
│
├── full_db.sql                   # SQL скрипт создания БД
└── README.md                     # Этот файл
```

## 🛠️ Технологический стек

### Frontend
- **HTML5** — структура
- **CSS3** — оформление (Bootstrap 5.3.0)
- **JavaScript** — функциональность
- **Bootstrap Icons** — иконки
- **LocalStorage** — сохранение данных на клиенте

### Backend
- **.NET 8** — фреймворк
- **ASP.NET Core** — веб-приложение
- **Dapper** — ORM для работы с БД
- **Swagger** — API документация

### База данных
- **SQL Server** — хранилище данных
- **T-SQL** — язык запросов

## 📊 Роли пользователей

| Роль | Доступ | Функции |
|------|--------|---------|
| **Клиент** | `client` | Создание запросов, просмотр профиля, история заказов |
| **Диспетчер** | `dispatcher` | Управление доставками, отслеживание, назначение водителей |
| **Администратор** | `admin` | Управление пользователями, настройки системы, аналитика |
| **Финансист** | `finance` | Управление расходами, доходами, финансовыми отчётами |

## 🚀 Требования и установка

### Требования
- **Windows 10+** или **macOS/Linux** (для .NET)
- **.NET 8.0** SDK и Runtime
- **SQL Server 2019+** или **SQL Server Express**
- **Веб-браузер** (Chrome, Firefox, Edge, Safari)
- **Visual Studio 2022** (для разработки backend)
- **Code Editor** (VS Code, Visual Studio, и т.д.)

### Установка и запуск

#### 1️⃣ Создание базы данных

```bash
# Откройте SQL Server Management Studio
# Выполните скрипт:
sqlcmd -S .\SQLEXPRESS -i full_db.sql
```

Или через SSMS:
1. Откройте **SQL Server Management Studio**
2. Подключитесь к серверу
3. New Query → Откройте файл `full_db.sql`
4. Нажмите **Execute** (F5)

**Имя БД:** `БАЛАШОВСКАЯХЛЕБНАЯБАЗА`

#### 2️⃣ Запуск Backend (ASP.NET Core)

```bash
cd WebApplication2/WebApplication2
dotnet restore
dotnet run
```

Backend будет доступен по адресу: `https://localhost:5001` или `http://localhost:5000`

#### 3️⃣ Запуск Frontend

```bash
# Вариант 1: Через Live Server (VS Code)
# Установите расширение "Live Server"
# Кликните правой кнопкой на index.html → Open with Live Server

# Вариант 2: Через встроенный сервер Python
python -m http.server 8000
# Откройте http://localhost:8000/Web/
```

## 📝 Тестирование

### Тестовые учётные данные

Скрипт создаёт тестовых пользователей. Проверьте `full_db.sql` для деталей.

### API endpoints

Все endpoint доступны через Swagger UI:
```
https://localhost:5001/swagger/index.html
```

**Основные endpoint:**
- `POST /api/auth/login` — Вход
- `POST /api/auth/register` — Регистрация
- `GET /api/requests` — Получить запросы
- `POST /api/requests` — Создать запрос
- `GET /api/references` — Справочники
- `GET /api/finance` — Финансовые данные

## ⚙️ Конфигурация

### appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.\\SQLEXPRESS;Database=БАЛАШОВСКАЯХЛЕБНАЯБАЗА;Integrated Security=true;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  },
  "AllowedHosts": "*"
}
```

**Измените:**
- `Server` — имя вашего SQL Server (обычно `.\SQLEXPRESS` или `(localdb)\MSSQLLocalDB`)
- `Database` — название БД

## 🎯 Функциональность

### Для клиентов
- ✅ Регистрация и вход
- ✅ Создание запросов на доставку
- ✅ Просмотр истории заказов
- ✅ Управление профилем
- ✅ Отслеживание статуса доставки

### Для диспетчеров
- ✅ Управление списком доставок
- ✅ Назначение водителей
- ✅ Обновление статусов доставки
- ✅ Просмотр маршрутов

### Для администраторов
- ✅ Управление пользователями
- ✅ Просмотр системных логов
- ✅ Управление справочниками
- ✅ Аналитика и отчёты

### Для финансистов
- ✅ Управление расходами и доходами
- ✅ Финансовые отчёты
- ✅ Аналитика по услугам

## 🗄️ Схема базы данных

Основные таблицы:
- **Пользователи** — учётные данные и роли
- **Культуры** — справочник зерновых культур
- **Услуги** — доступные услуги
- **Запросы** — запросы на доставку/хранение
- **Финансы** — расходы и доходы
- **Статусы** — статусы доставок

## 🐛 Проблемы и решения

### Проблема: "Cannot connect to database"
**Решение:**
1. Убедитесь, что SQL Server запущен
2. Проверьте connection string в `appsettings.json`
3. Выполните скрипт `full_db.sql` заново

### Проблема: "Port already in use"
**Решение:**
```bash
# Измените порт в launchSettings.json
"applicationUrl": "https://localhost:5002;http://localhost:5003"
```

### Проблема: CORS ошибки при запросах с frontend
**Решение:** Убедитесь, что backend включает CORS:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder.AllowAnyOrigin()
                         .AllowAnyMethod()
                         .AllowAnyHeader());
});
```

## 📚 Дополнительные ресурсы

- [ASP.NET Core Documentation](https://learn.microsoft.com/en-us/aspnet/core/)
- [Dapper ORM](https://github.com/DapperLib/Dapper)
- [Bootstrap Documentation](https://getbootstrap.com/)
- [SQL Server Documentation](https://learn.microsoft.com/en-us/sql/sql-server/)
- [Swagger/OpenAPI](https://swagger.io/)

## 📄 Примечания

- Приложение создано в образовательных целях
- Пароли хранятся в открытом виде (в production нужны хеши!)
- CORS разрешён для всех источников (в production нужны ограничения)
- JWT или другие токены не используются (рекомендуется добавить)

## 👨‍💻 Разработка

### Структура решения
- **WebApplication2** — .NET Core проект
- **Web** — Статические HTML/CSS/JS файлы

### Отладка
```bash
# Запустить в режиме разработки
dotnet run --configuration Debug

# Вкл. горячую перезагрузку
dotnet watch run
```