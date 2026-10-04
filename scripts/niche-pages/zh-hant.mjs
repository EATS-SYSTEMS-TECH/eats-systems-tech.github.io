// scripts/niche-pages/zh-hant.mjs
// Traditional Chinese content for the homepage "where" section + niche/use-case pages.

export default {
  home: {
    seoTitle: "WIFIGATE | 適用於大門、門禁與停車場的智慧門禁控制",
    seoDescription:
      "WIFIGATE（WiFi Gate）可透過手機開啟大門、門、停車入口、鐵捲門與車庫門。這是一套在地、安全、便利且無月費的智慧門禁控制方案。",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, 智慧門禁控制, 手機開門, 電動大門, 門禁系統, 停車場門禁, 無月費",
  },
  where: {
    title: "WIFIGATE 適合用在哪裡？",
    subtitle:
      "WIFIGATE 適用於多種環境，能為私人住宅、商業空間與組織場域提供智慧、安全且便利的出入管理方案。",
  },
  niches: {
    "hotels-airbnb": {
      label: "飯店、Airbnb 與短租公寓",
      title: "飯店、Airbnb 與短租公寓的智慧出入管理",
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
        "WIFIGATE 讓住客直接在手機上取得便利、安全的數位出入權限，不需要實體鑰匙、房卡，也能減少與櫃台或房東反覆協調。透過 WIFIGATE API，可以把訂房流程與出入系統串接；訂單確認後，住客可自動取得限時訪客權限。權限從入住時間開始，在退房時間自動結束，降低交付鑰匙、密碼與人工處理的需求。",
      bullets: [
        "訂單確認後自動建立訪客權限",
        "支援透過 WIFIGATE API 完整自動化",
        "依住宿日期與時間提供臨時出入權限",
        "減少人工入住、鑰匙、房卡或密碼需求",
        "管理員工、清潔、維護與供應商權限",
        "讓住客抵達體驗更順暢",
        "退房時權限自動結束",
        "出入紀錄便於透明管理與控管",
      ],
      seoTitle: "飯店、Airbnb 與短租公寓門禁控制 | WIFIGATE API",
      seoDescription:
        "WIFIGATE 為飯店、Airbnb 與短租公寓提供智慧數位出入管理，包含透過 WIFIGATE API 自動化訪客權限、依訂單提供臨時權限、減少鑰匙與人工入住流程。",
      imageAlt: "住客在現代飯店走廊用手機打開客房門",
    },
    "roller-shutters": {
      label: "商店與企業鐵捲門",
      title: "商店與企業鐵捲門的智慧、安全控制",
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
        "商店與企業的鐵捲門常由遙控器、鑰匙、外部鑰匙盒或室外開關控制。這些方式可能遺失、留在離職員工手中、被複製，或成為外露的出入點。WIFIGATE 可把控制移到手機應用程式，並把出入控制放在更受保護的內部位置，讓開關鐵捲門更方便，同時管理員工與供應商權限，降低對實體鑰匙、遙控器和外露出入點的依賴。",
      bullets: [
        "不依賴遙控器即可用手機開啟與關閉",
        "降低對可能遺失或複製鑰匙的依賴",
        "減少企業外部外露的出入點",
        "能更好掌握鐵捲門區域狀況並進行控制",
        "管理員工、主管與供應商權限",
        "可依時間或需求提供臨時出入權限",
        "適用於商店、倉庫、服務入口與企業場域",
        "更適合日常營運的內部、規範、安全方案",
      ],
      seoTitle: "商店與企業鐵捲門智慧控制 | WIFIGATE",
      seoDescription:
        "WIFIGATE 可透過手機智慧控制商店與企業鐵捲門，支援權限管理，降低對鑰匙和遙控器的依賴，並減少外部外露出入點。",
      imageAlt: "店主用手機打開商店鐵捲門",
    },
    "electric-gates": {
      label: "電動大門與停車場柵欄",
      title: "電動大門與停車場柵欄的智慧開啟",
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
        "電動大門與停車場柵欄需要服務住戶、員工、訪客與供應商，但遙控器、密碼與電話開門很快會變得難以管理。WIFIGATE 可透過手機開門、分享固定或臨時出入權限、為固定使用者啟用 Auto Open，並依需要設定排程事件。系統採在地、安全且重視隱私的運作方式，不需要月費，也可與既有遙控器並行使用。",
      bullets: [
        "用手機開啟電動大門或停車場柵欄",
        "無月費，也無固定扣款",
        "向訪客、供應商與員工分享臨時權限",
        "固定使用者日常進出可使用 Auto Open",
        "依日期與時間設定排程開啟事件",
        "支援應用程式控制，也可保留既有遙控器",
        "減少分發實體遙控器的需求",
        "開啟紀錄便於控管與透明管理",
      ],
      seoTitle: "無月費電動大門與停車場柵欄門禁控制 | WIFIGATE",
      seoDescription:
        "WIFIGATE 可透過手機智慧開啟電動大門與停車場柵欄，支援 Auto Open、排程事件、既有遙控器、權限管理，且無月費或固定扣款。",
      imageAlt: "駕駛用手機開啟停車場柵欄和電動大門",
    },
    "garage-doors": {
      label: "車庫門與私人車位",
      title: "車庫門與私人車位的智慧開啟",
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
        "車庫門與私人車位通常由實體遙控器控制，而遙控器可能遺失、留在不再需要權限的人手中，或在某些情況下被複製。WIFIGATE 將控制轉為手機上的數位出入權限，方便管理家人、員工或訪客權限，並可在不交出遙控器或密碼的情況下分享臨時權限。",
      bullets: [
        "用手機開啟車庫門",
        "降低對實體遙控器的依賴",
        "降低遙控器遺失、轉交或複製帶來的風險",
        "管理家人、員工與訪客出入權限",
        "不交出遙控器或密碼即可提供臨時權限",
        "適合私人車位、住宅與花園公寓",
        "更在地、更重視隱私的出入管理方案",
        "日常使用更方便、更安全",
      ],
      seoTitle: "車庫門與私人車位智慧開啟 | WIFIGATE",
      seoDescription:
        "WIFIGATE 可透過手機智慧開啟車庫門與私人車位，降低對實體遙控器的依賴，支援臨時權限和更便利、更私密的出入管理。",
      imageAlt: "男子在現代住宅用手機打開私人車庫門",
    },
    "private-homes": {
      label: "私人住宅",
      title: "私人住宅的智慧、安全出入",
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
        "在私人住宅中，鍵盤密碼、鑰匙與遙控器都可能成為弱點。時間久了，鍵盤按鍵可能出現磨損痕跡，遙控器可能遺失或轉交他人，固定密碼也可能交給外送、服務人員或訪客後一直保留。WIFIGATE 可透過手機管理入口，在不暴露固定密碼的情況下分享臨時訪客權限，並能輕鬆取消權限，無需更換鎖具、密碼或遙控器。",
      bullets: [
        "降低對鍵盤密碼、鑰匙和遙控器的依賴",
        "為外送、訪客和服務人員提供臨時權限",
        "可從手機輕鬆取消權限",
        "降低分享密碼或轉交遙控器帶來的風險",
        "適用於私人住宅的大門、門、車位和車庫",
        "便於管理家人與固定使用者",
        "日常進出更便利",
        "更好掌控誰可以進入，提升隱私與控制",
      ],
      seoTitle: "無需共用鍵盤密碼的私人住宅智慧出入 | WIFIGATE",
      seoDescription:
        "WIFIGATE 協助私人住宅透過手機管理出入，向訪客和外送分享臨時權限，並降低對鍵盤密碼、鑰匙與遙控器的依賴。",
      imageAlt: "女子不用鍵盤密碼，而是用手機打開私人住宅入口大門",
    },
    "residential-buildings": {
      label: "住宅大樓",
      title: "住宅大樓的智慧出入管理",
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
        "住宅大樓的共用入口密碼很快會在住戶、訪客、外送、供應商和服務人員之間流傳。時間久了，很難知道誰真正擁有進入權限，也不清楚何時該更換密碼或收回遙控器。WIFIGATE 讓住戶和管委會更有秩序地管理出入，提供臨時訪客權限，降低對共用密碼的依賴，並更好控管大樓、門廳、大門或停車場入口。",
      bullets: [
        "住戶可透過手機便利進入",
        "不暴露固定密碼即可發送臨時訪客邀請",
        "管理住戶、供應商和服務人員權限",
        "適用於門廳門、大門與停車場",
        "降低對鍵盤密碼、鑰匙和遙控器的依賴",
        "透過出入紀錄提升透明度",
        "方便管委會或物業公司管理",
        "讓住戶和訪客進出更便利",
      ],
      seoTitle: "住宅大樓門禁控制 | WIFIGATE",
      seoDescription:
        "WIFIGATE 為住宅大樓提供智慧出入管理，包括手機開門、臨時訪客權限、降低對鍵盤密碼的依賴，以及更好的透明度。",
      imageAlt: "住戶用手機打開住宅大樓入口",
    },
    "office-buildings": {
      label: "辦公大樓",
      title: "辦公大樓的智慧出入",
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
        "辦公大樓需要讓員工、訪客、供應商與營運團隊順暢進出，同時避免增加櫃台負擔，也不希望人工管理鑰匙或卡片。WIFIGATE 可為員工提供固定權限，為訪客提供臨時權限，透過手機控制出入，並以適合現代商業環境的方式管理入口。",
      bullets: [
        "為員工和團隊提供固定權限",
        "為訪客、供應商和外送提供臨時權限",
        "減輕櫃台與營運團隊負擔",
        "適用於入口門、樓層、房間和停車場",
        "有序管理使用者與權限",
        "降低對鑰匙、門禁卡和密碼的依賴",
        "讓大樓形象更現代、更便利",
        "出入紀錄便於控管與透明管理",
      ],
      seoTitle: "辦公大樓門禁控制 | WIFIGATE",
      seoDescription:
        "WIFIGATE 協助辦公大樓透過手機管理員工、訪客和供應商進入，支援臨時與固定權限，提供現代化出入管理。",
      imageAlt: "員工在現代辦公室用手機打開玻璃門",
    },
    "entry-doors-magnetic-locks": {
      label: "企業入口門與磁力鎖",
      title: "企業入口門與磁力鎖的智慧開啟",
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
        "小型企業、診所、工作室、倉庫和辦公室常使用鍵盤密碼、鑰匙或簡單磁力鎖。當密碼在員工、供應商和訪客之間流傳，或需要在不影響安全控管的前提下提供臨時權限時，問題就會出現。WIFIGATE 可透過手機管理入口門，分享臨時權限，並降低固定密碼、實體鑰匙或每次人工協調的需求。",
      bullets: [
        "適用於配有電鎖或磁力鎖的入口門",
        "員工和管理者可用手機開門",
        "為訪客、供應商和服務人員提供臨時權限",
        "減少對鍵盤或固定密碼的需求",
        "適合小型企業、診所、工作室和辦公室",
        "權限管理更簡單、更安全",
        "減少實體鑰匙需求",
        "適合想要現代入口、但不想部署複雜系統的企業",
      ],
      seoTitle: "企業入口門與磁力鎖 | WIFIGATE",
      seoDescription:
        "WIFIGATE 可智慧開啟企業入口門和磁力鎖，透過手機管理權限、提供臨時出入，並降低對鍵盤密碼和鑰匙的依賴。",
      imageAlt: "顧客用手機打開小型企業入口門",
    },
    "sports-facilities": {
      label: "運動設施",
      title: "運動設施的智慧門禁控制",
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
        "運動設施、Padel 球場、網球場、健身房和訓練中心需要依營業時間、預約和活動管理會員、教練、員工與訪客出入。WIFIGATE 可透過手機提供臨時或固定權限，降低對共用鑰匙或密碼的依賴，並改善人流全天變動場域的進入體驗。",
      bullets: [
        "適用於 Padel 球場、網球場、健身房和訓練中心",
        "依營業時間、預約或權限提供出入",
        "管理會員、教練、員工和訪客",
        "降低對共用鑰匙和密碼的依賴",
        "透過手機快速、便利進入",
        "適合營業時間變動的場域",
        "為活動、課程或訓練提供臨時權限",
        "出入紀錄便於營運和控管",
      ],
      seoTitle: "運動設施與 Padel 球場門禁控制 | WIFIGATE",
      seoDescription:
        "WIFIGATE 為運動設施、Padel 球場、健身房和訓練中心提供智慧門禁控制，支援手機進入與臨時或固定權限。",
      imageAlt: "Padel 運動員用手機打開燈光球場入口",
    },
  },
};
