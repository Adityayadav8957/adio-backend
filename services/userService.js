const { getAuthorizedSupabase } = require('../config/supabase');

/**
 * Ensures the user exists in the public.users table.
 * Call this before performing operations that require a foreign key to public.users.
 * @param {Object} supabase - Authorized Supabase client
 * @param {Object} user - User object from auth.getUser()
 */
const syncUser = async (supabase, user) => {
    try {
        // 1. Check if user exists in public.users
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error("Error checking public user:", fetchError);
            // Don't throw, try validation anyway or let the next step fail if constraint exists
        }

        // 2. If not found, insert/upsert
        if (!existingUser) {
            console.log(`User ${user.id} not found in public.users. Syncing...`);

            const { error: upsertError } = await supabase
                .from('users')
                .upsert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    avatar_url: user.user_metadata?.avatar_url
                }, { onConflict: 'id' });

            if (upsertError) {
                console.error("Failed to sync user to public table:", upsertError);
                // We don't throw here to allow the main operation to attempt execution, 
                // though it will likely fail on FK constraint.
            } else {
                console.log(`User ${user.id} synced successfully.`);
            }
        }
    } catch (e) {
        console.error("Unexpected error in syncUser:", e);
    }
};

module.exports = {
    syncUser
};
