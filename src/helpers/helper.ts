import { QueryClient } from "@tanstack/react-query";
import { GetUserByIdResponse, getUserById } from "../api";

/**
 * Fetches user by ID and caches the result using Tanstack Query.
 * If the user is already cached, it returns the cached user.
 * This helper allows to 
 * @param queryClient - The Tanstack Query client instance.
 * @param token - The authentication token.
 * @param userId - The ID of the user to fetch.
 * @returns A promise that resolves to the user data.
 */
export const getCachedUserById = async (queryClient: QueryClient, token: string, userId: string): Promise<GetUserByIdResponse> => {
	const cachedUser = queryClient.getQueryData<GetUserByIdResponse>(["user", userId]);

	// fetch user only if not cached
	return cachedUser ||
		(await queryClient.fetchQuery({
			queryKey: ["user", userId],
			queryFn: () => getUserById(token, userId)
		}
		));
}