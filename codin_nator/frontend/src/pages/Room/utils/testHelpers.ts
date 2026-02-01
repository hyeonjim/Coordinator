import type { CreateTestHelpersParams } from "@/types/room/types";

// 테스트 유저 상수
export const TEST_USER_ID = "test_user_001";
export const TEST_USER_NAME = "테스트 유저";
export const TEST_USER_IMAGE = "https://github.com/identicons/jasonlong.png"; // 테스트용 이미지

/**
 * 테스트/디버그 헬퍼 함수 생성
 * 개발 환경에서 UI 테스트를 위한 시뮬레이션 함수들을 제공합니다.
 *
 * @param params - 헬퍼 생성에 필요한 파라미터
 * @returns 테스트 헬퍼 함수들
 */
export function createTestHelpers({
  addParticipant,
  webRTC,
}: CreateTestHelpersParams) {
  /**
   * 테스트 유저 입장 시뮬레이션
   */
  const simulateTestUserJoin = () => {
    addParticipant(TEST_USER_ID, TEST_USER_NAME, TEST_USER_IMAGE);
  };

  /**
   * 상대방 음성 시뮬레이션
   */
  const simulateIncomingAudio = () => {
    webRTC.simulateIncomingAudio(TEST_USER_ID);
  };

  return {
    simulateTestUserJoin,
    simulateIncomingAudio,
  };
}
