import { isValid } from "date-fns"
import clientPromise from "libs/mongo"
import type { NextApiRequest, NextApiResponse } from "next"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = await clientPromise
  const db = client.db()
  console.log("addClimate", req.body.temperature)
  try {
    const when = new Date(req.body.when)
    const temperature = parseFloat(req.body.temperature)
    const name = req.body.name
    const humidity = parseFloat(req.body.humidity)

    if (!isNaN(temperature) && isValid(when)) {
      const data = {
        when,
        temperature,
        humidity,
        name,
      }
      console.log(`when: ${req.body.when} as date: ${when}`)
      let resp = await db.collection("climate").insertOne(data)
      console.log("resp")
      res.statusCode = 200
      res.json({
        message: "aok",
        resp,
      })
    } else throw new Error('Bad params in body')
  } catch (error) {
    let message
    if (error instanceof Error) message = error.message
    else message = String(error)
    res.status(500).json("Error: " + message)
  }
}

export default handler
