// scripts/niche-pages/pt.mjs
// European Portuguese (pt-PT) content for the homepage "where" section + the
// niche/use-case pages, translated from the Hebrew (he.mjs) and English (en.mjs) source.

export default {
  home: {
    seoTitle: "WIFIGATE | Controlo de Acesso a Portões, Portas e Parques",
    seoDescription:
      "A WIFIGATE permite abrir portões, portas, estacionamentos, estores e garagens a partir do telemóvel. Solução segura, local e conveniente, sem mensalidades.",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, controlo de acessos inteligente, abrir portão pelo telemóvel, portão elétrico, controlo de entradas, acesso a estacionamento, sem mensalidades",
  },
  where: {
    title: "Onde pode utilizar a WIFIGATE?",
    subtitle:
      "A WIFIGATE adapta-se a uma grande variedade de ambientes e oferece uma solução de gestão de acessos inteligente, segura e conveniente, desde moradias até espaços comerciais e empresariais.",
  },
  niches: {
    "hotels-airbnb": {
      label: "Hotéis, Airbnb e Alojamento Local",
      title: "Acesso inteligente para hotéis, Airbnb e Alojamento Local",
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
        "A WIFIGATE permite que os hóspedes recebam um acesso digital cómodo e seguro diretamente no telemóvel, sem chaves físicas, sem cartões e sem coordenação desnecessária com a receção ou com o proprietário. Através da WIFIGATE API, é possível ligar o processo de reserva ao sistema de acessos: assim que uma reserva é confirmada, o hóspede pode receber automaticamente um acesso de hóspede limitado no tempo. O acesso começa à hora do check-in, termina automaticamente no check-out e reduz significativamente a necessidade de entregar chaves, partilhar códigos ou tratar manualmente de cada hóspede.",
      bullets: [
        "Acesso de hóspede criado automaticamente após a confirmação da reserva",
        "Suporte para automatização completa através da WIFIGATE API",
        "Acesso temporário de acordo com as datas e horas da estadia",
        "Menos check-ins manuais, chaves, cartões e códigos",
        "Gestão de permissões para equipas, limpezas, manutenção e fornecedores",
        "Uma experiência de chegada mais fluida e cómoda para os hóspedes",
        "O acesso termina automaticamente à hora do check-out",
        "Histórico de acessos para transparência e controlo",
      ],
      seoTitle: "Controlo de acessos para hotéis, Airbnb e Alojamento Local | WIFIGATE API",
      seoDescription:
        "A WIFIGATE traz acesso inteligente a hotéis, Airbnb e alojamento local: permissões de hóspede automáticas via WIFIGATE API, acessos temporários por reserva e menos chaves.",
      imageAlt: "Hóspedes a abrir a porta de um quarto de hotel com o telemóvel num corredor moderno",
    },
    "roller-shutters": {
      label: "Portas de enrolar para lojas e negócios",
      title: "Controlo inteligente e mais seguro de portas de enrolar para lojas e negócios",
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
        "As portas de enrolar de lojas e negócios são muitas vezes acionadas com comandos, chaves, uma caixa de chave exterior ou interruptores instalados fora do espaço. Estas soluções podem perder-se, ficar na posse de antigos funcionários, ser duplicadas ou tornar-se num ponto de acesso exposto. Além disso, abrir ou fechar com chave obriga a estar mesmo junto ao ponto de acionamento, com a chave na mão, por vezes sem uma boa linha de visão para a zona da porta. A WIFIGATE passa o controlo para a aplicação e coloca a gestão de acessos do lado interior, mais protegido, para poder abrir e fechar com mais comodidade, gerir permissões de funcionários e fornecedores e reduzir a dependência de chaves, comandos e pontos de acesso expostos.",
      bullets: [
        "Abertura e fecho a partir do telemóvel, sem depender de comandos",
        "Menos dependência de chaves que podem ser copiadas ou perdidas",
        "Menos pontos de acesso expostos no exterior do negócio",
        "Controlo mais cómodo, com melhor visibilidade sobre a zona da porta",
        "Gestão de permissões para funcionários, gerentes e fornecedores",
        "Possibilidade de acesso temporário por horário ou necessidade",
        "Indicado para lojas, armazéns, entradas de serviço e negócios",
        "Uma solução interior, mais organizada e protegida para o dia a dia",
      ],
      seoTitle: "Controlo inteligente de portas de enrolar para lojas | WIFIGATE",
      seoDescription:
        "A WIFIGATE dá a lojas e negócios controlo inteligente das portas de enrolar pelo telemóvel, com gestão de permissões e menos dependência de chaves e comandos.",
      imageAlt: "Proprietário de uma loja a abrir a porta de enrolar com o telemóvel",
    },
    "electric-gates": {
      label: "Portões elétricos e cancelas de estacionamento",
      title: "Abertura inteligente de portões elétricos e cancelas de estacionamento",
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
        "Os portões elétricos e as cancelas de estacionamento servem moradores, funcionários, visitas e fornecedores, mas gerir comandos, códigos e telefonemas para abrir o portão torna-se rapidamente complicado. A WIFIGATE permite abrir o portão a partir do telemóvel, partilhar acessos permanentes ou temporários, usar a abertura automática para utilizadores habituais e definir eventos agendados conforme necessário. O sistema foi concebido para funcionar de forma local, segura e privada, sem mensalidades nem débitos diretos, e é possível continuar a usar os comandos existentes em paralelo com o controlo pela aplicação.",
      bullets: [
        "Abertura de portões elétricos e cancelas a partir do telemóvel",
        "Sem mensalidades e sem débitos diretos",
        "Partilha de acessos temporários com visitas, fornecedores e funcionários",
        "Auto Open para utilizadores habituais na entrada do dia a dia",
        "Eventos agendados para abrir por dias e horas",
        "Controlo pela aplicação ou com os comandos existentes",
        "Menos necessidade de distribuir comandos físicos",
        "Histórico de aberturas para controlo e transparência",
      ],
      seoTitle: "Portões elétricos e cancelas sem mensalidades | WIFIGATE",
      seoDescription:
        "Abra portões elétricos e cancelas de estacionamento pelo telemóvel com a WIFIGATE: Auto Open, eventos agendados, comandos existentes e sem mensalidades.",
      imageAlt: "Condutor a abrir uma cancela de estacionamento e um portão elétrico com o telemóvel",
    },
    "garage-doors": {
      label: "Portões de garagem e estacionamentos privados",
      title: "Abertura inteligente de portões de garagem e estacionamentos privados",
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
        "Os portões de garagem e os estacionamentos privados funcionam normalmente com comandos físicos, que podem perder-se, ficar com pessoas que já não precisam de acesso ou, em certas situações, ser copiados. A WIFIGATE passa o controlo para um acesso digital no telemóvel, permite gerir permissões para familiares, funcionários ou visitas e partilhar acessos temporários sem entregar um comando ou um código. O resultado é uma experiência mais cómoda, mais privada e mais organizada, com menos dependência de dispositivos de acesso físicos.",
      bullets: [
        "Abertura do portão da garagem a partir do telemóvel",
        "Menos dependência de comandos físicos",
        "Menor risco associado a comandos perdidos, emprestados ou copiados",
        "Gestão de acessos para familiares, funcionários e visitas",
        "Acesso temporário sem entregar comandos ou códigos",
        "Indicado para estacionamentos privados, moradias e apartamentos com jardim",
        "Uma forma mais local e privada de gerir acessos",
        "Um controlo diário mais cómodo e seguro",
      ],
      seoTitle: "Abertura inteligente de portões de garagem | WIFIGATE",
      seoDescription:
        "A WIFIGATE abre portões de garagem e estacionamentos privados pelo telemóvel, com menos comandos físicos, permissões temporárias e gestão de acessos mais privada.",
      imageAlt: "Homem a abrir o portão de uma garagem privada com o telemóvel numa casa moderna",
    },
    "private-homes": {
      label: "Moradias",
      title: "Acesso inteligente e seguro para moradias",
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
        "Nas moradias, os teclados de código, as chaves e os comandos podem tornar-se um ponto fraco. Com o tempo, surgem marcas de desgaste nas teclas do código, os comandos perdem-se ou passam de mão em mão, e o código é por vezes dado a estafetas, técnicos ou visitas, que o guardam muito depois de deixar de ser necessário. A WIFIGATE permite gerir a entrada a partir do telemóvel, partilhar acessos temporários de visita sem expor um código fixo e revogar permissões facilmente, sem trocar fechaduras, códigos ou comandos.",
      bullets: [
        "Menos dependência de teclados de código, chaves e comandos",
        "Acesso temporário para estafetas, visitas e técnicos",
        "Revogação de permissões com facilidade, a partir do telemóvel",
        "Menor risco associado a códigos partilhados ou comandos emprestados",
        "Indicado para portões, portas, estacionamentos e garagens de moradias",
        "Gestão simples para familiares e utilizadores habituais",
        "Uma entrada do dia a dia mais cómoda",
        "Mais privacidade e controlo sobre quem pode entrar",
      ],
      seoTitle: "Acesso inteligente para moradias sem código partilhado | WIFIGATE",
      seoDescription:
        "A WIFIGATE permite gerir os acessos da moradia pelo telemóvel, com permissões temporárias para visitas e estafetas e menos dependência de teclados, chaves e comandos.",
      imageAlt: "Mulher a abrir o portão de entrada de uma moradia com o telemóvel, em vez de usar o teclado de código",
    },
    "residential-buildings": {
      label: "Prédios de habitação",
      title: "Gestão de acessos inteligente para prédios de habitação",
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
        "Nos prédios de habitação, um código de entrada partilhado circula rapidamente entre moradores, visitas, estafetas, fornecedores e prestadores de serviços. Com o tempo, torna-se difícil saber quem tem realmente acesso ao prédio e quando é altura de mudar o código ou recolher comandos. A WIFIGATE permite aos moradores e à administração do condomínio gerir os acessos de forma mais organizada, atribuir permissões temporárias a visitas, reduzir a dependência de um código partilhado e manter um melhor controlo sobre a entrada do prédio, do hall, do portão ou do estacionamento.",
      bullets: [
        "Acesso cómodo para os moradores através do telemóvel",
        "Convites de visita temporários sem expor um código fixo",
        "Gestão de permissões para moradores, fornecedores e prestadores de serviços",
        "Indicado para portas de hall, portões e estacionamentos",
        "Menos dependência de teclados de código, chaves e comandos",
        "Mais transparência com o histórico de acessos",
        "Gestão mais simples para a administração do condomínio",
        "Uma entrada mais cómoda para moradores e visitas",
      ],
      seoTitle: "Controlo de acessos para prédios de habitação | WIFIGATE",
      seoDescription:
        "A WIFIGATE traz gestão de acessos inteligente a prédios de habitação: entrada pelo telemóvel, permissões temporárias, menos códigos partilhados e mais transparência.",
      imageAlt: "Moradora a abrir a entrada de um prédio de habitação com o telemóvel",
    },
    "office-buildings": {
      label: "Edifícios de escritórios",
      title: "Acesso inteligente para edifícios de escritórios",
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
        "Os edifícios de escritórios precisam de proporcionar uma entrada cómoda a funcionários, visitantes, fornecedores e equipas de operação, sem sobrecarregar a receção e sem gerir chaves ou cartões manualmente. A WIFIGATE permite atribuir permissões permanentes aos funcionários e permissões temporárias aos visitantes, controlar os acessos a partir do telemóvel e gerir as entradas de uma forma adequada a um ambiente empresarial moderno, limpo e organizado.",
      bullets: [
        "Permissões permanentes para funcionários e equipas",
        "Acesso temporário para visitantes, fornecedores e estafetas",
        "Menos carga sobre a receção e a equipa de operação",
        "Indicado para portas de entrada, pisos, salas e estacionamentos",
        "Gestão organizada de utilizadores e permissões",
        "Menos dependência de chaves, cartões de acesso e códigos",
        "Uma imagem mais moderna e conveniente para o edifício",
        "Histórico de acessos para controlo e transparência",
      ],
      seoTitle: "Controlo de acessos para edifícios de escritórios | WIFIGATE",
      seoDescription:
        "A WIFIGATE permite gerir a entrada de funcionários, visitantes e fornecedores em edifícios de escritórios pelo telemóvel, com permissões temporárias e permanentes.",
      imageAlt: "Funcionária a abrir uma porta de vidro num escritório moderno com o telemóvel",
    },
    "entry-doors-magnetic-locks": {
      label: "Portas de entrada e fechaduras magnéticas para negócios",
      title: "Abertura inteligente de portas de entrada e fechaduras magnéticas para negócios",
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
        "Pequenos negócios, clínicas, estúdios, armazéns e escritórios recorrem muitas vezes a um teclado de código, a uma chave ou a uma fechadura magnética simples. O problema começa quando o código circula entre funcionários, fornecedores e visitas, ou quando é preciso dar acesso temporário sem comprometer a segurança. A WIFIGATE permite gerir a porta de entrada a partir do telemóvel, partilhar permissões temporárias e reduzir a necessidade de códigos fixos, chaves físicas ou coordenação manual em cada entrada.",
      bullets: [
        "Indicado para portas de entrada com fechadura elétrica ou magnética",
        "Abertura pelo telemóvel para funcionários e gerentes",
        "Acesso temporário para visitas, fornecedores e técnicos",
        "Menos necessidade de teclado de código ou de um código fixo",
        "Indicado para pequenos negócios, clínicas, estúdios e escritórios",
        "Gestão de permissões mais simples e segura",
        "Menos necessidade de chaves físicas",
        "Uma opção prática para negócios que querem uma entrada moderna sem um sistema complexo",
      ],
      seoTitle: "Portas de entrada e fechaduras magnéticas para negócios | WIFIGATE",
      seoDescription:
        "A WIFIGATE traz abertura inteligente a portas de entrada e fechaduras magnéticas de negócios: permissões pelo telemóvel, acessos temporários e menos códigos e chaves.",
      imageAlt: "Cliente a abrir a porta de entrada de um pequeno negócio com o telemóvel",
    },
    "sports-facilities": {
      label: "Instalações desportivas",
      title: "Controlo de acessos inteligente para instalações desportivas",
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
        "Instalações desportivas, campos de padel, campos de ténis, ginásios e centros de treino precisam de gerir o acesso de sócios, treinadores, equipas e visitas de acordo com os horários de funcionamento, as reservas e os eventos. A WIFIGATE permite atribuir acessos temporários ou permanentes a partir do telemóvel, reduzir a dependência de uma chave ou de um código partilhado e melhorar a experiência de entrada dos utilizadores, sobretudo em espaços com movimento variável ao longo do dia.",
      bullets: [
        "Indicado para campos de padel, ténis, ginásios e centros de treino",
        "Acesso por horário de funcionamento, reservas ou permissões",
        "Gestão de sócios, treinadores, funcionários e visitas",
        "Menos dependência de chaves e códigos partilhados",
        "Entrada rápida e cómoda a partir do telemóvel",
        "Indicado para espaços com horários de funcionamento variáveis",
        "Permissões temporárias para eventos, aulas ou treinos",
        "Histórico de acessos para controlo e operação",
      ],
      seoTitle: "Controlo de acessos para instalações desportivas e padel | WIFIGATE",
      seoDescription:
        "Controlo de acessos inteligente para instalações desportivas, padel e ginásios com a WIFIGATE: entrada pelo telemóvel e permissões temporárias ou permanentes.",
      imageAlt: "Jogadora de padel a abrir a entrada de um campo desportivo iluminado com o telemóvel",
    },
  },
};
