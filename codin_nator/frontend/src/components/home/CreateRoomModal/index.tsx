import { useNavigate } from "react-router-dom";
import FormInput from "./components/FormInput";
import { useState } from "react";
import type { CreateRoomModalProps } from "@/types/home/creatRoomModal";
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
      const roomId = res.data;
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      className="
    fixed inset-0 z-50 flex items-center justify-center
    bg-black/20 backdrop-blur-sm
  "
      onClick={onClose}
    >
      <main
        className="
    relative
    w-full max-w-3xl
    max-h-[90vh]
    bg-[#EEF4FA]
    rounded-2xl
    p-6
    overflow-y-auto
    shadow-xl
  "
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 text-2xl"
        >
          ✕
        </button>
        <div className="mb-8 space-y-2 ">
          <div className="mb-6 space-y-2">
            <h2> 프로젝트 정보</h2>
            <h3>협업 방의 기본 정보를 입력해주세요.</h3>
          </div>
          <FormInput
            label="방 제목"
            placeholder="방 이름을 입력하세요."
            required
            value={roomTitle}
            onChange={(e) => setRoomTitle(e.target.value)}
          />

          <FormInput
            label="브랜치"
            placeholder="기존 브랜치 or 새로 생성할 브랜치"
            required
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
          />

          <button
            className="w-full h-14 bg-white text-lg font-medium text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            onClick={roomCreate}
          >
            방 생성하기
          </button>
        </div>
      </main>
    </div>
  );
}
