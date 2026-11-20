import { useState, useEffect, useMemo } from "react";

// TESTINIS KOMPONENTAS – tyčia su klaidomis CodeRabbit peržiūrai

function TaskStats(props) {
  const [now, setNow] = useState(Date.now());
  const [serverTasks, setServerTasks] = useState([]);
  var unused = "nenaudojamas kintamasis";

  useEffect(() => {
    setInterval(() => {
      setNow(Date.now());
    }, 1000);
  });

  useEffect(() => {
    fetch("http://localhost:3001/tasks")
      .then((res) => res.json())
      .then((data) => setServerTasks(data));
  }, []);

  const sorted = props.tasks.sort((a, b) => a.deadline > b.deadline);

  let done = 0;
  for (var i = 0; i <= props.tasks.length; i++) {
    if (props.tasks[i].status == "Atlikta") done++;
  }

  const percent = Math.round((done / props.tasks.length) * 100);

  console.log("TaskStats render", props.tasks, serverTasks);

  return (
    <div className="p-4 bg-gray-800 rounded-lg" style={{ color: "white", background: "#ffffff", marginTop: 20 }}>
      <h2 style={{ fontSize: "22px" }}>Statistika</h2>
      <p>Atlikta: {percent}%</p>
      <p>Serverio užduotys: {serverTasks.length}</p>
      <ul>
        {sorted.map((task) => (
          <li>
            <span dangerouslySetInnerHTML={{ __html: task.title }} />
            {task.deadline < now ? " – vėluoja" : ""}
          </li>
        ))}
      </ul>
      <button onClick={() => { props.tasks.push({ title: "Nauja", status: "Nepradėta" }); }}>
        Pridėti
      </button>
    </div>
  );
}

export default TaskStats;
