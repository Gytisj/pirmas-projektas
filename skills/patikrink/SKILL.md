---
name: patikrink
description: Patikrina, ar visas Flowly projekto vartotojui matomas tekstas (JSX tekstas, mygtukai, placeholder, aria-label, klaidų ir būsenų pranešimai, index.html title ir lang) parašytas lietuviškai. Grąžina lentelę su failu, eilute, ne lietuvišku tekstu ir siūlomu lietuvišku variantu, o gavus sutikimą – sutvarko. Naudok, kai vartotojas rašo „/patikrink“, „patikrink kalbą“, „ar visas tekstas lietuviškai“, „rask angliškus tekstus“, „patikrink UI tekstus“.
argument-hint: "[failas ar katalogas]"
---

# /patikrink – UI teksto kalbos patikra

Tikslas: užtikrinti, kad **visas vartotojui matomas tekstas** projekte būtų lietuvių kalba (žr. `AGENTS.md` → „UI tekstas“).

## Eiga

1. Paleisk skriptą iš projekto šaknies. Be argumentų tikrina `index.html` ir visą `src/`; galima nurodyti konkretų failą ar katalogą:

   ```bash
   node skills/patikrink/scripts/patikrink.mjs $ARGUMENTS
   ```

   Skriptas tik **surenka** matomus tekstus su `failas:eilutė` ir tipu (`tekstas`, `atributas placeholder`, `eilutė kode`, `html lang`). Kalbą vertini tu.

2. Peržiūrėk kiekvieną eilutę ir nuspręsk, ar tekstas lietuviškas. Jei abejoji dėl konteksto (pvz. ar `eilutė kode` tikrai rodoma vartotojui), atsidaryk failą ties ta eilute.

3. Papildomai greitai peržiūrėk `src/*.jsx` failus, ar skriptas ko nepraleido (pvz. kelių eilučių tekstas, tekstas sudėtingame `{sąlyga ? ... : ...}` bloke).

4. Pateik rezultatą.

## Ką laikyti klaida

- Angliškas ar kitos kalbos tekstas: `Main`, `Profile`, `Save`, `Loading...`, `Something went wrong`.
- `index.html`: `<html lang>` ne `lt`, `<title>` ne lietuviškas ar techninis (pvz. `pirmas-projektas`).
- Lietuviškas tekstas be lietuviškų raidžių, kai jų reikia (`Uzduotys` → `Užduotys`).

## Išimtys (ne klaida)

- Prekės ženklas **Flowly**.
- Vartotojo ir API duomenys (`{task.title}`, `{currentUser.username}`, el. paštas).
- Techninės reikšmės, kurių vartotojas nemato: `className`, `type`, `autoComplete`, HTTP metodai, URL, `localStorage` raktai.
- Simboliai ir trumpiniai: `%`, `×`, `••••••••`, `Pvz.`, `El. paštas`.
- Įsitvirtinę tarptautiniai žodžiai lietuviška forma: `Statusas`, `Progresas`.

## Rezultato formatas

Jei viskas lietuviškai – parašyk vieną sakinį: kiek tekstų ir failų patikrinta, klaidų nerasta.

Jei rasta klaidų – lentelė:

| Vieta | Tekstas | Problema | Siūlomas taisymas |
| --- | --- | --- | --- |
| `src/Navbar.jsx:30` | `Main` | angliškai | `Pagrindinis` |
| `index.html:2` | `lang="en"` | ne lietuvių kalbos žymė | `lang="lt"` |

Siūlydamas taisymą:

- naudok projekte **jau vartojamus terminus** (pvz. jei kitur yra „Užduotys“, „Atsijungti“, „Profilis“ – rinkis juos, ne sinonimus);
- tekstas trumpas ir aiškus, ta pati stilistika (kreipinys „jūs“, kaip kitur projekte);
- jei tekstas naudojamas ir logikoje (pvz. lyginamas `=== "Atlikta"`, `<option value>`, saugomas API) – pažymėk tai lentelėje ir perspėk, kad keitimas paveiks esamus duomenis.

Lentelės pabaigoje paklausk: **„Ar sutvarkyti šiuos tekstus?“** Failų be sutikimo nekeisk.

## Taisymas (tik gavus sutikimą)

- Keisk **tik** rastus tekstus – jokių kitų kodo, stiliaus ar struktūros pakeitimų.
- Prieš keisdamas perskaityk naujausią failo versiją.
- Po pakeitimų paleisk skriptą dar kartą ir parodyk, kad klaidų neliko.
- Pabaigoje trumpai: kuriuos failus pakeitei ir kaip patikrinti – `npm run dev` ir peržiūrėti pakeistus ekranus.
