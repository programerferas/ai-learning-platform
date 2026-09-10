export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  
  if (!result.success) {
    // zod v4: القضايا في issues، والحقل errors أُزيل
    const errors = result.error.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(400).json({ 
      message: errors[0]?.message || "فشل التحقق من الصحة", 
      errors 
    });
  }
  
  req.body = result.data;
  next();
};