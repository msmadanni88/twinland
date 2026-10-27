'use client'
// صفحه مسیرهای من و جایزه‌های همکاری، از نسخه v5.0. همه اعلان‌های مسیر و کوپن به این‌جا می‌آیند.
import dynamic from 'next/dynamic'
import { V4Blank } from '@/lib/ui/v4Blank'

const TrailsPage = dynamic(() => import('@/components/v5/alliances/TrailsPage'), { ssr: false, loading: V4Blank })

export default function Page() {
  return <TrailsPage />
}
