let db;

// Inicialização do banco de dados IndexedDB
const request = indexedDB.open("controleEstoqueDB", 1);

request.onupgradeneeded = function (e) {
  db = e.target.result;
  if (!db.objectStoreNames.contains("prateleira")) {
    db.createObjectStore("prateleira", { keyPath: "id", autoIncrement: true });
  }
};

request.onsuccess = function (e) {
  db = e.target.result;
  carregarPrateleira();
};

// Navegação entre páginas do aplicativo
function abrirPagina(idPagina) {
  document.querySelectorAll(".pagina").forEach((p) => p.classList.remove("ativa"));
  const paginaAlvo = document.getElementById(idPagina);
  if (paginaAlvo) paginaAlvo.classList.add("ativa");

  if (idPagina === "paginaPrateleira") {
    carregarPrateleira();
  }
}

// Formatação de data YYYY-MM-DD para DD/MM/AAAA
function formatarDataBR(dataISO) {
  if (!dataISO) return "";
  const partes = dataISO.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Cálculo da diferença de dias até a data de validade
function calcularDiasValidade(dataISO) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const partes = dataISO.split("-");
  const validade = new Date(partes[0], partes[1] - 1, partes[2]);
  validade.setHours(0, 0, 0, 0);

  const diffMs = validade.getTime() - hoje.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// Gera o estilo CSS da barra lateral multicolorida (gradiente nítido)
function gerarEstiloGradiente(itens) {
  let temVermelho = false;
  let temAmarelo = false;
  let temBranco = false;

  itens.forEach((item) => {
    const dias = calcularDiasValidade(item.validade);
    if (dias <= 7) {
      temVermelho = true;
    } else if (dias <= 30) {
      temAmarelo = true;
    } else {
      temBranco = true;
    }
  });

  const cores = [];
  if (temBranco) cores.push('#ffffff');
  if (temAmarelo) cores.push('#f1c40f');
  if (temVermelho) cores.push('#e74c3c');

  if (cores.length === 1) {
    const corUnica = cores[0] === '#ffffff' ? '#e2e8f0' : cores[0];
    return `background-color: ${corUnica};`;
  }

  const percentual = 100 / cores.length;
  const paradas = [];
  cores.forEach((cor, idx) => {
    const inicio = (idx * percentual).toFixed(2);
    const fim = ((idx + 1) * percentual).toFixed(2);
    paradas.push(`${cor} ${inicio}% ${fim}%`);
  });

  return `background: linear-gradient(to bottom, ${paradas.join(', ')});`;
}

// Carrega e renderiza os produtos na Prateleira em ordem alfabética
function carregarPrateleira() {
  const lista = document.getElementById("listaPrateleira");
  if (!lista) return;
  lista.innerHTML = "";

  const tx = db.transaction("prateleira", "readonly");
  const store = tx.objectStore("prateleira");
  const produtosAgrupados = {};

  store.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      const p = cursor.value;
      const nomeChave = p.nome.trim().toUpperCase();

      if (!produtosAgrupados[nomeChave]) {
        produtosAgrupados[nomeChave] = {
          nomeExibicao: p.nome.trim(),
          itens: []
        };
      }
      produtosAgrupados[nomeChave].itens.push(p);
      cursor.continue();
    } else {
      const nomesOrdenados = Object.keys(produtosAgrupados).sort();

      nomesOrdenados.forEach((chave) => {
        const prod = produtosAgrupados[chave];

        const card = document.createElement("div");
        card.className = "card-produto";

        const faixaIndicadora = document.createElement("div");
        faixaIndicadora.className = "indicador-lateral";
        faixaIndicadora.style.cssText = gerarEstiloGradiente(prod.itens);

        const conteudoCard = document.createElement("div");
        conteudoCard.className = "conteudo-card";

        const header = document.createElement("div");
        header.className = "card-produto-header";
        header.innerHTML = `<span>${prod.nomeExibicao}</span> <span>▼</span>`;

        const detalhes = document.createElement("div");
        detalhes.className = "detalhes-produto";

        prod.itens.sort((a, b) => new Date(a.validade) - new Date(b.validade));

        prod.itens.forEach((item) => {
          const dias = calcularDiasValidade(item.validade);
          let tagClasse = "vencendo-ok";
          let textoStatus = `${dias} dias restantes`;

          if (dias < 0) {
            tagClasse = "vencendo-vermelho";
            textoStatus = `VENCIDO (${Math.abs(dias)} dias)`;
          } else if (dias <= 7) {
            tagClasse = "vencendo-vermelho";
          } else if (dias <= 30) {
            tagClasse = "vencendo-amarelo";
          }

          const linha = document.createElement("div");
          linha.className = `linha-validade ${tagClasse}`;
          linha.innerHTML = `<span>Validade: ${formatarDataBR(item.validade)}</span> <span>${textoStatus}</span>`;
          detalhes.appendChild(linha);
        });

        header.onclick = function () {
          const visivel = detalhes.style.display === "block";
          detalhes.style.display = visivel ? "none" : "block";
          header.querySelector("span:last-child").innerText = visivel ? "▼" : "▲";
        };

        conteudoCard.appendChild(header);
        conteudoCard.appendChild(detalhes);

        card.appendChild(faixaIndicadora);
        card.appendChild(conteudoCard);

        lista.appendChild(card);
      });
    }
  };
}

