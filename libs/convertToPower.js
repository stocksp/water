import { parseJSON, compareDesc } from "date-fns";

const converter = (d) => {
    let power = d.powerDocs.map((d) => {
      d.when = parseJSON(d.when);
      return d;
    });
    let voltage = d.voltageDocs.map((d) => {
      d.when = parseJSON(d.when);
      return d;
    });
    // update text and remove pressure 'on' after first onb
    let foundFirstPressure = false;
    let foundFirstWell = false;
    power = power.reduce((acc, cur, index, array) => {
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
      } else if (
        !foundFirstWell &&
        cur.state === "on" &&
        cur.pump === "well"
      ) {
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
    const dist = d.distDocs.map((d, i, arr) => {
      d.when = parseJSON(d.when);
      // if (i < 11) {
      //   const y = arr.slice(i, i + 6).map( v => v.distance);
      //   const x = [0, 1, 2, 3];
      //   let ret = {}
      //   const f = lsq(x,y, ret)
      //   console.log(ret);
      // }
      return d;
    });
    return power.concat(dist).concat(voltage).sort((a, b) => compareDesc(a.when, b.when));
  }
  export default converter