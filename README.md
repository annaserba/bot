# bot.annaserba.ru — страница бота «ПОР 48 и 48/1»

Статическая страница поддержки сервера бота в MAX: https://bot.annaserba.ru/

## Что где

- `index.html` — разметка и текст.
- `donate.css` — оформление.
- `config.js` — все настройки: ссылка на оплату, стоимость сервера, собранная сумма, месяц, реквизиты.
- `donate.js` — суммы, прогресс, липкая кнопка, цели Метрики.
- `avatar.jpg`, `og.jpg`, `favicon.svg` — картинки.

## Как обновить

1. Поправьте `config.js` (например, `collected` или `paymentUrl`).
2. Закоммитьте и запушьте:
   ```bash
   git add -A && git commit -m "Обновлены цифры сбора" && git push
   ```
3. GitHub Pages пересоберёт страницу за 1–2 минуты.

## Ссылка на оплату

Пока `paymentUrl` пустой — кнопки открывают Telegram с готовым текстом, ссылка на оплату приходит вручную.
Вставьте ссылку от банка/ЮKassa в `paymentUrl`, и кнопки сразу переключатся на оплату.
Сумма передаётся через `amountParam` (по умолчанию `amount`) или подстановкой `{amount}` в ссылке.

## DNS

`CNAME`: `bot` → `annaserba.github.io`; в GitHub Pages —
custom domain `bot.annaserba.ru` и Enforce HTTPS.
