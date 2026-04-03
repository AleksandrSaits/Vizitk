import { supabase } from './supabase.js';

export const auth = {
    async signIn(email, password) {
        return await supabase.auth.signInWithPassword({ email, password });
    },
    async signUp(email, password) {
        return await supabase.auth.signUp({ email, password });
    },
    async signOut() {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    },
    async getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
};
