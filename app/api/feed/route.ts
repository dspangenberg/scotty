import { extract } from '@extractus/feed-extractor'
import { NextResponse } from 'next/server'

interface FeedEntry {
  id: number
  title?: string
  link?: string
  published?: string
  description?: string
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const rss = await extract(url)
    if (!rss || !rss.entries) {
      return NextResponse.json({ error: 'Invalid RSS feed' }, { status: 400 })
    }

    let idCounter = 1 // Counter for generating unique IDs

    const entries: FeedEntry[] = rss.entries.map(entry => {
      let id: number
      if (entry.id) {
        const parsedId = Number.parseInt(entry.id, 10)
        id = Number.isNaN(parsedId) ? idCounter++ : parsedId
      } else {
        id = idCounter++
      }

      return {
        id,
        title: entry.title,
        link: entry.link,
        published: entry.published,
        description: entry.description
      }
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching feed:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching the feed' },
      { status: 500 }
    )
  }
}