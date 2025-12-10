import { supabase } from '../lib/supabase';
import { Project, TimeEntry, UserProfile } from '../types';

// --- PROJECTS ---

export const getProjects = async (userId?: string): Promise<Project[]> => {
  // RLS filters by user automatically via auth token, userId param is technically redundant for security but useful for logic
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  // Map DB columns (snake_case) to TS interface (camelCase)
  return data.map((p: any) => ({
    ...p,
    defaultHourlyRate: p.default_hourly_rate
  }));
};

export const saveProject = async (project: Project, userId: string): Promise<Project | null> => {
  // Prepare object for DB (snake_case)
  const dbProject = {
    id: project.id, // Supabase will use this ID or generate one if strictly needed, but better to let client gen ID or use upsert
    user_id: userId,
    name: project.name,
    color: project.color,
    default_hourly_rate: project.defaultHourlyRate,
    shifts: project.shifts
  };

  const { data, error } = await supabase
    .from('projects')
    .upsert(dbProject)
    .select()
    .single();

  if (error) {
    console.error('Error saving project:', error);
    return null;
  }

  return {
    ...data,
    defaultHourlyRate: data.default_hourly_rate
  };
};

export const deleteProject = async (id: string) => {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) console.error('Error deleting project:', error);
};

// --- ENTRIES ---

export const getEntries = async (userId?: string): Promise<TimeEntry[]> => {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching entries:', error);
    return [];
  }

  return data.map((e: any) => ({
    id: e.id,
    description: e.description,
    projectId: e.project_id,
    startTime: parseInt(e.start_time),
    endTime: e.end_time ? parseInt(e.end_time) : null,
    duration: parseFloat(e.duration),
    hourlyRate: parseFloat(e.hourly_rate),
    expenses: e.expenses,
    isNightShift: e.is_night_shift,
    user_id: e.user_id
  }));
};

export const saveEntry = async (entry: TimeEntry, userId: string): Promise<TimeEntry | null> => {
  const dbEntry = {
    id: entry.id,
    user_id: userId,
    project_id: entry.projectId,
    description: entry.description,
    start_time: entry.startTime,
    end_time: entry.endTime,
    duration: entry.duration,
    hourly_rate: entry.hourlyRate,
    expenses: entry.expenses,
    is_night_shift: entry.isNightShift
  };

  const { data, error } = await supabase
    .from('time_entries')
    .upsert(dbEntry)
    .select()
    .single();

  if (error) {
    console.error('Error saving entry:', error);
    return null;
  }
  
  return entry;
};

export const deleteEntry = async (id: string) => {
  const { error } = await supabase.from('time_entries').delete().eq('id', id);
  if (error) console.error('Error deleting entry:', error);
};

// --- PROFILES / ADMIN ---

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
};

export const createUserProfile = async (userId: string, email: string): Promise<UserProfile | null> => {
    // Check if profile already exists to avoid duplicate key error
    const existing = await getUserProfile(userId);
    if (existing) return existing;

    const newProfile = {
        id: userId,
        email: email,
        role: 'user', // Default role
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days trial
        is_approved: false // Requires admin approval
    };

    const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();
    
    if (error) {
        console.error("Error creating profile:", error);
        return null;
    }
    return data;
};

export const getAllProfiles = async (): Promise<UserProfile[]> => {
    // This will only return all profiles if the logged-in user is an admin due to RLS
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error("Error fetching all profiles", error);
        return [];
    }
    return data;
};

export const updateUserProfileAdmin = async (profile: Partial<UserProfile> & { id: string }) => {
    const { error } = await supabase
        .from('profiles')
        .update({
            is_approved: profile.is_approved,
            subscription_status: profile.subscription_status,
            role: profile.role
        })
        .eq('id', profile.id);
    
    if (error) throw error;
};

export const deleteUserAdmin = async (userId: string) => {
    // In Supabase, deleting from auth.users requires Service Role key usually, 
    // but we can delete the profile row which might cascade if configured, 
    // or simply disable them. For this SaaS boilerplate, we delete the profile data.
    // Note: To truly delete auth user, you need Edge Functions or Service Role.
    // Here we just delete the profile record.
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
};