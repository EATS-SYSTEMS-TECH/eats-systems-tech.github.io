// Site-wide wording alignment for the homepage navigation and section titles.
(function () {
  if (typeof translations === "undefined") {
    return;
  }

  const copy = {
    en: {
      navFeatures: "Features",
      whereLabel: "Use Cases",
      featuresTitle: "WIFIGATE: The Winning Approach",
      actionTitle: "One Platform. Every Access Point.",
      actionSubtitle: "WIFIGATE makes smart access simple for residential buildings, businesses and shops, hospitality properties, private homes, office buildings, and sports facilities. Manage roller shutters, electric gates, parking barriers, garage doors, private parking access, entry doors, and magnetic locks through one secure platform built for properties worldwide.",
    },
    he: {
      navFeatures: "יכולות",
      whereLabel: "שימושים",
      featuresTitle: "WIFIGATE השיטה המנצחת",
      actionTitle: "פלטפורמה אחת. כל נקודת גישה.",
      actionSubtitle: "WIFIGATE הופכת את הגישה החכמה לפשוטה עבור בנייני מגורים, עסקים וחנויות, נכסי אירוח, בתים פרטיים, בנייני משרדים ומתקני ספורט. נהלו תריסי גלילה, שערים חשמליים, מחסומי חניה, דלתות מוסך, גישה לחניה פרטית, דלתות כניסה ומנעולים מגנטיים באמצעות פלטפורמה מאובטחת אחת, שנבנתה עבור נכסים ברחבי העולם.",
    },
    es: {
      navFeatures: "Funciones",
      whereLabel: "Casos de uso",
      featuresTitle: "WIFIGATE: el método ganador",
      actionTitle: "Una plataforma. Todos los puntos de acceso.",
      actionSubtitle: "WIFIGATE simplifica el acceso inteligente para edificios residenciales, empresas y comercios, alojamientos turísticos, viviendas particulares, edificios de oficinas e instalaciones deportivas. Gestiona persianas enrollables, portones eléctricos, barreras de estacionamiento, puertas de garaje, accesos a estacionamientos privados, puertas de entrada y cerraduras magnéticas mediante una única plataforma segura, diseñada para propiedades de todo el mundo.",
    },
    fr: {
      navFeatures: "Fonctionnalités",
      whereLabel: "Cas d’usage",
      featuresTitle: "WIFIGATE : la méthode gagnante",
      actionTitle: "Une plateforme. Tous les points d’accès.",
      actionSubtitle: "WIFIGATE simplifie l’accès intelligent pour les immeubles résidentiels, les entreprises et les commerces, les établissements d’hébergement, les maisons individuelles, les immeubles de bureaux et les installations sportives. Gérez les volets roulants, les portails électriques, les barrières de parking, les portes de garage, l’accès aux parkings privés, les portes d’entrée et les serrures magnétiques via une plateforme sécurisée unique conçue pour les propriétés du monde entier.",
    },
    de: {
      navFeatures: "Funktionen",
      whereLabel: "Anwendungsbereiche",
      featuresTitle: "WIFIGATE: die überzeugende Lösung",
      actionTitle: "Eine Plattform. Jeder Zugangspunkt.",
      actionSubtitle: "WIFIGATE macht intelligenten Zugang einfach für Wohngebäude, Unternehmen und Geschäfte, Beherbergungsbetriebe, Privathäuser, Bürogebäude und Sportanlagen. Verwalten Sie Rollläden, elektrische Tore, Parkschranken, Garagentore, Zufahrten zu Privatparkplätzen, Eingangstüren und Magnetschlösser über eine sichere Plattform, die für Immobilien weltweit entwickelt wurde.",
    },
    nl: {
      navFeatures: "Functies",
      whereLabel: "Toepassingen",
      featuresTitle: "WIFIGATE: de winnende aanpak",
      actionTitle: "Eén platform. Elk toegangspunt.",
      actionSubtitle: "WIFIGATE maakt slimme toegang eenvoudig voor woongebouwen, bedrijven en winkels, verblijfsaccommodaties, particuliere woningen, kantoorgebouwen en sportaccommodaties. Beheer rolluiken, elektrische poorten, parkeerbomen, garagedeuren, toegang tot privéparkeerplaatsen, toegangsdeuren en magnetische sloten via één beveiligd platform dat is ontwikkeld voor locaties wereldwijd.",
    },
    it: {
      navFeatures: "Funzionalità",
      whereLabel: "Casi d’uso",
      featuresTitle: "WIFIGATE: il metodo vincente",
      actionTitle: "Un’unica piattaforma. Ogni punto di accesso.",
      actionSubtitle: "WIFIGATE semplifica l’accesso intelligente per edifici residenziali, attività commerciali e negozi, strutture ricettive, abitazioni private, edifici per uffici e impianti sportivi. Gestisci serrande avvolgibili, cancelli elettrici, barriere per parcheggi, porte da garage, accessi a parcheggi privati, porte d’ingresso e serrature magnetiche tramite un’unica piattaforma sicura, progettata per strutture in tutto il mondo.",
    },
    pt: {
      navFeatures: "Funcionalidades",
      whereLabel: "Casos de utilização",
      featuresTitle: "WIFIGATE: a solução vencedora",
      actionTitle: "Uma plataforma. Todos os pontos de acesso.",
      actionSubtitle: "A WIFIGATE simplifica o acesso inteligente em edifícios residenciais, empresas e lojas, propriedades de alojamento, moradias particulares, edifícios de escritórios e instalações desportivas. Faça a gestão de estores de enrolar, portões elétricos, barreiras de estacionamento, portas de garagem, acessos a estacionamento privado, portas de entrada e fechaduras magnéticas através de uma única plataforma segura, concebida para propriedades em todo o mundo.",
    },
    pl: {
      navFeatures: "Funkcje",
      whereLabel: "Zastosowania",
      featuresTitle: "WIFIGATE: zwycięska metoda",
      actionTitle: "Jedna platforma. Każdy punkt dostępu.",
      actionSubtitle: "WIFIGATE upraszcza inteligentny dostęp w budynkach mieszkalnych, firmach i sklepach, obiektach noclegowych, domach prywatnych, biurowcach i obiektach sportowych. Zarządzaj roletami, bramami elektrycznymi, szlabanami parkingowymi, bramami garażowymi, dostępem do prywatnych parkingów, drzwiami wejściowymi i zamkami magnetycznymi za pomocą jednej bezpiecznej platformy stworzonej dla obiektów na całym świecie.",
    },
    no: {
      navFeatures: "Funksjoner",
      whereLabel: "Bruksområder",
      featuresTitle: "WIFIGATE: den vinnende løsningen",
      actionTitle: "Én plattform. Hvert tilgangspunkt.",
      actionSubtitle: "WIFIGATE gjør smart adgang enkelt for boligbygg, bedrifter og butikker, overnattingssteder, private hjem, kontorbygg og idrettsanlegg. Administrer rullesjalusier, elektriske porter, parkeringsbommer, garasjeporter, adgang til privat parkering, inngangsdører og magnetlåser gjennom én sikker plattform utviklet for eiendommer over hele verden.",
    },
    cs: {
      navFeatures: "Funkce",
      whereLabel: "Možnosti využití",
      featuresTitle: "WIFIGATE: vítězný přístup",
      actionTitle: "Jedna platforma. Každý přístupový bod.",
      actionSubtitle: "WIFIGATE zjednodušuje chytrý přístup pro bytové domy, firmy a obchody, ubytovací zařízení, soukromé domy, kancelářské budovy a sportovní areály. Spravujte rolety, elektrické brány, parkovací závory, garážová vrata, přístup na soukromá parkoviště, vstupní dveře a magnetické zámky prostřednictvím jedné zabezpečené platformy vytvořené pro nemovitosti po celém světě.",
    },
    ru: {
      navFeatures: "Возможности",
      whereLabel: "Варианты использования",
      featuresTitle: "WIFIGATE: выигрышный подход",
      actionTitle: "Одна платформа. Каждая точка доступа.",
      actionSubtitle: "WIFIGATE упрощает умный доступ для жилых домов, компаний и магазинов, объектов размещения, частных домов, офисных зданий и спортивных объектов. Управляйте рольставнями, электрическими воротами, парковочными шлагбаумами, гаражными воротами, доступом на частные парковки, входными дверями и магнитными замками с помощью единой защищённой платформы, созданной для объектов по всему миру.",
    },
    uk: {
      navFeatures: "Можливості",
      whereLabel: "Варіанти використання",
      featuresTitle: "WIFIGATE: переможний підхід",
      actionTitle: "Одна платформа. Кожна точка доступу.",
      actionSubtitle: "WIFIGATE спрощує розумний доступ для житлових будинків, підприємств і магазинів, об’єктів гостинності, приватних будинків, офісних будівель і спортивних об’єктів. Керуйте ролетами, електричними воротами, паркувальними шлагбаумами, гаражними воротами, доступом до приватних паркінгів, вхідними дверима та магнітними замками через єдину захищену платформу, створену для об’єктів у всьому світі.",
    },
    tr: {
      navFeatures: "Özellikler",
      whereLabel: "Kullanım alanları",
      featuresTitle: "WIFIGATE: kazandıran yöntem",
      actionTitle: "Tek Platform. Her Erişim Noktası.",
      actionSubtitle: "WIFIGATE; konut binaları, işletmeler ve mağazalar, konaklama tesisleri, müstakil evler, ofis binaları ve spor tesisleri için akıllı erişimi kolaylaştırır. Kepenkleri, elektrikli kapıları, otopark bariyerlerini, garaj kapılarını, özel otopark erişimini, giriş kapılarını ve manyetik kilitleri dünya genelindeki mülkler için geliştirilen tek bir güvenli platform üzerinden yönetin.",
    },
    ar: {
      navFeatures: "الميزات",
      whereLabel: "الاستخدامات",
      featuresTitle: "WIFIGATE: الطريقة الرابحة",
      actionTitle: "منصة واحدة. كل نقطة وصول.",
      actionSubtitle: "تجعل WIFIGATE الوصول الذكي بسيطًا للمباني السكنية والشركات والمتاجر ومنشآت الضيافة والمنازل الخاصة ومباني المكاتب والمنشآت الرياضية. أدر الستائر الدوارة والبوابات الكهربائية وحواجز مواقف السيارات وأبواب المرائب والوصول إلى مواقف السيارات الخاصة وأبواب المداخل والأقفال المغناطيسية من خلال منصة آمنة واحدة مصممة للعقارات حول العالم.",
    },
    hi: {
      navFeatures: "विशेषताएँ",
      whereLabel: "उपयोग के क्षेत्र",
      featuresTitle: "WIFIGATE: जीतने वाला तरीका",
      actionTitle: "एक प्लेटफ़ॉर्म। हर एक्सेस पॉइंट।",
      actionSubtitle: "WIFIGATE आवासीय इमारतों, व्यवसायों और दुकानों, आतिथ्य संपत्तियों, निजी घरों, कार्यालय भवनों और खेल सुविधाओं के लिए स्मार्ट एक्सेस को सरल बनाता है। दुनिया भर की संपत्तियों के लिए बनाए गए एक सुरक्षित प्लेटफ़ॉर्म से रोलर शटर, इलेक्ट्रिक गेट, पार्किंग बैरियर, गैराज दरवाज़े, निजी पार्किंग एक्सेस, प्रवेश द्वार और मैग्नेटिक लॉक प्रबंधित करें।",
    },
    bn: {
      navFeatures: "ফিচারসমূহ",
      whereLabel: "ব্যবহারের ক্ষেত্র",
      featuresTitle: "WIFIGATE: সেরা পদ্ধতি",
      actionTitle: "একটি প্ল্যাটফর্ম। প্রতিটি অ্যাক্সেস পয়েন্ট।",
      actionSubtitle: "WIFIGATE আবাসিক ভবন, ব্যবসা ও দোকান, আতিথেয়তা সম্পত্তি, ব্যক্তিগত বাড়ি, অফিস ভবন এবং ক্রীড়া সুবিধার জন্য স্মার্ট অ্যাক্সেস সহজ করে। বিশ্বজুড়ে সম্পত্তির জন্য তৈরি একটি নিরাপদ প্ল্যাটফর্মের মাধ্যমে রোলার শাটার, বৈদ্যুতিক গেট, পার্কিং ব্যারিয়ার, গ্যারেজ দরজা, ব্যক্তিগত পার্কিং অ্যাক্সেস, প্রবেশদ্বার এবং ম্যাগনেটিক লক পরিচালনা করুন।",
    },
    mr: {
      navFeatures: "वैशिष्ट्ये",
      whereLabel: "वापराचे क्षेत्र",
      featuresTitle: "WIFIGATE: विजयी पद्धत",
      actionTitle: "एक प्लॅटफॉर्म. प्रत्येक ॲक्सेस पॉइंट.",
      actionSubtitle: "WIFIGATE निवासी इमारती, व्यवसाय व दुकाने, आतिथ्य मालमत्ता, खाजगी घरे, कार्यालयीन इमारती आणि क्रीडा सुविधांसाठी स्मार्ट ॲक्सेस सोपा करते. जगभरातील मालमत्तांसाठी तयार केलेल्या एका सुरक्षित प्लॅटफॉर्मद्वारे रोलर शटर, इलेक्ट्रिक गेट, पार्किंग बॅरिअर, गॅरेजचे दरवाजे, खाजगी पार्किंग ॲक्सेस, प्रवेशद्वारे आणि मॅग्नेटिक लॉक व्यवस्थापित करा.",
    },
    te: {
      navFeatures: "ఫీచర్లు",
      whereLabel: "వినియోగాలు",
      featuresTitle: "WIFIGATE: విజయవంతమైన విధానం",
      actionTitle: "ఒకే ప్లాట్‌ఫామ్. ప్రతి యాక్సెస్ పాయింట్.",
      actionSubtitle: "WIFIGATE నివాస భవనాలు, వ్యాపారాలు మరియు దుకాణాలు, ఆతిథ్య ప్రాపర్టీలు, ప్రైవేట్ ఇళ్లు, కార్యాలయ భవనాలు మరియు క్రీడా సదుపాయాల కోసం స్మార్ట్ యాక్సెస్‌ను సులభతరం చేస్తుంది. ప్రపంచవ్యాప్తంగా ఉన్న ప్రాపర్టీల కోసం రూపొందించిన ఒక సురక్షిత ప్లాట్‌ఫామ్ ద్వారా రోలర్ షట్టర్లు, ఎలక్ట్రిక్ గేట్లు, పార్కింగ్ బ్యారియర్లు, గ్యారేజ్ తలుపులు, ప్రైవేట్ పార్కింగ్ యాక్సెస్, ప్రవేశ ద్వారాలు మరియు మాగ్నెటిక్ లాక్‌లను నిర్వహించండి.",
    },
    "zh-Hans": {
      navFeatures: "功能",
      whereLabel: "应用场景",
      featuresTitle: "WIFIGATE：制胜方案",
      actionTitle: "一个平台。每个出入口。",
      actionSubtitle: "WIFIGATE 让住宅楼、企业和商铺、住宿物业、私人住宅、办公楼及体育设施的智能出入管理更简单。通过一个面向全球物业打造的安全平台，管理卷帘门、电动门、停车道闸、车库门、私人停车区出入、入口门和磁力锁。",
    },
    "zh-Hant": {
      navFeatures: "功能",
      whereLabel: "應用場景",
      featuresTitle: "WIFIGATE：制勝方案",
      actionTitle: "一個平台。每個出入口。",
      actionSubtitle: "WIFIGATE 讓住宅大樓、企業與商店、住宿物業、私人住宅、辦公大樓及運動設施的智慧進出管理更簡單。透過一個為全球物業打造的安全平台，管理捲門、電動門、停車柵欄、車庫門、私人停車區進出、入口門和磁力鎖。",
    },
    ja: {
      navFeatures: "機能",
      whereLabel: "利用シーン",
      featuresTitle: "WIFIGATE：勝てる方法",
      actionTitle: "ひとつのプラットフォーム。すべてのアクセスポイント。",
      actionSubtitle: "WIFIGATEは、集合住宅、企業や店舗、宿泊施設、戸建て住宅、オフィスビル、スポーツ施設のスマートアクセスをシンプルにします。世界中の施設向けに設計された安全なひとつのプラットフォームで、電動シャッター、電動ゲート、駐車場バー、ガレージドア、専用駐車場へのアクセス、エントランスドア、電磁ロックを管理できます。",
    },
    ko: {
      navFeatures: "기능",
      whereLabel: "활용 분야",
      featuresTitle: "WIFIGATE: 승리하는 방법",
      actionTitle: "하나의 플랫폼. 모든 출입 지점.",
      actionSubtitle: "WIFIGATE는 공동주택, 기업과 매장, 숙박 시설, 개인 주택, 오피스 빌딩, 스포츠 시설의 스마트 출입 관리를 간편하게 만듭니다. 전 세계 시설을 위해 설계된 하나의 안전한 플랫폼으로 롤러 셔터, 전동 게이트, 주차 차단기, 차고문, 전용 주차장 출입, 출입문, 마그네틱 락을 관리하세요.",
    },
    da: {
      navFeatures: "Funktioner",
      whereLabel: "Anvendelsesområder",
      featuresTitle: "WIFIGATE: den vindende løsning",
      actionTitle: "Én platform. Hvert adgangspunkt.",
      actionSubtitle: "WIFIGATE gør intelligent adgang enkel for boligbyggeri, virksomheder og butikker, overnatningssteder, private hjem, kontorbygninger og sportsfaciliteter. Administrer rulleporte, elektriske porte, parkeringsbomme, garageporte, adgang til privat parkering, indgangsdøre og magnetlåse via én sikker platform, der er udviklet til ejendomme over hele verden.",
    },
    sv: {
      navFeatures: "Funktioner",
      whereLabel: "Användningsområden",
      featuresTitle: "WIFIGATE: den vinnande metoden",
      actionTitle: "En plattform. Varje åtkomstpunkt.",
      actionSubtitle: "WIFIGATE gör smart åtkomst enkel för bostadshus, företag och butiker, boendeanläggningar, privata hem, kontorsbyggnader och idrottsanläggningar. Hantera jalusier, elektriska grindar, parkeringsbommar, garageportar, åtkomst till privata parkeringar, entrédörrar och magnetlås via en säker plattform som är utvecklad för fastigheter över hela världen.",
    },
    hu: {
      navFeatures: "Funkciók",
      whereLabel: "Felhasználási területek",
      featuresTitle: "WIFIGATE: a győztes megoldás",
      actionTitle: "Egy platform. Minden hozzáférési pont.",
      actionSubtitle: "A WIFIGATE egyszerűvé teszi az intelligens beléptetést a lakóépületek, vállalkozások és üzletek, szálláshelyek, magánotthonok, irodaépületek és sportlétesítmények számára. Kezelje a redőnyöket, elektromos kapukat, parkolósorompókat, garázskapukat, magánparkolókhoz való hozzáférést, bejárati ajtókat és mágneszárakat egyetlen biztonságos, világszerte található ingatlanokhoz fejlesztett platformon.",
    },
    el: {
      navFeatures: "Λειτουργίες",
      whereLabel: "Περιπτώσεις χρήσης",
      featuresTitle: "WIFIGATE: η νικηφόρα μέθοδος",
      actionTitle: "Μία πλατφόρμα. Κάθε σημείο πρόσβασης.",
      actionSubtitle: "Το WIFIGATE απλοποιεί την έξυπνη πρόσβαση για κτίρια κατοικιών, επιχειρήσεις και καταστήματα, καταλύματα φιλοξενίας, ιδιωτικές κατοικίες, κτίρια γραφείων και αθλητικές εγκαταστάσεις. Διαχειριστείτε ρολά ασφαλείας, ηλεκτρικές πύλες, μπάρες στάθμευσης, γκαραζόπορτες, πρόσβαση σε ιδιωτικούς χώρους στάθμευσης, πόρτες εισόδου και μαγνητικές κλειδαριές μέσω μίας ασφαλούς πλατφόρμας σχεδιασμένης για ακίνητα σε όλο τον κόσμο.",
    },
    ro: {
      navFeatures: "Funcționalități",
      whereLabel: "Cazuri de utilizare",
      featuresTitle: "WIFIGATE: metoda câștigătoare",
      actionTitle: "O platformă. Fiecare punct de acces.",
      actionSubtitle: "WIFIGATE simplifică accesul inteligent pentru clădiri rezidențiale, companii și magazine, unități de cazare, locuințe private, clădiri de birouri și facilități sportive. Gestionați rulouri, porți electrice, bariere de parcare, uși de garaj, accesul la parcări private, uși de intrare și încuietori magnetice printr-o singură platformă securizată, concepută pentru proprietăți din întreaga lume.",
    },
    hr: {
      navFeatures: "Značajke",
      whereLabel: "Primjene",
      featuresTitle: "WIFIGATE: pobjednički pristup",
      actionTitle: "Jedna platforma. Svaka pristupna točka.",
      actionSubtitle: "WIFIGATE pojednostavljuje pametan pristup stambenim zgradama, tvrtkama i trgovinama, smještajnim objektima, privatnim kućama, uredskim zgradama i sportskim objektima. Upravljajte roletama, električnim vratima, parkirnim rampama, garažnim vratima, pristupom privatnim parkiralištima, ulaznim vratima i magnetskim bravama putem jedne sigurne platforme razvijene za objekte diljem svijeta.",
    },
    fi: {
      navFeatures: "Ominaisuudet",
      whereLabel: "Käyttökohteet",
      featuresTitle: "WIFIGATE: voittava ratkaisu",
      actionTitle: "Yksi alusta. Jokainen kulkupiste.",
      actionSubtitle: "WIFIGATE tekee älykkäästä kulunhallinnasta helppoa asuinrakennuksissa, yrityksissä ja liikkeissä, majoituskohteissa, yksityiskodeissa, toimistorakennuksissa ja urheilutiloissa. Hallitse rullaovia, sähköportteja, pysäköintipuomeja, autotallin ovia, yksityisten pysäköintialueiden kulkua, sisäänkäyntiovien käyttöä ja magneettilukkoja yhdellä turvallisella alustalla, joka on suunniteltu kiinteistöille kaikkialla maailmassa.",
    },
    bg: {
      navFeatures: "Функции",
      whereLabel: "Приложения",
      featuresTitle: "WIFIGATE: печелившият подход",
      actionTitle: "Една платформа. Всяка точка за достъп.",
      actionSubtitle: "WIFIGATE улеснява интелигентния достъп за жилищни сгради, фирми и магазини, места за настаняване, частни домове, офис сгради и спортни съоръжения. Управлявайте ролетни щори, електрически портали, паркинг бариери, гаражни врати, достъп до частни паркинги, входни врати и магнитни брави чрез една сигурна платформа, създадена за имоти по целия свят.",
    },
    sr: {
      navFeatures: "Funkcije",
      whereLabel: "Primene",
      featuresTitle: "WIFIGATE: pobednički pristup",
      actionTitle: "Jedna platforma. Svaka pristupna tačka.",
      actionSubtitle: "WIFIGATE pojednostavljuje pametan pristup stambenim zgradama, preduzećima i prodavnicama, smeštajnim objektima, privatnim kućama, poslovnim zgradama i sportskim objektima. Upravljajte roletnama, električnim kapijama, parking rampama, garažnim vratima, pristupom privatnim parkinzima, ulaznim vratima i magnetnim bravama preko jedne bezbedne platforme razvijene za objekte širom sveta.",
    },
    sk: {
      navFeatures: "Funkcie",
      whereLabel: "Možnosti využitia",
      featuresTitle: "WIFIGATE: víťazný prístup",
      actionTitle: "Jedna platforma. Každý prístupový bod.",
      actionSubtitle: "WIFIGATE zjednodušuje inteligentný prístup pre bytové domy, firmy a obchody, ubytovacie zariadenia, súkromné domy, kancelárske budovy a športové zariadenia. Spravujte rolety, elektrické brány, parkovacie rampy, garážové brány, prístup na súkromné parkoviská, vstupné dvere a magnetické zámky prostredníctvom jednej zabezpečenej platformy vytvorenej pre nehnuteľnosti po celom svete.",
    },
    sl: {
      navFeatures: "Funkcije",
      whereLabel: "Primeri uporabe",
      featuresTitle: "WIFIGATE: zmagovalni pristop",
      actionTitle: "Ena platforma. Vsaka dostopna točka.",
      actionSubtitle: "WIFIGATE poenostavlja pametni dostop za stanovanjske stavbe, podjetja in trgovine, nastanitvene objekte, zasebne domove, poslovne stavbe in športne objekte. Upravljajte rolete, električna vrata, parkirne zapornice, garažna vrata, dostop do zasebnih parkirišč, vhodna vrata in magnetne ključavnice prek ene varne platforme, razvite za nepremičnine po vsem svetu.",
    },
    id: {
      navFeatures: "Fitur",
      whereLabel: "Kasus penggunaan",
      featuresTitle: "WIFIGATE: metode unggulan",
      actionTitle: "Satu Platform. Setiap Titik Akses.",
      actionSubtitle: "WIFIGATE menyederhanakan akses pintar untuk gedung hunian, bisnis dan toko, akomodasi, rumah pribadi, gedung perkantoran, dan fasilitas olahraga. Kelola rolling shutter, gerbang listrik, palang parkir, pintu garasi, akses parkir pribadi, pintu masuk, dan kunci magnetik melalui satu platform aman yang dibuat untuk properti di seluruh dunia.",
    },
    th: {
      navFeatures: "ฟีเจอร์",
      whereLabel: "การใช้งาน",
      featuresTitle: "WIFIGATE: วิธีการที่เหนือกว่า",
      actionTitle: "แพลตฟอร์มเดียว ทุกจุดเข้าออก",
      actionSubtitle: "WIFIGATE ทำให้การเข้าออกอัจฉริยะเป็นเรื่องง่ายสำหรับอาคารที่พักอาศัย ธุรกิจและร้านค้า ที่พักและโรงแรม บ้านส่วนตัว อาคารสำนักงาน และสถานกีฬา. จัดการประตูม้วน ประตูรั้วไฟฟ้า ไม้กั้นลานจอดรถ ประตูโรงรถ การเข้าออกที่จอดรถส่วนตัว ประตูทางเข้า และกลอนแม่เหล็ก ผ่านแพลตฟอร์มที่ปลอดภัยเพียงหนึ่งเดียวซึ่งพัฒนาสำหรับอสังหาริมทรัพย์ทั่วโลก.",
    },
    vi: {
      navFeatures: "Tính năng",
      whereLabel: "Các trường hợp sử dụng",
      featuresTitle: "WIFIGATE: phương pháp chiến thắng",
      actionTitle: "Một nền tảng. Mọi điểm ra vào.",
      actionSubtitle: "WIFIGATE đơn giản hóa việc ra vào thông minh cho các tòa nhà dân cư, doanh nghiệp và cửa hàng, cơ sở lưu trú, nhà riêng, tòa nhà văn phòng và cơ sở thể thao. Quản lý cửa cuốn, cổng điện, thanh chắn bãi đỗ xe, cửa gara, lối vào bãi đỗ xe riêng, cửa ra vào và khóa từ thông qua một nền tảng bảo mật duy nhất được xây dựng cho các bất động sản trên toàn thế giới.",
    },
    ms: {
      navFeatures: "Ciri-ciri",
      whereLabel: "Kegunaan",
      featuresTitle: "WIFIGATE: kaedah terbaik",
      actionTitle: "Satu Platform. Setiap Titik Akses.",
      actionSubtitle: "WIFIGATE memudahkan akses pintar untuk bangunan kediaman, perniagaan dan kedai, hartanah penginapan, rumah persendirian, bangunan pejabat dan kemudahan sukan. Urus bidai gulung, pagar elektrik, palang parkir, pintu garaj, akses parkir persendirian, pintu masuk dan kunci magnet melalui satu platform selamat yang dibina untuk hartanah di seluruh dunia.",
    },
    fil: {
      navFeatures: "Mga Feature",
      whereLabel: "Mga gamit",
      featuresTitle: "WIFIGATE: ang panalong paraan",
      actionTitle: "Isang Platform. Bawat Access Point.",
      actionSubtitle: "Pinapasimple ng WIFIGATE ang smart access para sa mga gusaling tirahan, negosyo at tindahan, accommodation property, pribadong bahay, gusaling opisina, at pasilidad sa palakasan. Pamahalaan ang mga roller shutter, electric gate, parking barrier, garage door, access sa pribadong parking, entrance door, at magnetic lock sa pamamagitan ng isang secure na platform na ginawa para sa mga property sa buong mundo.",
    },
  };

  Object.entries(copy).forEach(([locale, values]) => {
    const bundle = translations[locale];
    if (!bundle) return;
    bundle.nav.features = values.navFeatures;
    bundle.tabs.where = values.whereLabel;
    bundle.features.title = values.featuresTitle;
    bundle.action.title = values.actionTitle;
    bundle.action.subtitle = values.actionSubtitle;
  });
})();
