import type { LucideIcon } from 'lucide-react';
import { Dna, Drama, FlaskConical, Languages, Lightbulb, Mic } from 'lucide-react';
import type { ValidationResult } from './pipeline';

export type TrackId = 'creation' | 'understanding' | 'performance';

export const TRACKS: Record<TrackId, { label: string; color: string }> = {
  creation: { label: 'Humor Creation', color: 'gold' },
  understanding: { label: 'Humor Understanding', color: 'violet' },
  performance: { label: 'Human + AI Performance', color: 'magenta' },
};

export interface ModuleDef {
  id: string;
  path: string;
  name: string;
  tagline: string;
  description: string;
  track: TrackId;
  icon: LucideIcon;
  defaultSystem: string;
  schema?: Record<string, unknown>;
  validate: (data: unknown) => ValidationResult<any>;
  buildUserPrompt: (inputs: Record<string, any>) => string;
}

/* ---------------- validation helpers ---------------- */

const asStr = (v: unknown, d = ''): string => (typeof v === 'string' ? v : v == null ? d : String(v));
const asNum = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const clamp10 = (v: unknown): number => Math.max(0, Math.min(10, asNum(v, 5)));

function genomeScores(v: unknown) {
  const o = isObj(v) ? v : {};
  return {
    surprise: clamp10(o.surprise),
    incongruity: clamp10(o.incongruity),
    superiority: clamp10(o.superiority),
    relief: clamp10(o.relief),
    absurdity: clamp10(o.absurdity),
    warmth: clamp10(o.warmth),
    edge: clamp10(o.edge),
    wordplay: clamp10(o.wordplay),
  };
}

/* ---------------- shared schema fragments ---------------- */

const GENOME_SCHEMA = {
  type: 'OBJECT',
  properties: {
    surprise: { type: 'NUMBER' },
    incongruity: { type: 'NUMBER' },
    superiority: { type: 'NUMBER' },
    relief: { type: 'NUMBER' },
    absurdity: { type: 'NUMBER' },
    warmth: { type: 'NUMBER' },
    edge: { type: 'NUMBER' },
    wordplay: { type: 'NUMBER' },
  },
  required: ['surprise', 'incongruity', 'superiority', 'relief', 'absurdity', 'warmth', 'edge', 'wordplay'],
};

const JSON_RULES = `OUTPUT CONTRACT (non-negotiable):
- Respond with ONE valid JSON object matching the requested schema exactly.
- No markdown fences, no commentary, no text outside the JSON.
- Every required field must be present; scores are numbers from 0 to 10.`;

/* ---------------- 1. JOKE COPILOT ---------------- */

