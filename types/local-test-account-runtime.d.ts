declare module "local-test-account-runtime" {
  import type { Session } from "@supabase/supabase-js";

  export function isLocalTestAccountEnabled(): boolean;
  export function getLocalTestAccountCredentials(): {
    email: string;
    password: string;
  } | null;
  export function getLocalTestAccountSession(): Session | null;
  export function hasLocalTestAccountSession(): boolean;
  export function authenticateLocalTestAccount(
    email: string,
    password: string,
  ): boolean;
  export function signOutLocalTestAccount(): void;
  export function onLocalTestAccountChange(callback: () => void): () => void;
  export function localTestAccountRequest<T>(
    action: string,
    body: Record<string, unknown>,
  ): Promise<T>;
}
