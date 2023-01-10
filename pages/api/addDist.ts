import clientPromise from "libs/mongo"
import type { NextApiRequest, NextApiResponse } from "next"
import { Db } from "mongodb"
import { isValid } from "date-fns"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("addDist", req.body.distance)
  try {
    const client = await clientPromise
    const db = client.db()
    const when = new Date(req.body.when)
    const distance = parseFloat(req.body.distance)

    if (!isNaN(distance) && isValid(when)) {
      const data = {
        when,
        distance,
      }

      let resp = await db.collection("waterDistance").insertOne(data)
      res.status(200).json({
        message: "aok",
        resp,
      })
    } else res.status(500).json("Error: bad parameter dist")
  } catch (error) {
    let message
    if (error instanceof Error) message = error.message
    else message = String(error)
    res.status(500).json("Error: " + message)
  }
}

export default handler
