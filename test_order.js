import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: checkoutsRaw, error: err4 } = await supabase
    .from('eventos_checkout')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(5000);
  console.log("Error from eventos_checkout with order timestamp:", err4);
  console.log("Length of data:", checkoutsRaw?.length);
}
run();
