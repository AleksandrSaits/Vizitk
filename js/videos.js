
import { supabase } from './supabase.js';

export const videoService = {
    async fetchAll() {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) console.error(error);
        return data || [];
    },
    
    async fetchById(id) {
        const { data } = await supabase
            .from('videos')
            .select('*')
            .eq('id', id)
            .single();
        return data;
    },
    
    async generateThumbnailFromVideo(videoFile) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            video.preload = 'metadata';
            video.src = URL.createObjectURL(videoFile);
            
            video.onloadeddata = () => {
                video.currentTime = 1;
            };
            
            video.onseeked = () => {
                canvas.width = 640;
                canvas.height = 360;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(video.src);
                    resolve(blob);
                }, 'image/jpeg', 0.8);
            };
            
            video.onerror = () => {
                reject(new Error('Не удалось загрузить видео для генерации превью'));
            };
        });
    },
    
    async uploadFile(file, folder, onProgress) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;
        
        const { data, error } = await supabase.storage
            .from('videos')
            .upload(filePath, file, {
                onProgress: (progress) => {
                    if (onProgress) {
                        const percent = (progress.loaded / progress.total) * 100;
                        onProgress(percent);
                    }
                }
            });
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(filePath);
        
        return publicUrl;
    },
    
    async uploadVideo(videoFile, thumbnailFile, title, description, userId, onProgress) {
        try {
            const videoUrl = await this.uploadFile(videoFile, 'videos', onProgress);
            
            let thumbnailUrl = null;
            
            if (thumbnailFile) {
                thumbnailUrl = await this.uploadFile(thumbnailFile, 'thumbnails');
            } else {
                const thumbnailBlob = await this.generateThumbnailFromVideo(videoFile);
                const thumbnailFileObj = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' });
                thumbnailUrl = await this.uploadFile(thumbnailFileObj, 'thumbnails');
            }
            
            const { data, error } = await supabase
                .from('videos')
                .insert([{ 
                    title, 
                    description: description, 
                    video_url: videoUrl,
                    thumbnail_url: thumbnailUrl,
                    user_id: userId,
                    views: 0 
                }]);
            
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('Upload error:', error);
            return { success: false, error: error.message };
        }
    },
    
    async addView(id, currentViews, currentUserId) {
        const video = await this.fetchById(id);
        
        if (!currentUserId || video.user_id !== currentUserId) {
            const { error } = await supabase
                .from('videos')
                .update({ views: (currentViews || 0) + 1 })
                .eq('id', id);
            if (error) console.error("View update error:", error);
            return true;
        } else {
            console.log("Своё видео - просмотр не засчитан");
            return false;
        }
    },
    
    async deleteVideo(id) {
        const video = await this.fetchById(id);
        if (video) {
            const videoPath = video.video_url.split('/').slice(-2).join('/');
            await supabase.storage.from('videos').remove([videoPath]);
            
            if (video.thumbnail_url) {
                const thumbPath = video.thumbnail_url.split('/').slice(-2).join('/');
                await supabase.storage.from('videos').remove([thumbPath]);
            }
        }
        
        return await supabase.from('videos').delete().eq('id', id);
    },
    
    async fetchUserVideos(userId) {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) console.error(error);
        return data || [];
    },
    
    async search(query) {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .ilike('title', `%${query}%`)
            .order('created_at', { ascending: false });
        if (error) console.error(error);
        return data || [];
    }
};
