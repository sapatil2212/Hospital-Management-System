import OpenAI from "openai";
import prisma from "../config/db";

const px = prisma as any;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || "",
});

export interface VoiceTranscriptionResult {
  transcription: string;
  diagnosis: string;
  chiefComplaint: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    route: string;
    instructions: string;
  }>;
  labTests: Array<{
    name: string;
    urgency: string;
    notes: string;
  }>;
  vitals: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
    height?: string;
    spo2?: string;
    rr?: string;
  };
  advice: string;
  icdCodes: string[];
  followUpDate?: string;
  followUpNotes?: string;
  metadata: {
    processingTime: number;
    confidence: number;
    language: string;
  };
}

export async function transcribeAndGeneratePrescription(
  transcriptText: string,
  patientInfo: {
    name: string;
    age?: number;
    gender?: string;
    bloodGroup?: string;
    medicalHistory?: string;
  },
  doctorInfo: {
    name: string;
    specialization?: string;
    department?: string;
  },
  language?: string
): Promise<VoiceTranscriptionResult> {
  const startTime = Date.now();

  try {
    // Extract structured medical data from transcript
    const languageNote = language && language !== 'en-IN' 
      ? `\n\nNOTE: This transcript is in ${language}. Please translate the medical content to English while extracting the information.`
      : '';

    const systemPrompt = `You are an expert medical AI assistant fluent in multiple Indian languages (Hindi, Marathi, Tamil, Telugu, Kannada, Gujarati, Bengali, Malayalam, Punjabi, and English). You help doctors extract structured medical information from consultation transcripts.${languageNote}`;

    const userPrompt = `Analyze this doctor-patient consultation transcript and extract structured medical information.

PATIENT INFORMATION:
- Name: ${patientInfo.name}
- Age: ${patientInfo.age || "Not specified"}
- Gender: ${patientInfo.gender || "Not specified"}
- Blood Group: ${patientInfo.bloodGroup || "Not specified"}
${patientInfo.medicalHistory ? `- Medical History: ${patientInfo.medicalHistory}` : ""}

DOCTOR INFORMATION:
- Dr. ${doctorInfo.name}
- Specialization: ${doctorInfo.specialization || "General Medicine"}
- Department: ${doctorInfo.department || "General"}

CONVERSATION TRANSCRIPT:
${transcriptText}

TASK: Extract structured medical information from the conversation transcript.

INSTRUCTIONS:
1. The transcription is already provided above
2. Identify the chief complaint (patient's main symptoms/concerns)
3. Determine the diagnosis based on the conversation
4. Extract any mentioned medications with complete details (name, dosage, frequency, duration, route, instructions)
5. Identify any lab tests or investigations recommended
6. Extract vital signs if mentioned (BP, pulse, temperature, weight, height, SpO2, respiratory rate)
7. Extract medical advice and lifestyle recommendations
8. Suggest relevant ICD-10 codes for the diagnosis
9. Determine if follow-up is needed and when

OUTPUT FORMAT (JSON):
{
  "transcription": "Full verbatim conversation transcript",
  "chiefComplaint": "Patient's main symptoms and concerns",
  "diagnosis": "Primary diagnosis with clinical reasoning",
  "medications": [
    {
      "name": "Medicine name",
      "dosage": "Strength (e.g., 500mg)",
      "frequency": "How often (e.g., Twice daily (BD))",
      "duration": "How long (e.g., 5 days)",
      "route": "Administration route (e.g., Oral)",
      "instructions": "Special instructions (e.g., After food)"
    }
  ],
  "labTests": [
    {
      "name": "Test name",
      "urgency": "Routine/Urgent/STAT",
      "notes": "Any special instructions"
    }
  ],
  "vitals": {
    "bp": "Blood pressure if mentioned",
    "pulse": "Pulse rate if mentioned",
    "temp": "Temperature if mentioned",
    "weight": "Weight if mentioned",
    "height": "Height if mentioned",
    "spo2": "SpO2 if mentioned",
    "rr": "Respiratory rate if mentioned"
  },
  "advice": "Diet, lifestyle, precautions, and general advice",
  "icdCodes": ["ICD-10 codes relevant to diagnosis"],
  "followUpDate": "Recommended follow-up date (YYYY-MM-DD format) or null",
  "followUpNotes": "Follow-up instructions or null",
  "confidence": 0.95
}

IMPORTANT:
- Be accurate and conservative in medical interpretations
- Only include information explicitly mentioned or strongly implied
- Use standard medical terminology
- If something is unclear, mark it in notes
- Ensure medication details are complete and safe
- Return ONLY valid JSON, no markdown formatting`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    let text = completion.choices[0].message.content || "{}";
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(text);
    const processingTime = Date.now() - startTime;

    return {
      transcription: transcriptText,
      diagnosis: parsed.diagnosis || "",
      chiefComplaint: parsed.chiefComplaint || "",
      medications: parsed.medications || [],
      labTests: parsed.labTests || [],
      vitals: parsed.vitals || {},
      advice: parsed.advice || "",
      icdCodes: parsed.icdCodes || [],
      followUpDate: parsed.followUpDate || undefined,
      followUpNotes: parsed.followUpNotes || undefined,
      metadata: {
        processingTime,
        confidence: parsed.confidence || 0.9,
        language: "en",
      },
    };
  } catch (error: any) {
    console.error("Voice transcription error:", error);
    throw new Error(`AI transcription failed: ${error.message}`);
  }
}

