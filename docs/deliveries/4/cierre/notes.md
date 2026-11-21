# Evidencia de cierre E4

## Fuentes

- Enunciado actualizado: `../enunciado_e4.pdf` (diapositivas 77–83).
- Feedback E3: [feedback E3](../meeting_feedback.md) (se normalizó el espacio final del nombre original).
- E3: `../../3/ppt/guion.md` y plan MVP.
- Código de main al inicio: `7d4b666`; documentación E4 en dev: PR #330.

## Requisitos adicionales del feedback

- Comparación antes/después SonarQube y Trivy.
- Métricas frontend y captura Lighthouse.
- Demo y proveedores disponibles; aprendizajes concretos de ingeniería.

## Verificaciones

Se completarán con hora, alcance y resultados observados. No contiene credenciales.

## Entorno de herramientas

- Chrome instalado; Playwright disponible desde skill, no desde raíz.
- Lighthouse se instala únicamente en `/tmp/academix-e4-lighthouse`; sin cambios de dependencias del producto.
- Git remoto: main `7d4b666`; dev agrega documentación `74c0f5f` (#330), sin cambios funcionales.
- Instalación inicial de Lighthouse requirió crear directorio temporal (ENOENT resuelto).

## Resultados remotos 21/11

- Backend: v0.13.1, commit 7d4b666; health/ready 200.
- Primer acceso API: ~27 s; warm health 171 ms, ready 199 ms.
- Frontend UC/UTFSM login 200 y sin errores JS.
- Cuatro logins UI docente/estudiante aprobados; API listas de cursos/material/quizzes/notas 200.
- Ciclo real API en cursos sintéticos E4-VALID-20261121-UC/UTFSM: nota 7,0; publicación, auditoría e IDs ajenos rechazados.
- Archivo TXT de 52 bytes por tenant: subida/publicación/descarga 201/200/200; bytes idénticos. Proveedor físico no inspeccionado.
- CORS permite UC/UTFSM y no devuelve allow-origin para origen ajeno.
- Lighthouse móvil login UC inicial: rendimiento 100, accesibilidad 100, LCP 1,0 s, CLS 0.
- Lighthouse autenticado: sesión conservada, navegación SPA 1633 ms, TBT 0, CLS 0, interacción observada ~101 ms.
- No se envían correos ni se cambian contraseñas. Credenciales únicamente en archivo temporal 0600.
- Feedback Tom incorporado al archivo original: commits en un idioma; norma del repo español.

## Comprobaciones finales

- Lectura UI de módulos y nota publicada pasó en UC/UTFSM, sin excepciones JS.
- Lighthouse público: UC móvil 3 muestras, desktop 1; UTFSM móvil 1. Se conservan HTML/JSON y capturas.
- Gate SonarCloud PR329: mantenibilidad nueva D, cobertura nueva 90,9 %, fiabilidad/seguridad A; 99 issues abiertos en ese análisis. No confundir con la auditoría manual de 0 issues.
- README raíz actualizado al corte E4; feedback normalizado a `meeting_feedback.md` sin espacio final.
- Documentación validada en longitud y enlaces; escaneo de credenciales/JWT sin hallazgos.
