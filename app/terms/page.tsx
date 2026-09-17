import { SiteHeader } from "@/components/site-header";
import { POLICY_VERSION, REPORT_PRICE, SUPPORT_EMAIL } from "@/lib/product";
export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell max-w-3xl space-y-7 py-10 text-sm leading-8">
        <h1 className="text-3xl font-semibold">서비스 이용약관</h1>
        <p>
          시행일: {POLICY_VERSION}. 생일선물은 성인 부모와 보호자가 전통 사주를
          참고해 출산 후보일을 비교하도록 돕는 정보 서비스입니다.
        </p>
        <section>
          <h2 className="text-xl font-semibold">서비스의 성격</h2>
          <p>
            사주 계산에 따른 후보, 해설, 상징 이미지를 제공합니다. 해설과
            그림에는 생성형 AI를 사용하며 오류가 있을 수 있습니다. 사주는
            과학적인 예측, 의료 판단, 특정 미래의 보장이 아닙니다. 출산 방식과
            시점은 산모와 아기의 안전, 의료진의 판단을 우선해 결정해야 합니다.
            그림은 실제 자녀의 얼굴, 성별에 따른 외모, 유전적 특징을 예측하지
            않는 창작물입니다.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">계정과 결과 저장</h2>
          <p>
            본인이 사용하는 이메일로 가입하고 비밀번호를 안전하게 관리해 주세요.
            같은 계정으로 이전 결과를 다시 조회할 수 있습니다. 타인 계정에
            접근하거나 인증을 우회하는 행위는 허용되지 않습니다. 비밀번호를
            분실하면 {SUPPORT_EMAIL}로 문의할 수 있습니다. 계정 탈퇴 시 저장
            결과는 삭제되며 복구할 수 없습니다.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">무료 열람과 유료 상품</h2>
          <p>
            사주표, 오행, 신살, 용신, 신강과 신약, 대운 해설과 사주 해석 첫 장은
            무료로 제공합니다. 유료 상품은 검색 1건에 포함된 최대 10개 후보의
            나머지 사주 해설 열람권이며 예정 판매가는{" "}
            {REPORT_PRICE.toLocaleString("ko-KR")}원입니다. 다른 검색에는 별도
            열람권이 필요합니다. 계정 유지와 서비스 제공 기간 동안 이전 결과에서
            다시 볼 수 있습니다.
          </p>
          <p>
            현재 결제 연결은 준비 중으로 실제 대금을 받지 않습니다. PG 연동 후
            판매자 정보, 결제 방식, 공급 시점, 청약철회와 환불 조건을 결제
            화면에 명확히 안내한 뒤 판매합니다. 디지털 콘텐츠 공급과 청약철회
            제한에 필요한 고지, 동의 절차는 관련 법령에 따라 마련하며 본
            약관만으로 법정 권리를 배제하지 않습니다.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">오류와 이용 문의</h2>
          <p>
            계산 오류, 저장 결과 접근 문제, 개인정보와 결제 관련 문의는{" "}
            <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            로 보내주세요. 서비스 장애나 변경 사항은 이용자에게 안내하고,
            운영자의 고의 또는 과실에 따른 법적 책임을 부당하게 제한하지
            않습니다.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">운영 정보</h2>
          <p>
            운영자:{" "}
            {process.env.NEXT_PUBLIC_OPERATOR_NAME || "공개 출시 전 등록 예정"}
            <br />
            사업자등록번호:{" "}
            {process.env.NEXT_PUBLIC_BUSINESS_NUMBER ||
              "유료 판매 전 등록 예정"}
            <br />
            사업장 주소:{" "}
            {process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ||
              "유료 판매 전 등록 예정"}
            <br />
            통신판매업 신고:{" "}
            {process.env.NEXT_PUBLIC_COMMERCE_NUMBER ||
              "유료 판매 전 해당 의무 확인 및 등록 예정"}
          </p>
        </section>
      </main>
    </>
  );
}
