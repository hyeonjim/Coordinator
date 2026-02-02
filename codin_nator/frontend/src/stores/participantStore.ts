/**
 * 참여자 정보 관리 Zustand 스토어
 *
 * 문제 상황:
 * - 백엔드 DTO에는 userId만 있고 userName, imageUrl이 없음
 * - 하지만 UI에서는 사용자 이름과 프로필 이미지를 표시해야 함
 *
 * 해결 방법:
 * - 프론트엔드에서 Record<userId, UserInfo> 형태로 참여자 정보를 관리
 * - JOIN 메시지 수신 시 data 필드에서 userName, imageUrl 추출하여 저장
 * - 메시지 수신 시 userId로 사용자 정보 조회하여 UI에 표시
 *
 * 작동 흐름:
 * 1. 사용자A가 방에 입장 → JOIN 메시지 발송 (data에 userName, imageUrl 포함)
 * 2. 다른 사용자들이 JOIN 메시지 수신 → 스토어에 사용자A 정보 추가
 * 3. 사용자A가 채팅 메시지 발송 → sender에 userId만 포함
 * 4. 다른 사용자들이 메시지 수신 → sender(userId)로 스토어에서 정보 조회하여 표시
 */

import { create } from "zustand";
import type { UserInfo } from "@/types/chat/backendDto";

/**
 * 참여자 스토어 상태 타입
 */
interface ParticipantState {
  /**
   * 참여자 정보 맵 (userId를 key로 사용)
   *
   * 왜 Map이 아닌 Record를 사용하나?
   * - Zustand는 plain object를 선호 (직렬화 가능)
   * - immer 미들웨어 사용 시 더 나은 성능
   */
  participants: Record<string, UserInfo>;

  /**
   * 참여자 추가 또는 업데이트
   */
  addParticipant: (userInfo: UserInfo) => void;

  /**
   * 참여자 제거
   */
  removeParticipant: (userId: string) => void;

  /**
   * 참여자 정보 조회
   */
  getParticipant: (userId: string) => UserInfo | undefined;

  /**
   * 모든 참여자 정보 조회
   */
  getAllParticipants: () => UserInfo[];

  /**
   * 모든 참여자 제거 (방 퇴장 시)
   */
  clearParticipants: () => void;

  /**
   * 참여자 존재 여부 확인
   */
  hasParticipant: (userId: string) => boolean;

  /**
   * 참여자 수 조회
   */
  getParticipantCount: () => number;
}

/**
 * 참여자 정보 관리 스토어
 *
 * persist 미들웨어를 사용하지 않음 (세션 동안만 유지)
 */
export const useParticipantStore = create<ParticipantState>()((set, get) => ({
  // 초기 상태
  participants: {},

  // 참여자 추가 또는 업데이트
  addParticipant: (userInfo: UserInfo) => {
    set((state) => ({
      participants: {
        ...state.participants,
        [userInfo.userId]: userInfo,
      },
    }));
  },

  // 참여자 제거
  removeParticipant: (userId: string) => {
    set((state) => {
      const { [userId]: removed, ...rest } = state.participants;
      return { participants: rest };
    });
  },

  // 참여자 정보 조회
  getParticipant: (userId: string) => {
    return get().participants[userId];
  },

  // 모든 참여자 정보 조회
  getAllParticipants: () => {
    return Object.values(get().participants);
  },

  // 모든 참여자 제거
  clearParticipants: () => {
    set({ participants: {} });
  },

  // 참여자 존재 여부 확인
  hasParticipant: (userId: string) => {
    return userId in get().participants;
  },

  // 참여자 수 조회
  getParticipantCount: () => {
    return Object.keys(get().participants).length;
  },
}));
