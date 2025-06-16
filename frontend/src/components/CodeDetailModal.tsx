import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Eye, Calendar, Code2, User } from 'lucide-react';
import { postsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface CodeDetailModalProps {
    postId: number | null;
    isOpen: boolean;
    onClose: () => void;
    onLike?: () => void;
}

interface PostDetail {
    id: number;
    title: string;
    code_image: string;
    language?: string;
    description?: string;
    username: string;
    profile_image?: string;
    bio?: string;
    like_count: number;
    view_count: number;
    created_at: string;
}

export default function CodeDetailModal({ postId, isOpen, onClose, onLike }: CodeDetailModalProps) {
    const [post, setPost] = useState<PostDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [imageScale, setImageScale] = useState(1);

    useEffect(() => {
        if (isOpen && postId) {
            fetchPostDetail();
        }
    }, [isOpen, postId]);

    const fetchPostDetail = async () => {
        if (!postId) return;

        try {
            setLoading(true);
            const response = await postsAPI.getPostDetail(postId);
            setPost(response.data);
        } catch (error) {
            toast.error('Failed to load post details');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!post) return;

        try {
            await postsAPI.likePost(post.id);
            setPost({ ...post, like_count: post.like_count + 1 });
            toast.success('Liked!');
            if (onLike) onLike();
        } catch (error) {
            toast.error('Failed to like post');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center h-96">
                                <Code2 className="w-12 h-12 animate-spin text-gray-400" />
                            </div>
                        ) : post ? (
                            <>
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b">
                                    <div className="flex items-center space-x-3">
                                        {post.profile_image ? (
                                            <img
                                                src={post.profile_image}
                                                alt={post.username}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                <User className="w-6 h-6 text-gray-500" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-semibold">{post.username}</h3>
                                            <p className="text-sm text-gray-500">{post.language || 'Code'}</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Image */}
                                <div className="flex-1 bg-gray-900 overflow-auto">
                                    <img
                                        src={`http://localhost:8000${post.code_image}`}
                                        alt={post.title}
                                        className="w-full h-full object-contain cursor-zoom-in"
                                        style={{ transform: `scale(${imageScale})` }}
                                        onClick={() => setImageScale(imageScale === 1 ? 2 : 1)}
                                    />
                                </div>

                                {/* Details */}
                                <div className="p-4 border-t">
                                    <h2 className="text-xl font-bold mb-2">{post.title}</h2>

                                    {post.description && <p className="text-gray-700 mb-4">{post.description}</p>}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                            <div className="flex items-center space-x-1">
                                                <Eye className="w-4 h-4" />
                                                <span>{post.view_count} views</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(post.created_at)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleLike}
                                            className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <Heart className="w-5 h-5" />
                                            <span>{post.like_count}</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
