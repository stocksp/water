import { withMongo } from "libs/mongo";
import { isValid } from "date-fns";

const handler = async (req, res) => {
  console.log("addPower", req.body.pump, req.body.state);
  try {
    const when = new Date(req.body.when);
    const state = req.body.state; 
    const pump = req.body.pump;
    const runTime = parseInt(req.body.runTime);

    if (isValid(when)) {
      let data = {
        when,
        state,
        pump
      };
      if(runTime) {
          data.runTime = runTime;
      }

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
