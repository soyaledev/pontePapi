# Informe de pruebas – PontePapi / BarberTurns

**Fecha:** 27 de febrero de 2025  
**Versión probada:** 1.0.0 (frontend Next.js 14.2, localhost:3000)

---

## Resumen

Se realizó una prueba funcional de los flujos principales de la aplicación usando el navegador MCP (Playwright). La app está operativa; los flujos críticos funcionan correctamente. Se identificaron fallas menores, mejoras de UX y algunos puntos de accesibilidad a corregir.

| Área            | Estado          | Notas                                      |
|-----------------|-----------------|--------------------------------------------|
| Home y navegación | ✅ OK         | Hero, búsqueda, links funcionan             |
| Reserva de turno  | ⚠️ Parcial    | No probado con barbería real (sin datos)   |
| Login dueño       | ✅ OK         | Email y errores correctos                   |
| Registro dueño    | ✅ OK         | Validaciones correctas                      |
| Panel dueño       | ✅ OK         | Protección de rutas correcta                |
| Bloqueo dueño    | ⚠️ UX mejorable | Bloqueo efectivo pero tardío en el flujo   |

---

## Fallas críticas

### 1. Página 404 en inglés

**Ruta:** Cualquier URL inexistente (ej. `/barberia/slug-inexistente`)

**Problema:** Se muestra la página 404 por defecto de Next.js con texto en inglés: *"This page could not be found."*, mientras que el resto de la app está en español.

**Impacto:** Inconsistencia de idioma y peor experiencia para usuarios hispanohablantes.

**Recomendación:** Crear `app/not-found.tsx` con mensaje en español, p.ej. *"Página no encontrada"* con enlace al inicio.

---

### 2. Página de confirmación accesible sin parámetros

**Ruta:** `/reservar/confirmado` (sin query params)

**Problema:** Es accesible directamente y muestra "¡Turno confirmado!" aunque no haya reserva reciente. Solo aparece el texto genérico y "Volver al inicio", sin datos de barbería ni fecha/hora.

**Impacto:** Mensaje engañoso y flujo poco claro si el usuario llega por error o sin haber reservado.

**Recomendación:** Redirigir al home o mostrar un mensaje explícito tipo *"No se encontró información de la reserva. ¿Querés buscar una barbería?"* con enlace al inicio.

---

### 3. Bloqueo del dueño demasiado tarde en el flujo de reserva

**Ubicación:** `ReservarFlow.tsx` (step 4 – Tus datos)

**Problema:** Si un dueño logueado entra a reservar como cliente, puede completar:
- Paso 1: Servicio
- Paso 2: Barbero (si hay barberos)
- Paso 3: Fecha y horario

Solo en el paso 4 ve el mensaje "No podés sacar turnos mientras tengas la cuenta de dueño iniciada" y el botón deshabilitado.

**Impacto:** Mal uso del tiempo del usuario y sensación de flujo roto al llegar al final.

**Recomendación:** Mostrar el bloqueo al inicio del flujo de reserva (antes del paso 1), con el mismo mensaje y el botón "Cerrar sesión para reservar".

---

## Fallas menores

### 4. Inputs sin atributo `autocomplete`

**Ubicación:** `LoginForm.tsx` – inputs de correo y contraseña

**Problema:** Los inputs carecen de `autocomplete`. La consola muestra: *"Input elements should have autocomplete"*.

**Impacto:** Los gestores de contraseñas y autocompletado del navegador no ayudan tanto como podrían.

**Recomendación:** Añadir `autoComplete="email"` y `autoComplete="current-password"` en los inputs correspondientes. El formulario de registro ya usa `autoComplete` correctamente.

---

### 5. Inconsistencia: registro sin "Volver al panel cliente"

**Ubicación:** `dueno/registro`

**Problema:** El login tiene el enlace "Volver al panel cliente" (al home). La página de registro solo tiene "Ya tengo cuenta" (al login).

