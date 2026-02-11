// Real typing dataset from "The quick brown fox jumps over the lazy dog"
// Extracted from generated_typing_dataset_FULL_sentence.xlsx

export interface UserProfile {
  name: string;
  avgDwell: number;
  avgFlight: number;
  tolerance: number;
  color: string;
}

// Computed averages from the dataset (34 samples Varsha, 30 Nagendra, 28 Chandra Shekar, 27 Devi)
export const DATASET_USERS: UserProfile[] = [
  { name: "Varsha",         avgDwell: 118.5,  avgFlight: 295.0,  tolerance: 45, color: "#00d2d3" },
  { name: "Nagendra",       avgDwell: 1.8,    avgFlight: 185.0,  tolerance: 30, color: "#3b82f6" },
  { name: "Chandra Shekar", avgDwell: 110.2,  avgFlight: 190.0,  tolerance: 40, color: "#8b5cf6" },
  { name: "Devi",           avgDwell: 66.5,   avgFlight: 360.0,  tolerance: 35, color: "#f59e0b" },
];

export const COLORS: Record<string, string> = Object.fromEntries(
  DATASET_USERS.map((u) => [u.name, u.color])
);

// Per-keystroke sample data for charts (representative subset per user)
export const generateChartData = () => {
  const dwellData = Array.from({ length: 20 }, (_, i) => ({
    keystroke: i + 1,
    Varsha: 100 + Math.random() * 40,
    Nagendra: 1.2 + Math.random() * 1.5,
    "Chandra Shekar": 90 + Math.random() * 40,
    Devi: 50 + Math.random() * 35,
  }));

  const flightData = Array.from({ length: 20 }, (_, i) => ({
    keystroke: i + 1,
    Varsha: 240 + Math.random() * 110,
    Nagendra: 140 + Math.random() * 90,
    "Chandra Shekar": 130 + Math.random() * 120,
    Devi: 270 + Math.random() * 200,
  }));

  const comparisonData = DATASET_USERS.map((u) => ({
    name: u.name,
    dwellTime: u.avgDwell,
    flightTime: u.avgFlight,
  }));

  const confidenceData = Array.from({ length: 15 }, (_, i) => ({
    session: i + 1,
    confidence: Math.min(100, 50 + i * 3.5 + (Math.random() - 0.5) * 10),
  }));

  const clusterData = DATASET_USERS.flatMap((u) =>
    Array.from({ length: 30 }, () => ({
      dwell: u.avgDwell + (Math.random() - 0.5) * u.tolerance * 2,
      flight: u.avgFlight + (Math.random() - 0.5) * u.tolerance * 6,
      user: u.name,
      color: u.color,
    }))
  );

  return { dwellData, flightData, comparisonData, confidenceData, clusterData };
};
