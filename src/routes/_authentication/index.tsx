import {
  Avatar,
  Box,
  Button,
  Collapse,
  Flex,
  Icon,
  LinkBox,
  LinkOverlay,
  StackDivider,
  Text,
  VStack
} from "@chakra-ui/react";
import { CaretDown, CaretUp, Chat } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { jwtDecode } from "jwt-decode";
import { useCallback, useState } from "react";
import { format } from "timeago.js";
import {
  createMemeComment,
  getMemeComments,
  getMemes,
  getUserById,
  GetUserByIdResponse,
  Meme
} from "../../api";
import { CommentSection } from "../../components/comment-section";
import { Loader } from "../../components/loader";
import { MemePicture } from "../../components/meme-picture";
import { useAuthToken } from "../../contexts/authentication";

type MemeWithAuthor = Meme & {
  author: GetUserByIdResponse;
};

export const MemeFeedPage: React.FC = () => {
  const queryClient = useQueryClient();
  const token = useAuthToken();
  // const toast = useToast();
  const [page, setPage] = useState(1);
  const [openedCommentSectionMemeId, setOpenedCommentSectionMemeId] = useState<string | null>(null);

  const { isLoading, data: memesData, error } = useQuery({
    queryKey: ["memes", page],
    queryFn: async () => {
      const response = await getMemes(token, page);

      // Fetch author for each meme in parallel
      const memesWithAuthors = await Promise.all(
        response.results.map(async (meme) => {
          const author = await getUserById(token, meme.authorId);
          return { ...meme, author };
        })
      );

      return { ...response, results: memesWithAuthors };
    },
  });

  const { data: commentsData } = useQuery({
    queryKey: ["comments", openedCommentSectionMemeId],
    queryFn: async () => {
      const response = await getMemeComments(token, openedCommentSectionMemeId!, 1); // openedCommentSectionMemeId is never null thanks to the enabled option

      console.log("commentsData", response);
      // fetch author for each comment in parallel 
      const commentsWithAuthors = await Promise.all(
        response.results.map(async (comment) => {
          const author = await getUserById(token, comment.authorId);
          return { ...comment, author };
        }));
      return { ...response, results: commentsWithAuthors };
    },
    enabled: !!openedCommentSectionMemeId,  // load comments only when a comment section is opened
  });

  const handleLoadMore = useCallback(() => {
    setPage(page + 1);
  }, []);

  // fetch logged in user TODO move to comment section?
  const { data: loggedInUser } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      return await getUserById(token, jwtDecode<{ id: string }>(token).id);
    },
  });

  // add comment with optimistic updates
  const { mutate: createComment } = useMutation({
    mutationFn: async (data: { memeId: string; content: string }) => {
      return await createMemeComment(token, data.memeId, data.content);
    },
    onMutate: async (newComment) => {
      // Cancel any outgoing refetches for comments for the current meme
      await queryClient.cancelQueries({ queryKey: ["comments", newComment.memeId] });

      // Snapshot the previous comments for the current meme
      const previousComments = queryClient.getQueryData(["comments", newComment.memeId]);

      // Optimistically update the comments in the cache
      queryClient.setQueryData(["comments", newComment.memeId], (old: any) => {
        console.log("loggedInUser", loggedInUser);
        const optimisticComments = {
          ...old,
          total: (old?.total || 0) + 1, // Increment the total count of comments
          results: [
            {
              id: `temp-${Date.now()}`, // Temporary ID for the new comment, will be overwritten by the refetch in onSettled
              content: newComment.content,
              author: loggedInUser,
              createdAt: new Date().toISOString(),
            },
            ...(old?.results || []),
          ],
        };
        console.log("optimisticComments", optimisticComments);
        return optimisticComments
      });

      console.log("previousComments", previousComments);
      // Return the snapshot to rollback in case of an error
      return { previousComments };
    },
    onError: (_error, newComment, context) => {
      // Rollback to the previous comments in case of an error
      queryClient.setQueryData(["comments", newComment.memeId], context?.previousComments);

      // Optionally, show an error toast
      // toast({
      //   title: "Error adding comment",
      //   description: error instanceof Error ? error.message : "Please try again later",
      //   status: "error",
      //   duration: 5000,
      // });
    },
    onSettled: (newComment) => {
      // Refetch the comments to ensure the cache is up-to-date
      if (newComment) {
        queryClient.invalidateQueries({ queryKey: ["comments", newComment.memeId] });
      }
    },
  });
  // onSuccess: () => {
  //   toast({
  //     title: "Comment added successfully",
  //     status: "success",
  //     duration: 3000,
  //   });
  // },
  // onError: (error) => {
  //   toast({
  //     title: "Error adding comment",
  //     description: error instanceof Error ? error.message : "Please try again later",
  //     status: "error",
  //     duration: 5000,
  //   });
  // },

  if (isLoading && !memesData) {
    return <Loader data-testid="meme-feed-loader" />;
  }

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Text color="red.500">Error loading memes. Please try again later.</Text>
      </Box>
    );
  }

  return (
    <Flex width="full" height="full" justifyContent="center" overflowY="auto">
      <VStack
        p={4}
        width="full"
        maxWidth={800}
        divider={<StackDivider border="gray.200" />}
      >
        {memesData?.results.map((meme: MemeWithAuthor) => (
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
                <Text ml={2} data-testid={`meme-author-${meme.id}`}>{meme.author.username}</Text>
              </Flex>
              <Text fontStyle="italic" color="gray.500" fontSize="small">
                {format(meme.createdAt)}
              </Text>
            </Flex>
            <MemePicture pictureUrl={meme.pictureUrl} texts={meme.texts} dataTestId={`meme-picture-${meme.id}`} />
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
                <Text color="gray.500" whiteSpace="pre-line" data-testid={`meme-description-${meme.id}`}>
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
                    onClick={() => setOpenedCommentSectionMemeId(openedCommentSectionMemeId === meme.id ? null : meme.id)}
                  >
                    <Text data-testid={`meme-comments-count-${meme.id}`}>{meme.commentsCount} comments</Text>
                  </LinkOverlay>
                  <Icon
                    as={openedCommentSectionMemeId
                      !== meme.id ? CaretDown : CaretUp}
                    ml={2}
                    mt={1}
                  />
                </Flex>
                <Icon as={Chat} />
              </Flex>
            </LinkBox>
            <Collapse in={openedCommentSectionMemeId
              === meme.id} animateOpacity>
              <CommentSection
                memeId={meme.id}
                comments={commentsData?.results || []}
                user={loggedInUser}
                onSubmitComment={(content) =>
                  createComment({ memeId: meme.id, content })
                }
              />
            </Collapse>
          </VStack>
        ))}
        {memesData && memesData.total > memesData.results.length && (
          <Button onClick={handleLoadMore} colorScheme="blue" mt={4}>
            Load More
          </Button>
        )}
      </VStack>
    </Flex >
  );
};

export const Route = createFileRoute("/_authentication/")({
  component: MemeFeedPage,
});
