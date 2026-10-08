// Užduočių API užklausų šablonai.
// Įrašyk savo serverio adresą ir, jei reikia, pakoreguok kelius bei parametrus.

const API_URL = "https://testapi.io/api/Gytisj/resource/tasklist"; // pvz. "http://localhost:3000/api"

const headers = {
  "Content-Type": "application/json",
  // Authorization: "Bearer TOKEN",
};

//structure of the task: { title, status, deadline }
// GET – gauti visas užduotis
export async function getTasks() {
  const response = await fetch(`${API_URL}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Nepavyko gauti užduočių.");
  }

  return response.json();
}

// POST – įrašyti naują užduotį
// task: { title, status, deadline }
export async function createTask(task) {
  const response = await fetch(`${API_URL}`, {
    method: "POST",
    headers,
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    throw new Error("Nepavyko įrašyti užduoties.");
  }

  return response.json();
}

// PUT – atnaujinti užduotį pagal id
// API reikalauja viso objekto: { title, status, deadline }
export async function updateTask(taskId, task) {
  const response = await fetch(`${API_URL}/${taskId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    throw new Error("Nepavyko atnaujinti užduoties.");
  }

  return response.json();
}

// DELETE – ištrinti užduotį pagal id
export async function deleteTask(taskId) {
  const response = await fetch(`${API_URL}/${taskId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error("Nepavyko ištrinti užduoties.");
  }
}
