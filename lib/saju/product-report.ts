import type { LuckyDay } from "../lucky-day-types";
import { REPORT_VERSION, SECTION_TOPICS, type ReportBundle } from "../product";
import { getDayPillarProfile } from "./day-pillar-profiles";
import { buildDaewoonInterpretations } from "./daewoon-knowledge";
import { getDaewoonPeriod } from "./daewoon-ai";
import { sajuLabel } from "./stars";

type Role = keyof LuckyDay["strength"]["roleQi"];
const ELEMENT = {
  tree: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};
const SIPSIN_ROLE: Record<string, Role> = {
  比肩: "bigeop",
  劫財: "bigeop",
  食神: "siksang",
  傷官: "siksang",
  偏財: "jaeseong",
  正財: "jaeseong",
  偏官: "gwanseong",
  正官: "gwanseong",
  偏印: "insung",
  正印: "insung",
};
const SEASON: Record<string, string> = {
  寅: "봄의 시작",
  卯: "봄의 한가운데",
  辰: "봄에서 여름으로 넘어가는 때",
  巳: "여름의 시작",
  午: "여름의 한가운데",
  未: "여름에서 가을로 넘어가는 때",
  申: "가을의 시작",
  酉: "가을의 한가운데",
  戌: "가을에서 겨울로 넘어가는 때",
  亥: "겨울의 시작",
  子: "겨울의 한가운데",
  丑: "겨울에서 봄으로 넘어가는 때",
};
const ROLE: Record<
  Role,
  {
    name: string;
    meaning: string;
    learn: string;
    career: string;
    risk: string;
    example: string;
  }
> = {
  bigeop: {
    name: "비겁",
    meaning: "자기 기준을 세우고 스스로 시작하는 힘",
    learn:
      "공부 순서와 목표를 직접 정하고 스스로 해결한 과정을 설명할 때 몰입하기 쉽습니다. 처음부터 답을 알려주기보다 두 가지 방법 중 어느 것을 시험할지 선택하게 하면 독립적인 사고가 자랍니다",
    career:
      "일의 방향을 제안하고 책임 범위를 직접 맡는 역할에서 주도성이 살아날 수 있습니다. 창업이나 리더 역할만이 답은 아니며, 조직 안에서도 결정권과 결과에 대한 책임이 함께 주어지는 직무가 중요한 선택 기준입니다",
    risk: "자기 방식만 고집하거나 도움을 받는 일을 패배처럼 느끼는 태도",
    example:
      "모둠 과제에서 먼저 계획을 제안한 뒤 친구의 수정 의견도 반영하는지",
  },
  insung: {
    name: "인성",
    meaning: "배운 것을 깊이 이해하고 마음으로 받아들이는 힘",
    learn:
      "개념의 이유를 이해하고 이미 아는 내용과 연결할 때 기억이 오래갈 수 있습니다. 책이나 설명을 충분히 받아들인 뒤 자기 말로 요약하고 다른 예시에 적용하는 순서가 잘 맞습니다",
    career:
      "정보를 깊이 살피고 전문성을 쌓아 다른 사람의 판단을 돕는 역할에 관심이 이어질 수 있습니다. 연구, 교육, 분석, 상담처럼 지식을 축적하는 과정과 그것을 전달하는 과정을 함께 경험하면 어느 쪽에 더 몰입하는지 구분하기 좋습니다",
    risk: "충분히 알아야 시작할 수 있다는 부담 때문에 행동을 미루는 태도",
    example: "낯선 문제를 읽고 핵심을 정리한 다음 배운 원리로 다시 설명하는지",
  },
  siksang: {
    name: "식상",
    meaning: "생각과 감각을 말과 결과물로 펼치는 힘",
    learn:
      "듣기만 할 때보다 설명하고 그리며 직접 만들어 볼 때 이해가 선명해질 수 있습니다. 같은 개념을 이야기, 도식, 작은 실험으로 바꿔 표현하게 하면 흥미와 이해 수준을 함께 확인할 수 있습니다",
    career:
      "새로운 아이디어를 실제 결과물로 만드는 기획, 개발, 디자인, 콘텐츠 활동에서 재능을 시험하기 좋습니다. 표현의 화려함보다 이용자의 필요를 이해하고 피드백에 맞춰 고치는 과정을 좋아하는지가 장기 적성을 판단하는 단서입니다",
    risk: "떠오른 생각을 곧바로 말하거나 새 흥미를 좇느라 마무리를 놓치는 태도",
    example: "배운 내용을 그림이나 발표로 바꾼 뒤 수정 의견을 받아 완성하는지",
  },
  jaeseong: {
    name: "재성",
    meaning: "시간과 자원을 현실적인 결과에 연결하는 힘",
    learn:
      "목표와 완료 기준이 분명할 때 학습 과정을 안정적으로 이어갈 수 있습니다. 분량을 작은 단위로 나누고 스스로 진행을 확인하게 하면 결과를 얻는 기쁨과 꾸준함이 함께 자랍니다",
    career:
      "한정된 자원을 배분하고 계획을 실제 운영으로 옮기는 일에서 현실 감각을 발휘할 수 있습니다. 재무, 운영, 유통, 프로젝트 관리 같은 분야에서도 숫자를 다루는 능력과 사람 사이의 약속을 지키는 능력을 구분해 경험해 보면 좋습니다",
    risk: "눈에 보이는 성과가 늦어지면 과정의 가치를 낮게 보거나 결과에 조급해지는 태도",
    example:
      "과제를 작은 단계로 나누고 정해 둔 기준에 맞춰 끝까지 마무리하는지",
  },
  gwanseong: {
    name: "관성",
    meaning: "약속과 기준을 지키며 책임을 맡는 힘",
    learn:
      "예측 가능한 순서와 일관된 기준이 있을 때 안심하고 공부에 참여하기 쉽습니다. 정답 여부만 확인하기보다 왜 그 방법을 택했는지 묻고 다른 풀이도 인정해 주면 성실함에 유연성이 더해집니다",
    career:
      "정확한 기준과 공적인 책임이 필요한 업무에서 신뢰를 쌓을 가능성을 살펴볼 수 있습니다. 행정, 품질관리, 법무, 안전, 조직 운영 등은 탐색의 예시이며, 규칙을 그대로 따르는 일과 규칙을 더 좋게 만드는 일 중 어느 쪽에 흥미가 있는지도 중요합니다",
    risk: "실수에 지나치게 엄격하거나 타인의 기대를 자기 기준보다 앞세우는 태도",
    example:
      "맡은 역할을 성실하게 하면서 예상 밖의 상황에서도 기준을 유연하게 조정하는지",
  },
};

