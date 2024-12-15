import { NextFunction, Request, Response } from "express";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // TODO - nota - esborrar quan estigui clar
  // Get token from header 'Authorization' (Bearer xxx-token) xxx = user | admin
  const token = req.headers.authorization?.split(" ")[1];

  if (!token || token !== "admin-token") {
    // UNAUTHORIZED
    res.status(401).json({ message: "Unauthorized, token required" });
    return;
  }

  next();
};

// EXEMPLE d'autenticacio amb jwt
// TODO - investigar i tasca
// investigar i aplicar

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
//
