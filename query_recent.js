import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: trafegoMeta } = await supabase
    .from('trafego_meta_cultura')
    .select('date')
    .order('date', { ascending: false })
    .limit(5);
  console.log("Recent dates in trafego_meta_cultura:", trafegoMeta);

  const { data: checkouts } = await supabase
    .from('eventos_checkout')
    .select('timestamp')
    .order('timestamp', { ascending: false })
    .limit(5);
  console.log("Recent dates in eventos_checkout:", checkouts);
}
run();
