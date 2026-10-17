// scripts/landing-pages/sv.mjs
// Swedish landing pages, aligned key by key to he.mjs.

export default {
  "shabbat-clock-electric-gate": {
    "label": "Shabbat-timer för elektrisk grind",
    "aboutName": "shabbat-timer",
    "mentionsName": "shabbat",
    "eyebrow": "Schemalagda händelser i WIFIGATE",
    "title": "Shabbat-timer för elektrisk grind, utan att röra något på shabbat",
    "heroLead": "Ställ in i appen i förväg när grinden ska stå öppen, till exempel från innan shabbat börjar till efter att den har gått ut, så upprepas schemat av sig självt varje vecka. På själva shabbat behöver ingen trycka på en fjärrkontroll, öppna en app eller röra en knapp.",
    "highlights": [
      {
        "icon": "clock",
        "title": "Ställ in en gång, så fungerar det varje shabbat",
        "text": "Markera en grön händelse för öppen grind på fredag och på lördag, så upprepas den av sig själv varje vecka. Schemat lagras och körs i grindens egen enhet, inte i någons mobil."
      },
      {
        "icon": "calendar",
        "title": "Även för högtiderna, i förväg",
        "text": "En högtid börjar på kvällen, precis som shabbat, så du lägger till engångshändelser för den i förväg, upp till 90 dagar framåt: på kvällen före högtiden fram till midnatt, och på själva högtidsdagen från midnatt tills högtiden har gått ut. Så kommer rosh hashana, jom kippur, sukkot, simchat tora, pesach och shavuot in i schemat, och varje sådan händelse tas automatiskt bort när datumet har passerat."
      },
      {
        "icon": "gate",
        "title": "Ingen separat shabbat-timer i elcentralen",
        "text": "Det behövs inget extra tidur i elcentralen eller vid grindöppnarens styrenhet, och ingen tekniker behöver komma ut för att ändra tiderna. Schemaläggningen är inbyggd i WIFIGATE, samma system som öppnar grinden från mobilen på vardagar, och utanför de tider du har ställt in fungerar grinden som vanligt."
      }
    ],
    "intro": {
      "title": "Vad är en shabbat-timer för elektrisk grind?",
      "text": "En shabbat-timer för elektrisk grind är ett schema som håller grinden öppen, eller stängd, på fasta tider under shabbat och högtider, så att man kan komma och gå utan att någon manövrerar den. I WIFIGATE är schemat inbyggt i enheten som ansluts till grindens befintliga styrenhet: du ställer in upp till 50 händelser i appen i förväg, i steg om 10 minuter, och enheten kör dem själv, utan internet vid grinden och utan månadsabonnemang. Det finns ingen separat brytare för ”shabbatläge”: schemat ställs in på skärmen för schemalagda händelser i appen."
    },
    "steps": {
      "title": "Så ställer du in en shabbat-timer för elektrisk grind",
      "items": [
        "Vid grinden öppnar systemadministratören skärmen för schemalagda händelser i appen och väljer fredag.",
        "Du väljer grönt för öppen grind, markerar en händelse från den tid då grinden ska öppnas till midnatt (24:00) och sparar.",
        "Du väljer lördag och grönt igen, markerar en händelse från 00:00 till efter att shabbat har gått ut, och sparar. De två händelserna möts vid midnatt, så grinden står öppen utan avbrott, och de upprepas av sig själva varje vecka.",
        "För en högtid lägger du till två engångshändelser, upp till 90 dagar framåt: på kvällen före högtiden från den tid då grinden ska öppnas till midnatt, och på själva högtidsdagen från 00:00 till efter att högtiden har gått ut."
      ],
      "note": "Tiderna ställs in i steg om 10 minuter. Om shabbat går ut efter midnatt där du bor, lägger du även till en händelse på söndag från 00:00."
    },
    "benefitsTitle": "Det här ingår i WIFIGATE:s shabbat-timer för grindöppnare",
    "benefits": [
      {
        "icon": "calendar-clock",
        "title": "Ställ in en gång. Det fungerar varje shabbat.",
        "text": "Markera gröna händelser för ”Öppen grind” på fredag och lördag, så kör grindens enhet dem på egen hand varje vecka.",
        "tags": [
          "Upp till 50 händelser",
          "Steg om 10 minuter"
        ],
        "visual": {
          "type": "schedule",
          "heading": "Öppen grind på shabbat",
          "status": "Varje vecka",
          "rows": [
            {
              "day": "Fredag",
              "range": "16:00–24:00"
            },
            {
              "day": "Lördag",
              "range": "00:00–20:00"
            }
          ]
        }
      },
      {
        "icon": "lock-open",
        "title": "In och ut på shabbat. Utan att röra något.",
        "text": "På shabbat står grinden öppen under de tider du har ställt in, och ingen behöver manövrera den.",
        "tags": [
          "Ingen fjärrkontroll",
          "Ingen mobil",
          "Ingen knapp"
        ]
      },
      {
        "icon": "calendar-check",
        "title": "Högtider planerade i förväg",
        "text": "Lägg till engångshändelser för kvällen före högtiden och för själva högtidsdagen, upp till 90 dagar framåt, och varje händelse tas automatiskt bort när datumet har passerat.",
        "tags": [
          "Upp till 90 dagar",
          "Rosh hashana",
          "Pesach"
        ]
      },
      {
        "icon": "clock",
        "title": "Ändra tiderna i appen. Utan tekniker.",
        "text": "När årstiden skiftar uppdaterar du tiderna på skärmen ”Schemalagda händelser” och sparar.",
        "tags": [
          "Systemadministratör",
          "Vid grinden"
        ]
      },
      {
        "icon": "lock",
        "title": "Lås grinden på fasta tider, till exempel på natten",
        "text": "En röd händelse för ”Stängd grind” håller grinden stängd under de tider du har ställt in, och en grön händelse håller den öppen.",
        "tags": [
          "Röd händelse",
          "Grön händelse"
        ]
      },
      {
        "icon": "smartphone",
        "title": "På vardagar: mobil, fjärrkontroll eller knapp",
        "text": "Utanför de tider du har ställt in fungerar grinden som vanligt och öppnas från mobilen, med fjärrkontrollen eller med knappen.",
        "tags": [
          "Utanför händelserna",
          "Befintliga fjärrkontroller"
        ]
      },
      {
        "icon": "gate",
        "title": "Ansluts till den grind eller bom du redan har",
        "text": "WIFIGATE ansluts till den befintliga styrenheten för grinden eller bommen, så det behövs ingen separat shabbat-timer i elcentralen.",
        "tags": [
          "Elektrisk grind",
          "Parkeringsbom"
        ]
      },
      {
        "icon": "sim-off",
        "title": "Inget SIM, inget internet vid grinden och inget månadsabonnemang",
        "text": "Grinden behöver bara ström, mobilen ansluter direkt till enheten, och du betalar en gång för enheten och installationen.",
        "tags": [
          "Bara ström",
          "Engångsbetalning"
        ]
      }
    ],
    "facts": {
      "title": "WIFIGATE:s shabbat-timer i korthet",
      "rows": [
        {
          "label": "Händelser",
          "value": "Upp till 50 totalt, veckohändelser och engångshändelser"
        },
        {
          "label": "Tidssteg",
          "value": "10 minuter"
        },
        {
          "label": "Högtider",
          "value": "Engångshändelser på kvällen före högtiden och på själva högtidsdagen, upp till 90 dagar framåt"
        },
        {
          "label": "Öppen eller stängd",
          "value": "En grön händelse håller grinden öppen, en röd händelse håller den stängd"
        },
        {
          "label": "Var schemat finns",
          "value": "Lagras och körs i grindens enhet"
        },
        {
          "label": "Vad grinden behöver",
          "value": "Bara ström, inget SIM, ingen router och inget internet"
        },
        {
          "label": "Ändra tiderna",
          "value": "Från appen, vid grinden, utan tekniker"
        },
        {
          "label": "Efter strömavbrott",
          "value": "Schemat finns kvar, och händelserna körs igen när någon mobil ansluter till grinden"
        },
        {
          "label": "Betalning",
          "value": "En gång för enheten och installationen, utan månadsabonnemang"
        }
      ]
    },
    "updatedLabel": "Senast uppdaterad: {date}",
    "faqTitle": "Vanliga frågor om shabbat-timer för elektrisk grind",
    "seoTitle": "Shabbat-timer för elektrisk grind & parkeringsbom | WIFIGATE",
    "seoDescription": "Shabbat-timer för elektrisk grind och parkeringsbom: ställ in shabbat- och högtidstider i appen i förväg, så står grinden öppen utan fjärrkontroll eller knapp.",
    "imageAlt": "Elektrisk grind och parkeringsbom vid infarten till ett bostadsområde före solnedgången",
    "faq": [
      {
        "question": "Behöver någon röra mobilen, fjärrkontrollen eller en knapp på shabbat?",
        "answer": "Nej. Schemat lagras och körs i grindens enhet, så på shabbat behöver ingen öppna en app, trycka på en fjärrkontroll eller röra en knapp. Vad som händer vid strömavbrott förklaras i en separat fråga längre ner."
      },
      {
        "question": "Är det tillåtet att använda en shabbat-timer för elektrisk grind?",
        "answer": "WIFIGATE ger inga halakiska avgöranden och visar inte upp något halakiskt godkännande. Tekniskt sett ställs tiderna in före shabbat, och på själva shabbat körs schemat i enheten utan att någon gör något. I halakiska frågor om din grind, till exempel om grindens sensorer eller om att passera genom den, är det klokt att rådfråga en rabbin."
      },
      {
        "question": "Kan grinden ställas in även för högtider?",
        "answer": "Ja. En högtid börjar på kvällen, precis som shabbat, så du lägger till en engångshändelse på kvällen före högtiden fram till midnatt och en engångshändelse på högtidsdagen från midnatt, upp till 90 dagar framåt. Varje sådan händelse körs bara på sitt eget datum, och de två händelserna möts vid midnatt, så grinden står öppen utan avbrott. En högtid som ligger i anslutning till shabbat byggs upp på samma sätt, dag efter dag. En engångshändelse kan inte överlappa veckohändelsen samma dag, så den täcker bara tider som veckohändelsen inte täcker."
      },
      {
        "question": "Följer grinden själv tiderna för när shabbat börjar?",
        "answer": "Nej. WIFIGATE räknar inte ut tiderna för ljuständning eller för när sabbaten går ut: de tider du ställer in är desamma varje vecka tills du ändrar dem. I Jerusalem flyttas till exempel ljuständningen från omkring 16:00 på vintern till omkring 19:10 på sommaren, så du uppdaterar tiderna när årstiden skiftar, eller ställer i förväg in ett brett tidsfönster som passar hela året."
      },
      {
        "question": "Vad händer vid strömavbrott?",
        "answer": "Schemat lagras i enheten och raderas inte. Enheten har inget klockbatteri, så när strömmen har kommit tillbaka körs inga händelser förrän någon mobil ansluter till grinden i appen och ställer klockan. Fram till dess fungerar grinden som vanligt och hålls inte öppen, även om strömmen gick under shabbat. Om det var strömavbrott före shabbat bör någon ansluta till grinden innan shabbat börjar."
      },
      {
        "question": "Vad händer vid omställningen till sommartid eller vintertid?",
        "answer": "Enheten får tiden, och omställningen till sommar- eller vintertid, från mobilerna som ansluter till den. Tills någon mobil ansluter efter omställningen kan händelserna köras en timme för tidigt eller för sent. I Israel börjar sommartiden tidigt på morgonen en fredag, så den dagen bör någon öppna grinden från appen före shabbat."
      },
      {
        "question": "Kan grinden öppnas från appen under en schemalagd händelse?",
        "answer": "Nej. Under en händelse avvisas öppningskommandon från appen och grinden stannar i det läge som har ställts in. Teknikerknappen på enheten åsidosätter händelsen, till exempel i en nödsituation. Utanför händelserna fungerar grinden som vanligt."
      },
      {
        "question": "Kan grinden även låsas på fasta tider, till exempel på natten?",
        "answer": "Ja. En röd händelse för stängd grind håller grinden stängd under de tider du har ställt in, och en grön händelse håller den öppen. Händelserna överlappar inte varandra, så du delar in dygnet i öppna och stängda tider, med upp till 50 händelser totalt."
      },
      {
        "question": "Kan den installeras på den grind eller bom jag redan har?",
        "answer": "WIFIGATE ansluts till styrenheten för den grind eller bom du redan har, så det behövs inget separat tidur i elcentralen, och utanför händelserna fungerar grinden som förut med fjärrkontrollerna och knappen. För att kontrollera att det passar din styrenhet kan du skicka uppgifter om grinden till oss på WhatsApp."
      },
      {
        "question": "Behöver grinden SIM, router eller internet?",
        "answer": "Nej. Schemat lagras och körs i grindens enhet utan internet, utan SIM-kort och utan router. Mobilen ansluter direkt till enheten, så du ställer in händelserna när du är vid grinden."
      },
      {
        "question": "För vem passar en shabbat-timer för grinden?",
        "answer": "Flerbostadshus och bostadsrättsföreningar, förvaltningsbolag, bostadsområden och samhällen med elektrisk grind eller parkeringsbom, synagogor och institutioner, och alla fastigheter där grinden vid uppfarten behöver stå öppen under shabbat och högtider. I ett flerbostadshus är det klokt att komma överens om tiderna med de boende eller styrelsen."
      },
      {
        "question": "Vad kostar det? Finns det en månadsavgift?",
        "answer": "Du betalar en gång för WIFIGATE-enheten och installationen, utan månadsabonnemang och utan autogiro, och schemalagda händelser ingår. Skicka ett meddelande till oss på WhatsApp för en offert."
      }
    ]
  }
};
