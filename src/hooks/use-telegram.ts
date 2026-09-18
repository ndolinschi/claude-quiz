"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scopeProgressToTelegramUser } from "@/lib/progress-store";

export type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  initData?: string;
  platform?: string;
  initDataUnsafe?: { user?: { id?: number | string; first_name?: string } };
  themeParams?: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  MainButton?: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

export function isInsideTelegram(app: TelegramWebApp | null): boolean {
  if (!app) return false;
  if (app.initData && app.initData.length > 0) return true;
  const platform = (app.platform || "").toLowerCase();
  return platform !== "" && platform !== "unknown";
}

function applyTheme(app: TelegramWebApp) {
  const theme = app.themeParams || {};
  const root = document.documentElement;
  root.dataset.tg = "1";
  const set = (name: string, value?: string) => {
    if (value) root.style.setProperty(name, value);
  };
  set("--background", theme.bg_color);
  set("--foreground", theme.text_color);
  set("--card", theme.secondary_bg_color || theme.bg_color);
  set("--card-foreground", theme.text_color);
  set("--popover", theme.secondary_bg_color || theme.bg_color);
  set("--popover-foreground", theme.text_color);
  set("--primary", theme.button_color);
  set("--primary-foreground", theme.button_text_color || "#ffffff");
  set("--muted-foreground", theme.hint_color);
  set("--copper", theme.button_color);
  set("--ink", theme.text_color);
  set("--accent", theme.secondary_bg_color || theme.bg_color);
  set("--secondary", theme.secondary_bg_color || theme.bg_color);
  set("--secondary-foreground", theme.text_color);
  set("--ring", theme.button_color);
  if (theme.hint_color) set("--border", theme.hint_color);
}

export function useTelegram() {
  const [state, setState] = useState({
    booted: false,
    inTelegram: false,
    firstName: "",
  });

  useEffect(() => {
    let stopped = false;
    const boot = () => {
      const app = getTelegramWebApp();
      if (!app) return false;
      try {
        app.ready();
        app.expand();
      } catch {
        /* object present but not ready yet */
      }
      const inside = isInsideTelegram(app);
      const user = app.initDataUnsafe?.user;
      if (inside && user?.id != null) {
        try {
          scopeProgressToTelegramUser(user.id);
        } catch {
          /* keep the device-wide key */
        }
      }
      if (inside) {
        try {
          applyTheme(app);
        } catch {
          /* cream theme stays */
        }
      }
      if (!stopped) {
        setState({
          booted: true,
          inTelegram: inside,
          firstName: inside ? user?.first_name || "" : "",
        });
      }
      return true;
    };

    if (boot()) {
      return () => {
        stopped = true;
      };
    }

    const id = window.setInterval(() => {
      if (boot()) window.clearInterval(id);
    }, 100);
    const stop = window.setTimeout(() => {
      window.clearInterval(id);
      if (!stopped) setState((current) => ({ ...current, booted: true }));
    }, 2500);
    return () => {
      stopped = true;
      window.clearInterval(id);
      window.clearTimeout(stop);
    };
  }, []);

  const haptic = useCallback(
    (kind: "impact" | "success" | "warning" | "selection") => {
      try {
        const feedback = getTelegramWebApp()?.HapticFeedback;
        if (!feedback) return;
        if (kind === "impact") feedback.impactOccurred("medium");
        else if (kind === "success") feedback.notificationOccurred("success");
        else if (kind === "warning") feedback.notificationOccurred("warning");
        else feedback.selectionChanged();
      } catch {
        /* haptics are optional */
      }
    },
    []
  );

  return { ...state, haptic };
}

export function useTelegramMainButton(
  opts: { text: string; enabled?: boolean; onClick: () => void } | null,
  booted: boolean
) {
  const onClickRef = useRef(opts?.onClick);
  onClickRef.current = opts?.onClick;
  const text = opts?.text ?? "";
  const enabled = opts?.enabled ?? true;
  const active = Boolean(opts);

  useEffect(() => {
    if (!booted || !active) return;
    const button = getTelegramWebApp()?.MainButton;
    if (!button) return;
    const handler = () => onClickRef.current?.();
    try {
      button.setText(text);
      if (enabled) button.enable();
      else button.disable();
      button.onClick(handler);
      button.show();
    } catch {
      return;
    }
    return () => {
      try {
        button.offClick(handler);
        button.hide();
      } catch {
        /* screen left */
      }
    };
  }, [active, booted, enabled, text]);
}

export function useTelegramBackButton(
  onBack: (() => void) | null,
  booted: boolean
) {
  const ref = useRef(onBack);
  ref.current = onBack;
  const active = Boolean(onBack);

  useEffect(() => {
    if (!booted || !active) return;
    const button = getTelegramWebApp()?.BackButton;
    if (!button) return;
    const handler = () => ref.current?.();
    try {
      button.onClick(handler);
      button.show();
    } catch {
      return;
    }
    return () => {
      try {
        button.offClick(handler);
        button.hide();
      } catch {
        /* screen left */
      }
    };
  }, [active, booted]);
}
