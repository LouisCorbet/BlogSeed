/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/ai/askMistralForArticle.ts
// Objectif : 1) Demander un plan détaillé ; 2) Générer chaque section ; 3) Assembler le HTML.
// Dépendances externes attendues : readSiteSettings(), readIndexSafe(), MISTRAL_URL, MISTRAL_API_KEY

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
import { readIndexSafe } from "@/app/admin/actions";
import { readSiteSettings } from "./siteSettings.server";
// lib/ai/askMistralForArticle.ts
// Étapes : 1) OUTLINE → 2) SECTIONS (parallèle) → 3) ASSEMBLAGE (en code, pas via LLM)

type OutlineItem = {
  id: string; // ex: "s-1", "s-2", "faq"
  title: string; // H2
  goal: string; // intention SEO
  components?: string[]; // ex: ["alert-info","card","stats"]
};
type OutlineResponse = {
  topic: string;
  title: string; // ~70c
  catchphrase: string; // ~120c
  imageAlt: string; // alt concis
  imagePrompt: string; // prompt visuel (carré, sans texte)
  chapoHtml: string; // <p class="text-lg md:text-xl">…</p>
  mainKeyword: string; // mot-clé principal
  outline: OutlineItem[]; // 4–6 sections + "faq" en dernier
};

type AskMistralForArticleResult = {
  title: string;
  htmlInput: string;
  imageAlt: string;
  catchphrase: string;
  imagePrompt?: string;
};

const SYSTEM_OUTLINE = `Tu es un rédacteur web FR expert SEO. Réponds STRICTEMENT en JSON valide.
But : proposer un sujet pertinent et un PLAN d'article de blog.
Contraintes :
- FR ; ton neutre, pédagogique, jamais "je"/"nous"
- SEO : sujet avec requête Google plausible ; fournir "mainKeyword"
- Fournir : "chapoHtml" (balise <p class="text-lg md:text-xl">…</p>)
- Structure : 4–6 sections avec {id,title,goal,components}, finir par id "faq"
- Éviter les 20 derniers titres fournis
- Proposer aussi : title (~70c), catchphrase (~120c), imageAlt, imagePrompt (carré, sans texte)
Clés attendues : topic,title,catchphrase,imageAlt,imagePrompt,chapoHtml,mainKeyword,outline[]`;

