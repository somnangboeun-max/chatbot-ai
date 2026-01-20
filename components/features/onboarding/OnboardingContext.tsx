"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface DayHours {
  open?: string;
  close?: string;
  closed?: boolean;
}

export interface ProductData {
  id?: string;
  name: string;
  price: number;
  currency: "USD" | "KHR";
}

export interface OnboardingData {
  name: string;
  opening_hours: Record<string, DayHours>;
  address: string;
  city?: string;
  landmarks?: string;
  phone: string;
  products?: ProductData[];
}

interface OnboardingContextType {
  data: Partial<OnboardingData>;
  updateData: <K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K]
  ) => void;
  updatePartialData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
  initialData?: Partial<OnboardingData>;
}

/**
 * OnboardingProvider
 *
 * Context provider for managing form state across onboarding steps.
 * Persists data in state and syncs with server on step completion.
 */
export function OnboardingProvider({
  children,
  initialData,
}: OnboardingProviderProps) {
  const [data, setData] = useState<Partial<OnboardingData>>(initialData ?? {});

  const updateData = <K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updatePartialData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetData = () => {
    setData({});
  };

  return (
    <OnboardingContext.Provider
      value={{ data, updateData, updatePartialData, resetData }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * useOnboarding Hook
 *
 * Access the onboarding context for form data management.
 * Must be used within OnboardingProvider.
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
