import { withMongo } from "libs/mongo";
import { isValid } from "date-fns";

const handler = async (req, res) => {
  console.log("addPVoltage", req.body.voltage);
  try {
    const when = new Date(req.body.when);
    const voltage = parseFloat(req.body.voltage);

    if (isValid(when)) {
      let data = {
        when,
        voltage
      };
      
      let resp = await req.db.collection("voltage").insertOne(data);
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