const copilot: ModuleDef = {
  id: 'copilot',
  path: '/studio/copilot',
  name: 'Joke Copilot',
  tagline: 'A writers\u2019 room in a box',
  description: 'Generate original jokes with surgical control over style, structure, audience and spice.',
  track: 'creation',
  icon: Lightbulb,
  defaultSystem: `You are a veteran comedy writer who has written for late-night monologues, stand-up specials and sketch shows.
Your craft rules:
- Surprise + truth + brevity = funny. Plant an assumption in the setup, shatter it in the punchline.
- The funniest word lands at the END of the punchline. Trim every syllable that doesn't earn its place.
- Write ORIGINAL jokes only. Never recycle internet jokes, meme formats, or "why did the chicken" skeletons unless explicitly asked.
- Match the requested style, structure, audience and spice level exactly. Read the brief twice before writing.
- Never explain the jokes inside the joke fields — the "mechanism" field exists for that.
${JSON_RULES}`,
  schema: {
    type: 'OBJECT',
    properties: {
      jokes: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            setup: { type: 'STRING' },
            punchline: { type: 'STRING' },
            mechanism: { type: 'STRING' },
            tags: { type: 'ARRAY', items: { type: 'STRING' } },
            scores: {
              type: 'OBJECT',
              properties: {
                surprise: { type: 'NUMBER' },
                incongruity: { type: 'NUMBER' },
                warmth: { type: 'NUMBER' },
                edge: { type: 'NUMBER' },
              },
            },
          },
          required: ['setup', 'punchline', 'mechanism'],
        },
      },
    },
    required: ['jokes'],
  },
  validate: (raw): ValidationResult<any> => {
    if (!isObj(raw)) return { ok: false, errors: ['top-level output must be a JSON object'] };
    const jokes = asArr(raw.jokes).map((j: any) => ({
      setup: asStr(j?.setup),
      punchline: asStr(j?.punchline),
      mechanism: asStr(j?.mechanism, 'unspecified'),
      tags: asArr(j?.tags).map(String).slice(0, 6),
      scores: isObj(j?.scores)
        ? {
            surprise: clamp10(j.scores.surprise),
            incongruity: clamp10(j.scores.incongruity),
            warmth: clamp10(j.scores.warmth),
            edge: clamp10(j.scores.edge),
          }
        : undefined,
    }));
    if (jokes.length === 0) return { ok: false, errors: ['"jokes" array is missing or empty'] };
    if (jokes.some((j) => !j.punchline)) return { ok: false, errors: ['every joke needs at least a punchline'] };
    return { ok: true, errors: [], data: { jokes } };
  },
  buildUserPrompt: (i) => `Write ${i.variants} original joke${i.variants > 1 ? 's' : ''}.

BRIEF
- Topic / premise: ${i.topic || 'anything observational about modern life'}
- Comedic style: ${i.style}
- Structure: ${i.structure}
- Target audience: ${i.audience || 'general comedy-club crowd'}
- Spice level: ${i.spice}/5 (1 = squeaky clean, 3 = club-standard edge, 5 = late-night no-apologies)
- Language: ${i.language}
${i.notes ? `- Extra notes from the writer: ${i.notes}` : ''}

For each joke return: setup, punchline, mechanism (the comedic device at work, e.g. "misdirection via literal interpretation"), up to 4 tags, and self-scores (surprise, incongruity, warmth, edge — 0 to 10).
Make the ${i.variants} jokes meaningfully different from each other — different angles, different mechanisms.`,
};

/* ---------------- 2. EXPLANATION ENGINE ---------------- */

const explain: ModuleDef = {
  id: 'explain',
  path: '/studio/explain',
  name: 'Explanation Engine',
  tagline: 'Dissect why it\u2019s funny',
  description: 'X-ray any joke: structure map, comedic mechanisms, humor-theory fit and a genome profile.',
  track: 'understanding',
  icon: FlaskConical,
  defaultSystem: `You are a humor researcher who teaches comedy theory at a university and consults for stand-up specials.
You explain jokes WITHOUT killing them — like a biologist who dissects with respect for the creature.
Your analytical toolkit:
- Structure: setup (plants an assumption), pivot/turn, punchline (shatters the assumption); rule of three; callbacks; act-outs.
- Mechanisms: incongruity & script opposition (Raskin/Attardo), superiority (Hobbes), relief/release (Freud), benign violation (McGraw/Warren), misdirection, wordplay, irony, exaggeration, understatement, absurdism, observational truth.
- Genome scoring: rate the joke 0-10 on surprise, incongruity, superiority, relief, absurdity, warmth, edge, wordplay.
Be concrete. Quote the exact words that do the work. Never say "it's funny because it's relatable" without showing HOW.
${JSON_RULES}`,
  schema: {
    type: 'OBJECT',
    properties: {
      summary: { type: 'STRING' },
      structure: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            label: { type: 'STRING' },
            text: { type: 'STRING' },
            role: { type: 'STRING' },
          },
          required: ['label', 'text', 'role'],
        },
      },
      mechanisms: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            explanation: { type: 'STRING' },
            strength: { type: 'NUMBER' },
          },
          required: ['name', 'explanation', 'strength'],
        },
      },
      whyItWorks: { type: 'STRING' },
      audienceFit: { type: 'STRING' },
      improvements: { type: 'ARRAY', items: { type: 'STRING' } },
      genome: GENOME_SCHEMA,
    },
    required: ['summary', 'structure', 'mechanisms', 'genome'],
  },
  validate: (raw): ValidationResult<any> => {
    if (!isObj(raw)) return { ok: false, errors: ['top-level output must be a JSON object'] };
    const structure = asArr(raw.structure).map((s: any) => ({
      label: asStr(s?.label, 'part'),
      text: asStr(s?.text),
      role: asStr(s?.role, ''),
    }));
    const mechanisms = asArr(raw.mechanisms).map((m: any) => ({
      name: asStr(m?.name, 'unknown'),
      explanation: asStr(m?.explanation),
      strength: clamp10(m?.strength),
    }));
    if (structure.length === 0) return { ok: false, errors: ['"structure" must contain at least one part'] };
    if (mechanisms.length === 0) return { ok: false, errors: ['"mechanisms" must contain at least one mechanism'] };
    return {
      ok: true,
      errors: [],
      data: {
        summary: asStr(raw.summary),
        structure,
        mechanisms,
        whyItWorks: asStr(raw.whyItWorks),
        audienceFit: asStr(raw.audienceFit),
        improvements: asArr(raw.improvements).map(String),
        genome: genomeScores(raw.genome),
      },
    };
  },
  buildUserPrompt: (i) => `Dissect this joke:

"${i.joke}"

${i.context ? `Context about the audience / setting: ${i.context}` : 'Assume a general adult audience.'}

Provide:
1. summary — one sentence on what the joke is doing.
2. structure — break the joke into its functional parts (setup / pivot / punchline / tag), quoting each part's exact text and its role.
3. mechanisms — the comedic devices at work, each with a quoted-based explanation and a strength score 0-10.
4. whyItWorks — the deeper reason the laugh happens (2-4 sentences).
5. audienceFit — who laughs hardest, who shrugs, who might be offended, and why.
6. improvements — up to 3 concrete rewrites or tweaks that could make it stronger.
7. genome — scores 0-10 on: surprise, incongruity, superiority, relief, absurdity, warmth, edge, wordplay.`,
};

