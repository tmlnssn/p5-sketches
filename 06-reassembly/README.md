# Reassembly

Een interactieve p5.js-sketch waarin je gezicht uit elkaar valt en je het zelf weer in elkaar zet. Een interactieve variant op de installatie *Disassembly* van Irregular.

De webcam trackt je gezicht en knipt het op in vier losse vakjes met live beeld: twee ogen, de neus en de mond. Die vakjes zweven rustig over het scherm, elk met een willekeurig formaat (à la Picasso). Met de muis sleep je ze weer naar elkaar toe. Laat je ze liggen, dan drijven ze na een paar seconden weer weg.

## Starten

1. Zet `index.html`, `sketch.js` en `style.css` samen in één map.
2. Open de map in VS Code en start **Live Server** op `index.html`.
3. Geef Safari toestemming voor de camera.

Werkt de camera niet? Controleer of de pagina via `localhost` of `127.0.0.1` opent. Safari geeft alleen via localhost of HTTPS toegang tot de webcam.

## Bediening

| Actie | Wat het doet |
|---|---|
| Klik en sleep | Een vakje verplaatsen |
| Loslaten | Vakje blijft liggen, en drijft na 8 seconden weer weg |
| Wegkijken / uit beeld | Vakjes tonen TV-ruis en gaan weer zweven |
| Terug in beeld | Nieuwe willekeurige formaten, vakjes verspreiden zich |
| Spatiebalk | Stijl wisselen: zwart-wit → pixel → ASCII |

## Instellingen

Bovenaan `sketch.js` staat een `SETTINGS`-object. De belangrijkste waarden:

| Instelling | Standaard | Wat het doet |
|---|---|---|
| `MIN_SIZE` / `MAX_SIZE` | 130 / 340 | Bereik van de vakjesgrootte (px) |
| `FLOAT_SPEED` | 0.85 | Snelheid van het zweven |
| `REST_TIME` | 8000 | Hoe lang een neergelegd vakje blijft liggen (ms) |
| `DRIFT_RAMP` | 0.012 | Hoe snel een vakje daarna weer op gang komt |
| `CROP_PADDING` | 0.6 | Ruimte rond elk gezichtsdeel in de uitsnede |
| `PIXEL_SIZE` | 6 | Grootte van de pixels in pixelstijl |
| `ASCII_CELL` | 11 | Grootte van de tekens in ASCII-stijl |
| `CONTRAST` | 1.4 | Contrast van het zwart-witbeeld |

## Techniek

- p5.js 1.11 en ml5.js v1 (`ml5.faceMesh`), beide via CDN
- Gezichtsdelen worden bepaald met MediaPipe FaceMesh-keypoints
- Elk vakje heeft een eigen interne buffer; daaruit worden de drie stijlen getekend
- Pixelstijl tekent als één scherp opgeschaald beeldje, zodat kleine pixels soepel blijven

## Ideeën voor een volgende fase

- Rechtsonder een vlak met willekeurige ASCII-tekstregels, puur grafisch
- Oren toevoegen (geschat vanaf de rand van het gezicht)

---

## De prompt

Dit is de prompt waarmee het project is gebouwd, bijgewerkt naar de huidige versie.

