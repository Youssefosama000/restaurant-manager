import { useEffect, useState } from "react";
import { Clock, Save, Loader2, CheckCircle, AlertCircle, CalendarPlus, X, Plus } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import BranchSwitcher from "../components/layout/BranchSwitcher";
import { useAuth } from "../context/AuthContext";
import { getBranchDetails, setWorkingHours, updateWorkingHours } from "../api/branches";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const DAY_LABELS: Record<string, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

interface DaySchedule {
  openingTime: string;
  closingTime: string;
}

const defaultHours = (): DaySchedule => ({ openingTime: "08:00", closingTime: "22:00" });

function parseSchedule(details: unknown): Record<string, DaySchedule> | null {
  const d = details as Record<string, unknown> | null;
  if (!d) return null;
  const nested = (k: string) =>
    (d.data as Record<string, unknown> | undefined)?.[k] ??
    (d.details as Record<string, unknown> | undefined)?.[k];
  const raw =
    d.workingHours ?? d.schedule ?? d.openingHours ?? nested("workingHours") ?? nested("schedule") ?? nested("openingHours");
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const next: Record<string, DaySchedule> = {};
  for (const entry of raw as Array<Record<string, unknown>>) {
    const day = String(entry.day ?? entry.Day ?? "").toLowerCase();
    if (!DAYS.includes(day)) continue;
    const open = String(entry.openingTime ?? entry.OpeningTime ?? entry.openTime ?? entry.OpenTime ?? entry.open ?? "08:00:00");
    const close = String(entry.closingTime ?? entry.ClosingTime ?? entry.closeTime ?? entry.CloseTime ?? entry.close ?? "22:00:00");
    next[day] = { openingTime: open.slice(0, 5), closingTime: close.slice(0, 5) };
  }
  return Object.keys(next).length ? next : null;
}

export default function OpeningTimesPage() {
  const { branchId, activeBranch } = useAuth();
  const [schedule,    setSchedule]    = useState<Record<string, DaySchedule>>({});
  const [activeDays,  setActiveDays]  = useState<Set<string>>(new Set());
  const [loading,     setLoading]     = useState(false);
  const [hasHours,    setHasHours]    = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!branchId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setEditing(false);
    setSuccess(false);
    (async () => {
      try {
        const details = await getBranchDetails(branchId);
        const parsed = parseSchedule(details);
        if (cancelled) return;
        setSchedule(parsed ?? {});
        setActiveDays(new Set(parsed ? Object.keys(parsed) : []));
        setHasHours(!!parsed);
      } catch {
        if (!cancelled) {
          setSchedule({});
          setActiveDays(new Set());
          setHasHours(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [branchId]);

  function updateTime(day: string, field: "openingTime" | "closingTime", value: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...(prev[day] ?? defaultHours()), [field]: value },
    }));
  }

  function removeDay(day: string) {
    setActiveDays((prev) => { const next = new Set(prev); next.delete(day); return next; });
  }

  function addDay(day: string) {
    if (!schedule[day]) {
      setSchedule((prev) => ({ ...prev, [day]: defaultHours() }));
    }
    setActiveDays((prev) => new Set([...prev, day]));
  }

  function startEditing() {
    const seeded: Record<string, DaySchedule> = {};
    const days = new Set<string>();
    for (const day of DAYS) {
      if (schedule[day]) { seeded[day] = schedule[day]; days.add(day); }
    }
    // If no days at all, default to all days
    if (days.size === 0) {
      for (const day of DAYS) { seeded[day] = defaultHours(); days.add(day); }
    }
    setSchedule(seeded);
    setActiveDays(days);
    setEditing(true);
  }

  async function handleSave() {
    if (!branchId) { setError("Select a branch above first."); return; }
    setError(null);
    setSaving(true);
    try {
      const payload = [...activeDays].map((d) => ({
        day: d,
        openingTime: (schedule[d]?.openingTime ?? "08:00") + ":00",
        closingTime: (schedule[d]?.closingTime ?? "22:00") + ":00",
      }));
      if (hasHours) {
        await updateWorkingHours(branchId, payload);
      } else {
        await setWorkingHours(branchId, payload);
      }
      setHasHours(activeDays.size > 0);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  }

  const removableDays = DAYS.filter((d) => !activeDays.has(d));
  const showEditor = editing || hasHours;

  return (
    <MainLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slyce-dark">Opening Times</h1>
        <div className="mt-1">
          <BranchSwitcher />
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        {!branchId ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-sm font-medium text-slyce-dark">No branch selected</p>
            <p className="text-xs text-slyce-grey mt-1">Pick a branch above to set its working hours.</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl p-10 flex items-center justify-center gap-2 text-slyce-grey">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading working hours…</span>
          </div>
        ) : !showEditor ? (
          <div className="bg-white rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center mx-auto mb-3">
              <Clock size={20} className="text-slyce-grey" />
            </div>
            <p className="text-sm font-medium text-slyce-dark">No working hours set</p>
            <p className="text-xs text-slyce-grey mt-1 mb-4">This branch doesn't have any working hours yet.</p>
            <button
              onClick={startEditing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-green-primary text-white hover:opacity-90 transition-opacity"
            >
              <CalendarPlus size={14} />
              Set working hours
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-slyce-grey" />
              <h2 className="text-sm font-semibold text-slyce-dark">Weekly Schedule</h2>
            </div>
            <p className="text-xs text-slyce-grey mb-5">
              Editing hours for{" "}
              <span className="font-semibold text-slyce-dark">
                {activeBranch?.name ?? "selected branch"}
              </span>
            </p>

            <div className="space-y-3">
              {DAYS.filter((day) => activeDays.has(day)).map((day) => {
                const s = schedule[day] ?? defaultHours();
                return (
                  <div key={day} className="flex items-center gap-3 p-3 rounded-xl border border-slyce-border">
                    <span className="text-sm font-medium text-slyce-dark w-28 flex-shrink-0">
                      {DAY_LABELS[day]}
                    </span>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={s.openingTime}
                        onChange={(e) => updateTime(day, "openingTime", e.target.value)}
                        className="text-sm border border-slyce-border rounded-lg px-2 py-1.5 bg-white text-slyce-dark"
                      />
                      <span className="text-slyce-grey">–</span>
                      <input
                        type="time"
                        value={s.closingTime}
                        onChange={(e) => updateTime(day, "closingTime", e.target.value)}
                        className="text-sm border border-slyce-border rounded-lg px-2 py-1.5 bg-white text-slyce-dark"
                      />
                    </div>
                    <button
                      onClick={() => removeDay(day)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-slyce-grey hover:text-red-500 transition-colors flex-shrink-0"
                      title="Remove this day"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add removed days back */}
            {removableDays.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {removableDays.map((day) => (
                  <button
                    key={day}
                    onClick={() => addDay(day)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-slyce-border text-xs text-slyce-grey hover:border-green-primary hover:text-green-primary transition-colors"
                  >
                    <Plus size={11} />
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-600 text-xs">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 flex items-center gap-2 text-green-primary text-xs">
                <CheckCircle size={14} />
                Working hours saved.
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-green-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving…" : "Save schedule"}
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
