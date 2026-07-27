// ─── Production Types for Marketplace ───────────────────
// Extracted from the retired lib/mock-data.ts

export interface MarketplaceUser {
  id: string;
  name: string;
  avatar: string;
  college: string;
  year: string;
  bio: string;
  skillsHave: string[];
  skillsWant: string[];
  credits: number;
  sessionsCompleted: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  joinedAt: string;
}

export interface MarketplaceListing {
  id: string;
  user: MarketplaceUser;
  skillOffered: string;
  skillWanted: string;
  description: string;
  creditsPerHour: number;
  availability: string;
  tags: string[];
}