const SYSTEM_SECTION = `Tu es un rédacteur web FR expert SEO + UX (DaisyUI/Tailwind).
Produis UNIQUEMENT le HTML d’UNE section demandée, longue (paragraphes 6–10 lignes), concrète et actionnable.
Contraintes :
- FR, ton neutre, pédagogique, sans "je"/"nous"
- Balises : <section id="…">, pas de titre (déjà présent en <h2> ailleurs), <h3>…</h3>, <p>, <ul>…  (pas de <html>/<body>).  Diversifie bien le contenu avec des balses <b> par exemple, et n'utilise pas de markdown.
- Intègre 1 ou 2 composants DaisyUI si suggérés (card, alert, stats) avec sobriété : pas de alert, danger, info, ... : uniquement des bg-base-xxx ou des alert-neutral. 
- Optimiser pour le mot-clé principal fourni
- Si id = "faq" :
  1) <section id="faq"> avec 3–5 Q/R, chaque Q/R dans .alert DaisyUI variée
  2) À la fin du même bloc, inclure <script type="application/ld+json"> en FAQPage JSON-LD aligné avec ces Q/R
  3) exemple de FAQ à suivre : 
<!-- Section FAQ -->
<section id="faq">
  <h2>Questions fréquentes</h2>
  <p class="opacity-80 mb-6">
    Réponses aux questions courantes sur
    <strong>l'organisation d'une salle de bain minimaliste</strong>.
  </p>

  <div class="alert alert-accent not-prose mb-4 flex flex-col items-start">
    <h3 class="font-semibold text-xl mb-2">Comment désencombrer une petite salle de bain ?</h3>
    <p>
      Commencez par trier et désencombrer en gardant seulement l'essentiel. Utilisez des solutions de rangement murales et des organisateurs pour maximiser l'espace disponible. Optez pour des produits polyvalents et rangez de manière intelligente.
    </p>
  </div>

  <div class="alert alert-accent not-prose mb-4 flex flex-col items-start">
    <h3 class="font-semibold text-xl mb-2">Quels sont les produits indispensables dans une salle de bain minimaliste ?</h3>
    <p>
      Les produits indispensables sont ceux que vous utilisez régulièrement. Cela peut inclure un gel douche, un shampoing, une brosse à dents, du dentifrice, et quelques accessoires de base comme une serviette et un tapis de bain.
    </p>
  </div>

  <div class="alert alert-accent not-prose mb-4 flex flex-col items-start">
    <h3 class="font-semibold text-xl mb-2">Comment organiser les placards de salle de bain ?</h3>
    <p>
      Utilisez des boîtes de rangement, des étagères et des séparateurs pour maximiser l'espace. Rangez les objets les plus utilisés à portée de main et ceux moins utilisés dans des placards plus hauts ou plus difficiles d'accès. Étiquetez les boîtes pour faciliter l'accès aux objets.
    </p>
  </div>

  <div class="alert alert-accent not-prose flex flex-col items-start">
    <h3 class="font-semibold text-xl mb-2">Comment maintenir l'ordre dans une salle de bain minimaliste ?</h3>
    <p>
      Rangez immédiatement après avoir utilisé un produit ou un accessoire. Faites un rapide nettoyage des surfaces après chaque utilisation de la salle de bain. Faites un inventaire régulier de votre salle de bain pour désencombrer et maintenir un espace de vie sain et agréable.
    </p>
  </div>
</section>

<!-- Données structurées FAQ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Comment désencombrer une petite salle de bain ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Commencez par trier et désencombrer en gardant seulement l'essentiel. Utilisez des solutions de rangement murales et des organisateurs pour maximiser l'espace disponible. Optez pour des produits polyvalents et rangez de manière intelligente."
      }
    },
    {
      "@type": "Question",
      "name": "Quels sont les produits indispensables dans une salle de bain minimaliste ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Les produits indispensables sont ceux que vous utilisez régulièrement. Cela peut inclure un gel douche, un shampoing, une brosse à dents, du dentifrice, et quelques accessoires de base comme une serviette et un tapis de bain."
      }
    },
    {
      "@type": "Question",
      "name": "Comment organiser les placards de salle de bain ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Utilisez des boîtes de rangement, des étagères et des séparateurs pour maximiser l'espace. Rangez les objets les plus utilisés à portée de main et ceux moins utilisés dans des placards plus hauts ou plus difficiles d'accès. Étiquetez les boîtes pour faciliter l'accès aux objets."
      }
    },
    {
      "@type": "Question",
      "name": "Comment maintenir l'ordre dans une salle de bain minimaliste ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Rangez immédiatement après avoir utilisé un produit ou un accessoire. Faites un rapide nettoyage des surfaces après chaque utilisation de la salle de bain. Faites un inventaire régulier de votre salle de bain pour désencombrer et maintenir un espace de vie sain et agréable."
      }
    }
  ]
}
</script>
`;

/* -------------------- Fonction principale -------------------- */

