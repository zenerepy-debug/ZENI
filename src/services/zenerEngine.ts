import { ZenerState, UserSession } from '../types/zener.js';

// Base de datos temporal en memoria para las sesiones de los clientes
const sessions = new Map<string, UserSession>();

// Mensajes oficiales del sistema Zener
export const TEXTO_RECHAZO_COBERTURA = `Lo sentimos, tu ubicación está fuera de nuestra zona de cobertura. Brindamos servicio técnico exclusivo a domicilio únicamente dentro de las ciudades que figuran en nuestra lista. ¡Gracias por tu contacto!`;

export const TEXTO_RECHAZO_DISPLAY = `Analizando el síntoma seleccionado, tu televisor presenta una falla de display (pantalla). Por razones técnicas y de costo, no realizamos cambios ni reparaciones de pantallas. Si deseas cotizar la reparación de OTRO televisor diferente, escribe la palabra Inicio para reiniciar el formulario. ¡Gracias por tu contacto!`;

export const TEXTO_EXITO_CLIENTE = `Completaste el formulario con éxito. El técnico asignado a tu caso te escribirá directamente desde su número personal para dar seguimiento. ¡Muchas gracias por tu tiempo!`;

export function getOrCreateSession(waId: string): UserSession {
  if (!sessions.has(waId)) {
    sessions.set(waId, {
      waId,
      state: 'ZONA_1A',
      lastInteraction: Date.now()
    });
  }
  return sessions.get(waId)!;
}

