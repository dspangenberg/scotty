'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { FeedItem } from '@/hooks/useFeeds'
import { useFetchRssFeed } from '@/hooks/useFetchRssFeed'
import { useInterval } from '@/hooks/useInterval'
import { db } from '@/lib/db'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { useLiveQuery } from 'dexie-react-hooks'
import { TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
interface FeedWithItems {
  id: number // Keep this as number, we're ensuring it's always a number in the code
  name: string
  url: string
  category_id: number
  fav_icon: string
  items: FeedItem[]
}

export interface WakaTimeDaily {
  date: string
  decimal: number
  digital: string
}

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 }
]
const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))'
  },
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--chart-2))'
  },
  label: {
    color: 'hsl(var(--background))'
  }
} satisfies ChartConfig

function Chart({ data }: { data: WakaTimeDaily[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wakatime-Zeiten</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: 10,
              right: 20,
              left: 20,
              bottom: 10
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
            <Bar dataKey="decimal" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="digital"
                position="top"
                offset={10}
                fill="hsl(var(--foreground))"
                fontSize={12}
              />
            </Bar>
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as WakaTimeDaily
                  return (
                    <ChartTooltipContent>
                      <div className="font-bold">{data.date}</div>
                      <div>{data.digital}</div>
                    </ChartTooltipContent>
                  )
                }
                return null
              }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
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
  const [wakaTimeData, setWakaTimeData] = useState<WakaTimeDaily[]>([])

  const fetchWakaTimeData = useCallback(async () => {
    try {
      const response = await fetch('/api/wakatime')
      if (!response.ok) {
        throw new Error('Failed to fetch WakaTime data')
      }
      const data = await response.json()
      setWakaTimeData(data.daily)
    } catch (error) {
      console.error('Error fetching WakaTime data:', error)
    }
  }, [])

  useEffect(() => {
    const fetchAndUpdateTime = async () => {
      await fetchRssFeed()
      setLastRefreshTime(new Date())
    }
    fetchAndUpdateTime()
    fetchWakaTimeData()
  }, [fetchRssFeed, fetchWakaTimeData])

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-8 ">
            {feeds.map(feed => (
              <FeedCard key={feed.id} feed={feed} />
            ))}
          </div>
        </div>
        <div>
          <Chart data={wakaTimeData} />
        </div>
      </div>
    </div>
  )
}
