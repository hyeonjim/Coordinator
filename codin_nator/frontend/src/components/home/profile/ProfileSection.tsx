import { motion } from "framer-motion";
import { LogOut, Github } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export default function ProfileSection() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/");
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl shadow-xl p-8 bg-[#e2e6eb]"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          {/* 프로필 이미지 */}
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.name || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#24292E] text-2xl font-semibold text-[#ECEAEA]">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-[#24292E]">
              {user?.name || "Unknown User"}
            </h2>
            <p className="text-sm text-[#586069]">
              {user?.email || "No email provided"}
            </p>
            {user?.gitId && (
              <div className="flex items-center gap-1.5 text-sm mt-2 text-[#586069]">
                <Github className="w-4 h-4" />
                <span>{user.gitId}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="
            group flex items-center gap-2 px-5 py-2.5
            rounded-lg font-medium text-sm
            shadow-sm
            transition-all duration-200
            bg-[#c4c9ce] hover:bg-[#d87a7a]
            text-[#24292E] hover:text-white
            border border-[#b4b9be] hover:border-[#d87a7a]
          "
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Logout
        </button>
      </div>
    </motion.div>
  );
}
