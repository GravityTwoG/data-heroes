# Notification Preferences System

У нас платформа, где разные продуктовые модули отправляют пользователям уведомления по нескольким каналам: email, SMS, мессенджеры, пуши.  
Нужно спроектировать и реализовать сервис управления предпочтениями уведомлений, который служит единым источником правды для остальных компонентов.

Сервис отвечает за то, какие типы уведомлений и по каким каналам можно отправлять конкретному пользователю с учётом его выбора, дефолтных настроек и глобальных политик.

---

## Запуск

### Docker (рекомендуется)

```bash
cp .env.example .env
docker compose up --build
```

Сервис поднимается на `http://localhost:3000`.  
Swagger UI: `http://localhost:3000/docs`.

Миграции применяются автоматически при старте контейнера.  
Для засева дефолтных данных:

```bash
docker compose exec app npm run db:seed
```

### Локально

Требуется Node.js 24.13.0 и Docker c плагином Compose.

```bash
cp .env.example .env
npm ci
npm run dev   # поднимает postgres в Docker и запускает сервис с hot reload
```

Сервис поднимается на `http://localhost:3000`.  
Swagger UI: `http://localhost:3000/docs`.

---

## Тесты

Тесты запускаются локально — не внутри Docker. Нужны установленные зависимости и запущенный Docker (для Testcontainers в e2e).

```bash
npm ci
```

### Unit-тесты

```bash
npm test
```

### E2E-тесты

Testcontainers автоматически поднимает изолированный PostgreSQL для каждого запуска.

```bash
npm run test:e2e
```

### Все тесты + coverage

```bash
npm run test:coverage
```

Покрытие доменной логики (`src/domain/usecases`) и репозиториев (`src/repositories/*.repo.ts`) — 100% по statements, branches и functions.

Unit-тестами покрыты только чистые утилиты (`isInQuietHours`, валидация таймзон, временных строк, регионов) — включая граничные случаи DST и перехода через полночь. Всё остальное проверяется e2e с реальной БД.

---

## Решение

Сервис не управляет пользователями — для него `userId` это просто внешний ключ, приходящий от смежных систем. 

Отдельного эндпоинта для создания пользователя нет. Если пользователь ничего не менял, то дефолтные настройки всегда будут последние и актуальные. Если бы юзер явно создавался с дефолтными настройками, то в будущем при изменении дефолтов в системе, то у юзера и системы они бы начали отличаться (Требований связанных с этим нет, просто выбрал вариант с меньшим количеством работы). 

При запросе предпочтений для ещё не встречавшегося id сервис вычисляет и возвращает настройки на основе дефолтных настроек и глобальных политик, не создавая записи в БД.  

При изменении настроек операция применяется идемпотентно: если запись отсутствует, она создаётся с заданными параметрами (upsert), а повторная отправка того же изменения не ломает состояние и не плодит дубликаты. 

Проверка возможности отправки вычисляет решение на основе дефолтов, индивидуальных предпочтений (если есть) и глобальных политик, не модифицируя данные.

Приоритетность:
  Глобальные политики (высший приоритет)
  Предпочтения пользователя (тихие часы)
  Предпочтения пользователя
  Предпочтения по умолчанию (низший приоритет)

- Предполагается, что все необходимые препочтения (комбинации типов и каналов) по умолчанию есть в БД. Если нет, то выбрасываем ошибку 400/404.
- Предполагается что все комбинации (тип, канал) валидны.
- Предполагается что все комбинации (тип, канал, регион) валидны.

API:
1. Получение предпочтений пользователя `GET /users/:id/preferences`
   Выход:
   ```json
   {
     "userId": "user-1",
     "channels": [
       {
         "type": "marketing",
         "channel": "email",
         "enabled": true
       }
     ],
     "quietHours": null
   }
   ```

2. Изменение предпочтений пользователя `POST /users/:id/preferences`  
   Тело может содержать:
   - включение/выключение типа уведомления по каналу;
   - настройки quiet hours + timezone. Добавил timezone, чтобы учитывать часовой пояс и сдвигов летнего/зимнего времени
   - если quietHours null, то запись с quiet hours удаляется 

   Вход:
   ```json
   {
     "preference": {
       "type": "marketing",
       "channel": "email",
       "enabled": false
     },
     "quietHours": {
       "start": "22:00",
       "end": "08:00",
       "timezone": "Europe/Moscow"
     }
   }
   ```

3. Проверка возможности отправки уведомления `POST /users/:id/preferences/evaluate`  
   Вход:
   ```json
   {
     "type": "marketing",
     "channel": "email",
     "region": "EU",
     "datetime": "2026-05-21T21:30:00Z"
   }
   ```
   Выход:
   ```json
   {
     "decision": "deny",
     "reason": "blocked_by_global_policy"
   }
   ```

Системы авторизации нет, так как предполагается что сервис работает внутри сети и авторизация отдана на откуп инфре.

Логируем изменение предпочтений и вынесение решение. Поддержка requestId из запроса.

Имплементация репозиториев, юзкейсов, настройка тестового окружения в большей части выполнена кодинговым агентом. Я занимался проектированием и ревью кода.


## Доменная модель

