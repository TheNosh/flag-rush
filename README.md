# Flag Rush 3D

Flag football (IFAF 5-tegen-5) in 3D, gebouwd met [Three.js](https://threejs.org) en [Vite](https://vite.dev).
Dit is een omzetting van het 2D-spel (`flag-rush.html`, blijft als referentie in deze map staan).

> **Status: stap 2 van 2 (spelregels overgezet).** Volledig spel: titel, teamkeuze (28 teams), playcall met 18 plays + 3 eigen plays (Play Maker, opgeslagen in localStorage), 5 dekkingen, 2 helften van 4 minuten, IFAF-regels (7-secondenklok, no-run zone, extra punt 1/2, interceptie-returns, pick six), CPU-tegenstander en controller- of toetsenbordbesturing. De 3D-spelers zijn nog procedureel; zie *Assets*.

## Lokaal starten

Vereist [Node.js](https://nodejs.org) 20.19 of nieuwer (LTS).

```bash
npm install
npm run dev
```

Open daarna het adres dat Vite toont (standaard http://localhost:5173). Een productiebuild maak je met `npm run build`
(map `dist/`), te bekijken met `npm run preview`.

## Besturing

Exact dezelfde knopindeling als het 2D-spel. PlayStation-controller via de Gamepad API, toetsenbord als terugval.

| Actie | Controller | Toetsenbord |
|---|---|---|
| Snap | X | Spatie / Enter / 1 |
| Lopen | L-stick | pijltjes |
| Sprint (stamina) | R2 | Shift |
| Gooien naar X / ◯ / □ / △ | X / ◯ / □ / △ | 1 / 2 / 3 / 4 |
| Juke | R-stick flick of □ | Q (3) |
| Spin | ◯ | E (2) |
| Hesitation | △ | W (4) |
| Camera (achter offense / achter defense / boven) | R3 | C |
| Andere speler besturen | L1 / L2 | Tab / H |
| Volgende play | Options | Esc / P |
| Volledig scherm | | F |
| Botsingscilinders tonen | | B |

Tip: in stap 1 bestuur je de QB. Bij een run-play gaat de handoff automatisch naar de speler die de bal krijgt; bij een pass druk
je op de knop van de ontvanger. Met L1 kun je elke speler (ook verdedigers) zelf besturen om het lopen, backpedallen
en de botsingen te testen.

## Projectstructuur

```
src/
  config.js            veldmaten en bewegingsconstanten
  data/                teams, plays, dekkingen (uit het 2D-spel)
  game/                spellogica, GEEN rendering
    movement.js        bewegingsmodel, ontwijking en harde botsingen
    formation.js       opstellingen (offense/defense)
    game.js            spelregels en live spel (flow, AI, pass, flag pull, Play Maker)
  input/input.js       controller + toetsenbord
  render/              alles wat getekend wordt
    scene.js           renderer, licht, schaduwen
    field.js           gras (PBR), krijtlijnen, yardcijfers, eindzones met teamnaam en logo
    stadium.js         tribunes (geinstancede toeschouwers), reclameborden, lichtmasten
    character.js       speler: skelet, animatie-blending, flags
    ball.js            bal met spiraal
    cameraRig.js       drie cameraposities
    overlay.js         2D-laag: menu's, HUD, playcall, Play Maker (uit het 2D-spel)
  main.js              koppelt alles aan elkaar
public/                textures en teamlogo's
```

Spellogica kent alleen `(x, y)` in yards (lengte, breedte); de renderer zet dat om naar wereldcoordinaten.

## Beweging en botsingen

- Versnellen en afremmen met beperkte grip: de draaicirkel volgt uit snelheid en versnelling.
- Kijkrichting draait langzamer naarmate je sneller loopt; rechtdoor is sneller dan zijwaarts, dat weer sneller dan achterwaarts.
- Lichaam leunt in bochten (`tan(lean) = zijwaartse versnelling / g`).
- Na een juke, spin of hesitation volgt een korte herstelfase.
- Spelers zijn cilinders (straal 0,4 yd) die nooit door elkaar lopen: zachte ontwijking in de sturing plus een harde
  correctie per stap. Niet-dragers blijven binnen de lijnen; de baldrager mag er overheen (= out of bounds).

## Assets en licenties

| Asset | Bron | Licentie |
|---|---|---|
| Gras-texturen `leafy_grass` (diffuse, normal, roughness, 1k) | [Poly Haven](https://polyhaven.com/a/leafy_grass) | CC0 |
| Three.js | https://threejs.org | MIT |
| Vite | https://vite.dev | MIT |
| Lettertypen Saira Condensed en Barlow (via Google Fonts) | Google Fonts | SIL OFL 1.1 |
| Spelermodel (X Bot) + animaties `public/models/player.glb` (gemaakt met `tools/mixamo-to-glb.mjs`) | [Mixamo](https://www.mixamo.com) (Adobe) | Mixamo-voorwaarden: gratis te gebruiken in projecten, ook commercieel; de ruwe FBX-bestanden (`mixamo/`) staan niet in de repository en mogen niet los worden doorgegeven |
| Teamlogo's (`public/logos`) | aangeleverd door de eigenaar (afkomstig van tournifyapp.com) | rechten bij de teams / eigenaar |

**Spelers:** de 3D-spelers zijn in stap 1 volledig procedureel (gewrichten + pose-blending in `render/character.js`),
dus er zijn nog geen externe modelbestanden gebruikt. Quaternius-modellen (CC0) of Mixamo-animaties (gratis met Adobe-account,
eigen gebruiksvoorwaarden) kunnen daarna via dezelfde API (`update`, `trigger`, `pullFlag`) worden ingehangen. Zet dan het
bestand in `public/models/` en vul hier de bron en licentie in.


## Mixamo-animaties opnieuw bouwen

`public/models/player.glb` is gebouwd uit Mixamo-FBX-bestanden in de map `mixamo/` (niet in git). Download bij Mixamo met karakter **X Bot**,
formaat *FBX Binary*, 30 fps, *Keyframe Reduction: none*, bij loop-animaties *In Place* aan. `stance.fbx` met **With Skin**, de rest **Without Skin**:

| Bestand | Mixamo-animatie |
|---|---|
| `stance.fbx` | Football Stance (levert het personage) |
| `idle.fbx` | Idle (Standing Idle) |
| `jog.fbx` · `sprint.fbx` | Jog Forward (Soccer) · Sprint (Standard Sprint) |
| `back.fbx` | Running Backward (Backwards Running) |
| `strafeL.fbx` · `strafeR.fbx` | Left Strafe · Right Strafe (Running Strafe) |
| `juke.fbx` · `spin.fbx` | Dodging Right (in place) · Soccer Spin |
| `throw.fbx` | Quarterback Pass (de worp wordt eruit geknipt, zie `TRIM` in het script) |
| `catch.fbx` | Goalkeeper Catch (Medium Height) |
| `cheer.fbx` · `miss.fbx` | Cheering (two fists pump) · Jogging Stumble (in place) |

Daarna: `node tools/mixamo-to-glb.mjs`. Flag pull en hesitation hebben geen Mixamo-clip en blijven procedureel.

## Echte spelermodellen (GLB) gebruiken

Het spel gebruikt automatisch een skelet-model als `public/models/player.glb` bestaat; anders de procedurele spelers.
Aanbevolen: Quaternius *Universal Animation Library* / *Ultimate Modular Men* (CC0) of een Mixamo-karakter met animaties (gratis met Adobe-account).

1. Zet het bestand als `public/models/player.glb` (één karakter met alle animaties erin).
2. Start het spel en open de browserconsole: `[Flag Rush] spelermodel geladen` toont de **animatienamen** en **materiaalnamen**.
3. Wijken de namen af, maak dan `public/models/player.json` aan. Alles is optioneel:

```json
{
  "height": 1.95,
  "rotY": 1.5708,
  "jersey": "shirt|top",
  "shorts": "pants",
  "hipsBone": "hips", "chestBone": "spine2", "handBone": "hand.r",
  "ballOffset": [0, 0, 0],
  "jogSpeed": 4.5, "sprintFrom": 5.6, "sprintSpeed": 8,
  "clips": { "idle": "Idle", "jog": "Jog_Fwd", "sprint": "Sprint_Fwd", "back": "Jog_Bwd",
             "strafeL": "Jog_Left", "strafeR": "Jog_Right", "juke": "Dodge", "spin": "Spin",
             "throw": "Throw", "catch": "Catch", "pull": "Grab", "cheer": "Cheer" }
}
```

Zonder `clips` zoekt het spel zelf op namen (idle, jog/run, sprint, back, strafe, juke, spin, throw, catch, pull, cheer).
Gooien, vangen, flag pull, juke, hesitation, balvasthouden en zijwaarts schuiven worden bovenop het skelet procedureel bijgestuurd (zie `bonePose` in `gltfCharacter.js`) als het model er geen eigen clip voor heeft. Ontbrekende animaties worden opgevangen: sprint/achteruit/zijwaarts vallen terug op jog (achteruit speelt dan omgekeerd).
Kleding (shirt, broek, sokken, schoenen, haar) wordt per hoekpunt gekleurd op basis van het bot dat het zwaarst weegt (`dressGeometry`); zet `"dress": false` in `player.json` om dat uit te zetten. Bij modellen zonder skelet-mesh worden de materialen op naam getint; flags, rugnummer en bal volgen de botten.
Noteer bron en licentie van je model in de tabel hierboven.
## Publiceren op GitHub Pages

De workflow `.github/workflows/deploy.yml` bouwt bij elke push naar `main` en publiceert naar GitHub Pages.
Eenmalig instellen: *Settings > Pages > Build and deployment > Source: GitHub Actions*. `base: './'` in `vite.config.js`
zorgt dat het op elke Pages-URL werkt.

