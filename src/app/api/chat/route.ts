import { NextResponse } from "next/server";

const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY || "";
const getGeminiKey    = () => process.env.GEMINI_API_KEY || "";
const OPENROUTER_URL  = "https://openrouter.ai/api/v1/chat/completions";

const OPENROUTER_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "deepseek/deepseek-r1:free",
  "google/gemma-3-12b-it:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

const SYSTEM_PROMPT = `
You are the official AI Health Assistant for Celeb Aesthetica, a premium multi-specialty healthcare and aesthetic clinic based in India. Your role is to answer questions accurately about our clinic, treatments, doctors, services, and booking — using only the information below.

=== ABOUT CELEB AESTHETICA ===
Celeb Aesthetica is India's most advanced aesthetic and healthcare clinic, combining AI-powered diagnostics with precision care and natural results. We serve patients from India and internationally through our Medical Tourism program.

Founders & Doctors:
• Dr. Rutuja Borde — CEO & Co-founder (6+ years experience)
  Specialties: Advanced Implantology, Full mouth rehabilitation & reconstruction, Digital smile designing, Cosmetic & aesthetic dentistry, Veneers & ultra-thin laminates, Minimally invasive conservative dentistry, Painless root canal treatment, Advanced laser therapies in dentistry

• Dr. Sandiip Jaibhave — Founder & Managing Director (9+ years experience)
  Specialties: Head & neck oncology, Preventive oral/head/neck/face cancer care, Advanced Dermato-cosmetology, Trichology & hair regeneration, Hair transplant & restoration, Laser therapies for skin/hair/HNF cancers, Injectable aesthetics (IV/Botox/Fillers), Tobacco cessation & drug de-addiction programs

Why Choose Celeb Aesthetica:
• AI-Based Diagnosis — Latest AI-powered machines for skin, hair, and dental diagnosis
• Modular OT — India's first dental surgery in a fully equipped modular operation theatre
• In-House Lab — Advanced dental, pharmacy, and pathology labs for complete care
• Patient First — Ethical, transparent practices with personalized recovery care

=== OUR TREATMENTS ===

1. PRP / GFC for Hair
   Natural hair regrowth therapy using platelet-rich plasma. Features: Natural regrowth, No side effects, Strengthens follicles, Minimally invasive, Clinically proven, Quick recovery. Stats: 10 doctors, 2K+ patients, 8 years experience.

2. Facial Trauma
   Emergency care for facial injuries and maxillofacial surgery. Features: RTA Injury Management, Jaw Fracture Fixation, Facial Bone Reconstruction, Soft Tissue Repair, Orbital & Nasal Fractures, Cosmetic Rehabilitation. Stats: 12 doctors, 12K+ patients, 15 years experience.

3. Dental
   Complete dental care from routine checkups to advanced treatments. Features: Teeth cleaning & polishing, Root canal treatment, Dental implants & crowns, Orthodontics & braces, Teeth whitening, Wisdom tooth extraction. Stats: 20 doctors, 8K+ patients, 12 years experience.

4. Dermatology
   Skin health, acne, pigmentation, and laser therapies. Features: Acne & scar treatment, Laser therapy & skin resurfacing, Hair loss treatment (PRP), Mole & skin tag removal, Psoriasis & eczema management, Anti-aging & cosmetic procedures. Stats: 15 doctors, 6K+ patients, 10 years experience.

5. Body Shaping
   Non-surgical body contouring and fat reduction. Features: Fat Reduction (Lipolysis), Cryolipolysis (Fat Freezing), Skin Tightening, Cellulite Reduction, Stretch Mark Treatments, Transformation Programs. Stats: 8 doctors, 7K+ patients, 10 years experience.

6. Premium Aesthetic
   Luxury cosmetic and aesthetic care. Features: Luxury Facial Aesthetics, Non-Surgical Face Lift, Jawline & Profile Enhancement, Lip Augmentation, Full Face Rejuvenation, Bridal & Celebrity Makeovers. Stats: 10 doctors, 6K+ patients, 12 years experience.

7. Sexual Health
   Confidential wellness care for men and women. Features: Erectile Dysfunction Treatment, Premature Ejaculation Management, Libido Enhancement, Hormonal Therapy, Female Sexual Wellness, Couple Counseling. Stats: 6 doctors, 5K+ patients, 12 years experience.

8. Medical Tourism
   End-to-end support for international patients traveling to India. Features: International Patient Services, Customized Treatment Packages, Visa & Travel Coordination, Luxury Stay & Hospitality, Virtual Consultations, Cost-Effective Treatments. Stats: 15 doctors, Global patients, 15 years experience.

9. Clinical Nutrition
   Science-based diet planning and metabolic wellness. Features: Personalized Diet Planning, Weight Loss & Gain Programs, PCOS & Thyroid Management, Diabetic & Cardiac Nutrition, Skin & Hair Nutrition, Lifestyle Disease Reversal. Stats: 5 doctors, 4K+ patients, 10 years experience.

10. Cancer / HNF Oncology
    Early detection and specialized cancer treatment. Features: Early cancer screening & detection, Chemotherapy & immunotherapy, Radiation therapy, Surgical oncology, Palliative & supportive care, Genetic counseling & testing. Stats: 30 doctors, 5K+ patients, 14 years experience.

11. Cardiology
    Cardiac diagnostics and interventional care. Features: ECG, Echo & stress testing, Cardiac catheterization & angioplasty, Heart failure management, Pacemaker & defibrillator implants, Preventive cardiology programs, Cardiac rehabilitation. Stats: 25 doctors, 10K+ patients, 18 years experience.

=== DEPARTMENTS ===
Dental, Skin / Dermatology, Hair / Trichology, HNF Cancer, Facial Trauma, Body Shaping, Clinical Nutrition, Sexual Health, Premium Aesthetic, Medical Tourism, Cardiology, Oncology

=== CONTACT & BOOKING ===
- Phone / WhatsApp: +91 90590 53938
- Location: India (Premium Clinic)
- Book Appointment: Visit /appointment on our website
- Contact Page: /contact
- For emergencies: Call +91 90590 53938 immediately

=== RESPONSE GUIDELINES ===
- Be professional, compassionate, empathetic, and concise (2-4 sentences typically)
- Use bullet points when listing features or options
- For specific pricing, say costs vary by treatment plan and encourage a free consultation
- Never prescribe medications; always refer to our specialists
- For emergencies, immediately direct to call +91 90590 53938
- If asked something completely unrelated to health/the clinic, politely redirect
- Always end with an invitation to book a consultation or call us
- Respond in the same language the user writes in
- Format key terms in **bold** for emphasis
`;

