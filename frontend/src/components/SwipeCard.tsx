import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, Code, User } from 'lucide-react';
import { useState } from 'react';

interface SwipeCardProps {
    post: {
        id: number;
        title: string;
        code_image: string;
        language?: string;
        description?: string;
        username: string;
        profile_image?: string;
    };
    onSwipe: (direction: 'left' | 'right') => void;
    isTop: boolean;
}

export default function SwipeCard({ post, onSwipe, isTop }: SwipeCardProps) {
    const [showDescription, setShowDescription] = useState(false);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    const handleDragEnd = (event: any, info: any) => {
        if (info.offset.x > 100) {
            onSwipe('right');
        } else if (info.offset.x < -100) {
            onSwipe('left');
        }
    };

    return (
        <motion.div
            className={`absolute w-full max-w-md ${isTop ? 'z-10' : 'z-0'}`}
            style={{ x, rotate, opacity }}
            drag={isTop ? 'x' : false}
            dragConstraints={{ left: -300, right: 300 }}
            onDragEnd={handleDragEnd}
            animate={isTop ? {} : { scale: 0.95, y: 10 }}
        >
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-3">
                        {post.profile_image ? (
                            <img src={post.profile_image} alt={post.username} className="w-10 h-10 rounded-full object-cover" />
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
                    <Code className="w-5 h-5 text-gray-400" />
                </div>

                {/* Code Image */}
                <div className="relative h-96 bg-gray-900">
                    <img
                        src={post.code_image.startsWith('http') ? post.code_image : `http://localhost:8000${post.code_image}`}
                        alt={post.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            console.error('Image load error:', post.code_image);
                            e.currentTarget.src =
                                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==';
                        }}
                    />

                    {/* Swipe Indicators */}
                    <motion.div
                        className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-full flex items-center space-x-2"
                        style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
                    >
                        <Heart className="w-5 h-5" />
                        <span className="font-semibold">LIKE</span>
                    </motion.div>

                    <motion.div
                        className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full flex items-center space-x-2"
                        style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
                    >
                        <X className="w-5 h-5" />
                        <span className="font-semibold">PASS</span>
                    </motion.div>
                </div>

                {/* Info */}
                <div className="p-4">
                    <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                    {post.description && (
                        <div>
                            <button onClick={() => setShowDescription(!showDescription)} className="text-blue-500 text-sm mb-2">
                                {showDescription ? 'Hide' : 'Show'} Description
                            </button>
                            {showDescription && <p className="text-gray-600 text-sm">{post.description}</p>}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-6 pb-6">
                    <button
                        onClick={() => onSwipe('left')}
                        className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                        <X className="w-7 h-7 text-red-500" />
                    </button>
                    <button
                        onClick={() => onSwipe('right')}
                        className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center hover:bg-green-100 transition-colors"
                    >
                        <Heart className="w-7 h-7 text-green-500" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
