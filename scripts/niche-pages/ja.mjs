// scripts/niche-pages/ja.mjs
// Japanese content for the homepage "where" section + niche/use-case pages.

export default {
  home: {
    seoTitle: "WIFIGATE | ゲート・ドア・駐車場のスマート入退室管理",
    seoDescription:
      "WIFIGATE（WiFi Gate）は、スマートフォンからゲート、ドア、駐車場入口、シャッター、ガレージを開けられるスマート入退室管理システムです。月額契約なしで使える、ローカルで安全性に配慮した便利なソリューションです。",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, スマート入退室管理, スマホでゲートを開ける, 電動ゲート, ドアアクセス管理, 駐車場アクセス, 月額費用なし",
  },
  where: {
    title: "WIFIGATE はどこで使えますか？",
    subtitle:
      "WIFIGATE は、戸建て住宅から商業施設・組織向け環境まで、幅広い場所でアクセス管理をよりスマート、安全、便利にするためのソリューションです。",
  },
  niches: {
    "hotels-airbnb": {
      label: "ホテル、Airbnb、宿泊用アパート",
      title: "ホテル、Airbnb、宿泊用アパート向けのスマートアクセス",
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
        "WIFIGATE を使うと、宿泊者は物理キーやカードを受け取らずに、スマートフォンで便利で安全性に配慮したデジタルアクセスを受け取れます。フロントや物件オーナーとの不要な調整も減らせます。WIFIGATE API によって予約フローとアクセス管理を連携でき、予約が確定すると宿泊者に時間制限付きのゲストアクセスを自動発行できます。アクセスはチェックイン時刻に開始し、チェックアウト時刻に自動終了します。",
      bullets: [
        "予約確定後にゲストアクセスを自動作成",
        "WIFIGATE API によるフルオートメーションに対応",
        "宿泊日程と時間に合わせた一時アクセス",
        "手動チェックイン、鍵、カード、暗証番号の必要性を低減",
        "スタッフ、清掃、メンテナンス、業者の権限管理",
        "宿泊者にとってよりスムーズな到着体験",
        "チェックアウト時にアクセスを自動終了",
        "透明性と管理のためのアクセス履歴",
      ],
      seoTitle: "ホテル・Airbnb・宿泊用アパートのアクセス管理 | WIFIGATE API",
      seoDescription:
        "WIFIGATE は、ホテル、Airbnb、宿泊用アパート向けにスマートなデジタルアクセスを提供します。WIFIGATE API によるゲスト権限の自動化、予約に合わせた一時アクセス、鍵と手動チェックインの削減に対応します。",
      imageAlt: "モダンなホテルの廊下で宿泊者がスマートフォンを使って客室ドアを開けている様子",
    },
    "roller-shutters": {
      label: "店舗・事業者向けローラーシャッター",
      title: "店舗・事業者向けローラーシャッターのスマートで安全な操作",
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
        "店舗や事業所のローラーシャッターは、リモコン、鍵、外部キーボックス、屋外スイッチで操作されることがあります。これらは紛失したり、退職した従業員の手元に残ったり、複製されたり、外部に露出したアクセスポイントになる可能性があります。WIFIGATE は操作をアプリに移し、アクセス制御をより保護された内部側に置けるため、開閉をより便利にし、従業員や業者の権限を管理し、物理キーやリモコン、露出したアクセスポイントへの依存を減らします。",
      bullets: [
        "リモコンに頼らずスマートフォンで開閉",
        "紛失や複製の可能性がある鍵への依存を低減",
        "店舗外部に露出するアクセスポイントを削減",
        "シャッター周辺を見やすい状態で操作しやすい",
        "従業員、管理者、業者の権限管理",
        "時間や必要に応じた一時アクセス",
        "店舗、倉庫、サービス入口、事業所に対応",
        "日常運用に向いた内部設置の整理されたアクセス方法",
      ],
      seoTitle: "店舗・事業者向けローラーシャッターのスマート操作 | WIFIGATE",
      seoDescription:
        "WIFIGATE は、スマートフォンから店舗・事業者向けローラーシャッターを操作し、権限管理、鍵やリモコンへの依存低減、外部に露出したアクセスポイントの削減を支援します。",
      imageAlt: "店舗オーナーがスマートフォンで店舗のローラーシャッターを開けている様子",
    },
    "electric-gates": {
      label: "電動ゲートと駐車場バー",
      title: "電動ゲートと駐車場バーのスマートオープン",
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
        "電動ゲートや駐車場バーは、居住者、従業員、来訪者、業者が利用しますが、リモコン、暗証番号、電話での開門管理はすぐに複雑になります。WIFIGATE なら、スマートフォンでゲートを開け、常時または一時的なアクセスを共有し、固定ユーザーには Auto Open を使い、必要に応じてスケジュールイベントを設定できます。システムはローカルで安全性とプライバシーに配慮した運用を前提としており、月額契約は不要です。既存のリモコンもアプリ操作と併用できます。",
      bullets: [
        "スマートフォンで電動ゲートや駐車場バーを開ける",
        "月額契約なし、定期引き落としなし",
        "来訪者、業者、従業員へ一時アクセスを共有",
        "毎日利用する固定ユーザー向けの Auto Open",
        "曜日や時間に合わせたスケジュール開門",
        "アプリ操作と既存リモコンの併用に対応",
        "物理リモコンを配布する必要性を低減",
        "管理と透明性のための開門履歴",
      ],
      seoTitle: "月額なしの電動ゲート・駐車場バーアクセス管理 | WIFIGATE",
      seoDescription:
        "WIFIGATE は、スマートフォンから電動ゲートや駐車場バーを開けられるアクセス管理を提供します。Auto Open、スケジュールイベント、既存リモコン、権限管理に対応し、月額契約は不要です。",
      imageAlt: "ドライバーがスマートフォンで駐車場バーと電動ゲートを開けている様子",
    },
    "garage-doors": {
      label: "ガレージドアと専用駐車場",
      title: "ガレージドアと専用駐車場のスマートオープン",
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
        "ガレージドアや専用駐車場は、多くの場合、物理リモコンで操作されます。リモコンは紛失したり、アクセスが不要になった人の手元に残ったり、状況によっては複製される可能性があります。WIFIGATE は操作をスマートフォンのデジタルアクセスに移し、家族、従業員、来訪者の権限を管理し、リモコンや暗証番号を渡さずに一時アクセスを共有できます。",
      bullets: [
        "スマートフォンでガレージドアを開ける",
        "物理リモコンへの依存を低減",
        "リモコンの紛失、譲渡、複製によるリスクを低減",
        "家族、従業員、来訪者のアクセス管理",
        "リモコンや暗証番号を渡さずに一時アクセスを共有",
        "専用駐車場、戸建て、ガーデンアパートに対応",
        "よりローカルでプライバシーに配慮したアクセス管理",
        "日常利用で便利かつ安全性に配慮した操作",
      ],
      seoTitle: "ガレージドアと専用駐車場のスマートオープン | WIFIGATE",
      seoDescription:
        "WIFIGATE は、スマートフォンからガレージドアと専用駐車場を開けられます。物理リモコンへの依存を減らし、一時権限と便利でプライバシーに配慮したアクセス管理に対応します。",
      imageAlt: "モダンな住宅で男性がスマートフォンを使って専用ガレージドアを開けている様子",
    },
    "private-homes": {
      label: "戸建て住宅",
      title: "戸建て住宅向けのスマートで安全なアクセス",
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
        "戸建て住宅では、キーパッド、鍵、リモコンが弱点になることがあります。時間が経つとキーパッドのボタンに摩耗や跡が出たり、リモコンが紛失したり人の手に渡ったり、固定コードが配達員、サービススタッフ、来客に共有されたまま残ったりします。WIFIGATE なら、スマートフォンで入口を管理し、固定コードを公開せずに一時ゲストアクセスを共有し、鍵、コード、リモコンを交換せずに権限を簡単に取り消せます。",
      bullets: [
        "キーパッド、鍵、リモコンへの依存を低減",
        "配達員、来客、サービススタッフ向けの一時アクセス",
        "スマートフォンから権限を簡単に取り消し",
        "コード共有やリモコン譲渡によるリスクを低減",
        "戸建てのゲート、ドア、駐車場、ガレージに対応",
        "家族や固定ユーザーの管理が簡単",
        "日常の出入りをより便利に",
        "誰が入れるかをよりよく管理し、プライバシーを向上",
      ],
      seoTitle: "共用キーパッドコードなしの戸建てスマートアクセス | WIFIGATE",
      seoDescription:
        "WIFIGATE は、戸建て住宅でスマートフォンからアクセスを管理し、来客や配達員へ一時権限を共有し、キーパッド、鍵、リモコンへの依存を減らします。",
      imageAlt: "女性がキーパッドの代わりにスマートフォンで戸建て住宅の入口ゲートを開けている様子",
    },
    "residential-buildings": {
      label: "集合住宅",
      title: "集合住宅向けのスマートアクセス管理",
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
        "集合住宅では、共用の入口コードが居住者、来客、配達員、業者、サービススタッフの間にすぐ広がります。時間が経つと、誰が本当に建物へのアクセスを持っているのか、いつコードを変えるべきか、いつリモコンを回収すべきか分かりにくくなります。WIFIGATE は、居住者や管理組合がアクセスをより整理して管理し、一時ゲスト権限を発行し、共用コードへの依存を減らし、建物、ロビー、ゲート、駐車場入口の管理を改善します。",
      bullets: [
        "居住者がスマートフォンで便利にアクセス",
        "固定コードを公開せずに一時ゲスト招待",
        "居住者、業者、サービススタッフの権限管理",
        "ロビードア、ゲート、駐車場に対応",
        "キーパッド、鍵、リモコンへの依存を低減",
        "アクセス履歴による透明性の向上",
        "管理組合や管理会社にとって管理しやすい",
        "居住者と来客にとってより便利な入館体験",
      ],
      seoTitle: "集合住宅のアクセス管理 | WIFIGATE",
      seoDescription:
        "WIFIGATE は、集合住宅向けにスマートなアクセス管理を提供します。スマートフォンでの開錠、一時ゲスト権限、キーパッド依存の低減、透明性の向上に対応します。",
      imageAlt: "居住者がスマートフォンで集合住宅の入口を開けている様子",
    },
    "office-buildings": {
      label: "オフィスビル",
      title: "オフィスビル向けスマートアクセス",
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
        "オフィスビルでは、従業員、来訪者、業者、運用チームがスムーズに入館できる一方で、受付の負担を増やさず、鍵やカードを手作業で管理しないことが重要です。WIFIGATE は、従業員には固定権限、来訪者には一時権限を提供し、スマートフォンからアクセスを管理し、現代的なビジネス環境に合った整理された入退室管理を可能にします。",
      bullets: [
        "従業員とチーム向けの固定権限",
        "来訪者、業者、配達員向けの一時アクセス",
        "受付と運用チームの負担を軽減",
        "入口ドア、フロア、部屋、駐車場に対応",
        "ユーザーと権限を整理して管理",
        "鍵、アクセスカード、暗証番号への依存を低減",
        "ビルの印象をよりモダンで便利に",
        "管理と透明性のためのアクセス履歴",
      ],
      seoTitle: "オフィスビルのアクセス管理 | WIFIGATE",
      seoDescription:
        "WIFIGATE は、オフィスビルで従業員、来訪者、業者の入館をスマートフォンで管理できるようにします。一時権限と固定権限に対応した現代的なアクセス管理です。",
      imageAlt: "現代的なオフィスで従業員がスマートフォンを使ってガラスドアを開けている様子",
    },
    "entry-doors-magnetic-locks": {
      label: "事業者向け入口ドアとマグネットロック",
      title: "事業者向け入口ドアとマグネットロックのスマートオープン",
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
        "小規模事業者、クリニック、スタジオ、倉庫、オフィスでは、キーパッド、鍵、シンプルなマグネットロックを使うことがあります。コードが従業員、業者、来客の間で共有されたり、安全性を損なわずに一時アクセスを提供する必要が出たりすると、管理が難しくなります。WIFIGATE はスマートフォンから入口ドアを管理し、一時権限を共有し、固定コード、物理キー、毎回の手動調整の必要性を減らします。",
      bullets: [
        "電気錠またはマグネットロック付き入口ドアに対応",
        "従業員と管理者がスマートフォンで開錠",
        "来客、業者、サービススタッフ向けの一時アクセス",
        "キーパッドや固定コードの必要性を低減",
        "小規模事業者、クリニック、スタジオ、オフィスに対応",
        "権限管理をより簡単で安全性に配慮した形に",
        "物理キーの必要性を低減",
        "複雑なシステムなしで現代的な入口を求める事業者に便利",
      ],
      seoTitle: "事業者向け入口ドアとマグネットロック | WIFIGATE",
      seoDescription:
        "WIFIGATE は、事業者向け入口ドアとマグネットロックをスマートに開けられます。スマートフォンでの権限管理、一時アクセス、キーパッドや鍵への依存低減に対応します。",
      imageAlt: "利用者がスマートフォンで小規模店舗の入口ドアを開けている様子",
    },
    "sports-facilities": {
      label: "スポーツ施設",
      title: "スポーツ施設向けスマートアクセス管理",
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
        "スポーツ施設、Padel コート、テニスコート、ジム、トレーニング施設では、営業時間、予約、イベントに合わせて会員、コーチ、スタッフ、来場者のアクセスを管理する必要があります。WIFIGATE はスマートフォンから一時または固定のアクセスを提供し、共用の鍵やコードへの依存を減らし、時間帯によって人の流れが変わる施設での入場体験を改善します。",
      bullets: [
        "Padel、テニス、ジム、トレーニング施設に対応",
        "営業時間、予約、権限に合わせたアクセス",
        "会員、コーチ、従業員、来場者の管理",
        "共用鍵や共用コードへの依存を低減",
        "スマートフォンで素早く便利に入場",
        "営業時間が変動する施設にも対応",
        "イベント、レッスン、トレーニング向けの一時権限",
        "運用と管理のためのアクセス履歴",
      ],
      seoTitle: "スポーツ施設・Padel コートのアクセス管理 | WIFIGATE",
      seoDescription:
        "WIFIGATE は、スポーツ施設、Padel コート、ジム、トレーニング施設向けにスマートアクセス管理を提供します。スマートフォン入場と一時または固定権限に対応します。",
      imageAlt: "Padel 選手が照明付きスポーツコートの入口をスマートフォンで開けている様子",
    },
  },
};
