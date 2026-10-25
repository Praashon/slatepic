"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect } from "react";
import { db, seedDefaultPresetsIfEmpty } from "@/lib/db";
import type { UserPreset } from "@/types";

export function useLocalPresets() {
  useEffect(() => {
    void seedDefaultPresetsIfEmpty();
  }, []);

  const presets = useLiveQuery(() => db.presets.toArray(), [], undefined);
  const isLoaded = presets !== undefined;
  const list = presets ?? [];

  const defaultPreset =
    list.find((preset) => preset.isDefault) ?? list[0] ?? undefined;

  const addPreset = useCallback(async (preset: Omit<UserPreset, "id">) => {
    if (preset.isDefault) {
      await db.presets.toCollection().modify({ isDefault: false });
    }
    return db.presets.add(preset);
  }, []);

  const updatePreset = useCallback(
    async (id: number, changes: Partial<Omit<UserPreset, "id">>) => {
      if (changes.isDefault) {
        await db.presets.toCollection().modify({ isDefault: false });
      }
      return db.presets.update(id, changes);
    },
    [],
  );

  const deletePreset = useCallback(async (id: number) => {
    await db.presets.delete(id);
    const remaining = await db.presets.toArray();
    if (remaining.length > 0 && !remaining.some((p) => p.isDefault)) {
      const firstId = remaining[0]?.id;
      if (firstId !== undefined) {
        await db.presets.update(firstId, { isDefault: true });
      }
    }
  }, []);

  const setDefaultPreset = useCallback(async (id: number) => {
    await db.transaction("rw", db.presets, async () => {
      await db.presets.toCollection().modify({ isDefault: false });
      await db.presets.update(id, { isDefault: true });
    });
  }, []);

  return {
    presets: list,
    defaultPreset,
    isLoaded,
    addPreset,
    updatePreset,
    deletePreset,
    setDefaultPreset,
  };
}
