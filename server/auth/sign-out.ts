"use server";
import { signOut } from "@/lib/auth/auth-js";

export const handleSignOut = async () => {
  try {
    await signOut();
  } catch (error) {
    throw error;
    // console.error(error);
  }
};
