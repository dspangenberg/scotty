/*
 * scotty is licensed under the terms of the EUPL-1.2 license
 * Copyright (c) 2025 by Danny Spangenberg
 */

import { extract } from '@extractus/feed-extractor'
import { NextResponse } from 'next/server'

export async function GET(request: Request): Promise<FeedData> {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const rss = await extract(url)

    return NextResponse.json(rss.entries)
  } catch (error) {
    console.error('Error fetching feed:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching the feed' },
      { status: 500 }
    )
  }
}
