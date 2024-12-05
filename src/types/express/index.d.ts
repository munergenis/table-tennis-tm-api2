import { Request } from 'express'

interface RequestWithUser extends Request {
  user: { role: string }
}

export default RequestWithUser
