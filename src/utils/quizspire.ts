import { api } from "../api/client";
import { FlashcardDeckSchema, User } from "../api/api";

/**
 * Fetches a flashcard deck by ID from the API.
 */
export async function fetchDeck(id: string): Promise<FlashcardDeckSchema> {
  const response = await api.quizspire.getQuizspireDecksById(id);
  return response.data;
}

/**
 * Fetches user profile data by user ID and converts it to User structure.
 */
export async function fetchUserProfile(userId: string): Promise<User> {
  const response = await api.profile.getProfileByUserId(userId);
  const profile = response.data;
  return {
    id: profile.id,
    name: profile.name,
    image: profile.image,
    email: "", // Not available publicly
    emailVerified: false, // Not available publicly
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    chessWins: profile.chessWins,
    chessLosses: profile.chessLosses,
    draughtsWins: profile.draughtsWins,
    draughtsLosses: profile.draughtsLosses,
    arithmeticScore: profile.arithmeticScore,
    tetrisScore: profile.tetrisScore,
    role: null,
    banned: profile.banned,
    banReason: profile.banReason,
    banExpires: profile.banExpires,
    age: null,
  } as User;
}

/**
 * Fetches the current authenticated user.
 */
export async function fetchCurrentUser(): Promise<User> {
  const response = (await api.auth.apiGetSessionList()).data;
  return response.user;
}
