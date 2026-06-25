// backend/src/middleware/auth.ts
import { verifyToken } from '../utils/jwt';

export const authenticate = (req: any, res: any, next: any) => {
  // ✅ Только куки (без заголовка Authorization)
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
  req.user = payload;
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Не авторизован' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  };
};