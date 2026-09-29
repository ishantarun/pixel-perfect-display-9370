import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mic, RotateCcw, Square, X } from "lucide-react";
import { useAppState } from "@/context/AppStateProvider";
import { voiceService } from "@/services";
import { Button, DemoBadge, Pill } from "@/components/common/Primitives";

type VoiceState = "ready" | "listening" | "processing" | "speaking";

const STATE_COPY: Record<VoiceState, string> = {
  ready: "Tap the microphone to speak.",
  listening: "Listening…",
  processing: "Understanding your request…",
  speaking: "LifeRoute is responding…",
};

const LANGUAGES = ["English", "हिन्दी (Hindi)", "Hinglish", "मराठी", "ગુજરાતી", "বাংলা", "தமிழ்", "తెలుగు", "ಕನ್ನಡ", "മലയാളം", "ਪੰਜਾਬੀ", "اردو"];

const COMMANDS = [
  "I need an ambulance.",
  "Mujhe ambulance chahiye.",
  "Where is my ambulance?",
  "Find the nearest hospital.",
  "Show my medical records.",
  "Open payments.",
];

/** Voice-only assistant. Separate component, modal, state and service from Health Chat. */
export function VoiceAssistant() {
  const { voiceOpen, setVoiceOpen } = useAppState();
  const navigate = useNavigate();
  const [state, setState] = useState<VoiceState>("ready");
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [confirmEmergency, setConfirmEmergency] = useState(false);

  async function listen(sample?: string) {
    setConfirmEmergency(false);
    setState("listening");
    setResponse("");
    await new Promise((r) => setTimeout(r, 900));
    setState("processing");
    const { text } = sample ? { text: sample } : await voiceService.transcribe({ language });
    setTranscript(text);
    await new Promise((r) => setTimeout(r, 600));
    route(text);
  }

  function route(text: string) {
    const t = text.toLowerCase();
    if (t.includes("ambulance chahiye") || t.includes("need an ambulance") || t.includes("accident hua")) {
      setConfirmEmergency(true);
      setState("ready");
      return;
    }
    setState("speaking");
    if (t.includes("where is my ambulance") || t.includes("kaha")) {
      setResponse("Opening live ambulance tracking.");
      setTimeout(() => navigate({ to: "/ambulance/tracking" }), 700);
    } else if (t.includes("hospital")) {
      setResponse("Showing nearby hospitals.");
      setTimeout(() => navigate({ to: "/hospitals" }), 700);
    } else if (t.includes("record") || t.includes("allerg")) {
      setResponse("Opening your medical records.");
      setTimeout(() => navigate({ to: "/records" }), 700);
    } else if (t.includes("payment")) {
      setResponse("Opening payments.");
      setTimeout(() => navigate({ to: "/payments" }), 700);
    } else {
      setResponse("Stay calm, keep the patient still, and tell me if you need an ambulance.");
    }
    setTimeout(() => setState("ready"), 1400);
  }

  if (!voiceOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-label="LifeRoute Voice Assistant">
      <div className="card-surface w-full max-w-md p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="min-w-0 truncate text-xl font-bold">🎙 LifeRoute Voice Assistant</h2>
          <button aria-label="Close voice assistant" onClick={() => setVoiceOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-accent">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <label className="sr-only" htmlFor="voice-language">Voice language</label>
          <select id="voice-language" value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-lg border border-border bg-card px-2 py-1 text-xs">
            {LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <DemoBadge />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={() => listen()}
            aria-label="Start listening"
            className={`relative grid h-28 w-28 place-items-center rounded-full bg-ai text-ai-foreground transition-transform hover:scale-105 ${state === "listening" ? "pulse-ring" : ""}`}
          >
            <Mic className="h-10 w-10" aria-hidden />
          </button>
          <p className="text-sm font-medium" aria-live="polite">{STATE_COPY[state]}</p>
          {transcript ? <Pill tone="ai">“{transcript}”</Pill> : null}
          {response ? <p className="text-center text-sm text-muted-foreground">{response}</p> : null}
        </div>

        {confirmEmergency ? (
          <div className="mt-6 rounded-xl border border-emergency/40 bg-emergency-soft p-4">
            <p className="font-semibold text-emergency">Emergency Request Detected</p>
            <p className="mt-1 text-sm">Request an ambulance at your current location?</p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="emergency"
                size="sm"
                onClick={() => {
                  setConfirmEmergency(false);
                  setVoiceOpen(false);
                  navigate({ to: "/emergency/request" });
                }}
              >
                CONFIRM
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmEmergency(false)}>
                CANCEL
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Try saying</p>
          <div className="flex flex-wrap gap-2">
            {COMMANDS.map((c) => (
              <button key={c} onClick={() => listen(c)} className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-accent">
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setState("ready")}>
            <Square className="h-4 w-4" aria-hidden /> Stop
          </Button>
          <Button variant="outline" size="sm" onClick={() => transcript && route(transcript)}>
            <RotateCcw className="h-4 w-4" aria-hidden /> Repeat
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setVoiceOpen(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
