// scripts/niche-pages/tr.mjs
// Turkish content for the homepage "where" section + the niche/use-case pages,
// translated from the Hebrew (he.mjs) source and the English (en.mjs) reference.

export default {
  home: {
    seoTitle: "WIFIGATE | Kapılar ve Otoparklar için Akıllı Geçiş Kontrolü",
    seoDescription:
      "WIFIGATE, kapıları, otoparkları, kepenkleri ve garaj kapılarını telefondan açan akıllı bir geçiş kontrol sistemidir. Güvenli, yerel ve pratik; aylık abonelik yok.",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, akıllı geçiş kontrolü, telefondan kapı açma, otomatik kapı sistemi, geçiş kontrol sistemi, otopark bariyeri kontrolü, aboneliksiz geçiş kontrolü, akıllı kapı açma",
  },
  where: {
    title: "WIFIGATE nerelerde kullanılabilir?",
    subtitle:
      "WIFIGATE, müstakil evlerden ticari ve kurumsal ortamlara kadar çok çeşitli alanlara uyum sağlar ve erişim yönetimi için akıllı, güvenli ve pratik bir çözüm sunar.",
  },
  niches: {
    "hotels-airbnb": {
      label: "Oteller, Airbnb ve Kiralık Daireler",
      title: "Oteller, Airbnb ve Kiralık Daireler için Akıllı Erişim",
      heroLead:
        "The guest receives a personal entry permission on their phone the moment the booking is confirmed. No key cards, no lockbox, no waiting at reception.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "calendar",
          title: "Opens at check-in, closes at check-out",
          text: "There is no moment when somebody has to remember to revoke access. The permission activates at the arrival time you set and expires at departure, even when nobody from the team is on site.",
        },
        {
          icon: "invite",
          title: "The booking creates the access",
          text: "Through the WIFIGATE API your reservation system connects straight to access, so every confirmed booking issues the entry permission itself, with no manual step in between.",
        },
        {
          icon: "keyless",
          title: "No cards to issue, no lockbox to share",
          text: "Nothing to program, nothing to hand over, no card left behind by a previous guest and no lockbox code passed along. The phone already in the guest's pocket is the only way in.",
        },
      ],
      paragraph:
        "WIFIGATE, misafirlerin rahat ve güvenli dijital erişimi doğrudan telefonlarına almasını sağlar; fiziksel anahtar yok, kart yok, resepsiyonla veya ev sahibiyle gereksiz koordinasyon yok. WIFIGATE API ile rezervasyon süreci erişim sistemine bağlanabilir; böylece rezervasyon onaylandığı anda misafir, süresi sınırlı misafir erişimini otomatik olarak alabilir. Erişim check-in saatinde başlar, check-out saatinde kendiliğinden sona erer ve anahtar teslim etme, kod paylaşma ya da her misafirle tek tek ilgilenme ihtiyacını önemli ölçüde azaltır.",
      bullets: [
        "Rezervasyon onaylandığında otomatik oluşturulan misafir erişimi",
        "WIFIGATE API ile tam otomasyon desteği",
        "Konaklama tarih ve saatlerine göre geçici erişim",
        "Daha az manuel check-in, anahtar, kart veya kod ihtiyacı",
        "Personel, temizlik, bakım ve tedarikçiler için yetki yönetimi",
        "Misafirler için daha akıcı ve konforlu bir varış deneyimi",
        "Check-out saatinde otomatik olarak sona eren erişim",
        "Şeffaflık ve denetim için erişim geçmişi",
      ],
      seoTitle: "Oteller, Airbnb ve Kiralık Daireler için Geçiş Kontrolü | WIFIGATE API",
      seoDescription:
        "Oteller, Airbnb ve kiralık daireler için akıllı dijital erişim: WIFIGATE API ile otomatik misafir yetkileri, rezervasyona bağlı geçici erişim, daha az anahtar ve check-in yükü.",
      imageAlt: "Modern bir koridorda otel odasının kapısını telefonla açan misafirler",
    },
    "roller-shutters": {
      label: "İşyeri ve Mağaza Kepenkleri",
      title: "İşyerleri ve Mağazalarda Kepenkler için Akıllı ve Güvenli Kontrol",
      heroLead:
        "The shutter opens from a phone, and control moves to the protected inner side of the business. Fewer remotes, fewer keys and fewer exposed entry points outside.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "shutter",
          title: "Control moves inside, out of reach",
          text: "A switch or key box on an exterior wall is exposed to anyone walking past. When opening comes from a phone, the control point can sit on the inside of the shop.",
        },
        {
          icon: "users",
          title: "A separate permission for every employee",
          text: "A key or remote left with a former employee keeps working. A personal permission opens on the first day and closes on the last, with no lock to change and no hardware to collect.",
        },
        {
          icon: "phone",
          title: "Open without standing at the shutter",
          text: "A key forces you to stand right at the control point, hands full, with a poor view of the shutter. From a phone it happens at a safer distance.",
        },
      ],
      paragraph:
        "İşyerlerinde ve mağazalarda kepenkler çoğu zaman kumandalarla, anahtarlarla, dışarıya monte edilmiş bir anahtar kutusuyla ya da işyerinin dışındaki şalterlerle çalıştırılır. Bu tür çözümler kaybolabilir, işten ayrılan çalışanlarda kalabilir, kopyalanabilir veya açıkta bir erişim noktasına dönüşebilir. Ayrıca anahtarla açıp kapatmak, çalıştırma noktasının hemen yanında durmayı, anahtarı elde tutmayı ve bazen kepenk bölgesini rahatça görememeyi de beraberinde getirir. WIFIGATE kontrolü uygulamaya taşır ve geçiş kontrolünü binanın daha korunaklı iç tarafına yerleştirir; böylece kepenkleri daha rahat açıp kapatabilir, çalışanlar ve tedarikçiler için yetkileri yönetebilir, anahtarlara, kumandalara ve açıktaki erişim noktalarına olan bağımlılığı azaltabilirsiniz.",
      bullets: [
        "Kumandaya ihtiyaç duymadan telefondan açma ve kapatma",
        "Kopyalanabilen veya kaybolabilen anahtarlara daha az bağımlılık",
        "İşyeri dışında daha az açıkta erişim noktası",
        "Kepenk bölgesini daha iyi görerek daha rahat kontrol",
        "Çalışanlar, yöneticiler ve tedarikçiler için yetki yönetimi",
        "İhtiyaca veya zamana göre geçici erişim imkânı",
        "Mağazalar, depolar, servis girişleri ve işyerleri için uygun",
        "Günlük kullanım için daha derli toplu ve korunaklı bir iç çözüm",
      ],
      seoTitle: "İşyerleri ve Mağazalar için Akıllı Kepenk Kontrolü | WIFIGATE",
      seoDescription:
        "WIFIGATE, işyeri ve mağaza kepenklerini telefondan kontrol etmenizi sağlar: yetki yönetimi, anahtar ve kumandalara daha az bağımlılık, daha az açıkta erişim noktası.",
      imageAlt: "Mağazasının kepengini telefonuyla açan işyeri sahibi",
    },
    "electric-gates": {
      label: "Otomatik Kapılar ve Otopark Bariyerleri",
      title: "Otomatik Kapılar ve Otopark Bariyerleri için Akıllı Açılış",
      heroLead:
        "Open the gate or barrier from your phone, send a temporary permission to a guest or supplier, and let daily users through automatically. Existing remotes keep working alongside it.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "handsfree",
          title: "Automatic opening on the daily drive in",
          text: "Auto Open recognises that you have arrived and opens the gate for you. No hunting through the glovebox and no winding the window down in the rain.",
        },
        {
          icon: "clock",
          title: "Temporary access for a supplier or guest",
          text: "Instead of handing over a remote and hoping it comes back, send a permission valid only for the window in which it is actually needed, after which it closes itself.",
        },
        {
          icon: "gate",
          title: "Existing remotes do not go in the bin",
          text: "WIFIGATE joins what is already installed on the gate. Whoever prefers a remote keeps using it, and whoever prefers a phone simply opens from the app.",
        },
      ],
      paragraph:
        "Otomatik kapılardan ve otopark bariyerlerinden sakinler, çalışanlar, misafirler ve tedarikçiler yararlanır; ancak kumandaları, kodları ve kapı açma telefonlarını yönetmek kısa sürede yorucu bir işe dönüşür. WIFIGATE kapıyı telefondan açmanızı, kalıcı veya geçici erişim paylaşmanızı, düzenli kullanıcılar için otomatik açılıştan yararlanmanızı ve ihtiyaca göre zamanlanmış etkinlikler tanımlamanızı sağlar. Sistem yerel, güvenli ve mahremiyete önem veren bir çalışma için tasarlanmıştır; aylık abonelik veya düzenli ödeme gerektirmez ve uygulamadan kontrolün yanında mevcut kumandaları kullanmaya devam edebilirsiniz.",
      bullets: [
        "Otomatik kapıyı veya otopark bariyerini telefondan açma",
        "Aylık abonelik ve düzenli ödeme yok",
        "Misafirler, tedarikçiler ve çalışanlarla geçici erişim paylaşımı",
        "Düzenli kullanıcıların günlük girişleri için Auto Open",
        "Gün ve saate göre açılış için zamanlanmış etkinlikler",
        "Uygulamadan veya mevcut kumandalarla kontrol",
        "Daha az fiziksel kumanda dağıtma ihtiyacı",
        "Denetim ve şeffaflık için açılış geçmişi",
      ],
      seoTitle: "Aboneliksiz Otomatik Kapı ve Otopark Bariyeri Kontrolü | WIFIGATE",
      seoDescription:
        "WIFIGATE, otomatik kapıları ve otopark bariyerlerini telefondan açar: Auto Open, zamanlanmış etkinlikler, mevcut kumanda desteği, yetki yönetimi; aylık abonelik yok.",
      imageAlt: "Otopark bariyerini ve otomatik kapıyı telefonuyla açan sürücü",
    },
    "garage-doors": {
      label: "Garaj Kapıları ve Özel Otoparklar",
      title: "Garaj Kapıları ve Özel Otoparklar için Akıllı Açılış",
      heroLead:
        "The garage door opens from your phone, and access moves from a remote to a list you control. No remote to lose, and none left with someone who no longer needs it.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "keyless",
          title: "A lost remote stops being a problem",
          text: "A remote that falls out of a pocket keeps opening the garage for whoever finds it, and there is no way to cancel it. A permission on a phone is removed in a moment, with no motor to replace and no remotes to re-code.",
        },
        {
          icon: "users",
          title: "Access for the household and for tradespeople",
          text: "Everyone at home gets their own permission, and a tradesperson coming once can be given access that closes at the end of the day. Nothing left under the mat.",
        },
        {
          icon: "phone",
          title: "Your phone is already with you",
          text: "No remote to move between cars and nothing to hunt for when somebody else is driving. What opens the door is the one thing you never leave without.",
        },
      ],
      paragraph:
        "Garaj kapıları ve özel otopark girişleri genellikle fiziksel kumandalarla çalıştırılır; bu kumandalar kaybolabilir, artık erişime ihtiyacı olmayan kişilerde kalabilir veya bazı durumlarda kopyalanabilir. WIFIGATE kontrolü telefondan dijital erişime taşır: aile üyeleri, çalışanlar veya misafirler için yetkileri yönetebilir, kumanda ya da kod vermeden geçici erişim paylaşabilirsiniz. Sonuç, fiziksel erişim araçlarına daha az bağımlı, daha konforlu, daha mahrem ve daha düzenli bir kullanım deneyimidir.",
      bullets: [
        "Garaj kapısını telefondan açma",
        "Fiziksel kumandalara daha az bağımlılık",
        "Kaybolan, elden ele geçen veya kopyalanan kumandalardan doğan riskte azalma",
        "Aile üyeleri, çalışanlar ve misafirler için erişim yönetimi",
        "Kumanda veya kod vermeden geçici erişim",
        "Özel otoparklar, evler ve bahçe katları için uygun",
        "Erişimi yönetmek için daha yerel ve mahrem bir yol",
        "Günlük kullanımda daha rahat ve daha güvenli kontrol",
      ],
      seoTitle: "Akıllı Garaj Kapısı ve Özel Otopark Erişimi | WIFIGATE",
      seoDescription:
        "WIFIGATE, garaj kapılarını ve özel otopark girişlerini telefondan açar: fiziksel kumandalara daha az bağımlılık, geçici yetkiler ve daha mahrem erişim yönetimi.",
      imageAlt: "Modern bir evde garaj kapısını telefonuyla açan adam",
    },
    "private-homes": {
      label: "Müstakil Evler",
      title: "Müstakil Evler için Akıllı ve Güvenli Erişim",
      heroLead:
        "A fixed keypad code wears down, gets passed around and stays with people who no longer need it. Give each person their own permission, and a temporary one to anyone visiting once.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "shield",
          title: "A keypad gives your code away",
          text: "After enough years, four worn keys say exactly which digits make up the code. A permission on a phone leaves no marks on the wall.",
        },
        {
          icon: "clock",
          title: "Access for the delivery, not forever",
          text: "A code given to a courier, a technician or a guest is still with them a year later. A temporary permission closes itself the moment the visit is over.",
        },
        {
          icon: "roster",
          title: "A list instead of guesswork",
          text: "A shared code has no list of holders. In its place comes a list where every permission has a name, so it is clear at any moment who can get into the house.",
        },
      ],
      paragraph:
        "Müstakil evlerde şifreli tuş takımları, anahtarlar ve kumandalar zamanla zayıf bir noktaya dönüşebilir. Tuş takımının tuşlarında aşınma veya izler oluşur, kumandalar kaybolur ya da elden ele dolaşır; şifre bazen kuryelere, servis personeline veya misafirlere verilir ve ihtiyaç ortadan kalktıktan çok sonra bile onlarda kalır. WIFIGATE girişi telefondan yönetmenizi, kalıcı şifreyi açık etmeden geçici misafir erişimi paylaşmanızı ve kilitleri, kodları veya kumandaları değiştirmeden yetkileri kolayca iptal etmenizi sağlar.",
      bullets: [
        "Tuş takımı, anahtar ve kumandalara daha az bağımlılık",
        "Kuryeler, misafirler ve servis personeli için geçici erişim",
        "Telefondan kolayca yetki iptali",
        "Paylaşılan şifrelerden ve elden ele geçen kumandalardan doğan riskte azalma",
        "Müstakil evdeki kapılar, girişler, otoparklar ve garajlar için uygun",
        "Aile üyeleri ve düzenli kullanıcılar için basit yönetim",
        "Günlük girişte daha konforlu bir deneyim",
        "Kimin girebileceği üzerinde daha iyi mahremiyet ve kontrol",
      ],
      seoTitle: "Ortak Şifre Olmadan Müstakil Evlerde Akıllı Erişim | WIFIGATE",
      seoDescription:
        "WIFIGATE ile müstakil evlerde erişimi telefondan yönetin: misafirlere ve kuryelere geçici yetkiler verin, tuş takımı, anahtar ve kumandalara bağımlılığı azaltın.",
      imageAlt: "Müstakil bir evin giriş kapısını tuş takımı yerine telefonuyla açan kadın",
    },
    "residential-buildings": {
      label: "Apartmanlar ve Siteler",
      title: "Apartmanlar ve Siteler için Akıllı Erişim Yönetimi",
      heroLead:
        "A fixed code that travels between couriers, guests and service people can end up in the wrong hands. Give each person a personal, time-limited entry permission and cut unauthorised entries and the risk of theft.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "roster",
          title: "Know who holds access, at any moment",
          text: "A shared code has no list of holders. There is no way to tell who has it, who passed it on or when. In its place comes a current list where every permission has a name, so the picture of who can enter the building is clear at any point in time.",
        },
        {
          icon: "invite",
          title: "Arrival instructions in one tap",
          text: "Address, floor, apartment, gate code and lobby code. You dictate that same sequence again to every guest, every courier and every tradesperson. With WIFIGATE all of it collapses into a single tap, and the visitor finds their own way to the door.",
        },
        {
          icon: "handsfree",
          title: "Hands-free entry",
          text: "Auto Open recognises that you have arrived and opens the gate or door for you. No searching for a key and no taking out your phone, even when your hands are full of shopping, a pushchair or children.",
        },
      ],
      paragraph:
        "Apartmanlarda ortak giriş şifresi; sakinler, misafirler, kuryeler, tedarikçiler ve servis personeli arasında hızla yayılır. Zamanla binaya gerçekte kimin erişimi olduğunu, şifreyi ne zaman değiştirmek ya da kumandaları ne zaman toplamak gerektiğini bilmek zorlaşır. WIFIGATE, sakinlerin ve yönetimin erişimi daha düzenli yönetmesini, geçici misafir yetkileri vermesini, ortak şifreye bağımlılığı azaltmasını ve bina, lobi, kapı veya otopark girişinde kontrolü daha sıkı elde tutmasını sağlar.",
      bullets: [
        "Sakinler için telefondan pratik erişim",
        "Kalıcı şifreyi açık etmeden geçici misafir davetleri",
        "Sakinler, tedarikçiler ve servis personeli için yetki yönetimi",
        "Lobi kapıları, bahçe kapıları ve otopark girişleri için uygun",
        "Tuş takımı, anahtar ve kumandalara daha az bağımlılık",
        "Erişim geçmişiyle daha iyi şeffaflık",
        "Apartman veya site yönetimi için daha kolay idare",
        "Sakinler ve misafirler için daha konforlu bir giriş deneyimi",
      ],
      seoTitle: "Apartmanlar ve Siteler için Geçiş Kontrolü | WIFIGATE",
      seoDescription:
        "WIFIGATE, apartmanlara ve sitelere akıllı erişim yönetimi getirir: telefondan giriş, geçici misafir yetkileri, tuş takımına daha az bağımlılık ve daha iyi şeffaflık.",
      imageAlt: "Apartman girişini telefonuyla açan bina sakini",
    },
    "office-buildings": {
      label: "Ofis Binaları",
      title: "Ofis Binaları için Akıllı Erişim",
      heroLead:
        "Standing permissions for staff, temporary ones for visitors and suppliers. No queue at reception, no badges to issue and no keys to collect when somebody leaves.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "users",
          title: "Somebody joins, somebody leaves",
          text: "Onboarding and offboarding are one action on a list, not a round of issuing a badge, collecting a badge and changing a lock. The permission opens and closes on the dates you set.",
        },
        {
          icon: "invite",
          title: "The visitor arrives already holding the entry",
          text: "Instead of waiting at reception for somebody to come down, the visitor arrives with a permission sent to their phone, valid only for the time of the meeting.",
        },
        {
          icon: "history",
          title: "A record of entries for operations",
          text: "Every opening carries a name and a time, so you can check afterwards who entered a floor, a store room or the car park without reconstructing it from memory.",
        },
      ],
      paragraph:
        "Ofis binaları; çalışanlara, ziyaretçilere, tedarikçilere ve operasyon ekiplerine, resepsiyona yük bindirmeden ve anahtarları ya da kartları elle yönetmeden pratik bir giriş sunmak zorundadır. WIFIGATE çalışanlara kalıcı, ziyaretçilere geçici yetkiler tanımlamanızı, erişimi telefondan kontrol etmenizi ve girişleri modern, temiz ve düzenli bir iş ortamına yakışır şekilde yönetmenizi sağlar.",
      bullets: [
        "Çalışanlar ve ekipler için kalıcı yetkiler",
        "Ziyaretçiler, tedarikçiler ve kuryeler için geçici erişim",
        "Resepsiyon ve operasyon ekibinde daha az yük",
        "Giriş kapıları, katlar, odalar ve otoparklar için uygun",
        "Düzenli kullanıcı ve yetki yönetimi",
        "Anahtar, erişim kartı ve kodlara daha az bağımlılık",
        "Bina için daha modern ve konforlu bir imaj",
        "Denetim ve şeffaflık için erişim geçmişi",
      ],
      seoTitle: "Ofis Binaları için Geçiş Kontrolü | WIFIGATE",
      seoDescription:
        "WIFIGATE ile ofis binaları çalışan, ziyaretçi ve tedarikçi girişlerini telefondan yönetir: kalıcı ve geçici yetkiler, resepsiyona daha az yük, modern erişim yönetimi.",
      imageAlt: "Modern bir ofiste cam kapıyı telefonuyla açan çalışan",
    },
    "entry-doors-magnetic-locks": {
      label: "İşyerleri için Giriş Kapıları ve Manyetik Kilitler",
      title: "İşyeri Giriş Kapıları ve Manyetik Kilitler için Akıllı Açılış",
      heroLead:
        "Your business entrance opens from a phone, and permissions change without changing a code. It works with the electric or magnetic lock already fitted to the door.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "keyless",
          title: "One code for everyone stops being a solution",
          text: "A code that travels between staff, suppliers and customers is no longer really closing the door. A personal permission for each person removes the need to change the code every time somebody moves on.",
        },
        {
          icon: "clock",
          title: "Temporary access for a supplier or technician",
          text: "For the cleaner who comes in the evening, the technician who comes once and the courier who needs five minutes: a permission valid for exactly that window, which then closes itself.",
        },
        {
          icon: "phone",
          title: "No complex access control system",
          text: "No control cabinet, no management software and no card reader to mount. The existing lock stays where it is, and everything is managed from the app.",
        },
      ],
      paragraph:
        "Küçük işletmeler, klinikler, stüdyolar, depolar ve ofisler çoğu zaman şifreli tuş takımına, anahtara veya basit bir manyetik kilide güvenir. Sorun, şifre çalışanlar, tedarikçiler ve misafirler arasında yayıldığında ya da güvenlikten ödün vermeden geçici erişim vermek gerektiğinde başlar. WIFIGATE giriş kapısını telefondan yönetmenizi, geçici yetki paylaşmanızı ve kalıcı şifrelere, fiziksel anahtarlara veya her girişte elle koordinasyona duyulan ihtiyacı azaltmanızı sağlar.",
      bullets: [
        "Elektrikli veya manyetik kilitli giriş kapıları için uygun",
        "Çalışanlar ve yöneticiler için telefondan açma",
        "Misafirler, tedarikçiler ve servis personeli için geçici erişim",
        "Tuş takımına veya kalıcı şifreye daha az ihtiyaç",
        "Küçük işletmeler, klinikler, stüdyolar ve ofisler için uygun",
        "Daha basit ve daha güvenli yetki yönetimi",
        "Fiziksel anahtar ihtiyacında azalma",
        "Karmaşık bir sistem kurmadan modern giriş isteyen işletmeler için pratik bir seçenek",
      ],
      seoTitle: "İşyerleri için Giriş Kapısı ve Manyetik Kilit Kontrolü | WIFIGATE",
      seoDescription:
        "WIFIGATE, işyeri giriş kapılarına ve manyetik kilitlere akıllı açılış getirir: telefondan yetki yönetimi, geçici erişim, tuş takımı ve anahtarlara daha az bağımlılık.",
      imageAlt: "Küçük bir işletmenin giriş kapısını telefonuyla açan müşteri",
    },
    "sports-facilities": {
      label: "Spor Tesisleri",
      title: "Spor Tesisleri için Akıllı Geçiş Kontrolü",
      heroLead:
        "Members, coaches and guests enter on their own permission and within opening hours. No shared key, and no code going around a WhatsApp group.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "calendar",
          title: "Access opens with the booking",
          text: "Whoever booked a court for a given hour gets a permission that opens then and closes at the end of it. Nobody has to wait at the gate to let them in.",
        },
        {
          icon: "users",
          title: "A member, a coach and a guest are not the same",
          text: "Each type of user gets their own permission: a standing member, a coach who comes on set days and a one-off guest. All on one list, with no key changing hands.",
        },
        {
          icon: "history",
          title: "Know who was on site and when",
          text: "When traffic changes through the day, a record of entries helps operations, settles questions about incidents, and confirms the site was locked at the end of the day.",
        },
      ],
      paragraph:
        "Spor tesisleri, padel kortları, tenis kortları, spor salonları ve antrenman merkezleri; üyeler, antrenörler, ekipler ve misafirler için erişimi çalışma saatlerine, rezervasyonlara ve etkinliklere göre yönetmek zorundadır. WIFIGATE telefondan geçici veya kalıcı erişim vermenizi, ortak anahtara ya da şifreye bağımlılığı azaltmanızı ve özellikle gün içinde yoğunluğun sürekli değiştiği tesislerde kullanıcıların giriş deneyimini iyileştirmenizi sağlar.",
      bullets: [
        "Padel kortları, tenis kortları, spor salonları ve antrenman merkezleri için uygun",
        "Çalışma saatlerine, rezervasyonlara veya yetkilere göre erişim",
        "Üyeler, antrenörler, çalışanlar ve misafirler için yönetim",
        "Ortak anahtar ve şifrelere daha az bağımlılık",
        "Telefondan hızlı ve pratik giriş",
        "Çalışma saatleri değişen tesisler için uygun",
        "Etkinlikler, dersler veya antrenmanlar için geçici yetkiler",
        "Denetim ve operasyon için erişim geçmişi",
      ],
      seoTitle: "Spor Tesisleri ve Padel Kortları için Geçiş Kontrolü | WIFIGATE",
      seoDescription:
        "WIFIGATE; spor tesislerine, padel kortlarına, spor salonlarına ve antrenman merkezlerine akıllı geçiş kontrolü getirir: telefondan giriş, geçici veya kalıcı yetkiler.",
      imageAlt: "Işıklandırılmış spor kortunun girişini telefonuyla açan padel oyuncusu",
    },
  },
};
