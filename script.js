let db;

let request = indexedDB.open("controleFriosDB", 1);

request.onupgradeneeded = function (e) {
  db = e.target.result;

  db.createObjectStore("estoque", { keyPath: "id", autoIncrement: true });

  db.createObjectStore("freezer", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = function (e) {
  db = e.target.result;

  abrirPagina("menu");

  mostrarEstoque();

  mostrarFreezer();
  
  mostrarConfig();
};

function abrirPagina(p) {
  document.querySelectorAll(".pagina").forEach((pg) => (pg.style.display = "none"));

  document.getElementById(p).style.display = "block";

  if (p === "estoque") mostrarEstoque();

  if (p === "freezer") mostrarFreezer();

  if (p=== "config") mostrarConfig();
}

function formatarData(data) {
  if (!data) return "";

  let partes = data.split("-");

  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// Função para corrigir o bug da data
function corrigirData(data) {
  let d = new Date(data + "T00:00:00");
  return d.toISOString().split("T")[0];
}

function adicionarEstoque() {
  let nome = document.getElementById("nomeProduto").value.trim();

  let quantidade = parseInt(document.getElementById("quantidadeProduto").value);

  let validade = document.getElementById("validadeProduto").value;

  if (!nome || !quantidade || !validade) {
    alert("Preencha todos os campos");

    return;
  }

  let tx = db.transaction("estoque", "readwrite");

  let store = tx.objectStore("estoque");

  let encontrado = false;

  store.openCursor().onsuccess = function (e) {
    let cursor = e.target.result;

    if (cursor) {
      let p = cursor.value;

      if (p.nome === nome && p.validade === validade) {
        p.quantidade += quantidade;

        store.put(p);

        encontrado = true;
      }

      cursor.continue();
    } else {
      if (!encontrado) {
        store.add({
          nome: nome,
          quantidade: quantidade,
          validade: validade,
        });
      }
    }
  };

  tx.oncomplete = function () {
    mostrarEstoque();
  };
}

function mostrarEstoque() {
  let lista = document.getElementById("listaEstoque");

  lista.innerHTML = "";

  let tx = db.transaction("estoque", "readonly");

  let store = tx.objectStore("estoque");

  let produtos = {};

  store.openCursor().onsuccess = function (e) {
    let cursor = e.target.result;

    if (cursor) {
      let p = cursor.value;

      if (!produtos[p.nome]) {
        produtos[p.nome] = {
          nome: p.nome,
          total: 0,
          datas: [],
        };
      }

      produtos[p.nome].total += p.quantidade;

      produtos[p.nome].datas.push(p);

      cursor.continue();
    } else {
      Object.values(produtos).forEach((prod) => {
        let div = document.createElement("div");

        div.className = "produto";

        let titulo = document.createElement("div");

        titulo.innerHTML =
          "<b>" +
          prod.nome +
          "</b><br>" +
          "Quantidade Total: " +
          prod.total;

        let detalhes = document.createElement("div");

        detalhes.style.display = "none";

        prod.datas.forEach((d) => {
          let linha = document.createElement("div");

          linha.innerHTML =
            "| Quantidade " +
            d.quantidade +
            " | validade " +
            formatarData(d.validade);

          // Adicionar alerta de validade
          let alerta = verificarValidade(d.validade);
          if (alerta === "vencendo20") {
            linha.classList.add("vencendo20");
          } else if (alerta === "vencendo15") {
            linha.classList.add("vencendo15");
          }

          detalhes.appendChild(linha);
        });

        titulo.onclick = function () {
          detalhes.style.display =
            detalhes.style.display === "none" ? "block" : "none";
        };

        div.appendChild(titulo);

        div.appendChild(detalhes);

        lista.appendChild(div);
      });
    }
  };
}

// abrir area editar estoque
function abrirGerenciarEstoque(){

  let area=document.getElementById("areaGerenciarEstoque");
  
  area.style.display=
  area.style.display==="none"?"block":"none";
  
  }
  
  
  // buscar produto estoque
  function buscarProdutoEditarEstoque(){
  
  let texto=document.getElementById("buscarEstoqueEditar").value.toLowerCase();
  
  let div=document.getElementById("sugestoesEditarEstoque");
  
  div.innerHTML="";
  
  let tx=db.transaction("estoque","readonly");
  
  let store=tx.objectStore("estoque");
  
  store.openCursor().onsuccess=function(e){
  
  let cursor=e.target.result;
  
  if(cursor){
  
  let p=cursor.value;
  
  if(p.nome.toLowerCase().includes(texto)){
  
  let s=document.createElement("div");
  
  s.className="sugestao";
  
  s.innerText=p.nome;
  
  s.onclick=function(){
  
  document.getElementById("buscarEstoqueEditar").value=p.nome;
  
  carregarDatasEstoque(p.nome);
  
  div.innerHTML="";
  
  };
  
  div.appendChild(s);
  
  }
  
  cursor.continue();
  
  }
  
  };
  
  }
  
  
  // carregar datas
  function carregarDatasEstoque(nome){
  
  let select=document.getElementById("datasEditarEstoque");
  
  select.innerHTML="";
  
  let tx=db.transaction("estoque","readonly");
  
  let store=tx.objectStore("estoque");
  
  store.openCursor().onsuccess=function(e){
  
  let cursor=e.target.result;
  
  if(cursor){
  
  let p=cursor.value;
  
  if(p.nome===nome){
  
  let op=document.createElement("option");
  
  op.value=p.id;
  
  op.innerText=
  formatarData(p.validade)+" | Qtd "+p.quantidade;
  
  select.appendChild(op);
  
  }
  
  cursor.continue();
  
  }
  
  };
  
  mostrarQuantidadeEstoque();
  
  }
  
  
  // mostrar quantidade atual
  function mostrarQuantidadeEstoque(){
  
  let id=parseInt(document.getElementById("datasEditarEstoque").value);
  
  let tx=db.transaction("estoque","readonly");
  
  let store=tx.objectStore("estoque");
  
  store.get(id).onsuccess=function(e){
  
  let p=e.target.result;
  
  if(!p)return;
  
  document.getElementById("quantidadeAtualEstoque").innerText=
  "Quantidade atual: "+p.quantidade;
  
  };
  
  }
  
  
  // editar quantidade
  function editarEstoque(){
  
  let id=parseInt(document.getElementById("datasEditarEstoque").value);
  
  let nova=parseInt(document.getElementById("novaQuantidadeEstoque").value);
  
  let tx=db.transaction("estoque","readwrite");
  
  let store=tx.objectStore("estoque");
  
  store.get(id).onsuccess=function(e){
  
  let p=e.target.result;
  
  if(!p)return;
  
  if(nova >= 0){
    p.quantidade=nova;
  }
  store.put(p);
  
  };
  
  tx.oncomplete=function(){
  
  mostrarEstoque();
  
  limparCamposEstoque();
  
  };
  
  }
  
  
  // remover estoque
  function removerEstoque(){
  
  let id=parseInt(document.getElementById("datasEditarEstoque").value);
  
  let qtd=parseInt(document.getElementById("quantidadeRemoverEstoque").value);
  
  let tx=db.transaction("estoque","readwrite");
  
  let store=tx.objectStore("estoque");
  
  store.get(id).onsuccess=function(e){
  
  let p=e.target.result;
  
  if(!p)return;
  
  if(qtd>p.quantidade){
  
  alert("Quantidade maior que disponível");
  
  return;
  
  }
  
  p.quantidade-=qtd;
  
  if(p.quantidade<=0){
  
  store.delete(id);
  
  }else{
  
  store.put(p);
  
  }
  
  };
  
  tx.oncomplete=function(){
  
  mostrarEstoque();
  
  limparCamposEstoque();
  
  };
  
  }
  
  // limpar campos
  function limparCamposEstoque(){
  
  document.getElementById("buscarEstoqueEditar").value="";
  
  document.getElementById("datasEditarEstoque").innerHTML="";
  
  document.getElementById("quantidadeAtualEstoque").innerText="";
  
  document.getElementById("novaQuantidadeEstoque").value="";
  
  document.getElementById("quantidadeRemoverEstoque").value="";
  
  }

function verificarValidade(data) {
  let hoje = new Date();
  let validade = new Date(data);
  let diff = (validade - hoje) / (1000 * 60 * 60 * 24);

  if (diff <= 15) return "vencendo15";
  if (diff <= 20) return "vencendo20";
  return "";
}

function buscarProdutoEstoque() {
  let texto = document.getElementById("nomeProduto").value.toLowerCase();

  let div = document.getElementById("sugestoesEstoque");

  div.innerHTML = "";

  let tx = db.transaction("estoque", "readonly");

  let store = tx.objectStore("estoque");

  store.openCursor().onsuccess = function (e) {
    let cursor = e.target.result;

    if (cursor) {
      let p = cursor.value;

      if (p.nome.toLowerCase().includes(texto)) {
        let s = document.createElement("div");

        s.className = "sugestao";

        s.innerText = p.nome;

        s.onclick = function () {
          document.getElementById("nomeProduto").value = p.nome;

          div.innerHTML = "";
        };

        div.appendChild(s);
      }

      cursor.continue();
    }
  };
}

function carregarDatasProduto(nome) {
  let select = document.getElementById("datasProduto");

  select.innerHTML = "";

  let tx = db.transaction("estoque", "readonly");

  let store = tx.objectStore("estoque");

  store.openCursor().onsuccess = function (e) {
    let cursor = e.target.result;

    if (cursor) {
      let p = cursor.value;

      if (p.nome === nome) {
        let op = document.createElement("option");

        op.value = p.id;

        op.innerText = formatarData(p.validade) + " | " + p.quantidade;

        select.appendChild(op);
      }

      cursor.continue();
    }
  };
}

function buscarProdutoFreezer() {
  let texto = document.getElementById("nomeMover").value.toLowerCase();

  let div = document.getElementById("sugestoesFreezer");

  div.innerHTML = "";

  let tx = db.transaction("estoque", "readonly");

  let store = tx.objectStore("estoque");

  store.openCursor().onsuccess = function (e) {
    let cursor = e.target.result;

    if (cursor) {
      let p = cursor.value;

      if (p.nome.toLowerCase().includes(texto)) {
        let s = document.createElement("div");

        s.className = "sugestao";

        s.innerText = p.nome;

        s.onclick = function () {
          document.getElementById("nomeMover").value = p.nome;

          div.innerHTML = "";

          carregarDatasProduto(p.nome);
        };

        div.appendChild(s);
      }

      cursor.continue();
    }
  };
}

function moverParaFreezer() {
  let id = parseInt(document.getElementById("datasProduto").value);

  let qtd = parseInt(document.getElementById("quantidadeMover").value);

  let freezerLetra = document.getElementById("freezerLetra").value;

  let tx = db.transaction(["estoque", "freezer"], "readwrite");

  let estoqueStore = tx.objectStore("estoque");

  let freezerStore = tx.objectStore("freezer");

  estoqueStore.get(id).onsuccess = function (e) {
    let p = e.target.result;

    if (qtd > p.quantidade) {
      alert("Quantidade maior que estoque");

      return;
    }

    let encontrado = false;

    freezerStore.openCursor().onsuccess = function (ev) {
      let cursor = ev.target.result;

      if (cursor) {
        let f = cursor.value;

        if (f.nome === p.nome && f.validade === p.validade && f.freezer === freezerLetra) {
          f.quantidade += qtd;

          freezerStore.put(f);

          encontrado = true;
        }

        cursor.continue();
      } else {
        if (!encontrado) {
          freezerStore.add({
            nome: p.nome,
            quantidade: qtd,
            validade: p.validade,
            freezer: freezerLetra,
          });
        }
      }
    };

    p.quantidade -= qtd;

    if (p.quantidade <= 0) {
      estoqueStore.delete(id);
    } else {
      estoqueStore.put(p);
    }
  };

  tx.oncomplete = function () {
    mostrarEstoque();

    mostrarFreezer();
  };
}

function mostrarFreezer() {
  let lista = document.getElementById("listaFreezer");

  lista.innerHTML = "";

  let tx = db.transaction("freezer", "readonly");

  let store = tx.objectStore("freezer");

  let produtos = {};

  store.openCursor().onsuccess = function (e) {
    let cursor = e.target.result;

    if (cursor) {
      let p = cursor.value;

      let chave = p.nome + "_" + p.freezer;

      if (!produtos[chave]) {
        produtos[chave] = {
          nome: p.nome,
          freezer: p.freezer,
          total: 0,
          datas: [],
        };
      }

      produtos[chave].total += p.quantidade;

      produtos[chave].datas.push(p);

      cursor.continue();
    } else {
      Object.values(produtos).forEach((prod) => {
        let div = document.createElement("div");

        div.className = "item";

        let titulo = document.createElement("div");

        titulo.innerHTML =
          "<b>" +
          prod.nome +
          "</b><br>" +
          "Freezer: " +
          prod.freezer +
          "<br>" +
          "Quantidade Total: " +
          prod.total;

        let detalhes = document.createElement("div");

        detalhes.style.display = "none";

        prod.datas.forEach((d) => {
          let linha = document.createElement("div");

          linha.innerHTML =
            "| Quantidade: " +
            d.quantidade +
            " |  Validade: " +
            formatarData(d.validade);

          let alerta = verificarValidade(d.validade);
          if (alerta === "vencendo20") {
            linha.classList.add("vencendo20");
          } else if (alerta === "vencendo15") {
            linha.classList.add("vencendo15");
          }

          detalhes.appendChild(linha);
        });

        titulo.onclick = function () {
          detalhes.style.display =
            detalhes.style.display === "none" ? "block" : "none";
        };

        div.appendChild(titulo);

        div.appendChild(detalhes);

        lista.appendChild(div);
      });
    }
  };
}
let filtroAtual="ALL";

function mostrarFreezer(filtro="ALL"){

filtroAtual=filtro;

let lista=document.getElementById("listaFreezer");

lista.innerHTML="";

let tx=db.transaction("freezer","readonly");

let store=tx.objectStore("freezer");

let produtos={};

store.openCursor().onsuccess=function(e){

let cursor=e.target.result;

if(cursor){

let p=cursor.value;

if(filtroAtual==="ALL"||p.freezer===filtroAtual){

let chave=p.nome+"_"+p.freezer;

if(!produtos[chave]){

produtos[chave]={

nome:p.nome,

freezer:p.freezer,

total:0,

datas:[]

};

}

produtos[chave].total+=p.quantidade;

produtos[chave].datas.push(p);

}

cursor.continue();

}else{

Object.values(produtos).forEach(prod=>{

let div=document.createElement("div");

div.className="item";

let titulo=document.createElement("div");

titulo.innerHTML=

"<b>"+prod.nome+"</b><br>"+
"Freezer: "+prod.freezer+"<br>"+
"Quantidade Total: "+prod.total;

let detalhes=document.createElement("div");

detalhes.style.display="none";

prod.datas.sort((a,b)=> new Date(a.validade)-new Date(b.validade));

prod.datas.forEach(d=>{

let linha=document.createElement("div");

linha.innerHTML=

"| Quantidade "+d.quantidade+
" | validade "+formatarData(d.validade);

let alerta=verificarValidade(d.validade);

if(alerta==="vencendo20") linha.classList.add("vencendo20");

if(alerta==="vencendo15") linha.classList.add("vencendo15");

detalhes.appendChild(linha);

});

titulo.onclick=function(){

detalhes.style.display=

detalhes.style.display==="none"?"block":"none";

};

div.appendChild(titulo);

div.appendChild(detalhes);

lista.appendChild(div);

});

}

};

}
// ABRIR AREA DE REMOÇÃO
function abrirRemover(){

    let area=document.getElementById("areaRemover");
    
    area.style.display=
    area.style.display==="none"?"block":"none";
    
    }
    
    
    
    // BUSCAR PRODUTO NO FREEZER
    function buscarProdutoRemover(){
    
    let texto=document.getElementById("buscarRemover").value.toLowerCase();
    
    let div=document.getElementById("sugestoesRemover");
    
    div.innerHTML="";
    
    let tx=db.transaction("freezer","readonly");
    
    let store=tx.objectStore("freezer");
    
    store.openCursor().onsuccess=function(e){
    
    let cursor=e.target.result;
    
    if(cursor){
    
    let p=cursor.value;
    
    if(p.nome.toLowerCase().includes(texto)){
    
    let s=document.createElement("div");
    
    s.className="sugestao";
    
    s.innerText=p.nome+" (Freezer "+p.freezer+")";
    
    s.onclick=function(){
    
    document.getElementById("buscarRemover").value=p.nome;
    
    carregarDatasRemover(p.nome);
    
    div.innerHTML="";
    
    };
    
    div.appendChild(s);
    
    }
    
    cursor.continue();
    
    }
    
    };
    
    }
    
    
    
    // CARREGAR DATAS DO PRODUTO
    function carregarDatasRemover(nome){
    
    let select=document.getElementById("datasRemover");
    
    select.innerHTML="";
    
    let tx=db.transaction("freezer","readonly");
    
    let store=tx.objectStore("freezer");
    
    store.openCursor().onsuccess=function(e){
    
    let cursor=e.target.result;
    
    if(cursor){
    
    let p=cursor.value;
    
    if(p.nome===nome){
    
    let op=document.createElement("option");
    
    op.value=p.id;
    
    op.innerText=
    
    "Freezer "+p.freezer+
    " | "+formatarData(p.validade)+
    " | Qtd "+p.quantidade;
    
    select.appendChild(op);
    
    }
    
    cursor.continue();
    
    }
    
    };
    
    }
    
    // REMOVER DO FREEZER
  function confirmarRemocao(){
  
  let id=parseInt(document.getElementById("datasRemover").value);
  
  let qtd=parseInt(document.getElementById("quantidadeRemover").value);
  
  let tx=db.transaction("freezer","readwrite");
  
  let store=tx.objectStore("freezer");
  
  store.get(id).onsuccess=function(e){
  
  let p=e.target.result;
  
  if(!p) return;
  
  if(qtd>p.quantidade){
  
  alert("Quantidade maior que disponível");
  
  return;
  
  }
    
p.quantidade-=qtd;

if(p.quantidade<=0){

  store.delete(id);

}else{

  store.put(p);

}

};

tx.oncomplete=function(){

  mostrarFreezer();

};

}