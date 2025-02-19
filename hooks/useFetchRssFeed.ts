import { db } from '@/lib/db'
import { useCallback } from 'react'
import { useManageFeeds } from './useManageFeeds'

export function useFetchRssFeed() {
  const { addFeedIfNotExists } = useManageFeeds()

  return useCallback(async () => {
    try {
      // Fetch all feeds from the database
      await addFeedIfNotExists({
        name: 'Tagesschau',
        url: 'https://www.tagesschau.de/index~rss2.xml',
        category_id: 1,
        fav_icon: 'https://www.tagesschau.de/favicon.ico'
      })

      await addFeedIfNotExists({
        name: 'ZDF.heute',
        url: 'https://www.zdf.de/rss/zdf/nachrichten',
        category_id: 1,
        fav_icon: 'https://www.zdf.de/nachrichten/_next/static/media/favicon.016678b8.ico'
      })

      await addFeedIfNotExists({
        name: 'sz.de',
        url: 'https://rss.sueddeutsche.de/rss/Topthemen',
        category_id: 1,
        fav_icon: 'https://www.sueddeutsche.de/szde-assets/img/favicon-32x32.png'
      })

      await addFeedIfNotExists({
        name: 'T-Online.de',
        url: 'https://www.t-online.de/feed.rss',
        category_id: 1,
        fav_icon: 'https://www.t-online.de/favicon.ico'
      })

      await addFeedIfNotExists({
        name: 'General Anzeiger Bonn',
        url: 'https://ga.de/feed.rss',
        category_id: 2,
        fav_icon: 'https://ga.de/assets/skins/general-anzeiger-bonn/favicon.ico?v=1738741052'
      })

      const feeds = await db.feeds.toArray()

      for (const feed of feeds) {
        // Fetch RSS feed for each feed in the database

        const response = await fetch(`/api/feed?url=${encodeURIComponent(feed.url)}`)
        if (!response.ok) {
          console.error(`Failed to fetch feed: ${feed.name}`)
          continue
        }
        const data = await response.json()

        // Process feed items

        let newItems = 0

        for (const item of data) {
          const existingEntry = await db.feedItems.where('link').equals(item.link).first()
          if (!existingEntry) {
            newItems++
            await db.feedItems.add({
              feed_id: feed.id || 0,
              org_id: item.id || '',
              title: item.title || '',
              link: item.link || '',
              pub_date: item.published,
              description: item.description || ''
            })
          }
        }
        console.log(`Fetching feed: ${feed.name} ${newItems} new items added.`)
      }
    } catch (error) {
      console.error('Error fetching RSS feeds:', error)
    }
  }, [addFeedIfNotExists])
}
