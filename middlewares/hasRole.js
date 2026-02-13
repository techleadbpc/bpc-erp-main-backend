function hasRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.roleId)) {
            return res.sendError({ message: 'Forbidden: Insufficient permissions', name: "PermissionDeniedError" }, 403);
        }
        next();
    };
}

module.exports = hasRole;