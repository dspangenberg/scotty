import { type FeedData, extract } from '@extractus/feed-extractor'
import { NextResponse } from 'next/server'

export async function GET(request: Request): Promise<FeedData> {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const rss = await extract(url, { limit: 20 })

    return NextResponse.json(rss.entries) as FeedData
  } catch (error) {
    console.error('Error fetching feed:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching the feed' },
      { status: 500 }
    )
  }
}
