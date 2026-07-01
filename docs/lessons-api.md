# Уроки — контракт бэкенда (`/api/learning/lessons`)

Бэкенд для двух экранов учебной платформы: **конструктора** (`#/learn/build/:id`)
и **урока-тренажёра** (`#/learn/lesson/:id`). Урок — адресуемая сущность с
собственным `id`: на конкретный урок заходят по ссылке, редактируют, открывают как
ученик, дублируют, удаляют.

Фронт ходит сюда через репозиторий `window.ELessonStore` (`src/lib/lesson-store.jsx`).
Пока `window.ES_API_BASE` пуст — стор живёт на локальной таблице в `localStorage`
(превью/офлайн). Как только база задана — те же методы уходят в REST ниже
(`src/lib/api.jsx`: `lessonsList / lessonGet / lessonCreate / lessonUpdate / lessonDelete`).
Форма ответов совпадает: свап прозрачный, фронт править не нужно.

Этот документ — источник правды. Меняете форму — сперва правите его, потом бэк и
`lesson-store.jsx` под него.

> Деплой бэкенда и миграции на проде — **по слову владельца** (см. CLAUDE.md).
> Ниже — готовые к вкатке артефакты, не выполненные автоматически.

---

## 1. Модель урока (JSON)

Единый носитель — как в `src/lib/lessons.jsx`. Бэк хранит его как есть (JSONB) и
дублирует несколько полей в колонки ради списка и сортировки.

```jsonc
{
  "id": "l8f3k2a9",              // string, первичный ключ (может прислать клиент)
  "title": "Приветствие",        // string
  "subtitle": "Первые слова",     // string
  "goal": "Собрать первую фразу", // string
  "level": "HSK 1",              // string (HSK 1..4 | Разговорный)
  "video": {                      // объект; любое поле опционально
    "url": "https://youtu.be/…",  // ссылка (YouTube/Vimeo/RuTube/VK) ИЛИ
    "file": "assets/x.mp4",       // путь к файлу
    "title": "…", "duration": "08:40", "poster": "…", "hanzi": "你好"
  },
  "objectives": ["…"],            // string[]
  "glossary": [                   // словарь урока
    { "hanzi": "你好", "pinyin": "nǐ hǎo", "ru": "Привет" }
  ],
  "notes": "markdown-lite",       // конспект (legacy, fallback для doc[])
  "doc": [                        // документ-конспект: упорядоченные блоки
    { "_id": "b1", "kind": "para|heading|word|important|…", "text": "…" }
  ],
  "blocks": [                     // практика (choice/gap/match/order/type/tone/task)
    { "type": "choice", "prompt": "…", "options": [{ "text": "…", "correct": true }] }
  ],
  "materials": [                  // прикреплённые файлы
    { "title": "…", "url": "…", "filename": "…", "size": 12345 }
  ],
  "createdAt": "2026-07-01T10:00:00Z",  // ISO-8601, ставит сервер
  "updatedAt": "2026-07-01T10:32:00Z"   // ISO-8601, сервер обновляет на PUT
}
```

`summary` (для списка) — подмножество, которое умеет собрать и фронт:

```jsonc
{ "id","title","subtitle","level","hasVideo",
  "createdAt","updatedAt",
  "counts": { "doc": 8, "blocks": 6, "words": 6, "minutes": 9, "xp": 40 } }
```

Бэк может вернуть в списке либо `summary`, либо полные уроки — стор понимает оба
(если у элемента нет `counts`, он считает их сам через `ELessons.meta`).

---

## 2. Эндпоинты

Базовый префикс `/api/learning`. Все ответы — `application/json`. Мутациям нужен
CSRF-заголовок `X-CSRF-Token` (как у остального API, см. `src/lib/api.jsx`).

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| GET | `/lessons` | — | `200 { "lessons": [summary] }` |
| GET | `/lessons/{id}` | — | `200 { "lesson": Lesson }` · `404` |
| POST | `/lessons` | `Lesson` | `201 { "lesson": Lesson }` |
| PUT | `/lessons/{id}` | `Lesson` | `200 { "lesson": Lesson }` (upsert) |
| DELETE | `/lessons/{id}` | — | `204` |

Замечания:
- **POST** — сервер проставляет `createdAt`/`updatedAt`. `id` берёт из тела, если
  прислан (стор генерит стабильный id на клиенте), иначе генерит свой.
- **PUT** — идемпотентный upsert по `{id}`: если урока нет, создаётся; `updatedAt`
  всегда обновляется серверным `now()`. Тело — полный урок (стор шлёт целиком).
- Список отсортирован по `updated_at desc` (свежие сверху) — так же, как локальная
  таблица (новые уроки идут первыми).
- Позже: `owner_id` из сессии → фильтр «мои уроки». Колонка уже в схеме.

### Примеры

```http
GET /api/learning/lessons
200 { "lessons": [
  { "id":"l8f3k2a9","title":"Приветствие","subtitle":"Первые слова","level":"HSK 1",
    "hasVideo":true,"updatedAt":"2026-07-01T10:32:00Z",
    "counts":{"doc":8,"blocks":6,"words":6,"minutes":9,"xp":40} }
]}
```

```http
POST /api/learning/lessons
{ "id":"l9a…","title":"Числа","level":"HSK 1","doc":[…],"blocks":[…] }
201 { "lesson": { …, "createdAt":"…","updatedAt":"…" } }
```

---

## 3. Миграция БД (идемпотентная)

Схема `eastside` (как весь бэк). Положить в `eastside-backend/migrations/`
следующим номером, прогнать через Supabase SQL Editor или на старте приложения.

