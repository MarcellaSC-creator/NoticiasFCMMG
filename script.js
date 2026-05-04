const API_URL =
  "https://script.google.com/macros/s/AKfycbxvi0Re1-5Ws6U4Xtu-DLpHLqrhyGwS8ZTGhZGX59OvwH5tinKCvBcmZbBmday284R2/exec";

let todasNoticias = [];

async function carregarNoticias() {
  const container = document.getElementById("newsContainer");
  container.innerHTML = "<p>Carregando notícias...</p>";

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Erro ao carregar API");
    }

    const data = await response.json();

    todasNoticias = Array.isArray(data) ? data : [];

    ordenarNoticias(todasNoticias);
    renderizarNoticias(todasNoticias);

  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Erro ao carregar notícias.</p>";
  }
}

function renderizarNoticias(noticias) {
  const container = document.getElementById("newsContainer");

  if (!noticias.length) {
    container.innerHTML = "<p>Nenhuma notícia encontrada.</p>";
    return;
  }

  container.innerHTML = noticias.map(n => `
    <article class="news-card">
      <h2>${n.titulo || "Sem título"}</h2>

      <div class="meta">
        <strong>Data:</strong> ${formatarData(n.dataNoticia)}<br>
        <strong>Fonte:</strong> ${n.fonte || "Não identificada"}<br>
        <strong>Gatilho:</strong> ${n.palavraChave || "-"}
      </div>

      ${n.resumo ? `<p>${n.resumo}</p>` : ""}

      <a href="${n.link}" target="_blank">
        Acessar notícia
      </a>
    </article>
  `).join("");
}

function ordenarNoticias(lista) {
  lista.sort((a, b) => {
    return new Date(b.dataNoticia) - new Date(a.dataNoticia);
  });
}

function formatarData(data) {
  if (!data) return "-";

  const d = new Date(data);

  if (isNaN(d)) return data;

  return d.toLocaleDateString("pt-BR");
}

document.getElementById("searchInput").addEventListener("input", function () {
  const termo = this.value.toLowerCase();

  const filtradas = todasNoticias.filter(n =>
    (n.titulo || "").toLowerCase().includes(termo) ||
    (n.fonte || "").toLowerCase().includes(termo) ||
    (n.palavraChave || "").toLowerCase().includes(termo) ||
    (n.resumo || "").toLowerCase().includes(termo)
  );

  ordenarNoticias(filtradas);
  renderizarNoticias(filtradas);
});

carregarNoticias();
