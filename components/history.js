import { useEffect, useState } from "react";
import fetch from "unfetch";
import useSWR from "swr";
import { Table } from "reactstrap";
import { format } from "date-fns";

const fetcher = (url) => fetch(url).then((r) => r.json());
function doFormat(theDate) {
  return format(new Date(theDate), "MMM d, h:mm:ss a");
}

const useStateWithLocalStorage = (localStorageKey) => {
  const [value, setValue] = useState(
    localStorage.getItem(localStorageKey) || ""
  );

  useEffect(() => {
    localStorage.setItem(localStorageKey, value);
  }, [value]);

  return [value, setValue];
};

const History = () => {
  const [wellHistory, setWellHistory] = useStateWithLocalStorage("wellHistory");
  const hist = wellHistory ? JSON.parse(wellHistory) : "";
  // conditionally fetch
  const { data } = useSWR(!hist ? "/api/getPumpHistory" : null, fetcher);
  if (!data && !hist) {
    console.log("No history should be fetching");
  } else if (data && !hist) {
    console.log("setting local storage we have data");
    setWellHistory(JSON.stringify(data));
    //console.log(JSON.parse(wellHistory));
  } else if (hist) {
    console.log(hist);
  }
  if (hist) {
    //const theData = JSON.parse(wellHistory);
    console.log(`We have ${hist.fillSessions.length} pieces of history`);
    return (
      <>
        <h3 className="text-center">Pumping Stats HIstory</h3>
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
            {hist.fillSessions.map((r, i) => {
              return (
                <tr key={i}>
                  <td key={1}>{r.time}</td>
                  <td key={2}>{r.frags}</td>
                  <td key={3}>{r.dists}</td>
                  <td key={4}>{r.sinceLastPump}</td>
                  <td key={5}>{doFormat(r.when)}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </>
    );
  } else {
    return <h3>Waiting on History</h3>;
  }
};

export default History;
