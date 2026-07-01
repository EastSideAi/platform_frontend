# Обучение — контракт бэкенда главной (`#/learn`)

Дашборд ученика на главной «Обучение» (`src/screens/learn-home.jsx`). Сейчас у
страницы две версии — один макет, два источника данных:

- **Демо** — `#/learn`. Статичная витрина (захардкоженные программы, расписание,
  задачи, аналитика). Нужна для показов, когда бэкенда под рукой нет.
- **Живая** — `#/learn?live`. Те же блоки, но данные реальные: секция «Мои уроки»
  и KPI («Уроков в библиотеке / Заданий / Слов») собираются из `ELessonStore`
  (см. [lessons-api.md](./lessons-api.md)); остальное (расписание/задачи/серия) —
  из дашборд-эндпоинта ниже, с мок-фолбэком.

Флаг режима — query `?live`. Так можно открыть/отправить любую из двух версий
ссылкой, без переключателя на странице.

> Часть данных (расписание, задачи, серия занятий, время по предметам) пока не
> имеет реального источника — это следующий слой бэкенда. Контракт ниже описывает
> его целиком, чтобы фронт и бэк собирались под одну форму.

---

## 1. Эндпоинт дашборда

`GET /api/learning/dashboard` (или `/clients/{id}/dashboard/learning`) →
единый объект под главную. Пусто `ES_API_BASE` → фронт живёт на моке/ELessonStore.

```jsonc
{
  "hero": {
    "greetingName": "Дима",
    "todayLabel": "2 занятия и 1 задача",
    "nextClass": { "time": "17:00", "title": "Китайский язык · Урок 12" },
    "weekProgress": { "days": 5, "of": 7, "pct": 71 }
  },
  "myLessons": [                        // ← из lessons-api (summary), см. §2
    { "id": "l…", "title": "Приветствие", "level": "HSK 1",
      "counts": { "blocks": 6, "words": 8, "minutes": 9 } }
  ],
  "programs": [                          // курсы (крупные карточки)
    { "id": "zh", "title": "Китайский язык", "meta": "32 урока · 12 тестов", "active": true, "accent": "43,143,255" }
  ],
  "schedule": [
    { "time": "17:00", "title": "Китайский язык", "sub": "Урок 12 · Время", "kind": "Занятие", "next": true }
  ],
  "tasks": [
    { "title": "Домашка по уроку 11", "sub": "IELTS · Writing", "due": "Сегодня, 23:59", "hot": true }
  ],
  "stats": {
    "kpi": [ { "key": "lessons", "num": 18, "label": "Уроков пройдено", "delta": "+3 за неделю" } ],
    "activity": [ { "d": "Пн", "minutes": 42 } ],
    "subjectsHours": [ { "name": "Китайский", "hours": 8 } ],
    "streak": { "current": 12, "best": 14, "weekDays": 5, "totalHours": 48,
                "heatmap": [ { "date": "2026-06-15", "intensity": 3 } ] }
  }
}
```

Фронт устойчив к отсутствию любой ветки: нет `schedule` → секция скрывается,
нет `myLessons` → берётся `ELessonStore.list()`.

## 2. Источник «Мои уроки» и KPI (уже живой)

Секция «Мои уроки» и KPI живой версии не требуют нового бэка — они собираются из
уроков (`GET /api/learning/lessons`, [lessons-api.md](./lessons-api.md)):

- `myLessons` = список уроков (summary), сорт по `updatedAt desc`, первые 6 на главной.
- KPI: `Уроков` = `lessons.length`; `Заданий` = Σ `counts.blocks`; `Слов` = Σ `counts.words`.

Кнопка «Все уроки» на секции ведёт в библиотеку `#/learn/lessons`.

## 3. Миграция БД (дашборд-часть, идемпотентно)

Уроки уже покрыты `eastside.lessons` (lessons-api.md). Для остального дашборда:

```sql
-- migrations/00XX_learning_dashboard.sql
create table if not exists eastside.lesson_events (   -- расписание/занятия/дедлайны
  id          bigserial primary key,
  client_id   uuid,
  kind        text not null,               -- lesson | webinar | homework
  title       text not null default '',
  subtitle    text not null default '',
  starts_at   timestamptz,
  due_at      timestamptz,
  meta        jsonb not null default '{}'::jsonb
);
create table if not exists eastside.learning_progress ( -- серия/минуты/прогресс
  client_id   uuid primary key,
  streak_cur  int not null default 0,
  streak_best int not null default 0,
  minutes     jsonb not null default '[]'::jsonb,  -- активность по дням
  updated_at  timestamptz not null default now()
);
create index if not exists lesson_events_client_idx on eastside.lesson_events (client_id, starts_at);
```

## 4. FastAPI-эскиз

```python
# app/api/learning_dashboard.py
from fastapi import APIRouter
from app.db import pool
from app.api import lessons  # переиспользуем summary уроков

router = APIRouter()

@router.get("/dashboard")
async def dashboard(client_id: str | None = None) -> dict:
    my = (await lessons.list_lessons())["lessons"]
    # schedule/tasks/stats — из lesson_events / learning_progress (когда наполнятся);
    # до тех пор фронт сам подставит демо/мок.
    return {
        "myLessons": my[:6],
        "stats": {"kpi": [
            {"key": "lessons", "num": len(my), "label": "Уроков в библиотеке"},
            {"key": "tasks",   "num": sum(l["counts"]["blocks"] for l in my), "label": "Заданий собрано"},
            {"key": "words",   "num": sum(l["counts"]["words"]  for l in my), "label": "Слов в уроках"},
        ]},
    }
```

Подключение: `app.include_router(router, prefix="/api/learning")`.

## 5. Включение живого бэкенда на фронте

1. Миграции (§3) + lessons-миграция.
2. Роутеры (§4 + lessons) в `app/main.py`, деплой на Railway.
3. `window.ES_API_BASE` в `index.html` → боевой URL.
4. Открывать `#/learn?live` — секция «Мои уроки», KPI и дашборд пойдут из бэка;
   `#/learn` остаётся демо-витриной для показов.
```
