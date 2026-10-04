'use client'
// ─────────────────────────────────────────────────────────────
//  صفحه اصلی — نسخه ظاهر v3.0 «کاوش»
//  همان صفحه نسخه v2.0 است، به‌علاوه مه نقشه و باز شدن خانه‌های شش‌ضلعی با چک‌این.
//  نسخه v2.0 دست‌نخورده می‌ماند و برگشت به آن با select public.ui_rollback(); ممکن است.
// ─────────────────────────────────────────────────────────────
import { TwinLandV2 } from '@/components/v2/home/TwinLandV2'

export function TwinLandV3(props) {
  return <TwinLandV2 {...props} hexFog />
}
