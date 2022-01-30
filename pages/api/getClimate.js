import { withMongo } from "libs/mongo";

const handler = async (req, res) => {
  try {
    console.log("starting getClimate!");
    // look back 5 days = 5 * 24 * 60 * 60 * 1000
    const climateDocs = await req.db
      .collection("climate")
      .find({
        when: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        $or: [{ name: "Crawl Space" }, { name: "home" }, { name: "outside" }] ,
      })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray();

    console.log("found", climateDocs.length, climateDocs[0].when);
    res.json({ message: "ok", climateDocs });
  } catch (error) {
    res.json("Error: " + error.toString());
  }
};

export default withMongo(handler);
