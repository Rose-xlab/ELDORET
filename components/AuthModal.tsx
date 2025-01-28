"use client";

interface AuthModalProps {
  trigger: React.ReactElement;
  mode: "rating" | "comment" | "evidence";
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function AuthModal({ trigger, mode = "rating", onSuccess }: AuthModalProps) {
  // Return null to effectively disable the modal
  return null;
}