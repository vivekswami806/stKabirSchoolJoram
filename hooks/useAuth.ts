import { RootState } from "@/action/store";
import { useSelector } from "react-redux";

export const useAuth = () => {
  const user = useSelector((state: RootState) => state.user);

  return {
    isAuthenticated:
      user.isLoggedIn &&
      !!user.token &&
      !!user.userDetail &&
      !user.isProfileLoading,

    token: user.token,
    user: user.userDetail,
    role: user.role,
    isLoading: user.isProfileLoading,
  };
};
