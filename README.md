# Notification Preferences System

У нас платформа, где разные продуктовые модули отправляют пользователям уведомления по нескольким каналам: email, SMS, мессенджеры, пуши.  
Нужно спроектировать и реализовать сервис управления предпочтениями уведомлений, который служит единым источником правды для остальных компонентов.

Сервис отвечает за то, какие типы уведомлений и по каким каналам можно отправлять конкретному пользователю с учётом его выбора, дефолтных настроек и глобальных политик.

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
  Если предпочтения по умолчанию нет, то считаем что выключено по умолчанию

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
         "enabled": true,
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
     "channels": [
       {
         "type": "marketing",
         "channel": "email",
         "enabled": false,
       }
     ],
     // OR
     "quietHours": {
       "start": "22:00",
       "end": "08:00",
       "timezone": "Europe/Moscow"
     }
   }
   ```json
   {
     "userId": "user-1",
     "channels": [
       {
         "type": "marketing",
         "channel": "email",
         "enabled": false,
       }
     ],
     "quietHours": {
       "start": "22:00",
       "end": "08:00",
       "timezone": "Europe/Moscow" // IANA timezone
     }
   }
   ```

3. Проверка возможности отправки уведомления `POST /evaluate`  
   Вход:
   ```json
   {
     "userId": "user-1",
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
  ALLOWED_BY_GLOBAL_POLICY = 'allowed_by_global_policy'
  ALLOWED_BY_USER_PREFERENCES = 'allowed_by_user_preferences'
  ALLOWED_BY_DEFAULT_PREFERENCES = 'allowed_by_default_preferences'

  BLOCKED_BY_GLOBAL_POLICY = 'blocked_by_global_policy'
  BLOCKED_BY_USER_PREFERENCES = 'blocked_by_user_preferences'
  BLOCKED_BY_QUIET_HOURS = 'blocked_by_quiet_hours'
  BLOCKED_BY_DEFAULT_PREFERENCES = 'blocked_by_default_preferences'
}

type Evaluated {
  decision EvaluatePreferencesDecision
  reason EvaluatePreferencesDecisionReason
}
```

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
  updated_at TIMESTAMPTZ DEFAULT now(),
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
  lib/ reusable, not domain specific utilities (logger)
  repositories/ - repositories abstracting work with prisma, mapping db records to domain entities
  domain/
    entities/     - domain entities decoupled from database records, error
    services/     - reusable domain logic
    usecases/     - business logic
  controllers/  - exposing business logic via REST API
  config.ts     - app config, validated by Zod
  main.ts       - app bootstrap logic
tests/e2e - e2e tests
Dockerfile
docker-compose.yaml
```
