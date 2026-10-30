/**
 * AcademiX - Automated PR Reviewer Script
 * 
 * Este script analiza el `git diff` de un Pull Request y utiliza un LLM (Google Gemini por defecto,
 * con fallback opcional para OpenAI o Anthropic) para evaluar criterios críticos del proyecto:
 * 1. Aislamiento Multi-Tenant (Path vs Body, queries filtradas, institution_id en entidades)
 * 2. Control de Roles y Autorización (InstitutionMembership, roles contextuales de curso/sección)
 * 3. Auditoría Inmutable (AuditEvents en la misma transacción de DB)
 * 4. Consistencia Académica (cálculo de notas en backend, ponderaciones congeladas, pauta protegida)
 * 5. Cobertura de Tests y Filosofía Stack-Light
 * 
 * Mitiga el riesgo R-16 actualizando un único comentario en el PR (evita spam) y no bloquea el CI ante errores.
 */

import { execSync } from 'node:child_process';

// Marcador HTML oculto para identificar el comentario del bot y editarlo en lugar de duplicar
const COMMENT_MARKER = '<!-- academix-pr-reviewer -->';

// System Prompt estricto basado en lms-reviewer y las decisiones de arquitectura de AcademiX
const SYSTEM_PROMPT = `
Eres el revisor automatizado de Pull Requests para AcademiX, una plataforma universitaria LMS multi-tenant.
Tu misión es auditar riesgos críticos de arquitectura, aislamiento, roles, auditoría y consistencia antes de la revisión humana.

REGLAS DE REVISIÓN ESTRICTAS:
1. AISLAMIENTO MULTI-TENANT (CRÍTICO):
   - La institución se resuelve exclusivamente desde el path URL (/api/v1/institutions/{slug}/...). Alerta si un endpoint o DTO recibe 'institution_id' en el body desde el cliente.
   - Toda consulta, mutación y entidad tenant-owned debe incluir y filtrar por 'institution_id'. Bajo ninguna circunstancia permitas mezclar datos entre instituciones (ej. UC vs. UTFSM).
2. CONTROL DE ROLES (CRÍTICO):
   - Exige validación de 'InstitutionMembership' activa y permisos específicos según alcance (coordinador en curso; docente/ayudante/estudiante en sección).
   - Prohíbe que usuarios con acceso a la pauta de un quiz puedan rendirlo como estudiantes.
3. AUDITORÍA INMUTABLE (CRÍTICO):
   - Operaciones críticas (publicar o modificar notas, cancelar intentos de quiz, alterar membresías o ponderaciones) DEBEN registrar un AuditEvent inmutable y sanitizado en la misma transacción de DB.
4. CONSISTENCIA ACADÉMICA Y CALIFICACIONES (ALTO):
   - Cálculo de notas y promedios DEBE ocurrir en backend, nunca en frontend.
   - Bloquea cambios de ponderaciones o creación de ítems si ya existe una nota publicada en el curso.
   - La pauta de corrección jamás debe exponerse a estudiantes ni modificarse si ya hay intentos iniciados.
   - Notas publicadas e intentos cancelados son terminales e inmutables.
5. TESTS (ALTO):
   - Exige tests unitarios o de integración ante cambios en lógica de dominio, endpoints o aislamiento.
6. STACK-LIGHT (MEDIO):
   - Alerta si se introducen dependencias o abstracciones no justificadas por el requerimiento actual.

REGLAS DE FORMATO Y PREVENCIÓN DE RUIDO (ESTRICTO):
- NO comentes sobre estilo, indentación, formato, comillas ni orden de imports (ESLint y Prettier ya se encargan).
- Si NO detectas observaciones relevantes, responde ÚNICAMENTE con:
  ✅ **AcademiX Bot Reviewer:** No se detectaron observaciones de aislamiento multi-tenant, roles, auditoría ni consistencia académica en este diff.
- Si detectas observaciones, repórtalas estructuradas de mayor a menor severidad:
  - \`[CRÍTICO|ALTO|MEDIO]\` \`ruta/al/archivo:línea\`: Explicación concisa del riesgo y sugerencia de corrección según la arquitectura de AcademiX.
`.trim();

/**
 * Obtiene el git diff filtrado contra la rama base del PR.
 * Excluye archivos que consumen tokens innecesarios o no aportan lógica analizable.
 */
function getFilteredDiff(baseRef) {
  const excludePatterns = [
    ':!*pnpm-lock.yaml',
    ':!*package-lock.json',
    ':!*.png',
    ':!*.jpg',
    ':!*.jpeg',
    ':!*.svg',
    ':!*.ico',
    ':!*.pdf',
    ':!*.woff',
    ':!*.woff2',
    ':!mockups/assets/*'
  ];

  // Intenta comparar con origin/baseRef, si falla usa baseRef directamente
  const targetBranch = baseRef ? `origin/${baseRef}` : 'origin/dev';
  try {
    const cmd = `git diff ${targetBranch}...HEAD -- . ${excludePatterns.map(p => `'${p}'`).join(' ')}`;
    return execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }).trim();
  } catch (err) {
    console.warn(`[WARN] No se pudo obtener el diff contra ${targetBranch}, intentando contra HEAD~1:`, err.message);
    try {
      return execSync(`git diff HEAD~1 -- . ${excludePatterns.map(p => `'${p}'`).join(' ')}`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
      }).trim();
    } catch {
      return '';
    }
  }
}

/**
 * Llama a la API de Google Gemini (Google AI Studio)
 */
