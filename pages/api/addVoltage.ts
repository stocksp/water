import clientPromise from "libs/mongo"
import type { NextApiRequest, NextApiResponse } from "next"
import { Db } from "mongodb"
import { isValid } from "date-fns"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("addPVoltage", req.body.voltage)
  try {
    const client = await clientPromise
    const db = client.db()
    const when = new Date(req.body.when)
    const voltage = parseFloat(req.body.voltage)

    if (isValid(when)) {
      let data = {
        when,
        voltage,
      }

      let resp = await db.collection("voltage").insertOne(data)
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
