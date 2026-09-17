import { SiteHeader } from "@/components/site-header";
import { POLICY_VERSION, SUPPORT_EMAIL } from "@/lib/product";
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell max-w-3xl space-y-8 py-10 text-sm leading-8">
        <h1 className="text-3xl font-semibold">개인정보처리방침</h1>
        <p>
          시행일: {POLICY_VERSION}. 생일선물은 계정과 검색 결과를 관리하기 위해
          다음 정보를 처리합니다. 운영자와 저장 지역이 미확정된 현재 문서는 출시
          준비안이며, 실제 공개 서비스 시작 전 아래 설정 항목을 확정해 다시
          안내합니다.
        </p>
        <section>
          <h2 className="text-xl font-semibold">
            1. 수집 항목, 목적과 보유기간
          </h2>
          <p>
            필수 항목은 이메일, 인증용 비밀번호, 계정 식별자, 출산 후보 기간,
            선택한 성별과 출산 지역, 검색 결과, 보고서, 약관 동의 버전과
            시점입니다. 이메일은 로그인과 고객지원에, 검색 조건과 결과는 계산과
            재조회에, 동의 기록은 동의 확인에 사용합니다. 비밀번호는 인증
            제공자가 해시 처리하며 운영자가 평문으로 저장하거나 조회하지
            않습니다.
          </p>
          <p>
            회원 정보와 검색 기록은 탈퇴 또는 처리 목적 달성 시 삭제합니다.
            고객지원 메일은 문의 해결 후 1년 이내 삭제하며 법령상 보존 의무가
            있는 경우 해당 항목만 분리 보관합니다. 실제 결제가 개시되면 계약,
            청약철회, 대금결제, 공급 기록은 5년, 소비자 불만과 분쟁처리 기록은
            3년 등 관련 법정 보관 항목을 별도로 관리합니다. 현재 PG 결제는
            제공하지 않습니다.
          </p>
          <p>
            인증과 보안을 위한 IP 주소, 접속 기록, 서비스 이용 로그는 인프라
            제공자의 보안 기능에서 처리될 수 있습니다. 운영자는 비밀번호, 인증
            토큰과 보고서 전체 본문을 애플리케이션 로그에 기록하지 않습니다.
            로그와 백업의 실제 보존기간은 출시 전 제공자 설정에 맞춰 확정합니다.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">2. 개인정보 처리 위탁</h2>
          <p>
            Supabase는 계정 인증과 데이터 저장, Vercel은 서비스와 API 운영,
            OpenAI는 사주 해설과 상징 이미지 생성을 담당합니다. AI에는 이메일,
            비밀번호, 계정 식별자를 보내지 않고 계산된 사주 구성과 생애 시기
            정보만 전달합니다. 이미지에는 일주의 상징과 기질만 전달하며 실제
            아이의 사진을 수집하지 않습니다. Vercel AI Gateway를 사용하는
            배포에서는 해당 게이트웨이를 경유합니다.
          </p>
        </section>
        <section id="overseas">
          <h2 className="text-xl font-semibold">
            3. 개인정보 국외이전 안내와 동의
          </h2>
          <p>
            해외 사업자의 인프라를 사용하는 경우 개인정보 보호법에 따른 국외이전
            요건을 갖춘 뒤 제공합니다. 현재 선택한 동의 방식에서는 가입과 검색
            전에 아래 내용을 안내하고 별도 동의를 받습니다. 동의를 거부하거나
            철회할 수 있으나 계정과 저장형 보고서 제공은 제한될 수 있습니다.
            철회는 계정 탈퇴 또는 고객지원 메일로 요청할 수 있습니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-xs leading-6">
              <caption className="mb-3 text-left">
                전용 프로젝트 생성 후 저장 국가와 계약 조건을 확정해야 하는 출시
                준비 정보
              </caption>
              <thead>
                <tr>
                  {[
                    "받는 자와 연락처",
                    "국가",
                    "항목, 목적",
                    "시점, 방법, 보유기간",
                  ].map((item) => (
                    <th className="border p-3" key={item}>
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">
                    Supabase Inc.
                    <br />
                    <a
                      className="underline"
                      href="https://supabase.com/privacy"
                    >
                      개인정보 문의 채널
                    </a>
                  </td>
                  <td className="border p-3">
                    {process.env.NEXT_PUBLIC_SUPABASE_COUNTRY ||
                      "전용 프로젝트 지역 확정 전"}
                    , 운영 지원 처리 국가는 계약 확인 후 확정
                  </td>
                  <td className="border p-3">
                    이메일, 인증 정보, 계정 식별자, 검색 조건과 결과, 동의 기록.
                    인증과 저장 목적
                  </td>
                  <td className="border p-3">
                    가입, 로그인, 검색과 조회 시 암호화 통신. 탈퇴 또는 목적
                    달성 시까지, 백업은 계약상 삭제 주기에 따라 소멸
                  </td>
                </tr>
                <tr>
                  <td className="border p-3">
                    Vercel Inc.
                    <br />
                    <a
                      className="underline"
                      href="https://vercel.com/legal/privacy-policy"
                    >
                      개인정보 문의 채널
                    </a>
                  </td>
                  <td className="border p-3">
                    미국 및 배포, 하위처리자 지역, 출시 전 확정
                  </td>
                  <td className="border p-3">
                    요청 처리에 필요한 계정 식별자, 검색 정보, 접속 정보. 서비스
                    운영과 보안 목적
                  </td>
                  <td className="border p-3">
                    접속, API 요청 시 암호화 통신. 요청 처리 동안, 보안 로그는
                    실제 요금제의 설정 기간 확인 후 확정
                  </td>
                </tr>
                <tr>
                  <td className="border p-3">
                    OpenAI, L.L.C.
                    <br />
                    <a
                      className="underline"
                      href="https://openai.com/policies/privacy-policy/"
                    >
                      개인정보 문의 채널
                    </a>
                  </td>
                  <td className="border p-3">
                    미국 등 계약상 처리 지역, 별도 데이터 지역 설정 미적용
                  </td>
                  <td className="border p-3">
                    계산된 사주와 시기 정보. 해설 생성 목적. 계정 정보 제외
                  </td>
                  <td className="border p-3">
                    해설 요청 시 암호화 API 통신. 응답 저장 옵션은 비활성화하며,
                    악용 방지 로그는 기본 정책상 최대 30일 보관될 수 있음
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold">4. 정보주체의 권리와 삭제</h2>
          <p>
            이전 결과 조회 화면에서 자신의 기록을 열람하고 계정을 삭제할 수
            있습니다. 정정, 처리정지, 자료 제공, 동의 철회는 {SUPPORT_EMAIL}로
            요청해 주세요. 본인 확인 후 처리하며 확인을 위해 비밀번호를 요구하지
            않습니다. 전자정보는 재생할 수 없는 방식으로 삭제하고 제공자의
            백업은 정해진 보존 주기에 따라 삭제됩니다. 이 서비스는 성인 부모와
            보호자를 대상으로 하며 아동의 이름과 실제 사진을 수집하지 않습니다.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">5. 안전조치와 접근권한</h2>
          <p>
            암호화 통신, 사용자별 접근 제어, 서버 측 소유권 검증, 세션 만료와
            갱신, 관리자 권한 분리로 정보를 보호합니다. 로그인 유지용 토큰은
            기기의 브라우저 저장소에 보관되며 로그아웃 시 제거됩니다. 공용
            기기에서는 이용 후 로그아웃해 주세요. 카메라, 연락처, 사진, 기기
            위치 권한은 요청하지 않습니다. 출산 지역은 사용자가 직접 선택합니다.
            광고, 마케팅용 개인정보 수집은 하지 않습니다.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">
            6. 개인정보 보호책임자와 고충처리
          </h2>
          <p>
            운영자:{" "}
            {process.env.NEXT_PUBLIC_OPERATOR_NAME || "공개 출시 전 등록 예정"}
            <br />
            개인정보 보호책임자:{" "}
            {process.env.NEXT_PUBLIC_PRIVACY_OFFICER ||
              "공개 출시 전 실제 담당자 또는 부서 등록 예정"}
            <br />
            연락처:{" "}
            <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p>
            개인정보 침해 상담은 개인정보침해신고센터(국번 없이 118), 분쟁조정은
            개인정보분쟁조정위원회(1833-6972)를 이용할 수 있습니다. 방침이
            변경되면 서비스 내에서 변경 내용과 시행일을 안내합니다.
          </p>
        </section>
      </main>
    </>
  );
}
