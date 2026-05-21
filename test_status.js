import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: checkouts } = await supabase
    .from('eventos_checkout')
    .select('status, valor')
    .limit(10);
  console.log("eventos_checkout preview:", checkouts);
}
run();
