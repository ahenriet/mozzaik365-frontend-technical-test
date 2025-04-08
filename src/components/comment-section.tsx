import { Box, Flex, Avatar, Input, VStack, useToast } from "@chakra-ui/react";
import { useState } from "react";

import { MemeComment, GetUserByIdResponse, createMemeComment } from "../api";
import { Comment } from "./comment";
import { useLoggedInUser } from "../hooks/useLoggedInUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "../contexts/authentication";

export type CommentWithAuthor = MemeComment & { author: GetUserByIdResponse };

export const CommentSection: React.FC<{
	memeId: string;
	comments: CommentWithAuthor[];
}> = ({ memeId, comments }) => {
	const [commentContent, setCommentContent] = useState("");
	const token = useAuthToken();
	const queryClient = useQueryClient();
	const toast = useToast();

	const { user } = useLoggedInUser();

	// add comment with optimistic updates
	const { mutate: createComment } = useMutation({
		mutationFn: async (data: { memeId: string; content: string }) => {
			return await createMemeComment(token, data.memeId, data.content);
		},
		onMutate: async (newComment) => {
			// cancel any outgoing refetches for comments for the current meme
			await queryClient.cancelQueries({ queryKey: ["comments", newComment.memeId] });

			// snapshot the previous comments for the current meme to rollback in case of an error
			const previousComments = queryClient.getQueryData(["comments", newComment.memeId]);

			// optimistically update the comments in the cache
			queryClient.setQueryData(["comments", newComment.memeId], (old: any) => {
				return {
					...old,
					total: (old?.total || 0) + 1, // increment the total count of comments
					results: [
						{
							content: newComment.content,
							author: user,
							createdAt: new Date().toISOString(),
						},
						...(old?.results || []),
					],
				}
			});

			// return the snapshot to rollback in case of an error
			return { previousComments };
		},
		onError: (error, newComment, context) => {
			// rollback to the previous comments
			queryClient.setQueryData(["comments", newComment.memeId], context?.previousComments);

			toast({
				title: "Your comment could not be added",
				description: error instanceof Error ? error.message : "Please try again later",
				status: "error",
				duration: 5000,
			});
		},
		onSettled: (newComment) => {
			// refetch the comments to ensure the cache is up-to-date
			if (newComment) {
				queryClient.invalidateQueries({ queryKey: ["comments", newComment.memeId] });
			}
		},
	});

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (commentContent) {
			createComment({ memeId, content: commentContent });
			setCommentContent("");
		}
	};

	return (
		<Box mb={6}>
			<form onSubmit={handleSubmit} data-testid={`meme-comment-form-${memeId}`}>
				<Flex alignItems="center">
					<Avatar
						borderWidth="1px"
						borderColor="gray.300"
						name={user?.username}
						src={user?.pictureUrl}
						size="sm"
						mr={2}
					/>
					<Input
						placeholder="Type your comment here..."
						value={commentContent}
						onChange={(e) => setCommentContent(e.target.value)}
						data-testid={`meme-comment-input-${memeId}`}
					/>
				</Flex>
			</form>
			<VStack align="stretch" spacing={4} mt={4}>
				{comments.map((comment) => <Comment key={comment.id} memeId={memeId} comment={comment} />)}
			</VStack>
		</Box>
	);
};