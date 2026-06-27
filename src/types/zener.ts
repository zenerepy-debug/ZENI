export type ZenerState =
  | 'ZONA_1A'          // Filtro 1: Primeras 9 ciudades + "Más ciudades"
  | 'ZONA_1B'          // Filtro 1: Ciudades complementarias + "Otra ciudad"
  | 'CATEGORIA_2A'     // Filtro 2: Botones principales (Display, LED, Placa)
  | 'FALLA_DISPLAY_2B' // Filtro 2B: Selección de síntoma de Display (Rechazo)
  | 'FALLA_LED_2C'     // Filtro 2C: Selección de síntoma de LED (Avanza)
  | 'FALLA_PLACA_2D'   // Filtro 2D: Selección de síntoma de Placa (Avanza)
  | 'MARCA_3'          // Filtro 3: Selección de marca de TV
  | 'TAMANO_4A'        // Filtro 4: Primer grupo de tamaños + "Más tamaños"
  | 'TAMANO_4B'        // Filtro 4: Tamaños complementarios
  | 'CALIFICADO'       // Estado final exitoso (Cliente apto)
  | 'RECHAZADO_COB'    // Estado final: Fuera de cobertura (Bloqueo permanente)
  | 'RECHAZADO_DISP';  // Estado final: Falla de display (Permite reinicio con "Inicio")

export interface UserSession {
  waId: string;
  state: ZenerState;
  ciudad?: string;
  categoriaFalla?: 'Display' | 'LED' | 'Placa';
  fallaEspecifica?: string;
  marca?: string;
  tamano?: string;
  lastInteraction: number;
}
