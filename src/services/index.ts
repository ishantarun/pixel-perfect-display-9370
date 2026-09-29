import { apiGet, apiPost } from "@/api/client";
import {
  DEMO_ACTIVITY,
  DEMO_AMBULANCES,
  DEMO_BILLS,
  DEMO_HOSPITALS,
  DEMO_NOTIFICATIONS,
  DEMO_PAYMENTS,
  DEMO_RECORDS,
  DEMO_USER,
} from "@/data/mock";
import type {
  ActivityItem,
  AiAssessment,
  Ambulance,
  AppNotification,
  Bill,
  Hospital,
  MedicalRecord,
  Payment,
} from "@/types";

/* ---------------- auth / user ---------------- */
export const authService = {
  login: (email: string, password: string) =>
    apiPost("/api/auth/login", { email, password }, { token: "demo-token" }),
  register: (payload: Record<string, unknown>) =>
    apiPost("/api/auth/register", payload, { token: "demo-token" }),
};

export const userService = {
  me: () => apiGet("/api/users/me", DEMO_USER),
};

/* ---------------- emergency / ambulance ---------------- */
export const emergencyService = {
  create: (payload: Record<string, unknown>) =>
    apiPost("/api/emergency", payload, { id: "req-demo-1", status: "requested" }),
  get: (id: string) => apiGet(`/api/emergency/${id}`, { id, status: "en_route" }),
};

export const ambulanceService = {
  nearby: () => apiGet<Ambulance[]>("/api/ambulances/nearby", DEMO_AMBULANCES),
  request: (ambulanceId: string) =>
    apiPost("/api/ambulances/request", { ambulanceId }, { requestId: "req-demo-1", ambulanceId }),
  byId: (id: string) =>
    apiGet<Ambulance>(`/api/ambulances/${id}`, DEMO_AMBULANCES[0] as Ambulance),
  location: (id: string) =>
    apiGet(`/api/ambulances/${id}/location`, (DEMO_AMBULANCES[0] as Ambulance).position),
};

/* ---------------- hospitals ---------------- */
export const hospitalService = {
  nearby: () => apiGet<Hospital[]>("/api/hospitals/nearby", DEMO_HOSPITALS),
  byId: (id: string) =>
    apiGet<Hospital>(`/api/hospitals/${id}`, DEMO_HOSPITALS[0] as Hospital),
  sendEmergencyAlert: (id: string) =>
    apiPost(`/api/hospitals/${id}/emergency-alert`, {}, { status: "sent" }),
};

/* ---------------- AI ---------------- */
export const aiService = {
  assessment: (payload: Record<string, unknown>) =>
    apiPost<AiAssessment>("/api/ai/assessment", payload, {
      category: "Possible respiratory distress",
      warningSigns: [
        "Reported difficulty completing full sentences",
        "Chest tightness described by the patient",
        "Known asthma history in the record",
      ],
      urgency: "High",
      department: "Emergency medicine",
      specialist: "Pulmonology",
      confidence: "Moderate — limited information provided",
    }),
  imageAnalysis: (payload: Record<string, unknown>) =>
    apiPost<AiAssessment>("/api/ai/image-analysis", payload, {
      category: "Possible soft-tissue injury",
      warningSigns: ["Visible swelling", "Discolouration around the area"],
      urgency: "Moderate",
      department: "Emergency / Orthopaedics",
      specialist: "Orthopaedic surgery",
      confidence: "Low — image quality and context limited",
    }),
};

/* ---------------- assistants (kept fully separate) ---------------- */
export const chatService = {
  send: (message: string) =>
    apiPost<{ reply: string }>("/api/chat", { message }, { reply: demoChatReply(message) }),
};

export const voiceService = {
  transcribe: (payload: unknown) =>
    apiPost<{ text: string }>("/api/voice/transcribe", payload, { text: "I need an ambulance." }),
  speak: (text: string) => apiPost("/api/voice/speak", { text }, { ok: true }),
};

const HEALTH_WORDS = [
  "health", "pain", "chest", "fever", "ambulance", "hospital", "doctor", "injury", "breath",
  "blood", "allergy", "medicine", "medication", "asthma", "heart", "accident", "emergency",
  "burn", "bleed", "stroke", "sugar", "bp", "pressure", "cough", "headache",
];

function demoChatReply(message: string) {
  const text = message.toLowerCase();
  if (!HEALTH_WORDS.some((w) => text.includes(w))) {
    return "I'm LifeRoute's health assistant. Please ask a health or healthcare-related question.";
  }
  return "Demo response: for chest pain lasting more than a few minutes, breathlessness, or fainting, treat it as an emergency and request an ambulance immediately. This is general information, not a medical diagnosis.";
}

/* ---------------- records / payments / notifications ---------------- */
export const medicalRecordService = {
  list: () => apiGet<MedicalRecord[]>("/api/medical-records", DEMO_RECORDS),
  create: (payload: Record<string, unknown>) =>
    apiPost("/api/medical-records", payload, { id: "rec-new" }),
};

export const paymentService = {
  list: () => apiGet<Payment[]>("/api/payments", DEMO_PAYMENTS),
  create: (payload: Record<string, unknown>) =>
    apiPost("/api/payments/create", payload, { id: "pay-new", transactionId: "LRDEMO0001" }),
  verify: (id: string) => apiPost("/api/payments/verify", { id }, { status: "successful" }),
  bills: () => apiGet<Bill[]>("/api/bills", DEMO_BILLS),
};

export const notificationService = {
  list: () => apiGet<AppNotification[]>("/api/notifications", DEMO_NOTIFICATIONS),
  activity: () => apiGet<ActivityItem[]>("/api/activity", DEMO_ACTIVITY),
};

/* ---------------- realtime (ready for Socket.IO / SSE) ---------------- */
export type RealtimeEvent =
  | "ambulance:assigned"
  | "ambulance:location"
  | "ambulance:status"
  | "ambulance:arrived"
  | "emergency:updated"
  | "hospital:alert"
  | "hospital:acknowledged"
  | "notification:new";

type Handler = (payload: unknown) => void;
const handlers = new Map<RealtimeEvent, Set<Handler>>();

export const realtimeService = {
  on(event: RealtimeEvent, handler: Handler) {
    const set = handlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    handlers.set(event, set);
    return () => set.delete(handler);
  },
  emit(event: RealtimeEvent, payload: unknown) {
    handlers.get(event)?.forEach((h) => h(payload));
  },
};
