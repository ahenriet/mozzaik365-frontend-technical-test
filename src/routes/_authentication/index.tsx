import {
  Box,
  Button,
  Flex,
  StackDivider,
  Text,
  VStack
} from "@chakra-ui/react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import {
  getMemes,
  getUserById,
  GetUserByIdResponse,
  MemeResponse
} from "../../api";
import { Loader } from "../../components/loader";
import { Meme } from "../../components/feed/meme";
import { useAuthToken } from "../../contexts/authentication";
import { getCachedUserById } from "../../helpers/helper";

type MemeWithAuthor = MemeResponse & {
  author: GetUserByIdResponse;
};

export const MemeFeedPage: React.FC = () => {
  const queryClient = useQueryClient();
  const token = useAuthToken();

  // fetch memes with authors using useInfiniteQuery
  const {
    data: memesData,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["memes"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getMemes(token, pageParam);
      if (!response) {
        throw new Error("Failed to fetch memes");
      } 
      // fetch author for each meme in parallel and leverage Tanstack Query's cache
      const memesWithAuthors = await Promise.all(
        response.results.map(async (meme) => {
          const author = await getCachedUserById(queryClient, token, meme.authorId);
          return { ...meme, author };
        })
      );

      const totalPages = Math.ceil(response.total / response.pageSize);
      return { ...response, results: memesWithAuthors, page: pageParam, totalPages: totalPages };
    },
    getNextPageParam: (lastPage: { page: number; totalPages: number }) => {
      const nextPage = lastPage.page + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  const handleLoadMore = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  if (isFetching && !memesData) {
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
        {memesData?.pages.map((page) =>
          page.results.map((meme: MemeWithAuthor) => <Meme key={meme.id} meme={meme} />)
        )}
        {hasNextPage && (
          <Button
            onClick={handleLoadMore}
            colorScheme="blue"
            mt={4}
            isLoading={isFetchingNextPage}
          >
            Load More
          </Button>
        )}
      </VStack>
    </Flex>
  );
};

export const Route = createFileRoute("/_authentication/")({
  component: MemeFeedPage,
});
