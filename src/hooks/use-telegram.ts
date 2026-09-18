"use client";

import { useCallback, useEffect, useState } from "react";
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
  setHeaderColor?: (color: string, headerTextColor?: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  MainButton?: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    color?: string;
    textColor?: string;
    setParams?: (params: { color?: string; text_color?: string }) => void;
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

const PAPER = "#F4F0E6";
const INK = "#2A2118";
const COPPER = "#C15F3C";
const BUTTON_TEXT = "#F7F3EA";

function paintChrome(
  fn: ((color: string, headerTextColor?: string) => void) | undefined,
  color: string,
  headerTextColor?: string
) {
  if (typeof fn !== "function") return;
  try {
    if (headerTextColor !== undefined && fn.length >= 2) fn(color, headerTextColor);
    else fn(color);
  } catch {
    /* this client rejects the chrome color */
  }
}

function paintMainButton(button: TelegramWebApp["MainButton"]) {
  if (!button) return;
  try {
    if (typeof button.setParams === "function") {
      button.setParams({ color: COPPER, text_color: BUTTON_TEXT });
    } else {
      button.color = COPPER;
      button.textColor = BUTTON_TEXT;
    }
  } catch {
    /* button colors stay as the client set them */
  }
}

function applyTheme(app: TelegramWebApp) {
  const root = document.documentElement;
  root.dataset.tg = "1";
  // Keep the cream paper palette. Do not copy themeParams onto CSS variables, and never add "dark".
  paintChrome(app.setHeaderColor, PAPER, INK);
  paintChrome(app.setBackgroundColor, PAPER);
  paintChrome(app.setBottomBarColor, PAPER);
  paintMainButton(app.MainButton);
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
        app.MainButton?.hide();
      } catch {
        /* native main button is optional */
      }
      try {
        app.BackButton?.hide();
      } catch {
        /* native back button is optional */
      }
      try {
        app.ready();
        app.expand();
      } catch {
        /* object present but not ready yet */
      }
      const user = app.initDataUnsafe?.user;
      const inside = isInsideTelegram(app) || user?.id != null;
      if (user?.id != null) {
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
          firstName: user?.first_name || "",
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