**Impacto:** Menor: alguien que llegue al registro desde el home no tiene un enlace directo para volver a la vista de cliente.

**Recomendación:** Añadir también en el registro el enlace "Volver al panel cliente" hacia `/`, como en el login.

---

### 6. Advertencias de consola

**Problema:** Se observan:
- `[DOM] Input elements should have autocomplete...`
- `meta name="apple-mobile-web-app-capable"` (menor)

**Recomendación:** Resolver al menos el tema de `autocomplete` para cumplir buenas prácticas.

---

## Mejoras recomendadas

### UX y flujos

1. **Búsqueda vacía:** Cuando no hay resultados, se muestra "Sin resultados". Considerar mensaje más orientado, p.ej. *"No encontramos barberías con ese criterio. Probá con otro término."*.

2. **Envío de email de comprobante:** En `ReservarFlow.tsx` el envío es fire-and-forget (`fetch(...).catch(() => {})`). Considerar un toast o mensaje al usuario si falla, o al menos logging/monitoreo.

3. **Feedback de loading en Google:** Durante "Continuar con Google", el botón se deshabilita pero no hay indicador claro de carga. Añadir un spinner o texto tipo "Redirigiendo...".

### Accesibilidad

4. **Labels en formularios:** Algunos campos usan solo `placeholder`. Se recomienda usar `label` asociado con `htmlFor` o `aria-label` para inputs que no tienen label visible.

5. **Focus en modales:** Los modales (`ReservarFlow`, `TurnosList`) tienen `role="dialog"` y `aria-modal="true"`. Revisar focus trap (encerrar el foco dentro del modal y restaurarlo al cerrar).

6. **Imágenes decorativas:** El Hero usa `alt=""` en la portada, correcto para imágenes decorativas.

### Técnicas

7. **Datos de prueba:** No hay seeds ni datos mock. Para pruebas repetibles, conviene un script de seed o un modo demo con una barbería de ejemplo.

8. **Manejo de errores de Mercado Pago:** El flujo de seña redirige a `/reservar/error` en fallo. Revisar que esa página exista y que el mensaje sea claro.

9. **`/reservar/error`:** Verificar que exista y que cubra los casos de fallo de pago y cancelación.

---

## Flujos probados y resultado

| Flujo                    | Resultado | Notas                                                            |
|--------------------------|-----------|------------------------------------------------------------------|
| Home → Hero, búsqueda    | ✅        | Búsqueda responde; "Sin resultados" si no hay coincidencias      |
| Home → Login             | ✅        | Link "Soy dueño" lleva a `/dueno/login`                         |
| Home → Condiciones/Privacidad | ✅  | Páginas cargan correctamente                                     |
| Login con credenciales inválidas | ✅ | Muestra "Correo o contraseña incorrectos."                       |
| Login → Registro         | ✅        | Enlace "Registrarse" funciona                                    |
| Registro → Login         | ✅        | Enlace "Ya tengo cuenta" funciona                                |
| Acceso a /dueno/turnos sin auth | ✅ | Redirige a `/dueno/login`                                       |
| Barbería inexistente     | ✅        | 404 (en inglés)                                                  |
| /reservar/confirmado con params | ✅ | Muestra barbería, fecha, hora                                    |
| /reservar/confirmado sin params | ⚠️ | Muestra "¡Turno confirmado!" vacío                               |
| Flujo de reserva completo | ⚠️ | No probado; no hay barbería de prueba en la base                 |
| Bloqueo dueño en reserva | ⚠️ | Funciona pero solo en el último paso                             |

---

## Conclusión

La aplicación cumple su función principal y los flujos básicos funcionan bien. Las correcciones prioritarias son:

1. Página 404 en español  
2. Ajuste de `/reservar/confirmado` cuando no hay parámetros  
3. Bloqueo del dueño al inicio del flujo de reserva  
4. Atributos `autocomplete` en el login  

Con estos cambios se mejora la consistencia, la claridad del flujo y la experiencia general del usuario.
