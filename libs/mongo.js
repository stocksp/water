import { MongoClient } from "mongodb";

const setupMongo = async () => {
  // If the database connection is cached,
  // use it instead of creating a new connection
  console.log("setupMongo", process.env.MONGO_URI_PROD, process.env.MONGO_URI_PROD);
  if (process.env.NODE_ENV === "development") {
    if (global.cachedDb) {
      console.log("Cached mongo connection reused");
      return global.cachedDb;
    }

    // If no connection is cached, create a new one
    const client = await MongoClient.connect(
      process.env.MONGO_URI_LOCAL,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    const db = await client.db();
    global.cachedDb = db;
    console.log("New Mongo connection established");
    return global.cachedDb;
  }

  //console.log("Shouldn't be here in dev!!!");
  if (global.cachedDb) {
    //console.log("Cached mongo connection reused", process.env.MONGO_URI_PROD);
    return global.cachedDb;
  }
  // If no connection is cached, create a new one
  const client = await MongoClient.connect(
    process.env.MONGO_URI_PROD,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
  const db = await client.db("matchClub");
  global.cachedDb = db;
  //console.log("New Mongo connection established", process.env.MONGO_URI_PROD);
  return global.cachedDb;

};

const connectToMongo = async () => {
  return await setupMongo();
};

const withMongo = (handler) => {
  return async (req, res) => {
    req.db = await setupMongo();
    return handler(req, res);
  };
};

export { connectToMongo, withMongo };