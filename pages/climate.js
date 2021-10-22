import {
  Container,
  Table,
  Row,
  Col,
  Button,
  Form,
  FormGroup,
  Label,
  CustomInput,
} from "reactstrap";
import useSWR from "swr";
import fetch from "unfetch";
import { format, parseJSON, compareAsc } from "date-fns";
import { useRouter } from "next/router";
import { useState } from "react";
const fetcher = (url) =>
  fetch(url).then((r) =>
    r
      .json()
      .then((d) => {
        let climate = d.climateDocs.map((d) => {
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
function doFormat(theDate) {
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
  function hiLowHumidity(where, theData) {
    const max = theData
      .filter((d) => d.name === where)
      .reduce(
        (prev, current) => (prev.humidity > current.humidity ? prev : current),
        { humidity: 0 }
      ).humidity;
    const min = theData
      .filter((d) => d.name === where)
      .reduce(
        (prev, current) => (prev.humidity < current.humidity ? prev : current),
        { humidity: 100 }
      ).humidity;

    return (
      <h5>
        {where === "home" ? "Home" : where} Humidty high - {max} low - {min}
      </h5>
    );
  }
  function hiLowtemp(where, theData) {
    const max = theData
      .filter((d) => d.name === where)
      .reduce(
        (prev, current) =>
          prev.temperature > current.temperature ? prev : current,
        { temperature: 0 }
      ).temperature;
    const min = theData
      .filter((d) => d.name === where)
      .reduce(
        (prev, current) =>
          prev.temperature < current.temperature ? prev : current,
        { temperature: 200 }
      ).temperature;

    return (
      <h5>
        {where === "home" ? "Home" : where} Temperature high - {max} low - {min}
      </h5>
    );
  }
  const onRadio = (event) => {
    console.log("what to show", event.target.value);
    setDataToUse(event.target.id);
    //setWhere(event.target.value);
  };
  const onCheck = (event) => {
    console.log("what", event.target.id, event.target.checked);
    if (event.target.checked)
      switch (event.target.id) {
        case "crawl":
          where === "home" ? setWhere("both") : setWhere("crawl");
          break;
        case "home":
          where === "crawl" ? setWhere("both") : setWhere("home");
          break;
      }
    else
      switch (event.target.id) {
        case "crawl":
          where === "crawl" && setWhere("both");
          where === "both" && setWhere("home");
          break;
        case "home":
          where === "home" && setWhere("both");
          where === "both" && setWhere("crawl");
          break;
      }
  };
  let useThis = data;

  if (dataToUse === "24") {
    const back = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    // is the db when after 24 hours ago
    useThis = data.filter((d) => compareAsc(d.when, back) === 1);
  }
  if (dataToUse === "3") {
    const back = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    useThis = data.filter((d) => compareAsc(d.when, back) === 1);
  }
  // table data rows
  let rows = [];

  if (data && data.length > 0) {
    if (where === "home") useThis = useThis.filter((x) => x.name === "home");
    if (where === "crawl") useThis = useThis.filter((x) => x.name === "Crawl Space");
    useThis.map((r, i) => {
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
                id="24"
                name="24"
                label="Last 24 hours"
                inline
                onChange={onRadio}
                checked={dataToUse === "24"}
              />
              <CustomInput
                type="radio"
                id="3"
                name="3"
                label="Last 3 days"
                inline
                onChange={onRadio}
                checked={dataToUse === "3"}
              />
              <CustomInput
                type="checkbox"
                id="crawl"
                name="crawl"
                label="Crawl"
                inline
                onChange={onCheck}
                checked={where === "crawl" || where === "both"}
              />
              <CustomInput
                type="checkbox"
                id="home"
                name="home"
                label="Home"
                inline
                onChange={onCheck}
                checked={where === "home" || where === "both"}
              />
            </div>
          </FormGroup>
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
      <h3 className="text-center">Data only available on local Ubuntu!</h3>

      <Button variant="link" onClick={() => router.push("/")}>
        Back to Well
      </Button>
    </Container>
  );
}

export default Climate;
