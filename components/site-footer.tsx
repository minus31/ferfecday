import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/product";
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl space-y-3 border-t px-5 py-8 text-xs leading-6 text-muted-foreground">
      <p>
        사주 해설과 상징 이미지는 생성형 AI를 활용합니다. 전통 명리학을 바탕으로
        한 참고 콘텐츠이며, 자녀의 성격이나 미래를 보장하지 않습니다. 출산
        일정은 산모와 아기의 안전, 담당 의료진의 판단이 최우선입니다.
      </p>
      <nav className="flex flex-wrap gap-4" aria-label="서비스 정책">
        <Link href="/privacy">개인정보처리방침</Link>
        <Link href="/terms">이용약관</Link>
        <a href={`mailto:${SUPPORT_EMAIL}`}>이용, 비밀번호 문의</a>
      </nav>
      <p>
        운영자:{" "}
        {process.env.NEXT_PUBLIC_OPERATOR_NAME || "공개 출시 전 등록 예정"},
        개인정보 보호책임자:{" "}
        {process.env.NEXT_PUBLIC_PRIVACY_OFFICER || "공개 출시 전 등록 예정"},
        연락처: {SUPPORT_EMAIL}
      </p>
    </footer>
  );
}
