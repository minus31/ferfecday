"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/components/account-provider";
import {
  getBrowserAuth,
  getServiceEndpoint,
  serviceRequest,
} from "@/lib/supabase-browser";
import {
  POLICY_VERSION,
  SUPPORT_EMAIL,
  type SearchInput,
  type SearchView,
} from "@/lib/product";

function AccountForm() {
  const params = useSearchParams(),
    router = useRouter();
  const { session, ready, error: connectionError } = useAccount();
  const [signup, setSignup] = React.useState(params.get("mode") === "signup");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [transfer, setTransfer] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const pending = React.useMemo<SearchInput | null>(
    () =>
      params.get("from") && params.get("to")
        ? {
            from: params.get("from")!,
            to: params.get("to")!,
            gender: params.get("gender") === "F" ? "F" : "M",
            location: params.get("location") || "",
          }
        : null,
    [params],
  );
  React.useEffect(() => {
    if (pending)
      sessionStorage.setItem(
        "birthdaygift-pending-search",
        JSON.stringify(pending),
      );
  }, [pending]);
  async function proceed() {
    const input =
      pending ||
      (() => {
        try {
          return JSON.parse(
            sessionStorage.getItem("birthdaygift-pending-search") || "null",
          ) as SearchInput | null;
        } catch {
          return null;
        }
      })();
    if (input) {
      if (!consent || !transfer)
        throw new Error(
          "검색 기록 저장에 필요한 약관과 국외이전 동의를 확인해 주세요.",
        );
      const search = await serviceRequest<SearchView>("search-create", {
        input,
        policyVersion: POLICY_VERSION,
      });
      sessionStorage.removeItem("birthdaygift-pending-search");
      router.replace(`/results?search=${search.id}`);
    } else router.replace("/history");
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (session) {
        await proceed();
        return;
      }
      const client = getBrowserAuth();
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail === "brith@day.com" && password === "1234") {
        const response = await fetch(getServiceEndpoint(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "demo-login",
            email: normalizedEmail,
            password,
          }),
        });
        const tokens = await response.json();
        if (!response.ok)
          throw new Error(
            tokens.error || "테스트 계정에 로그인할 수 없습니다.",
          );
        const { error } = await client.auth.setSession(tokens);
        if (error) throw error;
      } else if (signup) {
        if (!consent || !transfer)
          throw new Error("필수 동의 항목을 확인해 주세요.");
        if (password.length < 8)
          throw new Error("비밀번호는 8자 이상 입력해 주세요.");
        const { data, error } = await client.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/account?verified=1`,
          },
        });
        if (error)
          throw new Error(
            "가입을 완료하지 못했습니다. 이메일과 비밀번호를 확인하거나 로그인해 주세요.",
          );
        if (!data.session) {
          setMessage(
            "이메일로 보낸 확인 링크를 열어 주세요. 이미 가입한 이메일이라면 로그인해 주세요. 확인 후 이 화면에서 검색을 이어갈 수 있습니다.",
          );
          setPassword("");
          return;
        }
      } else {
        const { error } = await client.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error)
          throw new Error(
            "이메일 또는 비밀번호를 확인해 주세요. 가입 시 보낸 이메일 인증도 완료해 주세요.",
          );
      }
      setPassword("");
      if (signup) await serviceRequest("consent", { version: POLICY_VERSION });
      await proceed();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const needsConsent =
    signup ||
    !!pending ||
    (typeof window !== "undefined" &&
      !!sessionStorage.getItem("birthdaygift-pending-search"));
  return (
    <main className="page-shell max-w-xl flex-1 py-10">
      <section className="surface-card space-y-6 p-6 sm:p-8">
        <div>
          <p className="eyebrow">다시 만날 수 있는 우리 아이의 기록</p>
          <h1 className="mt-3 text-2xl font-semibold">
            {session
              ? "검색을 이어갈까요?"
              : signup
                ? "결과를 저장할 계정 만들기"
                : "이전 결과 조회"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {pending
              ? `${pending.from} ~ ${pending.to}의 검색 조건을 준비했어요. `
              : ""}
            이메일과 비밀번호로 저장된 결과를 다시 볼 수 있습니다.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          {session ? (
            <p className="break-all text-sm">
              {session.user.email} 계정으로 로그인되어 있습니다.
            </p>
          ) : (
            <>
              <label className="block text-sm font-medium">
                이메일
                <input
                  className="mt-2 w-full rounded-xl border bg-background p-3"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={254}
                />
              </label>
              <div>
                <label className="block text-sm font-medium" htmlFor="password">
                  비밀번호
                </label>
                <input
                  id="password"
                  aria-describedby="password-help"
                  className="mt-2 w-full rounded-xl border bg-background p-3"
                  type="password"
                  autoComplete={signup ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={128}
                />
                <p
                  id="password-help"
                  className="mt-2 text-xs text-muted-foreground"
                >
                  {signup
                    ? "8자 이상, 다른 서비스와 다른 비밀번호를 사용해 주세요."
                    : "가입할 때 설정한 비밀번호를 입력해 주세요."}
                </p>
              </div>
            </>
          )}
          {needsConsent && (
            <fieldset className="space-y-3 text-sm leading-6">
              <legend className="mb-3 font-medium">필수 안내와 동의</legend>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1.5"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  [필수]{" "}
                  <Link href="/terms" target="_blank" className="underline">
                    이용약관
                  </Link>
                  과{" "}
                  <Link href="/privacy" target="_blank" className="underline">
                    개인정보 수집, 이용
                  </Link>
                  에 동의합니다. 이메일, 검색 조건, 결과를 계정 관리와 결과
                  재조회에 사용하며 탈퇴 시 삭제합니다. 동의를 거부할 수 있으나
                  계정과 검색 저장은 이용할 수 없습니다.
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1.5"
                  checked={transfer}
                  onChange={(e) => setTransfer(e.target.checked)}
                />
                <span>
                  [필수]{" "}
                  <Link
                    href="/privacy#overseas"
                    target="_blank"
                    className="underline"
                  >
                    국외이전의 수신자, 국가, 항목, 목적, 시점과 보유기간
                  </Link>
                  을 확인하고 동의합니다. 거부 시 해외 인프라를 이용하는 계정,
                  보고서 서비스를 제공하기 어렵습니다.
                </span>
              </label>
            </fieldset>
          )}
          <p className="text-xs leading-6 text-muted-foreground">
            해설과 상징 이미지는 생성형 AI를 활용합니다. 사주는 참고 정보이며
            출산 일정은 의료진의 판단이 우선합니다.
          </p>
          {(message || connectionError) && (
            <p
              role="status"
              className="rounded-xl bg-secondary p-3 text-sm leading-6"
            >
              {message || connectionError}
            </p>
          )}
          <Button
            className="w-full"
            size="lg"
            disabled={
              !ready || busy || (!!needsConsent && (!consent || !transfer))
            }
          >
            {busy
              ? "처리 중…"
              : session
                ? "계속하기"
                : signup
                  ? "가입하고 계속하기"
                  : "로그인"}
          </Button>
        </form>
        {!session && (
          <button
            className="text-sm text-primary underline"
            onClick={() => {
              setSignup(!signup);
              setMessage("");
            }}
          >
            {signup ? "이미 계정이 있어요, 로그인" : "처음이에요, 계정 만들기"}
          </button>
        )}
        {session && (
          <button
            className="text-sm underline"
            onClick={async () => {
              await getBrowserAuth().auth.signOut();
              setMessage("");
            }}
          >
            다른 계정으로 로그인
          </button>
        )}
        <p className="text-xs leading-6 text-muted-foreground">
          비밀번호를 잊으셨나요?{" "}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          로 가입 이메일과 함께 문의해 주세요. 비밀번호 자체는 보내지 마세요.
        </p>
      </section>
    </main>
  );
}
export default function AccountPage() {
  return (
    <>
      <SiteHeader />
      <React.Suspense fallback={<p className="p-10">계정 확인 중…</p>}>
        <AccountForm />
      </React.Suspense>
    </>
  );
}
