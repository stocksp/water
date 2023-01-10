import { de } from "date-fns/locale";
import {
  format,
  differenceInMinutes,
  differenceInHours,
  isAfter,
} from "date-fns";
import clientPromise from "libs/mongo"
import type { NextApiRequest, NextApiResponse } from "next"
import { Db } from "mongodb";



const getDistVal = (date: Date, arr: [DistDoc]) => {
  const dists = arr.filter((x) => x.distance);
  let val = dists.find((d) => d.when.getTime() < date.getTime());
  return val ? val.distance : 0;
};

const getData = async (db: Db, date: Date, lastWhen = 0) => {
  const distDocs = await db
    .collection<DistDoc>("waterDistance")
    .find({ when: { $gt: date } })
    .project({ _id: 0 })
    .sort({ _id: -1 })
    .toArray();
  let powerDocs = await db
    .collection<PowerDoc>("power")
    .find({
      when: { $gt: date },
      pump: "well",
    })
    .project({ _id: 0 })
    .sort({ _id: -1 })
    .toArray();
  if (powerDocs.length === 0) return [];

  let foundFirstPressure = false;
  let foundFirstWell = false;
  let power = powerDocs.reduce((acc: PowerDoc[], cur, index) => {
    // if (cur.pump === "pressure" && index < 9) {
    //   console.log(cur.state);
    // }
    if (
      !foundFirstPressure &&
      cur.state === "on" &&
      cur.pump === "pressure"
    ) {
      cur.state = "Pressure running";
      foundFirstPressure = true;
      acc.push(cur as PowerDoc);
      return acc;
    } else if (!foundFirstWell && cur.state === "on" && cur.pump === "well") {
      cur.state = "Well running";
      foundFirstWell = true;
      acc.push(cur as PowerDoc);
      return acc;
    } else if (cur.state === "off" && cur.pump === "well") {
      cur.state = "Well ran";
      foundFirstWell = true;
      acc.push(cur as PowerDoc);
    } else if (cur.state === "on" && cur.pump === "well") {
      cur.state = "Well starting";
      acc.push(cur as PowerDoc);
    } else if (cur.state === "off" && cur.pump === "pressure") {
      cur.state = "Pressure ran";
      foundFirstPressure = true;
      acc.push(cur as PowerDoc);
    }
    return acc;
  }, []);

  let powerData = power.map((d: PowerDoc) => {
    let runTimeStr;
    if (d.runTime) {
      runTimeStr = `${(d.runTime / 60).toFixed(1)} mins`;
    } else runTimeStr = "-----";
    return { what: d.state, when: d.when, runTime: runTimeStr };
  });
  let groups: PowerData[][] = [];
  let group: PowerData[] = [];
  powerData.reverse().forEach((v) => {
    if (group.length == 0) {
      if (v.what == "Well starting") group.push(v);
    } else {
      if (v.what === "Well starting") {
        const pumpSpan = 210;
        const previous = group[group.length - 1];
        const diff = differenceInMinutes(v.when, previous.when);
        if (diff < pumpSpan + parseFloat(previous.runTime)) {
          group.push(v);
        } else {
          groups.push(group);
          group = [];
          group.push(v);
        }
      }

      if (v.what === "Well ran") {
        group.push(v);
      }
    }
  });

  groups.push(group);
  groups.reverse();
  let powerGroup: Array<PowerGroup> = groups.map((v, i, arr) => {
    let time = v
      .filter((o) => o.what === "Well ran")
      .reduce((a, b) => {
        return a + parseFloat(b.runTime);
      }, 0);
    time = Math.round(time * 10) / 10;
    //console.log("time", time);
    // frags = "49.0,9.8,7.4,1.2"
    const frags: string = v
      .filter((o) => o.what === "Well ran")
      .reduce((a, b) => {
        return a + b.runTime.split(" ")[0] + "+";
      }, "")
      .slice(0, -1);
    console.log(`before distStr v length ${v.length}`)
    const distStr = `${getDistVal(v[0].when, distDocs as [DistDoc])}-${getDistVal(
      v[v.length - 1].when,
      distDocs as [DistDoc]
    )}`;
    // console.log(
    //   "frags",
    //   frags,
    //   "start time",
    //   getDistVal(v[0].when, data),
    //   getDistVal(v[v.length - 1].when, data)
    // );
    const sinceLastPump =
      i < arr.length - 1
        ? differenceInHours(v[0].when, arr[i + 1][arr[i + 1].length - 1].when)
        : lastWhen == 0 ? 0 : differenceInHours(v[0].when, lastWhen);
    return {
      time,
      frags,
      sinceLastPump,
      when: v[v.length - 1].when,
      dists: distStr,
    };
  });
  return powerGroup
}



const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    console.log("starting getPumpHistory new one");
    const client = await clientPromise
    const db = client.db()
    // find last history
    let hist = await db
      .collection("wellHistory")
      .find({})
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray();
    console.log(`history length: ${hist.length}`)
    if (hist.length == 0) {
      const groups = await getData(db, new Date("Aug 1, 2022"))
      console.log(`groups length: ${groups.length} ${groups[0].when}`)
      let resp = await db.collection("wellHistory").insertMany(groups.reverse());

      res.json({ message: "ok", fillSessions: groups });
    } else {
      const newGroups = await getData(db, hist[0].when, hist[0].when);
      if (newGroups.length === 0) {
        res.json({ message: "ok", fillSessions: hist });
        return;
      }
      //console.log(`group length ${newGroups.length}, ${newGroups[0].sinceLastPump}`)
      let resp = await db.collection("wellHistory").insertMany(newGroups);
      res.json({ message: "ok", fillSessions: newGroups.concat(hist as PowerGroup[]) });
    }
  } catch (error) {
    let message
    if (error instanceof Error) message = error.message
    else message = String(error)
    res.status(500).json("Error: " + message)
  }

};

export default handler
