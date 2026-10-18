'use client'
// برگه پروفایل یک نفر روی نقشه — با ضربه روی نام یا چهره هر کس در رتبه‌بندی، کلن، حلقه و نظرها باز می‌شود
import { SheetV4 } from '@/components/v4/ui/Sheet'
import { PublicProfileView, usePublicProfile } from '@/components/v4/profile/PublicProfileView'
import { Btn } from '@/components/v4/kit/kit'

export function PersonSheet({ id, onClose }) {
  const { loading, data, retry } = usePublicProfile(id)
  const self = data && data.ok && data.self
  return (
    <SheetV4 open={!!id} onClose={onClose} title={self ? 'پروفایل تو' : 'پروفایل'} icon="user" maxWidth={520} zIndex={3200}>
      <PublicProfileView data={data} loading={loading} onRetry={retry} />
      {self && <div style={{ marginTop: 12 }}><Btn kind="ghost" block icon="edit" href="/profile">رفتن به پروفایل کامل</Btn></div>}
    </SheetV4>
  )
}
