interface AuthState {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}
