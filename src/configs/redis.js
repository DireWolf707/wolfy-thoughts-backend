import { createClient } from "redis"

const redis = createClient({ url: process.env.REDIS_URL })

try {
  await redis.connect()
  console.log("RedisDB connection successful!")
} catch (err) {
  console.error("Error in RedisDB Connection!")
  console.error(err.name, err.message)
  process.exit(1)
}

export default redis
