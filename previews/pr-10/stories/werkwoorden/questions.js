window.QUESTIONS = [
    // Tegenwoordige tijd (pv), inversie, enkelvoud/meervoud
    { sentence: "Ik ........ elke dag naar school.", inf: "fietsen", answer: "fiets", tense: "tegenwoordige tijd" },
    { sentence: "Jij ........ meestal op tijd.", inf: "komen", answer: "komt", tense: "tegenwoordige tijd" },
    { sentence: "Hij ........ zijn huiswerk direct.", inf: "maken", answer: "maakt", tense: "tegenwoordige tijd" },
    { sentence: "Mijn zus ........ vaak om zeven uur.", inf: "slapen", answer: "slaapt", tense: "tegenwoordige tijd (enkelvoud)" },
    { sentence: "Wij ........ altijd samen.", inf: "werken", answer: "werken", tense: "tegenwoordige tijd" },
    { sentence: "Jullie ........ te snel!", inf: "fietsen", answer: "fietsen", tense: "tegenwoordige tijd" },
    { sentence: "Mijn moeder ........ elke dag wel twintig kilometer.", inf: "fietsen", answer: "fietst", tense: "tegenwoordige tijd (enkelvoud)" },
    { sentence: "........ je niet moe van de hele dag gamen?", inf: "worden", answer: "Word", tense: "tegenwoordige tijd (inversie met jij)" },
    { sentence: "........ je broer niet moe van de hele dag gamen?", inf: "worden", answer: "Wordt", tense: "tegenwoordige tijd (inversie, niet jij)" },
    { sentence: "Waar ........ jij morgen heen?", inf: "gaan", answer: "ga", tense: "tegenwoordige tijd (inversie met jij)" },
    { sentence: "........ hij die som al?", inf: "snappen", answer: "Snapt", tense: "tegenwoordige tijd" },
    { sentence: "........ jullie het antwoord?", inf: "weten", answer: "Weten", tense: "tegenwoordige tijd" },

    // d/t in pv
    { sentence: "Hij ........ altijd netjes.", inf: "antwoorden", answer: "antwoordt", tense: "tegenwoordige tijd" },
    { sentence: "Sanne ........ hard in de klas.", inf: "praten", answer: "praat", tense: "tegenwoordige tijd (enkelvoud)" },
    { sentence: "Iedereen ........ op de bus.", inf: "wachten", answer: "wacht", tense: "tegenwoordige tijd" },
    { sentence: "De hond ........ aan de deur.", inf: "krabben", answer: "krabt", tense: "tegenwoordige tijd" },

    // Verleden tijd (ovt), zwakke ww
    { sentence: "Ik ........ langzaam naar huis.", inf: "fietsen", answer: "fietste", tense: "verleden tijd (o.v.t.)" },
    { sentence: "Het ........ vanmorgen.", inf: "misten", answer: "mistte", tense: "verleden tijd (o.v.t.)" },
    { sentence: "Het ........ de hele dag.", inf: "regenen", answer: "regende", tense: "verleden tijd (o.v.t.)" },
    { sentence: "Het onweer ........ los.", inf: "barsten", answer: "barstte", tense: "verleden tijd (o.v.t.)" },
    { sentence: "We ........ ons kapot.", inf: "lachen", answer: "lachten", tense: "verleden tijd (o.v.t.)" },
    { sentence: "De leerlingen ........ geduldig af.", inf: "wachten", answer: "wachtten", tense: "verleden tijd (o.v.t., meervoud)" },
    { sentence: "We ........ het goed.", inf: "bedoelen", answer: "bedoelden", tense: "verleden tijd (o.v.t.)" },
    { sentence: "We ........ in het water.", inf: "belanden", answer: "belandden", tense: "verleden tijd (o.v.t.)" },
    { sentence: "Jij ........ gisteren laat.", inf: "werken", answer: "werkte", tense: "verleden tijd (o.v.t.)" },
    { sentence: "Hij ........ de hele middag.", inf: "spelen", answer: "speelde", tense: "verleden tijd (o.v.t.)" },
    { sentence: "De leraar ........ rustig.", inf: "praten", answer: "praatte", tense: "verleden tijd (o.v.t.)" },

    // Verleden tijd (ovt), sterke/ onregelmatige ww
    { sentence: "Ik ........ nog nooit zo ver.", inf: "lopen", answer: "liep", tense: "verleden tijd (o.v.t., sterk werkwoord)" },
    { sentence: "Gisteren ........ we naar oma.", inf: "gaan", answer: "gingen", tense: "verleden tijd (o.v.t.)" },
    { sentence: "De kinderen ........ het antwoord meteen.", inf: "weten", answer: "wisten", tense: "verleden tijd (o.v.t., meervoud)" },
    { sentence: "Hij ........ de bal heel ver.", inf: "gooien", answer: "gooide", tense: "verleden tijd (o.v.t.)" },
    { sentence: "Wij ........ niets van dat verhaal.", inf: "geloven", answer: "geloofden", tense: "verleden tijd (o.v.t.)" },
    { sentence: "De wind ........ harder dan verwacht.", inf: "waaien", answer: "waaide", tense: "verleden tijd (o.v.t.)" },
    { sentence: "Ik ........ dat boek gisteren uit.", inf: "lezen", answer: "las", tense: "verleden tijd (o.v.t., sterk werkwoord)" },
    { sentence: "De leerlingen ........ de toets goed.", inf: "doen", answer: "deden", tense: "verleden tijd (o.v.t., meervoud)" },

    // Voltooid deelwoord (vtt), losse pv vs vd
    { sentence: "Heb je al in je tas ........?", inf: "kijken", answer: "gekeken", tense: "voltooid deelwoord" },
    { sentence: "Ik heb nog nooit zo ver .........", inf: "lopen", answer: "gelopen", tense: "voltooid deelwoord" },
    { sentence: "Vannacht zijn er twee bomen .........", inf: "omwaaien", answer: "omgewaaid", tense: "voltooid deelwoord" },
    { sentence: "Het dak heeft .........", inf: "lekken", answer: "gelekt", tense: "voltooid deelwoord" },
    { sentence: "De schoonmakers hebben de hele vloer ........", inf: "schrobben", answer: "geschrobd", tense: "voltooid deelwoord" },
    { sentence: "De kinderen hadden alles in hun tas ........", inf: "proppen", answer: "gepropt", tense: "voltooid deelwoord" },
    { sentence: "Hij is gisteren ........ met zijn werk.", inf: "stoppen", answer: "gestopt", tense: "voltooid deelwoord" },
    { sentence: "We hebben de hond .........", inf: "voeren", answer: "gevoerd", tense: "voltooid deelwoord" },
    { sentence: "Ik ben mijn sleutel .........", inf: "vergeten", answer: "vergeten", tense: "voltooid deelwoord" },
    { sentence: "Lieke heeft haar telefoon .........", inf: "vinden", answer: "gevonden", tense: "voltooid deelwoord" },

    // Passief / persoonsvorm vs voltooid deelwoord
    { sentence: "De oorlog ........ het land.", inf: "verscheuren", answer: "verscheurt", tense: "tegenwoordige tijd" },
    { sentence: "Het land wordt ........ door oorlog.", inf: "verscheuren", answer: "verscheurd", tense: "voltooid deelwoord (lijdende vorm)" },

    // Lastige participia / leenwerkwoorden / scheidbare ww
    { sentence: "Moet werkwoordspelling volgens jou worden ........?", inf: "afschaffen", answer: "afgeschaft", tense: "voltooid deelwoord" },
    { sentence: "Die opmerking heeft hem nogal .........", inf: "ergeren", answer: "geërgerd", tense: "voltooid deelwoord" },
    { sentence: "We hebben het plan meteen .........", inf: "uitvoeren", answer: "uitgevoerd", tense: "voltooid deelwoord" },
    { sentence: "Hij heeft de computer .........", inf: "opstarten", answer: "opgestart", tense: "voltooid deelwoord" },
    { sentence: "Mijn vader heeft de lamp .........", inf: "uitdoen", answer: "uitgedaan", tense: "voltooid deelwoord" },
    { sentence: "Ik ben de afspraak helemaal .........", inf: "vergeten", answer: "vergeten", tense: "voltooid deelwoord" },
];