// Filtragem em tempo real na barra de pesquisa da prateleira
function filtrarPrateleira() {
  const termo = document.getElementById("campoPesquisaPrateleira").value.toLowerCase();
  const cards = document.querySelectorAll("#listaPrateleira .card-produto");

  cards.forEach((card) => {
    const nome = card.querySelector(".card-produto-header").innerText.toLowerCase();
    card.style.display = nome.includes(termo) ? "flex" : "none";
  });
}

// Alterna entre os formulários de Adicionar e Remover
function mudarAbaGerenciar(aba) {
  document.getElementById("btnAbaAdd").classList.toggle("ativa", aba === "add");
  document.getElementById("btnAbaRem").classList.toggle("ativa", aba === "rem");

  document.getElementById("formAdicionar").style.display = aba === "add" ? "block" : "none";
  document.getElementById("formRemover").style.display = aba === "rem" ? "block" : "none";
}

// Sugestão autocompletar para o campo Adicionar
function sugerirNomeAdicionar() {
  const texto = document.getElementById("nomeAdicionar").value.toLowerCase();
  const caixa = document.getElementById("sugestoesAdicionar");
  caixa.innerHTML = "";

  if (!texto) return;

  const tx = db.transaction("prateleira", "readonly");
  const store = tx.objectStore("prateleira");
  const nomesUnicos = new Set();

  store.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      if (cursor.value.nome.toLowerCase().includes(texto)) {
        nomesUnicos.add(cursor.value.nome);
      }
      cursor.continue();
    } else {
      nomesUnicos.forEach((nome) => {
        const div = document.createElement("div");
        div.className = "sugestao-item";
        div.innerText = nome;
        div.onclick = function () {
          document.getElementById("nomeAdicionar").value = nome;
          caixa.innerHTML = "";
        };
        caixa.appendChild(div);
      });
    }
  };
}

// Adiciona novo produto ou novo lote com data ao banco
function adicionarProduto() {
  const nome = document.getElementById("nomeAdicionar").value.trim();
  const validade = document.getElementById("validadeAdicionar").value;

  if (!nome || !validade) {
    alert("Por favor, preencha o nome e a data de validade.");
    return;
  }

  const tx = db.transaction("prateleira", "readwrite");
  const store = tx.objectStore("prateleira");

  store.add({ nome: nome, validade: validade });

  tx.oncomplete = function () {
    alert("Produto adicionado com sucesso!");
    document.getElementById("nomeAdicionar").value = "";
    document.getElementById("validadeAdicionar").value = "";
    document.getElementById("sugestoesAdicionar").innerHTML = "";
    carregarPrateleira();
  };
}

// Sugestão autocompletar e sincronização do campo Remover
function sugerirNomeRemover() {
  const campoInput = document.getElementById("nomeRemover");
  const texto = campoInput.value.toLowerCase();
  const caixa = document.getElementById("sugestoesRemover");
  caixa.innerHTML = "";

  carregarDatasRemover(campoInput.value);

  if (!texto) return;

  const tx = db.transaction("prateleira", "readonly");
  const store = tx.objectStore("prateleira");
  const nomesUnicos = new Set();

  store.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      if (cursor.value.nome.toLowerCase().includes(texto)) {
        nomesUnicos.add(cursor.value.nome);
      }
      cursor.continue();
    } else {
      nomesUnicos.forEach((nome) => {
        const div = document.createElement("div");
        div.className = "sugestao-item";
        div.innerText = nome;
        div.onclick = function () {
          document.getElementById("nomeRemover").value = nome;
          caixa.innerHTML = "";
          carregarDatasRemover(nome);
        };
        caixa.appendChild(div);
      });
    }
  };
}

