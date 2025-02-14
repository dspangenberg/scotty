import Dexie, { type Table } from 'dexie'

interface Feed {
  id?: number
  name: string
  url: string
  category_id: number
  fav_icon: string
}

interface Category {
  id?: number
  name: string
  pos: number
}

interface FeedItem {
  id?: number
  feed_id: number
  org_id: string
  title: string
  pub_date: string
  link: string
  description: string
}

class MyDatabase extends Dexie {
  feeds!: Table<Feed>
  categories!: Table<Category>
  feedItems!: Table<FeedItem>

  constructor() {
    super('scotty')
    this.version(1).stores({
      feeds: '++id, name, url, category_id, fav_icon',
      categories: '++id, name, pos',
      feedItems: '++id, feed_id, org_id, title, pub_date, link, description'
    })
  }
}

export const db = new MyDatabase()
