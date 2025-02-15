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
import { useEffect, useMemo, useState } from 'react'

interface FeedWithItems {
  id: number // Keep this as number, we're ensuring it's always a number in the code
  name: string
  url: string
  category_id: number
  fav_icon: string
  items: FeedItem[]
}

function FeedCard({ feed }: { feed: FeedWithItems }) {
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

  const newestItemDate = useMemo(() => {
    if (feed.items.length === 0) return null
    return feed.items.reduce((newest, item) => {
      const itemDate = new Date(item.pub_date)
      return itemDate > newest ? itemDate : newest
    }, new Date(0))
  }, [feed.items])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <img src={feed.fav_icon} alt={`${feed.name} favicon`} className="rounded-md size-6" />
          <span>{feed.name}</span>
        </CardTitle>
        {newestItemDate && (
          <CardDescription>{formatRelativeDate(newestItemDate.toISOString())}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 hyphens-auto">
          {feed.items.map((item, index) => (
            <li key={item.id || index} className="flex items-start space-x-2">
              <Tooltip>
                <TooltipTrigger className="flex w-full items-center space-x-2">
                  <div className="flex-1 max-w-full">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline cursor-pointer text-left block text-sm truncate"
                    >
                      {item.title}
                    </a>
                  </div>
                </TooltipTrigger>
                <TooltipContent align="start">
                  <div className="p-4 max-w-sm">
                    <h1 className="font-medium text-base leading-tight">{item.title}</h1>
                    <p className="text-sm pt-1.5 hyphens-auto">{item.description}</p>
                    <p className="text-xs pt-1">{formatRelativeDate(item.pub_date)}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default function Home() {
  const [feeds, setFeeds] = useState<FeedWithItems[]>([])
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

  useLiveQuery(async () => {
    const feeds = await db.feeds.toArray()
    const feedsWithItems: FeedWithItems[] = await Promise.all(
      feeds.map(async (feed): Promise<FeedWithItems> => {
        const items = await db.feedItems
          .where('feed_id')
          .equals(feed.id ?? 0)
          .reverse()
          .sortBy('pub_date')
        return {
          id: feed.id as number,
          name: feed.name,
          url: feed.url,
          category_id: feed.category_id,
          fav_icon: feed.fav_icon,
          items: items.slice(0, 6)
        }
      })
    )
    setFeeds(feedsWithItems)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchRssFeed()
    setLastRefreshTime(new Date())
    setIsRefreshing(false)
  }

  return (
    <div className="container mx-auto mt-24 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">RSS Feeds</h1>
          {lastRefreshTime && (
            <p className="text-sm text-gray-500 mt-1">
              Last refreshed: {format(lastRefreshTime, 'HH:mm:ss')}
            </p>
          )}
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {feeds.map(feed => (
          <FeedCard key={feed.id} feed={feed} />
        ))}
      </div>
    </div>
  )
}
