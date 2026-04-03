import { supabase } from './supabase.js';

export const commentService = {
    async getByVideo(videoId) {
        try {
            const { data: comments, error: commentsError } = await supabase
                .from('comments')
                .select('*')
                .eq('video_id', videoId)
                .order('created_at', { ascending: false });
            
            if (commentsError) {
                console.error('Comments fetch error:', commentsError);
                return [];
            }
            
            if (comments && comments.length > 0) {
                const userIds = [...new Set(comments.map(c => c.user_id))];
                
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, email')
                    .in('id', userIds);
                
                if (!profilesError && profiles) {
                    return comments.map(comment => ({
                        ...comment,
                        profiles: profiles.find(p => p.id === comment.user_id) || { email: 'Пользователь' }
                    }));
                }
            }
            
            return comments || [];
        } catch (error) {
            console.error('Error in getByVideo:', error);
            return [];
        }
    },
    
    async add(videoId, userId, content) {
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert([{ 
                    video_id: videoId, 
                    user_id: userId, 
                    content: content 
                }])
                .select();
            
            if (error) {
                console.error('Add comment error:', error);
                return { error };
            }
            return { data };
        } catch (error) {
            console.error('Error in add:', error);
            return { error };
        }
    },
    
    async deleteComment(commentId) {
        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId);
            
            if (error) console.error('Delete comment error:', error);
            return { error };
        } catch (error) {
            console.error('Error in deleteComment:', error);
            return { error };
        }
    }
};