export async function askMistralForArticle(): Promise<AskMistralForArticleResult> {
  const siteSettings = await readSiteSettings();
  const index = await readIndexSafe();
  const last20 = index.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 20);
  const previousTitles = last20.map((r) => `- ${r.title}`).join("\n");

  // 1) OUTLINE
  const userOutline = [
    (siteSettings.autoPublishPrompt || "").trim(),
    `L'article doit être original et différent des précédents. Titres déjà publiés :\n${previousTitles}`,
  ].join("\n\n");

  const outlineJson = await callMistralJSON({
    model: siteSettings.autoPublishModel || "mistral-large-latest",
    system: SYSTEM_OUTLINE,
    user: userOutline,
    temperature: 0.5,
  });
  function sanitizeOutline(json: any): OutlineResponse {
    return {
      topic: (json.topic || "").toString().trim(),
      title: (json.title || "").toString().trim(),
      catchphrase: (json.catchphrase || "").toString().trim(),
      imageAlt: (json.imageAlt || "").toString().trim(),
      imagePrompt: (json.imagePrompt || "").toString().trim(),
      chapoHtml: (json.chapoHtml || "").toString().trim(),
      mainKeyword: (json.mainKeyword || "").toString().trim(),
      outline: Array.isArray(json.outline)
        ? json.outline.map(
            (item: any, idx: number): OutlineItem => ({
              id: (item.id || `s-${idx + 1}`).toString().trim(),
              title: (item.title || "").toString().trim(),
              goal: (item.goal || "").toString().trim(),
              components: Array.isArray(item.components)
                ? item.components.map((c: any) => c.toString().trim())
                : [],
            })
          )
        : [],
    };
  }

  const outline: OutlineResponse = sanitizeOutline(outlineJson);
  if (
    !outline.title ||
    !outline.catchphrase ||
    !outline.chapoHtml ||
    outline.outline.length === 0
  ) {
    throw new Error("Outline incomplet renvoyé par Mistral");
  }

  // 2) SECTIONS (parallèle avec retries)
  const htmlById = await generateSectionsInParallel({
    items: outline.outline,
    mainKeyword: outline.mainKeyword,
    model: siteSettings.autoPublishModel || "mistral-large-latest",
    maxConcurrency: 3, // ajuste selon ta limite d’API
    retries: 2,
  });

  // 3) ASSEMBLAGE (en code)
  const htmlInput = assembleHtml({
    chapoHtml: outline.chapoHtml,
    outline: outline.outline,
    sectionHtmlMap: htmlById,
  });

  return {
    title: outline.title,
    htmlInput: htmlInput.trim(),
    imageAlt: outline.imageAlt,
    catchphrase: outline.catchphrase,
    imagePrompt: outline.imagePrompt,
  };
}

/* -------------------- Génération des sections -------------------- */

async function generateSectionsInParallel({
  items,
  mainKeyword,
  model,
  maxConcurrency = 3,
  retries = 2,
}: {
  items: OutlineItem[];
  mainKeyword: string;
  model: string;
  maxConcurrency?: number;
  retries?: number;
}): Promise<Record<string, string>> {
  const queue = [...items];
  const results: Record<string, string> = {};
  const workers: Promise<void>[] = [];

  const next = async () => {
    const item = queue.shift();
    if (!item) return;
    const userPayload = JSON.stringify(
      {
        id: item.id,
        title: item.title,
        goal: item.goal,
        mainKeyword,
        suggestedComponents: item.components || [],
      },
      null,
      2
    );

    const html = await withRetries(async () => {
      const raw = await callMistralRaw({
        model,
        system: SYSTEM_SECTION,
        user: `Génère la section suivante (HTML uniquement) :\n${userPayload}`,
        temperature: 0.7,
      });
      return normalizeSectionHtml(raw, item.id, item.title);
    }, retries);

    console.log(`[auto-publish] Section générée : ${item.id} (${html})`);

    results[item.id] = html;
    // boucle suivante
    await next();
  };

  for (let i = 0; i < Math.min(maxConcurrency, items.length); i++) {
    workers.push(next());
  }
  await Promise.all(workers);
  return results;
}

async function withRetries<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let err: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      err = e;
      await sleep(300 * (i + 1)); // backoff simple
    }
  }
  throw err;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* -------------------- Assemblage en code -------------------- */

