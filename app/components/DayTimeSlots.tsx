// app/components/DayTimeSlots.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  name: string; // ex: "times_monday" (doit matcher l'action serveur)
  label: string; // ex: "Lundi"
  defaultTimes?: string[]; // ex: ["08:00","14:30"]
  quickAdd?: string[]; // ex: ["08:00","12:00","18:00"]
};

function norm(t: string) {
  // "8:0" -> "08:00" ; clamp 00-23:00-59
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(t.trim());
  if (!m) return null;
  const h = Math.max(0, Math.min(23, parseInt(m[1], 10)));
  const mi = Math.max(0, Math.min(59, parseInt(m[2], 10)));
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

function uniqueSorted(arr: string[]) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

export default function DayTimeSlots({
  name,
  label,
  defaultTimes = [],
  quickAdd = ["08:00", "12:00", "18:00"],
}: Props) {
  const [times, setTimes] = useState<string[]>(() =>
    uniqueSorted(defaultTimes)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const hiddenValue = useMemo(() => times.join(", "), [times]);

  function addTime(t: string | null) {
    const v = t && norm(t);
    if (!v) return;
    setTimes((prev) => uniqueSorted([...prev, v]));
  }

  function onAddClick() {
    const v = inputRef.current?.value || "";
    addTime(v);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeTime(t: string) {
    setTimes((prev) => prev.filter((x) => x !== t));
  }

  // Permet d'ajouter rapidement des slots courants
  function addQuick(t: string) {
    addTime(t);
  }

  // Accessibilité : Enter pour ajouter
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddClick();
    }
  }

  // (optionnel) Synchroniser avec defaultTimes si ça change (rare en pratique)
  useEffect(() => {
    setTimes(uniqueSorted(defaultTimes));
  }, [defaultTimes.join("|")]);

  return (
    <div className="form-control">
      <div className="label">
        <span className="label-text">{label}</span>
      </div>

      <div className="flex flex-col gap-3">
        {/* Ligne d'ajout */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="time"
            className="input input-bordered"
            onKeyDown={onKeyDown}
            aria-label={`Ajouter une heure pour ${label}`}
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={onAddClick}
          >
            Ajouter
          </button>

          {/* Quick-add */}
          <div className="hidden sm:flex items-center gap-1 ml-2">
            {quickAdd.map((q) => (
              <button
                type="button"
                key={q}
                className="btn btn-xs btn-ghost"
                onClick={() => addQuick(q)}
                aria-label={`Ajouter ${q}`}
                title={`Ajouter ${q}`}
              >
                + {q}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des heures sélectionnées */}
        <div className="flex flex-wrap gap-2">
          {times.length === 0 ? (
            <span className="text-base-content/50 text-sm">Aucune heure</span>
          ) : (
            times.map((t) => (
              <div key={t} className="badge badge-outline gap-1">
                {t}
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  onClick={() => removeTime(t)}
                  aria-label={`Supprimer ${t}`}
                  title={`Supprimer ${t}`}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sérialisation vers l'action serveur telle qu'attendue (string "HH:mm, HH:mm") */}
      <input type="hidden" name={name} value={hiddenValue} />
    </div>
  );
}
