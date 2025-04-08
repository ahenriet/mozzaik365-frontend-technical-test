import {
  Box,
  Button,
  Flex,
  StackDivider,
  Text,
  VStack
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import {
  getMemes,
  getUserById,
  GetUserByIdResponse,
  MemeResponse
} from "../../api";
import { Loader } from "../../components/loader";
import { Meme } from "../../components/meme";
import { useAuthToken } from "../../contexts/authentication";

type MemeWithAuthor = MemeResponse & {
  author: GetUserByIdResponse;
};

export const MemeFeedPage: React.FC = () => {
  const queryClient = useQueryClient();
  const token = useAuthToken();
  const [page, setPage] = useState(1);

  const getCachedUserById = async (userId: string): Promise<GetUserByIdResponse> => {
    const cachedUser = queryClient.getQueryData<GetUserByIdResponse>(["user", userId]);

    // fetch user only if not cached
    return cachedUser ||
      (await queryClient.fetchQuery({
        queryKey: ["user", userId],
        queryFn: () => getUserById(token, userId)
      }
      ));
  }

  // fetch memes with authors
  const { isLoading, data: memesData, error } = useQuery({
    queryKey: ["memes", page],
    queryFn: async () => {
      const response = await getMemes(token, page);

      // fetch author for each meme in parallel and leverage Tanstack Query's cache
      const memesWithAuthors = await Promise.all(
        response.results.map(async (meme) => {
          const author = await getCachedUserById(meme.authorId);
          return { ...meme, author };
        })
      );

      return { ...response, results: memesWithAuthors };
    },
  });

  const handleLoadMore = useCallback(() => {
    setPage(page + 1);
  }, []);

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
        {memesData?.results.map((meme: MemeWithAuthor) => <Meme key={meme.id} meme={meme} />)}
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
