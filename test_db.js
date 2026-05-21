import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: trafegoMeta, error: err5 } = await supabase
    .from('trafego_meta_cultura')
    .select('*')
    .limit(5);
  console.log("trafego_meta_cultura:", trafegoMeta?.length, err5);

  const { data: checkouts, error: err1 } = await supabase
    .from('eventos_checkout')
    .select('*')
    .limit(5);
  console.log("eventos_checkout:", checkouts?.length, err1);
}
run();