// Carrega as datas cadastradas para o produto a ser removido
function carregarDatasRemover(nome) {
  const select = document.getElementById("selectDataRemover");
  if (!select) return;

  select.innerHTML = "";

  if (!nome || !nome.trim()) {
    select.innerHTML = '<option value="">Informe o produto primeiro...</option>';
    select.disabled = true;
    return;
  }

  const tx = db.transaction("prateleira", "readonly");
  const store = tx.objectStore("prateleira");
  const itensEncontrados = [];

  store.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      if (cursor.value.nome.trim().toLowerCase() === nome.trim().toLowerCase()) {
        itensEncontrados.push(cursor.value);
      }
      cursor.continue();
    } else {
      if (itensEncontrados.length === 0) {
        select.innerHTML = '<option value="">Nenhum registro encontrado</option>';
        select.disabled = true;
      } else if (itensEncontrados.length === 1) {
        // Exibe a data do único lote, seleciona o ID automaticamente e bloqueia o campo para clique
        const itemUnico = itensEncontrados[0];
        const op = document.createElement("option");
        op.value = itemUnico.id;
        op.innerText = `Validade: ${formatarDataBR(itemUnico.validade)}`;
        select.appendChild(op);

        select.value = itemUnico.id;
        select.disabled = true;
      } else {
        // Caso existam múltiplas datas, libera para a escolha do usuário
        select.disabled = false;
        const opPadrao = document.createElement("option");
        opPadrao.value = "";
        opPadrao.innerText = "-- Selecione a data a remover --";
        select.appendChild(opPadrao);

        itensEncontrados.sort((a, b) => new Date(a.validade) - new Date(b.validade));

        itensEncontrados.forEach((item) => {
          const op = document.createElement("option");
          op.value = item.id;
          op.innerText = formatarDataBR(item.validade);
          select.appendChild(op);
        });
      }
    }
  };
}

// Confirma e remove o item do banco de dados
function removerProduto() {
  const select = document.getElementById("selectDataRemover");
  const idItem = parseInt(select.value);

  if (!idItem) {
    alert("Selecione um produto e uma data válida para remover.");
    return;
  }

  const tx = db.transaction("prateleira", "readwrite");
  const store = tx.objectStore("prateleira");

  store.delete(idItem);

  tx.oncomplete = function () {
    alert("Item removido com sucesso!");
    document.getElementById("nomeRemover").value = "";
    select.innerHTML = '<option value="">Informe o produto primeiro...</option>';
    select.disabled = true;
    carregarPrateleira();
  };
}

// Relatório impresso / visualização A4 de itens vencidos ou a vencer em 30 dias
function abrirRelatorioA4() {
  const divConteudo = document.getElementById("conteudoRelatorioA4");
  if (!divConteudo) return;
  divConteudo.innerHTML = "";

  const tx = db.transaction("prateleira", "readonly");
  const store = tx.objectStore("prateleira");
  const itensRelatorio = [];

  store.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      const dias = calcularDiasValidade(cursor.value.validade);
      if (dias <= 30) {
        itensRelatorio.push({ ...cursor.value, diasRestantes: dias });
      }
      cursor.continue();
    } else {
      if (itensRelatorio.length === 0) {
        divConteudo.innerHTML = "<p>Nenhum produto próximo do vencimento (dentro de 30 dias).</p>";
      } else {
        itensRelatorio.sort((a, b) => a.diasRestantes - b.diasRestantes);

        const tabela = document.createElement("table");
        tabela.className = "tabela-a4";
        tabela.innerHTML = `
          <thead>
            <tr>
              <th>Produto</th>
              <th>Data de Validade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody></tbody>
        `;

        const tbody = tabela.querySelector("tbody");
        itensRelatorio.forEach((item) => {
          const tr = document.createElement("tr");
          const statusText = item.diasRestantes < 0 
            ? `VENCIDO (${Math.abs(item.diasRestantes)} dias)` 
            : `${item.diasRestantes} dias restantes`;

          tr.innerHTML = `
            <td><b>${item.nome}</b></td>
            <td>${formatarDataBR(item.validade)}</td>
            <td>${statusText}</td>
          `;
          tbody.appendChild(tr);
        });

        divConteudo.appendChild(tabela);
      }
      abrirPagina("paginaRelatorio");
    }
  };
}