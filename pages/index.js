import Head from "next/head";
import Header from "components/header";
import useSWR from "swr";
import fetcher from "libs/fetcher";
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
import { format, differenceInMinutes } from "date-fns";

import { useState } from "react";
import Link from "next/link";
import isWithinInterval from "date-fns/isWithinInterval/index";

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
      let max = Math.max(...dists);
      let min = Math.min(...dists);
      max = max === Infinity || max === -Infinity ? 0 : max;
      min = min === Infinity || min === -Infinity ? 0 : min;
      if (minutes === 120 && Math.abs(max - min) <= 0.1) return "";
      const dir = dists[0] > dists[dists.length - 1] ? "used" : "gained";
      //console.log("max", max, "min", min);
      return (
        <h5>
          Water {dir} last {minutes} mins {((max - min) * 70).toFixed(1)} gals{" "}
          {(max - min).toFixed(1)} - inches
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
  let tableHeader3 = "Dist/ Time";
  if (dataToUse === "all") {
    useThis = data ? data.filter((d) => (d.voltage ? false : true)) : data;
  }
  if (dataToUse === "well") {
    useThis = data.filter((d) => d.pump === "well");
    tableHeader3 = "Time";
  }
  if (dataToUse === "pressure") {
    useThis = data.filter((d) => d.pump === "pressure");
    tableHeader3 = "Time";
  }
  if (dataToUse === "voltage") {
    useThis = data.filter((d) => (d.voltage ? true : false));
    tableHeader3 = "Voltage";
  }

  return (
    <div>
      <Head>
        <title>Water Report</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      {data && data.length > 0 ? (
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
                <CustomInput
                  type="radio"
                  id="voltage"
                  name="voltage"
                  label="Voltage"
                  inline
                  onChange={onRadio}
                  checked={dataToUse === "voltage"}
                />
              </div>
            </FormGroup>
            <Link href="/charts">
              <a>Chart</a>
            </Link>
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
            <Col md={{ span: 10, offset: 2 }}>{waterUsedLast(120)}</Col>
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
                <th>{tableHeader3}</th>
              </tr>
            </thead>
            <tbody>
              {useThis.map((r, i) => {
                const what = r.distance
                  ? "Distance"
                  : r.state
                  ? r.state
                  : "Voltage";
                //console.log("what=", what)
                //console.log("r.distance",r.distance)
                //Dist column
                const dist = r.distance
                  ? r.distance
                  : r.voltage
                  ? r.voltage
                  : r.runTime
                  ? makeTime(r.runTime)
                  : r.state === "Well running"
                  ? r.state
                  : "-----";
                //console.log("dist=", dist)
                return (
                  <tr key={i} style={getBGColor(r)}>
                    <td key={1}>{what}</td>
                    <td key={2}>{doFormat(r.when)}</td>
                    <td key={3}>{dist}</td>
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
