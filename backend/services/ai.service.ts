// Read at runtime (not module level) to always pick up .env values
const getGeminiKey = () => process.env.GEMINI_API_KEY || "";
const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Free models to try in order on OpenRouter (updated April 2025)
const OPENROUTER_MODELS = [
  "deepseek/deepseek-chat-v3-0324:free",
  "deepseek/deepseek-r1:free",
  "google/gemma-3-4b-it:free",
  "google/gemma-3-12b-it:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

interface AiPrescriptionInput {
  chiefComplaint: string;
  patientAge?: number;
  patientGender?: string;
  vitals?: Record<string, any>;
  patientHistory?: string;
  doctorSpecialization?: string;
  departmentName?: string;
}

interface AiSuggestion {
  diagnosis: string[];
  icdCodes: string[];
  medications: { name: string; dosage: string; frequency: string; duration: string; route: string; instructions: string }[];
  labTests: { name: string; urgency: string; notes: string }[];
  advice: string[];
  differentialDiagnosis: string[];
  redFlags: string[];
}

export async function getAiPrescriptionSuggestions(input: AiPrescriptionInput): Promise<AiSuggestion> {
  const prompt = buildPrompt(input);

  const geminiKey = getGeminiKey();
  const openRouterKey = getOpenRouterKey();
  console.log("AI keys present — Gemini:", !!geminiKey, "OpenRouter:", !!openRouterKey);

  // Try Gemini first
  if (geminiKey) {
    try {
      const result = await callGemini(prompt, geminiKey);
      if (result) return result;
    } catch (err: any) {
      console.error("Gemini failed, trying OpenRouter:", err.message);
    }
  }

  // Fallback to OpenRouter
  if (openRouterKey) {
    try {
      const result = await callOpenRouter(prompt, openRouterKey);
      if (result) return result;
    } catch (err: any) {
      console.error("OpenRouter failed:", err.message);
    }
  } else {
    console.error("OpenRouter key not found in environment");
  }

  // Return empty if both fail
  console.error("All AI providers failed");
  return {
    diagnosis: [],
    icdCodes: [],
    medications: [],
    labTests: [],
    advice: [],
    differentialDiagnosis: [],
    redFlags: [],
  };
}

async function callGemini(prompt: string, apiKey: string): Promise<AiSuggestion | null> {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini API error:", errText);
    throw new Error(`Gemini API returned ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return parseAiResponse(parsed);
}

async function callOpenRouter(prompt: string, apiKey: string): Promise<AiSuggestion | null> {
  // Try each free model in order until one succeeds
  for (const model of OPENROUTER_MODELS) {
    console.log(`Trying OpenRouter model: ${model}`);
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://hospital-management-system.com",
          "X-Title": "Hospital Management System",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: "You are a medical AI assistant. Always respond with valid JSON only, no markdown, no extra text.\n\n" + prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`OpenRouter ${model} error (${res.status}):`, errText.slice(0, 200));
        continue; // try next model
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";

      if (!text) {
        console.error(`OpenRouter ${model} returned empty content`);
        continue;
      }

      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      // Extract JSON object if surrounded by extra text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`No JSON found in ${model} response:`, cleaned.slice(0, 200));
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`Successfully got response from OpenRouter model: ${model}`);
      return parseAiResponse(parsed);
    } catch (err: any) {
      console.error(`OpenRouter ${model} threw:`, err.message);
      // continue to next model
    }
  }

  throw new Error("All OpenRouter models failed");
}

function parseAiResponse(parsed: any): AiSuggestion {
  return {
    diagnosis: parsed.diagnosis || [],
    icdCodes: parsed.icdCodes || [],
    medications: (parsed.medications || []).map((m: any) => ({
      name: m.name || "",
      dosage: m.dosage || "",
      frequency: m.frequency || "",
      duration: m.duration || "",
      route: m.route || "Oral",
      instructions: m.instructions || "",
    })),
    labTests: (parsed.labTests || []).map((t: any) => ({
      name: t.name || "",
      urgency: t.urgency || "Routine",
      notes: t.notes || "",
    })),
    advice: parsed.advice || [],
    differentialDiagnosis: parsed.differentialDiagnosis || [],
    redFlags: parsed.redFlags || [],
  };
}

function buildPrompt(input: AiPrescriptionInput): string {
  const age = input.patientAge ? `${input.patientAge} years old` : "age unknown";
  const gender = input.patientGender || "unknown gender";
  const vitalsStr = input.vitals
    ? Object.entries(input.vitals)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "not recorded";

  return `You are an experienced medical AI assistant helping a doctor write prescriptions in a hospital management system. 
Based on the following patient information, provide clinical suggestions.

IMPORTANT: You are ONLY providing suggestions. The doctor will review, modify, and approve everything. Never provide a final diagnosis — only differential diagnoses and suggestions.

Patient Details:
- Age: ${age}
- Gender: ${gender}
- Chief Complaint: ${input.chiefComplaint}
- Vitals: ${vitalsStr}
${input.patientHistory ? `- Previous History: ${input.patientHistory}` : ""}
${input.doctorSpecialization ? `- Doctor Specialization: ${input.doctorSpecialization}` : ""}
${input.departmentName ? `- Department: ${input.departmentName}` : ""}

Respond with a JSON object (no markdown, just pure JSON) with these fields:
{
  "diagnosis": ["array of possible diagnoses, most likely first"],
  "icdCodes": ["ICD-10 codes corresponding to the diagnoses"],
  "medications": [
    {
      "name": "medication name (generic)",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. Twice daily (BD)",
      "duration": "e.g. 5 days",
      "route": "Oral/IV/IM/Topical/etc",
      "instructions": "e.g. After food"
    }
  ],
  "labTests": [
    {
      "name": "test name",
      "urgency": "Routine/Urgent/STAT",
      "notes": "brief reason"
    }
  ],
  "advice": ["array of lifestyle/dietary/follow-up advice strings"],
  "differentialDiagnosis": ["less likely but possible diagnoses to rule out"],
  "redFlags": ["warning signs patient should watch for"]
}

Keep medications practical and commonly prescribed. Include dosages appropriate for the patient's age. Limit to 3-5 most relevant medications, 2-4 lab tests, and 3-5 advice items.`;
}

export async function getAiMedicationSuggestion(
  symptom: string,
  currentMeds: string[] = []
): Promise<{ name: string; dosage: string; frequency: string; duration: string; route: string; instructions: string }[]> {
  const geminiKey = getGeminiKey();
  if (!geminiKey) return [];

  const prompt = `You are a medical AI assistant. Suggest 3-5 commonly prescribed medications for: "${symptom}".
${currentMeds.length ? `Already prescribed: ${currentMeds.join(", ")}. Do NOT repeat these.` : ""}

Return a JSON array (no markdown) of objects with: name, dosage, frequency, duration, route, instructions.
Keep suggestions practical and evidence-based. Use generic drug names.`;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024, responseMimeType: "application/json" },
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}
