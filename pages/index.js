import Head from "next/head";
import Header from "components/header";
import useSWR, { SWRConfig } from "swr";
import fetch from "unfetch";
import { Table, Container } from "react-bootstrap";
import { format, parseJSON } from 'date-fns'

const fetcher = (url) => fetch(url).then((r) => r.json());

function doFormat(theDate) {
  return format(parseJSON(theDate), "MMM d, h:mm:ss a");
}

export default function Home() {
  const { data } = useSWR("/api/getData", fetcher, { refreshInterval: 10000 });
  if (data) {
    console.log("we have data: docs", data.docs.length, data.docs[0]);
  } else {
    console.log("no data");
  }
  return (
    <div>
      <Head>
        <title>Water Report</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      {data ?
        <Container>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>When</th>
                <th>Dist</th>
              </tr>
            </thead>
            <tbody>
              {data.docs.map((r, i) => {
                return (
                  <tr key={i}>
                    <td key={1}>{doFormat(r.when)}</td>
                    <td key={2}>
                      {r.distance}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Container>
        : <div> NO Data </div>}
    </div>
  );
}
