// scripts/niche-pages/ko.mjs
// Korean content for the homepage "where" section + niche/use-case pages.

export default {
  home: {
    seoTitle: "WIFIGATE | 게이트, 출입문, 주차장을 위한 스마트 출입 관리",
    seoDescription:
      "WIFIGATE(WiFi Gate)는 휴대폰으로 게이트, 출입문, 주차장 입구, 셔터, 차고문을 열 수 있는 스마트 출입 관리 시스템입니다. 월 구독료 없이 로컬 중심으로 안전하고 편리하게 사용할 수 있습니다.",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, 스마트 출입 관리, 휴대폰으로 게이트 열기, 전동 게이트, 출입문 관리, 주차장 출입, 월 구독료 없음",
  },
  where: {
    title: "WIFIGATE는 어디에 적합한가요?",
    subtitle:
      "WIFIGATE는 개인 주택부터 상업 및 조직 환경까지 다양한 장소에 적합하며, 출입 관리를 더 스마트하고 안전하며 편리하게 만들어 줍니다.",
  },
  niches: {
    "hotels-airbnb": {
      label: "호텔, Airbnb, 게스트 아파트",
      title: "호텔, Airbnb, 게스트 아파트를 위한 스마트 출입",
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
        "WIFIGATE를 사용하면 투숙객이 실물 열쇠나 카드 없이 휴대폰으로 편리하고 안전한 디지털 출입 권한을 받을 수 있습니다. 프런트나 숙소 관리자와의 불필요한 조율도 줄어듭니다. WIFIGATE API를 통해 예약 과정과 출입 시스템을 연결하면, 예약이 승인되는 즉시 시간 제한이 있는 게스트 출입 권한을 자동으로 발급할 수 있습니다. 권한은 체크인 시간에 시작되고 체크아웃 시간에 자동 종료됩니다.",
      bullets: [
        "예약 승인 후 게스트 출입 권한 자동 생성",
        "WIFIGATE API를 통한 전체 자동화 지원",
        "숙박 날짜와 시간에 따른 임시 출입 권한",
        "수동 체크인, 열쇠, 카드, 코드 필요성 감소",
        "직원, 청소, 유지보수, 공급업체 권한 관리",
        "투숙객에게 더 매끄러운 도착 경험 제공",
        "체크아웃 시 출입 권한 자동 종료",
        "투명성과 관리를 위한 출입 기록",
      ],
      seoTitle: "호텔, Airbnb, 게스트 아파트 출입 관리 | WIFIGATE API",
      seoDescription:
        "WIFIGATE는 호텔, Airbnb, 게스트 아파트에 스마트 디지털 출입을 제공합니다. WIFIGATE API 기반 게스트 권한 자동화, 예약 기반 임시 권한, 열쇠와 수동 체크인 감소를 지원합니다.",
      imageAlt: "현대적인 호텔 복도에서 투숙객이 휴대폰으로 객실 문을 여는 모습",
    },
    "roller-shutters": {
      label: "매장과 비즈니스용 롤러 셔터",
      title: "매장과 비즈니스용 롤러 셔터의 스마트하고 안전한 제어",
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
        "매장과 비즈니스의 롤러 셔터는 리모컨, 열쇠, 외부 키 박스 또는 실외 스위치로 제어되는 경우가 많습니다. 이런 방식은 분실되거나 퇴사자에게 남아 있거나 복제될 수 있으며, 외부에 노출된 출입 지점이 될 수도 있습니다. WIFIGATE는 제어를 앱으로 옮기고 출입 관리를 더 보호된 내부 위치에 둘 수 있게 해, 더 편리하게 열고 닫고 직원과 공급업체의 권한을 관리하며 실물 열쇠, 리모컨, 노출된 접근 지점에 대한 의존을 줄입니다.",
      bullets: [
        "리모컨에 의존하지 않고 휴대폰으로 열고 닫기",
        "분실 또는 복제될 수 있는 열쇠 의존도 감소",
        "비즈니스 외부에 노출된 접근 지점 감소",
        "셔터 주변을 더 잘 보면서 편리하게 제어",
        "직원, 관리자, 공급업체 권한 관리",
        "시간 또는 필요에 따른 임시 출입 권한",
        "매장, 창고, 서비스 입구, 비즈니스 공간에 적합",
        "일상 운영을 위한 내부 중심의 정돈되고 안전한 솔루션",
      ],
      seoTitle: "매장과 비즈니스용 롤러 셔터 스마트 제어 | WIFIGATE",
      seoDescription:
        "WIFIGATE는 휴대폰으로 매장과 비즈니스용 롤러 셔터를 스마트하게 제어합니다. 권한 관리, 열쇠와 리모컨 의존도 감소, 외부 노출 접근 지점 감소를 지원합니다.",
      imageAlt: "매장 주인이 휴대폰으로 매장 롤러 셔터를 여는 모습",
    },
    "electric-gates": {
      label: "전동 게이트와 주차 차단기",
      title: "전동 게이트와 주차 차단기를 위한 스마트 오픈",
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
        "전동 게이트와 주차 차단기는 입주민, 직원, 방문객, 공급업체가 사용하지만 리모컨, 코드, 전화 개방 관리는 금방 복잡해집니다. WIFIGATE는 휴대폰으로 게이트를 열고, 고정 또는 임시 출입 권한을 공유하며, 고정 사용자에게 Auto Open을 제공하고, 필요에 따라 예약 이벤트를 설정할 수 있게 합니다. 시스템은 로컬, 보안, 개인정보 보호 중심의 운영을 위해 설계되었고 월 구독료가 필요하지 않으며, 기존 리모컨도 앱 제어와 함께 계속 사용할 수 있습니다.",
      bullets: [
        "휴대폰으로 전동 게이트 또는 주차 차단기 열기",
        "월 구독료 없음, 정기 자동 결제 없음",
        "방문객, 공급업체, 직원에게 임시 출입 권한 공유",
        "일상 출입을 위한 고정 사용자 Auto Open",
        "요일과 시간에 따른 예약 개방 이벤트",
        "앱 제어와 기존 리모컨 사용 모두 지원",
        "실물 리모컨 배포 필요성 감소",
        "관리와 투명성을 위한 개방 기록",
      ],
      seoTitle: "월 구독료 없는 전동 게이트와 주차 차단기 출입 관리 | WIFIGATE",
      seoDescription:
        "WIFIGATE는 휴대폰으로 전동 게이트와 주차 차단기를 스마트하게 열 수 있게 합니다. Auto Open, 예약 이벤트, 기존 리모컨, 권한 관리, 월 구독료 없는 운영을 지원합니다.",
      imageAlt: "운전자가 휴대폰으로 주차 차단기와 전동 게이트를 여는 모습",
    },
    "garage-doors": {
      label: "차고문과 개인 주차",
      title: "차고문과 개인 주차를 위한 스마트 오픈",
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
        "차고문과 개인 주차 공간은 보통 실물 리모컨으로 제어됩니다. 리모컨은 분실되거나 더 이상 출입 권한이 필요 없는 사람에게 남아 있거나 특정 상황에서 복제될 수 있습니다. WIFIGATE는 제어를 휴대폰 기반 디지털 출입으로 전환하여 가족, 직원, 방문객 권한을 관리하고 리모컨이나 코드를 전달하지 않고도 임시 출입 권한을 공유할 수 있게 합니다.",
      bullets: [
        "휴대폰으로 차고문 열기",
        "실물 리모컨 의존도 감소",
        "리모컨 분실, 전달, 복제로 인한 위험 감소",
        "가족, 직원, 방문객 출입 관리",
        "리모컨이나 코드를 주지 않고 임시 출입 제공",
        "개인 주차, 주택, 정원형 아파트에 적합",
        "더 로컬이고 개인정보에 집중한 출입 관리",
        "일상에서 더 편리하고 안전한 제어",
      ],
      seoTitle: "차고문과 개인 주차 스마트 오픈 | WIFIGATE",
      seoDescription:
        "WIFIGATE는 휴대폰으로 차고문과 개인 주차를 스마트하게 열 수 있게 합니다. 실물 리모컨 의존도를 줄이고 임시 권한과 더 편리하고 사적인 출입 관리를 지원합니다.",
      imageAlt: "현대적인 주택에서 남성이 휴대폰으로 개인 차고문을 여는 모습",
    },
    "private-homes": {
      label: "개인 주택",
      title: "개인 주택을 위한 스마트하고 안전한 출입",
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
        "개인 주택에서는 키패드, 열쇠, 리모컨이 취약한 지점이 될 수 있습니다. 시간이 지나면 키패드 버튼에 마모나 흔적이 생기고, 리모컨은 분실되거나 사람들 사이에 전달될 수 있으며, 고정 코드는 배달원, 서비스 직원, 방문객에게 공유된 뒤 계속 남아 있을 수 있습니다. WIFIGATE는 휴대폰에서 출입을 관리하고 고정 코드를 노출하지 않고 임시 게스트 권한을 공유하며, 잠금장치, 코드, 리모컨을 교체하지 않고도 권한을 쉽게 취소할 수 있게 합니다.",
      bullets: [
        "키패드, 열쇠, 리모컨 의존도 감소",
        "배달원, 방문객, 서비스 직원에게 임시 출입 제공",
        "휴대폰에서 권한을 쉽게 취소",
        "코드 공유나 리모컨 전달로 인한 위험 감소",
        "개인 주택의 게이트, 문, 주차, 차고에 적합",
        "가족과 고정 사용자를 쉽게 관리",
        "일상 출입을 더 편리하게",
        "누가 들어올 수 있는지에 대한 더 나은 개인정보 보호와 통제",
      ],
      seoTitle: "공유 키패드 코드 없는 개인 주택 스마트 출입 | WIFIGATE",
      seoDescription:
        "WIFIGATE는 개인 주택에서 휴대폰으로 출입을 관리하고 방문객과 배달원에게 임시 권한을 공유하며 키패드, 열쇠, 리모컨 의존도를 줄여 줍니다.",
      imageAlt: "여성이 키패드 대신 휴대폰으로 개인 주택 출입 게이트를 여는 모습",
    },
    "residential-buildings": {
      label: "주거용 건물",
      title: "주거용 건물을 위한 스마트 출입 관리",
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
        "주거용 건물에서는 공용 출입 코드가 입주민, 방문객, 배달원, 공급업체, 서비스 직원 사이에 빠르게 퍼집니다. 시간이 지나면 누가 실제로 건물 출입 권한을 가지고 있는지, 언제 코드를 바꾸거나 리모컨을 회수해야 하는지 알기 어려워집니다. WIFIGATE는 입주민과 관리 주체가 출입을 더 체계적으로 관리하고, 임시 게스트 권한을 제공하며, 공용 코드 의존도를 줄이고, 건물, 로비, 게이트, 주차장 출입을 더 잘 통제할 수 있게 합니다.",
      bullets: [
        "입주민이 휴대폰으로 편리하게 출입",
        "고정 코드를 노출하지 않는 임시 게스트 초대",
        "입주민, 공급업체, 서비스 직원 권한 관리",
        "로비 문, 게이트, 주차장에 적합",
        "키패드, 열쇠, 리모컨 의존도 감소",
        "출입 기록을 통한 더 나은 투명성",
        "관리위원회 또는 관리회사에 더 쉬운 관리",
        "입주민과 방문객에게 더 편리한 출입 경험",
      ],
      seoTitle: "주거용 건물 출입 관리 | WIFIGATE",
      seoDescription:
        "WIFIGATE는 주거용 건물에 스마트 출입 관리를 제공합니다. 휴대폰 개방, 임시 게스트 권한, 키패드 의존도 감소, 더 나은 투명성을 지원합니다.",
      imageAlt: "입주민이 휴대폰으로 주거용 건물 입구를 여는 모습",
    },
    "office-buildings": {
      label: "오피스 빌딩",
      title: "오피스 빌딩을 위한 스마트 출입",
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
        "오피스 빌딩은 직원, 방문객, 공급업체, 운영팀에게 편리한 출입을 제공해야 하지만, 프런트 부담을 늘리거나 열쇠와 카드를 수동으로 관리하고 싶지는 않습니다. WIFIGATE는 직원에게 고정 권한을, 방문객에게 임시 권한을 제공하고, 휴대폰으로 출입을 제어하며, 현대적인 비즈니스 환경에 맞는 정돈된 출입 관리를 가능하게 합니다.",
      bullets: [
        "직원과 팀을 위한 고정 권한",
        "방문객, 공급업체, 배달원을 위한 임시 출입",
        "프런트와 운영팀의 부담 감소",
        "출입문, 층, 방, 주차장에 적합",
        "사용자와 권한을 체계적으로 관리",
        "열쇠, 출입 카드, 코드 의존도 감소",
        "건물에 더 현대적이고 편리한 이미지 제공",
        "관리와 투명성을 위한 출입 기록",
      ],
      seoTitle: "오피스 빌딩 출입 관리 | WIFIGATE",
      seoDescription:
        "WIFIGATE는 오피스 빌딩에서 직원, 방문객, 공급업체의 출입을 휴대폰으로 관리할 수 있게 합니다. 임시 및 고정 권한을 지원하는 현대적인 출입 관리입니다.",
      imageAlt: "현대적인 사무실에서 직원이 휴대폰으로 유리문을 여는 모습",
    },
    "entry-doors-magnetic-locks": {
      label: "비즈니스 출입문과 마그네틱 락",
      title: "비즈니스 출입문과 마그네틱 락을 위한 스마트 오픈",
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
        "소규모 비즈니스, 클리닉, 스튜디오, 창고, 사무실은 키패드, 열쇠 또는 간단한 마그네틱 락을 사용하는 경우가 많습니다. 코드가 직원, 공급업체, 방문객 사이에 공유되거나 보안을 낮추지 않고 임시 출입을 제공해야 할 때 문제가 시작됩니다. WIFIGATE는 휴대폰에서 출입문을 관리하고 임시 권한을 공유하며 고정 코드, 실물 열쇠, 매번 수동 조율의 필요성을 줄입니다.",
      bullets: [
        "전기 잠금장치 또는 마그네틱 락이 있는 출입문에 적합",
        "직원과 관리자가 휴대폰으로 열기",
        "방문객, 공급업체, 서비스 직원에게 임시 출입 제공",
        "키패드나 고정 코드 필요성 감소",
        "소규모 비즈니스, 클리닉, 스튜디오, 사무실에 적합",
        "더 간단하고 안전한 권한 관리",
        "실물 열쇠 필요성 감소",
        "복잡한 시스템 없이 현대적인 출입을 원하는 비즈니스에 적합",
      ],
      seoTitle: "비즈니스 출입문과 마그네틱 락 | WIFIGATE",
      seoDescription:
        "WIFIGATE는 비즈니스 출입문과 마그네틱 락을 스마트하게 열 수 있게 합니다. 휴대폰 권한 관리, 임시 출입, 키패드와 열쇠 의존도 감소를 지원합니다.",
      imageAlt: "고객이 휴대폰으로 소규모 비즈니스 출입문을 여는 모습",
    },
    "sports-facilities": {
      label: "스포츠 시설",
      title: "스포츠 시설을 위한 스마트 출입 관리",
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
        "스포츠 시설, Padel 코트, 테니스 코트, 헬스장, 트레이닝 센터는 운영 시간, 예약, 이벤트에 따라 회원, 코치, 직원, 방문객의 출입을 관리해야 합니다. WIFIGATE는 휴대폰으로 임시 또는 고정 출입 권한을 제공하고, 공유 열쇠나 공용 코드 의존도를 줄이며, 하루 동안 유동 인원이 달라지는 시설의 입장 경험을 개선합니다.",
      bullets: [
        "Padel, 테니스, 헬스장, 트레이닝 시설에 적합",
        "운영 시간, 예약 또는 권한에 따른 출입",
        "회원, 코치, 직원, 방문객 관리",
        "공유 열쇠와 공용 코드 의존도 감소",
        "휴대폰으로 빠르고 편리하게 입장",
        "운영 시간이 변동되는 시설에 적합",
        "이벤트, 수업, 훈련을 위한 임시 권한",
        "운영과 관리를 위한 출입 기록",
      ],
      seoTitle: "스포츠 시설과 Padel 코트 출입 관리 | WIFIGATE",
      seoDescription:
        "WIFIGATE는 스포츠 시설, Padel 코트, 헬스장, 트레이닝 센터에 스마트 출입 관리를 제공합니다. 휴대폰 입장과 임시 또는 고정 권한을 지원합니다.",
      imageAlt: "Padel 선수가 조명이 켜진 스포츠 코트 입구를 휴대폰으로 여는 모습",
    },
  },
};
