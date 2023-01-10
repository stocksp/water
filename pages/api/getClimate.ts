import clientPromise from "libs/mongo"
import type { NextApiRequest, NextApiResponse } from "next"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    console.log("starting getClimate!")
    const client = await clientPromise
    const db = client.db()
    // look back 5 days = 5 * 24 * 60 * 60 * 1000
    const climateDocs = await db
      .collection("climate")
      .find({
        when: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        $or: [
          { name: "Crawl Space" },
          { name: "home" },
          { name: "outside" },
          { name: "Well Climate inside" },
        ],
      })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray()

    console.log("found", climateDocs.length, climateDocs[0].when)
    res.json({ message: "ok", climateDocs })
  } catch (error) {
    let message
    if (error instanceof Error) message = error.message
    else message = String(error)
    res.status(500).json("Error: " + message)
  }
}

export default handler
