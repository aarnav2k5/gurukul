"use client";

import { useEffect, useRef } from "react";

const CHECK_INTERVAL_MS = 10000;

export function useTeacherSession({ client, user, teacher, onReplaced, onError }) {
  const sessionIdRef = useRef(null);

  useEffect(() => {
    if (!client || !user || !teacher) return undefined;

    let cancelled = false;
    let interval;
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;

    async function claimSession() {
      const result = await client.from("teacher_sessions").upsert(
        { user_id: user.id, session_id: sessionId, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
      if (result.error && !cancelled) onError?.(result.error);
      return !result.error;
    }

    async function checkSession() {
      const result = await client
        .from("teacher_sessions")
        .select("session_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (result.error) {
        onError?.(result.error);
        return;
      }
      if (result.data?.session_id && result.data.session_id !== sessionIdRef.current) {
        cancelled = true;
        await client.auth.signOut({ scope: "local" });
        onReplaced?.();
      }
    }

    claimSession().then((claimed) => {
      if (!claimed || cancelled) return;
      interval = window.setInterval(checkSession, CHECK_INTERVAL_MS);
    });

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, [client, user, teacher, onReplaced, onError]);
}
