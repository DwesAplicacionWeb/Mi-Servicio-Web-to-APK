import { AppState, CalendarDay, CategoryItem, DocumentItem, ShortcutItem, TaskItem } from '../types/app';
import { addDaysIso, getTodayIso } from '../utils/dateUtils';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-ordenanzas',
    nombre: 'Ordenanzas',
    tipo: 'principal',
    subcategorias: ['Tráfico', 'Convivencia', 'Animales', 'Terrazas', 'Residuos'],
  },
  {
    id: 'cat-leyes',
    nombre: 'Leyes',
    tipo: 'principal',
    subcategorias: [
      'Ley Foral de Policías',
      'Seguridad Vial',
      'LOPSC',
      'Otra normativa habitual',
    ],
  },
  {
    id: 'cat-protocolos',
    nombre: 'Protocolos',
    tipo: 'principal',
    subcategorias: [
      'Violencia de género',
      'Menores',
      'Accidentes',
      'Objetos perdidos',
      'Perros potencialmente peligrosos',
    ],
  },
  {
    id: 'cat-esquemas',
    nombre: 'Esquemas',
    tipo: 'principal',
    subcategorias: ['Actas', 'Cuadros rápidos', 'Plantillas', 'Modelos internos'],
  },
];

export const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  {
    id: 'sc-kelio',
    nombre: 'Kelio',
    descripcion: 'Portal de fichajes, cuadrantes y presencia',
    url: 'https://fichajes.valledeegues.com:20443/open/login',
    icono: 'clock',
  },
  {
    id: 'sc-nominas',
    nombre: 'Plataforma de nóminas',
    descripcion: 'Acceso externo al portal del empleado y recibos',
    url: 'https://empleado.pyramide.es',
    icono: 'wallet',
  },
  {
    id: 'sc-riacna',
    nombre: 'RIACNA',
    descripcion: 'Red de Información y Atención Ciudadana',
    url: 'https://riacna.es/',
    icono: 'shield',
  },
  {
    id: 'sc-outlook',
    nombre: 'Outlook',
    descripcion: 'Correo corporativo y comunicaciones internas',
    url: 'https://outlook.office.com',
    icono: 'mail',
  },
  {
    id: 'sc-mapa',
    nombre: 'Mapa',
    descripcion: 'Visor cartográfico IDENA Navarra',
    url: 'https://idena.navarra.es/navegar/#ZXh0fGJhc2V8bWFwYWJhc2V8bGF5ZXJzXl42MTMyNzkuODc1fDQ3NDAxMTQuMzQ2fDYxNzExOS44NzV8NDc0MTk0OC4zNDZeJDB8QDR8NXw2fDddfDF8MnwzfEBdXQ==',
    icono: 'map',
  },
];

