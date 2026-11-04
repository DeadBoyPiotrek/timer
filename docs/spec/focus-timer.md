# Focus timer

## Zgłoszenie

Minimalistyczny timer do skupienia w małym oknie bez paska przeglądarki. Wygląda jak kafelek minutnika Google: ciemna karta, okrąg z postępem, czas na środku, dwa przyciski pod spodem. Czas wpisujesz ręcznie. Ostatnio wpisany czas jest pamiętany przy następnym uruchomieniu.

Okno zachowuje się jak każde inne okno na pulpicie. Inne okna mogą je przykryć.

## Jak to działa dziś

1. Repo to pusty szablon Node. Skrypt `build` uruchamia tylko `tsc`.
   [package.json:6](../../package.json#L6)
2. Kompilacja celuje w CommonJS bez typów przeglądarki.
   [tsconfig.json:4](../../tsconfig.json#L4)
3. Plik wejściowy wypisuje jedną linię w konsoli.
   [src/index.ts:1](../../src/index.ts#L1)

## Przyczyna

Projekt jest ustawiony pod Node, a timer ma działać w przeglądarce. Trzeba przestawić go na stronę statyczną.

## Pojęcia

- **Vite.** Serwer deweloperski i bundler. Bierze `index.html` z katalogu głównego i buduje statyczny folder `dist`.
- **PWA.** Strona z plikiem manifestu, którą Chrome pozwala zainstalować jako aplikację. Uruchamia się we własnym oknie bez paska adresu.
- **Window Controls Overlay.** Opcja manifestu `display_override`. Usuwa pasek tytułu okna i zostawia tylko systemowe przyciski. Zmienne CSS `env(titlebar-area-*)` mówią, gdzie te przyciski leżą.
- **app-region: drag.** Właściwość CSS, która pozwala przeciągać okno, łapiąc za wskazany element. Przyciski i pole czasu dostają `no-drag`, żeby dało się w nie klikać.
- **Liczenie od momentu końca.** Zapisuję `endAt = Date.now() + czas`. Wyświetlam `endAt - Date.now()`. Przeglądarka spowalnia timery w tle, a ta metoda i tak pokazuje dokładny czas.
- **localStorage.** Pamięć przeglądarki dla danej strony. Przetrwa zamknięcie okna.

## Rozwiązanie

Jedna strona w Vite i czystym TypeScripcie. Ciemna karta wypełnia całe okno. Na środku okrąg w SVG z paskiem postępu i czas. Kliknięcie w czas pozwala wpisać minuty. Enter uruchamia odliczanie. Pod spodem przyciski start lub pauza oraz reset. Wpisane minuty trafiają do `localStorage`. Tytuł okna pokazuje pozostały czas, więc widać go na pasku zadań. Na koniec gra krótki dźwięk generowany przez Web Audio API.

### Odrzucone opcje

- **React lub Next.js.** Jeden ekran nie potrzebuje frameworka.
- **Plik mp3 na koniec.** Web Audio daje dźwięk bez dodatkowego zasobu.
- **Picture-in-Picture.** Okno nie ma być zawsze na wierzchu.
- **Service worker.** Chrome nie wymaga go już do instalacji PWA.

## Zadania

1. Przestawić skrypty na `vite`, `vite build` i `vite preview`.
2. Przestawić tsconfig na ESNext z typami DOM i bez emitowania plików.
3. Dodać `index.html` z kartą, okręgiem, polem czasu i dwoma przyciskami.
4. Napisać logikę timera z wpisywaniem minut, startem, pauzą, resetem i zapisem minut.
5. Dodać style karty z obsługą Window Controls Overlay i przeciągania okna.
6. Dodać manifest i ikonę SVG.

## Jak sprawdzić

1. Uruchamiasz `npm run dev` i otwierasz adres w Chrome.
2. Klikasz w czas, wpisujesz `1` i wciskasz Enter. Po minucie gra dźwięk.
3. Zamykasz kartę i otwierasz ją ponownie. Pole pokazuje `1:00`.
4. Instalujesz stronę ikonką w pasku adresu. Okno ma tylko kartę i przyciski systemowe.

## Pliki

- [package.json:6](../../package.json#L6)
- [tsconfig.json:3](../../tsconfig.json#L3)
- [src/index.ts:1](../../src/index.ts#L1)
- `index.html` jako nowy plik
- `src/style.css` jako nowy plik
- `public/manifest.webmanifest` jako nowy plik
- `public/icon.svg` jako nowy plik

## Do ustalenia

- Vite instalujesz sam poleceniem `npm i -D vite`. Wygeneruje to plik `package-lock.json`.
- Repo nie ma gałęzi `develop` ani żadnego commita. Pracujemy na `main`, czy tworzę `develop` i z niej `feature/<TICKET>/focus-timer`?
- Hosting na Cloudflare Pages lub GitHub Pages robimy osobnym krokiem po działającej wersji lokalnej.
