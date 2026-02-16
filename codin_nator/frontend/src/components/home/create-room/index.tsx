/**
 * CreateRoomModal - 방 생성 모달 (제목 + 브랜치 입력)
 *
 * [React 기초 - 모달 패턴]
 * - 배경(overlay) 클릭 시 onClose → 모달 닫기
 * - event.stopPropagation(): 모달 내부 클릭이 배경 클릭으로 전파되지 않게 방지
 * - 이 패턴으로 "배경 클릭 = 닫기, 내용 클릭 = 유지" 동작 구현
 *
 * [React 기초 - 제어 컴포넌트 (Controlled Component)]
 * - input의 value를 state로 관리하고, onChange로 state를 업데이트
 * - React가 input의 값을 완전히 제어 → "제어 컴포넌트"
 * - 장점: 입력값 검증, 포맷팅, 실시간 반영이 쉬움
 *
 * [사용된 기술]
 * - useNavigate: 방 생성 후 해당 방으로 자동 이동
 * - roomService: 방 생성 API 호출 서비스
 */
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { CreateRoomModalProps } from "@/types/home";
import { roomService } from "@/services/room/roomService";

export default function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const navigate = useNavigate();
  // 제어 컴포넌트: input 값을 useState로 관리
  const [roomTitle, setRoomTitle] = useState("");
  const [branchName, setBranchName] = useState("");

  // 방 생성 핸들러: API 호출 후 생성된 방으로 이동
  const handleCreateRoom = async () => {
    try {
      const roomId = await roomService.createRoom({ name: roomTitle, branch: branchName });
      navigate(`/room/${roomId}`);
    } catch {
      //
    }
  };

  return (
    // 오버레이: 배경 클릭 시 onClose 호출하여 모달 닫기
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* stopPropagation: 모달 내부 클릭이 배경의 onClick으로 전파되지 않게 방지 */}
      <div
        className="relative w-full max-w-xl bg-[#d8e4f1] rounded-2xl p-8 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-xl text-gray-400 hover:text-gray-700">
          ✕
        </button>

        <h2 className="text-lg font-semibold text-gray-800 mb-1">프로젝트 정보</h2>
        <p className="text-sm text-gray-500 mb-6">협업 방의 기본 정보를 입력해주세요.</p>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">방 제목 <span className="text-red-500">*</span></label>
            <input
              placeholder="방 이름을 입력하세요."
              value={roomTitle}
              onChange={(event) => setRoomTitle(event.target.value)}
              className="w-full h-10 px-3 border bg-slate-50 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">브랜치 <span className="text-red-500">*</span></label>
            <input
              placeholder="기존 브랜치 or 새로 생성할 브랜치"
              value={branchName}
              onChange={(event) => setBranchName(event.target.value)}
              className="w-full h-10 px-3 border bg-slate-50 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-gray-400"
            />
          </div>

          <button
            onClick={handleCreateRoom}
            className="w-full h-11 mt-2 bg-white text-gray-900 font-medium border border-gray-200 rounded-xl hover:bg-[#e9ddec] transition-colors shadow-sm"
          >
            방 생성하기
          </button>
        </div>
      </div>
    </div>
  );
}
