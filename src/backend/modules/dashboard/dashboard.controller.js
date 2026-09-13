import { getOverview } from "./dashboard.service.js";

export const getDashboardOverviewController = async (req, res, next) => {
  try {
    const data = await getOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err); // المعالج المركزي يخفي تفاصيل أخطاء القاعدة في الإنتاج
  }
};