export function qualitativeWeight(value: number) {
  return value >= 30
    ? "두드러진"
    : value >= 18
      ? "든든하게 받치는"
      : value >= 8
        ? "적당히 자리한"
        : value > 0
          ? "조용히 작용하는"
          : "생활 경험으로 길러 갈";
}
export function strengthDescription(day: LuckyDay) {
  if (day.strength.grade.includes("strong"))
    return "스스로 방향을 정하고 밀고 나가는 힘이 살아 있어, 자율성과 협력의 균형이 중요합니다.";
  if (day.strength.grade.includes("weak"))
    return "주변 환경을 세심하게 받아들이며 힘을 모으는 편이라, 익숙한 리듬과 충분한 격려 속에서 장점이 편안하게 드러날 수 있습니다.";
  return "스스로 움직이는 힘과 주변 도움을 받아들이는 힘이 고르게 어우러져, 상황에 맞춰 참여 방식을 바꾸는 유연성을 기대할 수 있습니다.";
}
function clean(text: string) {
  return text
    .replaceAll("·", ", ")
    .replace(/프로필에서는|이 날짜에서는|이날짜에서는/g, "아이의 기질에는");
}
function context(day: LuckyDay) {
  const ranked = (Object.keys(day.strength.roleQi) as Role[]).sort(
    (a, b) =>
      day.strength.roleQi[b].percentage - day.strength.roleQi[a].percentage,
  );
  const first = ROLE[ranked[0]],
    second = ROLE[ranked[1]];
  return {
    first,
    second,
    ranked,
    profile: getDayPillarProfile(day.dayPillar)!,
    element: ELEMENT[day.yongshin.element],
  };
}

export function buildProductSummary(day: LuckyDay) {
  const { first, second, profile } = context(day);
  const balance = day.elementQi.missing.length
    ? "크게 드러나는 기질과 생활 속에서 차근차근 길러 갈 기질이 함께 있습니다."
    : "다섯 오행이 모두 자리해 여러 경험을 받아들일 바탕을 갖추고 있습니다.";
  return clean(
    `${day.dayPillarHangul} 일주를 가진 아이는 ${profile.strengths.join(", ")} 같은 장점을 키워 갈 가능성이 있습니다. ${balance} 특히 ${first.name}, 곧 ${first.meaning}이 중심을 이루고, ${second.name}이 뜻하는 ${second.meaning}이 이를 받칩니다. ${strengthDescription(day)} 두 힘이 함께 자라면 한 가지 재능에 머물기보다 자기 방식으로 배우고 사람들과 조화를 찾는 모습으로 이어질 수 있습니다.`,
  );
}

