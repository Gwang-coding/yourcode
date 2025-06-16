'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, User, ArrowLeft } from 'lucide-react';

interface SearchResult {
    id: number;
    username: string;
    email: string;
    profile_image?: string;
    bio?: string;
}

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (query.trim().length < 2) {
            toast.error('Please enter at least 2 characters');
            return;
        }

        try {
            setLoading(true);
            const response = await usersAPI.searchUsers(query);
            setResults(response.data);
            setSearched(true);
        } catch (error) {
            toast.error('Failed to search users');
        } finally {
            setLoading(false);
        }
    };

    const viewProfile = (userId: number) => {
        router.push(`/user/${userId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 rounded-md">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-xl font-semibold">Search Users</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Search Section */}
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="relative  ">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                            placeholder="Search by username or email..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <button
                            onClick={handleSearch}
                            disabled={loading || query.trim().length < 2}
                            className="absolute right-2 top-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 "
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>

                {/* Results */}
                {searched && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            {results.length === 0 ? 'No users found' : `Found ${results.length} user${results.length === 1 ? '' : 's'}`}
                        </h2>

                        <div className="space-y-4">
                            {results.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => viewProfile(user.id)}
                                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-center space-x-4">
                                        {user.profile_image ? (
                                            <img
                                                src={user.profile_image}
                                                alt={user.username}
                                                className="w-16 h-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                                                <User className="w-8 h-8 text-gray-500" />
                                            </div>
                                        )}

                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{user.username}</h3>
                                            <p className="text-gray-600 text-sm">{user.email}</p>
                                            {user.bio && <p className="text-gray-700 mt-1 line-clamp-2">{user.bio}</p>}
                                        </div>

                                        <div className="text-gray-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
