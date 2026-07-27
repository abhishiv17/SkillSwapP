export const APP_NAME = 'SkillSwap';

export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
  matches: '/dashboard/sessions?view=matches',
  sessions: '/dashboard/sessions',
  profile: '/dashboard/profile',
  reviews: '/dashboard/reviews',
  leaderboard: '/dashboard/leaderboard',
  messages: '/dashboard/messages',
  calendar: '/dashboard/sessions?view=calendar',
  library: '/dashboard/library',
  campus: '/dashboard/campus',
} as const;

export const SKILL_CATEGORIES = [
  { id: 'programming', label: 'Programming', icon: '💻', color: 'text-accent-violet' },
  { id: 'music', label: 'Music', icon: '🎵', color: 'text-accent-amber' },
  { id: 'languages', label: 'Languages', icon: '🌍', color: 'text-accent-coral' },
  { id: 'design', label: 'Design', icon: '🎨', color: 'text-accent-emerald' },
  { id: 'sports', label: 'Sports & Fitness', icon: '⚽', color: 'text-accent-amber' },
  { id: 'academic', label: 'Academic', icon: '📚', color: 'text-accent-violet' },
  { id: 'photography', label: 'Photography', icon: '📸', color: 'text-accent-coral' },
  { id: 'cooking', label: 'Cooking', icon: '🍳', color: 'text-accent-emerald' },
] as const;

export const ALL_SKILLS = [
  // Programming
  { id: 'python', name: 'Python', category: 'programming' },
  { id: 'javascript', name: 'JavaScript', category: 'programming' },
  { id: 'react', name: 'React', category: 'programming' },
  { id: 'ml', name: 'Machine Learning', category: 'programming' },
  { id: 'flutter', name: 'Flutter', category: 'programming' },
  { id: 'cpp', name: 'C++', category: 'programming' },
  { id: 'java', name: 'Java', category: 'programming' },
  { id: 'rust', name: 'Rust', category: 'programming' },
  // Music
  { id: 'guitar', name: 'Guitar', category: 'music' },
  { id: 'piano', name: 'Piano', category: 'music' },
  { id: 'vocals', name: 'Vocals', category: 'music' },
  { id: 'drums', name: 'Drums', category: 'music' },
  { id: 'music-prod', name: 'Music Production', category: 'music' },
  // Languages
  { id: 'spanish', name: 'Spanish', category: 'languages' },
  { id: 'japanese', name: 'Japanese', category: 'languages' },
  { id: 'french', name: 'French', category: 'languages' },
  { id: 'german', name: 'German', category: 'languages' },
  { id: 'korean', name: 'Korean', category: 'languages' },
  // Design
  { id: 'figma', name: 'Figma', category: 'design' },
  { id: 'uiux', name: 'UI/UX Design', category: 'design' },
  { id: 'graphic-design', name: 'Graphic Design', category: 'design' },
  { id: 'motion-design', name: 'Motion Design', category: 'design' },
  // Sports & Fitness
  { id: 'basketball', name: 'Basketball', category: 'sports' },
  { id: 'swimming', name: 'Swimming', category: 'sports' },
  { id: 'yoga', name: 'Yoga', category: 'sports' },
  { id: 'martial-arts', name: 'Martial Arts', category: 'sports' },
  // Academic
  { id: 'calculus', name: 'Calculus', category: 'academic' },
  { id: 'physics', name: 'Physics', category: 'academic' },
  { id: 'statistics', name: 'Statistics', category: 'academic' },
  { id: 'writing', name: 'Creative Writing', category: 'academic' },
  // Photography
  { id: 'photography', name: 'Photography', category: 'photography' },
  { id: 'video-editing', name: 'Video Editing', category: 'photography' },
  { id: 'lightroom', name: 'Lightroom', category: 'photography' },
  // Cooking
  { id: 'baking', name: 'Baking', category: 'cooking' },
  { id: 'indian-cuisine', name: 'Indian Cuisine', category: 'cooking' },
  { id: 'italian-cuisine', name: 'Italian Cuisine', category: 'cooking' },
] as const;
