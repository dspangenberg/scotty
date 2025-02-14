'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { FeedItem } from '@/hooks/useFeeds'
import { useFetchRssFeed } from '@/hooks/useFetchRssFeed'
import { useInterval } from '@/hooks/useInterval'
import { db } from '@/lib/db'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { useLiveQuery } from 'dexie-react-hooks'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

export default function Home() {
  const [rss, updateRss] = useState<(FeedItem & { feed: { name: string; fav_icon: string } })[]>([])
  const fetchRssFeed = useFetchRssFeed()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)

  useEffect(() => {
    const fetchAndUpdateTime = async () => {
      await fetchRssFeed()
      setLastRefreshTime(new Date())
    }
    fetchAndUpdateTime()
  }, [fetchRssFeed])

  useInterval(() => {
    fetchRssFeed()
    setLastRefreshTime(new Date())
  }, 120000)
  const items = useLiveQuery(async () => {
    // Get all feeds
    const feeds = await db.feeds.toArray()

    // Get the latest 5 items from each feed
    const feedItemsPromises = feeds.map(async feed => {
      if (feed.id === undefined) return []

      const items = await db.feedItems.where('feed_id').equals(feed.id).reverse().sortBy('pub_date')

      return items.slice(0, 5).map((item: FeedItem) => ({
        ...item,
        feed: {
          name: feed.name,
          fav_icon: feed.fav_icon
        }
      }))
    })

    const allFeedItems = await Promise.all(feedItemsPromises)

    // Flatten the array of arrays and sort by pub_date
    const sortedItems = allFeedItems
      .flat()
      .sort((a, b) => new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime())

    // Return the 20 most recent items
    return sortedItems.slice(0, 20)
  })

  useEffect(() => {
    if (items) {
      updateRss(items)
    }
  }, [items])

  const formatRelativeDate = useMemo(
    () => (dateString: string) => {
      try {
        const date = parseISO(dateString)
        return formatDistanceToNow(date, { addSuffix: true, locale: de })
      } catch (error) {
        console.error('Error parsing date:', error)
        return 'Unknown date'
      }
    },
    []
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchRssFeed()
    setLastRefreshTime(new Date())
    setIsRefreshing(false)
  }

  return (
    <div className="grid h-screen mt-24 grid-rows-[20px_1fr_20px] min-h-screen p-8 gap-16 ">
      <Card className="">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Latest News</CardTitle>
            <CardDescription>From Multiple RSS Feeds</CardDescription>
            {lastRefreshTime && (
              <p className="text-sm text-gray-500 mt-1">
                Last refreshed: {format(lastRefreshTime, 'HH:mm:ss')}
              </p>
            )}
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="max-w-md space-y-1 hyphens-auto">
            {rss.map((entry, index) => (
              <li key={entry.id || index} className="flex items-start space-x-2">
                <Tooltip>
                  {entry.feed.fav_icon && (
                    <div className="flex-shrink-0 w-4 h-4 mt-1 relative">
                      <Image
                        src={entry.feed.fav_icon}
                        alt={`${entry.feed.name} favicon`}
                        layout="fill"
                        objectFit="contain"
                      />
                    </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <TooltipTrigger>
                      <h1 className="font-medium text-base">
                        <a
                          href={entry.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline cursor-pointer block truncate"
                        >
                          {entry.title}
                        </a>
                      </h1>
                    </TooltipTrigger>
                    <TooltipContent align="start">
                      <div className="p-4 max-w-sm">
                        <h1 className="font-medium text-base">{entry.title}</h1>
                        <p className="text-xs pt-0.5 hyphens-auto line-clamp-2">
                          {entry.description}
                        </p>
                        <p className="text-xs mt-1">
                          {entry.feed.name} - {formatRelativeDate(entry.pub_date)}
                        </p>
                      </div>
                    </TooltipContent>
                  </div>
                </Tooltip>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
