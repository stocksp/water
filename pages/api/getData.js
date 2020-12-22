import { withMongo } from "libs/mongo";

const handler = async (req, res) => {
  try {
    console.log("starting getData!");
    const distDocs = await req.db
      .collection("waterDistance")
      .find({ when: { $gt: new Date(Date.now() - 72 * 60 * 60 * 1000) } })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray();
    const powerDocs = await req.db
      .collection("power")
      .find({
        when: { $gt: new Date(Date.now() - 72 * 60 * 60 * 1000) },
      })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray();
      const voltageDocs = await req.db
      .collection("voltage")
      .find({
        when: { $gt: new Date(Date.now() - 72 * 60 * 60 * 1000) },
      })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray();
    console.log("found", distDocs.length, powerDocs.length, voltageDocs.length);
    res.json({ message: "ok", distDocs, powerDocs, voltageDocs });
  } catch (error) {
    res.json("Error: " + error.toString());
  }

  // TODO - Update state in mongo to persist
  //res.json(state);
};

export default withMongo(handler);
