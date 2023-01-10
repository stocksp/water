import clientPromise from "libs/mongo"
import type { NextApiRequest, NextApiResponse } from "next"
import { Db } from "mongodb"
import { isValid } from "date-fns"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("addPower", req.body.pump, req.body.state)
  try {
    const client = await clientPromise
    const db = client.db()
    const when = new Date(req.body.when)
    const state = req.body.state
    const pump = req.body.pump
    const runTime = parseInt(req.body.runTime)

    if (isValid(when)) {
      let data: PowerDoc = {
        when,
        state,
        pump,
      }
      if (runTime) {
        data.runTime = runTime
      }

      let resp = await db.collection("power").insertOne(data)
      console.log("resp")
      res.statusCode = 200
      res.json({
        message: "aok",
        resp,
      })
    } else res.status(500).json("Error: bad parameter when")
  } catch (e) {
    console.log("catch error", e)
  }
}

export default handler
