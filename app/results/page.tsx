"use client";
import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/components/account-provider";
import { LuckyDayCard } from "@/components/lucky-day-card";
import { LuckyDayDetailDialog } from "@/components/lucky-day-detail-dialog";
import { serviceRequest } from "@/lib/supabase-browser";
import type { LuckyDay } from "@/lib/lucky-day-types";
import type { SearchView } from "@/lib/product";
function ResultsContent() {
  const params = useSearchParams(),
    searchId = params.get("search");
  const { session, ready, error: authError } = useAccount();
  const [search, setSearch] = React.useState<SearchView | null>(null);
  const [selected, setSelected] = React.useState<LuckyDay | null>(null);
  const [error, setError] = React.useState("");
  const detailHistory = React.useRef(false);
  React.useEffect(() => {
    const close = () => {
      detailHistory.current = false;
      setSelected(null);
    };
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);
  React.useEffect(() => {
    setSearch(null);
    setSelected(null);
    setError("");
    if (!ready) return;
    if (!searchId) {
      setError("저장된 검색 번호가 없습니다. 홈에서 새로 검색해 주세요.");
      return;
    }
    if (!session) {
      setError(authError || "로그인 후 이전 결과 조회에서 다시 열어 주세요.");
      return;
    }
    const controller = new AbortController();
    serviceRequest<SearchView>("search-get", { searchId }, controller.signal)
      .then(setSearch)
      .catch((error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [searchId, session?.user.id, ready, authError]);
  function select(day: LuckyDay) {
    if (!detailHistory.current) {
      window.history.pushState(
        { ...window.history.state, birthdayGiftDetail: day.id },
        "",
      );
      detailHistory.current = true;
    }
    setSelected(day);
  }
  function close(open: boolean) {
    if (open) return;
    setSelected(null);
    if (detailHistory.current) {
      detailHistory.current = false;
      window.history.back();
    }
  }
  return (
    <>
      <main className="page-shell flex-1 space-y-6 py-8">
        <section className="surface-card space-y-4 p-6">
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="ghost">
              <Link href="/">← 다시 선택하기</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/history">이전 결과 조회</Link>
            </Button>
          </div>
          <p className="eyebrow">우리 아이의 시작을 그려보는 시간</p>
          <h1 className="text-3xl font-semibold">가장 좋은 날을 골랐어요</h1>
          {search && (
            <>
              <p className="text-sm leading-7">
                {search.input.from} ~ {search.input.to},{" "}
                {search.input.gender === "M" ? "남아" : "여아"},{" "}
                {search.result.location.label}
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                {search.result.candidates}개 후보 중 상위{" "}
                {search.result.results.length}개를 소개합니다. 같은 일주가 다섯
                번 이어지면 다른 일주의 가장 좋은 후보를 먼저 보여드려 비교의
                폭을 넓혔어요.
              </p>
              <p className="text-xs text-primary">
                {search.unlocked
                  ? "이 검색의 전체 해설을 열람할 수 있습니다."
                  : "사주 해석 첫 장과 사주표, 대운 해설을 무료로 볼 수 있습니다."}
              </p>
            </>
          )}
          <p className="text-xs leading-6 text-muted-foreground">
            해설과 그림은 생성형 AI를 활용합니다. 전통 사주 해석은 가능성을
            살펴보는 참고 정보이며, 실제 출산 일정은 담당 의료진과 결정해
            주세요.
          </p>
        </section>
        {error ? (
          <section role="alert" className="surface-card space-y-4 p-6">
            <p>{error}</p>
            <Button asChild>
              <Link href="/account">로그인하기</Link>
            </Button>
          </section>
        ) : !search ? (
          <p role="status" className="soft-panel">
            저장된 결과를 불러오고 있어요…
          </p>
        ) : (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold">
              Best {search.result.results.length}
            </h2>
            {search.result.results.map((day) => (
              <LuckyDayCard
                key={day.id}
                searchId={search.id}
                day={day}
                featured={day.rank === 1}
                onClick={() => select(day)}
              />
            ))}
          </section>
        )}
      </main>
      {search && selected && (
        <LuckyDayDetailDialog
          key={`${search.id}:${selected.id}`}
          searchId={search.id}
          day={selected}
          open={!!selected}
          onOpenChange={close}
        />
      )}
    </>
  );
}
export default function ResultsPage() {
  return (
    <>
      <SiteHeader />
      <React.Suspense fallback={<p className="p-10">결과 확인 중…</p>}>
        <ResultsContent />
      </React.Suspense>
    </>
  );
}
