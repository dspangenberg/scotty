import { format, parse } from 'date-fns'
import { NextResponse } from 'next/server'

export interface WakaTimeDaily {
  date: string
  decimal: number
  digital: string
}

export async function GET() {
  try {
    // Wakatime API endpoint for summaries
    const apiUrl = 'https://wakatime.com/api/v1/users/current/summaries'

    // Get the date 7 days ago
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Format dates for the API request
    const start = sevenDaysAgo.toISOString().split('T')[0]
    const end = new Date().toISOString().split('T')[0]

    console.log(start, end)

    // Fetch data from Wakatime API
    const response = await fetch(`${apiUrl}?range=last_7_days`, {
      headers: {
        Authorization: `Basic ${Buffer.from(process.env.WAKATIME_API_KEY || '').toString('base64')}`
      }
    })

    console.log(response)

    if (!response.ok) {
      throw new Error('Failed to fetch data from Wakatime API')
    }

    const data = await response.json()

    const daily: WakaTimeDaily[] = data.data.map((entry: any) => {
      const date = parse(entry.range.date, 'yyyy-MM-dd', new Date())
      return {
        date: format(date, 'dd.MM.'),
        decimal: Number.parseFloat(entry.grand_total.decimal),
        digital: entry.grand_total.digital
      }
    })

    // Calculate total time
    const totalSeconds = data.cumulative_total.seconds
    const totalHours = Math.floor(totalSeconds / 3600)
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60)

    return NextResponse.json({
      daily,
      totalTime: `${totalHours}h ${totalMinutes}m`,
      totalSeconds: totalSeconds
    })
  } catch (error) {
    console.error('Error fetching Wakatime data:', error)
    return NextResponse.json({ error: 'Failed to fetch Wakatime data' }, { status: 500 })
  }
}
