# Meme feed code review

### Code structure
The first thing I noticed is that the component handles too much stuff, and that it's very long (140 lines only for the JSX).
This a sign I should think about extracting some parts of it to dedicated components.


### Performance issues
There are several reasons why the meme feed doesn't work properly:

1. All memes and all comments are fetched on each render of the page.

From a business point of view it's not needed because the user can only see a few memes at the same time, so we can just load a few memes and then more, later on, if needed.
From a technical point of view, it causes performance issues making the app unusable because too many requests are sent to the API.
Also, the API provides a pagination feature that the UI doesn't 

2. All memes and comments are fetched in sequence (`await` everywhere...), that is why the page takes a very long time to load.
Each meme's comments are fetched one by one, and for each comment, the author is fetched separately.

3. A lot of data is fetched multiple times, like if a given user is the author of n comments, it is fetched n times without any caching mechanism 

4. When a comment is added, it is not displayed until the page is refreshed


## What I did to address them

### Code structure
I extracted the comment section and its `commentContent` state to a dedicated component
I also extracted the comment to a dedicated component

### Performance issues
1. I now fetch memes page by page, so I introduced a Load more button at the bottom of the feed
Also, the comments


3. A given user can be fetched a lot of times: once for each meme they created + once for each comment they added + if they are the logged in user, I decided to leverage Tanstack query's caching mecanism.
To do so, I introduced the useUser hook that caches the user data for (arbitrarily) 15 minutes.

4. The issue here was that the query to fetch the comments of a given meme was not invalidated after a comment was added.
To address this issue, I decided to leverage Tanstack Query's optimistic update mechanism.
Now, when a comment is added, it is optimistically updated in the cache of the query that fetches the comments (and rolled back if an error occurs).
Then, as the comment section uses the useQuery hook, it gets the optimistically updated comments as a prop and the user can
see its comment right away (no need to wait for the request to complete).

## Recommendations
1. **Parallelize Network Requests**:
   - Use `Promise.all` to fetch memes and their comments in parallel to reduce the overall loading time.

2. **Implement Caching**:
   - Cache user details to avoid redundant network requests for the same data.

3. **Implement Pagination**:
   - Fetch memes and comments in paginated requests to reduce the amount of data being loaded at once and improve the user experience.
