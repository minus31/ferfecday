// 이전 생성 경로에서도 로그인, 소유권, 결제 검증을 동일하게 적용한다.
import { handleService } from "../lib/server/service";
export { isAllowedOrigin } from "../lib/server/service";
export {
  resolveAIProvider,
  extractResponseJson,
  PRODUCT_INSTRUCTIONS,
} from "../lib/server/generation";
export default { fetch: handleService };
