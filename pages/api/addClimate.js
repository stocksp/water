import { withMongo } from "libs/mongo";
import { isValid } from "date-fns";

const handler = async (req, res) => {
    console.log("addClimate", req.body.temperature);
    try {
      const when = new Date(req.body.when);
      const temperature = parseFloat(req.body.temperature);
      const name = req.body.name;
      const humidity = parseFloat(req.body.humidity)
  
      if (!isNaN(temperature) && isValid(when)) {
        const data = {
          when,
          temperature,
          humidity,
          name
        };
        console.log(`when: ${req.body.when} as date: ${when}`)
        let resp = await req.db.collection("climate").insertOne(data);
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
