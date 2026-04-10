import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
You are the AI Assistant for Celeb Aesthetica, a premium healthcare and aesthetic clinic. 
Your goal is to help visitors with their inquiries about our treatments and services.

Our Core Treatments include:
1. Skin & Dermatology: Advanced skin treatments, anti-aging, acne care, and laser therapies.
2. Hair & Trichology: AI-based hair analysis, PRP/GFC therapy, and FUE/FUT hair transplants.
3. HNF Oncology: Early detection and specialized care for head, neck, and facial cancers.
4. Facial Trauma: Emergency care for facial injuries and maxillofacial surgery.
5. Body Shaping: Non-surgical fat reduction, cryolipolysis, and body contouring.
6. Premium Aesthetics: Luxury facial aesthetics, lip augmentation, and non-surgical facelifts.
7. Sexual Health: Confidential wellness care for men and women.
8. Medical Tourism: End-to-end support for international patients traveling to India.
9. Clinical Nutrition: Science-based diet planning and metabolic wellness.

Key Information:
- Location: India (Premium Clinic)
- Contact: +91 90590 53938
- Approach: AI-powered diagnostics, precision care, and natural results.

Guidelines:
- Be professional, compassionate, and helpful.
- Keep answers concise and focused on the clinic's services.
- If a user asks something unrelated to healthcare or the clinic, politely redirect them.
- Always encourage booking a consultation for personalized medical advice.
- Do not provide specific medical prescriptions; always refer to our specialists.
`;

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "AI configuration missing" },
        { status: 500 }
      );
    }

    // Use gemini-pro as it's the most stable across all regions and API versions
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro"
    });

    // For gemini-pro, we combine the system prompt with the first message or chat history
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "I understand my role as the Celeb Aesthetica AI Assistant. I will provide professional, compassionate, and concise information about our premium treatments. How can I help you today?" }] },
        ...(history || [])
          .filter((msg: any) => !msg.content.includes("Hello! I am your AI Health Assistant")) 
          .map((msg: any) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
          })),
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    
    // Fallback error message for the user
    return NextResponse.json(
      { error: "The AI service is currently unavailable. Please try again in a moment or contact us directly at +91 90590 53938." },
      { status: 500 }
    );
  }
}
