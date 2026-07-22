export type BirthGender = "M" | "F";

export interface BirthLocation {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  aliases: string[];
  input?: string;
  matched: boolean;
}

export const BIRTH_LOCATIONS: BirthLocation[] = [
  {
    id: "seoul",
    label: "서울",
    latitude: 37.5665,
    longitude: 126.978,
    aliases: [
      "서울",
      "서울시",
      "서울특별시",
      "강남",
      "강남구",
      "서초",
      "서초구",
      "송파",
      "송파구",
      "강서",
      "강서구",
      "마포",
      "마포구",
      "종로",
      "종로구",
      "중구",
      "용산",
      "용산구",
    ],
    matched: true,
  },
  {
    id: "busan",
    label: "부산",
    latitude: 35.1796,
    longitude: 129.0756,
    aliases: ["부산", "부산시", "부산광역시", "해운대", "해운대구", "수영", "수영구", "동래", "동래구"],
    matched: true,
  },
  {
    id: "daegu",
    label: "대구",
    latitude: 35.8714,
    longitude: 128.6014,
    aliases: ["대구", "대구시", "대구광역시", "수성", "수성구", "달서", "달서구"],
    matched: true,
  },
  {
    id: "incheon",
    label: "인천",
    latitude: 37.4563,
    longitude: 126.7052,
    aliases: ["인천", "인천시", "인천광역시", "송도", "연수", "연수구", "부평", "부평구"],
    matched: true,
  },
  {
    id: "gwangju",
    label: "광주",
    latitude: 35.1595,
    longitude: 126.8526,
    aliases: ["광주", "광주시", "광주광역시", "서구", "북구", "광산", "광산구"],
    matched: true,
  },
  {
    id: "daejeon",
    label: "대전",
    latitude: 36.3504,
    longitude: 127.3845,
    aliases: ["대전", "대전시", "대전광역시", "유성", "유성구", "둔산", "서구"],
    matched: true,
  },
  {
    id: "ulsan",
    label: "울산",
    latitude: 35.5384,
    longitude: 129.3114,
    aliases: ["울산", "울산시", "울산광역시", "남구", "중구", "울주", "울주군"],
    matched: true,
  },
  {
    id: "sejong",
    label: "세종",
    latitude: 36.4801,
    longitude: 127.289,
    aliases: ["세종", "세종시", "세종특별자치시"],
    matched: true,
  },
  {
    id: "jeju",
    label: "제주",
    latitude: 33.4996,
    longitude: 126.5312,
    aliases: ["제주", "제주시", "제주도", "제주특별자치도", "서귀포", "서귀포시"],
    matched: true,
  },
  {
    id: "gyeonggi",
    label: "경기",
    latitude: 37.4138,
    longitude: 127.5183,
    aliases: [
      "경기",
      "경기도",
      "수원",
      "수원시",
      "성남",
      "성남시",
      "분당",
      "판교",
      "용인",
      "용인시",
      "고양",
      "고양시",
      "일산",
      "부천",
      "부천시",
      "안양",
      "안양시",
      "화성",
      "화성시",
      "평택",
      "평택시",
    ],
    matched: true,
  },
  {
    id: "gangwon",
    label: "강원",
    latitude: 37.8228,
    longitude: 128.1555,
    aliases: ["강원", "강원도", "강원특별자치도", "춘천", "춘천시", "원주", "원주시", "강릉", "강릉시"],
    matched: true,
  },
  {
    id: "chungbuk",
    label: "충북",
    latitude: 36.6357,
    longitude: 127.4913,
    aliases: ["충북", "충청북도", "청주", "청주시", "충주", "충주시", "제천", "제천시"],
    matched: true,
  },
  {
    id: "chungnam",
    label: "충남",
    latitude: 36.6588,
    longitude: 126.6728,
    aliases: ["충남", "충청남도", "천안", "천안시", "아산", "아산시", "서산", "서산시"],
    matched: true,
  },
  {
    id: "jeonbuk",
    label: "전북",
    latitude: 35.7175,
    longitude: 127.153,
    aliases: ["전북", "전라북도", "전북특별자치도", "전주", "전주시", "군산", "군산시", "익산", "익산시"],
    matched: true,
  },
  {
    id: "jeonnam",
    label: "전남",
    latitude: 34.8679,
    longitude: 126.991,
    aliases: ["전남", "전라남도", "목포", "목포시", "여수", "여수시", "순천", "순천시"],
    matched: true,
  },
  {
    id: "gyeongbuk",
    label: "경북",
    latitude: 36.4919,
    longitude: 128.8889,
    aliases: ["경북", "경상북도", "포항", "포항시", "구미", "구미시", "경주", "경주시", "안동", "안동시"],
    matched: true,
  },
  {
    id: "gyeongnam",
    label: "경남",
    latitude: 35.4606,
    longitude: 128.2132,
    aliases: ["경남", "경상남도", "창원", "창원시", "김해", "김해시", "진주", "진주시", "양산", "양산시"],
    matched: true,
  },
];

export const DEFAULT_BIRTH_LOCATION_ID = "seoul";
export const DEFAULT_BIRTH_GENDER: BirthGender = "M";
export const STANDARD_MERIDIAN_LONGITUDE = 135;

function normalizeLocationInput(value: string) {
  return value.toLowerCase().replace(/\s/g, "").replace(/[^\da-z가-힣]/g, "");
}

function withInput(location: BirthLocation, input: string | null, matched: boolean) {
  return {
    ...location,
    input: input?.trim() || location.label,
    matched,
  };
}

export function getBirthLocation(value: string | null) {
  const fallback =
    BIRTH_LOCATIONS.find((location) => location.id === DEFAULT_BIRTH_LOCATION_ID) ??
    BIRTH_LOCATIONS[0];
  const rawInput = value?.trim() || fallback.label;
  const normalized = normalizeLocationInput(rawInput);

  const exact = BIRTH_LOCATIONS.find(
    (location) =>
      normalizeLocationInput(location.id) === normalized ||
      normalizeLocationInput(location.label) === normalized ||
      location.aliases.some((alias) => normalizeLocationInput(alias) === normalized)
  );

  if (exact) return withInput(exact, rawInput, true);

  const partial = BIRTH_LOCATIONS.find((location) =>
    location.aliases.some((alias) => {
      const normalizedAlias = normalizeLocationInput(alias);
      return normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized);
    })
  );

  if (partial) return withInput(partial, rawInput, true);

  return withInput(fallback, rawInput, false);
}

export function parseBirthGender(value: string | null): BirthGender {
  return value === "F" ? "F" : "M";
}

export function getLongitudeCorrectionMinutes(longitude: number) {
  return Math.round((longitude - STANDARD_MERIDIAN_LONGITUDE) * 4);
}

export function adjustBirthTimeByLongitude({
  year,
  month,
  day,
  hour,
  minute,
  longitude,
}: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  longitude: number;
}) {
  const correctionMinutes = getLongitudeCorrectionMinutes(longitude);
  const adjusted = new Date(Date.UTC(year, month - 1, day, hour, minute + correctionMinutes));

  return {
    year: adjusted.getUTCFullYear(),
    month: adjusted.getUTCMonth() + 1,
    day: adjusted.getUTCDate(),
    hour: adjusted.getUTCHours(),
    minute: adjusted.getUTCMinutes(),
    correctionMinutes,
  };
}
