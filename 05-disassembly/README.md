# Disassembly — recreatie in p5.js

Een interactieve webcam-installatie geïnspireerd op **"Disassembly"** van de studio
Irregular, getoond in de Village Numérique van New Tech Montreal. Het origineel
fragmenteert gezichten van voorbijgangers tot een mozaïek van "data" op een groot
LED-scherm.

## Starten

1. Open deze map in VS Code.
2. Klik met rechts op `index.html` en kies **Open with Live Server**, of klik op
   **Go Live** in de balk onderaan.
3. Geef de browser toegang tot je camera.

Werkt in Safari en Chrome. Het adres moet beginnen met `http://127.0.0.1:5500`,
niet met `file://`, anders krijg je geen camera.

## Bestanden

- `index.html`: laadt p5.js 1.11.1, ml5.js v1 en de sketch.
- `sketch.js`: de installatie.
- `README.md`: dit bestand.

## Gedrag

- **Geen gezicht:** een heel klein, druk raster van zwart-witte tegels met een
  effen rood vierkant als ankerpunt.
- **Gezicht gedetecteerd:** een mozaïek van tegels in verschillende maten, met
  kolommen die afwisselend rechtop en ondersteboven staan, en je gezicht
  ingezoomd en rood gekleurd in het rode vierkant.
- De layout wisselt na een willekeurige wachttijd van 5, 6, 8 of 10 seconden.

## Bediening

| Toets  | Functie                                          |
|--------|--------------------------------------------------|
| SPATIE | "gezicht"-toestand forceren (testen zonder gezicht) |
| R      | nu een nieuwe layout                             |
| L      | LED-textuur aan/uit                              |
| D      | debugstrook met camerapijplijn en face: yes/no   |

## Instellingen

Bovenaan `sketch.js` staan de constanten om mee te spelen, zoals `HOLD_TIMES`
(tijdsloten), `RED_ZOOM`, `RED_RES`, `MAX_DEPTH` (hoe klein tegels worden),
`GAP`, `LED_PITCH`, `FACE_HOLD_MS` en `FACE_LOST_MS`.

## Volgende stappen

- Het rode vierkant het gezicht laten volgen in plaats van het midden van het beeld.
- Op een willekeurige timer wisselen tussen ogen en mond, zoals in het origineel.

---

## Prompt om dit project opnieuw te bouwen

```
Je bent een ervaren creative coder in p5.js. Bouw een interactieve webcam-installatie
in p5.js, geïnspireerd op "Disassembly" van de studio Irregular: een installatie die
gezichten van voorbijgangers fragmenteert tot een mozaïek van "data" op een groot
LED-scherm.

## Technische setup
- p5.js 1.11.1 (via cdnjs) en ml5.js v1 (via unpkg) voor gezichtsdetectie (faceMesh).
- Twee bestanden: index.html en sketch.js. Global mode.
- Ik draai het lokaal via VS Code + Live Server, in Safari en Chrome op een Mac.

## Layout
- Het canvas is opgebouwd uit een raster van vierkante basiseenheden (u),
  6 eenheden hoog. u = zo groot mogelijk binnen het venster; de canvasbreedte is
  altijd een geheel aantal eenheden, zodat alles strak op het raster valt.
- In het midden staat een rood vierkant van 4×4 eenheden, op rij 1 t/m 4.
  Er blijft dus één rij vrij erboven en één eronder.

## Twee toestanden
1. Geen gezicht ("voorbijlopen"):
   - Het hele scherm is een heel klein, uniform, druk raster van zwart-witte tegels.
     Elke tegel toont het volledige camerabeeld. Kolommen wisselen af tussen
     rechtop en ondersteboven.
   - Het rode vierkant is een effen rood "ankerpunt" (zonder camerabeeld).
2. Gezicht gedetecteerd ("stilstaan"):
   - Het rode vierkant toont het camerabeeld: ingezoomd (factor ~1.8), zwart-wit en
     dan rood gekleurd (multiply met rood, daarna screen met donkerrood zodat zwart
     dieprood wordt, niet zwart).
   - Rondom staat een mozaïek van zwart-witte tegels in verschillende maten:
     - Begin met een raster van 1×1-eenheden en reserveer het rode vierkant.
     - Voeg op vrije plekken willekeurig grote 2×2-tegels samen.
     - Laat de overige 1×1-tegels willekeurig opsplitsen in 4, en die eventueel
       nog een keer in 4 (max. 2 niveaus).
     - De stroken direct boven en onder het rode vierkant zijn altijd klein
       (minstens één keer gesplitst).
     - Elke layout krijgt een eigen "stemming": kansen op grote tegels en op
       splitsen worden per layout willekeurig gekozen, dus soms rustig, soms druk.
     - Kolommen wisselen af tussen rechtop en ondersteboven.
     - Grote tegels zoomen soms in (1, 1.4 of 1.9×), kleine tegels nauwelijks.
     - Kleine naad (2px) tussen tegels.

## Timing en gedrag
- De layout wordt opnieuw gegenereerd na een willekeurige wachttijd uit een lijst
  van tijdsloten: [5000, 6000, 8000, 10000] ms. Niet gekoppeld aan beweging.
- Gezichtsdetectie met ml5.faceMesh (maxFaces: 1). Een gezicht moet ~500 ms
  zichtbaar zijn voor het mozaïek verschijnt, en ~1000 ms weg zijn voor het
  terugspringt, zodat het niet flikkert. Bij elke wissel een nieuwe layout.
- Het camerabeeld is gespiegeld.

## Look
- Over alles heen een subtiele LED-schermtextuur: een raster van dunne,
  halfdoorzichtige zwarte lijnen elke 4 px, vooraf getekend in één buffer.

## Bediening
- SPATIE: forceer de "gezicht"-toestand aan/uit (testen zonder gezicht).
- R: nu een nieuwe layout.
- L: LED-textuur aan/uit.
- D: debugstrook met de stappen van de camerapijplijn en "face: yes/no".

## Prestaties
- pixelDensity(1).
- Maak elk frame één kleine grijswaarde-buffer van de camera (vierkant
  bijgesneden, gespiegeld) en laat alle tegels daaruit samplen.
- Teken de kleine tegels van de no-face-toestand niet één voor één: maak één
  tegelpaar (rechtop + ondersteboven), herhaal dat in een rij-buffer en herhaal
  die rij over de hoogte.

## Bekende valkuilen (vermijd deze)
- Geef geen functies of variabelen namen die p5 al gebruikt (zoals split,
  random, scale, text, image). In global mode overschrijft p5 ze stilletjes.
- Gebruik geen video.hide(): Safari kan dan zwarte frames geven. Maak de video
  onzichtbaar met opacity 0 en position absolute.
- Gebruik filter(GRAY, false) (CPU-versie) op buffers, niet de WebGL-filter.
- Teken eerst de hele video in een buffer met de juiste beeldverhouding en snijd
  daaruit bij, in plaats van bronco-ördinaten direct op het video-element te
  gebruiken.
- Laat fouten en een "wachten op camera"-melding groot op het canvas zien,
  zodat het nooit stil op een zwart scherm faalt.
- Als ml5 niet laadt, moet de sketch blijven werken met SPATIE als handmatige
  schakelaar.

## Oplevering
Lever volledige index.html en sketch.js. Zet alle instelbare waarden als
constanten bovenaan (rasterhoogte, grootte rood vierkant, resoluties, zoom,
tijdsloten, splitsdiepte, naad, LED-afstand, gezichtstimings) en geef de code
korte, duidelijke comments.
```
