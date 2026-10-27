(() => {
  "use strict";
 
  const formulario = document.getElementById("cadastroForm");
  const mensagem = document.getElementById("mensagem");
  const botao = document.getElementById("botaoCadastro");
 
  if (!formulario || !mensagem || !botao) return;
 
  function informar(texto, tipo = "error") {
    mensagem.textContent = texto;
    mensagem.className = "form-message" + (tipo ? " " + tipo : "");
  }
 
  const valor = (id) => (document.getElementById(id)?.value ?? "").trim();
 
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    informar("");
 
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;
 
    if (senha.length < 6) {
      informar("Sua senha precisa ter pelo menos 6 caracteres.");
      document.getElementById("senha").focus();
      return;
    }
 
    if (senha !== confirmarSenha) {
      informar("As senhas não coincidem. Confira os dois campos.");
      document.getElementById("confirmarSenha").focus();
      return;
    }
 
    const totalTexto = valor("hectaresTotal");
    const plantadosTexto = valor("hectaresPlantados");
    const total = totalTexto === "" ? null : Number(totalTexto);
    const plantados = plantadosTexto === "" ? null : Number(plantadosTexto);
 
    if (total !== null && (!Number.isFinite(total) || total < 0)) {
      informar("A área total deve ser um número igual ou maior que zero.");
      return;
    }
 
    if (plantados !== null && (!Number.isFinite(plantados) || plantados < 0)) {
      informar("A área plantada deve ser um número igual ou maior que zero.");
      return;
    }
 
    if (total !== null && plantados !== null && plantados > total) {
      informar("A área plantada não pode ser maior que a área total.");
      return;
    }
 
    const dados = {
      acao: "cadastro",
      nome: valor("nome"),
      email: valor("email").toLowerCase(),
      telefone: valor("telefone"),
      senha,
      nome_fazenda: valor("nomeFazenda"),
      endereco: valor("enderecoRural"),
      cidade: valor("cidade"),
      estado: valor("estado"),
      hectares_total: totalTexto,
      hectares_plantados: plantadosTexto,
      cultura_principal: valor("culturaPrincipal"),
      outras_culturas: valor("outrasCulturas"),
      epoca_plantio: valor("epocaPlantio"),
      irrigacao: valor("irrigacao"),
      observacoes: valor("observacoes")
    };
 
    botao.disabled = true;
    botao.innerHTML = 'Criando sua conta <span>…</span>';
 
    try {
      const resposta = await fetch("api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
      });
 
      const texto = await resposta.text();
      let resultado;
 
      try {
        resultado = JSON.parse(texto);
      } catch (e) {
        console.error("Resposta inesperada do servidor:", texto);
        throw new Error("O servidor não respondeu como esperado. Abra o site por http://localhost (PHP), não direto pelo arquivo.");
      }
 
      if (!resultado.sucesso) {
        informar(resultado.mensagem || "Não foi possível concluir o cadastro.");
        return;
      }
 
      informar("Conta criada com sucesso! Redirecionando...", "success");
      window.setTimeout(() => { window.location.href = "dashboard.html"; }, 900);
 
    } catch (erro) {
      console.error("Erro no cadastro:", erro);
      informar(erro.message || "Não foi possível concluir o cadastro. Confira sua conexão.");
    } finally {
      botao.disabled = false;
      botao.innerHTML = 'Criar minha conta <span>→</span>';
    }
  });
})();