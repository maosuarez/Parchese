import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { generateMission, type Mission, type MissionInput } from "@/lib/mission-engine";
import { initialNotifications, mockEvents, rewards as allRewards } from "@/mock/data";
import type {
  NeedKey,
  ParticipantStatus,
  PulseEvent,
  PulseNotification,
  SocialBattery,
  TimeSlot,
} from "@/types";

export interface ChatMessage {
  id: string;
  authorId: string;
  text: string;
  system?: boolean;
}

interface PulseState {
  points: number;
  level: number;
  levelName: string;
  xp: number;
  xpGoal: number;
  streak: number;
  missionsCompleted: number;
  connections: number;
  need: NeedKey | null;
  battery: SocialBattery | null;
  time: TimeSlot | null;
  radiusKm: number;
  mission: Mission | null;
  joined: boolean;
  checkedIn: boolean;
  completed: boolean;
  participantStatus: Record<string, ParticipantStatus>;
  chat: ChatMessage[];
  againVotes: Record<string, "yes" | "neutral" | "no">;
  podCreated: boolean;
  blocked: string[];
  redeemed: string[];
  notifications: PulseNotification[];
  alertsEnabled: boolean;
  dimensions: { move: number; connect: number; recharge: number; grow: number };
}

interface PulseActions {
  setNeed: (n: NeedKey) => void;
  setBattery: (b: SocialBattery) => void;
  setTime: (t: TimeSlot) => void;
  setRadius: (km: number) => void;
  buildMission: () => Mission | null;
  resetFlow: () => void;
  acceptMission: (event?: PulseEvent) => void;
  joinEvent: (event: PulseEvent) => void;
  sendMessage: (text: string) => void;
  checkIn: () => void;
  completeMission: () => void;
  voteAgain: (userId: string, vote: "yes" | "neutral" | "no") => void;
  createPod: () => void;
  redeem: (rewardId: string) => void;
  markNotificationsRead: () => void;
  toggleAlerts: (on: boolean) => void;
  events: PulseEvent[];
  createEvent: (event: PulseEvent) => void;
}

const PulseContext = createContext<(PulseState & PulseActions) | null>(null);

const missionInputDefaults = { radiusKm: 3 };

