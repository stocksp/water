import clientPromise from "libs/mongo"
import type { NextApiRequest, NextApiResponse } from "next"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    console.log("starting getPowerState!")
    const client = await clientPromise
    const db = client.db()

    const powerDoc = await db
      .collection("power")
      .find({ pump: "pressure" })
      .sort({ _id: -1 })
      .limit(1)
      .toArray()

    console.log("found", powerDoc[0])
    res.json({ message: "ok", state: powerDoc[0].state })
  } catch (error) {
    let message
    if (error instanceof Error) message = error.message
    else message = String(error)
    res.status(500).json("Error: " + message)
  }
}

export default handler
