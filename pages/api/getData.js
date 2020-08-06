import { withMongo } from "libs/mongo";


const handler = async (req, res) => {
  try {
    console.log("starting getData");
    const docs = await req.db
      .collection("waterDistance")
      .find({when: {$gt:new Date(Date.now() - 24*60*60 * 1000)}})
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray();
    console.log("found", docs.length);
    res.json({ message: "ok", docs });
  } catch (error) {

    res.json("Error: " + error.toString());
  }

  // TODO - Update state in mongo to persist
  //res.json(state);
};

export default withMongo(handler);
