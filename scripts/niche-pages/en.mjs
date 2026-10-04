// scripts/niche-pages/en.mjs
// English content for the homepage "where" section + the niche/use-case pages.
// The homepage copy is the only place that intentionally targets the brand
// variations "WIFIGATE", "WiFi Gate", and "wifi gate"; niche pages target
// their own use-case keywords.

export default {
  home: {
    seoTitle: "WIFIGATE | Smart Access Control for Gates, Doors, and Parking",
    seoDescription:
      "WIFIGATE (WiFi Gate) is smart access control for gates, buildings, parking entrances, and private homes. Secure, private, encrypted, and free of monthly fees.",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, smart access control, gate access control, open gate from phone, door access control, parking access, no monthly fees",
  },
  where: {
    title: "Smart Access for Buildings, Businesses, and Hospitality",
    subtitle:
      "WIFIGATE makes access management simple, secure, and convenient for residential buildings, businesses, and hospitality properties, with flexible control for entrances, gates, shutters, and parking areas.",
  },
  niches: {
    "hotels-airbnb": {
      label: "Hotels, Airbnb, and Guest Apartments",
      title: "Smart Access for Hotels, Airbnb, and Guest Apartments",
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
        "WIFIGATE lets guests receive convenient, secure digital access straight to their phone, with no physical keys, no cards, and no unnecessary coordination with the front desk or property owner. With the WIFIGATE API, the booking process can be connected to the access system, so the moment a reservation is confirmed the guest can automatically receive time-limited guest access. Access begins at check-in time, ends automatically at check-out, and significantly reduces the need to hand over keys, share codes, or handle each guest manually.",
      bullets: [
        "Automatic guest access created when a booking is confirmed",
        "Full automation support through the WIFIGATE API",
        "Temporary access matched to the dates and hours of the stay",
        "Less need for manual check-in, keys, cards, or codes",
        "Permission management for staff, cleaners, maintenance, and vendors",
        "A smoother, more convenient arrival experience for guests",
        "Access ends automatically at check-out time",
        "Access history for transparency and control",
      ],
      seoTitle: "Access Control for Hotels, Airbnb, and Guest Apartments | WIFIGATE API",
      seoDescription:
        "WIFIGATE brings smart digital access to hotels, Airbnb, and guest apartments, including automated guest permissions through the WIFIGATE API, booking-based temporary access, fewer keys, and less manual check-in.",
      imageAlt: "Guests opening a hotel room door with a phone in a modern hallway",
    },
    "roller-shutters": {
      label: "Roller Shutters for Businesses and Shops",
      title: "Smart, Safer Control of Roller Shutters for Businesses and Shops",
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
        "Roller shutters at businesses and shops are often operated with remotes, keys, an external key box, or switches mounted outside the premises. Solutions like these can get lost, stay with former employees, be duplicated, or turn into an exposed access point. Opening or closing with a key also means standing right next to the operating point, holding the key in hand, and sometimes losing a comfortable line of sight to the shutter area. WIFIGATE moves control into the app and places access control on the more protected, indoor side, so you can open and close more comfortably, manage permissions for employees and vendors, and reduce dependence on keys, remotes, and exposed access points.",
      bullets: [
        "Open and close from the phone without depending on remotes",
        "Less dependence on keys that can be copied or lost",
        "Fewer exposed access points outside the business",
        "More comfortable control with a better view of the shutter area",
        "Permission management for employees, managers, and vendors",
        "Optional temporary access by time or need",
        "Suitable for shops, warehouses, service entrances, and businesses",
        "A tidier, more protected indoor solution for daily operation",
      ],
      seoTitle: "Smart Roller Shutter Control for Businesses and Shops | WIFIGATE",
      seoDescription:
        "WIFIGATE gives businesses and shops smart phone-based control of roller shutters, with permission management, less dependence on keys and remotes, and fewer exposed access points outside the premises.",
      imageAlt: "Business owner opening a shop roller shutter with a phone",
    },
    "electric-gates": {
      label: "Electric Gates and Parking Barriers",
      title: "Smart Opening for Electric Gates and Parking Barriers",
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
        "Electric gates and parking barriers serve residents, employees, guests, and vendors, but managing remotes, codes, and open-the-gate phone calls quickly becomes a burden. WIFIGATE lets you open the gate from the phone, share permanent or temporary access, use automatic opening for regular users, and set scheduled events as needed. The system is designed for local, secure, and private operation, with no monthly subscription or recurring payment, and you can keep using existing remotes alongside app control.",
      bullets: [
        "Open an electric gate or parking barrier from the phone",
        "No monthly subscription and no recurring payment",
        "Share temporary access with guests, vendors, and employees",
        "Auto Open for regular users on their daily entry",
        "Scheduled events that open by days and hours",
        "Control from the app or with existing remotes",
        "Less need to hand out physical remotes",
        "Opening history for control and transparency",
      ],
      seoTitle: "Electric Gate and Parking Barrier Access with No Subscription | WIFIGATE",
      seoDescription:
        "WIFIGATE opens electric gates and parking barriers from the phone, with Auto Open, scheduled events, support for existing remotes, permission management, and no monthly subscription or recurring payment.",
      imageAlt: "Driver opening a parking barrier and electric gate with a phone",
    },
    "garage-doors": {
      label: "Garage Doors and Private Parking",
      title: "Smart Opening for Garage Doors and Private Parking",
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
        "Garage doors and private parking entrances are usually operated with physical remotes, which can get lost, stay with people who no longer need access, or be copied in certain situations. WIFIGATE moves control to digital access from the phone, lets you manage permissions for family members, employees, or guests, and share temporary access without handing over a remote or a code. The result is a more convenient, more private, and better organized experience, with less dependence on physical access devices.",
      bullets: [
        "Open the garage door from the phone",
        "Less dependence on physical remotes",
        "Reduced risk from lost, transferred, or copied remotes",
        "Access management for family members, employees, and guests",
        "Temporary access without handing over a remote or code",
        "Suitable for private parking, houses, and garden apartments",
        "A more local and private way to manage access",
        "More convenient, safer everyday control",
      ],
      seoTitle: "Smart Garage Door and Private Parking Access | WIFIGATE",
      seoDescription:
        "WIFIGATE opens garage doors and private parking entrances from the phone, with less dependence on physical remotes, temporary permissions, and more convenient, private access management.",
      imageAlt: "Man opening a private garage door with a phone at a modern home",
    },
    "private-homes": {
      label: "Private Homes",
      title: "Smart, Secure Access for Private Homes",
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
        "In private homes, keypads, keys, and remotes can become a weak point. Over time, wear or marks appear on keypad buttons, remotes get lost or passed between people, and the code is sometimes given to couriers, service providers, or guests and stays with them long after it is needed. WIFIGATE lets you manage the entrance from the phone, share temporary guest access without exposing a permanent code, and revoke permissions easily without replacing locks, codes, or remotes.",
      bullets: [
        "Less dependence on keypads, keys, and remotes",
        "Temporary access for couriers, guests, and service providers",
        "Revoke permissions easily from the phone",
        "Reduced risk from shared codes or passed-on remotes",
        "Suitable for gates, doors, parking, and garages at a private home",
        "Simple management for family members and regular users",
        "A more convenient everyday entry experience",
        "Better privacy and control over who can enter",
      ],
      seoTitle: "Smart Home Access Without a Shared Keypad Code | WIFIGATE",
      seoDescription:
        "WIFIGATE lets private homes manage access from the phone, share temporary permissions with guests and couriers, and reduce dependence on keypads, keys, and remotes.",
      imageAlt: "Woman opening the entrance gate of a private home with a phone instead of using a keypad",
    },
    "residential-buildings": {
      label: "Residential Buildings",
      title: "Smart Access Management for Residential Buildings",
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
        "In residential buildings, a shared entry code quickly spreads between residents, guests, couriers, vendors, and service providers. Over time it becomes hard to know who really holds access to the building, and when it is time to change a code or collect remotes. WIFIGATE lets residents and the building committee manage access in a more organized way, grant temporary guest permissions, reduce dependence on a shared code, and keep better control over entry to the building, lobby, gate, or parking.",
      bullets: [
        "Convenient access for residents through the phone",
        "Temporary guest invites without exposing a permanent code",
        "Permission management for residents, vendors, and service providers",
        "Suitable for lobby doors, gates, and parking entrances",
        "Less dependence on keypads, keys, and remotes",
        "Better transparency through access history",
        "Simpler management for the building committee or management company",
        "A more convenient entry experience for residents and guests",
      ],
      seoTitle: "Access Control for Residential Buildings | WIFIGATE",
      seoDescription:
        "WIFIGATE brings smart access management to residential buildings, with phone-based entry, temporary guest permissions, less dependence on keypads, and better transparency.",
      imageAlt: "Resident opening a residential building entrance with a phone",
    },
    "office-buildings": {
      label: "Office Buildings",
      title: "Smart Access for Office Buildings",
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
        "Office buildings need to give employees, visitors, vendors, and operations teams convenient entry, without overloading the reception desk and without managing keys or cards by hand. WIFIGATE lets you grant permanent permissions to employees and temporary permissions to visitors, control access from the phone, and manage entries in a way that suits a modern, clean, and organized business environment.",
      bullets: [
        "Permanent permissions for employees and teams",
        "Temporary access for visitors, vendors, and couriers",
        "Less load on reception and operations staff",
        "Suitable for entrance doors, floors, rooms, and parking",
        "Organized user and permission management",
        "Less dependence on keys, access badges, and codes",
        "A more modern, convenient image for the building",
        "Access history for control and transparency",
      ],
      seoTitle: "Access Control for Office Buildings | WIFIGATE",
      seoDescription:
        "WIFIGATE lets office buildings manage entry for employees, visitors, and vendors from the phone, with temporary and permanent permissions and modern access management.",
      imageAlt: "Employee opening a glass door in a modern office with a phone",
    },
    "entry-doors-magnetic-locks": {
      label: "Entry Doors and Magnetic Locks for Businesses",
      title: "Smart Opening for Business Entry Doors and Magnetic Locks",
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
        "Small businesses, clinics, studios, warehouses, and offices often rely on a keypad, a key, or a simple magnetic lock. The problem starts when the code spreads between employees, vendors, and guests, or when temporary access is needed without weakening security. WIFIGATE lets you manage the entry door from the phone, share temporary permissions, and reduce the need for permanent codes, physical keys, or manual coordination at every entry.",
      bullets: [
        "Suitable for entry doors with an electric or magnetic lock",
        "Phone-based opening for employees and managers",
        "Temporary access for guests, vendors, and service providers",
        "Less need for a keypad or a permanent code",
        "Suitable for small businesses, clinics, studios, and offices",
        "Simpler, safer permission management",
        "Less need for physical keys",
        "A convenient option for businesses that want modern entry without a complex system",
      ],
      seoTitle: "Entry Doors and Magnetic Locks for Businesses | WIFIGATE",
      seoDescription:
        "WIFIGATE brings smart opening to business entry doors and magnetic locks, with phone-based permission management, temporary access, and less dependence on keypads and keys.",
      imageAlt: "Customer opening the entry door of a small business with a phone",
    },
    "sports-facilities": {
      label: "Sports Facilities",
      title: "Smart Access Control for Sports Facilities",
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
        "Sports facilities, padel courts, tennis courts, gyms, and training complexes need to manage access for members, coaches, teams, and guests according to operating hours, bookings, and events. WIFIGATE lets you grant temporary or permanent access from the phone, reduce dependence on a shared key or code, and improve the entry experience for users, especially in complexes where traffic changes throughout the day.",
      bullets: [
        "Suitable for padel courts, tennis courts, gyms, and training complexes",
        "Access by operating hours, bookings, or permissions",
        "Management for members, coaches, employees, and guests",
        "Less dependence on shared keys and codes",
        "Fast, convenient entry from the phone",
        "Suitable for complexes with changing operating hours",
        "Temporary permissions for events, classes, or training sessions",
        "Access history for control and operations",
      ],
      seoTitle: "Access Control for Sports Facilities and Padel Courts | WIFIGATE",
      seoDescription:
        "WIFIGATE brings smart access control to sports facilities, padel courts, gyms, and training complexes, with phone-based entry and temporary or permanent permissions.",
      imageAlt: "Padel player opening the entrance to a floodlit sports court with a phone",
    },
  },
};
