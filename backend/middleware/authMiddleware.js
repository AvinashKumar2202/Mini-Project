import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists in database
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "Not authorized — user no longer exists" });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  } else {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
};

export const isTeacher = (req, res, next) => {
  if (req.user && (req.user.role === "teacher" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as a teacher" });
  }
};

export const isStudent = (req, res, next) => {
  if (req.user && req.user.role === "student") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as a student" });
  }
};

export default protect;
