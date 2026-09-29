import { useMemo } from "react";
import { Ambulance, Crosshair, Hospital, Layers, Minus, Navigation, Plus, User } from "lucide-react";
import type { Coordinates } from "@/types";
import { mapService } from "@/services/mapService";
import { cn } from "@/lib/utils";

export interface MapMarker {
  id: string;
  kind: "user" | "ambulance" | "hospital";
  label: string;
  position: Coordinates;
}

/**
 * Provider-abstracted map surface. When VITE_MAPS_API_KEY is configured a real
 * provider (Google Maps) can be mounted here; otherwise an interactive
 * schematic map is rendered with the same marker/route contract.
 */
export function MapView({
  markers,
  route = true,
  className,
  traffic = true,
}: {
  markers: MapMarker[];
  route?: boolean;
  traffic?: boolean;
  className?: string;
}) {
  const points = useMemo(() => {
    const lats = markers.map((m) => m.position.lat);
    const lngs = markers.map((m) => m.position.lng);
    const minLat = Math.min(...lats) - 0.006;
    const maxLat = Math.max(...lats) + 0.006;
    const minLng = Math.min(...lngs) - 0.006;
    const maxLng = Math.max(...lngs) + 0.006;
    return markers.map((m) => ({
      ...m,
      x: ((m.position.lng - minLng) / (maxLng - minLng || 1)) * 100,
      y: (1 - (m.position.lat - minLat) / (maxLat - minLat || 1)) * 100,
    }));
  }, [markers]);

  const icons = { user: User, ambulance: Ambulance, hospital: Hospital } as const;
  const tones = {
    user: "bg-primary text-primary-foreground",
    ambulance: "bg-emergency text-emergency-foreground",
    hospital: "bg-success text-success-foreground",
  } as const;

  return (
    <div
      className={cn("relative overflow-hidden rounded-xl border border-border bg-muted", className)}
      role="img"
      aria-label="Map showing user, ambulance and hospital locations"
    >
      {/* street grid */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="lr-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0H0V56" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lr-grid)" className="text-foreground" />
        <path d="M0 62% L100% 38%" stroke="currentColor" strokeOpacity="0.14" strokeWidth="10" className="text-foreground" />
      </svg>

      {route && points.length > 1 ? (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polyline
            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="0.9"
            strokeDasharray="2.5 1.6"
            strokeLinecap="round"
          />
        </svg>
      ) : null}

      {points.map((p) => {
        const Icon = icons[p.kind];
        return (
          <div
            key={p.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className={cn("relative grid h-9 w-9 place-items-center rounded-full shadow-[var(--shadow-float)]", tones[p.kind], p.kind === "ambulance" && "pulse-ring")}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="whitespace-nowrap rounded-md bg-card/90 px-1.5 py-0.5 text-[10px] font-semibold shadow-[var(--shadow-card)]">
                {p.label}
              </span>
            </div>
          </div>
        );
      })}

      <div className="absolute right-3 top-3 flex flex-col gap-2">
        {[Plus, Minus, Crosshair, Navigation, Layers].map((Icon, i) => (
          <button
            key={i}
            type="button"
            aria-label={["Zoom in", "Zoom out", "Center map", "Navigate", "Layers"][i]}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-accent"
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        ))}
      </div>

      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 rounded-lg bg-card/90 px-2.5 py-1.5 text-[11px] font-medium shadow-[var(--shadow-card)]">
        <span>Provider: {mapService.configured ? "Google Maps" : "schematic preview"}</span>
        {traffic ? <span className="text-muted-foreground">· Traffic layer ready</span> : null}
      </div>
    </div>
  );
}
