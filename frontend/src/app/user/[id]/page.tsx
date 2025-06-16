'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { postsAPI, usersAPI } from '@/lib/api';
import CodeDetailModal from '@/components/CodeDetailModal';
import toast from 'react-hot-toast';
import { Code2, User, Heart, Grid3X3, ArrowLeft } from 'lucide-react';

interface Post {
    id: number;
    title: string;
    code_image: string;
    language?: string;
    description?: string;
    like_count: number;
    is_liked: boolean;
}

interface Profile {
    id: number;
    username: string;
    email: string;
    profile_image?: string;
    bio?: string;
    github_url?: string;
    created_at: string;
    post_count: number;
    likes_received: number;
}

export default function UserProfilePage() {
    const router = useRouter();
    const params = useParams();
    const userId = Number(params.id);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchUserProfile();
        }
    }, [userId]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const [profileRes, postsRes] = await Promise.all([usersAPI.getUserProfile(userId), postsAPI.getUserPosts(userId)]);

            setProfile(profileRes.data);
            setPosts(postsRes.data);
        } catch (error) {
            toast.error('Failed to load profile');
            router.push('/search');
        } finally {
            setLoading(false);
        }
    };

    const handleLikePost = async (postId: number) => {
        try {
            await postsAPI.likePost(postId);
            // Update local state
            setPosts(posts.map((post) => (post.id === postId ? { ...post, is_liked: true, like_count: post.like_count + 1 } : post)));
            toast.success('Post liked!');
        } catch (error) {
            toast.error('Failed to like post');
        }
    };

    const openPostDetail = (postId: number) => {
        setSelectedPostId(postId);
        setShowDetail(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Code2 className="w-12 h-12 animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-md">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-xl font-semibold">User Profile</h1>
                        </div>
                        <button onClick={() => router.push('/')} className="text-gray-600 hover:text-gray-900">
                            Home
                        </button>
                    </div>
                </div>
            </header>

            {/* Profile Section */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex items-start space-x-6">
                        {profile.profile_image ? (
                            <img src={profile.profile_image} alt={profile.username} className="w-24 h-24 rounded-full object-cover" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-12 h-12 text-gray-500" />
                            </div>
                        )}

                        <div className="flex-1">
                            <h1 className="text-2xl font-bold mb-4">{profile.username}</h1>

                            <div className="flex items-center space-x-6 text-sm">
                                <div>
                                    <span className="font-semibold">{profile.post_count || 0}</span>
                                    <span className="text-gray-600 ml-1">posts</span>
                                </div>
                                <div>
                                    <span className="font-semibold">{profile.likes_received || 0}</span>
                                    <span className="text-gray-600 ml-1">likes received</span>
                                </div>
                            </div>

                            {profile.bio && <p className="mt-4 text-gray-700">{profile.bio}</p>}

                            {profile.github_url && (
                                <a
                                    href={profile.github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-2 text-blue-600 hover:underline"
                                >
                                    GitHub Profile
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Posts Grid */}
                <div>
                    <div className="flex items-center space-x-2 mb-4">
                        <Grid3X3 className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Code Posts</h2>
                    </div>

                    {posts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg">
                            <Code2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600">No posts yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {posts.map((post) => (
                                <div
                                    key={post.id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={() => openPostDetail(post.id)}
                                >
                                    <div className="aspect-video bg-gray-900 relative">
                                        <img
                                            src={
                                                post.code_image.startsWith('http')
                                                    ? post.code_image
                                                    : `http://localhost:8000${post.code_image}`
                                            }
                                            alt={post.title}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold mb-1">{post.title}</h3>
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <span>{post.language || 'Code'}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // 카드 클릭 이벤트와 분리
                                                    handleLikePost(post.id);
                                                }}
                                                className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                                                disabled={post.is_liked}
                                            >
                                                <Heart className={`w-4 h-4 ${post.is_liked ? 'text-red-500 fill-current' : ''}`} />
                                                <span>{post.like_count}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Code Detail Modal */}
            <CodeDetailModal
                postId={selectedPostId}
                isOpen={showDetail}
                onClose={() => {
                    setShowDetail(false);
                    setSelectedPostId(null);
                }}
                onLike={() => {
                    // 모달에서 좋아요 했을 때 로컬 상태 업데이트
                    if (selectedPostId) {
                        handleLikePost(selectedPostId);
                    }
                }}
            />
        </div>
    );
}