/** 네트워크 실패에도 서버가 제공하는 사주 근거 기반의 풍부한 기본 해설. */
export function buildProductReport(day: LuckyDay): ReportBundle {
  const { first, second, profile: p, element } = context(day);
  const foundation = `${day.dayPillarHangul} 일주의 바탕에 ${first.name}, 즉 ${first.meaning}이 두드러지고 ${second.name}, 곧 ${second.meaning}이 함께합니다.`;
  const balance = strengthDescription(day);
  const learning = `${first.learn}. 여기에 ${second.meaning}이 더해지므로 한 가지 공부법만 고집하기보다 설명을 받아들이는 단계와 스스로 써 보는 단계를 나누는 편이 좋습니다.`;
  const sections: Record<string, string[]> = {
    core: [
      `부모님이 만나게 될 아이의 중심 기질은 ${day.dayPillarHangul} 일주에서 출발합니다. 전통적으로 ‘${p.image}’에 비유하는 모습은 ${p.strengths.join(", ")} 같은 가능성을 생활 속에서 발견하라는 뜻으로 읽을 수 있습니다. ${p.detail.temperament} 월지에 놓인 ${day.pillars[2].ganziHangul.slice(1)}의 계절은 ${SEASON[day.pillars[2].branch]}에 해당해, 이 기질이 자라는 바탕을 함께 보여줍니다.`,
      `${foundation} ${balance} 그래서 같은 일주라도 자기 생각을 얼마나 빨리 꺼내는지, 낯선 환경에서 누구의 도움을 찾는지에 따라 겉으로 보이는 모습은 달라집니다. 강점을 한 단어로 정해 두기보다 두 힘이 서로 돕는 조건을 살펴보는 것이 중요합니다.`,
      `예를 들어 ${first.example} 살펴보세요. 잘한 결과만 칭찬하기보다 시작한 이유와 어려움을 넘긴 방법을 함께 이야기하면 아이가 자신의 장점을 알아갑니다. ${p.detail.balance} 사주는 미래를 확정하는 답이 아니라 아이의 가능성을 넓게 이해하는 참고가 됩니다.`,
    ],
    "inner-pace": [
      `마음의 속도를 이해할 때에는 ${first.name}이 뜻하는 ${first.meaning}과 스스로 버티는 힘의 균형을 함께 봅니다. ${balance} 자신감은 언제나 먼저 나서는 모습으로만 나타나지 않으며, 충분히 살핀 뒤 자기 판단을 말하는 태도에서도 드러납니다.`,
      `${first.meaning}이 편안하게 쓰일 때에는 ${p.strengths.join(", ")} 같은 장점이 자연스럽게 드러날 수 있습니다. 반대로 피곤하거나 기대가 커지면 ${first.risk}가 생길 수 있어, 평소와 달라진 반응의 맥락을 먼저 이해하는 편이 좋습니다. 새로운 활동 앞에서 머뭇거린다면 하기 싫은지, 방법을 모르는지, 실수가 걱정되는지 나누어 물어보세요.`,
      `부모가 곧바로 대신해 주기보다 시작할 첫 단계만 함께 정하고 나머지는 기다리는 경험이 도움이 됩니다. ${second.meaning}을 활용해 작은 성공을 되짚으면 자기 확신을 더 현실적으로 쌓을 수 있습니다. 낯선 공간과 익숙한 공간에서 도움을 요청하는 방식, 실수 뒤 다시 참여하는 모습을 비교하며 아이에게 맞는 간격을 찾아주세요.`,
    ],
    learning: [
      `배움의 출발점은 ${first.name}의 ${first.meaning}이며, 배운 것을 이어 쓰는 과정에는 ${second.name}의 ${second.meaning}도 함께 작용합니다. 학업에서는 이 두 힘을 이해와 표현이라는 서로 다른 단계로 나누어 살펴보면 공부법을 구체화하기 좋습니다. ${learning} ${p.detail.talentAndCareer}`,
      `읽기에서는 줄거리를 외우는 것보다 인물의 선택 이유를 자기 말로 설명하게 하고, 수학에서는 답을 맞힌 뒤 다른 방법도 가능한지 함께 찾아보세요. 과학에서는 먼저 예상한 결과와 실제 관찰을 비교하고, 언어에서는 새 표현을 일상의 짧은 이야기로 바꾸어 써 보는 경험이 좋습니다. 같은 내용이라도 듣기, 말하기, 만들기 중 어느 과정에서 질문이 늘고 집중이 이어지는지 살펴보면 아이의 학습 출발점을 찾기 쉽습니다. 학업 성취를 특정 과목의 운으로 단정하지 말고 이해, 연습, 표현 중 어느 단계가 편한지 구분해 주세요.`,
      `강점이 과하게 쓰이면 ${first.risk}가 배움을 막을 수 있습니다. 이때는 문제 양을 늘리기보다 어디까지 이해했고 어느 단계에서 멈췄는지를 함께 표시하는 편이 도움이 됩니다. 유년기에는 호기심과 반복할 즐거움을 지키고, 청소년기에는 계획을 직접 세우되 한 주 뒤 실행 결과를 함께 검토하는 방식으로 자율성을 넓혀 주세요. 잘하는 분야만 반복시키기보다 익숙한 강점을 사용해 낯선 과제를 해결하는 경험이 배움의 폭을 키웁니다. 집중한 시간, 다시 해 본 시도, 설명이 구체적으로 바뀌는 과정을 기록하면 점수만으로 놓치기 쉬운 성장을 발견할 수 있습니다.`,
    ],
    "hidden-strength": [
      `겉으로 먼저 보이는 ${first.meaning}만으로 재능을 정하기는 이릅니다. ${second.name}에 해당하는 ${second.meaning}은 익숙해진 환경이나 충분히 연습한 활동에서 더 선명하게 드러날 수 있기 때문입니다. 일주가 보여주는 ${p.strengths.join(", ")} 같은 강점을 혼자 쓰는 때와 사람들과 함께 쓰는 때로 나누어 관찰하면 첫인상에 가려졌던 가능성이 보입니다.`,
      `두 성향은 서로 별개인 재능 목록이 아니라 시작한 일을 다듬고 완성하는 과정에서 만납니다. ${first.learn}. 여기에 보조 성향이 더해지면 혼자 생각한 것을 다른 사람과 나누거나 막연한 흥미를 실제 활동으로 바꾸는 연결점이 생길 수 있습니다.`,
      `집에서 보이는 모습과 친구들과 함께 있을 때의 모습을 비교해 주세요. 먼저 나서는 역할과 뒤에서 정리하는 역할을 번갈아 맡기면 한 가지 평가에 가려졌던 장점이 드러납니다. ${second.risk}가 보일 때에는 능력이 없다고 판단하기보다 과제가 너무 크거나 역할이 불분명하지 않은지 점검하면 좋습니다. 익숙하지 않은 역할을 끝낸 뒤 무엇이 즐거웠는지 묻는 대화가 두 번째 강점을 발견하는 출발점입니다.`,
    ],
    relationships: [
      `친구를 만날 때에는 ${first.name}의 ${first.meaning}이 참여 방식에 영향을 줄 수 있습니다. 여기에 ${second.meaning}이 더해지면서 자기 뜻을 표현하는 모습과 다른 사람의 속도를 받아들이는 모습이 함께 나타납니다. ${p.detail.relationships}`,
      `예를 들어 ${first.example} 관찰하면 관계 속 강점이 구체적으로 보입니다. 의견이 다를 때 곧바로 누가 맞는지 정하기보다 각자가 원하는 놀이와 그 이유를 말하게 하면 자신을 지키면서도 조율하는 경험을 할 수 있습니다. ${second.meaning}은 상대의 제안을 받아들이고 함께 만든 약속을 이어가는 데 활용할 수 있습니다.`,
      `친구가 많고 적은 것만으로 사회성을 평가하지 말고 먼저 다가가기, 거절을 받아들이기, 다툰 뒤 다시 이야기하기를 따로 살펴주세요. ${first.risk}가 관계를 막을 때에는 상대를 바꾸려 하기보다 자기 감정과 부탁을 짧게 말하는 연습이 좋습니다. 부모가 갈등을 모두 해결해 주기보다 안전한 상황에서 아이가 대안을 하나 제안하도록 기다리면, 타고난 기질을 관계 기술로 발전시킬 수 있습니다.`,
    ],
    "adult-relationships": [
      `성인이 된 뒤 친밀한 관계에서는 일지 ${day.dayPillarHangul.slice(1)}의 ${sajuLabel(day.pillars[1].branchSipsin)}을 관계에서 중요하게 여기는 태도의 한 단서로 읽을 수 있습니다. 이는 ${ROLE[SIPSIN_ROLE[day.pillars[1].branchSipsin] || "bigeop"].meaning}과 연결되지만 배우자의 실제 성격을 정하는 정보는 아닙니다. 타고난 ${p.strengths[0]} 같은 기질이 가까운 사람에게 어떤 배려로 전달되는지, 반대로 어떤 기대가 되는지 살펴보는 편이 더 유용합니다.`,
      `가까운 관계에서도 ${first.meaning}과 ${second.meaning}을 모두 존중받고 싶어 할 수 있습니다. 예를 들어 함께 사는 공간의 규칙, 돈을 쓰는 기준, 혼자 쉬는 시간을 정할 때 상대의 마음을 추측하기보다 서로 중요하게 여기는 조건을 직접 나누는 방식이 도움이 됩니다. 책임을 다하는 것과 감정을 표현하는 것은 다른 일이므로 행동으로 충분히 했다고 느껴도 상대가 원하는 대화를 확인할 필요가 있습니다.`,
      `긴장할 때 ${first.risk}가 나타나면 결론을 서두르기보다 각자가 원하는 것과 조정할 수 있는 것을 구분해 보세요. 가족은 성인 자녀의 선택을 대신하기보다 당사자가 어떤 관계에서 존중받는지 스스로 판단하도록 지지하는 편이 자연스럽습니다. 결혼 여부와 상대의 외모, 만나는 시기는 사주로 확정할 수 없습니다. 이 기질의 장점은 정해진 인연을 기다리는 데 있지 않고 솔직한 대화와 일관된 약속을 통해 관계를 함께 만들어 가는 데 있습니다.`,
    ],
    challenge: [
      `${day.dayPillarHangul} 일주의 장점인 ${p.strengths.join(", ")}도 오래 긴장한 상태로 쓰이면 부담이 될 수 있습니다. 특히 두드러진 ${first.name}의 힘과 이를 받치는 ${second.name}의 힘을 모두 잘해야 한다는 기대가 겹치면, 잘하는 일을 하면서도 만족하기 어려워질 수 있습니다. 중요한 질문은 장점이 있는가보다 그 장점을 얼마나 편안하게 쓰고 있는가입니다.`,
      `주의해서 볼 신호는 ${first.risk}입니다. ${p.detail.balance} 예를 들어 평소 좋아하던 활동에서도 시작을 미루거나 사소한 수정에 크게 반응한다면 의지가 부족하다고 단정하기보다 기대와 실제 여력의 간격을 살펴볼 필요가 있습니다. 쉬어야 할 때와 조금만 도우면 다시 할 수 있는 때를 구분해 주세요.`,
      `문제 직후에는 왜 그랬는지 따지기보다 가장 어려웠던 단계와 원하는 도움을 고르게 해주세요. 일정이 바뀐 날, 새로운 관계를 만난 날, 충분히 쉬지 못한 날의 반응을 비교하면 반복되는 조건을 발견하기 쉽습니다. 아이에게 맞는 부담의 크기를 조정한 뒤 작은 성공을 다시 경험하게 하면 강점이 압박으로 바뀌는 일을 줄일 수 있습니다. 어떤 반응도 고정된 운명으로 여기지 않고 경험에 따라 달라질 여지를 남겨두는 것이 중요합니다.`,
    ],
    wellbeing: [
      `생활 리듬을 살필 때에는 두드러진 ${first.name}의 활동 방식과 용신인 ${element} 기운이 보완하는 방향을 함께 생각해 볼 수 있습니다. ${day.yongshin.method === "johu" ? "태어난 계절의 치우침을 조절하는 조후의 관점에서는 한 가지 활동만 계속하기보다 서로 다른 자극 사이에 여유를 두는 모습을 비유로 삼습니다." : "타고난 힘의 균형을 보는 억부의 관점에서는 힘을 쓰는 시간과 도움을 받아 회복하는 시간을 구분해 생각할 수 있습니다."} 이는 몸의 기관이나 질환을 알아내는 방법이 아니라 활동과 회복을 번갈아 배치할 생각거리를 주는 전통적 해석입니다.`,
      `좋아하는 일에 몰입한 날에는 무엇을 했는지뿐 아니라 그 뒤 얼마나 편안히 쉬었는지 살펴주세요. 자극이 많은 활동 뒤 조용한 시간이 필요한지, 혼자 생각한 뒤 가볍게 움직이면 다시 참여하기 쉬운지 실제 반응을 비교하는 편이 도움이 됩니다. ${first.meaning}이 강점이라도 쉬지 않고 계속 써야 한다는 뜻은 아니며, 끝내는 시간과 다시 시작할 조건을 스스로 알아가는 과정도 성장의 일부입니다.`,
      `유년기에는 부모가 일정과 휴식의 간격을 조정하고, 성인기에는 당사자가 자신의 생활 리듬을 선택하는 방식으로 이어집니다. 한꺼번에 여러 습관을 바꾸기보다 한 가지를 시도하고 편안함과 부담이 어떻게 달라지는지 기록해 보세요. 건강 상태나 체질, 질병 위험은 사주로 판단할 수 없습니다. 실제 증상이나 발달에 관한 걱정은 의료 전문가의 평가를 우선하며, 출산일 역시 산모와 아기의 안전에 관한 의료진의 판단 안에서 선택해야 합니다.`,
    ],
    career: [
      `직업의 방향은 ${first.name}의 ${first.meaning}을 실제 업무에서 어떻게 쓰는가에서 시작합니다. 일주에서 읽는 ${p.strengths.join(", ")} 같은 강점과 ${second.name}의 보조 성향을 함께 보면, 어떤 직업 이름보다 어떤 문제를 풀 때 오래 몰입하는지가 더 중요한 질문이 됩니다. ${first.career}. ${p.detail.talentAndCareer}`,
      `${p.careerThemes.join(", ")} 등은 가능성을 시험할 분야의 예시이며 진로를 미리 확정하는 목록은 아닙니다. 같은 분야에서도 새 방향을 제안하는 기획, 세밀한 완성도를 높이는 실무, 사람들의 이해를 돕는 설명, 여러 일을 묶어 끝내는 운영은 서로 다른 능력을 요구합니다. ${second.career}. 하나의 결과물을 만들 때 조사, 설계, 제작, 설명, 수정 중 어떤 단계에서 자발적인 반복이 늘어나는지 비교하면 재능의 쓰임이 구체적으로 보입니다.`,
      `어릴 때는 직업을 정해 교육하기보다 만들기와 탐구, 기록, 팀 활동을 고르게 경험하게 해주세요. 청소년기에는 짧은 프로젝트를 끝내고 다른 사람의 피드백으로 고치는 과정에서 흥미가 유지되는지 확인하면 좋습니다. 성인이 된 뒤에는 자율성과 명확한 지침 중 무엇이 성과를 돕는지, 혼자 깊이 파는 시간과 협업 시간이 어떻게 배치되어야 편한지를 직무 선택의 기준으로 삼을 수 있습니다. 사업이나 독립도 사주만으로 정하기보다 경험, 수요, 실제 생활 여건을 함께 검토해야 합니다. 강점이 과해져 ${first.risk}가 보일 때에는 일의 범위와 완료 기준을 다시 정하는 연습이 전문성을 오래 유지하는 데 도움이 됩니다.`,
    ],
    money: [
      `${day.dayPillarHangul} 일주의 재물 해석은 얼마를 벌 것인가보다 시간과 자원을 어떤 기준으로 다루는지에 초점을 둡니다. 재성, 곧 현실적인 결과를 관리하는 힘은 ${qualitativeWeight(day.strength.roleQi.jaeseong.percentage)} 성향으로 작용하고, ${first.meaning}과 만날 때 선택의 우선순위가 드러날 수 있습니다. ${p.detail.workAndMoney}`,
      `유년기에는 갖고 싶은 물건을 바로 사 주기보다 지금 필요한 것, 기다려도 되는 것, 함께 쓰면 좋은 것을 나누어 이야기해 보세요. 작은 용돈이나 시간을 직접 배분한 뒤 예상과 실제 만족이 어떻게 달랐는지 묻는 경험이 현실 감각을 키웁니다. 절약을 잘하는 모습만 칭찬하기보다 목적에 맞게 사용하고 계획을 수정한 이유도 충분히 들어주는 편이 좋습니다.`,
      `성인기에는 수입의 크기를 예언하기보다 배운 것을 가치 있는 결과로 만드는 과정과 얻은 자원을 오래 관리하는 습관을 구분해 볼 수 있습니다. ${second.meaning}은 일과 생활의 우선순위를 정하고 가까운 사람과 책임을 나누는 데 보탬이 될 수 있습니다. 재산 규모나 투자 성과는 사주로 보장할 수 없으므로 실제 계약과 재무 결정에는 현실 자료를 사용해야 합니다. 어릴 때부터 선택 이유를 설명하고 결과를 되짚는 습관이 장기적으로 더 쓸모 있는 기반이 됩니다.`,
    ],
    parenting: [
      `양육 환경을 생각할 때에는 타고난 ${first.meaning}을 살리면서 용신인 ${element} 기운이 보완하려는 균형을 생활 속 경험으로 옮기는 관점을 사용할 수 있습니다. 부모가 마련할 환경은 아이의 성격을 고정시키는 틀이 아니라 타고난 힘을 편안하게 써 볼 수 있는 조건입니다. ${p.detail.balance}`,
      `${element} 기운이 보완하는 방향을 생활에 옮길 때에는 관심사를 넓히는 경험과 익숙한 일상을 돌아오는 경험을 함께 제공해 보세요. 예를 들어 ${first.example} 살피면서 도움을 너무 일찍 주지는 않는지, 반대로 혼자 감당하기 어려운 일을 맡기지는 않는지 조정할 수 있습니다. 아이가 선택할 몫과 부모가 안전을 위해 정할 경계를 구분하면 자율성과 안정감을 동시에 경험하기 좋습니다.`,
      `한 주에 한 가지 환경만 바꾸고 시작하는 속도와 도움을 청하는 방식, 끝난 뒤 다시 해 보고 싶어 하는지를 기록해 주세요. 같은 방법이 효과가 없으면 아이를 탓하기보다 활동의 난이도와 설명 방식부터 점검하는 편이 좋습니다. ${second.meaning}이 드러나는 순간을 구체적으로 말해 주면 아이도 자신의 장점을 알아갑니다. 성장할수록 부모의 역할은 대신 결정하는 일에서 필요한 도움을 함께 찾는 일로 옮겨가야 합니다.`,
    ],
    "life-flow": [
      `${day.dayPillarHangul} 일주의 중심 기질은 생애 내내 같은 모습으로 고정되지 않고 새로운 경험과 시기별 기운을 만나 다르게 표현됩니다. 원래 두드러진 ${first.name}의 힘이 대운에서 다시 들어오면 익숙한 장점을 더 자주 쓰게 되는 모습으로, 다른 힘이 들어오면 새로운 역할을 연습하는 모습으로 읽을 수 있습니다. 한 시기의 기회가 모든 사람에게 똑같은 사건으로 나타나는 것은 아닙니다.`,
      `유년기에는 생활의 안정과 배움의 즐거움을 쌓고, 청소년기에는 스스로 고른 목표를 시도하며 정체성을 넓히는 과정이 중요합니다. 성인이 된 뒤에는 전공과 일, 친밀한 관계, 생활 기반을 자신의 판단으로 선택하며 타고난 장점의 쓰임을 구체화하게 됩니다. 아래의 대운 해설은 각 시기에 어떤 힘이 더해지는지와 그 힘을 생활에서 활용할 방법을 함께 설명합니다.`,
      `삼십 대 이후에는 커리어의 확장뿐 아니라 맡은 책임과 회복 시간을 어떻게 나눌지가 중요해지고, 중년 이후에는 쌓은 경험을 나누며 삶의 우선순위를 재정비하는 질문이 더 커질 수 있습니다. 같은 흐름에서도 실제 경험과 환경은 다르므로 특정 나이의 성공이나 결혼을 약속하는 방식으로 읽지 마세요. 가족은 당사자의 선택권을 존중하며 요청받은 지지를 제공하는 편이 자연스럽습니다. 시기별 강점과 부담을 함께 살피면 한 번의 좋은 결과보다 오래 이어갈 생활의 기준을 세우는 데 도움이 됩니다.`,
      day.pillars.some((pillar) => pillar.sinsal === "驛馬")
        ? "원국의 역마는 낯선 환경을 경험하며 활동 범위를 넓히는 기질을 생각하게 하는 상징입니다. 유년기에는 다양한 장소와 사람을 만나는 경험으로, 성인기에는 다른 지역의 일과 배움을 탐색하는 방식으로 연결해 볼 수 있습니다. 해외 거주나 이동 자체가 성공을 보장한다는 뜻은 아니며, 새로운 환경에서 쓰고 싶은 전문성과 유지할 관계를 먼저 살펴보는 편이 좋습니다."
        : "환경을 바꾸는 선택은 이동을 뜻하는 상징의 유무만으로 정하지 않습니다. 성인이 된 뒤 새로운 지역이나 분야에 관심이 생기면 익숙한 강점을 어디에서 활용할 수 있는지, 새로 배워야 할 것은 무엇인지 구분해 보세요. 사주는 선택을 대신하는 답보다 스스로 중요하게 여기는 조건을 되짚는 질문으로 활용할 때 더 유용합니다.",
    ],
  };
  const flow = buildDaewoonInterpretations(day);
  return {
    version: REPORT_VERSION,
    source: "local",
    sections: SECTION_TOPICS.map(([id, icon, title]) => ({
      id,
      icon,
      title:
        id === "core"
          ? `${p.strengths[0]}, 자기 모습을 찾아갈 아이의 강점`
          : title,
      body: sections[id].map(clean).join("\n\n"),
    })),
    periods: day.daewoon.map((period) => {
      const span = getDaewoonPeriod(day, period.index)!;
      const analysis = flow.find((item) => item.index === period.index);
      const adult = span.ageRange[1] >= 19;
      const crossing = span.ageRange[0] < 19 && adult;
      const subject = crossing
        ? "청소년기에서 성인기로 넘어가는 자녀"
        : adult
          ? "당사자"
          : "자녀";
      const stem = ROLE[SIPSIN_ROLE[period.stemSipsin] || "bigeop"];
      const branch = ROLE[SIPSIN_ROLE[period.branchSipsin] || "bigeop"];
      const task =
        span.ageRange[0] >= 70
          ? "당사자가 원하는 일상의 속도와 관계의 범위를 존중하며 경험을 기록하고 나누는 과정"
          : span.ageRange[0] >= 60
            ? "직업에서 쌓은 경험을 새로운 활동과 배움으로 옮기고 생활의 우선순위를 재정비하는 과정"
            : span.ageRange[0] >= 40
              ? "축적한 전문성을 활용하면서 일과 가까운 관계의 책임을 나누는 과정"
              : adult
                ? "스스로 선택한 일과 관계의 책임을 나누고 자신의 생활 기반을 조정하는 과정"
                : "배움과 친구 관계에서 자기 생각을 표현하며 작은 책임을 완수하는 과정";
      const tone = !analysis
        ? "익숙한 강점을 새로운 생활 리듬에 맞춰 다시 활용해 볼 수 있습니다"
        : analysis.deltaScore >= 0
          ? "타고난 힘을 더 고르게 펼치며 경험의 폭을 넓혀 볼 여지가 있습니다"
          : "한꺼번에 영역을 넓히기보다 익힌 것을 다듬고 생활의 중심을 지키는 일이 중요해질 수 있습니다";
      const firstYear = span.annualFortunes[0];
      const yearly = firstYear
        ? `${firstYear.year}년 ${firstYear.ganziHangul}의 ${sajuLabel(firstYear.stemSipsin)}은 ${ROLE[SIPSIN_ROLE[firstYear.stemSipsin] || "bigeop"].meaning}에 시선을 두게 하는 상징입니다.`
        : "";
      return {
        index: period.index,
        title: `${span.ageRange[0]}~${span.ageRange[1]}세, ${period.ganziHangul}의 흐름`,
        body: clean(
          [
            `${period.ganziHangul}의 기운을 만나는 이 시기에는 ${tone}. 천간의 ${sajuLabel(period.stemSipsin)}은 ${stem.meaning}을, 지지의 ${sajuLabel(period.branchSipsin)}은 ${branch.meaning}을 더하는 모습으로 읽습니다. ${day.dayPillarHangul} 일주의 ${p.strengths.join(", ")} 같은 장점이 이 두 힘과 만날 때 어떤 쓰임을 찾는지 살펴볼 수 있습니다.`,
            `${subject}에게 중요한 생활 과제는 ${task}입니다. ${crossing ? "앞쪽 연령에서는 학업과 자율성을, 성인이 된 뒤에는 독립과 진로의 선택권을 구분해서 살펴야 합니다." : "기회가 생겼다는 이유만으로 모두 받아들이기보다 지금까지 쌓은 경험을 어디에 쓸지 먼저 정하는 편이 좋습니다."} ${span.ageRange[0] >= 60 ? "배움과 교류를 의무처럼 늘리기보다 자발적으로 즐길 수 있는 활동과 편안한 휴식의 간격을 정해 보세요." : adult ? stem.career + "." : stem.learn + "."} ${stem.risk}가 나타날 때에는 역할과 기대의 크기를 다시 조정하면 도움이 됩니다.`,
            `초반 ${span.yearRange[0]}년부터 후반 ${span.yearRange[1]}년까지는 해마다 다른 기운이 겹칩니다. ${yearly} ${analysis?.sinsalText || "한 해의 작은 변화와 긴 시기의 방향을 구분하면 계획을 유연하게 다듬기 좋습니다."} ${adult ? "가족은 당사자의 결정을 대신하지 않고 요청받은 정보와 정서적 지지를 나누는 편이 자연스럽습니다." : "부모는 결과를 재촉하기보다 즐거웠던 과정과 필요한 도움을 묻고 충분히 다시 시도할 시간을 마련해 주세요."} 흐름의 해석은 사건의 예언이 아니라 변화 속에서도 자기 기준을 잃지 않도록 돕는 참고입니다.`,
          ].join("\n\n"),
        ),
      };
    }),
  };
}