export async function processVoiceRecording(
  prescriptionId: string,
  hospitalId: string,
  transcriptText: string,
  voiceRecordingUrl?: string,
  language?: string
): Promise<any> {
  const prescription = await px.prescription.findFirst({
    where: { id: prescriptionId, hospitalId },
    include: {
      patient: true,
      doctor: { include: { department: true } },
      appointment: true,
    },
  });

  if (!prescription) {
    throw new Error("Prescription not found");
  }

  const patientAge = prescription.patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(prescription.patient.dateOfBirth).getTime()) / 31557600000)
    : undefined;

  const medicalHistory = await px.prescription
    .findMany({
      where: {
        patientId: prescription.patientId,
        hospitalId,
        status: { not: "DRAFT" },
        id: { not: prescriptionId },
      },
      select: { diagnosis: true, chiefComplaint: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    })
    .then((rxs: any[]) =>
      rxs
        .map((r) => r.diagnosis || r.chiefComplaint)
        .filter(Boolean)
        .join("; ")
    );

  const result = await transcribeAndGeneratePrescription(
    transcriptText,
    {
      name: prescription.patient.name,
      age: patientAge,
      gender: prescription.patient.gender,
      bloodGroup: prescription.patient.bloodGroup,
      medicalHistory: medicalHistory || undefined,
    },
    {
      name: prescription.doctor.name,
      specialization: prescription.doctor.specialization,
      department: prescription.doctor.department?.name,
    },
    language
  );

  const updateData: any = {
    transcription: result.transcription,
    chiefComplaint: result.chiefComplaint,
    diagnosis: result.diagnosis,
    medications: JSON.stringify(result.medications),
    labTests: JSON.stringify(result.labTests),
    vitals: JSON.stringify(result.vitals),
    advice: result.advice,
    icdCodes: JSON.stringify(result.icdCodes),
    followUpDate: result.followUpDate ? new Date(result.followUpDate) : null,
    followUpNotes: result.followUpNotes || null,
    transcriptionMetadata: JSON.stringify(result.metadata),
    aiProcessedAt: new Date(),
  };

  if (voiceRecordingUrl) {
    updateData.voiceRecordingUrl = voiceRecordingUrl;
  }

  const updated = await px.prescription.update({
    where: { id: prescriptionId },
    data: updateData,
  });

  return {
    prescription: updated,
    aiResult: result,
  };
}

export async function streamTranscription(
  audioChunk: string,
  context: {
    patientName: string;
    doctorName: string;
    previousTranscript?: string;
  }
): Promise<{ transcript: string; isComplete: boolean }> {
  try {
    const prompt = `You are transcribing a live doctor-patient conversation.

Doctor: Dr. ${context.doctorName}
Patient: ${context.patientName}
${context.previousTranscript ? `Previous transcript:\n${context.previousTranscript}\n\n` : ""}

New audio segment:
${audioChunk}

Provide ONLY the transcription of this segment. Format as:
Doctor: [what doctor said]
Patient: [what patient said]

Be accurate and use medical terminology where appropriate.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical transcription assistant. Transcribe doctor-patient conversations accurately.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";

    return {
      transcript: text,
      isComplete: false,
    };
  } catch (error: any) {
    console.error("Stream transcription error:", error);
    return {
      transcript: "",
      isComplete: false,
    };
  }
}
