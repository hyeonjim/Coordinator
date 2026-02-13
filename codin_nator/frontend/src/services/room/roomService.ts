import axiosInstance from "@/api/axios";
import type { CreateRoomRequest } from "@/types/home/types";

const API_ENDPOINTS = {
  CREATE_ROOM: "/v1/room",
} as const;

export const roomService = {
  /**
   * 방 생성
   * - 성공 시 생성된 roomId 반환
   */
  async createRoom(request: CreateRoomRequest): Promise<number> {
    const { data } = await axiosInstance.post<number>(API_ENDPOINTS.CREATE_ROOM, request);
    return data;
  },
};
