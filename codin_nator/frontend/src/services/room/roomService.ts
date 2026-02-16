/**
 * Room API 서비스 (roomService.ts)
 *
 * [역할]
 * - 방(Room) 관련 백엔드 API 호출을 담당하는 서비스 모듈
 * - 컴포넌트에서 직접 axios를 호출하지 않고, 이 서비스를 통해 API를 호출함
 *   → "관심사 분리(Separation of Concerns)" 패턴
 *
 * [핵심 개념: 서비스 패턴]
 * - API 호출 로직을 별도 파일로 분리하면:
 *   1) 컴포넌트는 UI에만 집중 가능
 *   2) API URL이 변경되어도 이 파일만 수정하면 됨
 *   3) 여러 컴포넌트에서 같은 API를 재사용 가능
 *
 * [핵심 개념: async/await]
 * - JavaScript에서 비동기 작업(네트워크 요청 등)을 동기적으로 보이게 작성하는 문법
 * - async 함수 안에서 await 키워드를 사용하면 Promise가 완료될 때까지 기다림
 * - 내부적으로는 Promise 기반이지만, 코드 가독성이 훨씬 좋아짐
 *
 * [핵심 개념: Promise<T>]
 * - 비동기 작업의 "미래 결과"를 나타내는 객체
 * - Promise<number>는 "나중에 number 타입 값을 돌려주겠다"는 약속
 */

import axiosInstance from "@/services/api/axios";
import { ROOM_ENDPOINTS } from "@/services/api/endpoints";
import type { CreateRoomRequest } from "@/types/home";

// roomService 객체: 방 관련 API 메서드를 모아놓은 서비스
export const roomService = {
  /**
   * 방 생성 API 호출
   * - POST 요청으로 방 생성 데이터를 서버에 전달
   * - 성공 시 생성된 roomId(숫자)를 반환
   *
   * @param request - 방 생성에 필요한 데이터 (방 제목, 설정 등)
   * @returns Promise<number> - 서버가 생성한 방 ID
   */
  async createRoom(request: CreateRoomRequest): Promise<number> {
    // axiosInstance.post<number>: POST 요청을 보내고, 응답 데이터가 number 타입임을 명시
    // 구조 분해 할당으로 response.data만 꺼냄 → { data }
    const { data } = await axiosInstance.post<number>(ROOM_ENDPOINTS.CREATE, request);
    return data;
  },
};
