import * as userService from "./user.service.js";

// كل الأخطاء تذهب للمعالج المركزي: P2025 → 404، AppError → رمزه،
// وأي شيء آخر → 500 برسالة عامة في الإنتاج بدل تسريب error.message

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsersService();
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserByIdService(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUserService(
      req.params.id,
      req.body,
      req.user,
    );
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUserService(req.params.id, req.user);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};
