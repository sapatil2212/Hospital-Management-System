import { NextRequest } from "next/server";

import { authMiddleware } from "../../../../../../backend/middlewares/auth.middleware";

import { successResponse, errorResponse } from "../../../../../../backend/utils/response";

import {

  getSubDeptProfile,

  SubDeptServiceError,

} from "../../../../../../backend/services/subdepartment.service";

import prisma from "../../../../../../backend/config/db";



export const dynamic = "force-dynamic";



// ─── Constants ────────────────────────────────────────────────────────────────



const getGeminiKey = () => process.env.GEMINI_API_KEY || "";

const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY || "";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";



const OPENROUTER_MODELS = [

  "nvidia/nemotron-3-super-120b-a12b:free",

  "deepseek/deepseek-chat-v3-0324:free",

  "deepseek/deepseek-r1:free",

  "google/gemma-3-12b-it:free",

  "microsoft/phi-3-mini-128k-instruct:free",

];



const VALID_PROC_TYPES = [

  "CONSULTATION",

  "TREATMENT",

  "SURGERY",

  "DIAGNOSTIC",

  "THERAPY",

  "MEDICATION",

  "OTHER",

] as const;



type ProcType = (typeof VALID_PROC_TYPES)[number];



// ─── Pure helper types ────────────────────────────────────────────────────────



export type AIProcedure = {

  name: string;

  type: ProcType;

  fee: number | null;

  duration: number | null;

  description: string | null;

};



// ─── Pure helper functions (exported for testing) ─────────────────────────────



/**

 * Builds the AI prompt that instructs the model to return a raw JSON array of

 * procedure objects appropriate for the given subdepartment.

 */

export function buildProcedurePrompt(

  deptType: string,

  deptName: string,

  existingNames: string[]

): string {

  const existingList =

    existingNames.length > 0 ? existingNames.join(", ") : "none";



  return `You are a medical procedure catalog assistant.



Generate between 10 and 20 clinically appropriate procedures for a subdepartment with the following details:

- Department Type: ${deptType}

- Department Name: ${deptName}



Rules:

1. Return ONLY a raw JSON array. No explanation, no markdown, no code fences.

2. Each object must have exactly these fields:

   - "name": string (procedure name)

   - "type": one of CONSULTATION, TREATMENT, SURGERY, DIAGNOSTIC, THERAPY, MEDICATION, OTHER

   - "fee": number in Indian Rupees (INR), or null

   - "duration": number in minutes, or null

   - "description": short string (1-2 sentences), or null

3. Assign realistic INR fee values appropriate for the procedure type and Indian private clinic context.

4. Assign realistic duration values in minutes.

5. Do NOT include any of these already-existing procedures: ${existingList}



Return the JSON array now:`;

}



/**

 * Strips markdown code fences (` ```json ... ``` ` or ` ``` ... ``` `) from a

 * string. Returns the string unchanged if no fences are present.

 */

export function stripFences(text: string): string {

  return text

    .trim()

    .replace(/^```(?:json)?\s*/i, "")

    .replace(/\s*```\s*$/i, "")

    .trim();

}



/**

 * Attempts to recover a valid JSON array from a truncated AI response by

 * finding the last complete object (ending with `}`) and closing the array.

 * Returns null if no complete object can be found.

 */

export function recoverTruncatedArray(text: string): any[] | null {

  const trimmed = text.trim();

  // Already valid — nothing to recover

  try {

    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) return parsed;

  } catch {}



  // Find the last `}` that closes a complete object

  const lastBrace = trimmed.lastIndexOf("}");

  if (lastBrace === -1) return null;



  const candidate = trimmed.slice(0, lastBrace + 1) + "]";

  // Ensure it starts with `[`

  const startBracket = candidate.indexOf("[");

  if (startBracket === -1) return null;



  try {

    const parsed = JSON.parse(candidate.slice(startBracket));

    if (Array.isArray(parsed) && parsed.length > 0) return parsed;

  } catch {}

  return null;

}



/**

 * Filters out suggestions whose name matches an existing procedure name

 * (case-insensitive). Also drops items missing a `name` field and coerces

 * invalid `type` values to `"OTHER"`.

 */

export function filterDuplicates(

  suggestions: any[],

  existingNames: string[]

): AIProcedure[] {

  const existingLower = new Set(existingNames.map((n) => n.toLowerCase()));



  return suggestions

    .filter(

      (item) =>

        item &&

        typeof item.name === "string" &&

        item.name.trim() !== "" &&

        !existingLower.has(item.name.trim().toLowerCase())

    )

    .map((item) => ({

      name: item.name.trim(),

      type: (VALID_PROC_TYPES as readonly string[]).includes(item.type)

        ? (item.type as ProcType)

        : item.type === "PROCEDURE" ? "TREATMENT"

        : item.type === "VACCINATION" ? "MEDICATION"

        : "OTHER",

      fee: typeof item.fee === "number" ? item.fee : null,

      duration: typeof item.duration === "number" ? item.duration : null,

      description:

        typeof item.description === "string" ? item.description : null,

    }));

}



// ─── AI call helpers ──────────────────────────────────────────────────────────



/**

 * Calls Gemini 2.0 Flash with the given prompt.

 * Returns the raw text response, or `null` on error / empty result.

 */

