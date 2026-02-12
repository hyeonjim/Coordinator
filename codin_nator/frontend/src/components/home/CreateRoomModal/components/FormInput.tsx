import type { FormInputProps } from "@/types/home/creatRoomModal/types";
import { useState } from "react";

//지라
export default function FormInput({
  label,
  placeholder,
  type = "text",
  required = false,
  note,
  value,
  onChange,
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 block mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full h-10 px-3 border border-gray-300 rounded-md
             focus:outline-none focus:ring-2 focus:ring-blue-500
             focus:border-transparent transition-all
             placeholder:text-gray-400 pr-10"
        />

        {/* 👇 비밀번호 타입일 때만 버튼 표시 */}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5"
          >
            {/* 조건: showPassword가 참(보임)이면 -> 눈 뜬 이미지
               거짓(숨김)이면 -> 눈 감은 이미지 
            */}
            {showPassword ? (
              <img src="/icons/eye-on.png" alt="숨기기" className="w-5 h-5" />
            ) : (
              <img src="/icons/eye-off.png" alt="보기" className="w-5 h-5" />
            )}

            {/* 💡 만약 이미지가 아직 없다면? 일단 글자로라도 나오게 하세요! */}
            <span className="text-xs text-gray-500">
              {showPassword ? "숨기기" : "보기"}
            </span>
          </button>
        )}
      </div>

      {note && <p className="text-xs text-gray-500">{note}</p>}
    </div>
  );
}
