import {
  KOREAN_LOCATION_ROWS,
  type KoreanLocationLevel,
} from "@/lib/data/korean-locations";

export type BirthGender = "M" | "F";

export interface BirthLocation {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  correctionMinutes: number;
  aliases: string[];
  level: KoreanLocationLevel | "place";
  input?: string;
  matched: boolean;
}

interface SearchableBirthLocation extends BirthLocation {
  name: string;
  searchTerms: string[];
}

const SIDO_ALIASES: Record<string, string[]> = {
  "11": ["서울", "서울시"],
  "26": ["부산", "부산시"],
  "27": ["대구", "대구시"],
  "28": ["인천", "인천시"],
  "29": ["광주", "광주시"],
  "30": ["대전", "대전시"],
  "31": ["울산", "울산시"],
  "36": ["세종", "세종시"],
  "41": ["경기"],
  "43": ["충북"],
  "44": ["충남"],
  "46": ["전남"],
  "47": ["경북"],
  "48": ["경남"],
  "50": ["제주", "제주도"],
  "51": ["강원", "강원도"],
  "52": ["전북", "전북도"],
};

export const DEFAULT_BIRTH_LOCATION_ID = "sido-11";
export const DEFAULT_BIRTH_GENDER: BirthGender = "M";
export const STANDARD_MERIDIAN_LONGITUDE = 135;

export function normalizeLocationInput(value: string) {
  return value.toLowerCase().replace(/\s/g, "").replace(/[^\da-z가-힣]/g, "");
}

function uniqueNormalized(values: string[]) {
  return [...new Set(values.map(normalizeLocationInput).filter(Boolean))];
}

const OFFICIAL_LOCATIONS: SearchableBirthLocation[] = KOREAN_LOCATION_ROWS.map(
  ([level, code, label, name, latitude, longitude, correctionMinutes]) => {
    const aliases = level === "sido" ? SIDO_ALIASES[code] ?? [] : [];
    return {
      id: `${level}-${code}`,
      label,
      name,
      latitude,
      longitude,
      correctionMinutes,
      aliases,
      level,
      matched: true,
      searchTerms: uniqueNormalized([label, name, ...aliases]),
    };
  }
);

const GWANGAN_LOCATIONS = OFFICIAL_LOCATIONS.filter(
  (location) => location.id.startsWith("emd-265007") && location.name.startsWith("광안")
);

function averageCoordinate(
  locations: SearchableBirthLocation[],
  key: "latitude" | "longitude"
) {
  if (locations.length === 0) {
    throw new Error("광안리 별칭에 연결할 행정동 좌표가 없습니다.");
  }
  const average =
    locations.reduce((sum, location) => sum + location[key], 0) / locations.length;
  return Number(average.toFixed(4));
}

const GWANGAN_LATITUDE = averageCoordinate(GWANGAN_LOCATIONS, "latitude");
const GWANGAN_LONGITUDE = averageCoordinate(GWANGAN_LOCATIONS, "longitude");

const COMMON_PLACE_LOCATIONS: SearchableBirthLocation[] = [
  {
    id: "place-gwanganri",
    label: "부산광역시 수영구 광안리",
    name: "광안리",
    latitude: GWANGAN_LATITUDE,
    longitude: GWANGAN_LONGITUDE,
    correctionMinutes: Math.round((GWANGAN_LONGITUDE - STANDARD_MERIDIAN_LONGITUDE) * 4),
    aliases: ["광안리", "광안해수욕장"],
    level: "place",
    matched: true,
    searchTerms: uniqueNormalized([
      "부산광역시 수영구 광안리",
      "광안리",
      "광안해수욕장",
    ]),
  },
];

const SEARCHABLE_LOCATIONS = [...COMMON_PLACE_LOCATIONS, ...OFFICIAL_LOCATIONS];

export const BIRTH_LOCATIONS: BirthLocation[] = SEARCHABLE_LOCATIONS.map(
  ({ name: _name, searchTerms: _searchTerms, ...location }) => location
);

const LOCATION_BY_ID = new Map(
  SEARCHABLE_LOCATIONS.map((location) => [location.id, location])
);

const LOCATION_BY_EXACT_TERM = new Map<string, SearchableBirthLocation[]>();
for (const location of SEARCHABLE_LOCATIONS) {
  for (const term of location.searchTerms) {
    const matches = LOCATION_BY_EXACT_TERM.get(term) ?? [];
    matches.push(location);
    LOCATION_BY_EXACT_TERM.set(term, matches);
  }
}

// 선택 완료 후 보정값을 즉시 찾는 정적 해시 테이블입니다.
export const LOCATION_CORRECTION_BY_ID = new Map(
  SEARCHABLE_LOCATIONS.map((location) => [location.id, location.correctionMinutes])
);

const LEVEL_PRIORITY: Record<SearchableBirthLocation["level"], number> = {
  place: 0,
  sido: 1,
  sgg: 2,
  emd: 3,
};

function getSearchRank(location: SearchableBirthLocation, query: string) {
  const exactTerm = location.searchTerms.some((term) => term === query);
  if (exactTerm) return LEVEL_PRIORITY[location.level];

  const startsWithTerm = location.searchTerms.some((term) => term.startsWith(query));
  if (startsWithTerm) return 10 + LEVEL_PRIORITY[location.level];

  const includesTerm = location.searchTerms.some((term) => term.includes(query));
  return includesTerm ? 20 + LEVEL_PRIORITY[location.level] : Infinity;
}

export function searchBirthLocations(value: string, limit = 8): BirthLocation[] {
  const query = normalizeLocationInput(value);
  if (!query) return [];

  const exactMatches = LOCATION_BY_EXACT_TERM.get(query);
  const candidates = exactMatches ?? SEARCHABLE_LOCATIONS;

  return candidates
    .map((location) => ({ location, rank: getSearchRank(location, query) }))
    .filter((item) => Number.isFinite(item.rank))
    .sort(
      (left, right) =>
        left.rank - right.rank ||
        left.location.label.length - right.location.label.length ||
        left.location.label.localeCompare(right.location.label, "ko")
    )
    .slice(0, limit)
    .map(({ location: { name: _name, searchTerms: _searchTerms, ...location } }) => location);
}

function withInput(
  location: SearchableBirthLocation,
  input: string | null,
  matched: boolean
): BirthLocation {
  const { name: _name, searchTerms: _searchTerms, ...publicLocation } = location;
  return {
    ...publicLocation,
    input: input?.trim() || location.label,
    matched,
  };
}

export function getBirthLocation(value: string | null): BirthLocation {
  const fallback = LOCATION_BY_ID.get(DEFAULT_BIRTH_LOCATION_ID) ?? SEARCHABLE_LOCATIONS[0];
  const rawInput = value?.trim() || fallback.label;

  const byId = LOCATION_BY_ID.get(rawInput);
  if (byId) return withInput(byId, rawInput, true);

  const match = searchBirthLocations(rawInput, 1)[0];
  if (match) {
    const searchable = LOCATION_BY_ID.get(match.id);
    if (searchable) return withInput(searchable, rawInput, true);
  }

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
  correctionMinutes: mappedCorrectionMinutes,
}: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  longitude: number;
  correctionMinutes?: number;
}) {
  const correctionMinutes =
    mappedCorrectionMinutes ?? getLongitudeCorrectionMinutes(longitude);
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
