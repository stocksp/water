import clientPromise from "libs/mongo"
import type { NextApiRequest, NextApiResponse } from "next"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    console.log("starting getData!")
    const client = await clientPromise
    const db = client.db()
    // look back 5 days = 5 * 24 * 60 * 60 * 1000
    const distDocs = await db
      .collection("waterDistance")
      .find({ when: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray()
    const powerDocs = await db
      .collection("power")
      .find({
        when: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray()
    const voltageDocs = await db
      .collection("voltage")
      .find({
        when: { $gt: new Date(Date.now() - 72 * 60 * 60 * 1000) },
      })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray()
    console.log("found", distDocs.length, powerDocs.length, voltageDocs.length)
    res.status(200).json({ message: "ok", distDocs, powerDocs, voltageDocs })
  } catch (error) {
    let message
    if (error instanceof Error) message = error.message
    else message = String(error)
    res.status(500).json("Error: " + message)
  }

  // TODO - Update state in mongo to persist
  //res.json(state);
}

export default handler
