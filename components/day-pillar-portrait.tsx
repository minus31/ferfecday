"use client";
import * as React from "react";
import { Sparkles } from "lucide-react";
import { serviceRequest } from "@/lib/supabase-browser";
import type { ImageResult } from "@/lib/product";
const requests = new Map<string, Promise<ImageResult>>();
async function getPortrait(
  searchId: string,
  candidateId: string,
  pillar: string,
) {
  if (!requests.has(pillar)) {
    const promise = (async () => {
      for (let attempt = 0; attempt < 60; attempt++) {
        const image = await serviceRequest<ImageResult>("image", {
          searchId,
          candidateId,
        });
        if (image.status !== "pending") return image;
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
      return { status: "unavailable", url: null } as ImageResult;
    })();
    requests.set(pillar, promise);
    promise
      .then((result) => {
        if (result.status !== "ready") requests.delete(pillar);
      })
      .catch(() => requests.delete(pillar));
  }
  return requests.get(pillar)!;
}
export function DayPillarPortrait({
  searchId,
  candidateId,
  pillar,
  label,
}: {
  searchId: string;
  candidateId: string;
  pillar: string;
  label: string;
}) {
  const element = React.useRef<HTMLDivElement>(null);
  const [result, setResult] = React.useState<ImageResult | null>(null);
  const [retry, setRetry] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        getPortrait(searchId, candidateId, pillar)
          .then((image) => {
            if (active) setResult(image);
          })
          .catch(() => {
            if (active) setResult({ status: "unavailable", url: null });
          });
      },
      { rootMargin: "100px" },
    );
    if (element.current) observer.observe(element.current);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [searchId, candidateId, pillar, retry]);
  return (
    <div ref={element} className="w-full shrink-0 sm:w-44">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-primary/10">
        {result?.url ? (
          <img
            src={result.url}
            alt={`${label}의 기질을 상징하는 AI 생성 캐릭터, 실제 외모 예측이 아닙니다`}
            width={1024}
            height={1024}
            className="size-full object-cover"
            loading="lazy"
            onError={() => setResult({ status: "unavailable", url: null })}
          />
        ) : (
          <div className="space-y-3 p-4 text-center text-xs leading-6 text-muted-foreground">
            <Sparkles className="mx-auto size-8 text-primary/60" />
            <p>
              {result
                ? "지금은 상징 이미지를 불러올 수 없어요"
                : "아이의 기질을 담은 그림을 준비하고 있어요…"}
            </p>
            {result?.status === "unavailable" && (
              <button
                className="text-primary underline"
                onClick={() => {
                  requests.delete(pillar);
                  setResult(null);
                  setRetry((value) => value + 1);
                }}
              >
                이미지 다시 불러오기
              </button>
            )}
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-[10px] leading-5 text-muted-foreground">
        AI 생성 상징 이미지, 실제 외모와 무관
      </p>
    </div>
  );
}
