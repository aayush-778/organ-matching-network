import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

// Persist the connection cache across hot-reloads in local development
const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

/**
 * Resolves a connection to MongoDB. If MONGODB_URI is not present in the environment,
 * it returns null, allowing the application to gracefully fall back to local seed arrays.
 */
export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) {
    return null;
  }
  if (cache.conn) {
    return cache.conn;
  }
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, { 
      bufferCommands: false 
    });
  }
  
  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  
  return cache.conn;
}