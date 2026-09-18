"use client";
import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserAuth } from "@/lib/supabase-browser";
import {
  getLocalTestAccountSession,
  isLocalTestAccountEnabled,
  onLocalTestAccountChange,
} from "local-test-account-runtime";

const AccountContext = React.createContext<{
  session: Session | null;
  ready: boolean;
  error: string | null;
}>({ session: null, ready: false, error: null });
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState({
    session: null as Session | null,
    ready: false,
    error: null as string | null,
  });
  React.useEffect(() => {
    if (isLocalTestAccountEnabled()) {
      const update = () =>
        setState({
          session: getLocalTestAccountSession(),
          ready: true,
          error: null,
        });
      update();
      return onLocalTestAccountChange(update);
    }
    let mounted = true;
    let changed = false;
    try {
      const client = getBrowserAuth();
      const { data: listener } = client.auth.onAuthStateChange(
        (_event, session) => {
          changed = true;
          if (mounted) setState({ session, ready: true, error: null });
        },
      );
      client.auth.getSession().then(({ data, error }) => {
        if (mounted && !changed)
          setState({
            session: data.session,
            ready: true,
            error: error ? "로그인을 다시 확인해 주세요." : null,
          });
      });
      return () => {
        mounted = false;
        listener.subscription.unsubscribe();
      };
    } catch (error) {
      setState({ session: null, ready: true, error: (error as Error).message });
    }
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <AccountContext.Provider value={state}>{children}</AccountContext.Provider>
  );
}
export function useAccount() {
  return React.useContext(AccountContext);
}
