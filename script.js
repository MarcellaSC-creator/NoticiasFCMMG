const API_URL = "https://script.google.com/macros/s/AKfycbxvi0Re1-5Ws6U4Xtu-DLpHLqrhyGwS8ZTGhZGX59OvwH5tinKCvBcmZbBmday284R2/exec";

let todasNoticias = [];

async function carregarNoticias() {
  const container = document.getElementById("newsContainer");
  container.innerHTML = "<p>Carregando notícias...</p>";

  try {
    const response = await fetch(API_URL);
    todasNoticias = await response.json();
    renderizarNoticias(todasNoticias);
  } catch (error) {
    container.innerHTML = "<p>Erro ao carregar notícias.</p>";
    console.error(error);
  }
}

function renderizarNoticias(noticias) {
  const container = document.getElementById("newsContainer");

  if (!noticias.length) {
    container.innerHTML = "<p>Nenhuma notícia encontrada.</p>";
    return;
  }

  container.innerHTML = noticias.map(noticia => `
    <article class="news-card">
      <h2>${noticia.titulo}</h2>
      <div class="meta">
        <strong>Fonte:</strong> ${noticia.fonte || "Não identificada"} |
        <strong>Gatilho:</strong> ${noticia.palavraChave || "-"} |
        <strong>Status:</strong> ${noticia.status || "-"}
      </div>
      <a href="${noticia.link}" target="_blank">Acessar notícia</a>
    </article>
  `).join("");
}

document.getElementById("searchInput").addEventListener("input", function () {
  const termo = this.value.toLowerCase();

  const filtradas = todasNoticias.filter(noticia =>
    noticia.titulo?.toLowerCase().includes(termo) ||
    noticia.fonte?.toLowerCase().includes(termo) ||
    noticia.palavraChave?.toLowerCase().includes(termo)
  );

  renderizarNoticias(filtradas);
});

carregarNoticias();