```
Bouw een interactieve p5.js-sketch: een "uit elkaar gehaald gezicht" dat de gebruiker zelf weer in elkaar kan puzzelen. Geïnspireerd op de installatie "Disassembly" van Irregular, maar dan met interactie.

## Concept
De webcam trackt het gezicht van één persoon. Elk gezichtsonderdeel krijgt een eigen los vakje met LIVE webcambeeld van alleen dat onderdeel. De vakjes zweven los van elkaar over het canvas. De gebruiker kan ze met de muis verslepen en zo weer een (Picasso-achtig) gezicht bouwen.

## Techniek
- p5.js + ml5.js (versie 1, ml5.faceMesh) voor face tracking, beide via CDN
- Losse bestanden: index.html, sketch.js, style.css
- Draait lokaal via VS Code Live Server en moet werken in Safari op een Mac
- Fullscreen canvas (windowWidth x windowHeight), past zich aan bij windowResized
- Eén gezicht tegelijk (maxFaces: 1), webcambeeld gespiegeld
- De webcamvideo zelf is niet zichtbaar; alleen de vakjes zijn te zien
- Geen extra frameworks, geen UI-knoppen, geen tekst in beeld

## Gezichtsonderdelen (4 vakjes)
Linkeroog, rechteroog, neus, mond.
- Bepaal elk onderdeel via de juiste FaceMesh-keypoints
- Bereken per onderdeel een vierkante uitsnede rond het middelpunt, met wat marge eromheen
- Maak de uitsnede-positie en -grootte vloeiend (lerp/smoothing), zodat het beeld niet trilt
- Elk vakje toont live de uitsnede uit het camerabeeld, geschaald naar de grootte van het vakje

## Formaat
- Elk vakje is vierkant met een willekeurige grootte (tussen ca. 130 en 340 px, schaal mee met de schermgrootte)
- Ook de twee ogen hebben onderling verschillende formaten: bewust uit proportie, à la Picasso
- Bij elk NIEUW gezicht (na een periode zonder gezicht) krijgen alle vakjes nieuwe willekeurige formaten

## Beweging
- Zodra er een gezicht in beeld komt, verspreiden de vakjes zich willekeurig over het canvas
- Ze zweven rustig rond (organisch, met Perlin noise) en stuiteren zacht tegen de randen. Rustig, niet chaotisch, maar wel zo ver uit elkaar dat je moet zoeken wat waar hoort.

## Interactie (muis)
- Klik en sleep een vakje; het vakje bovenaan wordt gepakt en komt naar voren
- Losgelaten vakjes blijven liggen waar je ze neerlegt
- Er zijn geen doelposities en geen snapping: de opstelling is helemaal vrij
- Een neergelegd vakje gaat weer vanzelf zweven:
  1. na een aantal seconden (instelbaar, standaard 8 sec), OF
  2. zodra het gezicht uit beeld is / de tracking wegvalt
- Laat dat wegdrijven vlot maar geleidelijk op gang komen, niet abrupt

## Geen gezicht
- Als er langer dan ca. 0,5 sec geen gezicht wordt gedetecteerd: alle vakjes tonen TV-ruis (static) in plaats van camerabeeld, en zweven vrij rond
- Komt er een gezicht terug: nieuwe willekeurige formaten, vakjes verspreiden zich opnieuw

## Visuele stijl
- Zwarte achtergrond, vakjes met een dunne witte rand
- De spatiebalk wisselt in een loop tussen drie stijlen, voor alle vakjes tegelijk:
  1. Zwart-wit: grijswaarden camerabeeld met wat extra contrast
  2. Pixel: kleine pixels (ca. 6 px), een paar grijstinten, zodat de gezichtsdelen goed herkenbaar blijven
  3. ASCII: het beeld opgebouwd uit tekens op basis van helderheid, wit monospace op zwart
- De TV-ruis volgt ook de actieve stijl (gewone ruis, pixelruis of ASCII-ruis)

## Code
- Structureer het netjes: een class FacePart (positie, snelheid, grootte, staat: zwevend / gesleept / liggend, timer) en aparte functies per stijl
- Zet instelbare waarden bovenaan als constanten (snelheid, min/max grootte, wachttijd voor wegdrijven, pixelgrootte, ASCII-tekenset)
- Let op performance: de ASCII- en pixelweergave moeten soepel blijven draaien
- Geef complete bestanden, geen losse snippets, met korte uitleg per onderdeel

## Werkwijze
Bouw het stap voor stap en zorg dat elke stap werkt voordat je verdergaat:
1. Webcam + faceMesh werkend, 4 live uitsneden in vaste vakjes
2. Willekeurige formaten + rustig zweven en stuiteren
3. Slepen, neerleggen en weer wegdrijven (timer + gezicht weg)
4. TV-ruis bij geen gezicht
5. Stijlwissel met de spatiebalk (zwart-wit, pixel, ASCII)
```
