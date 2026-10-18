'use client'
// صفحه /leaderboard در نسخه v4.0 — قاب مشترک صفحه‌های v4 و همان جزء رتبه‌بندی پنل
// ضربه روی هر نفر صفحه پروفایل او را باز می‌کند (/profile?u=)
import { L } from '@/lib/theme/labels'
import { V4Page } from '@/components/v4/kit/V4Page'
import { LeaderboardV4 } from '@/components/v4/rank/LeaderboardV4'

export default function LeaderboardPageV4() {
  return (
    <V4Page title={L.leaderboard} maxWidth={560}>
      <LeaderboardV4 full />
    </V4Page>
  )
}
