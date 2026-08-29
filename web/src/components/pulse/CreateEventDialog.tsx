import { useState, type ReactNode } from "react";
import { MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePulse } from "@/features/pulse-store";
import { categoryMeta, venues } from "@/mock/data";
import { cn } from "@/lib/utils";
import type { EventCategory, PulseEvent, SocialBattery } from "@/types";

const categories = Object.keys(categoryMeta) as EventCategory[];

/**
 * Venue picker: mock list today, Google Places (New) autocomplete tomorrow.
 * We already persist the shape Places returns: place_id, coords, address, name.
 */
export function CreateEventDialog({ trigger }: { trigger: ReactNode }) {
  const { createEvent } = usePulse();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<EventCategory>("coffee");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("16:00");
  const [duration, setDuration] = useState("30");
  const [max, setMax] = useState("5");
  const [battery, setBattery] = useState<Exclude<SocialBattery, "surprise">>("medium");
  const [venueId, setVenueId] = useState(venues[0]!.id);
  const [query, setQuery] = useState("");

  const results = venues.filter((v) =>
    `${v.name} ${v.type} ${v.address}`.toLowerCase().includes(query.toLowerCase()),
  );

  function submit() {
    const venue = venues.find((v) => v.id === venueId)!;
    const event: PulseEvent = {
      id: `e-${Date.now()}`,
      title: title.trim() || `${categoryMeta[category].label} Session`,
      emoji: categoryMeta[category].emoji,
      description: description.trim() || "Experiencia creada por un miembro de Parchese.",
      category,
      latitude: venue.latitude,
      longitude: venue.longitude,
      venue_id: venue.id,
      start_time: startTime,
      end_time: startTime,
      duration_min: Number(duration),
      max_participants: Number(max),
      current_participants: 1,
      pulse_points: Math.max(30, Number(duration) * 2),
      social_battery: battery,
      status: "open",
      creator_id: "u-eli",
      visibility: "public",
      distance_m: 700,
      match_score: 90,
      when_label: `Hoy · ${startTime}`,
      day: "today",
      slot: "afternoon",
      participant_ids: ["u-eli"],
      is_pod: false,
    };
    createEvent(event);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-panel">
        <DialogHeader>
          <DialogTitle>+ Crear experiencia</DialogTitle>
          <DialogDescription>
            Solo lugares públicos y verificados. Grupos pequeños funcionan mejor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as EventCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryMeta[c].emoji} {categoryMeta[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Social Battery sugerida</Label>
              <Select
                value={battery}
                onValueChange={(v) => setBattery(v as Exclude<SocialBattery, "surprise">)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🔋 Low</SelectItem>
                  <SelectItem value="medium">🔋🔋 Medium</SelectItem>
                  <SelectItem value="high">🔋🔋🔋 High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-title">Nombre</Label>
            <Input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Coffee Connection"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-time">Hora</Label>
              <Input id="ev-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-dur">Duración</Label>
              <Input id="ev-dur" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-max">Máx.</Label>
              <Input id="ev-max" type="number" value={max} onChange={(e) => setMax(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-desc">Descripción</Label>
            <Textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qué van a hacer y por qué vale salir de casa."
            />
          </div>

          <div className="space-y-2">
            <Label>Lugar público</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Café, parque, cowork, gym, biblioteca…"
                className="pl-9"
              />
            </div>
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {results.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVenueId(v.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-2xl border px-3 py-2 text-left transition-colors",
                    venueId === v.id
                      ? "border-cyan/50 bg-cyan/10"
                      : "border-border bg-panel-2/50 hover:border-cyan/25",
                  )}
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-cyan" />
                  <span>
                    <span className="block text-xs font-semibold">{v.name}</span>
                    <span className="block text-[11px] text-muted-foreground">{v.address}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={submit}>
            Publicar experiencia · +150 ⚡
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
