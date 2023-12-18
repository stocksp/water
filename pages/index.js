import Head from "next/head"
import Header from "components/header"
import useSWR from "swr"
import fetcher from "libs/fetcher"
import { useRouter } from "next/router"
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Form from "react-bootstrap/Form"
import Table from "react-bootstrap/Table"

import { format, differenceInMinutes, differenceInHours, isAfter } from "date-fns"

import { useState } from "react"
import Link from "next/link"
import isWithinInterval from "date-fns/isWithinInterval/index"
import History from "../components/history"

function doFormat(theDate) {
  return format(theDate, "MMM d, h:mm:ss a")
}
function makeTime(seconds) {
  return (seconds / 60).toFixed(1) + " mins"
}

export default function Home() {
  const router = useRouter()
  const [dataToUse, setDataToUse] = useState("all")
  // for well report
  let groups = []

  const { data } = useSWR("/api/getData", fetcher, { refreshInterval: 15000 })
  if (data) {
    console.log("we have data: docs", data.length, data[0])
  } else {
    console.log("no data")
  }
  function currentDistance() {
    if(!data.distance) return 0
    return data.find((v) => v.distance).distance
  }
  function isWellrunning() {
    const resp = data.find((v) => v.state === "Well running")
    if (resp) {
      return (
        <h4 style={{ backgroundColor: "rgba(255, 99, 71, 0.5)" }}>
          Well pump is on... started {format(resp.when, "h:mm:ss a")}
        </h4>
      )
    }
    return ""
  }
  function isPressurerunning() {
    const resp = data.find((v) => v.state === "Pressure running")
    if (resp) {
      return (
        <h4 style={{ backgroundColor: "rgba(173, 175, 204)" }}>
          Pressure pump is on... started {format(resp.when, "h:mm:ss a")}
        </h4>
      )
    }
    return ""
  }
  function waterUsedLast(minutes) {
    const dists = data
      .filter((v) => v.distance && differenceInMinutes(new Date(), v.when) <= minutes)
      .map((v) => v.distance)
    if (dists) {
      let max = Math.max(...dists)
      let min = Math.min(...dists)
      max = max === Infinity || max === -Infinity ? 0 : max
      min = min === Infinity || min === -Infinity ? 0 : min
      if (minutes === 120 && Math.abs(max - min) <= 0.1) return ""
      const dir = dists[0] > dists[dists.length - 1] ? "used" : "gained"
      //console.log("max", max, "min", min);
      return (
        <h5>
          Water {dir} last {minutes} mins {((max - min) * 70).toFixed(1)} gals{" "}
          {(max - min).toFixed(1)} - inches
        </h5>
      )
    }
    return ""
  }
  const getBGColor = (data) => {
    //console.log("dataTouse", dataToUse);
    if (dataToUse === "well" || dataToUse === "pressure") return {}
    switch (data.pump) {
      case "well":
        return { backgroundColor: "rgba(255, 99, 71, 0.5)" }
      case "pressure":
        return { backgroundColor: "rgb(173, 175, 204)" }
      default:
        return {}
    }
  }
  const onRadio = (event) => {
    console.log("what to show", event.target.value)
    setDataToUse(event.target.id)
    //setWhere(event.target.value);
  }

  const getDistVal = (date, arr) => {
    const dists = arr.filter((x) => x.distance)
    let val = dists.find((d) => d.when.getTime() < date.getTime())
    return val ? val.distance : 0
  }

  let useThis
  let tableHeader3 = "Dist/ Time"
  if (dataToUse === "all") {
    useThis = data ? data.filter((d) => (d.voltage ? false : true)) : data
  }
  if (dataToUse === "well") {
    useThis = data.filter((d) => d.pump === "well")
    tableHeader3 = "Time"
  }
  if (dataToUse === "pressure") {
    useThis = data.filter((d) => d.pump === "pressure")
    tableHeader3 = "Time"
  }

  if (dataToUse === "climate") {
    router.push("/climate")
    return null
  }
  if (dataToUse === "voltage") {
    useThis = data.filter((d) => (d.voltage ? true : false))
  }
  // table data rows
  let rows = []
  let wellRunTimeData = []
  if (data && data.length > 0)
    useThis.map((r, i) => {
      const what = r.distance ? "Distance" : r.state ? r.state : "Voltage"
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
              : "-----"
      //console.log("dist=", dist)
      rows.push(
        <tr key={i} style={getBGColor(r)}>
          <td key={1}>{what}</td>
          <td key={2}>{doFormat(r.when)}</td>
          <td key={3}>{dist}</td>
        </tr>
      )
      if (dataToUse === "well") {
        wellRunTimeData.push({ what, when: r.when, dist })
        //console.table(wellRunTimeData);
      }
    })
  // produce well report
  if (wellRunTimeData.length) {
    let group = []
    wellRunTimeData.reverse().forEach((v, i, arr) => {
      if (!group.length) {
        if (v.what === "Well starting") group.push(v)
      } else {
        if (v.what === "Well starting") {
          // we changed the well pump resting time on 7,18,2021
          // from less than 30 minutes to 190 plus
          const pumpSpan = 210
          console.log("span", pumpSpan)
          const previous = group[group.length - 1]
          const diff = differenceInMinutes(v.when, previous.when)
          if (diff < pumpSpan + parseFloat(previous.dist)) {
            group.push(v)
          } else {
            groups.push(group)
            group = []
            group.push(v)
          }
        }

        if (v.what === "Well ran") {
          group.push(v)
        }
      }
    })
    // add last one
    groups.push(group)
    groups.reverse()
    console.log("groups before", groups)
    //const distData = data.filter((d) => d.dist);
    groups = groups.map((v, i, arr) => {
      let time = v
        .filter((o) => o.what === "Well ran")
        .reduce((a, b) => {
          return a + parseFloat(b.dist)
        }, 0)
      time = Math.round(time * 10) / 10
      console.log("time", time)
      // frags = "49.0,9.8,7.4,1.2"
      const frags = v
        .filter((o) => o.what === "Well ran")
        .reduce((a, b) => {
          return a + b.dist.split(" ")[0] + "+"
        }, "")
        .slice(0, -1)
      const distStr = `${getDistVal(v[0].when, data)}-${getDistVal(v[v.length - 1].when, data)}`
      console.log(
        "frags",
        frags,
        "start time",
        getDistVal(v[0].when, data),
        getDistVal(v[v.length - 1].when, data)
      )
      const sinceLastPump =
        i < arr.length - 1
          ? differenceInHours(v[0].when, arr[i + 1][arr[i + 1].length - 1].when)
          : 0
      return {
        time,
        frags,
        sinceLastPump,
        when: v[v.length - 1].when,
        dists: distStr,
      }
    })
    console.log("groups", groups)
  }
  return (
    <div>
      <Head>
        <title>Water Report</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes"></meta>
      </Head>
      <Header />
      {data && data.length > 0 ? (
        <Container>
          <Form>
            <div key="inline-radio" className="mb-3">
              <Form.Label>What to Show! &nbsp;</Form.Label>
              <Form.Check
                inline
                label="All"
                name="all"
                type="radio"
                id="all"
                onChange={onRadio}
                checked={dataToUse === "all"}
              />
              <Form.Check
                inline
                label="well"
                name="well"
                type="radio"
                id="well"
                onChange={onRadio}
                checked={dataToUse === "well"}
              />
              <Form.Check
                inline
                label="pressure"
                name="pressure"
                type="radio"
                id="pressure"
                onChange={onRadio}
                checked={dataToUse === "pressure"}
              />
              <Form.Check
                inline
                label="voltage"
                name="voltage"
                type="radio"
                id="voltage"
                onChange={onRadio}
                checked={dataToUse === "voltage"}
              />
              <Form.Check
                inline
                label="climate"
                name="climate"
                type="radio"
                id="climate"
                onChange={onRadio}
                checked={dataToUse === "climate"}
              />
            </div>
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
          {groups.length > 0 ? (
            <>
              <h3 className="text-center">Pumping Stats</h3>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Fragments</th>
                    <th>start-end</th>
                    <th>Hours since last pump</th>
                    <th>When ended</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((r, i) => {
                    return (
                      <tr key={i} style={getBGColor(r)}>
                        <td key={1}>{r.time}</td>
                        <td key={2}>{r.frags}</td>
                        <td key={3}>{r.dists}</td>
                        <td key={4}>{r.sinceLastPump}</td>
                        <td key={5}>{doFormat(r.when)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </>
          ) : null}
          {dataToUse === "well" ? (
            <History />
          ) : (
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>What</th>
                  <th>When</th>
                  <th>{tableHeader3}</th>
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </Table>
          )}
        </Container>
      ) : (
        <div> NO Data </div>
      )}
    </div>
  )
}
