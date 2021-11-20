import { withMongo } from "libs/mongo";
import { isValid } from "date-fns";

const handler = async (req, res) => {
  console.log("addDist", req.body.distance);
  try {
    const when = new Date(req.body.when);
    const distance = parseFloat(req.body.distance);

    if (!isNaN(distance) && isValid(when)) {
      const data = {
        when,
        distance,
      };

      let resp = await req.db.collection("waterDistance").insertOne(data);
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
