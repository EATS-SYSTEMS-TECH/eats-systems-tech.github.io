// scripts/niche-pages/ar.mjs
// Modern Standard Arabic (RTL) content for the niche pages, translated from the Hebrew (he.mjs) and English (en.mjs) source copy.

export default {
  home: {
    seoTitle: "WIFIGATE | تحكم ذكي بالوصول للبوابات والأبواب والمواقف",
    seoDescription:
      "WIFIGATE نظام تحكم ذكي بالوصول لفتح البوابات والأبواب والمواقف وأبواب الرول والكراجات من الهاتف. حل آمن ومحلي ومريح لمنزلك وعملك، من دون اشتراك شهري.",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, تحكم ذكي بالوصول, فتح البوابة من الهاتف, بوابة كهربائية, نظام تحكم بالدخول, فتح باب الكراج من الهاتف, بدون اشتراك شهري",
  },
  where: {
    title: "أين يمكن استخدام WIFIGATE؟",
    subtitle:
      "تناسب WIFIGATE مجموعة واسعة من البيئات، وتوفر حلاً ذكياً وآمناً ومريحاً لإدارة الوصول، من المنازل الخاصة وحتى البيئات التجارية والمؤسسية.",
  },
  niches: {
    "hotels-airbnb": {
      label: "الفنادق وAirbnb وشقق الضيافة",
      title: "وصول ذكي للفنادق وAirbnb وشقق الضيافة",
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
        "تتيح WIFIGATE للضيوف الحصول على وصول رقمي مريح وآمن مباشرة على هواتفهم، من دون مفاتيح فعلية ولا بطاقات ولا تنسيق لا داعي له مع الاستقبال أو مالك العقار. وعبر WIFIGATE API يمكن ربط عملية الحجز بنظام الوصول، بحيث يحصل الضيف تلقائياً فور تأكيد الحجز على صلاحية ضيف محدودة زمنياً. يبدأ الوصول عند موعد تسجيل الوصول وينتهي تلقائياً عند تسجيل المغادرة، ما يقلل بشكل كبير من الحاجة إلى تسليم المفاتيح أو مشاركة الرموز أو التعامل اليدوي مع كل ضيف.",
      bullets: [
        "إنشاء صلاحية ضيف تلقائياً بعد تأكيد الحجز",
        "دعم الأتمتة الكاملة عبر WIFIGATE API",
        "وصول مؤقت وفق تواريخ الإقامة وساعاتها",
        "حاجة أقل لتسجيل الوصول اليدوي أو المفاتيح أو البطاقات أو الرموز",
        "إدارة صلاحيات للطاقم وعمال النظافة والصيانة والموردين",
        "تجربة وصول أكثر سلاسة وراحة للضيوف",
        "انتهاء الوصول تلقائياً عند موعد تسجيل المغادرة",
        "سجل وصول يوفر الشفافية والمتابعة",
      ],
      seoTitle: "التحكم بالوصول للفنادق وAirbnb وشقق الضيافة | WIFIGATE API",
      seoDescription:
        "توفر WIFIGATE وصولاً رقمياً ذكياً للفنادق وAirbnb وشقق الضيافة، مع أتمتة صلاحيات الضيوف عبر WIFIGATE API، ووصول مؤقت حسب الحجز، ومفاتيح أقل، وتسجيل وصول يدوي أقل.",
      imageAlt: "ضيوف يفتحون باب غرفة في فندق باستخدام الهاتف في ممر عصري",
    },
    "roller-shutters": {
      label: "أبواب الرول للمحلات والأعمال",
      title: "تحكم ذكي وأكثر أماناً بأبواب الرول للمحلات والأعمال",
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
        "كثيراً ما يتم تشغيل أبواب الرول في المحلات والمصالح التجارية عبر أجهزة الريموت أو المفاتيح أو صندوق مفتاح خارجي أو مفاتيح تشغيل مثبتة خارج المكان. حلول كهذه قد تُفقد، أو تبقى بحوزة موظفين سابقين، أو تُنسخ، أو تتحول إلى نقطة وصول مكشوفة. كما أن الفتح أو الإغلاق بالمفتاح يعني الوقوف مباشرة بجانب نقطة التشغيل والإمساك بالمفتاح باليد، وأحياناً فقدان رؤية مريحة لمنطقة الباب. تنقل WIFIGATE التحكم إلى التطبيق وتضع التحكم بالوصول في الجهة الداخلية الأكثر حماية، بحيث يمكن الفتح والإغلاق براحة أكبر، وإدارة صلاحيات الموظفين والموردين، وتقليل الاعتماد على المفاتيح وأجهزة الريموت ونقاط الوصول المكشوفة.",
      bullets: [
        "فتح وإغلاق من الهاتف من دون الاعتماد على أجهزة الريموت",
        "اعتماد أقل على مفاتيح يمكن نسخها أو فقدانها",
        "نقاط وصول مكشوفة أقل خارج المكان",
        "تحكم أكثر راحة مع رؤية أفضل لمنطقة الباب",
        "إدارة صلاحيات للموظفين والمديرين والموردين",
        "إمكانية منح وصول مؤقت حسب الوقت أو الحاجة",
        "مناسب للمحلات والمخازن ومداخل الخدمة والمصالح التجارية",
        "حل داخلي أكثر تنظيماً وأماناً للتشغيل اليومي",
      ],
      seoTitle: "تحكم ذكي بأبواب الرول للمحلات والأعمال | WIFIGATE",
      seoDescription:
        "تمنح WIFIGATE المحلات والمصالح التجارية تحكماً ذكياً بأبواب الرول من الهاتف، مع إدارة صلاحيات، واعتماد أقل على المفاتيح وأجهزة الريموت، ونقاط وصول مكشوفة أقل خارج المكان.",
      imageAlt: "صاحب محل يفتح باب الرول لمحله باستخدام الهاتف",
    },
    "electric-gates": {
      label: "البوابات الكهربائية وحواجز المواقف",
      title: "فتح ذكي للبوابات الكهربائية وحواجز المواقف",
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
        "تخدم البوابات الكهربائية وحواجز المواقف السكان والموظفين والضيوف والموردين، لكن إدارة أجهزة الريموت والرموز ومكالمات «افتحوا البوابة» تتحول سريعاً إلى عبء. تتيح WIFIGATE فتح البوابة من الهاتف، ومشاركة وصول دائم أو مؤقت، واستخدام الفتح التلقائي للمستخدمين الدائمين، وإعداد أحداث مجدولة حسب الحاجة. صُمم النظام للعمل بشكل محلي وآمن يحافظ على الخصوصية، من دون اشتراك شهري أو دفعات دورية، مع إمكانية مواصلة استخدام أجهزة الريموت الحالية إلى جانب التحكم من التطبيق.",
      bullets: [
        "فتح بوابة كهربائية أو حاجز مواقف من الهاتف",
        "من دون اشتراك شهري ولا دفعات دورية",
        "مشاركة وصول مؤقت مع الضيوف والموردين والموظفين",
        "خاصية Auto Open للمستخدمين الدائمين في الدخول اليومي",
        "أحداث مجدولة للفتح حسب الأيام والساعات",
        "تحكم من التطبيق أو عبر أجهزة الريموت الحالية",
        "حاجة أقل لتوزيع أجهزة ريموت فعلية",
        "سجل عمليات الفتح للمتابعة والشفافية",
      ],
      seoTitle: "تحكم بالوصول للبوابات الكهربائية وحواجز المواقف بلا اشتراك | WIFIGATE",
      seoDescription:
        "تفتح WIFIGATE البوابات الكهربائية وحواجز المواقف من الهاتف، مع Auto Open وأحداث مجدولة ودعم أجهزة الريموت الحالية وإدارة صلاحيات، من دون اشتراك شهري أو دفعات دورية.",
      imageAlt: "سائق يفتح حاجز مواقف وبوابة كهربائية باستخدام الهاتف",
    },
    "garage-doors": {
      label: "أبواب الكراجات والمواقف الخاصة",
      title: "فتح ذكي لأبواب الكراجات والمواقف الخاصة",
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
        "عادةً ما تُشغَّل أبواب الكراجات ومداخل المواقف الخاصة بأجهزة ريموت فعلية، قد تُفقد أحياناً، أو تبقى لدى أشخاص لم يعودوا بحاجة إلى الوصول، أو تُنسخ في حالات معينة. تنقل WIFIGATE التحكم إلى وصول رقمي من الهاتف، وتتيح إدارة صلاحيات أفراد العائلة أو الموظفين أو الضيوف، ومشاركة وصول مؤقت من دون تسليم ريموت أو رمز. والنتيجة تجربة استخدام أكثر راحة وخصوصية وتنظيماً، مع اعتماد أقل على وسائل الوصول الفعلية.",
      bullets: [
        "فتح باب الكراج من الهاتف",
        "اعتماد أقل على أجهزة الريموت الفعلية",
        "تقليل المخاطر الناتجة عن فقدان الريموت أو نقله أو نسخه",
        "إدارة وصول لأفراد العائلة والموظفين والضيوف",
        "وصول مؤقت من دون تسليم ريموت أو رمز",
        "مناسب للمواقف الخاصة والمنازل والشقق الأرضية",
        "طريقة أكثر محلية وخصوصية لإدارة الوصول",
        "تحكم يومي أكثر راحة وأماناً",
      ],
      seoTitle: "فتح ذكي لأبواب الكراجات والمواقف الخاصة | WIFIGATE",
      seoDescription:
        "تتيح WIFIGATE فتح أبواب الكراجات ومداخل المواقف الخاصة من الهاتف، مع اعتماد أقل على أجهزة الريموت الفعلية، وصلاحيات مؤقتة، وإدارة وصول أكثر راحة وخصوصية.",
      imageAlt: "رجل يفتح باب كراج خاص باستخدام الهاتف في منزل عصري",
    },
    "private-homes": {
      label: "المنازل الخاصة",
      title: "وصول ذكي وآمن للمنازل الخاصة",
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
        "في المنازل الخاصة، قد تتحول لوحات الأرقام والمفاتيح وأجهزة الريموت إلى نقطة ضعف. فمع الوقت يظهر تآكل أو علامات على أزرار لوحة الأرقام، وقد تُفقد أجهزة الريموت أو تنتقل بين الأشخاص، وأحياناً يُعطى الرمز لعمال التوصيل أو مقدمي الخدمات أو الضيوف ويبقى لديهم حتى بعد انتهاء الحاجة إليه. تتيح WIFIGATE إدارة المدخل من الهاتف، ومشاركة وصول ضيف مؤقت من دون كشف رمز ثابت، وإلغاء الصلاحيات بسهولة من دون استبدال الأقفال أو الرموز أو أجهزة الريموت.",
      bullets: [
        "اعتماد أقل على لوحة الأرقام والمفاتيح وأجهزة الريموت",
        "وصول مؤقت لعمال التوصيل والضيوف ومقدمي الخدمات",
        "إلغاء الصلاحيات بسهولة من الهاتف",
        "تقليل المخاطر الناتجة عن مشاركة الرموز أو تداول أجهزة الريموت",
        "مناسب للبوابات والأبواب والمواقف والكراجات في المنزل الخاص",
        "إدارة بسيطة لأفراد العائلة والمستخدمين الدائمين",
        "تجربة دخول يومية أكثر راحة",
        "خصوصية وتحكم أفضل في من يمكنه الدخول",
      ],
      seoTitle: "وصول ذكي للمنازل الخاصة من دون رمز مشترك | WIFIGATE",
      seoDescription:
        "تتيح WIFIGATE للمنازل الخاصة إدارة الوصول من الهاتف، ومشاركة صلاحيات مؤقتة مع الضيوف وعمال التوصيل، وتقليل الاعتماد على لوحات الأرقام والمفاتيح وأجهزة الريموت.",
      imageAlt: "امرأة تفتح بوابة منزل خاص باستخدام الهاتف بدلاً من لوحة الأرقام",
    },
    "residential-buildings": {
      label: "المباني السكنية",
      title: "إدارة وصول ذكية للمباني السكنية",
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
        "في المباني السكنية، ينتشر رمز الدخول المشترك سريعاً بين السكان والضيوف وعمال التوصيل والموردين ومقدمي الخدمات. ومع الوقت يصبح من الصعب معرفة من يملك فعلياً وصولاً إلى المبنى، ومتى يجب تغيير الرمز أو استرجاع أجهزة الريموت. تتيح WIFIGATE للسكان وللجنة المبنى إدارة الوصول بطريقة أكثر تنظيماً، ومنح صلاحيات ضيف مؤقتة، وتقليل الاعتماد على رمز مشترك، والحفاظ على تحكم أفضل بالدخول إلى المبنى أو اللوبي أو البوابة أو المواقف.",
      bullets: [
        "وصول مريح للسكان عبر الهاتف",
        "دعوات ضيف مؤقتة من دون كشف رمز ثابت",
        "إدارة صلاحيات للسكان والموردين ومقدمي الخدمات",
        "مناسب لأبواب اللوبي والبوابات ومداخل المواقف",
        "اعتماد أقل على لوحات الأرقام والمفاتيح وأجهزة الريموت",
        "شفافية أفضل عبر سجل الوصول",
        "إدارة أبسط للجنة المبنى أو شركة الإدارة",
        "تجربة دخول أكثر راحة للسكان والضيوف",
      ],
      seoTitle: "التحكم بالوصول للمباني السكنية | WIFIGATE",
      seoDescription:
        "توفر WIFIGATE إدارة وصول ذكية للمباني السكنية، مع دخول من الهاتف، وصلاحيات ضيف مؤقتة، واعتماد أقل على لوحات الأرقام والمفاتيح، وشفافية أفضل عبر سجل الوصول.",
      imageAlt: "ساكنة تفتح مدخل مبنى سكني باستخدام الهاتف",
    },
    "office-buildings": {
      label: "مباني المكاتب",
      title: "وصول ذكي لمباني المكاتب",
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
        "تحتاج مباني المكاتب إلى منح الموظفين والزوار والموردين وفرق التشغيل دخولاً مريحاً، من دون إثقال موظفي الاستقبال ومن دون إدارة المفاتيح أو البطاقات يدوياً. تتيح WIFIGATE منح صلاحيات دائمة للموظفين وصلاحيات مؤقتة للزوار، والتحكم بالوصول من الهاتف، وإدارة الدخول بطريقة تناسب بيئة عمل عصرية ونظيفة ومنظمة.",
      bullets: [
        "صلاحيات دائمة للموظفين والفرق",
        "وصول مؤقت للزوار والموردين وعمال التوصيل",
        "عبء أقل على الاستقبال وفريق التشغيل",
        "مناسب لأبواب المداخل والطوابق والغرف والمواقف",
        "إدارة منظمة للمستخدمين والصلاحيات",
        "اعتماد أقل على المفاتيح وبطاقات الدخول والرموز",
        "صورة أكثر عصرية وراحة للمبنى",
        "سجل وصول للمتابعة والشفافية",
      ],
      seoTitle: "التحكم بالوصول لمباني المكاتب | WIFIGATE",
      seoDescription:
        "تتيح WIFIGATE لمباني المكاتب إدارة دخول الموظفين والزوار والموردين من الهاتف، مع صلاحيات مؤقتة ودائمة، وعبء أقل على الاستقبال، وإدارة وصول عصرية ومنظمة.",
      imageAlt: "موظفة تفتح باباً زجاجياً في مكتب عصري باستخدام الهاتف",
    },
    "entry-doors-magnetic-locks": {
      label: "أبواب المداخل والأقفال المغناطيسية للأعمال",
      title: "فتح ذكي لأبواب مداخل الأعمال والأقفال المغناطيسية",
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
        "كثيراً ما تعتمد المصالح التجارية الصغيرة والعيادات والاستوديوهات والمخازن والمكاتب على لوحة أرقام أو مفتاح أو قفل مغناطيسي بسيط. وتبدأ المشكلة عندما ينتقل الرمز بين الموظفين والموردين والضيوف، أو عند الحاجة إلى منح وصول مؤقت من دون المساس بالأمان. تتيح WIFIGATE إدارة باب المدخل من الهاتف، ومشاركة صلاحيات مؤقتة، وتقليل الحاجة إلى رموز ثابتة أو مفاتيح فعلية أو تنسيق يدوي عند كل دخول.",
      bullets: [
        "مناسب لأبواب المداخل المزودة بقفل كهربائي أو مغناطيسي",
        "فتح من الهاتف للموظفين والمديرين",
        "وصول مؤقت للضيوف والموردين ومقدمي الخدمات",
        "حاجة أقل إلى لوحة أرقام أو رمز ثابت",
        "مناسب للمصالح التجارية الصغيرة والعيادات والاستوديوهات والمكاتب",
        "إدارة صلاحيات أبسط وأكثر أماناً",
        "تقليل الحاجة إلى المفاتيح الفعلية",
        "خيار مريح لأعمال تريد دخولاً عصرياً من دون نظام معقد",
      ],
      seoTitle: "أبواب المداخل والأقفال المغناطيسية للأعمال | WIFIGATE",
      seoDescription:
        "توفر WIFIGATE فتحاً ذكياً لأبواب مداخل الأعمال والأقفال المغناطيسية، مع إدارة صلاحيات من الهاتف، ووصول مؤقت، واعتماد أقل على لوحات الأرقام والمفاتيح.",
      imageAlt: "زبونة تفتح باب مدخل مصلحة تجارية صغيرة باستخدام الهاتف",
    },
    "sports-facilities": {
      label: "المنشآت الرياضية",
      title: "تحكم ذكي بالوصول للمنشآت الرياضية",
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
        "تحتاج المنشآت الرياضية وملاعب البادل وملاعب التنس والصالات الرياضية ومجمعات التدريب إلى إدارة وصول المشتركين والمدربين والفرق والضيوف وفق ساعات النشاط والحجوزات والفعاليات. تتيح WIFIGATE منح وصول مؤقت أو دائم من الهاتف، وتقليل الاعتماد على مفتاح أو رمز مشترك، وتحسين تجربة الدخول للمستخدمين، خصوصاً في المجمعات التي تشهد حركة متغيرة على مدار اليوم.",
      bullets: [
        "مناسب لملاعب البادل والتنس والصالات الرياضية ومجمعات التدريب",
        "وصول وفق ساعات النشاط أو الحجوزات أو الصلاحيات",
        "إدارة المشتركين والمدربين والموظفين والضيوف",
        "اعتماد أقل على المفاتيح والرموز المشتركة",
        "دخول سريع ومريح من الهاتف",
        "مناسب للمجمعات ذات ساعات النشاط المتغيرة",
        "صلاحيات مؤقتة للفعاليات أو الدروس أو التدريبات",
        "سجل وصول للمتابعة والتشغيل",
      ],
      seoTitle: "التحكم بالوصول للمنشآت الرياضية وملاعب البادل | WIFIGATE",
      seoDescription:
        "توفر WIFIGATE تحكماً ذكياً بالوصول للمنشآت الرياضية وملاعب البادل والصالات الرياضية ومجمعات التدريب، مع دخول من الهاتف وصلاحيات مؤقتة أو دائمة.",
      imageAlt: "لاعبة بادل تفتح مدخل ملعب رياضي مضاء باستخدام الهاتف",
    },
  },
};
