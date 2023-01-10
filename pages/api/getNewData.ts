import { de } from "date-fns/locale";
import clientPromise from "libs/mongo"
import type { NextApiRequest, NextApiResponse } from "next"

  const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    console.log("starting getData! since: ", req.query.water), req.query.power;
    const client = await clientPromise
    const db = client.db()
    //const dateTest = new Date(req.query.since);
    //console.log('the date:', dateTest.toLocaleTimeString());
    // look back 5 days = 5 * 24 * 60 * 60 * 1000
    const distDocs = await db
      .collection("waterDistance")
      .find({ when: { $gt: new Date(req.query.water as string) }})
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray();
    const powerDocs = await db
      .collection("power")
      .find({ when: { $gt: new Date(req.query.power as string) }})
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray();
    /* const voltageDocs = await req.db
      .collection("voltage")
      .find({ when: { $gt: new Date(req.query.water) }})
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray(); */
    console.log("found", distDocs.length, powerDocs.length);
    res.json({ message: "ok", distDocs, powerDocs});
  } catch (error) {
    let message
    if (error instanceof Error) message = error.message
    else message = String(error)
    res.status(500).json("Error: " + message)
  }
};

export default handler