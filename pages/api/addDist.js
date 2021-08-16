import { withMongo } from "libs/mongo";
import { isValid } from "date-fns";

const handler = async (req, res) => {
  console.log("addDist", req.body.dist);
  try {
    const date = new Date(req.body.date);
    const dist = parseFloat(req.body.dist);

    if (!isNaN(dist) && isValid(date)) {
      const data = {
        date,
        dist,
      };

      let resp = await req.db.collection("testing").insertOne(data);
      console.log("resp");
      res.statusCode = 200;
      res.json({
        message: "aok",
        resp,
      });
    } else return error;
  } catch (e) {
    console.log("catch error", e);
  }
};

export default withMongo(handler);
