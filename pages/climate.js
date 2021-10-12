import { Container, Table, Row, Col, Button } from "reactstrap";
import useSWR from "swr";
import fetch from "unfetch";
import { format, parseJSON } from "date-fns";
import { useRouter } from "next/router";
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
  const router = useRouter();
  const { data } = useSWR("/api/getClimate", fetcher, {
    refreshInterval: 10000,
  });
  if (data) {
    console.log("we have data: docs", data.length, data[0]);
  } else {
    console.log("no data");
  }
  function hiLowHumidity() {
    const max = data.reduce((prev, current) =>
      prev > current.humidity ? prev : current.humidity
    );
    const min = data.reduce((prev, current) =>
      prev < current.humidity ? prev : current.humidity
    );

    return (
      <h5>
        Humidty high - {max} low - {min}
      </h5>
    );
  }
  function hiLowtemp() {
    const max = data.reduce((prev, current) =>
      prev > current.temperature ? prev : current.temperature
    );
    const min = data.reduce((prev, current) =>
      prev < current.temperature ? prev : current.temperature
    );

    return (
      <h5>
        Temperature high - {max} low - {min}
      </h5>
    );
  }
  return data && data.length > 0 ? (
    <Container>
      <h1 className="text-center">
        <span className="tinyIcon">🌡</span>
        <span className="mediumIcon">🌡</span>
        🌡Climate Report🌡
        <span className="mediumIcon">🌡</span>
        <span className="tinyIcon">🌡</span>
      </h1>
      <Row>
        <Col md={{ span: 10, offset: 3 }}>{hiLowHumidity()}</Col>
      </Row>
      <Row>
        <Col md={{ span: 10, offset: 3 }}>{hiLowtemp()}</Col>
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
        <tbody>
          {data.map((r, i) => {
            return (
              <tr key={i}>
                <td key={1}>{r.name}</td>
                <td key={2}>{r.temperature}</td>
                <td key={3}>{r.humidity}</td>
                <td key={5}>{doFormat(r.when)}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Container>
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
