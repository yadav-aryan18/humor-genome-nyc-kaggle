# Module Specifications and JSON Schemas

Humor Genome Studio provides six specialized modules defined in `app/src/lib/moduleDefs.ts`. Each module consists of a prompt builder, system instructions, a JSON schema for model decoder enforcement, and a TypeScript validator with coercion rules.

---

## 1. Joke Copilot (`copilot`)
- **Track**: Humor Creation (`creation`)
- **Purpose**: Generates original jokes with control over style, structure, audience, and spice level.
- **Output Schema**:
  - `jokes`: Array of joke objects
    - `setup`: Setup string
    - `punchline`: Punchline string
    - `mechanism`: Explanation of the underlying comedic mechanism
    - `tags`: Style and topic tags
    - `genome`: 8-dimension humor scores (`surprise`, `incongruity`, `superiority`, `relief`, `absurdity`, `warmth`, `edge`, `wordplay`)

---

## 2. Explanation Engine (`explainer`)
- **Track**: Humor Understanding (`understanding`)
- **Purpose**: Dissects a joke into its structural components and comedic mechanisms without destroying the humor.
- **Output Schema**:
  - `summary`: High level summary of why the joke works
  - `structure`:
    - `setup`: Quoted setup
    - `pivot`: The turning point premise
    - `punchline`: Quoted punchline
    - `tag`: Optional tag or continuation
  - `mechanisms`: Array of mechanisms (`name`, `strength` 0-10, `explanation`)
  - `whyItWorks`: Deep dive explanation into why it evokes a laugh
  - `targetAudience`: Target demographic analysis
  - `punchUpSuggestions`: Array of concrete suggestions to sharpen the joke
  - `genome`: 8-dimension humor genome object

---

## 3. Cultural Translator (`translator`)
- **Track**: Humor Understanding (`understanding`)
- **Purpose**: Adapts jokes for target cultures rather than performing literal language translation.
- **Output Schema**:
  - `originalJoke`: Original text
  - `targetCulture`: Destination culture/region
  - `adaptedJoke`: Rebuilt joke for target culture
  - `referenceSwaps`: Array of swapped cultural references (`from`, `to`, `reason`)
  - `wordplayNotes`: Explanation of how puns or language specific devices were reconstructed
  - `tabooAndPunchDirection`: Sensitivity and punch direction risk assessment
  - `localLandedExplanation`: Why the adaptation works for local audiences

---

## 4. Improv Partner (`improv`)
- **Track**: Human + AI Performance (`performance`)
- **Purpose**: Interactive "yes, and..." scene partner for live comedic roleplay.
- **Modes**:
  - **Scene Starter**: Generates initial scene premise (`setting`, `relationship`, `firstUnusualThing`, `openingLine`)
  - **Dialogue turn**: Generates next in-character line (`character`, `line`, `emotion`, `subtext`)
  - **Offer suggestions**: Suggests 3 quick responses when user is stuck
  - **Scene debrief**: Summarizes scene dynamics (`gameOfTheScene`, `strongestMoments`, `coachingTips`)

---

## 5. Tight 5 Generator (`tight5`)
- **Track**: Humor Creation (`creation`)
- **Purpose**: Generates a structured 5 minute stand up routine based on a performer persona and core topics.
- **Output Schema**:
  - `setTitle`: Catchy title for the set
  - `estimatedMinutes`: Target duration
  - `bits`: Array of structured comedy bits
    - `title`: Bit name
    - `durationSec`: Estimated duration in seconds
    - `premise`: Bit premise
    - `lines`: Spoken lines and stage directions (`type`: `setup` | `punchline` | `callback` | `stage_note`, `text`)
    - `callbackRef`: Optional reference to an earlier setup
  - `segueNotes`: Transitions between bits
  - `stageDirections`: Walk-on and get-off instructions

---

## 6. Genome Lab (`lab`)
- **Track**: Humor Understanding (`understanding`)
- **Purpose**: Complete "DNA sequencing" of any joke specimen with theoretical mapping and genome shift rewrites.
- **Output Schema**:
  - `specimen`: Analyzed joke string
  - `genome`: 8-dimension numerical score profile
  - `theoryFit`: Compatibility breakdown across major comedy theories:
    - `incongruityResolution`: Score (0-10) and explanation
    - `superiority`: Score (0-10) and explanation
    - `relief`: Score (0-10) and explanation
    - `benignViolation`: Score (0-10) and explanation
  - `riskAnalysis`: Taboo risk score, punch direction, and warning flags
  - `genomeShifts`: Rewritten versions of the joke adjusting specific dimensions (e.g. warmer tone, higher absurdity)
