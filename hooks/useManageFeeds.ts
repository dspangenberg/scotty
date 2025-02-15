import { db } from '@/lib/db'
import { useCallback } from 'react'

interface FeedData {
  name: string
  url: string
  category_id: number
  fav_icon: string
}

export function useManageFeeds() {
  const addFeedIfNotExists = useCallback(async (feedData: FeedData) => {
    try {
      // @ts-ignore
      const existingEntry = await db.feeds.where('url').equals(feedData.url).first()

      if (!existingEntry) {
        console.log(`Adding ${feedData.name} feed to the database`)
        // @ts-ignore
        await db.feeds.add(feedData)
        return true // Indicates that a new feed was added
      }

      return false // Indicates that the feed already existed
    } catch (error) {
      console.error('Error managing feed:', error)
      throw error
    }
  }, [])

  return { addFeedIfNotExists }
}