export const INTERNAL_COPY =
  /%|퍼센트|\bSI\b|σ|생조\s*\d|극설\s*\d|raw.?score|base.?score|이\s?날짜(?:에서는|를 선택|의)|프로필에서는|입력값|계산 결과에서는|\d+(?:\.\d+)?\s*점/i;
export function validateProductReport(
  value: unknown,
  day: LuckyDay,
): value is ReportBundle {
  if (!value || typeof value !== "object") return false;
  const bundle = value as ReportBundle;
  if (
    !Array.isArray(bundle.sections) ||
    bundle.sections.length !== SECTION_TOPICS.length ||
    !Array.isArray(bundle.periods) ||
    bundle.periods.length !== day.daewoon.length
  )
    return false;
  const validBody = (body: unknown, min: number, max: number) =>
    typeof body === "string" &&
    body.length >= min &&
    body.length <= max &&
    body.split(/\n\s*\n/).length >= 3 &&
    !INTERNAL_COPY.test(body);
  if (
    !bundle.sections.every(
      (section, index) =>
        section &&
        section.id === SECTION_TOPICS[index][0] &&
        section.icon === SECTION_TOPICS[index][1] &&
        typeof section.title === "string" &&
        section.title.length >= 5 &&
        section.title.length <= 70 &&
        !INTERNAL_COPY.test(section.title) &&
        validBody(
          section.body,
          ["learning", "career"].includes(section.id) ? 650 : 350,
          1900,
        ),
    )
  )
    return false;
  if (
    new Set(bundle.sections.map((s) => s.body)).size !== SECTION_TOPICS.length
  )
    return false;
  const health = bundle.sections.find((s) => s.id === "wellbeing")!.body;
  if (
    !/의료|의사/.test(health) ||
    /간암|폐암|심장병|당뇨|고혈압|불임|단명/.test(health)
  )
    return false;
  return bundle.periods.every(
    (period, index) =>
      period &&
      period.index === day.daewoon[index].index &&
      typeof period.title === "string" &&
      !INTERNAL_COPY.test(period.title) &&
      validBody(period.body, 350, 1600) &&
      (getDaewoonPeriod(day, period.index)!.ageRange[0] < 19 ||
        !/(?:아기|아이(?:가|는|를|에게|의)|훈육)/.test(period.body)),
  );
}
