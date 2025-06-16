'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { postsAPI } from '@/lib/api';
import SwipeCard from '@/components/SwipeCard';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Code2, RefreshCw } from 'lucide-react';

interface Post {
    id: number;
    title: string;
    code_image: string;
    language?: string;
    description?: string;
    username: string;
    profile_image?: string;
}

export default function Home() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        fetchPosts();
    }, [isAuthenticated, router]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await postsAPI.getSwipeablePosts();
            setPosts(response.data);
        } catch (error) {
            toast.error('Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    const handleSwipe = async (direction: 'left' | 'right') => {
        if (posts.length === 0) return;

        const currentPost = posts[0];

        try {
            if (direction === 'right') {
                await postsAPI.likePost(currentPost.id);
                toast.success('Liked!', { icon: '❤️' });
            } else {
                await postsAPI.passPost(currentPost.id);
            }

            // Remove the swiped card
            setPosts(posts.slice(1));

            // Load more if running low
            if (posts.length <= 3) {
                fetchPosts();
            }
        } catch (error) {
            toast.error('Failed to process swipe');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Code2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
                    <p>Loading awesome code...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <h1 className="cursor-pointer text-2xl font-bold text-gray-900">YourCode</h1>
                        <nav className="flex items-center space-x-4">
                            <button onClick={() => router.push('/profile')} className="cursor-pointer text-gray-600 hover:text-gray-900">
                                Profile
                            </button>
                            <button onClick={() => router.push('/search')} className="cursor-pointer text-gray-600 hover:text-gray-900">
                                Search
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col items-center">
                    {posts.length === 0 ? (
                        <div className="flex-column justify-items-center text-center py-20">
                            <Code2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h2 className="cursor-default text-2xl text-black font-semibold mb-2">No more posts!</h2>
                            <p className="cursor-default text-gray-600 mb-4">Check back later for more code</p>
                            <button
                                onClick={fetchPosts}
                                className="cursor-pointer flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Refresh</span>
                            </button>
                        </div>
                    ) : (
                        <div className="relative h-[600px] w-full max-w-md">
                            {posts.slice(0, 3).map((post, index) => (
                                <SwipeCard key={post.id} post={post} onSwipe={handleSwipe} isTop={index === 0} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
