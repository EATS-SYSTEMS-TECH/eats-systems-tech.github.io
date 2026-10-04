// scripts/niche-pages/es.mjs
// Spanish (neutral international, Spain + Latin America) content for the homepage
// "where" section + the niche/use-case pages, translated from the Hebrew source (he.mjs) and en.mjs.

export default {
  home: {
    seoTitle: "WIFIGATE | Acceso inteligente a portones, puertas y garajes",
    seoDescription:
      "WIFIGATE: abre portones, puertas, estacionamientos, persianas y garajes desde el teléfono. Control de acceso inteligente, local y seguro, sin suscripción mensual.",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, control de acceso inteligente, abrir portón desde el teléfono, portón eléctrico, control de accesos, puerta de garaje inteligente, acceso sin llaves, sin suscripción mensual",
  },
  where: {
    title: "¿Dónde se puede utilizar WIFIGATE?",
    subtitle:
      "WIFIGATE se adapta a una gran variedad de entornos y ofrece una solución inteligente, segura y cómoda para gestionar accesos, desde casas particulares hasta espacios comerciales y corporativos.",
  },
  niches: {
    "hotels-airbnb": {
      label: "Hoteles, Airbnb y apartamentos turísticos",
      title: "Acceso inteligente para hoteles, Airbnb y apartamentos turísticos",
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
        "WIFIGATE permite que los huéspedes reciban un acceso digital cómodo y seguro directamente en su teléfono, sin llaves físicas, sin tarjetas y sin coordinaciones innecesarias con la recepción o con el propietario. Gracias a la WIFIGATE API, el proceso de reserva puede conectarse con el sistema de acceso, de modo que en cuanto se confirma una reserva el huésped puede recibir automáticamente un acceso de invitado limitado en el tiempo. El acceso comienza a la hora del check-in, termina automáticamente a la hora del check-out y reduce de forma significativa la necesidad de entregar llaves, compartir códigos o gestionar manualmente a cada huésped.",
      bullets: [
        "Creación automática de acceso para huéspedes al confirmarse la reserva",
        "Automatización completa mediante la WIFIGATE API",
        "Acceso temporal según las fechas y los horarios de la reserva",
        "Menos check-in manual, llaves, tarjetas o códigos",
        "Gestión de permisos para el personal, la limpieza, el mantenimiento y los proveedores",
        "Una experiencia de llegada más fluida y cómoda para los huéspedes",
        "El acceso finaliza automáticamente a la hora del check-out",
        "Historial de accesos para mayor transparencia y control",
      ],
      seoTitle: "Control de acceso para hoteles, Airbnb y apartamentos turísticos | WIFIGATE API",
      seoDescription:
        "WIFIGATE lleva acceso digital a hoteles, Airbnb y apartamentos turísticos: permisos de huésped automatizados con la WIFIGATE API, acceso temporal por reserva y menos llaves.",
      imageAlt: "Huéspedes abriendo la puerta de una habitación de hotel con el teléfono en un pasillo moderno",
    },
    "roller-shutters": {
      label: "Persianas metálicas para negocios y tiendas",
      title: "Control inteligente y más seguro de persianas metálicas para negocios y tiendas",
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
        "Las persianas metálicas de negocios y tiendas suelen manejarse con controles remotos, llaves, una caja de llaves exterior o interruptores instalados fuera del local. Este tipo de soluciones puede perderse, quedar en manos de exempleados, duplicarse o convertirse en un punto de acceso expuesto. Además, abrir o cerrar con llave obliga a situarse junto al punto de accionamiento, con la llave en la mano y, a veces, sin una buena visión de la zona de la persiana. WIFIGATE traslada el control a la aplicación y ubica el control de acceso en el lado interior, más protegido, para abrir y cerrar con mayor comodidad, gestionar permisos de empleados y proveedores, y reducir la dependencia de llaves, controles remotos y puntos de acceso expuestos.",
      bullets: [
        "Apertura y cierre desde el teléfono, sin depender de controles remotos",
        "Menos dependencia de llaves que pueden copiarse o perderse",
        "Menos puntos de acceso expuestos en el exterior del negocio",
        "Control más cómodo y con mejor visión de la zona de la persiana",
        "Gestión de permisos para empleados, encargados y proveedores",
        "Posibilidad de acceso temporal por horario o según la necesidad",
        "Ideal para tiendas, almacenes, entradas de servicio y negocios",
        "Una solución interior, más ordenada y protegida para la operación diaria",
      ],
      seoTitle: "Control inteligente de persianas metálicas para negocios | WIFIGATE",
      seoDescription:
        "WIFIGATE permite manejar las persianas metálicas del negocio desde el teléfono, con gestión de permisos, menos llaves y controles remotos y menos puntos expuestos.",
      imageAlt: "Dueño de un negocio abriendo la persiana metálica de su tienda con el teléfono",
    },
    "electric-gates": {
      label: "Portones eléctricos y barreras de estacionamiento",
      title: "Apertura inteligente de portones eléctricos y barreras de estacionamiento",
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
        "Los portones eléctricos y las barreras de estacionamiento dan servicio a residentes, empleados, invitados y proveedores, pero gestionar controles remotos, códigos y llamadas para abrir el portón se vuelve engorroso muy rápido. WIFIGATE permite abrir el portón desde el teléfono, compartir acceso permanente o temporal, usar la apertura automática para usuarios habituales y programar eventos según la necesidad. El sistema está diseñado para funcionar de forma local, segura y privada, sin suscripción mensual ni pagos recurrentes, y se pueden seguir usando los controles remotos existentes junto con el control desde la aplicación.",
      bullets: [
        "Apertura de portones eléctricos y barreras de estacionamiento desde el teléfono",
        "Sin suscripción mensual y sin pagos recurrentes",
        "Acceso temporal compartido con invitados, proveedores y empleados",
        "Auto Open para usuarios habituales en su entrada diaria",
        "Eventos programados que abren según días y horarios",
        "Control desde la aplicación o con los controles remotos existentes",
        "Menos necesidad de repartir controles remotos físicos",
        "Historial de aperturas para mayor control y transparencia",
      ],
      seoTitle: "Portones eléctricos y barreras de estacionamiento sin suscripción | WIFIGATE",
      seoDescription:
        "WIFIGATE abre portones eléctricos y barreras desde el teléfono, con Auto Open, eventos programados, controles remotos existentes y sin suscripción mensual.",
      imageAlt: "Conductor abriendo una barrera de estacionamiento y un portón eléctrico con el teléfono",
    },
    "garage-doors": {
      label: "Puertas de garaje y estacionamientos privados",
      title: "Apertura inteligente de puertas de garaje y estacionamientos privados",
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
        "Las puertas de garaje y los estacionamientos privados suelen manejarse con controles remotos físicos, que pueden perderse, quedar en manos de personas que ya no necesitan acceso o copiarse en ciertas situaciones. WIFIGATE traslada el control a un acceso digital desde el teléfono, permite gestionar permisos para familiares, empleados o invitados, y compartir acceso temporal sin entregar un control remoto ni un código. El resultado es una experiencia más cómoda, más privada y mejor organizada, con menos dependencia de dispositivos de acceso físicos.",
      bullets: [
        "Apertura de la puerta del garaje desde el teléfono",
        "Menos dependencia de controles remotos físicos",
        "Menos riesgo por controles remotos perdidos, prestados o copiados",
        "Gestión de accesos para familiares, empleados e invitados",
        "Acceso temporal sin entregar un control remoto ni un código",
        "Ideal para estacionamientos privados, casas y apartamentos con jardín",
        "Una forma más local y privada de gestionar los accesos",
        "Un control diario más cómodo y seguro",
      ],
      seoTitle: "Apertura inteligente de puertas de garaje | WIFIGATE",
      seoDescription:
        "WIFIGATE abre puertas de garaje y estacionamientos privados desde el teléfono, con permisos temporales, menos controles remotos físicos y una gestión más privada.",
      imageAlt: "Hombre abriendo la puerta de un garaje privado con el teléfono en una casa moderna",
    },
    "private-homes": {
      label: "Casas particulares",
      title: "Acceso inteligente y seguro para casas particulares",
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
        "En las casas particulares, los teclados de código, las llaves y los controles remotos pueden convertirse en un punto débil. Con el tiempo aparecen desgaste o marcas en las teclas del teclado, los controles remotos se pierden o pasan de mano en mano, y a veces el código se entrega a repartidores, técnicos o invitados y queda en su poder mucho después de que haga falta. WIFIGATE permite gestionar la entrada desde el teléfono, compartir un acceso temporal de invitado sin exponer un código permanente y revocar permisos fácilmente sin cambiar cerraduras, códigos ni controles remotos.",
      bullets: [
        "Menos dependencia de teclados de código, llaves y controles remotos",
        "Acceso temporal para repartidores, invitados y técnicos",
        "Revocación de permisos fácil y desde el teléfono",
        "Menos riesgo por códigos compartidos o controles remotos prestados",
        "Ideal para portones, puertas, estacionamientos y garajes de la casa",
        "Gestión sencilla para familiares y usuarios habituales",
        "Una entrada diaria mucho más cómoda",
        "Más privacidad y mejor control sobre quién puede entrar",
      ],
      seoTitle: "Acceso inteligente para casas sin código compartido | WIFIGATE",
      seoDescription:
        "WIFIGATE permite gestionar el acceso a tu casa desde el teléfono, compartir permisos temporales con invitados y repartidores, y depender menos de teclados y llaves.",
      imageAlt: "Mujer abriendo el portón de entrada de una casa particular con el teléfono en lugar de usar un teclado de código",
    },
    "residential-buildings": {
      label: "Edificios residenciales",
      title: "Gestión de acceso inteligente para edificios residenciales",
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
        "En los edificios residenciales, un código de entrada compartido circula rápidamente entre vecinos, invitados, repartidores, proveedores y personal de servicio. Con el tiempo resulta difícil saber quién tiene realmente acceso al edificio y cuándo conviene cambiar el código o recoger los controles remotos. WIFIGATE permite a los vecinos y a la administración gestionar el acceso de forma más ordenada, otorgar permisos temporales de invitado, depender menos de un código compartido y mantener un mejor control de la entrada al edificio, al vestíbulo, al portón o al estacionamiento.",
      bullets: [
        "Acceso cómodo para los vecinos desde el teléfono",
        "Invitaciones temporales sin exponer un código permanente",
        "Gestión de permisos para vecinos, proveedores y personal de servicio",
        "Ideal para puertas de vestíbulo, portones y estacionamientos",
        "Menos dependencia de teclados de código, llaves y controles remotos",
        "Mayor transparencia gracias al historial de accesos",
        "Gestión más sencilla para la comunidad o la administración del edificio",
        "Una experiencia de entrada más cómoda para vecinos e invitados",
      ],
      seoTitle: "Control de acceso para edificios residenciales | WIFIGATE",
      seoDescription:
        "WIFIGATE lleva gestión de acceso inteligente a edificios residenciales: entrada desde el teléfono, permisos temporales de invitado y menos códigos compartidos.",
      imageAlt: "Vecina abriendo la entrada de un edificio residencial con el teléfono",
    },
    "office-buildings": {
      label: "Edificios de oficinas",
      title: "Acceso inteligente para edificios de oficinas",
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
        "Los edificios de oficinas necesitan ofrecer una entrada cómoda a empleados, visitantes, proveedores y equipos de operaciones, sin sobrecargar la recepción y sin gestionar llaves o tarjetas a mano. WIFIGATE permite otorgar permisos permanentes a los empleados y permisos temporales a los visitantes, controlar el acceso desde el teléfono y gestionar las entradas de una manera acorde a un entorno de trabajo moderno, limpio y ordenado.",
      bullets: [
        "Permisos permanentes para empleados y equipos",
        "Acceso temporal para visitantes, proveedores y mensajeros",
        "Menos carga para la recepción y el equipo de operaciones",
        "Ideal para puertas de entrada, pisos, salas y estacionamientos",
        "Gestión ordenada de usuarios y permisos",
        "Menos dependencia de llaves, tarjetas de acceso y códigos",
        "Una imagen más moderna y cómoda para el edificio",
        "Historial de accesos para mayor control y transparencia",
      ],
      seoTitle: "Control de acceso para edificios de oficinas | WIFIGATE",
      seoDescription:
        "WIFIGATE ayuda a los edificios de oficinas a gestionar la entrada de empleados, visitantes y proveedores desde el teléfono, con permisos temporales y permanentes.",
      imageAlt: "Empleada abriendo una puerta de vidrio en una oficina moderna con el teléfono",
    },
    "entry-doors-magnetic-locks": {
      label: "Puertas de entrada y cerraduras magnéticas para negocios",
      title: "Apertura inteligente de puertas de entrada y cerraduras magnéticas para negocios",
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
        "Los pequeños negocios, las clínicas, los estudios, los almacenes y las oficinas suelen apoyarse en un teclado de código, una llave o una cerradura magnética sencilla. El problema empieza cuando el código circula entre empleados, proveedores e invitados, o cuando hace falta dar un acceso temporal sin debilitar la seguridad. WIFIGATE permite gestionar la puerta de entrada desde el teléfono, compartir permisos temporales y reducir la necesidad de códigos permanentes, llaves físicas o coordinación manual en cada entrada.",
      bullets: [
        "Compatible con puertas de entrada con cerradura eléctrica o magnética",
        "Apertura desde el teléfono para empleados y encargados",
        "Acceso temporal para invitados, proveedores y técnicos",
        "Menos necesidad de un teclado o de un código permanente",
        "Ideal para pequeños negocios, clínicas, estudios y oficinas",
        "Gestión de permisos más sencilla y segura",
        "Menos necesidad de llaves físicas",
        "Una opción cómoda para negocios que quieren una entrada moderna sin un sistema complejo",
      ],
      seoTitle: "Puertas de entrada y cerraduras magnéticas para negocios | WIFIGATE",
      seoDescription:
        "WIFIGATE aporta apertura inteligente a puertas de entrada y cerraduras magnéticas de negocios, con permisos desde el teléfono, acceso temporal y menos llaves.",
      imageAlt: "Clienta abriendo la puerta de entrada de un pequeño negocio con el teléfono",
    },
    "sports-facilities": {
      label: "Instalaciones deportivas",
      title: "Control de acceso inteligente para instalaciones deportivas",
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
        "Las instalaciones deportivas, las canchas de pádel, las canchas de tenis, los gimnasios y los centros de entrenamiento necesitan gestionar el acceso de socios, entrenadores, equipos e invitados según horarios de actividad, reservas y eventos. WIFIGATE permite otorgar acceso temporal o permanente desde el teléfono, depender menos de una llave o un código compartido y mejorar la experiencia de entrada de los usuarios, sobre todo en complejos donde el movimiento de gente cambia a lo largo del día.",
      bullets: [
        "Ideal para canchas de pádel, tenis, gimnasios y centros de entrenamiento",
        "Acceso según horarios de actividad, reservas o permisos",
        "Gestión de socios, entrenadores, empleados e invitados",
        "Menos dependencia de llaves y códigos compartidos",
        "Entrada rápida y cómoda desde el teléfono",
        "Ideal para complejos con horarios de actividad variables",
        "Permisos temporales para eventos, clases o entrenamientos",
        "Historial de accesos para control y operación",
      ],
      seoTitle: "Control de acceso para instalaciones deportivas y pádel | WIFIGATE",
      seoDescription:
        "WIFIGATE aporta control de acceso a instalaciones deportivas, canchas de pádel y gimnasios, con entrada desde el teléfono y permisos temporales o permanentes.",
      imageAlt: "Jugadora de pádel abriendo la entrada de una cancha deportiva iluminada con el teléfono",
    },
  },
};
