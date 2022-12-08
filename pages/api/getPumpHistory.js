import { de } from "date-fns/locale";
import {
  format,
  differenceInMinutes,
  differenceInHours,
  isAfter,
} from "date-fns";
import { withMongo } from "libs/mongo";

const getDistVal = (date, arr) => {
  const dists = arr.filter((x) => x.distance);
  let val = dists.find((d) => d.when.getTime() < date.getTime());
  return val ? val.distance : 0;
};

const handler = async (req, res) => {
  try {
    // look back from June 30
    console.log("starting getPumpHistory new one");
    const distDocs = await req.db
      .collection("waterDistance")
      .find({ when: { $gt: new Date("Mar 1, 2021") } })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray();
    let powerDocs = await req.db
      .collection("power")
      .find({
        when: { $gt: new Date("Mar 1, 2021") },
        pump: "well",
      })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray();

    let foundFirstPressure = false;
    let foundFirstWell = false;
    let power = powerDocs.reduce((acc, cur, index, array) => {
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
        acc.push(cur);
        return acc;
      } else if (!foundFirstWell && cur.state === "on" && cur.pump === "well") {
        cur.state = "Well running";
        foundFirstWell = true;
        acc.push(cur);
        return acc;
      } else if (cur.state === "off" && cur.pump === "well") {
        cur.state = "Well ran";
        foundFirstWell = true;
        acc.push(cur);
      } else if (cur.state === "on" && cur.pump === "well") {
        cur.state = "Well starting";
        acc.push(cur);
      } else if (cur.state === "off" && cur.pump === "pressure") {
        cur.state = "Pressure ran";
        foundFirstPressure = true;
        acc.push(cur);
      }
      return acc;
    }, []);

    power = power.map((d) => {
      let runTimeStr;
      if (d.runTime) {
        runTimeStr = `${(d.runTime / 60).toFixed(1)} mins`;
      } else runTimeStr = "-----";
      return { what: d.state, when: d.when, runTime: runTimeStr };
    });
    let groups = [];
    let group = [];
    power.reverse().forEach((v) => {
      if (group.length == 0) {
        if (v.what == "Well starting") group.push(v);
      } else {
        if (v.what === "Well starting") {
          const pumpSpan = isAfter(v.when, new Date(2021, 7, 18)) ? 210 : 30;
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
    groups = groups.map((v, i, arr) => {
      let time = v
        .filter((o) => o.what === "Well ran")
        .reduce((a, b) => {
          return a + parseFloat(b.runTime);
        }, 0);
      time = Math.round(time * 10) / 10;
      //console.log("time", time);
      // frags = "49.0,9.8,7.4,1.2"
      const frags = v
        .filter((o) => o.what === "Well ran")
        .reduce((a, b) => {
          return a + b.runTime.split(" ")[0] + "+";
        }, "")
        .slice(0, -1);
      const distStr = `${getDistVal(v[0].when, distDocs)}-${getDistVal(
        v[v.length - 1].when,
        distDocs
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
          : 0;
      return {
        time,
        frags,
        sinceLastPump,
        when: v[v.length - 1].when,
        dists: distStr,
      };
    });

    res.json({ message: "ok", fillSessions: groups });
  } catch (error) {
    res.json("Error: " + error.toString());
  }
};

export default withMongo(handler);