export async function tryGemini(prompt: string): Promise<string | null> {

  const key = getGeminiKey();

  if (!key) return null;



  try {

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

    const res = await fetch(url, {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({

        contents: [{ parts: [{ text: prompt }] }],

        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },

      }),

    });

    if (!res.ok) {

      console.error("AI Auto-Add: Gemini error", res.status);

      return null;

    }

    const data = await res.json();

    const text: string =

      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (text) {

      console.log("AI Auto-Add: Gemini 2.0 Flash used");

      return text;

    }

  } catch (err: any) {

    console.error("AI Auto-Add: Gemini threw:", err.message);

  }

  return null;

}



/**

 * Iterates OPENROUTER_MODELS and returns the first successful raw text

 * response, or `null` if all models fail.

 */

export async function tryOpenRouter(prompt: string): Promise<string | null> {

  const key = getOpenRouterKey();

  if (!key) return null;



  const msgs = [{ role: "user", content: prompt }];



  for (const model of OPENROUTER_MODELS) {

    try {

      const res = await fetch(OPENROUTER_URL, {

        method: "POST",

        headers: {

          Authorization: `Bearer ${key}`,

          "Content-Type": "application/json",

          "HTTP-Referer": "https://celebaesthetica.com",

          "X-Title": "Celeb Aesthetica AI Procedures",

        },

        body: JSON.stringify({

          model,

          messages: msgs,

          temperature: 0.7,

          max_tokens: 4096,

        }),

      });

      if (!res.ok) {

        console.error(`AI Auto-Add: OpenRouter ${model} ${res.status}`);

        continue;

      }

      const data = await res.json();

      const text: string = data?.choices?.[0]?.message?.content || "";

      if (text) {

        console.log(`AI Auto-Add: OpenRouter model used — ${model}`);

        return text;

      }

    } catch (err: any) {

      console.error(`AI Auto-Add: OpenRouter ${model} threw:`, err.message);

    }

  }

  return null;

}



// ─── Route handler ────────────────────────────────────────────────────────────



/**

 * POST /api/subdept/procedures/ai-suggest

 *

 * Authenticated as SUB_DEPT_HEAD. Derives subdepartment context from the

 * session, calls Gemini (with OpenRouter fallback) to generate a list of

 * clinically relevant procedures, deduplicates against existing entries, and

 * bulk-inserts the results.

 */

export async function POST(req: NextRequest) {

  // 1. Auth guard

  const { user, error } = await authMiddleware(req);

  if (error) return error;

  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);



  try {

    // 2. Retrieve subdepartment profile

    const profile = await getSubDeptProfile(user!.userId);

    const subDept = profile as any;

    const { id: subDepartmentId, name: deptName, type: deptType, hospitalId } = subDept;



    // 3. Fetch existing procedure names for deduplication

    const existing = await (prisma as any).procedure.findMany({

      where: { subDepartmentId },

      select: { name: true },

    });

    const existingNames: string[] = existing.map((p: { name: string }) => p.name);



    // 4. Build prompt and call AI (Gemini first, OpenRouter fallback)

    const prompt = buildProcedurePrompt(deptType, deptName, existingNames);



    const rawText =

      (await tryGemini(prompt)) ?? (await tryOpenRouter(prompt));



    if (!rawText) {

      return errorResponse(

        "AI service is currently unavailable. Please try again later.",

        502

      );

    }



    // 5. Parse AI response (with truncation recovery)

    let parsed: any[];

    const stripped = stripFences(rawText);

    try {

      const direct = JSON.parse(stripped);

      if (!Array.isArray(direct)) throw new Error("Not an array");

      parsed = direct;

    } catch {

      // Response may be truncated — try to salvage complete objects

      const recovered = recoverTruncatedArray(stripped);

      if (recovered && recovered.length > 0) {

        console.warn("AI Auto-Add: Recovered truncated array with", recovered.length, "items");

        parsed = recovered;

      } else {

        console.error("AI Auto-Add: Failed to parse AI response:", rawText);

        return errorResponse(

          "AI returned an invalid response. Please try again.",

          502

        );

      }

    }



    // 6. Deduplicate and normalise

    const newProcedures = filterDuplicates(parsed, existingNames);

    const skipped = parsed.length - newProcedures.length;



    // 7. Nothing new to add

    if (newProcedures.length === 0) {

      return successResponse(

        { added: 0, skipped },

        "All suggested procedures already exist in your catalog.",

        200

      );

    }



    // 8. Bulk insert

    try {

      await (prisma as any).procedure.createMany({

        data: newProcedures.map((p) => ({

          hospitalId,

          subDepartmentId,

          name: p.name,

          type: p.type,

          fee: p.fee,

          duration: p.duration,

          description: p.description,

          sequence: 0,

          isActive: true,

        })),

      });

    } catch (dbErr: any) {

      console.error("AI Auto-Add: DB insertion failed:", dbErr);

      return errorResponse("Failed to save procedures", 500);

    }



    return successResponse(

      { added: newProcedures.length, skipped },

      `${newProcedures.length} procedure${newProcedures.length === 1 ? "" : "s"} added by AI.`,

      201

    );

  } catch (err: any) {

    if (err instanceof SubDeptServiceError) return errorResponse(err.message, err.status);

    console.error("AI Auto-Add: Unexpected error:", err);

    return errorResponse(err.message || "Internal server error", 500);

  }

}

