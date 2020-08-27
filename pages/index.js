import Head from "next/head";
import Header from "components/header";
import useSWR, { SWRConfig } from "swr";
import fetch from "unfetch";
import {
  Table,
  Container,
  Row,
  Col,
  ButtonGroup,
  Button,
  Form,
  FormGroup,
  Label,
  CustomInput,
} from "reactstrap";
import { format, parseJSON, compareDesc, differenceInMinutes } from "date-fns";
import lsq from "libs/leastSquares";
import { useState } from "react";

function doFormat(theDate) {
  return format(theDate, "MMM d, h:mm:ss a");
}
function makeTime(seconds) {
  return (seconds / 60).toFixed(1) + " mins";
}
let theData = null;
export default function Home() {
  const [dataToUse, setDataToUse] = useState("all");

  const { data } = useSWR("/api/getData", fetcher, { refreshInterval: 10000 });
  if (data) {
    console.log("we have data: docs", data.length, data[0]);
  } else {
    console.log("no data");
  }
  function currentDistance() {
    return data.find((v) => v.distance).distance;
  }
  function isWellrunning() {
    const resp = data.find((v) => v.state === "Well running");
    if (resp) {
      return (
        <h4>Well pump is on... started {format(resp.when, "h:mm:ss a")}</h4>
      );
    }
    return "";
  }
  function isPressurerunning() {
    const resp = data.find((v) => v.state === "Pressure running");
    if (resp) {
      return (
        <h4>Pressure pump is on... started {format(resp.when, "h:mm:ss a")}</h4>
      );
    }
    return "";
  }
  function waterUsedLast(minutes) {
    const dists = data
      .filter(
        (v) => v.distance && differenceInMinutes(new Date(), v.when) <= minutes
      )
      .map((v) => v.distance);
    if (dists) {
      const max = Math.max(...dists);
      const min = Math.min(...dists);
      const dir = dists[0] > dists[dists.length - 1] ? "used" : "gained";
      //console.log("max", max, "min", min);
      return (
        <h5>
          Water {dir} last {minutes} minutes {((max - min) * 70).toFixed(1)}{" "}
          gallons {(max - min).toFixed(1)} - inches
        </h5>
      );
    }
    return "";
  }
  const getBGColor = (data) => {
    //console.log("dataTouse", dataToUse);
    if (dataToUse === "well" || dataToUse === "pressure") return {};
    switch (data.pump) {
      case "well":
        return { backgroundColor: "rgba(255, 99, 71, 0.5)" };
      case "pressure":
        return { backgroundColor: "rgb(173, 175, 204)" };
      default:
        return {};
    }
  };
  const onRadio = (event) => {
    console.log("what to show", event.target.value);
    setDataToUse(event.target.id);
    //setWhere(event.target.value);
  };

  let useThis;
  if (dataToUse === "all") useThis = data;
  if (dataToUse === "well") useThis = data.filter((d) => d.pump === "well");
  if (dataToUse === "pressure")
    useThis = data.filter((d) => d.pump === "pressure");

  return (
    <div>
      <Head>
        <title>Water Report</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      {data ? (
        <Container>
          <Form inline>
            <FormGroup check inline>
              <Label size="lg" for="radios">
                What to show!
              </Label>
              <div>
                <CustomInput
                  type="radio"
                  id="all"
                  name="all"
                  label="All"
                  inline
                  onChange={onRadio}
                  checked={dataToUse === "all"}
                />
                <CustomInput
                  type="radio"
                  id="well"
                  name="well"
                  label="Well"
                  inline
                  onChange={onRadio}
                  checked={dataToUse === "well"}
                />
                <CustomInput
                  type="radio"
                  id="pressure"
                  name="pressure"
                  label="Pressure"
                  inline
                  onChange={onRadio}
                  checked={dataToUse === "pressure"}
                />
              </div>
            </FormGroup>
          </Form>

          <Row>
            <Col md={{ span: 10, offset: 2 }}>
              <h3>
                Current well distance <strong>{currentDistance()}</strong>{" "}
              </h3>
            </Col>
          </Row>
          <Row>
            <Col md={{ span: 10, offset: 2 }}>{isWellrunning()}</Col>
          </Row>
          <Row>
            <Col md={{ span: 10, offset: 2 }}>{isPressurerunning()}</Col>
          </Row>
          <Row>
            <Col md={{ span: 10, offset: 2 }}>{waterUsedLast(60)}</Col>
          </Row>
          <Row>
            <Col md={{ span: 10, offset: 2 }}>{waterUsedLast(30)}</Col>
          </Row>

          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>What</th>
                <th>When</th>
                <th>Dist</th>
              </tr>
            </thead>
            <tbody>
              {useThis.map((r, i) => {
                return (
                  <tr key={i} style={getBGColor(r)}>
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
const fetcher = (url) =>
  fetch(url).then((r) =>
    r.json().then((d) => {
      let power = d.powerDocs.map((d) => {
        d.when = parseJSON(d.when);
        return d;
      });
      // combine on off ignore on if there is an off
      let foundFirstPressure = false;
      let foundFirstWell = false;
      power = power.reduce((acc, cur, index, array) => {
        if (cur.pump === "pressure" && index < 9) {
          console.log(cur.state);
        }
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
      return power.concat(dist).sort((a, b) => compareDesc(a.when, b.when));
    })
  );
