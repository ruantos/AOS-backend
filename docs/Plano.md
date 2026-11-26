# Plano de implementação — Recife Express

Antes de cada etapa, reler `docs/Escopo.md` e `Skills/AGENTS.md`. Manter mudanças pequenas e registrar o resultado da verificação. O pedido do usuário autoriza testar a aplicação antes de considerá-la funcional; nesta versão, a verificação será manual por HTTP e Postman, sem suíte automatizada.

| Etapa | Implementação | Critério de verificação |
|---|---|---|
| 1. Base | Express, módulos ES, ambiente, inicialização e erros JSON | Servidor inicia; rota inexistente retorna 404; JSON inválido retorna 400; corpo excessivo retorna 413 |
| 2. Persistência | Prisma/PostgreSQL, sete entidades de negócio e sessões, vínculos, índices, valores monetários decimais e migração | Aplicar migração em banco de desenvolvimento; conferir relações, unicidade e persistência |
| 3. Autenticação | Sign up, login, logout, sessão revogável, perfil e conta própria | Exercitar dois usuários por perfil; rejeitar senha inválida, token expirado/revogado e acesso a conta alheia |
| 4. Clientes e produtos | CRUD, propriedade, validações e exclusão lógica | Exercitar CRUD completo; bloquear dados de outro atendente e operações de entregador |
| 5. Pedidos e itens | CRUD, URLs compostas, transações, total, preço histórico e estados | Conferir cálculo, rollback, vínculo ao pai, isolamento e rejeição de produto inativo |
| 6. Entregas | CRUD, atribuição, endereço histórico, estados e histórico transacional | Entregador acessa só suas entregas; transições inválidas falham; conclusão atualiza pedido e histórico |
| 7. Consulta pública | Página com formulário, código aleatório, endpoint com campos permitidos e limite de requisições | Consultar sem login; rejeitar código inexistente; verificar ausência de dados pessoais e limitação |
| 8. Swagger | OpenAPI completo, exemplos, Bearer e interface protegida | Acessar interface e esquema autenticados; executar operações; rejeitar acesso sem sessão |
| 9. Dados e Postman | Seed repetível, dois registros por entidade e relacionamento, coleção e ambiente | Executar seed duas vezes; executar fluxos positivos e negativos com variáveis |
| 10. Publicação e entrega | Vercel, PostgreSQL na nuvem, README, roteiro do vídeo e apresentação | Repetir fluxos no ambiente publicado; conferir links e requisitos implementados |

## Estado atual

Etapa 1 escrita, mas ainda não executada ou considerada funcional: o ambiente disponível não possui `node` nem `npm`. A instalação das dependências, geração do `package-lock.json` e verificação HTTP permanecem pendentes. Não avançar para a etapa 2 antes de verificar a base.

## Verificação manual da etapa 1

1. Disponibilizar Node.js 22 ou superior e npm.
2. Executar `npm install` para instalar dependências e gerar o lockfile.
3. Copiar `.env.example` para `.env` e executar `npm start`.
4. Executar `curl -i http://localhost:3000/inexistente` e conferir 404 com erro JSON.
5. Executar `curl -i -X POST http://localhost:3000/inexistente -H 'Content-Type: application/json' --data '{'` e conferir 400 com `INVALID_JSON`.
6. Enviar JSON válido maior que 100 KB e conferir 413 com `PAYLOAD_TOO_LARGE`.
7. Iniciar com `PORT=abc npm start` e conferir rejeição da configuração.

A etapa 1 não inclui endpoints de negócio. O servidor retorna 404 até a implementação das rotas nas etapas seguintes. Apresentar o resultado de cada etapa antes de iniciar a próxima, conforme `Skills/AGENTS.md`.
