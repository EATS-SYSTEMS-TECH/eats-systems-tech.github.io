// scripts/host-page-copy/en.mjs
// The WIFIGATE Host page (/automation/) in English (the source for every translation): title, description and body.

export default {
  "marketing": {
    "hero": {
      "eyebrow": "WIFIGATE Host",
      "title": "Guest access that takes care of itself",
      "lead": "The moment a booking is confirmed, WIFIGATE creates secure, time-limited access to your gate, door or parking, and it ends on its own at checkout. No keys to hand over, no codes to chase, no one waiting at the entrance.",
      "ctaPrimary": "Talk to us",
      "note": "For hotels, vacation rentals, guesthouses, and rental parking or garages."
    },
    "pricing": {
      "eyebrow": "Pricing",
      "title": "Simple plans for WIFIGATE Host",
      "subtitle": "Pay per active system, with a monthly minimum of one system. The WIFIGATE controller itself never needs a subscription.",
      "per": "/ system / month",
      "badge": "Most popular",
      "startDesc": "For a guesthouse, a vacation rental or a small business starting to host without keys.",
      "startRange": "For 1–14 active systems",
      "startF1": "An automatic access link for every booking, from your booking system",
      "startF2": "Up to 14 active systems",
      "startF3": "A booking calendar per system",
      "startF4": "Google or Apple sign-in and two-step verification for admins",
      "growthDesc": "For hotels and management companies running many systems from one place.",
      "growthRange": "For 15–49 active systems",
      "growthF1": "Everything in START",
      "growthF2": "Up to 49 active systems",
      "growthF3": "Several booking-system connections, with routing rules",
      "growthF4": "Team roles and priority support",
      "scaleDesc": "For hotel groups, large portfolios and enterprise rollouts.",
      "scaleRange": "For 50+ active systems",
      "scaleF1": "Everything in GROWTH",
      "scaleF2": "50+ active systems",
      "scaleF3": "A test environment, custom roles and an extended activity log",
      "scaleF4": "Enterprise rollout support",
      "planCta": "Talk to us",
      "note": "Monthly prices in US dollars (USD), before tax, per active system, band by band: the first 14 systems cost $6 each, systems 15–49 cost $5 each, and every system from the 50th costs $4. For example, 20 systems: 14 × $6 plus 6 × $5, $114 per month. Account minimum: $6 per month, even with no linked system. No platform fee and no charge per guest invitation. Volume quotes are available for 250+ systems."
    },
    "audience": {
      "label": "Built for:",
      "hotels": "Hotels",
      "rentals": "Airbnb & short-term rentals",
      "guesthouses": "Guesthouses",
      "parking": "Rental parking & garages"
    },
    "steps": {
      "eyebrow": "How it works",
      "title": "From booking to open gate, automatically",
      "subtitle": "Three steps, and then it runs on its own for every reservation.",
      "s1t": "A booking comes in",
      "s1x": "Your booking system notifies WIFIGATE Host of every confirmed booking. You can also enter a booking by hand on the dashboard.",
      "s2t": "Access is created automatically",
      "s2x": "WIFIGATE Host creates a secure access link for exactly the gate, door or parking of that booking, valid only for the stay. You or your booking system send it to the guest.",
      "s3t": "Your guest walks straight in",
      "s3x": "The guest opens the link in the WIFIGATE app and opens the entrance from their phone. At check-out, access ends by itself. No key to collect."
    },
    "benefits": {
      "eyebrow": "Why WIFIGATE Host",
      "title": "Your guest arrives. You don't have to be there.",
      "subtitle": "Everything a booking needs to become access, handled for you.",
      "b1t": "No keys to hand over",
      "b1x": "Forget key pickups, lockboxes and codes passed from hand to hand. The guest gets a link and opens from their phone.",
      "b2t": "Access ends by itself",
      "b2x": "Every access link starts at check-in and ends at check-out, automatically, for every stay.",
      "b3t": "Encrypted and private",
      "b3x": "The access link is encrypted and meant only for the phone of the guest you invited.",
      "b4t": "Works with your entrances",
      "b4x": "Gates, parking gates, barriers and entrance doors: any entrance with a WIFIGATE controller.",
      "b5t": "Works for a whole complex",
      "b5x": "From a single gate to an entire complex: one booking can open a group of entrances, such as a gate, parking and a door.",
      "b6t": "Connects to your booking system",
      "b6x": "Your booking system, PMS or channel manager connects to WIFIGATE Host through an API, and from there it runs by itself."
    },
    "secure": {
      "eyebrow": "Security",
      "title": "Access you can safely give a stranger",
      "subtitle": "Built to protect the property behind every gate.",
      "i1t": "Encrypted end to end",
      "i1x": "Every invite is encrypted, so access details cannot be read or copied in transit.",
      "i2t": "Fewer physical credentials, more hospitality",
      "i2x": "Digital access reduces the need for keys, cards and remotes, so your team can focus on guests and hospitality.",
      "i3t": "You stay in control",
      "i3x": "Access is tied to each stay and each guest, and you can shut it down whenever you need to."
    },
    "faq": {
      "q1": "How does the guest get access?",
      "a1": "WIFIGATE Host creates a private access link for every booking. You or your booking system send it to the guest by SMS, email or WhatsApp, and you can also show it as a QR code.",
      "q2": "Does the guest need to install an app?",
      "a2": "Yes. The guest opens the link in the WIFIGATE app and signs in with Google or Apple. Without the app, the link leads to the install page; after installing, the guest opens the link again.",
      "q3": "When does access start and end?",
      "a3": "It follows the check-in and check-out of the booking. The default is arrival at 15:00 and departure at 12:00, and you can set other hours.",
      "q4": "Is internet needed at the entrance?",
      "a4": "No. The entrance opens over Bluetooth between the guest's phone and the controller, with no dependence on the cloud at the moment of entry.",
      "q5": "Which booking systems does it connect to?",
      "a5": "Any system that can send bookings through an API or a webhook: a property management system (PMS), a channel manager or your own system. You can also enter bookings by hand on the dashboard.",
      "q6": "Does it work for a complex with several entrances?",
      "a6": "Yes. One booking can open a group of entrances, such as a gate, parking and a door, with up to 20 systems in a group.",
      "q7": "What needs to be installed?",
      "a7": "A WIFIGATE controller at each entrance. The gate admin adds it to WIFIGATE Host from the app, next to the gate. No Wi‑Fi is needed at the entrance.",
      "q8": "How is the price calculated, and is there a minimum?",
      "a8": "By the number of active systems, band by band: $6 per system for up to 14 systems, $5 for systems 15–49 and $4 from the 50th. The account minimum is $6 per month, even with no linked system. A system active for part of a month is charged by days."
    },
    "shop": {
      "title": "Everything starts with a WIFIGATE controller",
      "text": "Guest access runs on a WIFIGATE controller installed at the gate, door or parking entrance. Choose the right controller for your entrances in the shop.",
      "button": "Go to the shop"
    },
    "cta": {
      "title": "Ready to automate guest access?",
      "text": "Tell us about your properties, and we'll set up WIFIGATE Host for the way you host.",
      "button": "Talk to us"
    }
  },
  "metaTitle": "Automatic Guest Access for Hotels, Rentals & Parking | WIFIGATE",
  "metaDescription": "Secure, time-limited guest access, created automatically for every booking. For hotels, vacation rentals, guesthouses, and rental parking or garages. No key handovers."
};