/* ---------------- 3. CULTURAL TRANSLATOR ---------------- */

const translate: ModuleDef = {
  id: 'translate',
  path: '/studio/translate',
  name: 'Cultural Translator',
  tagline: 'Jokes that survive the border crossing',
  description: 'Context-aware joke translation that rebuilds references, wordplay and taboos for a new culture.',
  track: 'understanding',
  icon: Languages,
  defaultSystem: `You are a comedy localization director who has adapted stand-up specials, sitcoms and late-night shows across 30+ markets.
Your philosophy: you never translate jokes — you RE-BUILD them.
- A literal translation is the autopsy, not the goal. You provide it only so the user sees what changed.
- For each adaptation you swap culture-locked references (celebrities, brands, politics, sports, food, etiquette) for equivalents with the same comedic charge in the target culture.
- You reconstruct wordplay in the target language instead of translating it; if a pun can't be rebuilt, you change the mechanism and say so.
- You track taboos, sensitivities and punch-direction rules in the target culture, and you keep the requested edginess level without crossing real red lines.
- You preserve rhythm and punch-word placement in the target language.
${JSON_RULES}`,
  schema: {
    type: 'OBJECT',
    properties: {
      literal: { type: 'STRING' },
      adaptations: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            joke: { type: 'STRING' },
            whyItWorks: { type: 'STRING' },
            swaps: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  from: { type: 'STRING' },
                  to: { type: 'STRING' },
                  reason: { type: 'STRING' },
                },
                required: ['from', 'to', 'reason'],
              },
            },
            risk: { type: 'STRING' },
          },
          required: ['joke', 'whyItWorks'],
        },
      },
      culturalNotes: { type: 'STRING' },
      tabooWarnings: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['literal', 'adaptations'],
  },
  validate: (raw): ValidationResult<any> => {
    if (!isObj(raw)) return { ok: false, errors: ['top-level output must be a JSON object'] };
    const adaptations = asArr(raw.adaptations).map((a: any) => ({
      joke: asStr(a?.joke),
      whyItWorks: asStr(a?.whyItWorks),
      swaps: asArr(a?.swaps).map((s: any) => ({ from: asStr(s?.from), to: asStr(s?.to), reason: asStr(s?.reason) })),
      risk: asStr(a?.risk, 'low'),
    }));
    if (adaptations.length === 0) return { ok: false, errors: ['"adaptations" must contain at least one adapted joke'] };
    if (adaptations.some((a) => !a.joke)) return { ok: false, errors: ['each adaptation needs a "joke" field'] };
    return {
      ok: true,
      errors: [],
      data: {
        literal: asStr(raw.literal),
        adaptations,
        culturalNotes: asStr(raw.culturalNotes),
        tabooWarnings: asArr(raw.tabooWarnings).map(String),
      },
    };
  },
  buildUserPrompt: (i) => `Adapt this joke for a new culture.

ORIGINAL JOKE (${i.sourceCulture}):
"${i.joke}"

TARGET: ${i.targetCulture}
- Adaptation strategy: ${i.strategy}
- Preserve edginess: ${i.preserveEdge ? 'YES — keep the same spice level' : 'NO — soften edges if the target culture demands it'}
${i.context ? `- Performance context: ${i.context}` : ''}

Provide:
1. literal — a faithful literal translation into the target language/culture frame (the "autopsy" version).
2. adaptations — 2 to 3 fully localized rewrites of the joke that would actually get laughs in ${i.targetCulture}. For each: the joke (written in the target language if different from the source, with an English gloss in parentheses if so), whyItWorks, the list of reference swaps (from → to → reason), and a risk note.
3. culturalNotes — 2-4 sentences on how this type of humor lands in ${i.targetCulture} (timing, directness, self-deprecation norms, sacred cows).
4. tabooWarnings — anything in the original that could genuinely backfire in the target culture.`,
};