function assembleHtml({
  chapoHtml,
  outline,
  sectionHtmlMap,
}: {
  chapoHtml: string;
  outline: OutlineItem[];
  sectionHtmlMap: Record<string, string>;
}): string {
  // Sommaire : lister toutes les sections sauf la FAQ
  const navItems = outline.filter((i) => i.id !== "faq");

  const navHtml = `
<!-- Mini sommaire ancré -->
<nav aria-label="Sommaire" class="not-prose mt-8">
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body p-4">
      <h3 class="card-title text-sm mb-3">Sommaire</h3>
      <ul class="menu menu-sm gap-2">
        ${navItems
          .map(
            (i) => `
        <li>
          <a href="#${escapeAttr(
            i.id
          )}" class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-base-300">
            <span class="text-lg opacity-70">›</span> ${escapeText(i.title)}
          </a>
        </li>`
          )
          .join("")}
      </ul>
    </div>
  </div>
</nav>`.trim();

  // Sections dans l’ordre de l’outline
  const sectionsHtml = outline
    .filter((i) => i.id !== "faq")
    .map((i) => sectionHtmlMap[i.id] || "")
    .filter(Boolean)
    .join(`\n\n<hr class="border-base-300" />\n\n`);

  // FAQ à la fin (si fournie)
  const faqHtml = sectionHtmlMap["faq"] || "";

  // Assemblage final
  return [
    "<!-- Chapô / intro courte -->",
    chapoHtml.trim(),
    "",
    navHtml,
    "",
    '<hr class="border-base-300" />',
    "",
    sectionsHtml,
    "",
    '<hr class=" border-base-300" />',
    "",
    faqHtml,
  ]
    .filter(Boolean)
    .join("\n");
}

/* -------------------- Helpers Mistral -------------------- */

async function callMistralJSON({
  model,
  system,
  user,
  temperature = 0.6,
}: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
}): Promise<any> {
  const res = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Mistral API error (JSON): ${res.status} ${t}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Mistral: empty JSON content");

  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Mistral: invalid JSON");
    return JSON.parse(match[0]);
  }
}

async function callMistralRaw({
  model,
  system,
  user,
  temperature = 0.7,
}: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
}): Promise<string> {
  const res = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Mistral API error (RAW): ${res.status} ${t}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Mistral: empty RAW content");
  return content;
}

/* -------------------- Helpers HTML -------------------- */

// Garantit une section well-formed : <section id="..."><h2>...</h2> … </section>
function normalizeSectionHtml(sectionHtml: string, id: string, title: string) {
  let html = (sectionHtml || "").trim();

  // Si le modèle a renvoyé plusieurs sections, garder la première <section …>…</section>
  const firstSection = html.match(/<section[\s\S]*?<\/section>/i);
  if (firstSection) html = firstSection[0];

  // Envelopper si nécessaire
  if (!/^<section/i.test(html)) {
    html = `<section id="${escapeAttr(id)}">\n  <h2>${escapeText(
      title
    )}</h2>\n${html}\n</section>`;
  }

  // Ajouter l'id si absent
  if (!new RegExp(`id=["']${escapeRegExp(id)}["']`).test(html)) {
    html = html.replace(/<section\b/i, `<section id="${escapeAttr(id)}"`);
  }

  // Ajouter le <h2> si manquant
  if (!/<h2>/i.test(html)) {
    html = html.replace(
      /<section[^>]*>/i,
      (m) => `${m}\n  <h2>${escapeText(title)}</h2>\n`
    );
  }

  return html;
}

function escapeAttr(s: string) {
  return (s || "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function escapeText(s: string) {
  return (s || "").replace(/</g, "&lt;");
}
function escapeRegExp(s: string) {
  return (s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* -------------------- Dépendances externes (à injecter) -------------------- */
// - readSiteSettings()
// - readIndexSafe()
// - MISTRAL_URL
// - MISTRAL_API_KEY