export const DEFAULT_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-lopsc',
    titulo: 'LO 4/2015 Protección de la Seguridad Ciudadana (LOPSC) — Resumen operativo',
    categoria: 'Leyes',
    subcategoria: 'LOPSC',
    formato: 'TXT',
    ruta_archivo: 'local://leyes/lopsc-resumen.txt',
    fecha_importacion: '2026-01-10',
    favorito: true,
    contenido_texto: `LEY ORGÁNICA 4/2015, DE 30 DE MARZO, DE PROTECCIÓN DE LA SEGURIDAD CIUDADANA (LOPSC)
Guía de referencia rápida para consulta personal en vía pública.

1. IDENTIFICACIÓN DE PERSONAS (Art. 16)
- Supuestos habilitantes: indicios de participación en infracción o necesidad razonable para prevenir un delito.
- Respeto estricto a los principios de proporcionalidad, igualdad de trato y no discriminación.
- Traslado a dependencias policiales únicamente cuando no resulte posible la identificación por ningún medio o exista negativa, por el tiempo estrictamente necesario (máximo 6 horas).
- Registro obligatorio en el libro-registro oficial de diligencias de identificación.

2. REGISTRO CORPORAL EXTERNO Y SUPERFICIAL (Art. 20)
- Procede cuando existan indicios racionales de portar objetos peligrosos o instrumentos vinculados a infracción o delito.
- Realizado por agente del mismo sexo salvo urgencia justificada por riesgo grave e inminente.

3. INFRACCIONES MUY GRAVES (Art. 35) — 30.001 € a 600.000 €
- Reuniones/manifestaciones no comunicadas o prohibidas en infraestructuras críticas.
- Proyección de haces de luz sobre pilotos o conductores de medios de transporte.

4. INFRACCIONES GRAVES (Art. 36) — 601 € a 30.000 €
- Art. 36.6: Desobediencia o resistencia a la autoridad o sus agentes en el ejercicio de sus funciones, así como la negativa a identificarse o alegación de datos falsos.
- Art. 36.10: Portar, exhibir o usar armas prohibidas, o armas de modo negligente, temerario o intimidatorio.
- Art. 36.16: Consumo o tenencia ilícitos de drogas tóxicas, estupefacientes o sustancias psicotrópicas en lugares, vías, establecimientos o transportes colectivos.
- Art. 36.23: Uso no autorizado de imágenes o datos personales o profesionales de autoridades o miembros de las FCS que pueda poner en peligro la seguridad personal o familiar.

5. INFRACCIONES LEVES (Art. 37) — 100 € a 600 €
- Art. 37.4: Faltas de respeto y consideración cuyo destinatario sea un miembro de las FCS en el ejercicio de sus funciones cuando no sea infracción penal.
- Art. 37.7: Ocupación de la vía pública con infracción de lo dispuesto por la Ley o contra decisión adoptada por autoridad competente.
- Art. 37.17: Consumo de alcohol en lugares, vías, establecimientos o transportes públicos cuando perturbe gravemente la tranquilidad ciudadana.`,
  },
  {
    id: 'doc-seguridad-vial',
    titulo: 'Texto Refundido Ley sobre Tráfico y Seguridad Vial — Cuadro rápido',
    categoria: 'Leyes',
    subcategoria: 'Seguridad Vial',
    formato: 'TXT',
    ruta_archivo: 'local://leyes/seguridad-vial.txt',
    fecha_importacion: '2026-01-12',
    favorito: true,
    contenido_texto: `RDL 6/2015 — LEY SOBRE TRÁFICO, CIRCULACIÓN DE VEHÍCULOS A MOTOR Y SEGURIDAD VIAL
Referencia rápida de tasas, inmovilizaciones y pérdida de puntos.

1. TASAS DE ALCOHOLEMIA (Art. 14 LSV / Art. 20 RGC)
- Conductores en general: 0,5 g/l en sangre o 0,25 mg/l en aire espirado.
- Noveles (primeros 2 años) y profesionales: 0,3 g/l en sangre o 0,15 mg/l en aire espirado.
- Menores de edad (cualquier vehículo, incluidos VMP y bicicletas): 0,0 g/l y 0,0 mg/l.
- Presunción delito (Art. 379.2 CP): > 0,60 mg/l en aire espirado o > 1,2 g/l en sangre (o conducción bajo influencia evidente).

2. INMOVILIZACIÓN DEL VEHÍCULO (Art. 104 LSV)
- Carecer de autorización administrativa para circular o de seguro obligatorio (SOA).
- Deficiencias graves que constituyan riesgo especialmente grave para la seguridad vial.
- Positivo en pruebas de alcohol o drogas, salvo que pueda hacerse cargo otro conductor habilitado que arroje resultado negativo.
- Negativa a efectuar las pruebas de detección legalmente establecidas.
- Superar niveles de ruido, gases o humos permitidos reglamentariamente.
- No llevar casco de protección cuando sea obligatorio, hasta que subsane la deficiencia.

3. DETRACCIÓN DE PUNTOS MÁS HABITUALES
- Conducir con tasa de alcohol > 0,50 mg/l (o > 0,30 en profesionales/noveles): 6 puntos.
- Tasa entre 0,26 y 0,50 mg/l: 4 puntos.
- Presencia de drogas en el organismo: 6 puntos.
- Utilizar sujetando con la mano dispositivos de telefonía móvil: 6 puntos.
- No hacer uso de cinturón de seguridad, SRI o casco: 4 puntos.
- No respetar luz roja de semáforo o señal de STOP / Ceda el paso: 4 puntos.`,
  },
  {
    id: 'doc-ley-foral',
    titulo: 'Ley Foral 23/2018 de las Policías de Navarra — Aspectos clave',
    categoria: 'Leyes',
    subcategoria: 'Ley Foral de Policías',
    formato: 'TXT',
    ruta_archivo: 'local://leyes/ley-foral-policias.txt',
    fecha_importacion: '2026-01-14',
    favorito: false,
    contenido_texto: `LEY FORAL 23/2018, DE 19 DE NOVIEMBRE, DE LAS POLICÍAS DE NAVARRA
Puntos de consulta personal sobre estatuto, jornada y principios de actuación.

1. PRINCIPIOS BÁSICOS DE ACTUACIÓN (Art. 4)
- Adecuación al ordenamiento jurídico, respeto a los derechos fundamentales y trato correcto y esmerado a la ciudadanía.
- Congruencia, oportunidad y proporcionalidad en la utilización de los medios a su alcance.
- Dedicación profesional y secreto profesional respecto a informaciones conocidas por razón del cargo.

2. DERECHOS Y DEBERES DEL PERSONAL
- Jornada, horario y régimen de turnos adaptados a las necesidades del servicio público.
- Disfrute de vacaciones anuales retribuidas y permisos por asuntos propios conforme al calendario y normativa municipal aplicable.
- Derecho a formación continua, prevención de riesgos laborales y defensa jurídica en actuaciones derivadas del servicio.`,
  },
  {
    id: 'doc-ord-trafico',
    titulo: 'Ordenanza Municipal de Tráfico y Estacionamiento — Guía práctica',
    categoria: 'Ordenanzas',
    subcategoria: 'Tráfico',
    formato: 'TXT',
    ruta_archivo: 'local://ordenanzas/trafico.txt',
    fecha_importacion: '2026-01-18',
    favorito: false,
    contenido_texto: `ORDENANZA MUNICIPAL DE TRÁFICO, CIRCULACIÓN Y VMP
Resumen de criterios habituales en casco urbano.

1. ESTACIONAMIENTO PROHIBIDO Y RETIRADA CON GRÚA
- Vados debidamente señalizados con placa oficial en vigor.
- Carriles bus, carriles bici y aceras cuando obstaculicen el paso peatonal (< 1,50 m libres).
- Plazas reservadas a Personas con Movilidad Reducida (PMR) sin tarjeta visible o caducada.
- Zonas de carga y descarga fuera del horario autorizado.

2. VEHÍCULOS DE MOVILIDAD PERSONAL (VMP)
- Prohibida circulación por aceras, zonas peatonales y vías interurbanas.
- Plaza única: prohibido circular dos ocupantes.
- Prohibido uso de auriculares y telefonía móvil durante la conducción.
- Alumbrado delantero/trasero obligatorio en horario nocturno o baja visibilidad.`,
  },
  {
    id: 'doc-prot-menores',
    titulo: 'Protocolo de Actuación con Menores en Vía Pública',
    categoria: 'Protocolos',
    subcategoria: 'Menores',
    formato: 'TXT',
    ruta_archivo: 'local://protocolos/menores.txt',
    fecha_importacion: '2026-01-20',
    favorito: false,
    contenido_texto: `PROTOCOLO INTERNO DE ACTUACIÓN CON MENORES
Lista de comprobación procedimental (uso informativo).

1. MENOR EN SITUACIÓN DE RIESGO O DESAMPARO
- Garantizar protección física inmediata y entorno seguro.
- Evitar exposición innecesaria en vía pública.
- Localización urgente de progenitores, tutores legales o guardadores.
- Comunicación a Fiscalía de Menores / Servicios Sociales de guardia según proceda.

2. CONSUMO DE ALCOHOL O SUSTANCIAS POR MENORES
- Prioridad asistencial si presenta síntomas de intoxicación (solicitar recursos sanitarios).
- Entrega exclusiva a padres/tutores legales con constancia de entrega.
- Tramitación administrativa conforme a ordenanza o normativa autonómica aplicable.`,
  },
  {
    id: 'doc-prot-accidentes',
    titulo: 'Protocolo de Intervención en Accidentes de Tráfico Urbanos',
    categoria: 'Protocolos',
    subcategoria: 'Accidentes',
    formato: 'TXT',
    ruta_archivo: 'local://protocolos/accidentes.txt',
    fecha_importacion: '2026-02-02',
    favorito: false,
    contenido_texto: `PROTOCOLO DE INTERVENCIÓN EN ACCIDENTES DE CIRCULACIÓN
Secuencia PAS y aseguramiento de la escena.

1. PROTEGER Y SEÑALIZAR
- Posicionamiento seguro del vehículo policial (protección de zona de intervención y señalización luminosa).
- Uso obligatorio de chaleco reflectante de alta visibilidad.
- Regulación del tráfico y desvío si existen carriles obstruidos.

2. ASISTIR Y EVALUAR HERIDOS
- Valoración inicial de lesionados y solicitud de asistencia sanitaria (112) si procede.
- No retirar casco a motoristas salvo riesgo vital inmediato o personal sanitario.

3. INVESTIGACIÓN Y PRUEBAS
- Pruebas de alcoholemia/drogas a conductores implicados conforme a procedimiento.
- Toma de croquis, mediciones, huellas de frenada y reportaje fotográfico del lugar.
- Aviso a servicio de limpieza viaria si hay derrames de aceite, combustible o cristales.`,
  },
  {
    id: 'doc-form-acta',
    titulo: 'Esquema de Acta de Intervención — Estructura estándar',
    categoria: 'Esquemas',
    subcategoria: 'Actas',
    formato: 'TXT',
    ruta_archivo: 'local://esquemas/plantilla-acta.txt',
    fecha_importacion: '2026-02-05',
    favorito: false,
    contenido_texto: `ESTRUCTURA ESTÁNDAR DE ACTA / BOLETÍN (RECORDATORIO DE CAMPOS)
Nota: Plantilla orientativa para verificar que no falte ningún dato formal en el sistema oficial.

1. ENCABEZAMIENTO
- Fecha, hora exacta y lugar concreto (calle, número, punto kilométrico).
- Identificativos profesionales de los agentes actuantes (números de carné profesional).

2. HECHOS CONSTATADOS
- Relato objetivo, cronológico y circunstanciado de lo observado directamente.
- Precepto infringido (Ley/Ordenanza, artículo y apartado exacto).

3. ELEMENTOS INTERVENIDOS / PRUEBAS
- Descripción detallada, estado, lugar exacto de hallazgo y cadena de custodia si aplica.

4. DILIGENCIA DE FIRMA Y CIERRE
- Manifestación sucinta del interesado si desea hacer constar algo.
- Firma de agentes y del interesado (o constancia de negativa a firmar).`,
  },
];

