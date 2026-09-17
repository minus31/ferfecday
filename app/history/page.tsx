"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "@/components/account-provider";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getBrowserAuth, serviceRequest } from "@/lib/supabase-browser";
import { SUPPORT_EMAIL, type SearchInput } from "@/lib/product";
type HistoryRow = {
  id: string;
  createdAt: string;
  input: SearchInput;
  location: string;
  count: number;
  unlocked: boolean;
};
export default function HistoryPage() {
  const { session, ready, error: authError } = useAccount(),
    router = useRouter();
  const [rows, setRows] = React.useState<HistoryRow[] | null>(null),
    [error, setError] = React.useState("");
  const [cursor, setCursor] = React.useState<string | null>(null),
    [more, setMore] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false),
    [confirmation, setConfirmation] = React.useState("");
  React.useEffect(() => {
    if (!ready) return;
    if (!session) {
      setRows(null);
      if (!authError) router.replace("/account");
      return;
    }
    const controller = new AbortController();
    serviceRequest<{ searches: HistoryRow[]; nextCursor: string | null }>(
      "search-list",
      {},
      controller.signal,
    )
      .then((data) => {
        setRows(data.searches);
        setCursor(data.nextCursor);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [session?.user.id, ready, authError, router]);
  async function loadMore() {
    setMore(true);
    try {
      const data = await serviceRequest<{
        searches: HistoryRow[];
        nextCursor: string | null;
      }>("search-list", { before: cursor });
      setRows((rows) => [...(rows || []), ...data.searches]);
      setCursor(data.nextCursor);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setMore(false);
    }
  }
  async function removeAccount() {
    setDeleting(true);
    setError("");
    try {
      await serviceRequest("account-delete", { confirm: "DELETE" });
      await getBrowserAuth().auth.signOut({ scope: "local" });
      router.replace("/");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setDeleting(false);
    }
  }
  return (
    <>
      <SiteHeader />
      <main className="page-shell flex-1 space-y-6 py-10">
        <section className="surface-card space-y-4 p-6">
          <h1 className="text-3xl font-semibold">우리 가족의 이전 결과</h1>
          <p className="break-all text-sm text-muted-foreground">
            {session?.user.email}
          </p>
          <p className="text-sm leading-7 text-muted-foreground">
            같은 검색에서 열린 보고서는 모든 후보에 적용됩니다. 저장한 날짜를
            다시 누르면 이어서 볼 수 있어요.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/">새 길일 찾기</Link>
            </Button>
            {session && (
              <Button
                variant="outline"
                onClick={async () => {
                  const { error } = await getBrowserAuth().auth.signOut();
                  if (error)
                    setError(
                      "로그아웃을 완료하지 못했습니다. 다시 시도해 주세요.",
                    );
                  else router.replace("/account");
                }}
              >
                로그아웃
              </Button>
            )}
          </div>
          {(error || authError) && (
            <p role="alert" className="text-sm text-destructive">
              {error || authError}
            </p>
          )}
        </section>
        {!rows && !error && !authError && (
          <p role="status">저장한 결과를 불러오고 있어요…</p>
        )}
        {rows?.length === 0 && (
          <p className="soft-panel">
            아직 저장된 검색이 없습니다. 출산 예정 기간부터 선택해 주세요.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {rows?.map((row) => (
            <Link
              key={row.id}
              href={`/results?search=${row.id}`}
              className="surface-card space-y-3 p-6 transition-colors hover:border-primary"
            >
              <p className="text-xs text-muted-foreground">
                {new Date(row.createdAt).toLocaleDateString("ko-KR")}에 저장
              </p>
              <h2 className="text-lg font-semibold">
                {row.input.from} ~ {row.input.to}
              </h2>
              <p className="text-sm">
                {row.input.gender === "M" ? "남아" : "여아"}, {row.location},
                후보 {row.count}개
              </p>
              <p className="text-sm font-medium text-primary">
                {row.unlocked ? "전체 해설 열람 가능" : "무료 미리보기"} →
              </p>
            </Link>
          ))}
        </div>
        {cursor && (
          <Button variant="outline" disabled={more} onClick={loadMore}>
            {more ? "불러오는 중…" : "이전 기록 더 보기"}
          </Button>
        )}
        {session && (
          <details className="rounded-xl border p-5 text-sm">
            <summary className="cursor-pointer">계정 관리와 지원</summary>
            <p className="my-4 leading-7">
              비밀번호, 계정 문의:{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
                {SUPPORT_EMAIL}
              </a>
              . 탈퇴하면 계정과 검색, 보고서가 삭제되고 복구할 수 없습니다.
            </p>
            <label className="block">
              탈퇴하려면 ‘탈퇴’를 입력해 주세요.
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="mx-3 rounded-lg border p-2"
                aria-label="탈퇴 확인"
              />
            </label>
            <Button
              variant="destructive"
              className="mt-3"
              disabled={confirmation !== "탈퇴" || deleting}
              onClick={removeAccount}
            >
              {deleting ? "처리 중…" : "계정과 기록 삭제"}
            </Button>
          </details>
        )}
      </main>
    </>
  );
}
