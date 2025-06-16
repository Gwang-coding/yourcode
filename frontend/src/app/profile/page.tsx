'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { postsAPI, usersAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import CodeDetailModal from '@/components/CodeDetailModal';
import toast from 'react-hot-toast';
import { Code2, User, Heart, Grid3X3, LogOut, Edit, Upload } from 'lucide-react';

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

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        fetchProfile();
    }, [user, router]);

    const fetchProfile = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const [profileRes, postsRes] = await Promise.all([usersAPI.getUserProfile(user.id), postsAPI.getUserPosts(user.id)]);

            setProfile(profileRes.data);
            setPosts(postsRes.data);
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
        toast.success('Logged out successfully');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Code2 className="w-12 h-12 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button onClick={() => router.push('/')} className="text-2xl font-bold text-gray-900">
                            YourCode
                        </button>
                        <button onClick={handleLogout} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Profile Section */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex items-start space-x-6">
                        {profile?.profile_image ? (
                            <img src={profile.profile_image} alt={profile.username} className="w-24 h-24 rounded-full object-cover" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-12 h-12 text-gray-500" />
                            </div>
                        )}

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-2xl font-bold">{profile?.username}</h1>
                                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                                    <Edit className="w-4 h-4" />
                                    <span>Edit Profile</span>
                                </button>
                            </div>

                            <div className="flex items-center space-x-6 text-sm">
                                <div>
                                    <span className="font-semibold">{profile?.post_count || 0}</span>
                                    <span className="text-gray-600 ml-1">posts</span>
                                </div>
                                <div>
                                    <span className="font-semibold">{profile?.likes_received || 0}</span>
                                    <span className="text-gray-600 ml-1">likes received</span>
                                </div>
                            </div>

                            {profile?.bio && <p className="mt-4 text-gray-700">{profile.bio}</p>}

                            {profile?.github_url && (
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
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <Grid3X3 className="w-5 h-5" />
                            <h2 className="text-lg font-semibold">My Code Posts</h2>
                        </div>
                        <button
                            onClick={() => router.push('/upload')}
                            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Upload Code</span>
                        </button>
                    </div>

                    {posts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg">
                            <Code2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600">No posts yet</p>
                            <button
                                onClick={() => router.push('/upload')}
                                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                            >
                                Upload Your First Code
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {posts.map((post) => (
                                <div
                                    key={post.id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={() => {
                                        setSelectedPostId(post.id);
                                        setShowDetail(true);
                                    }}
                                >
                                    <div className="aspect-video bg-gray-900 relative">
                                        <img
                                            src={`http://localhost:8000${post.code_image}`}
                                            alt={post.title}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold mb-1">{post.title}</h3>
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <span>{post.language || 'Code'}</span>
                                            <div className="flex items-center space-x-1">
                                                <Heart className={`w-4 h-4 ${post.is_liked ? 'text-red-500 fill-current' : ''}`} />
                                                <span>{post.like_count}</span>
                                            </div>
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
            />
        </div>
    );
}
