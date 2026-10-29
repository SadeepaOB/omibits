import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://syfmcwnmvxvgkwgknwsj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TA3B3WBOD-phO6bMulbCCQ_A9f77b7n';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
