# Instruções para agentes — Recife Express

Estas instruções se aplicam ao desenvolvimento do backend do Recife Express neste repositório.

## Fonte de verdade e escopo

- Antes de sugerir implementações, alterações ou novas funcionalidades, leia `Recife_Express_Escopo.md` por inteiro e confira se a proposta está dentro do escopo aprovado.
- Trate o arquivo de escopo como referência principal para regras de negócio, entidades, perfis, tecnologias e limites do projeto.
- O projeto é uma atividade acadêmica de complexidade moderada. Prefira soluções diretas, fáceis de explicar e manter. Não adicione abstrações ou dependências sem necessidade clara.
- O repositório contém somente o backend. O aplicativo em React Native está fora do escopo; implemente apenas os contratos da API necessários para uma futura integração.
- Se uma solicitação parecer mudar o escopo ou contradizer o documento, explique a diferença e peça autorização antes de implementar a mudança.

## Trabalho por etapas e autorização

- Desenvolva uma funcionalidade por etapas pequenas e revisáveis.
- Antes de começar a implementar cada funcionalidade ou etapa funcional, apresente um plano curto com o comportamento previsto, as principais alterações e eventuais decisões pendentes. Aguarde autorização explícita do usuário antes de escrever a implementação.
- Não interprete autorização para uma etapa como autorização para funcionalidades adicionais, integrações ou mudanças de escopo.
- Se o pedido já autorizar explicitamente a implementação de uma funcionalidade específica, trabalhe apenas nessa funcionalidade e nas alterações necessárias para concluí-la; peça autorização antes de avançar para outra etapa funcional.
- Não deixe uma implementação parcialmente iniciada enquanto aguarda autorização. É permitido fazer leitura do repositório e análise sem alterar arquivos.

## Restrições de implementação

- Não escreva comentários no código-fonte. Isso inclui comentários de linha, de bloco e comentários de documentação. Prefira nomes claros e código simples.
- Não desenvolva testes de software. Não crie testes unitários, de integração, end-to-end, fixtures de teste ou configuração específica para testes.
- Não execute tarefas de teste (`test`, `verify` ou equivalentes). Se uma validação for necessária, peça autorização antes e descreva exatamente o que pretende executar. Não chame uma tarefa de build de teste.
- Não faça commits, não crie tags e não envie alterações ao repositório remoto, a menos que o usuário peça explicitamente.
- Não inclua segredos, senhas, tokens ou credenciais em arquivos versionados. Use variáveis de ambiente conforme o escopo.
- Não implemente recursos fora do escopo da primeira versão sem autorização, como GPS em tempo real, otimização de rotas, pagamentos, notificações externas, aplicativo React Native ou cadastro público de usuários.

## Convenções técnicas

- Siga a stack definida em `Recife_Express_Escopo.md`: Node.js com JavaScript, Express, npm, Prisma e PostgreSQL. Não use Java, ferramentas do ecossistema Java ou convenções específicas de Java.
- Mantenha a organização simples definida no escopo (`config`, `controllers`, `middlewares`, `routes`, `services` e `validators`), com o esquema do banco em `prisma/schema.prisma`.
- Coloque regras de negócio nos serviços; mantenha controladores focados em HTTP e o acesso ao banco mediado pelo Prisma.
- Use objetos de entrada e saída adequados para a API; não retorne dados sensíveis, como hash de senha.
- Valide entradas com `express-validator` e trate erros de API em middleware centralizado.
- Preserve as cardinalidades, estados e regras descritas no escopo. Calcule valores no backend e armazene valores históricos necessários, como preço unitário do item do pedido.
- Mantenha alterações proporcionais à funcionalidade autorizada e compatíveis com o nível acadêmico do projeto.

## Conclusão de uma funcionalidade

Ao concluir uma funcionalidade autorizada, responda com um resumo conciso que informe:

1. O que foi implementado.
2. Quais arquivos ou áreas principais foram alterados.
3. Quais decisões ou limitações relevantes permanecem.
4. Se alguma validação foi feita, sem afirmar que testes foram executados quando não foram.

Não inicie a próxima funcionalidade automaticamente. Apresente o próximo passo possível e aguarde autorização.
