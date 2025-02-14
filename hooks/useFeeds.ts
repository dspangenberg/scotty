import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export interface FeedWithItems {
  id: number;
  name: string;
  url: string;
  category_id: number;
  fav_icon: string;
  items: FeedItem[];
}

export interface FeedItem {
  id?: number;
  feed_id: number;
  org_id: string;
  title: string;
  pub_date: string;
  link: string;
  description: string;
}

export function useFeeds() {
  const feedsWithItems = useLiveQuery(async () => {
    const feeds = await db.feeds.toArray();
    const feedsWithItems: FeedWithItems[] = await Promise.all(
      feeds.map(async (feed) => ({
        ...feed,
        items: await db.feedItems
          .where('feed_id')
          .equals(feed.id)
          .reverse()
          .sortBy('pub_date')
      }))
    );

    // Flatten and sort all items
    const allItems = feedsWithItems
      .flatMap(feed => feed.items.map(item => ({ ...item, feed })))
      .sort((a, b) => new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime())
      .slice(0, 10);

    return allItems;
  });

  return feedsWithItems || [];
}