import { NextFunction, Request, Response } from "express"
import RequestWithUser from "../types/express"

export const authenticate = (req: RequestWithUser, res: Response, next: NextFunction): void | Response => {
  // Get token from header 'Authorization' (Bearer xxx-token) xxx = user | admin
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    // UNAUTHORIZED
    return res.status(401).json({ message: 'Unauthorized, token required' })
  }

  // Set a role based on token value
  // TODO - revisar per quan implementi auth - cambiar els case segons necessitat
  let userRole = ''
  switch (token) {
    case 'user-token':
      userRole = 'user'
      break

    case 'admin-token':
      userRole = 'admin'
      break

    default:
      // FORBIDDEN
      return res.status(403).json({ message: 'Forbidden, role not allowed' })
  }

  // Set role to object 'user' of req to use it on controllers
  req.user = { role: userRole }

  next()
}

// EXEMPLE d'autenticacio amb jwt
// TODO - investigar i aplicar
// import jwt from 'jsonwebtoken';
//
// export const authenticate = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ message: 'No autenticado' });
//
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // Almacena los datos del usuario en `req.user`
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Token inválido' });
//   }
// };
//
//--