export interface WhatsAppResponsePayload {
  type: 'text' | 'buttons' | 'list';
  text: string;
  buttons?: string[];
  listTitle?: string;
  listSections?: { title: string; rows: { id: string; title: string; description?: string }[] }[];
}
export async function processZenerMessage(waId: string, textInput: string, interactiveId?: string): Promise<WhatsAppResponsePayload> {
  const session = getOrCreateSession(waId);
  const normalizedText = textInput.trim().toLowerCase();

  // Bloqueo permanente por fuera de cobertura
  if (session.state === 'RECHAZADO_COB') {
    return { type: 'text', text: TEXTO_RECHAZO_COBERTURA };
  }

  // Permitir reinicio con la palabra exacta "Inicio" salvo si está bloqueado por cobertura
 if (normalizedText === 'inicio' && (session.state as string) !== 'RECHAZADO_COB') {
    session.state = 'ZONA_1A';
    session.ciudad = undefined;
    session.categoriaFalla = undefined;
    session.fallaEspecifica = undefined;
    session.marca = undefined;
    session.tamano = undefined;
  }

  // Si ya completó con éxito
  if (session.state === 'CALIFICADO') {
    return { type: 'text', text: TEXTO_EXITO_CLIENTE };
  }

  switch (session.state) {
    case 'ZONA_1A':
      if (interactiveId) {
        if (interactiveId === 'mas_ciudades') {
          session.state = 'ZONA_1B';
          return {
            type: 'list',
            text: 'Selecciona tu ciudad de la lista complementaria:',
            listTitle: 'Ciudades Parte 2',
            listSections: [{
              title: 'Zonas',
              rows: [
                { id: 'aregua', title: 'Areguá' },
                { id: 'limpio', title: 'Limpio' },
                { id: 'mra', title: 'Mariano Roque Alonso' },
                { id: 'otra_ciudad', title: 'Otra ciudad / Interior' }
              ]
            }]
          };
        } else {
          session.ciudad = textInput;
          session.state = 'CATEGORIA_2A';
          return {
            type: 'buttons',
            text: 'Selecciona la categoría general de la falla de tu televisor:',
            buttons: ['Posible falla display', 'Posible falla de LED', 'Posible falla placa']
          };
        }
      }
      return {
        type: 'list',
        text: '¡Hola! Bienvenido al asistente técnico de Zener. Para iniciar tu solicitud de asistencia a domicilio, por favor selecciona tu ciudad de residencia:',
        listTitle: 'Zonas de Cobertura',
        listSections: [{
          title: 'Ciudades Disponibles',
          rows: [
            { id: 'asuncion', title: 'Asunción' },
            { id: 'lambare', title: 'Lambaré' },
            { id: 'villa_elisa', title: 'Villa Elisa' },
            { id: 'nemby', title: 'Ñemby' },
            { id: 'san_antonio', title: 'San Antonio' },
            { id: 'fdm', title: 'Fernando de la Mora' },
            { id: 'capiata', title: 'Capiatá' },
            { id: 'san_lorenzo', title: 'San Lorenzo' },
            { id: 'luque', title: 'Luque' },
            { id: 'mas_ciudades', title: 'Más ciudades' }
          ]
        }]
      };

    case 'ZONA_1B':
      if (interactiveId) {
        if (interactiveId === 'otra_ciudad') {
          session.state = 'RECHAZADO_COB';
          return { type: 'text', text: TEXTO_RECHAZO_COBERTURA };
        } else {
          session.ciudad = textInput;
          session.state = 'CATEGORIA_2A';
          return {
            type: 'buttons',
            text: 'Selecciona la categoría general de la falla de tu televisor:',
            buttons: ['Posible falla display', 'Posible falla de LED', 'Posible falla placa']
          };
        }
      }
      return { type: 'text', text: 'Por favor, selecciona una opción válida de la lista de ciudades.' };
    case 'CATEGORIA_2A':
      if (normalizedText.includes('display')) {
        session.categoriaFalla = 'Display';
        session.state = 'FALLA_DISPLAY_2B';
        return {
          type: 'list',
          text: 'Selecciona el síntoma exacto que presenta la pantalla de tu TV:\n\n1. Vidrio roto o rajado por impacto.\n2. Recibió un golpe (interno/externo).\n3. Rayas verticales/horizontales finas de colores.\n4. Franjas gruesas de color o negras.\n5. Mancha negra como tinta derramada.\n6. Pantalla con un color fijo sin imagen.\n7. Brillo gris/blanco de fondo sin video.\n8. Lluvia, interferencia o parpadeo severo.\n9. Al tocar el marco la imagen cambia.\n10. Imagen se ve doble o salta verticalmente.',
          listTitle: 'Fallas de Display',
          listSections: [{
            title: 'Síntomas',
            rows: [
              { id: 'disp_1', title: '1. Vidrio roto/rajado' },
              { id: 'disp_2', title: '2. Recibió un golpe' },
              { id: 'disp_3', title: '3. Rayas finas color' },
              { id: 'disp_4', title: '4. Franjas gruesas' },
              { id: 'disp_5', title: '5. Mancha negra/tinta' },
              { id: 'disp_6', title: '6. Pantalla color fijo' },
              { id: 'disp_7', title: '7. Brillo gris sin vid' },
              { id: 'disp_8', title: '8. Lluvia/Interferen' },
              { id: 'disp_9', title: '9. Al tocar el marco' },
              { id: 'disp_10', title: '10. Imagen doble/salta' }
            ]
          }]
        };
      } else if (normalizedText.includes('led')) {
        session.categoriaFalla = 'LED';
        session.state = 'FALLA_LED_2C';
        return {
          type: 'list',
          text: 'Selecciona el síntoma exacto relacionado con la IMAGEN de tu TV:\n\n1. IMAGEN oscura por completo pero se escucha el sonido.\n2. No se ve la IMAGEN, pero al alumbrar con una linterna de cerca se nota el video al fondo.\n3. Siluetas o sombras oscuras en movimiento con la luz apagada.\n4. Muestra el logo de la marca por 1 segundo y luego se apaga la IMAGEN.\n5. La IMAGEN se apaga por completo a los 15 minutos de uso pero sigue el sonido.\n6. La luz de fondo titila constantemente y la IMAGEN se queda oscura.\n7. IMAGEN muy tenue o lavada que apenas se distingue.\n8. Manchas de tonalidad azul o violeta en zonas de la IMAGEN.\n9. Puntos blancos brillantes distribuidos por la IMAGEN (como focos).\n10. La mitad de la IMAGEN se ve opaca, más oscura o sombreada que la otra.',
          listTitle: 'Fallas de LED',
          listSections: [{
            title: 'Síntomas',
            rows: [
              { id: 'led_1', title: '1. Oscura con sonido' },
              { id: 'led_2', title: '2. Imagen con linterna' },
              { id: 'led_3', title: '3. Siluetas a oscuras' },
              { id: 'led_4', title: '4. Logo 1s y apaga' },
              { id: 'led_5', title: '5. Apaga a los 15 min' },
              { id: 'led_6', title: '6. Titila e imag oscu' },
              { id: 'led_7', title: '7. Imagen muy tenue' },
              { id: 'led_8', title: '8. Manchas azul/viol' },
              { id: 'led_9', title: '9. Puntos blancos' },
              { id: 'led_10', title: '10. Mitad imag opaca' }
            ]
          }]
        };
      } else if (normalizedText.includes('placa')) {
        session.categoriaFalla = 'Placa';
        session.state = 'FALLA_PLACA_2D';
        return {
          type: 'list',
          text: 'Selecciona el síntoma exacto relacionado con los componentes de placa:\n\n1. Muerto por completo (no prende ninguna luz de standby).\n2. Luz de standby encendida fija pero el equipo no obedece al control ni al botón.\n3. Dejó de funcionar tras un rayo, baja de tensión o tormenta eléctrica.\n4. Se queda colgado o congelado indefinidamente en el logo de inicio.\n5. Reinicio continuo (prende el logo, se apaga y vuelve a repetir en bucle).\n6. Los puertos HDMI o USB no reconocen señal ni dispositivos.\n7. Falla de conectividad en Apps, Smart TV o Wi-Fi desconectado.\n8. La imagen se despliega perfectamente pero no emite audio.\n9. La luz de standby titila seguido de forma intermitente sin encender.\n10. Prende cuando quiere (falla aleatoria de encendido).',
          listTitle: 'Fallas de Placa',
          listSections: [{
            title: 'Síntomas',
            rows: [
              { id: 'placa_1', title: '1. Muerto por completo' },
              { id: 'placa_2', title: '2. Standby no obedece' },
              { id: 'placa_3', title: '3. Rayo o tormenta' },
              { id: 'placa_4', title: '4. Colgado en el logo' },
              { id: 'placa_5', title: '5. Reinicio continuo' },
              { id: 'placa_6', title: '6. HDMI/USB sin señal' },
              { id: 'placa_7', title: '7. Falla Apps/Wi-Fi' },
              { id: 'placa_8', title: '8. Imag bien sin audio' },
              { id: 'placa_9', title: '9. Standby titila seg' },
              { id: 'placa_10', title: '10. Prende cuando quier' }
            ]
          }]
        };
      }
      return { type: 'text', text: 'Por favor, utiliza los botones en pantalla para indicar la categoría de la falla.' };

    case 'FALLA_DISPLAY_2B':
      if (interactiveId) {
        session.state = 'RECHAZADO_DISP';
        return { type: 'text', text: TEXTO_RECHAZO_DISPLAY };
      }
      return { type: 'text', text: 'Por favor, selecciona un síntoma de la lista.' };
    case 'FALLA_LED_2C':
    case 'FALLA_PLACA_2D':
      if (interactiveId) {
        session.fallaEspecifica = textInput;
        session.state = 'MARCA_3';
        return {
          type: 'list',
          text: 'Selecciona la marca de tu televisor:',
          listTitle: 'Marcas de TV',
          listSections: [{
            title: 'Fabricantes',
            rows: [
              { id: 'm_samsung', title: 'Samsung' },
              { id: 'm_lg', title: 'LG' },
              { id: 'm_sony', title: 'Sony' },
              { id: 'm_philips', title: 'Philips' },
              { id: 'm_tokyo', title: 'Tokyo' },
              { id: 'm_jam', title: 'Jam' },
              { id: 'm_midas', title: 'Midas' },
              { id: 'm_fama', title: 'Fama' },
              { id: 'm_hisense', title: 'Hisense' },
              { id: 'm_generica', title: 'Otra marca genérica' }
            ]
          }]
        };
      }
      return { type: 'text', text: 'Por favor, selecciona una falla válida de la lista.' };

    case 'MARCA_3':
      if (interactiveId) {
        session.marca = textInput;
        session.state = 'TAMANO_4A';
        return {
          type: 'list',
          text: 'Selecciona el tamaño (pulgadas) de tu televisor:',
          listTitle: 'Tamaño del TV',
          listSections: [{
            title: 'Pulgadas Parte 1',
            rows: [
              { id: 't_32', title: '32"' },
              { id: 't_37', title: '37"' },
              { id: 't_39', title: '39"' },
              { id: 't_40', title: '40"' },
              { id: 't_42', title: '42"' },
              { id: 't_43', title: '43"' },
              { id: 't_46', title: '46"' },
              { id: 't_47', title: '47"' },
              { id: 't_48', title: '48"' },
              { id: 't_mas', title: 'Más tamaños' }
            ]
          }]
        };
      }
      return { type: 'text', text: 'Por favor, selecciona la marca de tu televisor.' };

    case 'TAMANO_4A':
      if (interactiveId) {
        if (interactiveId === 't_mas') {
          session.state = 'TAMANO_4B';
          return {
            type: 'list',
            text: 'Selecciona el tamaño de la lista complementaria:',
            listTitle: 'Tamaños Grandes',
            listSections: [{
              title: 'Pulgadas Parte 2',
              rows: [
                { id: 't_49', title: '49"' },
                { id: 't_50', title: '50"' },
                { id: 't_55', title: '55"' },
                { id: 't_58', title: '58"' },
                { id: 't_60', title: '60"' },
                { id: 't_65', title: '65"' },
                { id: 't_75', title: '75"' }
              ]
            }]
          };
        } else {
          session.tamano = textInput;
          session.state = 'CALIFICADO';
          await sendAlertToTechnician(session);
          return { type: 'text', text: TEXTO_EXITO_CLIENTE };
        }
      }
      return { type: 'text', text: 'Por favor, selecciona el tamaño de la lista.' };

    case 'TAMANO_4B':
      if (interactiveId) {
        session.tamano = textInput;
        session.state = 'CALIFICADO';
        await sendAlertToTechnician(session);
        return { type: 'text', text: TEXTO_EXITO_CLIENTE };
      }
      return { type: 'text', text: 'Por favor, selecciona un tamaño válido.' };

    default:
      return { type: 'text', text: 'Escribe "Inicio" para comenzar el formulario.' };
  }
}

async function sendAlertToTechnician(session: UserSession): Promise<void> {
  const WHATSAPP_TOKEN = process.env.META_ACCESS_TOKEN;
  const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.error('Faltan variables de entorno para enviar la alerta al técnico.');
    return;
  }

  const cleanPhone = session.waId.replace(/\D/g, '');
  const alertText = `🔥 NEW CLIENTE CALIFICADO - ZENER\n📱 Contacto Cliente: https://wa.me{cleanPhone}\n📍 Ciudad: ${session.ciudad || 'No especificada'}\n🛠️ Falla: [${session.categoriaFalla || ''}] ${session.fallaEspecifica || ''}\n📺 Marca: ${session.marca || ''}\n📏 Tamaño: ${session.tamano || ''}`;

  try {
    const axios = (await import('axios')).default;
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: '595981121588',
        type: 'text',
        text: { body: alertText }
      },
      {
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
      }
    );
    console.log(`Alerta enviada al técnico para el cliente: ${session.waId}`);
  } catch (error: any) {
    console.error('Error al enviar la alerta:', error?.response?.data || error.message);
  }
}
