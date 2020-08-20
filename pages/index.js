import Head from "next/head";
import Header from "components/header";
import useSWR, { SWRConfig } from "swr";
import fetch from "unfetch";
import { Table, Container } from "react-bootstrap";
import { format, parseJSON, compareDesc } from "date-fns";

const fetcher = (url) => fetch(url).then((r) => r.json());

function doFormat(theDate) {
  return format(theDate, "MMM d, h:mm:ss a");
}
function makeTime(seconds) {
  return (seconds / 60).toFixed(1) + " mins";
}

export default function Home() {
  let theData = null;
  const { data } = useSWR("/api/getData", fetcher, { refreshInterval: 10000 });
  if (data) {
    console.log("we have data: docs", data.distDocs.length, data.distDocs[0]);
    // make real date
    let power = data.powerDocs.map((d) => {
      d.when = parseJSON(d.when);
      return d;
    });
    // combine on off ignore on if there is an off
    power = power.reduce((acc, cur, index, array) => {
      if (index === 0 && cur.state === "on") {
        cur.state = cur.pump === "well" ? "Well running" : "Pressure running";
        acc.push(cur);
        return acc;
      } else if (cur.state === "off" && cur.pump === "well") {
        cur.state = "Well ran";
        acc.push(cur);
      } else if (cur.state === "on" && cur.pump === "well") {
        cur.state = "Well starting";
        acc.push(cur);
      } else if (cur.state === "off" && cur.pump === "pressure") {
        cur.state = "Pressure ran";
        acc.push(cur);
      }
      return acc;
    }, []);
    const dist = data.distDocs.map((d) => {
      d.when = parseJSON(d.when);
      return d;
    });
    theData = power.concat(dist).sort((a, b) => compareDesc(a.when, b.when));
  } else {
    console.log("no data");
  }
  function currentDistance() {
    return theData.find((v) => v.distance).distance;
  }
  return (
    <div>
      <Head>
        <title>Water Report</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      {data ? (
        <Container>
          <h3>
            Current well height <strong>{currentDistance()}</strong>
          </h3>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>What</th>
                <th>When</th>
                <th>Dist</th>
              </tr>
            </thead>
            <tbody>
              {theData.map((r, i) => {
                return (
                  <tr key={i}>
                    <td key={1}>{r.distance ? "Distance" : r.state}</td>
                    <td key={2}>{doFormat(r.when)}</td>
                    <td key={3}>
                      {r.distance
                        ? r.distance
                        : r.runTime
                        ? makeTime(r.runTime)
                        : r.state === "Well running"
                        ? r.state
                        : "---"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Container>
      ) : (
        <div> NO Data </div>
      )}
    </div>
  );
}
