const examples = [
  ["Alunos · listar", "GET", "/api/students"],
  ["Alunos · buscar", "GET", "/api/students/258001"],
  [
    "Alunos · criar",
    "POST",
    "/api/students",
    { ra: 258099, name: "Estudante de teste" },
  ],
  [
    "Alunos · atualizar",
    "PATCH",
    "/api/students/258099",
    { name: "Estudante atualizado" },
  ],
  ["Alunos · excluir", "DELETE", "/api/students/258099"],
  ["Disciplinas · listar", "GET", "/api/courses"],
  ["Disciplinas · buscar", "GET", "/api/courses/13"],
  [
    "Disciplinas · criar",
    "POST",
    "/api/courses",
    { name: "Disciplina de teste REST" },
  ],
  [
    "Disciplinas · atualizar",
    "PATCH",
    "/api/courses/40",
    { name: "Disciplina atualizada" },
  ],
  ["Disciplinas · excluir", "DELETE", "/api/courses/40"],
  ["Matrículas · listar", "GET", "/api/enrollments"],
  ["Matrículas · buscar", "GET", "/api/enrollments/student/258001/course/1"],
  [
    "Matrículas · criar",
    "POST",
    "/api/enrollments",
    { studentRa: 258099, courseId: 13 },
  ],
  [
    "Matrículas · excluir",
    "DELETE",
    "/api/enrollments/student/258099/course/13",
  ],
  [
    "Erro 400 · dados inválidos",
    "POST",
    "/api/students",
    { ra: -1, name: "A" },
  ],
  ["Erro 404 · aluno inexistente", "GET", "/api/students/2147483647"],
  [
    "Erro 409 · matrícula já existente no seed",
    "POST",
    "/api/enrollments",
    { studentRa: 258001, courseId: 1 },
  ],
];
const $ = (id) => document.getElementById(id);
$("base").value =
  location.protocol === "file:" ? "http://localhost:3002" : location.origin;
examples.forEach(([label], index) =>
  $("example").add(new Option(label, index)),
);

function hasBody() {
  return ["POST", "PATCH"].includes($("method").value);
}
function requestUrl() {
  const base = new URL($("base").value);
  if (!["http:", "https:"].includes(base.protocol))
    throw new Error("Use um endereço HTTP ou HTTPS.");
  const path = $("path").value;
  if (!path.startsWith("/api/") && path !== "/api")
    throw new Error("O caminho deve começar com /api/.");
  return new URL(base.href.replace(/\/$/, "") + path).href;
}
function preview() {
  $("body").disabled = !hasBody();
  let url;
  try {
    url = requestUrl();
  } catch {
    url = "(endereço ou caminho inválido)";
  }
  $("request-preview").textContent =
    `${$("method").value} ${url}\nAccept: application/json${hasBody() ? "\nContent-Type: application/json\n\n" + $("body").value : ""}`;
}
function chooseExample() {
  const [, method, path, body] = examples[$("example").value];
  $("method").value = method;
  $("path").value = path;
  $("body").value = body ? JSON.stringify(body, null, 2) : "";
  $("example-hint").textContent = path.includes("/40")
    ? "Troque 40 pelo ID retornado ao criar a disciplina; ele não é garantido."
    : "Os exemplos usam os RAs e IDs do seed. Você pode editar todos os valores antes de enviar.";
  preview();
}
$("example").addEventListener("change", chooseExample);
for (const id of ["base", "method", "path", "body"])
  $(id).addEventListener("input", preview);
$("request-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  let url, body;
  try {
    url = requestUrl();
    if (hasBody()) body = JSON.stringify(JSON.parse($("body").value));
  } catch (error) {
    $("status").className = "status error";
    $("status").textContent = "Requisição não enviada";
    $("response-meta").textContent = error.message;
    $("response-headers").textContent = "—";
    $("response-body").textContent =
      "Corrija o endereço, caminho ou JSON e tente novamente.";
    return;
  }
  const entry = Object.fromEntries(
    ["base", "method", "path", "body"].map((id) => [id, $(id).value]),
  );
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  $("send").disabled = true;
  $("status").className = "status";
  $("status").textContent = "Enviando…";
  $("response-headers").textContent = "—";
  $("response-body").textContent = "Aguardando resposta…";
  $("response-meta").textContent = url;
  const start = performance.now();
  try {
    const response = await fetch(url, {
      method: entry.method,
      headers,
      body,
      signal: AbortSignal.timeout(15000),
    });
    const text = await response.text();
    $("status").className = `status ${response.ok ? "success" : "error"}`;
    $("status").textContent =
      `${response.status} ${response.statusText}`.trim();
    $("response-meta").textContent =
      `${Math.round(performance.now() - start)} ms · ${new TextEncoder().encode(text).length} bytes de corpo · ${response.url}`;
    $("response-headers").textContent =
      Array.from(response.headers, ([name, value]) => `${name}: ${value}`).join(
        "\n",
      ) || "(nenhum header acessível)";
    let formatted = text || "(resposta sem corpo)";
    try {
      formatted = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      /* Mantém respostas que não são JSON. */
    }
    $("response-body").textContent = formatted;
  } catch (error) {
    $("status").className = "status error";
    $("status").textContent = "Falha de conexão";
    $("response-meta").textContent =
      `${Math.round(performance.now() - start)} ms · Sem resposta HTTP disponível`;
    $("response-body").textContent =
      `${error.message}\n\nVerifique se a API está em execução e se o endereço está correto. Use preferencialmente a página servida pelo Compose. Outra origem pode exigir configuração de CORS. O limite de espera é 15 segundos.`;
  } finally {
    $("send").disabled = false;
  }
});
chooseExample();