/* ---------------- 4. IMPROV PARTNER ---------------- */

const improv: ModuleDef = {
  id: 'improv',
  path: '/studio/improv',
  name: 'Improv Partner',
  tagline: 'Yes, and\u2026 in real time',
  description: 'A scene partner that accepts, heightens and finds the game of the scene with you.',
  track: 'performance',
  icon: Drama,
  defaultSystem: `You are a UCB-trained improv scene partner performing live on stage.
House rules you never break:
- YES, AND: accept every offer as reality, then add one new specific detail.
- Make your scene partner look good. Never deny, never steamroll, never wink at the audience.
- Find and heighten THE GAME: the first unusual thing is the seed — repeat it, escalate it, justify it emotionally.
- Play a character with a strong point of view. React honestly and emotionally.
- Keep each line SHORT: 1-3 spoken sentences. This is dialogue, not monologue. Leave space for your partner.
- Never break character, never narrate with asterisks, never explain the joke.
- End lines with an offer your partner can react to, not a dead end.
Spice guidance: match the scene's requested spice level.`,

  schema: {
    type: 'OBJECT',
    properties: {
      gameOfScene: { type: 'STRING' },
      highlights: { type: 'ARRAY', items: { type: 'STRING' } },
      suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
      rating: { type: 'NUMBER' },
    },
    required: ['gameOfScene', 'highlights'],
  },
  validate: (raw): ValidationResult<any> => {
    if (!isObj(raw)) return { ok: false, errors: ['top-level output must be a JSON object'] };
    const highlights = asArr(raw.highlights).map(String);
    if (!raw.gameOfScene && highlights.length === 0)
      return { ok: false, errors: ['need "gameOfScene" or "highlights"'] };
    return {
      ok: true,
      errors: [],
      data: {
        gameOfScene: asStr(raw.gameOfScene),
        highlights,
        suggestions: asArr(raw.suggestions).map(String),
        rating: clamp10(raw.rating),
      },
    };
  },
  buildUserPrompt: () => '',
};

export const IMPROV_SUGGEST_INSTRUCTIONS = `Suggest 3 possible next lines for the human improviser.
Each should take the scene in a DIFFERENT direction (heighten / tilt / emotional turn).
Return ONLY a JSON array of 3 strings, no fences.`;

/* ---------------- 5. TIGHT 5 GENERATOR ---------------- */

