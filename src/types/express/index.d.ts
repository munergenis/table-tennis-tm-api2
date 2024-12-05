import 'express'

declare module 'express' {
  interface Request {
    user?: { role: string }
  }
}
