import { de } from "date-fns/locale";
import { withMongo } from "libs/mongo";

const handler = async (req, res) => {
  try {
    console.log("starting getData! since: ", req.query.since);
    //const dateTest = new Date(req.query.since);
    //console.log('the date:', dateTest.toLocaleTimeString());
    // look back 5 days = 5 * 24 * 60 * 60 * 1000
    const distDocs = await req.db
      .collection("waterDistance")
      .find({ when: { $gt: new Date(req.query.since) }})
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray();
    const powerDocs = await req.db
      .collection("power")
      .find({ when: { $gt: new Date(req.query.since) }})
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray();
    const voltageDocs = await req.db
      .collection("voltage")
      .find({ when: { $gt: new Date(req.query.since) }})
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray();
    console.log("found", distDocs.length, powerDocs.length, voltageDocs.length);
    res.json({ message: "ok", distDocs, powerDocs, voltageDocs });
  } catch (error) {
    res.json("Error: " + error.toString());
  }
};

export default withMongo(handler);