import { fetchDashboardData, fetchProfiles, type DashboardData } from "@/lib/api";

export interface UserProfile {
  name: string;
  email: string;
  avgDwell: number;
  avgFlight: number;
  tolerance: number;
  color: string;
}

export const getDatasetUsers = async (): Promise<UserProfile[]> => {
  const profiles = await fetchProfiles();
  return profiles.map((profile) => ({
    name: profile.name,
    email: profile.email,
    avgDwell: profile.avgDwell,
    avgFlight: profile.avgFlight,
    tolerance: profile.tolerance,
    color: profile.color,
  }));
};

export const getColors = async (): Promise<Record<string, string>> => {
  const users = await getDatasetUsers();
  return Object.fromEntries(users.map((user) => [user.name, user.color]));
};

export const getChartData = async (): Promise<DashboardData> => fetchDashboardData();
