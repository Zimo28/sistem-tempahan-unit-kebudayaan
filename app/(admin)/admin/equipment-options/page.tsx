import { createSupabaseServerClient } from '@/lib/supabase-server'
import EquipmentOptionsClient from './EquipmentOptionsClient'

export default async function EquipmentOptionsPage() {
  const supabase = await createSupabaseServerClient()

  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, code')
    .order('position', { ascending: true })

  const { data: options } = await supabase
    .from('venue_equipment_options')
    .select('*')
    .order('position', { ascending: true })

  return <EquipmentOptionsClient venues={venues ?? []} options={options ?? []} />
}