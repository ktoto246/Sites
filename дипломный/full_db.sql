USE master;
GO

IF DB_ID('БАЛАШОВСКАЯХЛЕБНАЯБАЗА') IS NOT NULL
BEGIN
    ALTER DATABASE БАЛАШОВСКАЯХЛЕБНАЯБАЗА SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE БАЛАШОВСКАЯХЛЕБНАЯБАЗА;
END
GO

CREATE DATABASE БАЛАШОВСКАЯХЛЕБНАЯБАЗА;
GO

USE БАЛАШОВСКАЯХЛЕБНАЯБАЗА;
GO

CREATE TABLE Пользователи (
    Код INT IDENTITY(1,1) PRIMARY KEY,
    ФИО_или_Название NVARCHAR(150) NOT NULL,
    Телефон NVARCHAR(20) NOT NULL,
    Почта NVARCHAR(100) UNIQUE,
    Пароль NVARCHAR(100) NOT NULL, 
    Роль NVARCHAR(20) NOT NULL DEFAULT 'client',
    ДатаРегистрации DATETIME DEFAULT GETDATE()
);

CREATE TABLE Культуры (
    Код INT IDENTITY(1,1) PRIMARY KEY,
    Название NVARCHAR(100) NOT NULL UNIQUE,
    НормаВлажности DECIMAL(5,2) NOT NULL DEFAULT 14.00,
	НормаСорности DECIMAL(5,2) NOT NULL DEFAULT 2.00
);