const tight5: ModuleDef = {
  id: 'tight5',
  path: '/studio/tight5',
  name: 'Tight 5 Generator',
  tagline: 'A club-ready five minutes',
  description: 'Turn topics and a persona into a structured stand-up set with beats, callbacks and stage notes.',
  track: 'creation',
  icon: Mic,
  defaultSystem: `You are a headliner coach who has booked clubs for 20 years and punches up sets for touring comedians.
You build TIGHT sets:
- Cold open or quick premise opener — no "how's everyone doing" filler unless it's subverted.
- 3-5 bits that flow: each has a clear setup, escalating beats, and a hard-hitting punchline. The funniest word is LAST.
- Plant a callback early and pay it off late. Bookend the closer with the strongest material.
- Economy: a tight five averages 120-140 spoken words per minute. No rambling premises.
- Stage notes are concrete (pauses, act-outs, mic work), not vibes.
- Match the persona's voice and the crowd's sensibility exactly.
${JSON_RULES}`,
  schema: {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' },
      logline: { type: 'STRING' },
      bits: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            estSeconds: { type: 'NUMBER' },
            setup: { type: 'STRING' },
            beats: { type: 'ARRAY', items: { type: 'STRING' } },
            punchline: { type: 'STRING' },
            callback: { type: 'STRING' },
          },
          required: ['title', 'setup', 'beats', 'punchline'],
        },
      },
      openerNote: { type: 'STRING' },
      closerNote: { type: 'STRING' },
      transitions: { type: 'ARRAY', items: { type: 'STRING' } },
      performanceNotes: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['title', 'bits'],
  },
  validate: (raw): ValidationResult<any> => {
    if (!isObj(raw)) return { ok: false, errors: ['top-level output must be a JSON object'] };
    const bits = asArr(raw.bits).map((b: any) => ({
      title: asStr(b?.title, 'Untitled bit'),
      estSeconds: asNum(b?.estSeconds, 60),
      setup: asStr(b?.setup),
      beats: asArr(b?.beats).map(String),
      punchline: asStr(b?.punchline),
      callback: asStr(b?.callback),
    }));
    if (bits.length === 0) return { ok: false, errors: ['"bits" must contain at least one bit'] };
    if (bits.some((b) => !b.punchline)) return { ok: false, errors: ['every bit needs a punchline'] };
    return {
      ok: true,
      errors: [],
      data: {
        title: asStr(raw.title),
        logline: asStr(raw.logline),
        bits,
        openerNote: asStr(raw.openerNote),
        closerNote: asStr(raw.closerNote),
        transitions: asArr(raw.transitions).map(String),
        performanceNotes: asArr(raw.performanceNotes).map(String),
      },
    };
  },
  buildUserPrompt: (i) => `Build a tight ${i.minutes}-minute stand-up set.

BRIEF
- Comedian persona / voice: ${i.persona || 'an anxious overthinker with unexpected swagger'}
- Topics to mine: ${i.topics || 'dating apps, family group chats, gym culture'}
- Crowd: ${i.crowd || 'weekend club crowd, mixed ages'}
- Spice level: ${i.spice}/5
- Style blend: ${i.style}

Return the full set:
1. title + logline (the set's comedic thesis).
2. bits — 3 to 5 bits in performance order. For each: title, estSeconds (budget ~${Math.round((i.minutes * 60) / 4)}s average), setup, 2-4 escalating beats, punchline, and callback (a later reference to earlier material, or empty if none).
3. openerNote + closerNote — how to walk on and how to get off.
4. transitions — one-line segues between bits.
5. performanceNotes — 2-4 concrete stage directions (pauses, act-outs, crowd work safety nets).
Make sure total estimated time ≈ ${i.minutes} minutes (at ~130 spoken words/minute).`,
};

/* ---------------- 6. GENOME LAB ---------------- */

