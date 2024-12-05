import express from "express"
import tournamentRouter from './routes/tournamentRouter.js'
import { authenticate } from "./middleware/auth.js"

const app = express()

// Middlewares
app.use(express.json())
// TODO - revisar - en teoria es per manejar formularis
app.use(express.urlencoded({ extended: true }))

app.use('/tournaments', tournamentRouter)

export default app
