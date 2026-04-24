/**
 * Role-based access control middleware.
 * Usage: router.get("/admin-only", rbac("admin"), handler)
 */
function rbac(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied — insufficient role" });
    }
    next();
  };
}

module.exports = rbac;
