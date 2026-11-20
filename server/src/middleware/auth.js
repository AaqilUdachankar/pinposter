import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../config/secrets.js';

export async function protect(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const error = new Error('Access denied. No authentication token provided.');
    error.statusCode = 401;
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      const error = new Error('The user belonging to this token no longer exists.');
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (err) {
    const error = new Error('Invalid or expired authentication token. Please log in again.');
    error.statusCode = 401;
    return next(error);
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const error = new Error(`User role '${req.user.role}' is not authorized to perform this action.`);
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
}
