import mongoose from 'mongoose';

// Function to connect to the MongoDB database
const connectDB = async () => {

    mongoose.connection.on('connected', () => console.log('Database connected successfully'))

    // Use dbName option to avoid corrupting query params in MONGODB_URI
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'job-portal' })

}

export default connectDB;