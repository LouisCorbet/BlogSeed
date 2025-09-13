"use client";

import { useState, useTransition } from "react";
import {
  saveAutoPublishSettings,
  publishAutoNow,
  toggleAutoPublishDirect,
} from "@/app/admin/actions";
import type { SiteSettings } from "@/lib/siteSettings";
import DayTimeSlots from "./DayTimeSlots";

const MISTRAL_MODELS = [
  "mistral-small-latest",
  "mistral-medium-latest",
  "mistral-large-latest",
  "open-mistral-nemo",
  "codestral-latest",
];

export default function AutoPublishSettingsForm({
  settings,
}: {
  settings: SiteSettings;
}) {
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(!!settings.autoPublishEnabled);

  const prompt = settings.autoPublishPrompt ?? "";
  const model = settings.autoPublishModel ?? "mistral-large-latest";
  const author = settings.autoPublishAuthor ?? "Rédaction auto";
  const sched = settings.autoPublishSchedule ?? {};

  function onToggle(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.currentTarget.checked;
    setEnabled(next); // Optimistic
    startTransition(async () => {
      try {
        await toggleAutoPublishDirect(next);
      } catch {
        setEnabled((prev) => !prev); // rollback si erreur
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* ====== Bloc: Actions rapides & Activation ====== */}
      <div className="p-4 rounded-lg bg-base-200 space-y-4">
        <h3 className="font-semibold text-lg">Activation & actions rapides</h3>
        <div className="flex flex-col gap-6">
          {/* Toggle auto-save */}
          <div className="form-control flex flex-row">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={enabled}
              onChange={onToggle}
            />
            <span className="ml-2 label-text-alt text-base-content/60">
              {isPending
                ? "Enregistrement..."
                : enabled
                ? "Publication automatique Activée"
                : "Publication automatique Désactivée"}
            </span>
          </div>

          {/* Action manuelle */}
          <form action={publishAutoNow}>
            <button type="submit" className="btn btn-secondary">
              Publier un nouvel article auto
            </button>
          </form>
        </div>
      </div>

      {/* ====== Bloc: Planning ====== */}
      <div className="p-4 rounded-lg bg-base-200">
        <h3 className="font-semibold text-lg mb-4">
          Planning de publication automatique
        </h3>
        <form action={saveAutoPublishSettings} className="space-y-8">
          <div className="flex flex-col gap-6">
            <DayTimeSlots
              name="times_monday"
              label="Lundi"
              defaultTimes={sched.monday ?? []}
            />
            <DayTimeSlots
              name="times_tuesday"
              label="Mardi"
              defaultTimes={sched.tuesday ?? []}
            />
            <DayTimeSlots
              name="times_wednesday"
              label="Mercredi"
              defaultTimes={sched.wednesday ?? []}
            />
            <DayTimeSlots
              name="times_thursday"
              label="Jeudi"
              defaultTimes={sched.thursday ?? []}
            />
            <DayTimeSlots
              name="times_friday"
              label="Vendredi"
              defaultTimes={sched.friday ?? []}
            />
            <DayTimeSlots
              name="times_saturday"
              label="Samedi"
              defaultTimes={sched.saturday ?? []}
            />
            <DayTimeSlots
              name="times_sunday"
              label="Dimanche"
              defaultTimes={sched.sunday ?? []}
            />
          </div>
          {/* ====== Bloc: Bouton save ====== */}
          <div className="pt-2">
            <button type="submit" className="btn btn-primary w-full sm:w-auto">
              Enregistrer le planning
            </button>
          </div>
        </form>
      </div>
      <div className="p-4 rounded-lg bg-base-200 space-y-8">
        <form action={saveAutoPublishSettings} className="space-y-8">
          {/* ====== Bloc: Prompt IA ====== */}
          <div className="p-4 rounded-lg bg-base-200 space-y-2">
            <h3 className="font-semibold text-lg">Prompt IA</h3>
            <textarea
              name="autoPublishPrompt"
              defaultValue={prompt}
              className="textarea textarea-bordered w-full"
              rows={5}
            />
          </div>

          {/* ====== Bloc: Paramètres IA ====== */}
          <div className="p-4 rounded-lg bg-base-200 space-y-4">
            <h3 className="font-semibold text-lg">Paramètres IA</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control">
                <span className="label">
                  <span className="label-text">Modèle Mistral</span>
                </span>
                <select
                  name="autoPublishModel"
                  className="select select-bordered w-full"
                  defaultValue={model}
                >
                  {MISTRAL_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control">
                <span className="label">
                  <span className="label-text">Auteur</span>
                </span>
                <input
                  name="autoPublishAuthor"
                  type="text"
                  defaultValue={author}
                  className="input input-bordered w-full"
                />
              </label>
            </div>
          </div>

          {/* ====== Bloc: Bouton save ====== */}
          <div className="pt-2">
            <button type="submit" className="btn btn-primary w-full sm:w-auto">
              Enregistrer les paramètres IA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
