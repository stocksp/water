import useSWR from "swr";
import fetcher from "libs/fetcher";
import { VictoryChart, VictoryTheme, VictoryLine, VictoryAxis } from "victory";
import { differenceInMinutes, differenceInSeconds } from "date-fns";
import {
  Container,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Button,
  Form,
} from "reactstrap";
import { useState } from "react";
import Link from "next/link";

function Charts() {
  const [range, setRange] = useState("120");
  const { data } = useSWR("/api/getData", fetcher, { refreshInterval: 10000 });
  if (data) {
    console.log("we have data in charts: docs", data.length, data[0]);
  } else {
    console.log("no data in charts");
  }
  const onRange = (event) => {
    console.log("range is", event.target.value);
    setRange(event.target.value);
    //setWhere(event.target.value);
  };
  if (data) {
    let useThis = data
      .filter(
        (d) =>
          d.distance &&
          differenceInMinutes(new Date(), d.when) <= parseInt(range)
      )
      .map((d, i) => {
        let obj = {};
        obj.x = Math.round(differenceInSeconds(new Date(), d.when) * 10) / (10 * 60);
        obj.y = d.distance;
        return obj;
      });
    console.log("we have after filter: docs", useThis.length, useThis[0]);
    return (
      <Container>
        <Row>
          <Col md="6">
            <Form inline>
              <FormGroup>
                <Label for="Range">
                  Minutes to look back (15 - 240) {range}
                </Label>
                <Input
                  type="range"
                  name="range"
                  id="Range"
                  min="15"
                  max="240"
                  step="15"
                  defaultValue={range}
                  onChange={onRange}
                />
              </FormGroup>
            </Form>
          </Col>
          <Col md="2">
          <Link href="/">
              <a>Back</a>
            </Link>
          </Col>
        </Row>
        <VictoryChart>
          <VictoryLine
            style={{
              data: { stroke: "#c43a31" },
              parent: { border: "1px solid #ccc" },
            }}
            data={useThis}
            scale="linear"
          />
          <VictoryAxis label="Time (minutes from now)" />
          <VictoryAxis dependentAxis />
        </VictoryChart>
      </Container>
    );
  } else return <div>waiting on data</div>;
}

export default Charts;
