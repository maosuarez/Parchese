import { Bell } from "lucide-react";

import { usePulse } from "@/features/pulse-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function NotificationCenter() {
  const { notifications, markNotificationsRead, alertsEnabled, toggleAlerts } = usePulse();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Popover onOpenChange={(open) => open && markNotificationsRead()}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="glass relative grid size-10 place-items-center rounded-2xl text-foreground"
          aria-label="Notificaciones"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-pink text-[9px] font-bold text-on-bright">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] border-border bg-panel p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">🔔 Pulse Alerts</p>
          <p className="text-[11px] text-muted-foreground">
            Chapinero · 3 km · Coffee, Walk, Cowork
          </p>
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto p-2">
          {notifications.map((n) => (
            <div key={n.id} className="rounded-2xl bg-panel-2/60 p-3">
              <p className="text-xs font-semibold">
                {n.emoji} {n.title}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">{n.time}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-border p-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            ¿Quieres que Parchese te avise cuando aparezca algo interesante cerca?
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium">Activar avisos</span>
            <Switch checked={alertsEnabled} onCheckedChange={toggleAlerts} />
          </div>
          {!alertsEnabled && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-8 w-full text-[11px] text-muted-foreground"
            >
              Ahora no
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
