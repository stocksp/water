import { useEffect, useState } from "react";

import useSWR from "swr";
import { Table } from "reactstrap";
import { format } from "date-fns";
import { useLocalStorage, useLongPress } from "react-use";

const fetcher = (url) => fetch(url).then((r) => r.json());
function doFormat(theDate) {
  return format(new Date(theDate), "MMM d, h:mm:ss a");
}

/* const useStateWithLocalStorage = (localStorageKey) => {
  const [value, setValue] = useState(
    localStorage.getItem(localStorageKey) || ""
  );

  useEffect(() => {
    localStorage.setItem(localStorageKey, value);
  }, [value]);

  return [value, setValue];
}; */

const elideIt = (str) => {
  const frags = str.split("+");
  let retVal = "";
  for (let x = 0; x < 4; x++) {
    retVal += frags[x] + "+";
  }
  retVal += `(${frags.length - 4} more)` + "..." + frags[frags.length - 1];
  return retVal;
};

const History = () => {
  const [wellHistory, setWellHistory, remove] = useLocalStorage("wellHistory");
  const onLongPress = () => {
    console.log("calls callback after long pressing 2000ms");
    remove();
  };
  const longPressEvent = useLongPress(onLongPress, { delay: 2000 });
  //const hist = wellHistory ? JSON.parse(wellHistory) : "";
  // conditionally fetch
  const { data } = useSWR(!wellHistory ? "/api/getPumpHistory" : null, fetcher);
  if (!data && !wellHistory) {
    console.log("No history should be fetching");
  } else if (data && !wellHistory) {
    console.log("setting local storage we have data", data);
    setWellHistory(data);
    //console.log(JSON.parse(wellHistory));
  } else if (wellHistory) {
    // TODO we need to update (setWellHistory) if
    // history is more than a week behind data
    console.log(`well history!: ${wellHistory}`);
  }
  if (wellHistory) {
    //const theData = JSON.parse(wellHistory);
    console.log('well history', wellHistory)
    console.log(`We have ${wellHistory.fillSessions.length} pieces of history`);
    return (
      <>
        <h3 {...longPressEvent} className="text-center">
          Pumping Stats History
        </h3>
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
            {wellHistory.fillSessions.map((r, i) => {
              if (r.frags.length > 30) {
                r.frags = elideIt(r.frags);
              }
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