```sql
-- migrations/00XX_lessons.sql
create table if not exists eastside.lessons (
  id          text primary key,
  owner_id    uuid,                                   -- преподаватель (позже, из сессии)
  title       text        not null default '',
  subtitle    text        not null default '',
  level       text        not null default '',
  payload     jsonb       not null default '{}'::jsonb, -- весь урок целиком
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists lessons_updated_idx on eastside.lessons (updated_at desc);
create index if not exists lessons_owner_idx   on eastside.lessons (owner_id);
```

Колонки `title/subtitle/level` дублируют `payload->>…` — только чтобы список был
быстрым без разбора JSONB. Источник правды — `payload`.

---

## 4. FastAPI-роутер (готов к вкатке)

`eastside-backend/app/api/lessons.py`. Стиль — как в остальном бэке: `asyncpg`-пул,
Pydantic v2, схема `eastside` в `search_path`.

```python
# app/api/lessons.py
from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.db import pool  # тот же пул asyncpg, что и везде

router = APIRouter()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Lesson(BaseModel):
    id: str | None = None
    title: str = ""
    subtitle: str = ""
    goal: str = ""
    level: str = ""
    video: dict[str, Any] = Field(default_factory=dict)
    objectives: list[Any] = Field(default_factory=list)
    glossary: list[Any] = Field(default_factory=list)
    notes: str = ""
    doc: list[Any] = Field(default_factory=list)
    blocks: list[Any] = Field(default_factory=list)
    materials: list[Any] = Field(default_factory=list)
    createdAt: str | None = None
    updatedAt: str | None = None

    model_config = {"extra": "allow"}  # не терять поля, которых мы ещё не знаем


def _summary(row) -> dict:
    p = row["payload"] or {}
    if isinstance(p, str):
        p = json.loads(p)
    blocks = p.get("blocks") or []
    doc = p.get("doc") or []
    words = sum(1 for b in doc if isinstance(b, dict) and b.get("kind") == "word")
    minutes = max(1, round((len(doc) * 12 + len(blocks) * 25) / 60))
    video = p.get("video") or {}
    return {
        "id": row["id"],
        "title": row["title"],
        "subtitle": p.get("subtitle", ""),
        "level": row["level"],
        "hasVideo": bool(video.get("url") or video.get("file")),
        "createdAt": p.get("createdAt"),
        "updatedAt": p.get("updatedAt"),
        "counts": {"doc": len(doc), "blocks": len(blocks), "words": words, "minutes": minutes},
    }


@router.get("/lessons")
async def list_lessons() -> dict:
    async with pool().acquire() as con:
        rows = await con.fetch(
            "select id, title, level, payload, updated_at "
            "from eastside.lessons order by updated_at desc"
        )
    return {"lessons": [_summary(r) for r in rows]}


@router.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: str) -> dict:
    async with pool().acquire() as con:
        row = await con.fetchrow(
            "select payload from eastside.lessons where id = $1", lesson_id
        )
    if not row:
        raise HTTPException(status_code=404, detail="lesson not found")
    p = row["payload"]
    return {"lesson": json.loads(p) if isinstance(p, str) else p}


async def _upsert(lesson_id: str, body: Lesson, *, is_new: bool) -> dict:
    data = body.model_dump()
    data["id"] = lesson_id
    if is_new and not data.get("createdAt"):
        data["createdAt"] = _now()
    data["updatedAt"] = _now()
    async with pool().acquire() as con:
        await con.execute(
            """
            insert into eastside.lessons (id, title, subtitle, level, payload, created_at, updated_at)
            values ($1, $2, $3, $4, $5::jsonb, now(), now())
            on conflict (id) do update
              set title = excluded.title,
                  subtitle = excluded.subtitle,
                  level = excluded.level,
                  payload = excluded.payload,
                  updated_at = now()
            """,
            lesson_id, data.get("title", ""), data.get("subtitle", ""),
            data.get("level", ""), json.dumps(data, ensure_ascii=False),
        )
    return {"lesson": data}


@router.post("/lessons", status_code=201)
async def create_lesson(body: Lesson) -> dict:
    lesson_id = body.id or ("l" + uuid4().hex[:10])
    return await _upsert(lesson_id, body, is_new=True)


@router.put("/lessons/{lesson_id}")
async def put_lesson(lesson_id: str, body: Lesson) -> dict:
    return await _upsert(lesson_id, body, is_new=True)


@router.delete("/lessons/{lesson_id}", status_code=204)
async def delete_lesson(lesson_id: str) -> None:
    async with pool().acquire() as con:
        await con.execute("delete from eastside.lessons where id = $1", lesson_id)
```

Подключение в `app/main.py` (рядом с остальными роутерами):

```python
from app.api import lessons
app.include_router(lessons.router, prefix="/api/learning", tags=["learning"])
```

> `pool()` — как в вашем `app/db.py` (у вас пул может зваться иначе, напр. `db.pool`
> или зависимость `Depends(get_conn)`). Подставьте свой аксессор к asyncpg-пулу;
> запросы и форма ответа при этом не меняются.

---

## 5. Включение сетевого режима на фронте

1. Прогнать миграцию (раздел 3) в Supabase.
2. Подключить роутер (раздел 4), задеплоить бэк на Railway.
3. В `platform_frontend/index.html` выставить боевую базу:
   ```html
   <script>window.ES_API_BASE = 'https://eastside-backend-production.up.railway.app';</script>
   ```
4. В `CORS_ORIGINS` бэка добавить домен фронта (staging/прод).

После этого `ELessonStore` сам уходит в REST; локальная таблица остаётся
зеркалом-кешем (мгновенный старт конструктора + офлайн-устойчивость). Ни один экран
не требует правок.
```
