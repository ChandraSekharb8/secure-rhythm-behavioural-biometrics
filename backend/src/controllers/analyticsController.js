import { getDashboardCharts } from "../services/analyticsService.js";

export const chartDataHandler = async (req, res) => {
  const data = await getDashboardCharts();
  res.json(data);
};