CREATE TABLE Статусы (
    Код INT IDENTITY(1,1) PRIMARY KEY,
    Название NVARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Этапы (
    Код INT IDENTITY(1,1) PRIMARY KEY,
    Название NVARCHAR(100) NOT NULL,
    ПроцентЗавершения INT NOT NULL
);

CREATE TABLE Услуги (
    Код INT IDENTITY(1,1) PRIMARY KEY,
    Название NVARCHAR(150) NOT NULL UNIQUE,
    ЕдиницаИзмерения NVARCHAR(20) DEFAULT 'тонна',
    Цена DECIMAL(10,2) NOT NULL
);

CREATE TABLE Заявки (
    Код INT IDENTITY(1,1) PRIMARY KEY,
    КодПользователя INT NOT NULL,
    КодКультуры INT NOT NULL,
    КодСтатуса INT NOT NULL DEFAULT 1,
    КодЭтапа INT NOT NULL DEFAULT 1,
    
    ВесВТоннах DECIMAL(10,2) NOT NULL,
    Влажность DECIMAL(5,2),
    Сорность DECIMAL(5,2),
    
    ФактВесПриёмки DECIMAL(10,2) NULL,
    ФактВес DECIMAL(10,2) NULL,
    ФактВлажность DECIMAL(5,2) NULL,
    ФактСорность DECIMAL(5,2) NULL,
    
    ЗапросХранение BIT NOT NULL DEFAULT 0,
    ДниХранения INT NULL,
    ЗапросЖД BIT NOT NULL DEFAULT 0,

    ЖелаемаяДата DATE NOT NULL,
    Комментарий NVARCHAR(MAX),
    КомментарийАдмина NVARCHAR(MAX),
    СтатусОплаты NVARCHAR(50) DEFAULT 'Не рассчитано', 
    ИтоговаяСумма DECIMAL(12,2) DEFAULT 0.00,
    ДатаСоздания DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (КодПользователя) REFERENCES Пользователи(Код),
    FOREIGN KEY (КодКультуры) REFERENCES Культуры(Код),
    FOREIGN KEY (КодСтатуса) REFERENCES Статусы(Код),
    FOREIGN KEY (КодЭтапа) REFERENCES Этапы(Код)
);

CREATE TABLE УслугиЗаявки (
    Код INT IDENTITY(1,1) PRIMARY KEY,
    КодЗаявки INT NOT NULL,
    КодУслуги INT NOT NULL,
    Объем DECIMAL(10,2) NOT NULL,
    Сумма DECIMAL(12,2) NOT NULL, 
    
    FOREIGN KEY (КодЗаявки) REFERENCES Заявки(Код) ON DELETE CASCADE,
    FOREIGN KEY (КодУслуги) REFERENCES Услуги(Код)
);

CREATE TABLE ИсторияЗаявок (
    Код INT IDENTITY(1,1) PRIMARY KEY,
    КодЗаявки INT NOT NULL,
    Действие NVARCHAR(100) NOT NULL,
    Текст NVARCHAR(MAX) NOT NULL,
    Дата DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (КодЗаявки) REFERENCES Заявки(Код) ON DELETE CASCADE
);
GO

-- ТРИГГЕРЫ
CREATE TRIGGER trg_RequestInsertHistory ON Заявки AFTER INSERT AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO ИсторияЗаявок (КодЗаявки, Действие, Текст)
    SELECT Код, 'Создание', 'Заявка подана клиентом. Вес: ' + CAST(ВесВТоннах AS NVARCHAR(20)) + 'т' FROM inserted;
END;
GO

CREATE TRIGGER trg_RequestUpdateHistory ON Заявки AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO ИсторияЗаявок (КодЗаявки, Действие, Текст)
    SELECT i.Код, 'Смена статуса', 'Новый статус: ' + s.Название
    FROM inserted i JOIN deleted d ON i.Код = d.Код JOIN Статусы s ON i.КодСтатуса = s.Код
    WHERE i.КодСтатуса <> d.КодСтатуса;

    INSERT INTO ИсторияЗаявок (КодЗаявки, Действие, Текст)
    SELECT i.Код, 'Смена этапа', 'Новый этап: ' + e.Название
    FROM inserted i JOIN deleted d ON i.Код = d.Код JOIN Этапы e ON i.КодЭтапа = e.Код
    WHERE i.КодЭтапа <> d.КодЭтапа;

    INSERT INTO ИсторияЗаявок (КодЗаявки, Действие, Текст)
    SELECT i.Код, 'Лаборатория', 'Внесен факт. вес: ' + CAST(i.ФактВес AS NVARCHAR(20))
    FROM inserted i JOIN deleted d ON i.Код = d.Код
    WHERE i.ФактВес IS NOT NULL AND (d.ФактВес IS NULL OR i.ФактВес <> d.ФактВес);

    INSERT INTO ИсторияЗаявок (КодЗаявки, Действие, Текст)
    SELECT i.Код, 'Биллинг', 'Выставлен счет: ' + CAST(i.ИтоговаяСумма AS NVARCHAR(20)) + ' руб.'
    FROM inserted i JOIN deleted d ON i.Код = d.Код
    WHERE i.ИтоговаяСумма <> d.ИтоговаяСумма AND i.ИтоговаяСумма > 0;
END;
GO

INSERT INTO Культуры (Название, НормаВлажности, НормаСорности) VALUES 
('Пшеница 3 класс (продовольственная)', 14.00, 2.00), 
('Пшеница 4 класс (продовольственная)', 14.00, 2.00),
('Пшеница 5 класс (фуражная)', 14.00, 2.00), 
('Подсолнечник масличный', 8.00, 3.00),
('Ячмень пивоваренный', 14.00, 2.00), 
('Ячмень фуражный', 14.00, 2.00),
('Рожь продовольственная', 14.00, 2.00), 
('Гречиха на зерно', 14.00, 3.00),
('Овес', 14.00, 2.00), 
('Горох', 14.00, 2.00), 
('Лен', 12.00, 3.00), 
('Соя товарная', 12.00, 3.00);

INSERT INTO Статусы (Название) VALUES 
('Новая'), ('Принята в работу'), ('Ожидает завоза'), 
('В процессе обработки'), ('Выполнена'), ('Отклонена');

INSERT INTO Этапы (Название, ПроцентЗавершения) VALUES
('Не начат', 0), ('Машина в пути', 20), ('Взвешивание (брутто)', 40),
('Лаборатория (Анализ)', 60), ('Очистка от примесей', 75),
('Сушка в шахте', 85), ('Выгружен в силос', 100);

INSERT INTO Услуги (Название, ЕдиницаИзмерения, Цена) VALUES
('Приемка и взвешивание', 'тонна', 150.00), 
('Сушка зерна (за 1% влажности)', 'тонна', 85.00),
('Очистка зерна (за 1% сорности)', 'тонна', 60.00), 
('Отгрузка на Ж/Д транспорт', 'тонна', 200.00),
('Хранение (сутки)', 'тонна', 15.00);

INSERT INTO Пользователи (ФИО_или_Название, Телефон, Почта, Пароль, Роль) VALUES 
('ООО "Агро-Плюс" (Клиент)', '+7(999)123-45-67', 'info@agro-plus.ru', '12345', 'client'),
('ЗАО "Степные зори" (Админ)', '+7(800)555-35-35', 'admin@bhb.ru', 'admin', 'admin'),
('Иванова А.С. (Менеджер)', '+7(900)000-11-22', 'manager@bhb.ru', 'manager', 'manager'),
('Петров В.В. (Диспетчер)', '+7(910)333-44-55', 'disp@bhb.ru', 'disp', 'dispatcher');

INSERT INTO Заявки (КодПользователя, КодКультуры, КодСтатуса, КодЭтапа, ВесВТоннах, Влажность, Сорность, ФактВесПриёмки, ФактВес, ФактВлажность, ФактСорность, ЗапросХранение, ДниХранения, ЗапросЖД, ЖелаемаяДата, Комментарий, СтатусОплаты, ИтоговаяСумма) VALUES 
(1, 1, 1, 1, 100.00, 14.5, 2.1, NULL, NULL, NULL, NULL, 0, NULL, 0, '2026-05-10', '[Приемка на элеватор]
Прибудет на авто ЗИЛ.', 'Не рассчитано', 0.00),
(1, 4, 4, 6, 50.00, 20.0, 5.0, 50.20, 49.50, 19.5, 4.5, 1, 30, 0, '2026-05-05', '[Приемка на элеватор]
Требуется сушка.', 'Ожидает оплаты', 33500.00),
(1, 5, 5, 7, 200.00, 13.0, 1.5, 201.00, 200.10, 13.2, 1.6, 0, NULL, 1, '2026-05-01', '[Отгрузка с элеватора]
Успешно выгружена.', 'Оплачено', 30000.00);

INSERT INTO УслугиЗаявки (КодЗаявки, КодУслуги, Объем, Сумма) VALUES
(2, 1, 50.00, 7500.00), (2, 2, 50.00, 26000.00), (3, 1, 200.00, 30000.00);