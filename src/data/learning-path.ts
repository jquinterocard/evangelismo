import type { LearningTopic } from "@/types";

/**
 * Ruta de aprendizaje "Conociendo a Jesús".
 * Textos bíblicos: Nueva Versión Internacional (NVI). Revisar antes de publicar.
 */
export const learningPath: LearningTopic[] = [
  {
    slug: "quien-es-jesus",
    order: 1,
    title: "¿Quién es Jesús?",
    summary: "Jesús es el Hijo de Dios que se hizo hombre para mostrarnos cómo es Dios y acercarnos a él.",
    references: [
      {
        reference: "Juan 14:6",
        text: "—Yo soy el camino, la verdad y la vida —le contestó Jesús—. Nadie llega al Padre sino por mí.",
      },
      {
        reference: "Juan 1:14",
        text: "Y el Verbo se hizo hombre y habitó entre nosotros. Y hemos contemplado su gloria, la gloria que corresponde al Hijo unigénito del Padre, lleno de gracia y de verdad.",
      },
      { reference: "Mateo 16:15-16" },
      { reference: "Colosenses 1:15" },
    ],
    explanation: [
      "Jesús de Nazaret vivió hace unos dos mil años en la tierra de Israel. Los Evangelios cuentan que sanó enfermos, se acercó a los que otros rechazaban y enseñó con palabras sencillas y profundas.",
      "La Biblia afirma algo todavía más grande: que en Jesús, Dios mismo se hizo hombre. No vino como un rey lejano, sino como alguien que conoció el cansancio, la amistad y el dolor humano.",
      "Cuando Jesús dijo que él es el camino, la verdad y la vida, estaba invitando a las personas a confiar en él para conocer a Dios. Conocer a Jesús es conocer el corazón de Dios.",
    ],
    reflection:
      "Muchas personas han oído hablar de Jesús, pero pocas se han detenido a conocerlo de verdad. Quizás hoy sea un buen día para preguntarte quién es él para ti. No necesitas tener todas las respuestas; basta con un corazón abierto.",
    activity:
      "Si lo deseas, lee el primer capítulo del Evangelio de Juan y anota una frase que te llame la atención sobre Jesús.",
    illustration: "jesus",
  },
  {
    slug: "el-amor-de-dios",
    order: 2,
    title: "El amor de Dios",
    summary: "Dios te ama de manera personal, y ese amor no depende de lo que hayas hecho.",
    references: [
      {
        reference: "Juan 3:16",
        text: "Porque tanto amó Dios al mundo que dio a su Hijo unigénito, para que todo el que cree en él no se pierda, sino que tenga vida eterna.",
      },
      {
        reference: "1 Juan 4:8",
        text: "El que no ama no conoce a Dios, porque Dios es amor.",
      },
      { reference: "Jeremías 31:3" },
      { reference: "Lucas 15:11-24" },
    ],
    explanation: [
      "La Biblia no solo dice que Dios ama; dice que Dios es amor. Su amor no es un premio para quienes se portan bien, sino algo que él ofrece libremente a cada persona.",
      "La prueba más grande de ese amor es Jesús. Dios no se quedó mirando desde lejos, sino que dio a su Hijo para que pudiéramos tener vida con él.",
      "En la parábola del hijo pródigo, Jesús describe a un padre que corre al encuentro de su hijo cuando este regresa a casa. Así es el corazón de Dios hacia nosotros.",
    ],
    reflection:
      "A veces pensamos que tenemos que ganarnos el cariño de Dios. Pero su amor llegó antes que cualquier esfuerzo nuestro. Puedes descansar en saber que eres amado tal como eres hoy.",
    activity:
      "Lee con calma Lucas 15:11-24 y piensa qué te enseña la actitud del padre sobre la forma en que Dios te mira.",
    illustration: "heart",
  },
  {
    slug: "por-que-vino-jesus",
    order: 3,
    title: "¿Por qué vino Jesús al mundo?",
    summary: "Jesús vino a buscar a las personas alejadas de Dios y a dar su vida para reconciliarlas con él.",
    references: [
      {
        reference: "Lucas 19:10",
        text: "Porque el Hijo del hombre vino a buscar y a salvar lo que se había perdido.",
      },
      { reference: "Marcos 10:45" },
      { reference: "Juan 10:10" },
    ],
    explanation: [
      "Jesús mismo explicó su misión con palabras claras: vino a buscar y a salvar a quienes estaban perdidos. No vino solo para los que parecían buenos, sino para todos.",
      "La Biblia enseña que el pecado, es decir, vivir de espaldas a Dios y a su voluntad, nos separa de él. Esa separación afecta nuestra vida, nuestras relaciones y nuestro futuro.",
      "Jesús vino a servir y a dar su vida para que esa distancia pudiera ser superada. Su venida es una buena noticia: Dios tomó la iniciativa de acercarse a nosotros.",
    ],
    reflection:
      "Es fácil pensar que estamos demasiado lejos de Dios o que ya es tarde. Pero Jesús vino precisamente a buscar a quienes se sentían así. Él no se cansa de buscar.",
    activity:
      "Lee la historia de Zaqueo en Lucas 19:1-10 y observa cómo Jesús se acercó a alguien que todos rechazaban.",
    illustration: "path",
  },
  {
    slug: "la-salvacion",
    order: 4,
    title: "La salvación por medio de Jesucristo",
    summary: "La salvación es un regalo de Dios que recibimos por la fe en Jesús, no por nuestros méritos.",
    references: [
      {
        reference: "Efesios 2:8-9",
        text: "Porque por gracia ustedes han sido salvados mediante la fe; esto no procede de ustedes, sino que es el regalo de Dios, no por obras, para que nadie se jacte.",
      },
      {
        reference: "Romanos 6:23",
        text: "Porque la paga del pecado es muerte, mientras que la dádiva de Dios es vida eterna en Cristo Jesús, nuestro Señor.",
      },
      { reference: "Hechos 4:12" },
      { reference: "Romanos 10:9" },
    ],
    explanation: [
      "Ser salvo significa ser rescatado de la separación de Dios y recibir una vida nueva con él. La Biblia presenta esta salvación como un regalo, no como un pago por buenas obras.",
      "Nadie puede comprar ni ganar este regalo. Dios lo ofrece por gracia, es decir, por un favor que no merecemos, y lo recibimos confiando en Jesús.",
      "Jesús hizo posible la salvación al dar su vida en la cruz y resucitar. Por eso la Biblia dice que la vida eterna se encuentra en él.",
    ],
    reflection:
      "Un regalo no se gana; se recibe con gratitud. Dios no te pide que seas perfecto para acercarte a él. Te invita a confiar en lo que Jesús ya hizo por ti.",
    activity:
      "Si quieres, escribe con tus propias palabras lo que significa para ti que la salvación sea un regalo y no un premio.",
    illustration: "cross",
  },
  {
    slug: "el-perdon-de-los-pecados",
    order: 5,
    title: "El perdón de los pecados",
    summary: "En Jesús, Dios ofrece un perdón completo que nos permite empezar de nuevo.",
    references: [
      {
        reference: "1 Juan 1:9",
        text: "Si confesamos nuestros pecados, Dios, que es fiel y justo, nos los perdonará y nos limpiará de toda maldad.",
      },
      { reference: "Salmo 103:12" },
      { reference: "Lucas 7:36-50" },
      { reference: "Mateo 6:14" },
    ],
    explanation: [
      "Todos hemos fallado de alguna manera: con palabras, acciones o actitudes que dañan a otros y nos alejan de Dios. La Biblia llama a esto pecado.",
      "La buena noticia es que Dios no quiere que vivamos cargando culpa. Cuando reconocemos sinceramente nuestras faltas ante él, promete perdonarnos y limpiarnos.",
      "El perdón de Dios también nos transforma. Quien se sabe perdonado aprende, poco a poco, a perdonar a otros, como Jesús enseñó.",
    ],
    reflection:
      "Tal vez hay algo en tu pasado que pesa en tu corazón. Dios conoce tu historia y aun así te ofrece su perdón. No tienes que cargar solo con eso.",
    activity:
      "Si lo deseas, toma un momento en privado para contarle a Dios aquello que te pesa y pedirle su perdón con sencillez.",
    illustration: "hands",
  },
  {
    slug: "fe-y-arrepentimiento",
    order: 6,
    title: "La fe y el arrepentimiento",
    summary: "Seguir a Jesús comienza con volver el corazón a Dios y confiar en él.",
    references: [
      {
        reference: "Marcos 1:15",
        text: "—Se ha cumplido el tiempo —decía—. El reino de Dios está cerca. ¡Arrepiéntanse y crean las buenas nuevas!",
      },
      {
        reference: "Hebreos 11:6",
        text: "En realidad, sin fe es imposible agradar a Dios, ya que cualquiera que se acerca a Dios tiene que creer que él existe y que recompensa a quienes lo buscan.",
      },
      { reference: "Hechos 3:19" },
    ],
    explanation: [
      "Arrepentirse no es solo sentirse mal por lo que hicimos. Es cambiar de dirección: dejar el camino que nos aleja de Dios y volvernos hacia él.",
      "La fe es confiar en Dios y en lo que Jesús hizo por nosotros. No es tener todo resuelto, sino apoyarnos en él aunque no lo entendamos todo.",
      "Jesús invitó a las personas a hacer ambas cosas: arrepentirse y creer. Son dos caras de una misma respuesta al amor de Dios.",
    ],
    reflection:
      "La fe puede empezar pequeña, como una semilla. No necesitas una fe perfecta para dar el primer paso. Basta con un deseo sincero de acercarte a Dios.",
    activity:
      "Piensa en un área de tu vida en la que te gustaría confiar más en Dios y, si quieres, escríbela en una nota personal.",
    illustration: "seed",
  },
  {
    slug: "la-oracion",
    order: 7,
    title: "La importancia de la oración",
    summary: "Orar es conversar con Dios con sinceridad, como un hijo habla con su Padre.",
    references: [
      {
        reference: "Filipenses 4:6-7",
        text: "No se inquieten por nada; más bien, en toda ocasión, con oración y ruego, presenten sus peticiones a Dios y denle gracias. Y la paz de Dios, que sobrepasa todo entendimiento, cuidará sus corazones y sus pensamientos en Cristo Jesús.",
      },
      { reference: "Mateo 6:9-13" },
      { reference: "Lucas 11:1" },
    ],
    explanation: [
      "La oración no requiere palabras especiales ni un lugar particular. Es hablar con Dios de manera honesta: darle gracias, contarle lo que sentimos y pedirle ayuda.",
      "Los discípulos le pidieron a Jesús que les enseñara a orar, y él les compartió el Padre Nuestro. Esa oración nos muestra que podemos acercarnos a Dios con confianza.",
      "La Biblia promete que, cuando presentamos nuestras preocupaciones a Dios, su paz puede guardar nuestro corazón y nuestros pensamientos.",
    ],
    reflection:
      "Orar es también escuchar y descansar en la presencia de Dios. No importa si tus palabras son pocas o sencillas. Dios valora un corazón sincero más que un discurso perfecto.",
    activity:
      "Si lo deseas, escribe una oración corta con tus propias palabras: algo por lo que estés agradecido y algo que quieras poner en manos de Dios.",
    illustration: "dove",
  },
  {
    slug: "las-ensenanzas-de-jesus",
    order: 8,
    title: "Las enseñanzas de Jesús",
    summary: "Jesús enseñó a amar a Dios y a los demás, y nos mostró con su vida cómo hacerlo.",
    references: [
      {
        reference: "Juan 13:34",
        text: "Este mandamiento nuevo les doy: que se amen los unos a los otros. Así como yo los he amado, también ustedes deben amarse los unos a los otros.",
      },
      {
        reference: "Mateo 11:28",
        text: "Vengan a mí todos ustedes que están cansados y agobiados, y yo les daré descanso.",
      },
      { reference: "Mateo 22:37-39" },
      { reference: "Mateo 5:1-12" },
    ],
    explanation: [
      "Jesús enseñaba en lugares cotidianos: junto al lago, en los caminos, en las casas. Usaba historias sencillas, llamadas parábolas, para explicar verdades profundas.",
      "Cuando le preguntaron cuál era el mandamiento más importante, respondió que es amar a Dios con todo el ser y amar al prójimo como a uno mismo.",
      "Jesús no solo habló del amor; lo vivió. Por eso pidió a sus seguidores que se amaran unos a otros como él los había amado. También invitó a los cansados a acercarse a él para encontrar descanso.",
    ],
    reflection:
      "Las enseñanzas de Jesús no son una lista de reglas frías, sino una invitación a vivir de una manera nueva. Cada pequeño gesto de amor, paciencia o perdón refleja su manera de vivir.",
    activity:
      "Lee el Sermón del Monte en Mateo 5 y elige una enseñanza que quieras poner en práctica esta semana.",
    illustration: "bible",
  },
  {
    slug: "muerte-y-resurreccion",
    order: 9,
    title: "La muerte y resurrección de Jesús",
    summary: "Jesús murió por nosotros y resucitó, venciendo a la muerte y abriendo un camino de esperanza.",
    references: [
      {
        reference: "Romanos 5:8",
        text: "Pero Dios demuestra su amor por nosotros en esto: en que cuando todavía éramos pecadores, Cristo murió por nosotros.",
      },
      {
        reference: "Mateo 28:6",
        text: "No está aquí, pues ha resucitado, tal como dijo. Vengan a ver el lugar donde lo pusieron.",
      },
      { reference: "1 Corintios 15:3-4" },
      { reference: "Juan 11:25" },
    ],
    explanation: [
      "Los Evangelios relatan que Jesús fue crucificado en Jerusalén. Aunque era inocente, entregó su vida, y la Biblia explica que lo hizo por amor a nosotros.",
      "Pero la historia no terminó en la tumba. Al tercer día, unas mujeres fueron al sepulcro y escucharon la noticia: Jesús había resucitado.",
      "La resurrección es el centro de la fe cristiana. Muestra que Jesús tiene poder sobre la muerte y que su promesa de vida eterna es verdadera.",
    ],
    reflection:
      "La cruz nos recuerda cuánto nos ama Dios, y la tumba vacía nos recuerda que la muerte no tiene la última palabra. En Jesús hay esperanza incluso en los momentos más oscuros.",
    activity:
      "Si quieres, lee el relato de la resurrección en Lucas 24:1-12 y piensa qué cambia saber que Jesús vive.",
    illustration: "light",
  },
  {
    slug: "como-continuar",
    order: 10,
    title: "Cómo continuar aprendiendo sobre la fe cristiana",
    summary: "Conocer a Jesús es un camino que se recorre paso a paso, y siempre puedes seguir avanzando.",
    references: [
      {
        reference: "Juan 20:31",
        text: "Pero estas se han escrito para que ustedes crean que Jesús es el Cristo, el Hijo de Dios, y para que al creer en su nombre tengan vida.",
      },
      {
        reference: "Salmo 119:105",
        text: "Tu palabra es una lámpara a mis pies; es una luz en mi sendero.",
      },
      { reference: "Hechos 2:42" },
      { reference: "Mateo 7:7" },
    ],
    explanation: [
      "Una buena manera de seguir es leer uno de los Evangelios. El Evangelio de Juan o el de Marcos son un excelente comienzo: puedes leer un capítulo al día y conocer de cerca la vida de Jesús.",
      "También puedes seguir orando con tus propias palabras. No hace falta ser experto; la oración se aprende practicándola con sencillez.",
      "Los primeros cristianos se reunían para aprender, compartir y orar juntos. Si lo deseas, busca una comunidad cristiana local de confianza donde puedas hacer preguntas y crecer acompañado.",
      "Las preguntas son bienvenidas. Está bien tener dudas; buscar respuestas con sinceridad es parte del camino, y Dios no se aleja de quien lo busca.",
    ],
    reflection:
      "No tienes que recorrer este camino con prisa ni solo. Cada paso, por pequeño que parezca, tiene valor. Dios camina contigo a tu ritmo.",
    activity:
      "Si te animas, empieza a leer el Evangelio de Marcos, un capítulo por día, o conversa sobre lo que has aprendido con alguien de confianza.",
    illustration: "path",
  },
];
