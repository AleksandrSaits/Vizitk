import { supabase } from './supabase.js';

export const likeService = {
    async getLikesCount(videoId) {
        try {
            const { count, error } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('video_id', videoId);
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('getLikesCount error:', error);
            return 0;
        }
    },
    
    async hasUserLiked(videoId, userId) {
        if (!userId) return false;
        try {
            const { data, error } = await supabase
                .from('likes')
                .select('id')
                .eq('video_id', videoId)
                .eq('user_id', userId)
                .maybeSingle();
            
            if (error) throw error;
            return !!data;
        } catch (error) {
            console.error('hasUserLiked error:', error);
            return false;
        }
    },
    
    async toggleLike(videoId, userId) {
        if (!userId) return false;
        try {
            const liked = await this.hasUserLiked(videoId, userId);
            
            if (liked) {
                const { error } = await supabase
                    .from('likes')
                    .delete()
                    .eq('video_id', videoId)
                    .eq('user_id', userId);
                if (error) throw error;
                return false;
            } else {
                const { error } = await supabase
                    .from('likes')
                    .insert([{ video_id: videoId, user_id: userId }]);
                if (error) throw error;
                return true;
            }
        } catch (error) {
            console.error('toggleLike error:', error);
            return false;
        }
    }
};
