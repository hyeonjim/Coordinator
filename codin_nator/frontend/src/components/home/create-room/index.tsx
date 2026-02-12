import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { CreateRoomModalProps } from "@/types/home/types";
import axiosInstance from "@/api/axios";

export default function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const navigate = useNavigate();
  const [roomTitle, setRoomTitle] = useState("");
  const [branchName, setBranchName] = useState("");

  const roomCreate = async () => {
    try {
      const res = await axiosInstance.post("/v1/room", {
        name: roomTitle,
        branch: branchName,
      });
      navigate(`/room/${res.data}`);
    } catch {
      //
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#d8e4f1] rounded-2xl p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
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
              onChange={(e) => setRoomTitle(e.target.value)}
              className="w-full h-10 px-3 border bg-slate-50 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">브랜치 <span className="text-red-500">*</span></label>
            <input
              placeholder="기존 브랜치 or 새로 생성할 브랜치"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full h-10 px-3 border bg-slate-50 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-gray-400"
            />
          </div>

          <button
            onClick={roomCreate}
            className="w-full h-11 mt-2 bg-white text-gray-900 font-medium border border-gray-200 rounded-xl hover:bg-[#e9ddec] transition-colors shadow-sm"
          >
            방 생성하기
          </button>
        </div>
      </div>
    </div>
  );
}
