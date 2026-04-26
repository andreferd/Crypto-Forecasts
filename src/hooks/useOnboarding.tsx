import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  getOnboardingChoice,
  saveOnboardingChoice,
  OnboardingChoice,
} from '../services/storageService';

interface OnboardingContextValue {
  loaded: boolean;
  choice: OnboardingChoice | null;
  complete: (choice: OnboardingChoice) => Promise<void>;
}

const Ctx = createContext<OnboardingContextValue>({
  loaded: false,
  choice: null,
  complete: async () => {},
});

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<OnboardingChoice | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getOnboardingChoice().then((c) => {
      setChoice(c);
      setLoaded(true);
    });
  }, []);

  const complete = useCallback(async (c: OnboardingChoice) => {
    await saveOnboardingChoice(c);
    setChoice(c);
  }, []);

  return <Ctx.Provider value={{ loaded, choice, complete }}>{children}</Ctx.Provider>;
}

export function useOnboarding() {
  return useContext(Ctx);
}
