import {
	Avatar,
	Box,
	Button,
	Collapse,
	Flex,
	Icon,
	LinkBox,
	LinkOverlay,
	Text,
	VStack
} from "@chakra-ui/react";
import { CaretDown, CaretUp, Chat } from "@phosphor-icons/react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "timeago.js";
import {
	getMemeComments,
	GetUserByIdResponse,
	MemeResponse
} from "../../api";
import { CommentSection } from "./comment-section";
import { useAuthToken } from "../../contexts/authentication";
import { formatDateToLocalTimezone, getCachedUserById } from "../../helpers/helper";
import { MemePicture } from "../meme-picture";

type MemeWithAuthor = MemeResponse & {
	author: GetUserByIdResponse;
};
type MemeWithAuthorProps = {
	meme: MemeWithAuthor;
};

export const Meme: React.FC<MemeWithAuthorProps> = ({ meme }) => {
	const queryClient = useQueryClient();
	const token = useAuthToken();

	const [openedCommentSection, setOpenedCommentSection] = useState<boolean>(false);

	// fetch comments page by page when needed
	const {
		data: commentsData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ["comments", meme.id],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await getMemeComments(token, meme.id, pageParam);

			// Fetch author for each comment in parallel and leverage Tanstack Query's cache
			const commentsWithAuthors = await Promise.all(
				response.results.map(async (comment) => {
					const author = await getCachedUserById(queryClient, token, comment.authorId);
					return { ...comment, author };
				})
			);

			const totalPages = Math.ceil(response.total / response.pageSize);
			return {
				...response,
				results: commentsWithAuthors,
				page: pageParam,
				totalPages: totalPages,
			};
		},
		getNextPageParam: (lastPage: { page: number; totalPages: number }) => {
			const nextPage = lastPage.page + 1;
			return nextPage <= lastPage.totalPages ? nextPage : undefined;
		},
		initialPageParam: 1,
		enabled: !!openedCommentSection, // Load comments only when the comment section is opened
	});

	return (
		<VStack key={meme.id} p={4} width="full" align="stretch">
			<Flex justifyContent="space-between" alignItems="center">
				<Flex>
					<Avatar
						borderWidth="1px"
						borderColor="gray.300"
						size="xs"
						name={meme.author.username}
						src={meme.author.pictureUrl}
					/>
					<Text ml={2} data-testid={`meme-author-${meme.id}`}>
						{meme.author.username}
					</Text>
				</Flex>
				<Text fontStyle="italic" color="gray.500" fontSize="small">
					{format(formatDateToLocalTimezone(meme.createdAt))}
				</Text>
			</Flex>
			<MemePicture
				pictureUrl={meme.pictureUrl}
				texts={meme.texts}
				isDraggable={false}
				dataTestId={`meme-picture-${meme.id}`}
			/>
			<Box>
				<Text fontWeight="bold" fontSize="medium" mb={2}>
					Description:{" "}
				</Text>
				<Box
					p={2}
					borderRadius={8}
					border="1px solid"
					borderColor="gray.100"
				>
					<Text
						color="gray.500"
						whiteSpace="pre-line"
						data-testid={`meme-description-${meme.id}`}
					>
						{meme.description}
					</Text>
				</Box>
			</Box>
			<LinkBox as={Box} py={2} borderBottom="1px solid black">
				<Flex justifyContent="space-between" alignItems="center">
					<Flex alignItems="center">
						<LinkOverlay
							data-testid={`meme-comments-section-${meme.id}`}
							cursor="pointer"
							onClick={() => setOpenedCommentSection(!openedCommentSection)}
						>
							<Text data-testid={`meme-comments-count-${meme.id}`}>
								{meme.commentsCount} comment{meme.commentsCount > 1 && "s"}
							</Text>
						</LinkOverlay>
						<Icon
							as={openedCommentSection ? CaretUp : CaretDown}
							ml={2}
							mt={1}
						/>
					</Flex>
					<Icon as={Chat} />
				</Flex>
			</LinkBox>
			<Collapse in={openedCommentSection} animateOpacity>
				<CommentSection
					memeId={meme.id}
					comments={
						commentsData?.pages.flatMap((page) => page.results) || []
					}
				/>
				{hasNextPage && (
					<Box textAlign="center" mt={4}>
						<Button
							onClick={() => fetchNextPage()}
							disabled={isFetchingNextPage}
							colorScheme="blue"
						>
							{isFetchingNextPage ? "Loading more..." : "Load more comments"}
						</Button>
					</Box>
				)}
			</Collapse>
		</VStack>
	);
};