```
enum NotificationChannel {
  EMAIL    = "email"
  SMS      = "sms"
  TELEGRAM = "telegram"
  WHATSAPP = "whatsapp"
  MAX      = "max"
  PUSH     = "push"
}

enum NotificationType {
  MARKETING = "marketing"
  TRANSACTION = "transaction"
}

enum Region {
  EU
  US
  RU
  ...
} ISO 3166-1 alpha-2

type DefaultPreference {
  notificationType NotificationType
  notificationChannel NotificationChannel
  enabled boolean
}

type GlobalPolicy {
  type    NotificationType
  channel NotificationChannel
  enabled boolean
  region  Region
}

type UserPreference {
  type    NotificationType
  channel NotificationChannel
  enabled boolean
}

type UserQuietHours {
  start    TIME WITHOUT TIME ZONE
  end      TIME WITHOUT TIME ZONE
  timezone string IANA
}

type UserPreferences {
  userId     string // uuid 
  channels   UserPreference[]
  quietHours UserQuietHours | null
}

enum EvaluatePreferencesDecision {
  ALLOW = 'allow'
  DENY = 'deny'
}

enum EvaluatePreferencesDecisionReason {
  ALLOWED_BY_USER_PREFERENCES = 'allowed_by_user_preferences'
  ALLOWED_BY_DEFAULT_PREFERENCES = 'allowed_by_default_preferences'

  BLOCKED_BY_GLOBAL_POLICY = 'blocked_by_global_policy'
  BLOCKED_BY_QUIET_HOURS = 'blocked_by_quiet_hours'
  BLOCKED_BY_USER_PREFERENCES = 'blocked_by_user_preferences'
  BLOCKED_BY_DEFAULT_PREFERENCES = 'blocked_by_default_preferences'
}

type Evaluated {
  decision EvaluatePreferencesDecision
  reason EvaluatePreferencesDecisionReason
}
```

Доменные модели анемические, так как какой-то сложной логики и валидации у них нет. Прописаны функции валидации у value object, которые используются в http слое (одновременно используются для валидации входных данных и как метаданные для openapi схемы). А так, можно было всю валидацию в модели перенести, но я не стал этого делать из-за дублирования (валидация в http слое, потом та же валидация в конструкторах моделей). 

## Модель хранения

```sql
CREATE TABLE default_preferences (
  notification_type TEXT NOT NULL,
  notification_channel TEXT NOT NULL,
  enabled BOOLEAN NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  PRIMARY KEY (notification_type, notification_channel),
  
  CONSTRAINT check_default_type CHECK (notification_type IN ('marketing', 'transaction')),
  CONSTRAINT check_default_channel CHECK (notification_channel IN ('email', 'sms', 'telegram', 'whatsapp', 'max', 'push'))
);

CREATE TABLE user_preferences (
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  notification_channel TEXT NOT NULL,
  enabled BOOLEAN NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT check_user_type CHECK (notification_type IN ('marketing', 'transaction')),
  CONSTRAINT check_user_channel CHECK (notification_channel IN ('email', 'sms', 'telegram', 'whatsapp', 'max', 'push'))
  
  PRIMARY KEY (user_id, notification_type, notification_channel)
);

CREATE TABLE user_quiet_hours (
  user_id TEXT PRIMARY KEY,
  start TIME WITHOUT TIME ZONE NOT NULL,
  end TIME WITHOUT TIME ZONE NOT NULL,
  timezone TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE global_policies (
  notification_type TEXT NOT NULL,
  notification_channel TEXT NOT NULL,
  region TEXT NOT NULL,
  enabled BOOLEAN NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  PRIMARY KEY (notification_type, notification_channel, region),

  CONSTRAINT check_policy_type CHECK (notification_type IN ('marketing', 'transaction')),
  CONSTRAINT check_policy_channel CHECK (notification_channel IN ('email', 'sms', 'telegram', 'whatsapp', 'max', 'push'))
);
```

Для БД дополнительно добавлены колонки create_at, updated_at. Енамы в БД будут реализованы через constraint check, вместо отдельных типов. Такая схема позволяет добавлять новые типы и каналы без изменения структуры таблиц (нужно только constraint обновить и само приложение). Если нужна еще большая гибкость, то можно NotificationChannel, NotificationType вынести в справочники БД и убрать закардкоженные енамы из кода. 

Для тестирования будет скрипт для сидирования пользователей, глобальных политик, предпочтений по умолчанию.

## Стэк

Platform: Node.js  
Language: TypeScript, SWC  
Persistence Layer: PostgreSQL, Prisma  
API: REST API via Fastify, Swagger  
Tests: vitest + testcontainers  

## Структура проекта

```
src/
  lib/          reusable, not domain specific utilities (logger)
  repositories/ repositories abstracting work with prisma, mapping db records to domain entities
  domain/
    interfaces/ definitions of interfaces required for domain
    entities/   domain entities decoupled from database records, error
    services/   reusable domain logic
    usecases/   business logic
  http/         exposing business logic via REST API
  config.ts     app config, validated by Zod
  main.ts       app bootstrap logic
tests/e2e       e2e tests
Dockerfile
docker-compose.yml
```

---

## Что добавить для продакшена

- Кэширование - выполнять чтение через кэш, данные вряд ли будут часто меняться. При записи - запись одновременно в основую бд и кэш.
- Health-check эндпоинты
- Graceful shutdown - дожидаться завершения текущих запросов запросов перед отключением сервера.
- Рейт-лимиты
- Хранить историю изменений настроек пользователя.
- Если предпочтений будет становиться больше, возможно потребуется пагинация.
- Эндпоинты для управления дефолтными предпочтениями и глобальными политиками
- Гит-хуки для проверки форматирования, типов, запуска юнит тестов, conventional commits
- Распараллелить тесты (запускать один инстанс БД, но с несколькими логическими БД внутри)
- Настроить мутационное тестирование
- Логика работы quiet hours сейчас захардкожена, возможно стоит добавить флаг allowed_in_quiet_hours в предпочтениях, глобальных политиках
