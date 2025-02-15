export interface FeedWithItems {
  id: number
  name: string
  url: string
  category_id: number
  fav_icon: string
  items: FeedItem[]
}

export interface FeedItem {
  id?: number
  feed_id: number
  org_id: string
  title: string
  pub_date: string
  link: string
  description: string
}
