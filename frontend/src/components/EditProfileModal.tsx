import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Upload } from 'lucide-react';
import { usersAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export default function EditProfileModal({ isOpen, onClose, onUpdate }: EditProfileModalProps) {
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(user?.profile_image || null);

    const [formData, setFormData] = useState({
        bio: user?.bio || '',

        profile_image: user?.profile_image || '',
    });

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setPreview(base64);
            setFormData({ ...formData, profile_image: base64 });
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await usersAPI.updateProfile({
                bio: formData.bio,

                profile_image: formData.profile_image,
            });

            updateUser({
                bio: formData.bio,

                profile_image: formData.profile_image,
            });

            toast.success('Profile updated successfully!');
            onUpdate();
            onClose();
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-lg max-w-md w-full p-6"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Edit Profile</h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Profile Image */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                            <div className="flex items-center space-x-4">
                                {preview ? (
                                    <img src={preview} alt="Profile preview" className="w-20 h-20 rounded-full object-cover" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                                        <User className="w-10 h-10 text-gray-500" />
                                    </div>
                                )}
                                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md flex items-center space-x-2">
                                    <Upload className="w-4 h-4" />
                                    <span>Change Photo</span>
                                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                </label>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="mb-4">
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                                Bio
                            </label>
                            <textarea
                                id="bio"
                                rows={4}
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Tell us about yourself..."
                                maxLength={500}
                            />
                            <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                            <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
