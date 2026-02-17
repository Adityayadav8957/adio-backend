/**
 * Middleware to extract and validate the Bearer token.
 * It does NOT verify the token with Supabase here (performance),
 * but ensures it exists. Validation happens when the token is 
 * used to create the Supabase client in the controller.
 */
const { getAuthorizedSupabase } = require('../config/supabase');
const User = require('../models/User');

/**
 * Middleware to extract and validate the Bearer token.
 * Verifies with Supabase and ensures user exists in MongoDB.
 */
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "Missing authorization token" });
    }

    try {
        // 1. Verify Token with Supabase
        const supabase = getAuthorizedSupabase(token);
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            console.error("Auth Error:", error);
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        // 2. Ensure User Exists in MongoDB (Sync)
        let dbUser = await User.findById(user.id);

        if (!dbUser) {
            console.log(`[Auth] Creating new MongoDB user for ${user.id}`);
            dbUser = await User.create({
                _id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                avatar_url: user.user_metadata?.avatar_url
            });
        }

        // 3. Attach User to Request
        req.user = dbUser;
        req.token = token; // Keep token for edge cases if needed
        next();

    } catch (e) {
        console.error("Middleware Auth Error:", e);
        return res.status(500).json({ error: "Internal Server Error during Auth" });
    }
};

module.exports = requireAuth;
