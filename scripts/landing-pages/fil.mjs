// scripts/landing-pages/fil.mjs
// Filipino landing pages, aligned key by key to he.mjs.

export default {
  "shabbat-clock-electric-gate": {
    "label": "Shabbat timer para sa awtomatikong gate",
    "aboutName": "Shabbat timer",
    "mentionsName": "Shabbat",
    "eyebrow": "Mga naka-iskedyul na event ng WIFIGATE",
    "title": "Shabbat timer para sa awtomatikong gate, walang gagalawin sa Shabbat",
    "heroLead": "Itakda nang maaga sa app kung kailan mananatiling bukas ang gate, halimbawa mula bago magsimula ang Shabbat hanggang pagkatapos nito, at kusang uulit ang iskedyul bawat linggo. Sa mismong Shabbat, walang kailangang pumindot ng remote, magbukas ng app o humawak ng pindutan.",
    "highlights": [
      {
        "icon": "clock",
        "title": "Itakda nang isang beses, gagana tuwing Shabbat",
        "text": "Markahan sa Biyernes at sa Sabado ang isang berdeng event na nagpapanatiling bukas sa gate, at kusa itong uulit bawat linggo. Naka-save at tumatakbo ang iskedyul sa mismong device ng gate, hindi sa telepono ng sinuman."
      },
      {
        "icon": "calendar",
        "title": "Pati sa mga pista, nang maaga",
        "text": "Nagsisimula ang pista sa gabi, gaya ng Shabbat, kaya magdagdag para dito ng mga event na isang beses lang, hanggang 90 araw nang maaga: sa bisperas ng pista hanggang hatinggabi, at sa araw ng pista mula hatinggabi hanggang matapos ito. Ganito napapasok sa iskedyul ang Rosh Hashanah, Yom Kippur, Sukkot, Simchat Torah, Paskuwa at Shavuot, at kusang nabubura ang bawat ganitong event kapag lumipas na ang petsa nito."
      },
      {
        "icon": "gate",
        "title": "Walang hiwalay na Shabbat timer sa panel ng kuryente",
        "text": "Hindi na kailangan ng dagdag na timer sa panel ng kuryente o sa tabi ng controller ng gate, at hindi kailangan ng teknisyan para baguhin ang mga oras. Nakapaloob na ang pag-iiskedyul sa WIFIGATE, ang parehong system na nagbubukas ng gate gamit ang telepono sa karaniwang araw, at sa labas ng mga oras na itinakda ninyo, gumagana ang gate gaya ng dati."
      }
    ],
    "intro": {
      "title": "Ano ang Shabbat timer para sa awtomatikong gate?",
      "text": "Ang Shabbat timer para sa awtomatikong gate ay isang iskedyul na nagpapanatiling bukas, o sarado, ang gate sa mga takdang oras tuwing Shabbat at pista, para makapasok at makalabas ang mga tao nang walang sinumang nagpapagana nito. Sa WIFIGATE, nakapaloob ang iskedyul sa device na nakakonekta sa kasalukuyang controller ng gate: magtatakda kayo nang maaga sa app ng hanggang 50 event, nang tig-10 minuto, at ang device mismo ang magpapatakbo sa mga ito, nang walang internet sa gate at walang buwanang subscription. Walang hiwalay na switch na “Shabbat mode”: itinatakda ito sa screen ng mga naka-iskedyul na event sa app."
    },
    "steps": {
      "title": "Paano itakda ang Shabbat timer para sa awtomatikong gate",
      "items": [
        "Sa tabi ng gate, binubuksan ng admin ng system ang screen ng mga naka-iskedyul na event sa app at pinipili ang Biyernes.",
        "Piliin ang berde, ang event na bukas ang gate, markahan ang isang event mula sa oras ng pagbukas hanggang hatinggabi (24:00), at i-save.",
        "Piliin ang Sabado, piliin muli ang berde, markahan ang isang event mula 00:00 hanggang pagkatapos ng Shabbat, at i-save. Nagdudugtong ang dalawang event sa hatinggabi, kaya tuloy-tuloy na bukas ang gate, at kusa silang umuulit bawat linggo.",
        "Para sa pista, magdagdag ng dalawang event na isang beses lang, hanggang 90 araw nang maaga: sa bisperas ng pista mula sa oras ng pagbukas hanggang hatinggabi, at sa araw ng pista mula 00:00 hanggang pagkatapos ng pista."
      ],
      "note": "Itinatakda ang mga oras nang tig-10 minuto. Kung natatapos ang Shabbat pagkalipas ng hatinggabi sa inyong lugar, magdagdag din ng event sa Linggo mula 00:00."
    },
    "benefitsTitle": "Ano ang kasama sa Shabbat timer ng WIFIGATE para sa gate",
    "benefits": [
      {
        "icon": "calendar-clock",
        "title": "Itakda nang isang beses. Gagana tuwing Shabbat.",
        "text": "Markahan ang mga berdeng event na “Bukas ang gate” sa Biyernes at Sabado, at kusang pinapatakbo ng device ng gate ang mga ito bawat linggo.",
        "tags": [
          "Hanggang 50 event",
          "Tig-10 minuto"
        ],
        "visual": {
          "type": "schedule",
          "heading": "Bukas ang gate sa Shabbat",
          "status": "Lingguhan",
          "rows": [
            {
              "day": "Biyernes",
              "range": "16:00–24:00"
            },
            {
              "day": "Sabado",
              "range": "00:00–20:00"
            }
          ]
        }
      },
      {
        "icon": "lock-open",
        "title": "Pasok at labas sa Shabbat. Walang gagalawin.",
        "text": "Sa Shabbat, nananatiling bukas ang gate sa mga oras na itinakda ninyo, at walang kailangang magpagana nito.",
        "tags": [
          "Walang remote",
          "Walang telepono",
          "Walang pindutan"
        ]
      },
      {
        "icon": "calendar-check",
        "title": "Mga pistang nakaplano nang maaga",
        "text": "Magdagdag ng mga isang beses na event para sa bisperas ng pista at sa araw ng pista, hanggang 90 araw nang maaga, at kusang nabubura ang bawat event kapag lumipas na ang petsa nito.",
        "tags": [
          "Hanggang 90 araw",
          "Pista ng Rosh Hashanah",
          "Paskuwa"
        ]
      },
      {
        "icon": "clock",
        "title": "Baguhin ang oras sa app. Walang teknisyan.",
        "text": "Kapag nagbago ang panahon, i-update ang mga oras sa screen na “Mga naka-iskedyul na event” at i-save.",
        "tags": [
          "Admin ng system",
          "Sa tabi ng gate"
        ]
      },
      {
        "icon": "lock",
        "title": "Ikandado ang gate sa mga takdang oras, halimbawa sa gabi",
        "text": "Ang pulang event na “Sarado ang gate” ay nagpapanatiling sarado sa gate sa mga oras na itinakda ninyo, at ang berdeng event ay nagpapanatiling bukas dito.",
        "tags": [
          "Pulang event",
          "Berdeng event"
        ]
      },
      {
        "icon": "smartphone",
        "title": "Sa karaniwang araw: telepono, remote, o pindutan",
        "text": "Sa labas ng mga oras na itinakda ninyo, gumagana ang gate gaya ng dati at nabubuksan gamit ang telepono, remote, o pindutan.",
        "tags": [
          "Kapag walang event",
          "Mga kasalukuyang remote"
        ]
      },
      {
        "icon": "gate",
        "title": "Kumokonekta sa kasalukuyang gate o harang",
        "text": "Kumokonekta ang WIFIGATE sa controller ng kasalukuyang gate o harang, kaya hindi na kailangan ng hiwalay na Shabbat timer sa panel ng kuryente.",
        "tags": [
          "Awtomatikong gate",
          "Harang sa paradahan"
        ]
      },
      {
        "icon": "sim-off",
        "title": "Walang SIM, walang internet sa gate at walang buwanang subscription",
        "text": "Kuryente lang ang kailangan sa gate, direktang kumokonekta ang telepono sa device, at isang beses lang ang bayad para sa device at pagkakabit.",
        "tags": [
          "Kuryente lang",
          "Isang beses na bayad"
        ]
      }
    ],
    "facts": {
      "title": "Ang Shabbat timer ng WIFIGATE sa madaling sabi",
      "rows": [
        {
          "label": "Mga event",
          "value": "Hanggang 50 sa kabuuan, lingguhan at isang beses"
        },
        {
          "label": "Hakbang ng oras",
          "value": "10 minuto"
        },
        {
          "label": "Mga pista",
          "value": "Isang beses na event sa bisperas ng pista at isa pa sa araw ng pista, hanggang 90 araw nang maaga"
        },
        {
          "label": "Bukas o sarado",
          "value": "Pinananatiling bukas ng berdeng event ang gate, at pinananatili itong sarado ng pulang event"
        },
        {
          "label": "Nasaan ang iskedyul",
          "value": "Naka-save at tumatakbo sa device ng gate"
        },
        {
          "label": "Kailangan sa gate",
          "value": "Kuryente lang, walang SIM, walang router at walang internet"
        },
        {
          "label": "Pagbabago ng oras",
          "value": "Mula sa app, sa tabi ng gate, nang walang teknisyan"
        },
        {
          "label": "Pagkatapos mawalan ng kuryente",
          "value": "Nananatili ang iskedyul, at muling tatakbo ang mga event kapag may teleponong kumonekta sa gate"
        },
        {
          "label": "Bayad",
          "value": "Isang beses para sa device at pagkakabit, walang buwanang subscription"
        }
      ]
    },
    "updatedLabel": "Huling na-update: {date}",
    "faqTitle": "Mga madalas itanong tungkol sa Shabbat timer para sa awtomatikong gate",
    "seoTitle": "Shabbat Timer para sa Awtomatikong Gate at Harang | WIFIGATE",
    "seoDescription": "Shabbat timer para sa awtomatikong gate at harang: itakda nang maaga sa app ang oras ng Shabbat at pista, at bukas ang gate nang walang remote o pindutan.",
    "imageAlt": "Awtomatikong gate at harang sa paradahan sa pasukan ng isang residensyal na kompleks bago lumubog ang araw",
    "faq": [
      {
        "question": "Kailangan bang humawak ng telepono, remote o pindutan sa Shabbat?",
        "answer": "Hindi. Naka-save at tumatakbo ang iskedyul sa device ng gate, kaya sa Shabbat, walang kailangang magbukas ng app, pumindot ng remote o humawak ng pindutan. Ipinaliliwanag sa hiwalay na tanong sa ibaba kung ano ang nangyayari kapag nawalan ng kuryente."
      },
      {
        "question": "Pinahihintulutan bang gumamit ng Shabbat timer para sa awtomatikong gate?",
        "answer": "Hindi nagbibigay ang WIFIGATE ng pasya tungkol sa halacha (batas ng relihiyong Hudyo) at hindi ito nagpapakita ng anumang pag-apruba ayon sa halacha. Sa teknikal na aspeto, itinatakda ang mga oras bago ang Shabbat, at sa mismong Shabbat tumatakbo ang iskedyul sa device nang walang kilos ng sinuman. Para sa mga tanong tungkol sa halacha kaugnay ng inyong gate, halimbawa ang mga sensor ng gate o ang pagdaan dito, mainam na sumangguni sa isang rabbi."
      },
      {
        "question": "Puwede bang itakda ang timer ng gate para sa mga pista rin?",
        "answer": "Oo. Nagsisimula ang pista sa gabi, gaya ng Shabbat, kaya magdagdag ng isang beses na event sa bisperas ng pista hanggang hatinggabi at ng isang beses na event sa araw ng pista mula hatinggabi, hanggang 90 araw nang maaga. Sa petsa lang nito tumatakbo ang bawat ganitong event, at nagdudugtong ang dalawang event sa hatinggabi, kaya tuloy-tuloy na bukas ang gate. Ang pistang katabi ng Shabbat ay binubuo sa parehong paraan, mula sa isang araw hanggang sa susunod. Hindi puwedeng sumabay ang isang beses na event sa lingguhang event ng parehong araw, kaya sinasaklaw lang nito ang mga oras na hindi sakop ng lingguhang event."
      },
      {
        "question": "Kusa bang sumusunod ang gate sa oras ng pagsisimula ng Shabbat?",
        "answer": "Hindi. Hindi kinakalkula ng WIFIGATE ang oras ng pagsisindi ng kandila at ng pagtatapos ng Shabbat: nananatiling pareho bawat linggo ang mga oras na itinakda ninyo hanggang palitan ninyo ang mga ito. Sa Jerusalem, halimbawa, nagbabago ang oras ng pagsisindi ng kandila mula mga 16:00 sa taglamig hanggang mga 19:10 sa tag-init, kaya ina-update ninyo ang mga oras kapag nagbago ang panahon, o nagtatakda kayo nang maaga ng malawak na saklaw ng oras na angkop sa buong taon."
      },
      {
        "question": "Ano ang nangyayari kapag nawalan ng kuryente?",
        "answer": "Naka-save ang iskedyul sa device at hindi ito nabubura. Walang baterya ng orasan ang device, kaya pagbalik ng kuryente, hindi tatakbo ang mga event hangga't walang teleponong kumokonekta sa gate gamit ang app at nagtatakda ng oras. Hanggang sa mangyari iyon, gumagana ang gate gaya ng dati at hindi ito pinananatiling bukas, kahit nawalan ng kuryente habang Shabbat. Kung nawalan ng kuryente bago ang Shabbat, mainam na may kumonekta sa gate bago ito magsimula."
      },
      {
        "question": "Ano ang nangyayari kapag inilipat ang orasan sa oras ng tag-init o taglamig?",
        "answer": "Nakukuha ng device ang oras, at ang paglipat sa oras ng tag-init o taglamig, mula sa mga teleponong kumokonekta rito. Hangga't walang teleponong kumokonekta pagkatapos ng paglipat, maaaring tumakbo ang mga event nang isang oras na mas maaga o mas huli. Sa Israel, nagsisimula ang oras ng tag-init sa madaling-araw ng isang Biyernes, kaya mainam na sa araw na iyon ay may magbukas ng gate mula sa app bago ang Shabbat."
      },
      {
        "question": "Puwede bang buksan ang gate mula sa app habang may naka-iskedyul na event?",
        "answer": "Hindi. Habang may event, tinatanggihan ang mga utos na magbukas mula sa app at nananatili ang gate sa itinakdang estado. Nalalampasan ng pindutan ng teknisyan sa device ang event, halimbawa sa oras ng emerhensiya. Sa labas ng mga event, gumagana ang gate gaya ng dati."
      },
      {
        "question": "Puwede rin bang ikandado ang gate sa mga takdang oras, halimbawa sa gabi?",
        "answer": "Oo. Ang pulang event, ang event na sarado ang gate, ay nagpapanatiling sarado sa gate sa mga oras na itinakda ninyo, at ang berdeng event ay nagpapanatiling bukas dito. Hindi nagsasabay ang mga event, kaya hinahati ninyo ang araw sa mga oras na bukas at mga oras na sarado, hanggang 50 event sa kabuuan."
      },
      {
        "question": "Puwede ba itong ikabit sa kasalukuyang gate o harang?",
        "answer": "Kumokonekta ang WIFIGATE sa controller ng kasalukuyang gate o harang, kaya hindi kailangan ng hiwalay na timer sa panel ng kuryente, at sa labas ng mga event, patuloy na gumagana ang gate gamit ang mga remote at ang pindutan. Para malaman kung tugma ito sa inyong controller, ipadala sa amin sa WhatsApp ang mga detalye ng gate."
      },
      {
        "question": "Kailangan ba ng SIM, router o internet sa gate?",
        "answer": "Hindi. Naka-save at tumatakbo ang iskedyul sa device ng gate nang walang internet, walang SIM card at walang router. Direktang kumokonekta ang telepono sa device, kaya itinatakda ninyo ang mga event habang nasa tabi kayo ng gate."
      },
      {
        "question": "Para kanino ang Shabbat timer para sa gate?",
        "answer": "Para sa mga residensyal na gusali at sa kanilang mga komite, mga kompanyang namamahala ng gusali, mga kapitbahayan at komunidad na may awtomatikong gate o harang sa paradahan, mga sinagoga at institusyon, at anumang lugar kung saan kailangang manatiling bukas ang gate tuwing Shabbat at mga pista. Sa gusaling pinagsasaluhan, mainam na pagkasunduan ang mga oras kasama ng mga residente o ng komite ng gusali."
      },
      {
        "question": "Magkano ito? May buwanang bayad ba?",
        "answer": "Isang beses lang ang bayad para sa WIFIGATE device at pagkakabit, walang buwanang subscription at walang auto-debit, at kasama na ang mga naka-iskedyul na event. Para humingi ng presyo, magpadala sa amin ng mensahe sa WhatsApp."
      }
    ]
  }
};
