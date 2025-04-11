# Meme feed code review

### Code structure
The first thing I noticed is that the component handles too much (loading memes, comments and users), and that it's very long: 140 lines only for the JSX.
This a sign I should think about extracting some parts of it to dedicated components.


### Performance issues
There are several reasons why the meme feed doesn't work properly:

1. All memes, all comments and their authors are fetched on each render of the page.

From a business point of view it's not needed because the user can only see a few memes at the same time, so we can just load a few memes and then more, later on, if needed.
From a technical point of view, it causes performance issues making the app unusable because too many requests are sent to the API.
Also, the API provides a pagination feature that the UI doesn't take advantage of.

2. Memes, comments and users are fetched in sequence (`await` everywhere...), that is why the page takes a very long time to load.

3. A lot of data is fetched multiple times, like if a given user is the author of n comments, it is fetched n times from the API. Again, we should leverage the cache here. 

4. When a comment is added, it is not displayed until the page is refreshed.
This happens because the query for the comments of the meme is not invalidated after a comment is added. This could be solved using an optimistic update: modifying the query data before sending the request (and rollback if necessary).

5. If the browser's time zone is not UTC, the time displayed for meme's and comment's creation
is wrong. For example, my browser is in UTC+2, so when I add a meme, it's displayed as "2 hours ago".

### Nice-to-have feature
When an error occurs, nothing is displayed to warn the user.
We could use the useToast hook from Chakra UI.


## What I did to address them

### Code structure
I extracted some components: 
- a Meme component that contains the picture and the comment section. It fetches comments when the comment section is open
- a CommentSection component that handles comment creation
- a Comment component that displays the comment along with the user's avatar and the creation time

The MemeFeedPage component now only deals with fetching the memes.

### Performance issues
1. I now fetch memes page by page, so I introduced a 'Load more' button at the bottom of the feed.
I also fetch comments page by page with a 'Load more comments' button.
The authors are now fetched in parallel and I leverage Tanstack query's cache.

NB: for an even better user experience, the loading of the memes could be further optimized by loading the next page when the user scrolls to the bottom of the page.
 
2. Comments are now loaded only when a comment section is open.
The authors are now fetched in parallel and I leverage Tanstack query's cache.

3. Users are now cached via the getCachedUserById helper.

NB: I introduced this helper since I can't use useQuery inside an other hook.

4. I implemented an optimistic update of the comments when a comment is added.
Now, when a comment is added, it is optimistically updated in the cache of the query that fetches the comments (and rolled back if an error occurs).

5. I fixed this by offsetting the time received from the server using Date.getTimezoneOffset().
(there are probably libraries to do this but I couldn't make it work with Luxon nor date-fns)

### Nice-to-have feature
I added error toasts for when a comment creation fails and when a meme creation fails.
I also added a warning toast when trying to create a meme without a picture or a description, and a success toast on meme creation (very nice-to-have but costs almost zero).