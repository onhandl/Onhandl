import mongoose from 'mongoose'
import { Logger } from 'borgen'
import seedDatabase from './seedDb'
import { ENV } from '../../shared/config/environments'

mongoose.set('strictQuery', true)

const connectDb = (server: () => void): void => {
	mongoose
		.connect(ENV.MONGO_URI, {
			// Add robust connection options
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		})
		.then(() => {
			Logger.info({ message: 'Successfully connected to MongoDB Atlas' })
			const isInitialized = seedDatabase()

			if (isInitialized) {
				server()
			} else {
				Logger.error({ message: 'Database initialization failed' })
				process.exit(1)
			}
		})
		.catch((err) => {
			Logger.error({ message: 'Failed to connect to MongoDB: ' + err.message })
			console.error(err)
			process.exit(1) // Exit process if database connection fails
		})
}

export default connectDb