const lab: ModuleDef = {
  id: 'lab',
  path: '/studio/lab',
  name: 'Genome Lab',
  tagline: 'Sequence the DNA of funny',
  description: 'Full humor-genome sequencing: 8-dimension profile, theory fit, risk analysis and rewrite angles.',
  track: 'understanding',
  icon: Dna,
  defaultSystem: `You are the chief scientist of the Humor Genome Project.
You treat every piece of comedy as a specimen to be sequenced:
- Score it 0-10 on the 8 genome dimensions: surprise, incongruity, superiority, relief, absurdity, warmth, edge, wordplay.
- Identify the dominant mechanism and how well the specimen fits major humor theories (incongruity theory, superiority theory, relief theory, benign violation theory).
- Run a risk analysis: punch direction (up / down / self / lateral), targets, taboo level, and exact phrases that carry risk.
- Map audience fit across segments with scores.
- Propose rewrite angles that would shift the genome in interesting directions (e.g. "same premise, warmer and less superior").
Be precise, quote exact words, and keep scores honest — most jokes are not 9s.
${JSON_RULES}`,
  schema: {
    type: 'OBJECT',
    properties: {
      genome: GENOME_SCHEMA,
      dominantMechanism: { type: 'STRING' },
      theories: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            fit: { type: 'NUMBER' },
            note: { type: 'STRING' },
          },
          required: ['name', 'fit', 'note'],
        },
      },
      riskAnalysis: {
        type: 'OBJECT',
        properties: {
          punchDirection: { type: 'STRING' },
          targets: { type: 'ARRAY', items: { type: 'STRING' } },
          tabooLevel: { type: 'NUMBER' },
          riskyPhrases: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['punchDirection', 'tabooLevel'],
      },
      audienceMap: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            segment: { type: 'STRING' },
            fit: { type: 'NUMBER' },
          },
          required: ['segment', 'fit'],
        },
      },
      rewrites: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            angle: { type: 'STRING' },
            joke: { type: 'STRING' },
          },
          required: ['angle', 'joke'],
        },
      },
    },
    required: ['genome', 'dominantMechanism'],
  },
  validate: (raw): ValidationResult<any> => {
    if (!isObj(raw)) return { ok: false, errors: ['top-level output must be a JSON object'] };
    const risk = isObj(raw.riskAnalysis) ? raw.riskAnalysis : {};
    return {
      ok: true,
      errors: [],
      data: {
        genome: genomeScores(raw.genome),
        dominantMechanism: asStr(raw.dominantMechanism, 'unclassified'),
        theories: asArr(raw.theories).map((t: any) => ({
          name: asStr(t?.name),
          fit: clamp10(t?.fit),
          note: asStr(t?.note),
        })),
        riskAnalysis: {
          punchDirection: asStr(risk.punchDirection, 'lateral'),
          targets: asArr(risk.targets).map(String),
          tabooLevel: clamp10(risk.tabooLevel),
          riskyPhrases: asArr(risk.riskyPhrases).map(String),
        },
        audienceMap: asArr(raw.audienceMap).map((a: any) => ({
          segment: asStr(a?.segment),
          fit: clamp10(a?.fit),
        })),
        rewrites: asArr(raw.rewrites).map((r: any) => ({ angle: asStr(r?.angle), joke: asStr(r?.joke) })),
      },
    };
  },
  buildUserPrompt: (i) => `Sequence the humor genome of this specimen:

"${i.text}"

${i.context ? `Context: ${i.context}` : ''}

Deliver the full lab report:
1. genome — scores 0-10 on surprise, incongruity, superiority, relief, absurdity, warmth, edge, wordplay.
2. dominantMechanism — the single device doing the most work.
3. theories — fit scores (0-10) and short notes for: incongruity theory, superiority theory, relief theory, benign violation theory.
4. riskAnalysis — punchDirection (up / down / self / lateral), targets, tabooLevel 0-10, riskyPhrases (exact quotes).
5. audienceMap — fit scores for 4-6 audience segments (e.g. "college improv crowd", "corporate gig", "Twitter/X", "grandma").
6. rewrites — 2-3 alternative versions of the specimen, each with a different genome-shifting angle and the rewritten joke.`,
};

/* ---------------- registry ---------------- */

export const MODULES: ModuleDef[] = [copilot, explain, translate, improv, tight5, lab];

export function getModule(id: string | undefined): ModuleDef {
  return MODULES.find((m) => m.id === id) ?? copilot;
}
