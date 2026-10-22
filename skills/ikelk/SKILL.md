---
name: ikelk
description: Įkelia Flowly projekto pakeitimus į GitHub (git commit ir git push) tik po privalomos /patikrink UI teksto kalbos patikros – jei randama ne lietuviško teksto, commit ir push neleidžiami, kol tekstai nesutvarkyti. Naudok VISADA, kai vartotojas prašo „/ikelk“, „commitink“, „supushink“, „įkelk į GitHub“, „padaryk commit“, „išsaugok pakeitimus repozitorijoje“, „push“, ar kitaip nori commitinti ar pushinti kodą.
argument-hint: "[commit žinutė]"
---

# /ikelk – commit ir push su privaloma kalbos patikra

Tikslas: į GitHub nepatektų kodas su ne lietuvišku vartotojui matomu tekstu (žr. `AGENTS.md` → „UI tekstas“).

Patikra privaloma kiekvieną kartą. Ją užtikrina `.claude/settings.json` PreToolUse hookas (`skills/ikelk/scripts/sargas.mjs`): `git commit` ir `git push` blokuojami, kol `index.html` ir `src/` failai nepatvirtinti per šį skillą. Bet koks failo pakeitimas po patvirtinimo vėl blokuoja.

## Eiga

1. Peržiūrėk, kas bus įkelta:

   ```bash
   git status --short
   git diff --stat
   ```

   Jei nėra ką commitinti ir pushinti – pasakyk tai ir baik.

2. **Kalbos patikra.** Atlik visą `/patikrink` skillo (`skills/patikrink/SKILL.md`) 1–3 žingsnius visam projektui (be argumentų): paleisk skriptą, įvertink kiekvieną tekstą, peržiūrėk `src/*.jsx`.

3. **Jei rasta ne lietuviško teksto – STOP.**
   - Nedaryk commit ir push, nepatvirtink (`--patvirtinti`) failų.
   - Pateik klaidų lentelę `/patikrink` formatu ir parašyk: **„Commit ir push neleidžiami, kol šie tekstai nesutvarkyti. Ar sutvarkyti?“**
   - Gavęs sutikimą, sutvarkyk pagal `/patikrink` „Taisymas“ skyrių, paleisk patikrą iš naujo ir tik tada tęsk nuo 4 žingsnio.
   - Jei vartotojas nesutinka taisyti – commit ir push nedaryk.

4. **Jei klaidų nėra** – patvirtink dabartinius failus:

   ```bash
   node skills/ikelk/scripts/sargas.mjs --patvirtinti
   ```

   Patvirtinti galima **tik** po pilnos patikros, kurioje klaidų nerasta. Niekada nepatvirtink, kad apeitum blokavimą.

5. **Commit.** Pridėk pakeitimus ir sukurk commit:
   - žinutė – `$ARGUMENTS`, jei nurodyta; kitaip trumpa žinutė lietuviškai pagal pakeitimus (kaip ankstesniuose commituose);
   - neįtrauk failų, kurie neturi būti repozitorijoje (pvz. `.env`, `node_modules`, `dist`).

6. **Push** į dabartinę šaką: `git push` (jei šaka neturi upstream – `git push -u origin <šaka>`).

7. Pabaigoje trumpai: kiek tekstų ir failų patikrinta, commit hash ir žinutė, į kurią šaką pushinta.

## Jei hookas užblokavo komandą

Hooko pranešimas „Užblokuota: git commit/push negalimas…“ reiškia, kad failai pasikeitė po patikros arba patikra nebuvo atlikta. Grįžk į 2 žingsnį. Neapeik hooko (`--no-verify`, kitos komandos, rankinis žymės failo keitimas).
