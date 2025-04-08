import { useQuery } from "@tanstack/react-query";
import { getUserById } from "../api";
import { useAuthentication } from "../contexts/authentication";

export const useLoggedInUser = () => {
  const { state } = useAuthentication();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", state.isAuthenticated ? state.userId : "anon"],
    queryFn: () => {
      if (state.isAuthenticated) {
        return getUserById(state.token, state.userId);
      }
      return null;
    },
    enabled: state.isAuthenticated,
  });

  return { user, isLoading };
};