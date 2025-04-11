import { QueryClient } from "@tanstack/react-query";
import { GetUserByIdResponse, getUserById } from "../api";

/**
 * Fetches user by ID and caches the result using Tanstack Query.
 * If the user is already cached, it returns the cached user.
 * This helper allows to leverage Tanstack Query's caching mechanism even when called in another hook.
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

/**
 * Formats a date to the user's local timezone.
 * This is a workaround since timeago.js does not support timezone formatting.
 * @param dateAsString - The stringified date to format.
 * @returns The formatted date.
 */
export const formatDateToLocalTimezone = (dateAsString: string): Date => {
	const date = new Date(dateAsString);
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}

/**
 * Converts a date to UTC by adding the timezone offset.
 * @param date - The date to convert.
 * @returns the Date object in UTC.
 */
export const convertDateToUTC = (date: Date): Date => {
	return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
}