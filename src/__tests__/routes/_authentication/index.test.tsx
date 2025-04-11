import { screen, waitFor } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { AuthenticationContext } from "../../../contexts/authentication";
import { MemeFeedPage } from "../../../routes/_authentication/index";
import { renderWithRouter } from "../../utils";
import { fireEvent } from "@testing-library/react";

describe("routes/_authentication/index", () => {
  describe("MemeFeedPage", () => {
    function renderMemeFeedPage() {
      return renderWithRouter({
        component: MemeFeedPage,
        Wrapper: ({ children }) => (
          <ChakraProvider>
            <QueryClientProvider client={new QueryClient()}>
              <AuthenticationContext.Provider
                value={{
                  state: {
                    isAuthenticated: true,
                    userId: "dummy_user_id",
                    token: "dummy_token",
                  },
                  authenticate: () => { },
                  signout: () => { },
                }}
              >
                {children}
              </AuthenticationContext.Provider>
            </QueryClientProvider>
          </ChakraProvider>
        ),
      });
    }

    it("should fetch the memes, display them with their comments and add a comment", async () => {
      renderMemeFeedPage();

      await waitFor(() => {
        // We check that the right author's username is displayed
        expect(screen.getByTestId("meme-author-dummy_meme_id_1")).toHaveTextContent('dummy_user_1');

        // We check that the right meme's picture is displayed
        expect(screen.getByTestId("meme-picture-dummy_meme_id_1")).toHaveStyle({
          'background-image': 'url("https://dummy.url/meme/1")',
        });

        // We check that the right texts are displayed at the right positions
        const text1 = screen.getByTestId("meme-picture-dummy_meme_id_1-text-0");
        const text2 = screen.getByTestId("meme-picture-dummy_meme_id_1-text-1");
        expect(text1).toHaveTextContent('dummy text 1');
        expect(text1).toHaveStyle({ 'transform': 'translate(0px,0px)' });
        expect(text2).toHaveTextContent('dummy text 2');
        expect(text2).toHaveStyle({ 'transform': 'translate(100px,100px)' });

        // We check that the right description is displayed
        expect(screen.getByTestId("meme-description-dummy_meme_id_1")).toHaveTextContent('dummy meme 1');

        // We check that the right number of comments is displayed
        expect(screen.getByTestId("meme-comments-count-dummy_meme_id_1")).toHaveTextContent('3 comments');

        // We check that the right comments with the right authors are displayed
        fireEvent.click(screen.getByTestId("meme-comments-section-dummy_meme_id_1")); // with my changes, we now have to click on the comment section to load the comments
        expect(screen.getByTestId("meme-comment-content-dummy_meme_id_1-dummy_comment_id_1")).toHaveTextContent('dummy comment 1');
        expect(screen.getByTestId("meme-comment-author-dummy_meme_id_1-dummy_comment_id_1")).toHaveTextContent('dummy_user_1');

        expect(screen.getByTestId("meme-comment-content-dummy_meme_id_1-dummy_comment_id_2")).toHaveTextContent('dummy comment 2');
        expect(screen.getByTestId("meme-comment-author-dummy_meme_id_1-dummy_comment_id_2")).toHaveTextContent('dummy_user_2');

        expect(screen.getByTestId("meme-comment-content-dummy_meme_id_1-dummy_comment_id_3")).toHaveTextContent('dummy comment 3');
        expect(screen.getByTestId("meme-comment-author-dummy_meme_id_1-dummy_comment_id_3")).toHaveTextContent('dummy_user_3');
      });

      // We add a comment
      await waitFor(() => {
        fireEvent.change(screen.getByTestId("meme-comment-input-dummy_meme_id_1"), { target: { value: "new dummy comment" } });
        fireEvent.submit(screen.getByTestId("meme-comment-form-dummy_meme_id_1"));
      });

      await waitFor(() => {
        // And check that the new comment is displayed
        expect(screen.getByTestId("meme-comment-content-dummy_meme_id_1-dummy_comment_id_4")).toHaveTextContent('new dummy comment');
        expect(screen.getByTestId("meme-comment-author-dummy_meme_id_1-dummy_comment_id_4")).toHaveTextContent('dummy_user_1');
      });
    });
  });
});
