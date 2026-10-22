---
name: tema
description: Pakeičia Flowly projekto akcento spalvą (CSS kintamuosius --accent, --accent-bg, --accent-border faile src/index.css) pagal nurodytą spalvą, fonams ir kortelėms suteikia lengvą akcento atspalvį, išlaiko gerą kontrastą ir parodo senas bei naujas reikšmes. Naudok, kai vartotojas rašo „/tema oranžinė“, „/tema žalia“, „pakeisk akcento spalvą į mėlyną“, „noriu raudonos temos“ ar „grąžink violetinę temą“.
argument-hint: <spalva | #hex | numatyta>
---

# /tema – akcento spalvos keitimas

Keičia **tik** spalvų kintamuosius `src/index.css` faile – šviesioje (`:root`) ir tamsioje (`@media (prefers-color-scheme: dark)`) temoje. Jokių kitų failų nekeisk.

## Eiga

1. Paleisk skriptą iš projekto šaknies, perduodamas vartotojo nurodytą spalvą:

   ```bash
   node skills/tema/scripts/tema.mjs $ARGUMENTS
   ```

2. Jei skriptas grąžina klaidą „Nežinoma spalva“ arba spalva nenurodyta – parodyk galimų spalvų sąrašą ir paklausk, kurią pasirinkti. Neišgalvok savo reikšmių ir nekeisk CSS ranka.

3. Sėkmės atveju vartotojui parodyk skripto išvestas lenteles be pakeitimų:
   - senos ir naujos kintamųjų reikšmės;
   - kontrasto palyginimas (senas / naujas).

4. Pabaigoje trumpai parašyk, kaip patikrinti: `npm run dev` ir peržiūrėti puslapį.

## Galimos spalvos

`violetinė`, `oranžinė`, `žalia`, `mėlyna`, `raudona`, `rožinė`, `geltona`, `žydra`, `indigo`, bet kuri `#hex` spalva arba `numatyta` – grąžina originalias Flowly reikšmes.

Lietuviškos raidės nebūtinos: `oranzine`, `zalia`, `melyna` irgi tinka.

## Ką keičia

- **Akcentas:** `--accent`, `--accent-bg`, `--accent-border` (abi temos).
- **Fonų atspalvis:** `--bg`, `--border`, `--code-bg`, `--card-bg`, `--card-border`, `--field-bg`, `--field-bg-hover`, `--field-border`, `--field-border-hover`. Keičiamas tik atspalvis (hue) – sotis ir šviesumas lieka originalūs, todėl tamsi tema lieka tamsi. Baltas šviesios temos fonas lieka baltas. Pilkai `#hex` spalvai fonai neatspalvinami.

## Kontrasto taisyklės

Skriptas pats parenka akcento šviesumą kiekvienai temai:

- akcento tekstas ant fono (`--bg`) – ne mažiau nei 4.5:1;
- akcento tekstas ant akcento fono (`--accent-bg`) – ne mažiau nei 4.5:1;
- baltas tekstas ant akcento mygtuko – bent 3:1 (jei įmanoma be teksto kontrasto praradimo).

Ataskaitoje taip pat rodomas pilko teksto kontrastas ant naujo fono. `--accent-bg` ir `--accent-border` permatomumas lieka toks pat kaip faile.

## Ribos

- Keičiamas tik `src/index.css`. Spalvos, įrašytos tiesiai komponentų CSS failuose (ne per `var(--...)`), nesikeičia – jei jų pastebi, tik paminėk vartotojui, bet failų nekeisk.
