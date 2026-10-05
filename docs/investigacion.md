# Investigación breve: diseño, confianza y conversión

Documento interno (no se publica). Fecha: 5 de octubre de 2026.

## Resumen en 10 líneas

1. El azul profundo (navy) es el color más asociado con confianza, estabilidad y seriedad; por eso lo usan banca, gobierno y servicios profesionales.
2. El dorado funciona como señal de valor y logro **solo si se usa poco**: acentos, líneas y llamadas a la acción.
3. Fondos claros con texto de alto contraste mejoran la lectura y la percepción de orden (WCAG AA como piso).
4. Una sans geométrica sobria (Montserrat) en pesos ligeros grandes y semibold en etiquetas da jerarquía editorial sin parecer plantilla.
5. La gente escanea en patrón F/Z: lo importante va arriba y a la izquierda, en bloques cortos y con subtítulos claros.
6. Cuantas más opciones, más tarda la decisión (Ley de Hick): un CTA principal por pantalla y navegación de pocas opciones.
7. La credibilidad depende de señales verificables: nombre real, trayectoria concreta, forma de contacto visible y un sitio pulido y rápido.
8. En servicios profesionales, el teléfono como clic para llamar (`tel:`), visible y repetido de forma consistente, reduce la fricción, sobre todo en móvil.
9. Un botón de llamada fijo y discreto en móvil mantiene la acción disponible sin interrumpir la lectura.
10. Se descartan tácticas manipuladoras (urgencia falsa, contadores, testimonios inventados) porque restan credibilidad en un perfil institucional.

## 1. Color y tipografía para confianza y autoridad

- **Azul marino = confianza y autoridad.** Las fuentes coinciden en que el azul reduce el riesgo percibido y que el tono profundo comunica seriedad sin frialdad. Los tonos claros de azul sirven como apoyo para dar cercanía.
  - Slider Revolution, *Blue website design examples*: https://www.sliderrevolution.com/design/blue-website-design/
  - Civille, *The psychology of color in law firm websites* (aplicable a servicios profesionales en general): https://getciville.com/the-psychology-of-color-in-law-firm-websites/
- **Dorado con moderación.** Comunica valor y logro, pero en exceso se ve ostentoso. Se reserva para acentos y CTA.
  - Piktochart, *Website color schemes for startups and consultants*: https://piktochart.com/blog/website-color-schemes/
- **Contraste y legibilidad.** WCAG 2.2 pide una relación ≥ 4.5:1 en texto normal y ≥ 3:1 en texto grande y componentes de interfaz.
  - W3C, *Understanding SC 1.4.3 Contrast (Minimum)*: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- **Tipografía.** Montserrat (licencia OFL) es geométrica, legible y tiene buen soporte de español. Uso solo 3 pesos: 300 para titulares grandes (tono editorial), 400 para texto y 600 para etiquetas y botones.

## 2. Tres referencias de sitios bien diseñados

| Sitio | Qué se toma |
| --- | --- |
| **GOV.UK** (https://www.gov.uk) y su sistema de diseño (https://design-system.service.gov.uk) | Claridad institucional, tipografía grande, una acción principal por página, accesibilidad como estándar. |
| **The Obama Foundation** (https://www.obama.org) | Fotografía documental como protagonista, mucho espacio en blanco, ritmo editorial y voz humana. |
| **Brookings: perfiles de expertos** (https://www.brookings.edu/people/) | Perfil personal centrado en trayectoria y áreas de conocimiento, sin adornos, con autoridad sobria. |

## 3. Prácticas de conversión para servicios profesionales

- **Patrón F y escaneo.** Nielsen Norman Group documentó el patrón F: los usuarios leen la parte superior y el margen izquierdo, así que hay que poner al frente lo importante y usar subtítulos que se puedan escanear.
  - https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
- **Ley de Hick.** Más opciones significa más tiempo para decidir. Navegación de 5 ítems y un solo CTA principal por pantalla.
  - NN/g, *Hick's Law: Designing Long Menu Lists*: https://www.nngroup.com/videos/hicks-law-long-menus/
- **Clic para llamar.** El número debe ser visible, consistente y enlazado con `tel:`. En móvil, un botón fijo mantiene la acción disponible.
  - JDR Group, *9 ways to increase mobile conversion rates*: https://jdrgroup.co.uk/blog/9-ways-to-increase-mobile-conversion-rates
  - 800.com, *From click to call*: https://www.800.com/blog/?p=3654
- **Credibilidad.** Las guías de credibilidad web de Stanford recomiendan que sea fácil verificar quién está detrás del sitio, mostrar experiencia real, facilitar el contacto y cuidar el diseño profesional.
  - Stanford Persuasive Tech Lab, *Web Credibility Guidelines*: https://credibility.stanford.edu/guidelines/
- **Se descarta**: la fórmula común de “urgencia” en los CTA (por ejemplo, “antes de que se llene la agenda”), porque contradice los principios éticos del proyecto.

## 4. Paleta 3 (resultado de la investigación): “Petróleo, piedra y latón”

Objetivo: conservar la confianza del azul, pero con un tono más sereno y distintivo que el marino del Tema 1, sin colores con lectura partidista.

| Token | HEX | Uso | Justificación |
| --- | --- | --- | --- |
| Fondo | `#F6F4EF` | Fondo general | Blanco piedra cálido: menos clínico que el blanco puro y más editorial. |
| Superficie | `#ECE8DF` | Bloques secundarios | Separa secciones sin usar sombras. |
| Tinta | `#14232A` | Texto principal | Contraste de ~15:1 sobre el fondo. |
| Tinta suave | `#44545B` | Texto secundario | ≥ 7:1 sobre el fondo. |
| Primario | `#163C47` | Bloques de color, pie | Azul petróleo: la confianza del azul con la calma del verde y un tono menos corporativo. |
| Acento | `#B58A3C` | Líneas, fondo del CTA | Latón: la idea de valor del dorado, más sobria. |
| Acento fuerte | `#7C5B1E` | Texto dorado sobre claro | Ajustado para cumplir AA (≥ 4.5:1) sobre el fondo. |

Los valores exactos de los 3 temas viven en `src/styles/tokens.css`, y `npm run check:contrast` verifica su contraste.
