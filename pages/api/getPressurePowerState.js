import { withMongo } from "libs/mongo";

const handler = async (req, res) => {
    try {
        console.log("starting getPowerState!");
        // look back 5 days = 5 * 24 * 60 * 60 * 1000

        const powerDoc = await req.db
            .collection("power")
            .find({pump:'pressure'})
            .sort({ _id: -1 })
            .limit(1)
            .toArray();

        console.log("found", powerDoc[0]);
        res.json({ message: "ok", state: powerDoc[0].state });
    } catch (error) {
        res.json("Error: " + error.toString());
    }

    // TODO - Update state in mongo to persist
    //res.json(state);
};

export default withMongo(handler);