async function callGemini(apiKey, diffText) {
  const models = [
    process.env.GEMINI_MODEL,
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest'
  ].filter(Boolean);
  let lastError = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Revisa el siguiente Pull Request diff de acuerdo a las reglas de AcademiX:\n\n\`\`\`diff\n${diffText}\n\`\`\``
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API (${model}) falló con estado ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const reviewText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reviewText) {
        return reviewText.trim();
      }
    } catch (err) {
      console.warn(`[WARN] Error usando modelo ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('No se pudo obtener respuesta de Gemini.');
}

/**
 * Llama a la API de OpenAI (Fallback opcional si se usa OPENAI_API_KEY)
 */
async function callOpenAI(apiKey, diffText) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Revisa el siguiente Pull Request diff:\n\n\`\`\`diff\n${diffText}\n\`\`\`` }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API falló con estado ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * Publica o actualiza el comentario en el Pull Request de GitHub
 */
async function postOrUpdateComment({ repo, prNumber, token, reviewContent }) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'academix-pr-reviewer'
  };

  const bodyContent = `${COMMENT_MARKER}
## 🎓 AcademiX PR Reviewer

${reviewContent}

---
*Revisión automática orientada a aislamiento multi-tenant, roles, auditoría y consistencia académica. La revisión humana obligatoria sigue siendo el criterio final para el merge.*`;

  // 1. Buscar comentarios existentes en el PR para no duplicar (Mitigación R-16)
  const listUrl = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
  const listRes = await fetch(listUrl, { headers });

  if (!listRes.ok) {
    console.warn(`[WARN] No se pudieron listar los comentarios existentes: ${listRes.status}`);
  } else {
    const comments = await listRes.json();
    const existingComment = comments.find(c => c.body && c.body.includes(COMMENT_MARKER));

    if (existingComment) {
      console.log(`[INFO] Actualizando comentario existente ID ${existingComment.id}...`);
      const updateUrl = `https://api.github.com/repos/${repo}/issues/comments/${existingComment.id}`;
      const updateRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ body: bodyContent })
      });

      if (updateRes.ok) {
        console.log('[SUCCESS] Comentario actualizado correctamente.');
        return;
      }
      console.warn(`[WARN] Falló actualización de comentario (${updateRes.status}), creando uno nuevo...`);
    }
  }

  // 2. Si no existe o falló la actualización, crear nuevo comentario
  console.log(`[INFO] Creando nuevo comentario en PR #${prNumber}...`);
  const createRes = await fetch(listUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body: bodyContent })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`No se pudo crear comentario en GitHub: ${createRes.status} - ${errText}`);
  }

  console.log('[SUCCESS] Comentario creado exitosamente en el PR.');
}

/**
 * Función principal
 */
async function main() {
  console.log('--- Iniciando AcademiX PR Reviewer ---');

  const githubToken = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.PR_NUMBER;
  const baseRef = process.env.BASE_REF || 'dev';

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!githubToken || !repo || !prNumber) {
    console.error('[ERROR] Faltan variables de entorno requeridas: GITHUB_TOKEN, GITHUB_REPOSITORY o PR_NUMBER.');
    // Salimos con 0 para no romper el pipeline (Riesgo R-16)
    process.exit(0);
  }

  if (!geminiKey && !openaiKey) {
    console.warn('[WARN] No se encontró GEMINI_API_KEY ni OPENAI_API_KEY en los secretos del repositorio.');
    console.warn('[WARN] Omite la revisión automática pero permite continuar el flujo.');
    process.exit(0);
  }

  // 1. Extraer diff
  const diff = getFilteredDiff(baseRef);
  if (!diff) {
    console.log('[INFO] No se detectaron cambios en código fuente analizable para este PR.');
    process.exit(0);
  }

  // Limitar longitud del diff para evitar exceder cuotas en PRs masivos (100k caracteres ~ 25k tokens)
  const maxDiffLength = 100000;
  const truncatedDiff = diff.length > maxDiffLength
    ? diff.substring(0, maxDiffLength) + '\n\n[Diff truncado por tamaño excesivo...]'
    : diff;

  console.log(`[INFO] Analizando diff (${truncatedDiff.length} caracteres)...`);

  // 2. Llamar al proveedor de IA
  let reviewContent = '';
  try {
    if (geminiKey) {
      console.log('[INFO] Consultando Google Gemini API...');
      reviewContent = await callGemini(geminiKey, truncatedDiff);
    } else if (openaiKey) {
      console.log('[INFO] Consultando OpenAI API...');
      reviewContent = await callOpenAI(openaiKey, truncatedDiff);
    }
  } catch (err) {
    console.warn('[WARN] Error al consultar el proveedor de IA:', err.message);
    // Salimos con 0 para no romper el merge ni bloquear al equipo (R-16)
    process.exit(0);
  }

  if (!reviewContent) {
    console.log('[INFO] No se recibió respuesta del revisor de IA.');
    process.exit(0);
  }

  // 3. Publicar comentario en GitHub
  try {
    await postOrUpdateComment({
      repo,
      prNumber,
      token: githubToken,
      reviewContent
    });
  } catch (err) {
    console.warn('[WARN] Error al publicar comentario en GitHub:', err.message);
    // Continuar sin romper el CI
  }

  console.log('--- Revisión finalizada exitosamente ---');
}

main().catch(err => {
  console.warn('[WARN] Error inesperado en el reviewer:', err);
  process.exit(0);
});

