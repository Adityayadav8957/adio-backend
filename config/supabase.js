const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Global client for non-auth/admin status checks (optional)
const globalSupabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

/**
 * Creates a scoped Supabase client with the user's Auth token.
 * This ensures RLS policies are applied correctly for the specific user.
 * @param {string} token - The Bearer token from the request header.
 * @returns {object} Supabase Client
 */
const getAuthorizedSupabase = (token) => {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase credentials missing");
    }
    return createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });
};

module.exports = {
    globalSupabase,
    getAuthorizedSupabase
};