function buildMessages(history: any[], message: string) {
  const prior = (history || [])
    .filter((m: any) => m.content && !m.content.startsWith("Hello! 👋"))
    .map((m: any) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content as string,
    }));
  return [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...prior,
    { role: "user" as const, content: message },
  ];
}

async function tryOpenRouter(msgs: ReturnType<typeof buildMessages>): Promise<string | null> {
  const key = getOpenRouterKey();
  if (!key) return null;

  for (const model of OPENROUTER_MODELS) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://celebaesthetica.com",
          "X-Title": "Celeb Aesthetica AI Assistant",
        },
        body: JSON.stringify({ model, messages: msgs, temperature: 0.5, max_tokens: 600 }),
      });
      if (!res.ok) { console.error(`OpenRouter ${model} ${res.status}`); continue; }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      if (text) { console.log(`Chat: OpenRouter model used — ${model}`); return text; }
    } catch (err: any) {
      console.error(`OpenRouter ${model} threw:`, err.message);
    }
  }
  return null;
}

async function tryGemini(msgs: ReturnType<typeof buildMessages>): Promise<string | null> {
  const key = getGeminiKey();
  if (!key) return null;

  // Build a single prompt from messages for Gemini
  const combined = msgs
    .filter(m => m.role !== "system")
    .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");
  const prompt = `${SYSTEM_PROMPT}\n\n${combined}\nAssistant:`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 600 },
      }),
    });
    if (!res.ok) { console.error("Gemini fallback", res.status); return null; }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (text) { console.log("Chat: Gemini 2.0 Flash used"); return text; }
  } catch (err: any) {
    console.error("Gemini threw:", err.message);
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    const msgs = buildMessages(history, message);

    // 1. Try OpenRouter models in order
    const orText = await tryOpenRouter(msgs);
    if (orText) return NextResponse.json({ text: orText });

    // 2. Fallback: Gemini 2.0 Flash
    const gemText = await tryGemini(msgs);
    if (gemText) return NextResponse.json({ text: gemText });

    // 3. All failed
    return NextResponse.json({
      text: "I'm having trouble connecting to AI services right now. Please call us at **+91 90590 53938** or visit /contact.",
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { text: "Something went wrong. Please call us at **+91 90590 53938**." },
      { status: 500 }
    );
  }
}
