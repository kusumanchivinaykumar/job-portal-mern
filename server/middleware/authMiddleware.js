import jwt from "jsonwebtoken"
import Company from "../models/Company.js"
import User from "../models/User.js"

/* =======================
   PROTECT USER
======================= */
export const protectUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, user token missing"
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select("-password")
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid user token"
    })
  }
}

/* =======================
   PROTECT COMPANY
======================= */
export const protectCompany = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, company token missing"
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.company = await Company.findById(decoded.id).select("-password")
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid company token"
    })
  }
}
