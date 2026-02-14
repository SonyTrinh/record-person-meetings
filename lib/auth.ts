import { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type EnsureUserResult = {
  user: User | null;
  errorMessage?: string;
};

export async function ensureSignedInUser(): Promise<EnsureUserResult> {
  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  if (existingUser) {
    return { user: existingUser };
  }

  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    return {
      user: null,
      errorMessage:
        error.message ||
        'Sign-in failed. Enable Anonymous sign-ins in Supabase Authentication settings.',
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      errorMessage:
        'No user session found after sign-in. Check Supabase auth configuration and network.',
    };
  }

  return { user };
}
