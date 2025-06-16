import { supabase } from "@/utils/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

export async function getUserRole(userId: string): Promise<{
  data: string | null;
  error: PostgrestError | Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (error) {
      return { data: null, error };
    }
    return { data: data?.role as string || null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

export async function signOutUser(): Promise<{
  error: Error | null;
}> {
  try {
    await supabase.auth.signOut();
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
} 