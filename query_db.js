import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: trafegoMeta, error: err5 } = await supabase
    .from('trafego_meta_cultura')
    .select('*')
    .limit(5);
  console.log("trafego_meta_cultura:", trafegoMeta, err5);

  const { data: checkouts, error: err1 } = await supabase
    .from('checkouts')
    .select('*')
    .eq('empresa', 'cultura')
    .limit(2);
  console.log("checkouts:", checkouts, err1);
}
run();
