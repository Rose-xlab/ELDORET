// types/turnstile.d.ts
interface TurnstileOptions {
    sitekey: string;
    callback?: (token: string) => void;
    "error-callback"?: () => void;
    "expired-callback"?: () => void;
    "timeout-callback"?: () => void;
    theme?: "light" | "dark" | "auto";
    tabindex?: number;
    "response-field"?: boolean;
    "response-field-name"?: string;
    size?: "normal" | "compact";
    retry?: "auto" | "never";
    "retry-interval"?: number;
    "refresh-expired"?: "auto" | "manual" | "never";
    appearance?: "always" | "execute" | "interaction-only";
    execution?: "render" | "execute";
    cData?: string;
    language?: string;
  }
  
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileSuccess?: (token: string) => void;
  }