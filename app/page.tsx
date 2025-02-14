'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { db } from '@/lib/db'
import type { FeedEntry } from '@extractus/feed-extractor'
import { useEffect, useState } from 'react'

export default function Home() {
  const [rss, setRss] = useState<FeedEntry[]>(null)
  const [dbResult, setDbResult] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch RSS feed data from our API
        const response = await fetch('/api/feed?url=https://www.tagesschau.de/index~rss2.xml')
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        setRss(data)

        // Perform IndexedDB operations
        const id = await db.feeds.add({
          name: 'ZDF News',
          url: 'https://www.zdf.de/rss/zdf/nachrichten',
          category_id: 1,
          fav_icon: 'https://www.zdf.de/favicon.ico'
        })
        setDbResult({ id })
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="grid mt-24 grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <Card className="">
        <CardHeader>
          <CardTitle>Latest News</CardTitle>
          <CardDescription>From ZDF RSS Feed</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="max-w-md space-y-2 hyphens-auto">
            {rss?.slice(0, 5).map((entry: any, index: number) => (
              <li key={index}>
                <h1 className="font-medium text-base text-gray-900 ">
                  <a
                    href={entry.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline cursor-pointer"
                  >
                    <Tooltip>
                      <TooltipTrigger className="truncate max-w-md cursor-pointer hover:underline">
                        {entry.title}
                      </TooltipTrigger>
                      <TooltipContent>{entry.title}</TooltipContent>
                    </Tooltip>
                  </a>
                </h1>
                <p className="text-gray-600 text-sm pt-0.5 hyphens-auto line-clamp-2">
                  {entry.description}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <p>Database test: {dbResult ? `ID: ${dbResult.id}` : 'No result'}</p>
        </CardFooter>
      </Card>
    </div>
  )
}
