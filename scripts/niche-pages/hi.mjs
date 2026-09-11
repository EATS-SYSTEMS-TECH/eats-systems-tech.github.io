// scripts/niche-pages/hi.mjs
// Hindi content for the homepage "where" section + the niche/use-case pages,
// translated from the approved Hebrew source (he.mjs) with en.mjs as reference.

export default {
  home: {
    seoTitle: "WIFIGATE | गेट, दरवाज़े और पार्किंग का स्मार्ट एक्सेस कंट्रोल",
    seoDescription:
      "WIFIGATE एक स्मार्ट एक्सेस कंट्रोल सिस्टम है, गेट, दरवाज़े, पार्किंग, शटर और गैराज सीधे अपने फ़ोन से खोलें। सुरक्षित, लोकल और आसान समाधान, बिना किसी मासिक सब्सक्रिप्शन के।",
    keywords:
      "WIFIGATE, WiFi Gate, स्मार्ट एक्सेस कंट्रोल, फ़ोन से गेट खोलना, इलेक्ट्रिक गेट, गेट एक्सेस कंट्रोल, स्मार्ट गेट सिस्टम, बिना मासिक शुल्क",
  },
  where: {
    title: "WIFIGATE किन जगहों के लिए उपयुक्त है?",
    subtitle:
      "प्राइवेट घरों से लेकर कमर्शियल और संस्थागत परिसरों तक, WIFIGATE कई तरह के माहौल में फिट बैठता है और एक्सेस मैनेजमेंट का स्मार्ट, सुरक्षित और सुविधाजनक समाधान देता है।",
  },
  niches: {
    "hotels-airbnb": {
      label: "होटल, Airbnb और गेस्ट अपार्टमेंट",
      title: "होटल, Airbnb और गेस्ट अपार्टमेंट के लिए स्मार्ट एक्सेस",
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
        "WIFIGATE से मेहमानों को सुविधाजनक और सुरक्षित डिजिटल एक्सेस सीधे उनके फ़ोन पर मिलता है, न फिज़िकल चाबियाँ, न कार्ड, न रिसेप्शन या प्रॉपर्टी मालिक से बार-बार तालमेल की ज़रूरत। WIFIGATE API की मदद से बुकिंग प्रोसेस को एक्सेस सिस्टम से जोड़ा जा सकता है, ताकि बुकिंग कन्फ़र्म होते ही मेहमान को अपने-आप समय-सीमित गेस्ट एक्सेस मिल जाए। एक्सेस चेक-इन के समय शुरू होता है, चेक-आउट पर अपने-आप खत्म हो जाता है, और चाबियाँ सौंपने, कोड बाँटने या हर मेहमान को मैन्युअली संभालने की ज़रूरत काफ़ी कम हो जाती है।",
      bullets: [
        "बुकिंग कन्फ़र्म होते ही अपने-आप गेस्ट एक्सेस तैयार",
        "WIFIGATE API के ज़रिए पूरी ऑटोमेशन की सुविधा",
        "ठहरने की तारीख़ों और समय के हिसाब से अस्थायी एक्सेस",
        "मैन्युअल चेक-इन, चाबियों, कार्ड या कोड की ज़रूरत कम",
        "स्टाफ़, सफ़ाईकर्मियों, मेंटेनेंस और वेंडर के लिए परमिशन मैनेजमेंट",
        "मेहमानों के लिए ज़्यादा आसान और सहज अराइवल अनुभव",
        "चेक-आउट के समय एक्सेस अपने-आप बंद",
        "पारदर्शिता और नियंत्रण के लिए एक्सेस हिस्ट्री",
      ],
      seoTitle: "होटल, Airbnb और गेस्ट अपार्टमेंट के लिए एक्सेस कंट्रोल | WIFIGATE API",
      seoDescription:
        "WIFIGATE होटल, Airbnb और गेस्ट अपार्टमेंट को स्मार्ट डिजिटल एक्सेस देता है, WIFIGATE API से ऑटोमैटिक गेस्ट परमिशन, बुकिंग के हिसाब से अस्थायी एक्सेस, कम चाबियाँ, कम मैन्युअल चेक-इन।",
      imageAlt: "आधुनिक कॉरिडोर में मेहमान फ़ोन से होटल के कमरे का दरवाज़ा खोलते हुए",
    },
    "roller-shutters": {
      label: "दुकानों और बिज़नेस के लिए रोलिंग शटर",
      title: "दुकानों और बिज़नेस के रोलिंग शटर पर स्मार्ट और सुरक्षित नियंत्रण",
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
        "दुकानों और बिज़नेस के रोलिंग शटर अक्सर रिमोट, चाबियों, बाहर लगे की-बॉक्स या परिसर के बाहर लगे स्विच से चलाए जाते हैं। ऐसे साधन खो सकते हैं, पुराने कर्मचारियों के पास रह सकते हैं, कॉपी हो सकते हैं या बाहर एक खुला एक्सेस पॉइंट बन सकते हैं। चाबी से खोलने या बंद करने के लिए ऑपरेटिंग पॉइंट के बिल्कुल पास खड़ा होना पड़ता है, चाबी हाथ में रखनी पड़ती है और कई बार शटर वाले हिस्से पर आराम से नज़र रखना मुश्किल हो जाता है। WIFIGATE नियंत्रण को ऐप में ले आता है और एक्सेस कंट्रोल को अंदर की, ज़्यादा सुरक्षित तरफ़ रखता है, ताकि आप ज़्यादा आराम से खोल-बंद कर सकें, कर्मचारियों और वेंडर की परमिशन मैनेज कर सकें, और चाबियों, रिमोट और खुले एक्सेस पॉइंट पर निर्भरता घटा सकें।",
      bullets: [
        "रिमोट पर निर्भर हुए बिना फ़ोन से खोलें और बंद करें",
        "खोने या कॉपी होने वाली चाबियों पर कम निर्भरता",
        "बिज़नेस के बाहर खुले एक्सेस पॉइंट कम",
        "शटर वाले हिस्से पर बेहतर नज़र के साथ ज़्यादा आरामदायक नियंत्रण",
        "कर्मचारियों, मैनेजरों और वेंडर के लिए परमिशन मैनेजमेंट",
        "समय या ज़रूरत के हिसाब से अस्थायी एक्सेस का विकल्प",
        "दुकानों, गोदामों, सर्विस एंट्री और बिज़नेस के लिए उपयुक्त",
        "रोज़मर्रा के कामकाज के लिए अंदरूनी, व्यवस्थित और ज़्यादा सुरक्षित समाधान",
      ],
      seoTitle: "दुकानों और बिज़नेस के लिए स्मार्ट रोलिंग शटर कंट्रोल | WIFIGATE",
      seoDescription:
        "WIFIGATE से दुकानें और बिज़नेस रोलिंग शटर को फ़ोन से कंट्रोल कर सकते हैं, परमिशन मैनेजमेंट, चाबियों और रिमोट पर कम निर्भरता, और परिसर के बाहर कम खुले एक्सेस पॉइंट।",
      imageAlt: "दुकान का मालिक फ़ोन से दुकान का रोलिंग शटर खोलते हुए",
    },
    "electric-gates": {
      label: "इलेक्ट्रिक गेट और पार्किंग बैरियर",
      title: "इलेक्ट्रिक गेट और पार्किंग बैरियर के लिए स्मार्ट ओपनिंग",
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
        "इलेक्ट्रिक गेट और पार्किंग बैरियर का इस्तेमाल निवासी, कर्मचारी, मेहमान और वेंडर सभी करते हैं, लेकिन रिमोट, कोड और गेट खुलवाने के लिए आने वाले फ़ोन कॉल संभालना जल्दी ही सिरदर्द बन जाता है। WIFIGATE से आप गेट फ़ोन से खोल सकते हैं, स्थायी या अस्थायी एक्सेस शेयर कर सकते हैं, नियमित यूज़र्स के लिए Auto Open चालू कर सकते हैं और ज़रूरत के मुताबिक़ शेड्यूल्ड इवेंट सेट कर सकते हैं। सिस्टम लोकल, सुरक्षित और निजी संचालन के लिए बनाया गया है, बिना मासिक सब्सक्रिप्शन या किसी रेकरिंग पेमेंट के, और ऐप के साथ-साथ आप अपने मौजूदा रिमोट भी इस्तेमाल करते रह सकते हैं।",
      bullets: [
        "इलेक्ट्रिक गेट या पार्किंग बैरियर फ़ोन से खोलें",
        "कोई मासिक सब्सक्रिप्शन नहीं, कोई रेकरिंग पेमेंट नहीं",
        "मेहमानों, वेंडर और कर्मचारियों के साथ अस्थायी एक्सेस शेयर करें",
        "रोज़ आने-जाने वाले नियमित यूज़र्स के लिए Auto Open",
        "दिन और समय के हिसाब से खुलने वाले शेड्यूल्ड इवेंट",
        "ऐप से या मौजूदा रिमोट से, दोनों तरह से कंट्रोल",
        "फिज़िकल रिमोट बाँटने की ज़रूरत कम",
        "नियंत्रण और पारदर्शिता के लिए ओपनिंग हिस्ट्री",
      ],
      seoTitle: "बिना सब्सक्रिप्शन इलेक्ट्रिक गेट और पार्किंग बैरियर एक्सेस | WIFIGATE",
      seoDescription:
        "WIFIGATE से इलेक्ट्रिक गेट और पार्किंग बैरियर फ़ोन से खोलें, Auto Open, शेड्यूल्ड इवेंट, मौजूदा रिमोट का सपोर्ट, परमिशन मैनेजमेंट और बिना किसी मासिक सब्सक्रिप्शन के।",
      imageAlt: "ड्राइवर फ़ोन से पार्किंग बैरियर और इलेक्ट्रिक गेट खोलते हुए",
    },
    "garage-doors": {
      label: "गैराज डोर और प्राइवेट पार्किंग",
      title: "गैराज डोर और प्राइवेट पार्किंग के लिए स्मार्ट ओपनिंग",
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
        "गैराज डोर और प्राइवेट पार्किंग आम तौर पर फिज़िकल रिमोट से चलाए जाते हैं, जो खो सकते हैं, ऐसे लोगों के पास रह सकते हैं जिन्हें अब एक्सेस की ज़रूरत नहीं, या कुछ स्थितियों में कॉपी भी हो सकते हैं। WIFIGATE नियंत्रण को फ़ोन से मिलने वाले डिजिटल एक्सेस में बदल देता है, आप परिवार के सदस्यों, कर्मचारियों या मेहमानों की परमिशन मैनेज कर सकते हैं और बिना रिमोट या कोड सौंपे अस्थायी एक्सेस शेयर कर सकते हैं। नतीजा है ज़्यादा सुविधाजनक, ज़्यादा निजी और ज़्यादा व्यवस्थित अनुभव, फिज़िकल एक्सेस साधनों पर कम निर्भरता के साथ।",
      bullets: [
        "गैराज का दरवाज़ा फ़ोन से खोलें",
        "फिज़िकल रिमोट पर कम निर्भरता",
        "रिमोट खोने, हाथ बदलने या कॉपी होने का जोखिम कम",
        "परिवार, कर्मचारियों और मेहमानों के लिए एक्सेस मैनेजमेंट",
        "रिमोट या कोड सौंपे बिना अस्थायी एक्सेस",
        "प्राइवेट पार्किंग, घरों और गार्डन अपार्टमेंट के लिए उपयुक्त",
        "एक्सेस मैनेजमेंट का ज़्यादा लोकल और निजी तरीक़ा",
        "रोज़मर्रा में ज़्यादा आसान और सुरक्षित नियंत्रण",
      ],
      seoTitle: "गैराज डोर और प्राइवेट पार्किंग के लिए स्मार्ट एक्सेस | WIFIGATE",
      seoDescription:
        "WIFIGATE से गैराज डोर और प्राइवेट पार्किंग फ़ोन से खोलें, फिज़िकल रिमोट पर कम निर्भरता, अस्थायी परमिशन और ज़्यादा सुविधाजनक, निजी एक्सेस मैनेजमेंट।",
      imageAlt: "आधुनिक घर में एक व्यक्ति फ़ोन से प्राइवेट गैराज का दरवाज़ा खोलते हुए",
    },
    "private-homes": {
      label: "प्राइवेट घर",
      title: "प्राइवेट घरों के लिए स्मार्ट और सुरक्षित एक्सेस",
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
        "प्राइवेट घरों में कीपैड, चाबियाँ और रिमोट कमज़ोर कड़ी बन सकते हैं। समय के साथ कीपैड के बटनों पर घिसाव या निशान दिखने लगते हैं, रिमोट खो जाते हैं या हाथों-हाथ घूमते रहते हैं, और कोड कई बार डिलीवरी वालों, सर्विस देने वालों या मेहमानों को बता दिया जाता है, और ज़रूरत खत्म होने के बाद भी उनके पास रह जाता है। WIFIGATE से आप घर की एंट्री फ़ोन से मैनेज कर सकते हैं, स्थायी कोड बताए बिना अस्थायी गेस्ट एक्सेस शेयर कर सकते हैं, और ताले, कोड या रिमोट बदले बिना परमिशन आसानी से हटा सकते हैं।",
      bullets: [
        "कीपैड, चाबियों और रिमोट पर कम निर्भरता",
        "डिलीवरी वालों, मेहमानों और सर्विस देने वालों के लिए अस्थायी एक्सेस",
        "फ़ोन से परमिशन आसानी से हटाएँ",
        "कोड शेयर होने या रिमोट हाथ बदलने का जोखिम कम",
        "घर के गेट, दरवाज़ों, पार्किंग और गैराज के लिए उपयुक्त",
        "परिवार और नियमित यूज़र्स के लिए आसान मैनेजमेंट",
        "रोज़ की एंट्री का ज़्यादा सुविधाजनक अनुभव",
        "कौन अंदर आ सकता है, इस पर बेहतर प्राइवेसी और नियंत्रण",
      ],
      seoTitle: "बिना साझा कीपैड कोड, प्राइवेट घरों के लिए स्मार्ट एक्सेस | WIFIGATE",
      seoDescription:
        "WIFIGATE से प्राइवेट घर फ़ोन से एक्सेस मैनेज कर सकते हैं, मेहमानों और डिलीवरी वालों के लिए अस्थायी परमिशन, और कीपैड, चाबियों व रिमोट पर कम निर्भरता।",
      imageAlt: "महिला कीपैड की जगह फ़ोन से प्राइवेट घर का गेट खोलते हुए",
    },
    "residential-buildings": {
      label: "रेज़िडेंशियल बिल्डिंग और सोसाइटी",
      title: "रेज़िडेंशियल बिल्डिंग के लिए स्मार्ट एक्सेस मैनेजमेंट",
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
        "रेज़िडेंशियल बिल्डिंग में साझा एंट्री कोड निवासियों, मेहमानों, डिलीवरी वालों, वेंडर और सर्विस देने वालों के बीच जल्दी फैल जाता है। समय के साथ यह पता लगाना मुश्किल हो जाता है कि बिल्डिंग का एक्सेस असल में किस-किस के पास है, और कोड कब बदलना चाहिए या रिमोट कब वापस लेने चाहिए। WIFIGATE की मदद से निवासी और सोसाइटी कमेटी एक्सेस को ज़्यादा व्यवस्थित तरीक़े से मैनेज कर सकते हैं, अस्थायी गेस्ट परमिशन दे सकते हैं, साझा कोड पर निर्भरता घटा सकते हैं, और बिल्डिंग, लॉबी, गेट या पार्किंग की एंट्री पर बेहतर नियंत्रण रख सकते हैं।",
      bullets: [
        "निवासियों के लिए फ़ोन से आसान एक्सेस",
        "स्थायी कोड बताए बिना अस्थायी गेस्ट इनवाइट",
        "निवासियों, वेंडर और सर्विस देने वालों के लिए परमिशन मैनेजमेंट",
        "लॉबी के दरवाज़ों, गेट और पार्किंग एंट्री के लिए उपयुक्त",
        "कीपैड, चाबियों और रिमोट पर कम निर्भरता",
        "एक्सेस हिस्ट्री से बेहतर पारदर्शिता",
        "सोसाइटी कमेटी या मैनेजमेंट कंपनी के लिए आसान प्रबंधन",
        "निवासियों और मेहमानों के लिए बेहतर एंट्री अनुभव",
      ],
      seoTitle: "रेज़िडेंशियल बिल्डिंग और सोसाइटी के लिए एक्सेस कंट्रोल | WIFIGATE",
      seoDescription:
        "WIFIGATE रेज़िडेंशियल बिल्डिंग को स्मार्ट एक्सेस मैनेजमेंट देता है, फ़ोन से एंट्री, अस्थायी गेस्ट परमिशन, कीपैड पर कम निर्भरता और बेहतर पारदर्शिता।",
      imageAlt: "निवासी महिला फ़ोन से रेज़िडेंशियल बिल्डिंग की एंट्री खोलते हुए",
    },
    "office-buildings": {
      label: "ऑफ़िस बिल्डिंग",
      title: "ऑफ़िस बिल्डिंग के लिए स्मार्ट एक्सेस",
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
        "ऑफ़िस बिल्डिंग को कर्मचारियों, विज़िटर्स, वेंडर और ऑपरेशंस टीमों के लिए आसान एंट्री देनी होती है, वह भी रिसेप्शन पर बोझ डाले बिना और चाबियाँ या कार्ड हाथ से मैनेज किए बिना। WIFIGATE से आप कर्मचारियों को स्थायी और विज़िटर्स को अस्थायी परमिशन दे सकते हैं, एक्सेस फ़ोन से कंट्रोल कर सकते हैं, और एंट्री को इस तरह मैनेज कर सकते हैं जो आधुनिक, साफ़-सुथरे और व्यवस्थित बिज़नेस माहौल के अनुरूप हो।",
      bullets: [
        "कर्मचारियों और टीमों के लिए स्थायी परमिशन",
        "विज़िटर्स, वेंडर और डिलीवरी वालों के लिए अस्थायी एक्सेस",
        "रिसेप्शन और ऑपरेशंस स्टाफ़ पर कम बोझ",
        "एंट्री डोर, फ़्लोर, कमरों और पार्किंग के लिए उपयुक्त",
        "यूज़र और परमिशन का व्यवस्थित मैनेजमेंट",
        "चाबियों, एक्सेस बैज और कोड पर कम निर्भरता",
        "बिल्डिंग की ज़्यादा आधुनिक और प्रोफ़ेशनल छवि",
        "नियंत्रण और पारदर्शिता के लिए एक्सेस हिस्ट्री",
      ],
      seoTitle: "ऑफ़िस बिल्डिंग के लिए एक्सेस कंट्रोल | WIFIGATE",
      seoDescription:
        "WIFIGATE से ऑफ़िस बिल्डिंग कर्मचारियों, विज़िटर्स और वेंडर की एंट्री फ़ोन से मैनेज कर सकती हैं, अस्थायी और स्थायी परमिशन के साथ आधुनिक एक्सेस मैनेजमेंट।",
      imageAlt: "आधुनिक ऑफ़िस में कर्मचारी फ़ोन से काँच का दरवाज़ा खोलते हुए",
    },
    "entry-doors-magnetic-locks": {
      label: "बिज़नेस के एंट्री डोर और मैग्नेटिक लॉक",
      title: "बिज़नेस के एंट्री डोर और मैग्नेटिक लॉक के लिए स्मार्ट ओपनिंग",
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
        "छोटे बिज़नेस, क्लिनिक, स्टूडियो, गोदाम और ऑफ़िस अक्सर कीपैड, चाबी या साधारण मैग्नेटिक लॉक पर निर्भर रहते हैं। समस्या तब शुरू होती है जब कोड कर्मचारियों, वेंडर और मेहमानों के बीच फैल जाता है, या जब सुरक्षा से समझौता किए बिना किसी को अस्थायी एक्सेस देना हो। WIFIGATE से आप एंट्री डोर फ़ोन से मैनेज कर सकते हैं, अस्थायी परमिशन शेयर कर सकते हैं, और स्थायी कोड, फिज़िकल चाबियों या हर एंट्री पर मैन्युअल तालमेल की ज़रूरत घटा सकते हैं।",
      bullets: [
        "इलेक्ट्रिक या मैग्नेटिक लॉक वाले एंट्री डोर के लिए उपयुक्त",
        "कर्मचारियों और मैनेजरों के लिए फ़ोन से ओपनिंग",
        "मेहमानों, वेंडर और सर्विस देने वालों के लिए अस्थायी एक्सेस",
        "कीपैड या स्थायी कोड की ज़रूरत कम",
        "छोटे बिज़नेस, क्लिनिक, स्टूडियो और ऑफ़िस के लिए उपयुक्त",
        "ज़्यादा आसान और सुरक्षित परमिशन मैनेजमेंट",
        "फिज़िकल चाबियों की ज़रूरत कम",
        "उन बिज़नेस के लिए बढ़िया विकल्प जो बिना जटिल सिस्टम के आधुनिक एंट्री चाहते हैं",
      ],
      seoTitle: "बिज़नेस के लिए एंट्री डोर और मैग्नेटिक लॉक | WIFIGATE",
      seoDescription:
        "WIFIGATE बिज़नेस के एंट्री डोर और मैग्नेटिक लॉक को स्मार्ट ओपनिंग देता है, फ़ोन से परमिशन मैनेजमेंट, अस्थायी एक्सेस और कीपैड व चाबियों पर कम निर्भरता।",
      imageAlt: "ग्राहक फ़ोन से छोटे बिज़नेस का एंट्री डोर खोलते हुए",
    },
    "sports-facilities": {
      label: "स्पोर्ट्स फ़ैसिलिटी",
      title: "स्पोर्ट्स फ़ैसिलिटी के लिए स्मार्ट एक्सेस कंट्रोल",
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
        "स्पोर्ट्स फ़ैसिलिटी, Padel कोर्ट, टेनिस कोर्ट, जिम और ट्रेनिंग कॉम्प्लेक्स को मेंबर्स, कोच, टीमों और मेहमानों का एक्सेस ऑपरेटिंग आवर्स, बुकिंग और इवेंट के हिसाब से मैनेज करना होता है। WIFIGATE से आप फ़ोन से अस्थायी या स्थायी एक्सेस दे सकते हैं, साझा चाबी या कोड पर निर्भरता घटा सकते हैं, और यूज़र्स का एंट्री अनुभव बेहतर बना सकते हैं, ख़ासकर ऐसे कॉम्प्लेक्स में जहाँ दिन भर आना-जाना बदलता रहता है।",
      bullets: [
        "Padel कोर्ट, टेनिस कोर्ट, जिम और ट्रेनिंग कॉम्प्लेक्स के लिए उपयुक्त",
        "ऑपरेटिंग आवर्स, बुकिंग या परमिशन के हिसाब से एक्सेस",
        "मेंबर्स, कोच, कर्मचारियों और मेहमानों का मैनेजमेंट",
        "साझा चाबियों और कोड पर कम निर्भरता",
        "फ़ोन से तेज़ और आसान एंट्री",
        "बदलते ऑपरेटिंग आवर्स वाले कॉम्प्लेक्स के लिए उपयुक्त",
        "इवेंट, क्लास या ट्रेनिंग सेशन के लिए अस्थायी परमिशन",
        "नियंत्रण और संचालन के लिए एक्सेस हिस्ट्री",
      ],
      seoTitle: "स्पोर्ट्स फ़ैसिलिटी और Padel कोर्ट के लिए एक्सेस कंट्रोल | WIFIGATE",
      seoDescription:
        "WIFIGATE स्पोर्ट्स फ़ैसिलिटी, Padel कोर्ट, जिम और ट्रेनिंग कॉम्प्लेक्स को स्मार्ट एक्सेस कंट्रोल देता है, फ़ोन से एंट्री और अस्थायी या स्थायी परमिशन के साथ।",
      imageAlt: "Padel खिलाड़ी फ़्लडलाइट वाले स्पोर्ट्स कोर्ट की एंट्री फ़ोन से खोलते हुए",
    },
  },
};
