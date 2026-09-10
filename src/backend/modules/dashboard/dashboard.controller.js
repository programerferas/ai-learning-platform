import { getOverview } from"./dashboard.service.js";

export const getDashboardOverviewController = async (req, res) => {
  try {
    const data = await getOverview();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

