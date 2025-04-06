import { Box, Flex, Avatar, Input, VStack } from "@chakra-ui/react";
import { useState } from "react";

import { MemeComment, GetUserByIdResponse } from "../api";
import { Comment } from "./comment";

export type CommentWithAuthor = MemeComment & { author: GetUserByIdResponse };

export const CommentSection: React.FC<{
	memeId: string;
	comments: CommentWithAuthor[];
	user: GetUserByIdResponse | undefined;
	onSubmitComment: (content: string) => void;
}> = ({ memeId, comments, user, onSubmitComment }) => {
	const [commentContent, setCommentContent] = useState("");

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (commentContent) {
			onSubmitComment(commentContent);
			setCommentContent("");
		}
	};

	return (
		<Box mb={6}>
			<form onSubmit={handleSubmit}>
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