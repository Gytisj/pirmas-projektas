// Vartotojų registracijos ir prisijungimo užklausos.
// Vartotojo struktūra: { username, password }

const AUTH_URL = "https://testapi.io/api/Gytisj/resource/auth";

const headers = {
  "Content-Type": "application/json",
};

async function request(url, options) {
  let response;

  try {
    response = await fetch(url, { headers, ...options });
  } catch {
    throw new Error("Nepavyko susisiekti su serveriu.");
  }

  if (!response.ok) {
    throw new Error("Serverio klaida. Bandykite dar kartą.");
  }

  return response.json();
}

async function getUsers() {
  const response = await request(AUTH_URL, { method: "GET" });
  return response.data;
}

// POST – užregistruoti naują vartotoją
export async function registerUser(username, password) {
  const users = await getUsers();

  if (users.some((user) => user.username === username)) {
    throw new Error("Toks vartotojo vardas jau užimtas.");
  }

  return request(AUTH_URL, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

// GET – prisijungti: ieškomas vartotojas su tokiu vardu ir slaptažodžiu
export async function loginUser(username, password) {
  const users = await getUsers();
  const user = users.find(
    (user) => user.username === username && user.password === password,
  );

  if (!user) {
    throw new Error("Neteisingas vartotojo vardas arba slaptažodis.");
  }

  return user;
}