export function PulseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PulseState>({
    points: 780,
    level: 3,
    levelName: "Connector",
    xp: 420,
    xpGoal: 800,
    streak: 12,
    missionsCompleted: 26,
    connections: 14,
    need: null,
    battery: null,
    time: null,
    radiusKm: missionInputDefaults.radiusKm,
    mission: null,
    joined: false,
    checkedIn: false,
    completed: false,
    participantStatus: {},
    chat: [],
    againVotes: {},
    podCreated: false,
    blocked: [],
    redeemed: [],
    notifications: initialNotifications,
    alertsEnabled: false,
    dimensions: { move: 82, connect: 76, recharge: 64, grow: 69 },
  });

  const [events, setEvents] = useState<PulseEvent[]>(mockEvents);

  const patch = useCallback((next: Partial<PulseState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const buildMission = useCallback(() => {
    let created: Mission | null = null;
    setState((prev) => {
      if (!prev.need || !prev.battery || !prev.time) return prev;
      const input: MissionInput = {
        need: prev.need,
        battery: prev.battery,
        time: prev.time,
        radiusKm: prev.radiusKm,
      };
      created = generateMission(input, prev.blocked);
      return { ...prev, mission: created };
    });
    return created;
  }, []);

  const startMission = useCallback((event: PulseEvent, mission?: Mission | null) => {
    setState((prev) => {
      const roster = [...event.participant_ids.slice(0, 3), "u-eli"];
      const status: Record<string, ParticipantStatus> = {};
      roster.forEach((id, i) => {
        status[id] = id === "u-eli" ? "on_the_way" : i < 2 ? "confirmed" : "on_the_way";
      });
      return {
        ...prev,
        mission:
          mission ??
          prev.mission ?? {
            event,
            title: event.title,
            emoji: event.emoji,
            pitch: event.description,
            reason:
              "Elegiste esta experiencia directamente en el Pulse Map. Formamos un grupo pequeño compatible contigo.",
            matchScore: event.match_score,
            groupSize: Math.min(event.max_participants, event.current_participants + 1),
          },
        joined: true,
        checkedIn: false,
        completed: false,
        participantStatus: status,
        againVotes: {},
        podCreated: false,
        chat: [
          { id: "c1", authorId: "u-ana", text: "Hola 👋 ya voy saliendo." },
          { id: "c2", authorId: "u-mateo", text: "Estoy a 10 minutos." },
          {
            id: "c3",
            authorId: "parchese",
            text: "Recuerden que el encuentro es en un lugar público.",
            system: true,
          },
        ],
      };
    });
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? {
              ...e,
              current_participants: Math.min(e.max_participants, e.current_participants + 1),
              participant_ids: e.participant_ids.includes("u-eli")
                ? e.participant_ids
                : [...e.participant_ids, "u-eli"],
              status:
                e.current_participants + 1 >= e.max_participants ? "full" : e.status,
            }
          : e,
      ),
    );
  }, []);

  const value = useMemo<PulseState & PulseActions>(
    () => ({
      ...state,
      events,
      setNeed: (need) => patch({ need }),
      setBattery: (battery) => patch({ battery }),
      setTime: (time) => patch({ time }),
      setRadius: (radiusKm) => patch({ radiusKm }),
      buildMission,
      resetFlow: () =>
        patch({
          need: null,
          battery: null,
          time: null,
          mission: null,
          joined: false,
          checkedIn: false,
          completed: false,
        }),
      acceptMission: (event) => {
        const target = event ?? state.mission?.event;
        if (!target) return;
        startMission(target, state.mission);
        toast.success("Misión aceptada", { description: "Tu grupo se está formando." });
      },
      joinEvent: (event) => {
        startMission(event, null);
        toast.success(`Te uniste a ${event.title}`, { description: event.when_label });
      },
      sendMessage: (text) =>
        setState((prev) => ({
          ...prev,
          chat: [...prev.chat, { id: `c-${Date.now()}`, authorId: "u-eli", text }],
        })),
      checkIn: () =>
        setState((prev) => ({
          ...prev,
          checkedIn: true,
          participantStatus: Object.fromEntries(
            Object.entries(prev.participantStatus).map(([id]) => [id, "checked_in"]),
          ) as Record<string, ParticipantStatus>,
        })),
      completeMission: () =>
        setState((prev) => {
          if (prev.completed || !prev.mission) return prev;
          const gained = prev.mission.event.pulse_points;
          return {
            ...prev,
            completed: true,
            points: prev.points + gained,
            xp: Math.min(prev.xpGoal, prev.xp + Math.round(gained / 2)),
            missionsCompleted: prev.missionsCompleted + 1,
            connections: prev.connections + 3,
            dimensions: {
              ...prev.dimensions,
              connect: Math.min(100, prev.dimensions.connect + 4),
              move: Math.min(100, prev.dimensions.move + 2),
            },
          };
        }),
      voteAgain: (userId, vote) =>
        setState((prev) => ({
          ...prev,
          againVotes: { ...prev.againVotes, [userId]: vote },
          blocked: vote === "no" ? [...new Set([...prev.blocked, userId])] : prev.blocked,
        })),
      createPod: () => {
        patch({ podCreated: true, points: state.points + 100 });
        toast.success("Pulse Pod creado ⚡", {
          description: "Una amistad necesita más de una oportunidad.",
        });
      },
      redeem: (rewardId) => {
        const reward = allRewards.find((r) => r.id === rewardId);
        if (!reward) return;
        if (state.points < reward.cost) {
          toast.error("Aún no alcanzan tus Pulse Points", {
            description: `Te faltan ${reward.cost - state.points} ⚡`,
          });
          return;
        }
        patch({ points: state.points - reward.cost, redeemed: [...state.redeemed, rewardId] });
        toast.success("Reward desbloqueado 🎁", { description: reward.title });
      },
      markNotificationsRead: () =>
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) => ({ ...n, read: true })),
        })),
      toggleAlerts: (on) => {
        patch({ alertsEnabled: on });
        toast.success(on ? "Pulse Alerts activadas 🔔" : "Pulse Alerts desactivadas");
      },
      createEvent: (event) => {
        setEvents((prev) => [event, ...prev]);
        patch({ points: state.points + 150 });
        toast.success("Experiencia publicada ⚡ +150", { description: event.title });
      },
    }),
    [state, events, patch, buildMission, startMission],
  );

  return <PulseContext.Provider value={value}>{children}</PulseContext.Provider>;
}

export function usePulse() {
  const ctx = useContext(PulseContext);
  if (!ctx) throw new Error("usePulse must be used inside PulseProvider");
  return ctx;
}