export function buildSeedState(): AppState {
  const todayIso = getTodayIso();
  const currentYear = new Date().getFullYear();

  // Seed realistic shifts around today so "Próximo turno" and calendar stats feel immediately alive
  const calendarDays: Record<string, CalendarDay> = {};
  const samplePattern: Array<{ offset: number; shift: CalendarDay['servicio']; note: string }> = [
    { offset: -10, shift: 'M', note: 'Servicio ordinario de mañana' },
    { offset: -9, shift: 'M', note: '' },
    { offset: -8, shift: 'T', note: 'Refuerzo evento deportivo' },
    { offset: -7, shift: 'T', note: '' },
    { offset: -6, shift: 'N', note: 'Patrulla nocturna sector centro' },
    { offset: -5, shift: 'N', note: '' },
    { offset: -2, shift: 'M', note: '' },
    { offset: -1, shift: 'M', note: '' },
    { offset: 1, shift: 'M', note: 'Turno de mañana — Revisar equipo al inicio' },
    { offset: 2, shift: 'M', note: '' },
    { offset: 3, shift: 'T', note: '' },
    { offset: 4, shift: 'T', note: '' },
    { offset: 5, shift: 'V', note: 'Día de vacaciones personales' },
    { offset: 6, shift: 'V', note: 'Día de vacaciones personales' },
    { offset: 7, shift: 'AP', note: 'Asuntos propios' },
    { offset: 8, shift: 'N', note: '' },
    { offset: 9, shift: 'N', note: '' },
  ];

  for (const item of samplePattern) {
    const iso = addDaysIso(todayIso, item.offset);
    calendarDays[iso] = {
      id: `day-${iso}`,
      fecha: iso,
      servicio: item.shift,
      observaciones: item.note,
    };
  }

  const tasks: TaskItem[] = [
    {
      id: 'task-1',
      titulo: 'Revisar cámara corporal',
      descripcion: 'Comprobar carga de batería, memoria disponible y soporte de chaleco.',
      fecha: addDaysIso(todayIso, 1),
      prioridad: 3,
      completada: false,
      fecha_creacion: todayIso,
    },
    {
      id: 'task-2',
      titulo: 'Comprar guantes anticorte',
      descripcion: 'Talla M — revisar homologación nivel 5 antes del próximo turno.',
      fecha: addDaysIso(todayIso, 1),
      prioridad: 2,
      completada: false,
      fecha_creacion: todayIso,
    },
    {
      id: 'task-3',
      titulo: 'Presentar informe de curso de reciclaje',
      descripcion: 'Entregar certificado de asistencia en plataforma personal.',
      fecha: addDaysIso(todayIso, 4),
      prioridad: 3,
      completada: false,
      fecha_creacion: todayIso,
    },
    {
      id: 'task-4',
      titulo: 'Revisar etilómetro asignado',
      descripcion: 'Verificar fecha de próxima calibración y boquillas disponibles.',
      fecha: null,
      prioridad: 2,
      completada: false,
      fecha_creacion: todayIso,
    },
    {
      id: 'task-5',
      titulo: 'Renovar certificado digital',
      descripcion: 'Cita previa para actualización en oficina de registro.',
      fecha: addDaysIso(todayIso, 9),
      prioridad: 1,
      completada: false,
      fecha_creacion: todayIso,
    },
    {
      id: 'task-6',
      titulo: 'Actualizar inventario de taquilla',
      descripcion: 'Linterna táctica, silbato y funda porta-guantes revisados.',
      fecha: null,
      prioridad: 1,
      completada: true,
      fecha_creacion: addDaysIso(todayIso, -4),
    },
  ];

  return {
    user: {
      id: 'user-local',
      nombre: 'Agente',
      fecha_creacion: todayIso,
    },
    calendarDays,
    annualSummaries: {
      [currentYear]: {
        id: `summary-${currentYear}`,
        año: currentYear,
        vacaciones_totales: 27,
        vacaciones_ajuste: 0,
        ap_totales: 3,
        ap_ajuste: 0,
      },
    },
    saldoHorasMinutos: 755, // +12h 35m
    hourMovements: [
      {
        id: 'hm-1',
        fecha: addDaysIso(todayIso, -12),
        deltaMinutos: 600,
        motivo: 'Saldo inicial arrastrado',
      },
      {
        id: 'hm-2',
        fecha: addDaysIso(todayIso, -5),
        deltaMinutos: 155,
        motivo: 'Prolongación de jornada (+02h 35m)',
      },
    ],
    tasks,
    notes: [],
    categories: DEFAULT_CATEGORIES,
    documents: DEFAULT_DOCUMENTS,
    shortcuts: DEFAULT_SHORTCUTS,
    codificadoFavorites: [],
    codificadoNotes: {},
    settings: {
      tema: 'light',
      anoTrabajo: currentYear,
      pinActivo: false,
      pinCodigo: '1234',
    },
  };
}
