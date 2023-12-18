import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Form from "react-bootstrap/Form"
import Table from "react-bootstrap/Table"
import Button from "react-bootstrap/Button"
import useSWR from "swr";

import { format, parseJSON, compareAsc } from "date-fns";
import { useRouter } from "next/router";
import { useState } from "react";
const fetcher = (url: any) =>
  fetch(url).then((r) =>
    r
      .json()
      .then((d) => {
        let climate = d.climateDocs.map((d: any) => {
          d.when = parseJSON(d.when);
          return d;
        });
        console.log("climate docs", climate.length);
        return climate;
      })
      .catch(function (e) {
        console.error(e); // "oh, no!"
      })
  );
function doFormat(theDate: any) {
  return format(theDate, "MMM d, h:mm:ss a");
}

function Climate() {
  const [dataToUse, setDataToUse] = useState("all");
  const [where, setWhere] = useState("both");
  const router = useRouter();
  const { data } = useSWR("/api/getClimate", fetcher, {
    refreshInterval: 10000,
  });
  if (data) {
    console.log("we have data: docs", data.length, data[0]), data;
  } else {
    console.log("no data");
  }
  function hiLowHumidity(where: any, theData: any) {
    const max = theData
      .filter((d: any) => d.name === where)
      .reduce(
        (prev: any, current: any) => (prev.humidity > current.humidity ? prev : current),
        { humidity: 0 }
      ).humidity;
    const min = theData
      .filter((d: any) => d.name === where)
      .reduce(
        (prev: any, current: any) => (prev.humidity < current.humidity ? prev : current),
        { humidity: 100 }
      ).humidity;

    return (
      <h5>
        {where === "home" ? "Home" : where} Humidty high - {max} low - {min}
      </h5>
    );
  }
  function hiLowtemp(where: any, theData: any) {
    const max = theData
      .filter((d: any) => d.name === where)
      .reduce(
        (prev: any, current: any) =>
          prev.temperature > current.temperature ? prev : current,
        { temperature: 0 }
      ).temperature;
    const min = theData
      .filter((d: any) => d.name === where)
      .reduce(
        (prev: any, current: any) =>
          prev.temperature < current.temperature ? prev : current,
        { temperature: 200 }
      ).temperature;

    return (
      <h5>
        {where === "home" ? "Home" : where} Temperature high - {max} low - {min}
      </h5>
    );
  }
  const onRadio = (event: any) => {
    console.log("what to show", event.target.value);
    setDataToUse(event.target.id);
    //setWhere(event.target.value);
  };
  const onCheck = (event: any) => {
    console.log("what", event.target.id, event.target.checked, where);
    if (event.target.checked)
      switch (event.target.id) {
        case "crawl":
          where === "crawl" ? setWhere("both") : setWhere("crawl");
          break;
        case "outside":
          where === "outside" ? setWhere("both") : setWhere("outside");
          break;
      }
    else
      switch (event.target.id) {
        case "crawl":
          where === "crawl" && setWhere("both");
          where === "both" && setWhere("crawl");
          break;
        case "outside":
          where === "outside" && setWhere("both");
          where === "both" && setWhere("outside");
          break;
      }
  };
  let useThis = data;

  if (dataToUse === "24") {
    const back = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    // is the db when after 24 hours ago
    useThis = data.filter((d: any) => compareAsc(d.when, back) === 1);
  }
  if (dataToUse === "3") {
    const back = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    useThis = data.filter((d: any) => compareAsc(d.when, back) === 1);
  }
  // table data rows
  let rows: any = [];

  if (data && data.length > 0) {
    if (where === "home") useThis = useThis.filter((x: any) => x.name === "home");
    if (where === "crawl") useThis = useThis.filter((x: any) => x.name === "Crawl Space");
    useThis.map((r: any, i: any) => {
      rows.push(
        <tr key={i}>
          <td key={1}>{r.name}</td>
          <td key={2}>{r.temperature}</td>
          <td key={3}>{r.humidity}</td>
          <td key={5}>{doFormat(r.when)}</td>
        </tr>
      );
    });
  }
  return data && data.length > 0 ? (
    <div>
      <h1 className="text-center">
        <span className="tinyIcon">🌡</span>
        <span className="mediumIcon">🌡</span>
        🌡Climate Report🌡
        <span className="mediumIcon">🌡</span>
        <span className="tinyIcon">🌡</span>
      </h1>
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
              label="Last 24 hours"
              name="24"
              type="radio"
              id="24"
              onChange={onRadio}
              checked={dataToUse === "24"}
            />
            <Form.Check
              inline
              label="Last 3 days"
              name="3"
              type="radio"
              id="3"
              onChange={onRadio}
              checked={dataToUse === "3"}
            />
            <Form.Check
              inline
              label="Crawl"
              name="crawl"
              type="checkbox"
              id="crawl"
              onChange={onCheck}
              checked={where === "crawl" || where === "both"}
            />
            <Form.Check
              inline
              label="Outside"
              name="outside"
              type="checkbox"
              id="outside"
              onChange={onCheck}
              checked={where === "outside" || where === "both"}
            />
          </div>
        </Form>

        <Row>
          <Col md={{ span: 10, offset: 3 }}>
            {hiLowHumidity("Crawl Space", useThis)}
          </Col>
        </Row>
        <Row>
          <Col md={{ span: 10, offset: 3 }}>
            {hiLowtemp("Crawl Space", useThis)}
          </Col>
        </Row>
        <Row>
          <Col md={{ span: 10, offset: 3 }}>
            {hiLowHumidity("home", useThis)}
          </Col>
        </Row>
        <Row>
          <Col md={{ span: 10, offset: 3 }}>{hiLowtemp("home", useThis)}</Col>
        </Row>
        <Button variant="link" onClick={() => router.push("/")}>
          Back to Well
        </Button>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Where</th>
              <th>Temperature</th>
              <th>Humidity</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      </Container>
    </div>
  ) : (
    <Container>
      <h1 className="text-center">
        <span className="tinyIcon">🌡</span>
        <span className="mediumIcon">🌡</span>
        🌡Climate Report🌡
        <span className="mediumIcon">🌡</span>
        <span className="tinyIcon">🌡</span>
      </h1>

      <Button variant="link" onClick={() => router.push("/")}>
        Back to Well
      </Button>
    </Container>
  );
}

export default Climate;
