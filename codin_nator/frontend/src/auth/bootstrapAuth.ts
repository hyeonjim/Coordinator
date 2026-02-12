import { useAuthStore } from "@/stores/authStore";
import { decodeJwt } from "@/utils/token/decodeJwt";

export const bootstrapAuth = () => {
  const token = localStorage.getItem("access_token");

  if (!token) return useAuthStore.getState().logout();

  try {
    const { exp } = decodeJwt(token);
    if (!exp || Date.now() >= exp * 1000) {
      useAuthStore.getState().logout();
    }
  } catch {
    useAuthStore.getState().logout();
  }
};
